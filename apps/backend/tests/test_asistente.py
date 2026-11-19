import json
from collections.abc import Callable
from datetime import UTC, datetime, timedelta
from typing import Any

import httpx
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.enums.categoria_dato import CategoriaDato
from app.enums.estado_atajadero import EstadoAtajadero
from app.enums.interrupcion_escurrimiento import InterrupcionEscurrimiento
from app.enums.tipo_registro import TipoRegistro
from app.models.atajadero import Atajadero
from app.models.inspeccion import Inspeccion
from app.seeds.seed_demo import seed_demo_atajaderos, seed_demo_users
from app.services import asistente_ia

NOTA_SPEC = "sin vertedero, agua a 10 cm de la cresta y alcantarilla tapada con ramas"


@pytest.fixture
def token(client: TestClient, db_session: Session) -> str:
    seed_demo_users(db_session)
    login = client.post(
        "/api/auth/login",
        json={"email": "inspector@atajaderos.ar", "password": "password"},
    )
    return login.json()["access_token"]


@pytest.fixture
def headers(token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def sin_clave_gemini(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(settings, "gemini_api_key", "")


@pytest.fixture
def con_clave_gemini(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(settings, "gemini_api_key", "clave-de-prueba-no-real")


def simular_gemini(
    monkeypatch: pytest.MonkeyPatch, manejador: Callable[[httpx.Request], httpx.Response]
) -> None:
    """Reemplaza el transporte HTTP por un doble de prueba. No es una conexión real."""

    def crear_cliente() -> httpx.Client:
        return httpx.Client(transport=httpx.MockTransport(manejador))

    monkeypatch.setattr(asistente_ia, "_crear_cliente", crear_cliente)


def respuesta_gemini(payload: dict[str, Any]) -> httpx.Response:
    texto = json.dumps(payload)
    return httpx.Response(
        200,
        json={"candidates": [{"content": {"parts": [{"text": texto}]}}]},
    )


def crear_atajadero_con_historial(db: Session) -> str:
    ahora = datetime.now(UTC)
    atajadero = Atajadero(
        codigo_unico="ATJ-FSA-0001",
        nombre_referencia="Cruce RP 24 · Riacho El Porteño",
        latitud=-25.05,
        longitud=-59.55,
        departamento="Patiño",
        cuenca_riacho="Riacho El Porteño",
        categoria_dato=CategoriaDato.SIMULADO.value,
        estado=EstadoAtajadero.CON_DETERIORO.value,
        interrumpe_escurrimiento=InterrupcionEscurrimiento.SI.value,
        fecha_ultima_inspeccion=ahora - timedelta(days=20),
    )
    db.add(atajadero)
    db.flush()
    db.add(
        Inspeccion(
            atajadero_id=atajadero.id,
            responsable="Inspector de campo (DATO DE PRUEBA)",
            fecha_inspeccion=ahora - timedelta(days=60),
            tipo_registro=TipoRegistro.INSPECCION.value,
            estado_observado=EstadoAtajadero.OPERATIVO.value,
            interrumpe_escurrimiento=InterrupcionEscurrimiento.NO.value,
            indicadores_visuales=[],
            observaciones="Terraplén íntegro con vertedero lateral funcionando.",
        )
    )
    db.add(
        Inspeccion(
            atajadero_id=atajadero.id,
            responsable="Inspector de campo (DATO DE PRUEBA)",
            fecha_inspeccion=ahora - timedelta(days=20),
            tipo_registro=TipoRegistro.INSPECCION.value,
            estado_observado=EstadoAtajadero.CON_DETERIORO.value,
            interrumpe_escurrimiento=InterrupcionEscurrimiento.SI.value,
            indicadores_visuales=[
                "cierre_total_sin_vertedero",
                "riesgo_sobrepaso_borde_libre",
            ],
            observaciones="Vertedero colmatado y borde libre crítico en el talud.",
        )
    )
    db.commit()
    return atajadero.codigo_unico


def contar_filas(db: Session) -> tuple[int, int]:
    atajaderos = db.scalar(select(func.count()).select_from(Atajadero))
    inspecciones = db.scalar(select(func.count()).select_from(Inspeccion))
    return int(atajaderos or 0), int(inspecciones or 0)


# --- Modo 1: estructurar_nota_campo ---


def test_modo_1_sin_clave_responde_determinista_con_indicadores_de_la_spec(
    client: TestClient, headers: dict[str, str], sin_clave_gemini: None
) -> None:
    resp = client.post(
        "/api/asistente/resumir",
        headers=headers,
        json={"modo": "estructurar_nota_campo", "texto_campo": NOTA_SPEC},
    )

    assert resp.status_code == 200
    cuerpo = resp.json()
    assert cuerpo["modo_ejecucion"] == "deterministico_offline"
    assert cuerpo["requiere_confirmacion_humana"] is True
    assert cuerpo["indicadores_sugeridos"] == [
        "cierre_total_sin_vertedero",
        "riesgo_sobrepaso_borde_libre",
        "alcantarilla_obstruida",
    ]
    assert cuerpo["escurrimiento_sugerido"] == "si"
    assert cuerpo["estado_sugerido"] == "con_deterioro"


def test_modo_1_con_gemini_valido_marca_ia_asistida(
    client: TestClient,
    headers: dict[str, str],
    con_clave_gemini: None,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    def manejador(request: httpx.Request) -> httpx.Response:
        assert request.headers["x-goog-api-key"] == "clave-de-prueba-no-real"
        assert "gemini-2.5-flash:generateContent" in str(request.url)
        return respuesta_gemini(
            {
                "resumen_tecnico": "Cierre transversal con borde libre crítico.",
                "indicadores_sugeridos": ["cierre_total_sin_vertedero"],
                "estado_sugerido": "con_deterioro",
                "escurrimiento_sugerido": "si",
                "encuadre_normativo": ["Ley N° 1.314, Art. 40°"],
            }
        )

    simular_gemini(monkeypatch, manejador)

    resp = client.post(
        "/api/asistente/resumir",
        headers=headers,
        json={"modo": "estructurar_nota_campo", "texto_campo": NOTA_SPEC},
    )

    cuerpo = resp.json()
    assert resp.status_code == 200
    assert cuerpo["modo_ejecucion"] == "ia_asistida"
    assert cuerpo["resumen_tecnico"] == "Cierre transversal con borde libre crítico."


def test_modo_1_timeout_de_gemini_cae_a_determinista_sin_error_500(
    client: TestClient,
    headers: dict[str, str],
    con_clave_gemini: None,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    def manejador(request: httpx.Request) -> httpx.Response:
        raise httpx.ReadTimeout("tiempo agotado", request=request)

    simular_gemini(monkeypatch, manejador)

    resp = client.post(
        "/api/asistente/resumir",
        headers=headers,
        json={"modo": "estructurar_nota_campo", "texto_campo": NOTA_SPEC},
    )

    assert resp.status_code == 200
    assert resp.json()["modo_ejecucion"] == "deterministico_offline"


def test_modo_1_salida_de_gemini_fuera_de_contrato_cae_a_determinista(
    client: TestClient,
    headers: dict[str, str],
    con_clave_gemini: None,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    simular_gemini(
        monkeypatch,
        lambda _req: respuesta_gemini(
            {
                "resumen_tecnico": "Texto",
                "indicadores_sugeridos": ["indicador_inventado"],
            }
        ),
    )

    resp = client.post(
        "/api/asistente/resumir",
        headers=headers,
        json={"modo": "estructurar_nota_campo", "texto_campo": NOTA_SPEC},
    )

    assert resp.status_code == 200
    assert resp.json()["modo_ejecucion"] == "deterministico_offline"


def test_modo_1_errores_de_red_y_http_no_rompen_la_respuesta(
    client: TestClient,
    headers: dict[str, str],
    con_clave_gemini: None,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    simular_gemini(monkeypatch, lambda _req: httpx.Response(429, json={"error": "cuota"}))

    resp = client.post(
        "/api/asistente/resumir",
        headers=headers,
        json={"modo": "estructurar_nota_campo", "texto_campo": NOTA_SPEC},
    )

    assert resp.status_code == 200
    assert resp.json()["modo_ejecucion"] == "deterministico_offline"


# --- Modo 2: resumir_triage_mesa ---


def test_modo_2_resume_historial_y_encuadre_legal_sin_escribir_en_bd(
    client: TestClient,
    headers: dict[str, str],
    db_session: Session,
    sin_clave_gemini: None,
) -> None:
    codigo = crear_atajadero_con_historial(db_session)
    antes = contar_filas(db_session)
    estado_antes = db_session.scalar(
        select(Atajadero.estado).where(Atajadero.codigo_unico == codigo)
    )

    resp = client.post(
        "/api/asistente/resumir",
        headers=headers,
        json={"modo": "resumir_triage_mesa", "codigo_unico": codigo},
    )

    cuerpo = resp.json()
    assert resp.status_code == 200
    assert cuerpo["modo_ejecucion"] == "deterministico_offline"
    assert "2 registros" in cuerpo["resumen_tecnico"]
    assert "riesgo de sobrepaso" in cuerpo["resumen_tecnico"].lower()
    assert cuerpo["estado_sugerido"] is None
    assert cuerpo["escurrimiento_sugerido"] is None
    assert any("1.246" in e for e in cuerpo["encuadre_normativo"])
    assert any("1.314" in e for e in cuerpo["encuadre_normativo"])
    assert any("971/1980" in e for e in cuerpo["encuadre_normativo"])

    db_session.expire_all()
    assert contar_filas(db_session) == antes
    assert db_session.scalar(select(Atajadero.estado).where(Atajadero.codigo_unico == codigo)) == (
        estado_antes
    )


def test_modo_2_gemini_no_puede_asignar_estado_ni_escurrimiento(
    client: TestClient,
    headers: dict[str, str],
    db_session: Session,
    con_clave_gemini: None,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    codigo = crear_atajadero_con_historial(db_session)
    simular_gemini(
        monkeypatch,
        lambda _req: respuesta_gemini(
            {
                "resumen_tecnico": "Resumen generado por IA.",
                "estado_sugerido": "operativo",
                "escurrimiento_sugerido": "no",
            }
        ),
    )

    resp = client.post(
        "/api/asistente/resumir",
        headers=headers,
        json={"modo": "resumir_triage_mesa", "codigo_unico": codigo},
    )

    cuerpo = resp.json()
    assert resp.status_code == 200
    assert cuerpo["modo_ejecucion"] == "ia_asistida"
    assert cuerpo["resumen_tecnico"] == "Resumen generado por IA."
    assert cuerpo["estado_sugerido"] is None
    assert cuerpo["escurrimiento_sugerido"] is None


def test_modo_2_atajadero_inexistente_responde_404(
    client: TestClient, headers: dict[str, str], sin_clave_gemini: None
) -> None:
    resp = client.post(
        "/api/asistente/resumir",
        headers=headers,
        json={"modo": "resumir_triage_mesa", "codigo_unico": "ATJ-FSA-9999"},
    )

    assert resp.status_code == 404


# --- Entradas inválidas y autenticación ---


@pytest.mark.parametrize(
    "payload",
    [
        {"modo": "estructurar_nota_campo", "texto_campo": ""},
        {"modo": "estructurar_nota_campo", "texto_campo": "corta"},
        {"modo": "estructurar_nota_campo"},
        {"modo": "resumir_triage_mesa"},
        {"modo": "resumir_triage_mesa", "codigo_unico": "   "},
        {"modo": "modo_inventado", "codigo_unico": "ATJ-FSA-0001"},
    ],
)
def test_payload_inconsistente_responde_422(
    client: TestClient, headers: dict[str, str], payload: dict[str, Any]
) -> None:
    resp = client.post("/api/asistente/resumir", headers=headers, json=payload)

    assert resp.status_code == 422


def test_sin_token_responde_401(client: TestClient) -> None:
    resp = client.post(
        "/api/asistente/resumir",
        json={"modo": "estructurar_nota_campo", "texto_campo": NOTA_SPEC},
    )

    assert resp.status_code == 401


PLANTILLA_HIPOTESIS = {
    "registros": [
        {
            "nombre_referencia": "Hipótesis satelital · retención sobre riacho (ilustrativa)",
            "latitud": -25.0,
            "longitud": -58.8,
            "departamento": "Pilagás",
            "cuenca_riacho": "Riacho El Porteño",
            "tipo_emplazamiento": "a_determinar",
            "estado": "sin_validar",
            "interrumpe_escurrimiento": "a_verificar",
            "categoria_dato": "SIMULADO",
            "fuente_referencia": "Plantilla de hipótesis satelital (SIMULADO / DATO DE PRUEBA)",
            "reportado_por": "Plantilla de ejemplo",
        }
    ]
}


def test_plantilla_de_hipotesis_satelital_entra_por_importar_kobo_como_sin_validar(
    client: TestClient, headers: dict[str, str], db_session: Session
) -> None:
    resp = client.post("/api/atajaderos/importar-kobo", headers=headers, json=PLANTILLA_HIPOTESIS)

    assert resp.status_code == 201
    assert resp.json()["creados"] == 1
    creado = db_session.scalar(
        select(Atajadero).where(Atajadero.nombre_referencia.startswith("Hipótesis satelital"))
    )
    assert creado is not None
    assert creado.estado == EstadoAtajadero.SIN_VALIDAR.value
    assert creado.interrumpe_escurrimiento == InterrupcionEscurrimiento.A_VERIFICAR.value
    assert creado.categoria_dato == CategoriaDato.SIMULADO.value


def test_seed_demo_atajaderos_es_idempotente_y_carga_10_simulados(
    db_session: Session,
) -> None:
    primera = seed_demo_atajaderos(db_session)
    segunda = seed_demo_atajaderos(db_session)

    assert len(primera) == 10
    assert len(segunda) == 10

    todos = list(db_session.scalars(select(Atajadero).order_by(Atajadero.codigo_unico)).all())
    assert len(todos) == 10
    assert [a.codigo_unico for a in todos] == [f"ATJ-FSA-{n:04d}" for n in range(1, 11)]
    for atajadero in todos:
        assert atajadero.categoria_dato == CategoriaDato.SIMULADO.value
        assert -27.0 <= atajadero.latitud <= -22.0
        assert -62.5 <= atajadero.longitud <= -57.5

    atj_0001 = todos[0]
    assert len(atj_0001.inspecciones) == 3
