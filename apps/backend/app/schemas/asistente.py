from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field, model_validator

from app.enums.estado_atajadero import EstadoAtajadero
from app.enums.indicador_visual import IndicadorVisual
from app.enums.interrupcion_escurrimiento import InterrupcionEscurrimiento

ModoAsistente = Literal["estructurar_nota_campo", "resumir_triage_mesa"]

MIN_CARACTERES_NOTA_CAMPO = 10


class AsistenteRequest(BaseModel):
    modo: ModoAsistente
    texto_campo: str | None = Field(default=None, max_length=4000)
    codigo_unico: str | None = Field(default=None, max_length=32)

    @model_validator(mode="after")
    def validar_payload_por_modo(self) -> AsistenteRequest:
        if self.modo == "estructurar_nota_campo":
            texto = (self.texto_campo or "").strip()
            if len(texto) < MIN_CARACTERES_NOTA_CAMPO:
                raise ValueError(
                    "Para estructurar_nota_campo, texto_campo debe tener al menos "
                    f"{MIN_CARACTERES_NOTA_CAMPO} caracteres."
                )
        else:
            if not (self.codigo_unico or "").strip():
                raise ValueError("Para resumir_triage_mesa, codigo_unico es obligatorio.")
        return self


class AsistenteResponse(BaseModel):
    modo_ejecucion: Literal["ia_asistida", "deterministico_offline"]
    requiere_confirmacion_humana: Literal[True] = True
    aviso_legal: str
    resumen_tecnico: str
    indicadores_sugeridos: list[IndicadorVisual] = Field(default_factory=list)
    estado_sugerido: EstadoAtajadero | None = None
    escurrimiento_sugerido: InterrupcionEscurrimiento | None = None
    encuadre_normativo: list[str] = Field(default_factory=list)
