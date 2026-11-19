from __future__ import annotations

import json
import logging
import re
from datetime import UTC, datetime
from typing import Any

import httpx
from pydantic import ValidationError
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.enums.estado_atajadero import EstadoAtajadero
from app.enums.indicador_visual import IndicadorVisual
from app.enums.interrupcion_escurrimiento import InterrupcionEscurrimiento
from app.models.atajadero import Atajadero
from app.schemas.asistente import AsistenteResponse

logger = logging.getLogger(__name__)

GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta"
TIMEOUT_GEMINI_SEGUNDOS = 8.0

AVISO_LEGAL = (
    "Borrador generado con asistencia de reglas o IA. No asigna estados, no guarda datos "
    "y requiere confirmación humana del responsable (Decreto-Ley N° 971/1980)."
)

ENCUADRE_TRIAGE = [
    "Ley N° 1.246, Art. 88°: registro de atajaderos laterales y concesión pecuaria.",
    "Ley N° 1.314, Art. 40°: prohibición de atajaderos sobre corrientes de agua.",
    "Decreto-Ley N° 971/1980: debido proceso y notificación antes de cualquier decisión.",
]

SYSTEM_INSTRUCTION = (
    "Eres un copiloto técnico de un prototipo de inventario de atajaderos de Formosa. "
    "Solo redactas borradores basados en el texto o los datos provistos. "
    "Nunca asignas estados definitivos ni afirmas infracciones. "
    "Responde únicamente con JSON válido con las claves: resumen_tecnico (string), "
    "indicadores_sugeridos (lista de valores permitidos), "
    "estado_sugerido (valor permitido o null), "
    "escurrimiento_sugerido (valor permitido o null) y encuadre_normativo (lista de strings)."
)

INDICADORES_PATRONES: list[tuple[IndicadorVisual, re.Pattern[str]]] = [
    (
        IndicadorVisual.CIERRE_TOTAL_SIN_VERTEDERO,
        re.compile(r"(cierre|cerrad|sin vertedero|sin paso|tapad[oa] .*cauce)"),
    ),
    (
        IndicadorVisual.RIESGO_SOBREPASO_BORDE_LIBRE,
        re.compile(r"(sobrepas|borde libre|desbord|rebals|al tope|coronamiento|cresta)"),
    ),
    (
        IndicadorVisual.FILTRACION_TURBIA_TUBIFICACION,
        re.compile(r"(filtra|turbi|barro|tubific)"),
    ),
    (
        IndicadorVisual.GRIETAS_O_BIOPERTURBACION,
        re.compile(r"(griet|fisur|cueva|vizcach|hormig|hundim)"),
    ),
    (
        IndicadorVisual.ALCANTARILLA_OBSTRUIDA,
        re.compile(r"(alcantarill|caño|cano).{0,40}(tapad|obstru|sediment|rama)"),
    ),
]


def _crear_cliente() -> httpx.Client:
    return httpx.Client(timeout=httpx.Timeout(TIMEOUT_GEMINI_SEGUNDOS))


def estructurar_nota_deterministica(texto: str) -> AsistenteResponse:
    t = texto.lower()
    indicadores = [ind for ind, patron in INDICADORES_PATRONES if patron.search(t)]

    escurrimiento = InterrupcionEscurrimiento.A_VERIFICAR
    if re.search(r"(no (corre|pasa)|sin paso|no hay paso|bloque|acumula)", t) or (
        IndicadorVisual.CIERRE_TOTAL_SIN_VERTEDERO in indicadores
    ):
        escurrimiento = InterrupcionEscurrimiento.SI
    elif re.search(r"(corre normal|pasa (bien|normal)|paso libre|vertedero libre)", t):
        escurrimiento = InterrupcionEscurrimiento.NO

    estado: EstadoAtajadero | None = None
    if re.search(r"(colaps|roto|rompi|removid|derrumb)", t):
        estado = EstadoAtajadero.FUERA_DE_SERVICIO
    elif indicadores:
        estado = EstadoAtajadero.CON_DETERIORO
    elif re.search(r"(buen estado|íntegr|integr|sin novedad)", t):
        estado = EstadoAtajadero.OPERATIVO

    limpio = " ".join(texto.split())
    oracion = limpio[:1].upper() + limpio[1:]
    resumen = oracion if oracion.endswith((".", "!", "?")) else f"{oracion}."

    encuadre: list[str] = []
    if escurrimiento is InterrupcionEscurrimiento.SI:
        encuadre.append(
            "Ley N° 1.314, Art. 40°: verificar si la obra está sobre una corriente activa."
        )

    return AsistenteResponse(
        modo_ejecucion="deterministico_offline",
        aviso_legal=AVISO_LEGAL,
        resumen_tecnico=resumen,
        indicadores_sugeridos=indicadores,
        estado_sugerido=estado,
        escurrimiento_sugerido=escurrimiento,
        encuadre_normativo=encuadre,
    )


def resumir_triage_deterministico(db: Session, codigo_unico: str) -> AsistenteResponse:
    atajadero = db.scalar(select(Atajadero).where(Atajadero.codigo_unico == codigo_unico))
    if atajadero is None:
        raise LookupError(codigo_unico)

    historial = list(atajadero.inspecciones)
    if not historial:
        resumen = (
            f"{codigo_unico} no tiene inspecciones presenciales: es un registro preliminar "
            "sin validar."
        )
        indicadores: list[IndicadorVisual] = []
    else:
        ultima = historial[0]
        intervenciones = sum(1 for i in historial if i.tipo_registro == "intervencion")
        dias = (datetime.now(UTC) - _utc(ultima.fecha_inspeccion)).days
        indicadores = [IndicadorVisual(v) for v in ultima.indicadores_visuales]
        resumen = (
            f"{codigo_unico} registra {len(historial)} "
            f"{'registro' if len(historial) == 1 else 'registros'} "
            f"({intervenciones} {'intervención' if intervenciones == 1 else 'intervenciones'}). "
            f"La última lectura en campo fue hace {dias} días, con estado observado "
            f"'{ultima.estado_observado.replace('_', ' ')}' y escurrimiento "
            f"'{ultima.interrumpe_escurrimiento.replace('_', ' ')}'."
        )
        if IndicadorVisual.RIESGO_SOBREPASO_BORDE_LIBRE in indicadores:
            resumen += (
                " Riesgo de sobrepaso: una rotura de este terraplén puede desencadenar "
                "roturas en cascada aguas abajo."
            )
        if IndicadorVisual.ALCANTARILLA_OBSTRUIDA in indicadores:
            resumen += " Alcantarilla obstruida: revisar afectación a la ruta."

    return AsistenteResponse(
        modo_ejecucion="deterministico_offline",
        aviso_legal=AVISO_LEGAL,
        resumen_tecnico=resumen,
        indicadores_sugeridos=indicadores,
        estado_sugerido=None,
        escurrimiento_sugerido=None,
        encuadre_normativo=list(ENCUADRE_TRIAGE),
    )


def _utc(valor: datetime) -> datetime:
    return valor if valor.tzinfo else valor.replace(tzinfo=UTC)


def _consultar_gemini(prompt: str) -> dict[str, Any] | None:
    if not settings.gemini_api_key.strip():
        return None

    url = f"{GEMINI_BASE_URL}/models/{settings.gemini_model}:generateContent"
    body = {
        "systemInstruction": {"parts": [{"text": SYSTEM_INSTRUCTION}]},
        "contents": [{"role": "user", "parts": [{"text": prompt}]}],
        "generationConfig": {"responseMimeType": "application/json"},
    }
    try:
        with _crear_cliente() as cliente:
            respuesta = cliente.post(
                url,
                headers={"x-goog-api-key": settings.gemini_api_key},
                json=body,
            )
            respuesta.raise_for_status()
            partes = respuesta.json()["candidates"][0]["content"]["parts"]
            texto = next(p["text"] for p in partes if "text" in p and not p.get("thought"))
            salida = json.loads(texto)
    except (httpx.HTTPError, KeyError, IndexError, StopIteration, TypeError, ValueError) as exc:
        logger.warning("Gemini no disponible; se usa modo determinístico: %s", type(exc).__name__)
        return None
    return salida if isinstance(salida, dict) else None


def estructurar_nota(texto: str) -> AsistenteResponse:
    base = estructurar_nota_deterministica(texto)
    salida = _consultar_gemini(f"Nota cruda de campo a estructurar:\n{texto}")
    if salida is None:
        return base
    try:
        return AsistenteResponse(
            modo_ejecucion="ia_asistida",
            aviso_legal=AVISO_LEGAL,
            resumen_tecnico=salida["resumen_tecnico"],
            indicadores_sugeridos=salida.get("indicadores_sugeridos", []),
            estado_sugerido=salida.get("estado_sugerido"),
            escurrimiento_sugerido=salida.get("escurrimiento_sugerido"),
            encuadre_normativo=salida.get("encuadre_normativo", []),
        )
    except (ValidationError, KeyError, TypeError):
        logger.warning("Salida de Gemini inválida; se usa modo determinístico.")
        return base


def resumir_triage(db: Session, codigo_unico: str) -> AsistenteResponse:
    base = resumir_triage_deterministico(db, codigo_unico)
    salida = _consultar_gemini(
        f"Resume solo la evolución del atajadero {codigo_unico} con estos datos: "
        f"{base.resumen_tecnico}"
    )
    resumen_ia = salida.get("resumen_tecnico") if salida else None
    if not isinstance(resumen_ia, str) or not resumen_ia.strip():
        return base
    return base.model_copy(
        update={
            "modo_ejecucion": "ia_asistida",
            "resumen_tecnico": resumen_ia.strip(),
        }
    )
