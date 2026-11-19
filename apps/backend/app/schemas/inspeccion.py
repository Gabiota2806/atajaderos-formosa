import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.enums import (
    CategoriaDato,
    EstadoAtajadero,
    IndicadorVisual,
    InterrupcionEscurrimiento,
    TipoEmplazamiento,
    TipoRegistro,
)
from app.schemas.common import (
    strip_text,
    validate_codigo_unico,
    validate_formosa_latitud,
    validate_formosa_longitud,
)


def _deduplicate_indicadores(value: list[IndicadorVisual]) -> list[IndicadorVisual]:
    vistos: set[IndicadorVisual] = set()
    resultado: list[IndicadorVisual] = []
    for indicador in value:
        if indicador not in vistos:
            vistos.add(indicador)
            resultado.append(indicador)
    return resultado


class InspeccionCreate(BaseModel):
    tipo_registro: TipoRegistro = TipoRegistro.INSPECCION
    estado_observado: EstadoAtajadero
    interrumpe_escurrimiento: InterrupcionEscurrimiento
    indicadores_visuales: list[IndicadorVisual] = Field(default_factory=list)
    observaciones: str
    fecha_inspeccion: datetime | None = None
    responsable: str | None = Field(default=None, max_length=150)
    criterio_validado_por: str | None = Field(default=None, max_length=255)
    tipo_emplazamiento: TipoEmplazamiento | None = None

    @field_validator("observaciones")
    @classmethod
    def validar_observaciones(cls, value: str) -> str:
        cleaned = value.strip()
        if len(cleaned) < 10:
            raise ValueError("Las observaciones técnicas deben tener al menos 10 caracteres.")
        return cleaned

    @field_validator("indicadores_visuales")
    @classmethod
    def validar_indicadores(cls, value: list[IndicadorVisual]) -> list[IndicadorVisual]:
        return _deduplicate_indicadores(value)

    @field_validator("responsable", "criterio_validado_por")
    @classmethod
    def limpiar_opcionales(cls, value: str | None) -> str | None:
        return strip_text(value)


class InspeccionResponse(BaseModel):
    id: uuid.UUID
    atajadero_id: uuid.UUID
    inspector_id: int | None = None
    responsable: str
    fecha_inspeccion: datetime
    tipo_registro: TipoRegistro
    estado_observado: EstadoAtajadero
    interrumpe_escurrimiento: InterrupcionEscurrimiento
    indicadores_visuales: list[IndicadorVisual]
    observaciones: str
    evidencia_fotos: list[str]
    fotos_hashes_sha256: list[str]
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class KoboImportItem(BaseModel):
    codigo_unico: str | None = None
    nombre_referencia: str | None = Field(default=None, max_length=200)
    latitud: float | None = None
    longitud: float | None = None
    departamento: str | None = Field(default=None, max_length=100)
    cuenca_riacho: str | None = Field(default=None, max_length=150)
    tipo_emplazamiento: TipoEmplazamiento | None = None
    estado: EstadoAtajadero | None = None
    estado_observado: EstadoAtajadero | None = None
    interrumpe_escurrimiento: InterrupcionEscurrimiento | None = None
    categoria_dato: CategoriaDato = CategoriaDato.SIMULADO
    tipo_registro: TipoRegistro = TipoRegistro.INSPECCION
    indicadores_visuales: list[IndicadorVisual] = Field(default_factory=list)
    observaciones: str | None = None
    responsable: str | None = Field(default=None, max_length=150)
    fecha_inspeccion: datetime | None = None
    criterio_validado_por: str | None = Field(default=None, max_length=255)
    reportado_por: str | None = Field(default=None, max_length=150)
    fuente_referencia: str | None = Field(default=None, max_length=200)

    @field_validator("codigo_unico")
    @classmethod
    def validar_codigo(cls, value: str | None) -> str | None:
        return validate_codigo_unico(value)

    @field_validator("latitud")
    @classmethod
    def validar_latitud(cls, value: float | None) -> float | None:
        if value is None:
            return None
        return validate_formosa_latitud(value)

    @field_validator("longitud")
    @classmethod
    def validar_longitud(cls, value: float | None) -> float | None:
        if value is None:
            return None
        return validate_formosa_longitud(value)

    @field_validator("indicadores_visuales")
    @classmethod
    def validar_indicadores(cls, value: list[IndicadorVisual]) -> list[IndicadorVisual]:
        return _deduplicate_indicadores(value)

    @field_validator(
        "nombre_referencia",
        "departamento",
        "cuenca_riacho",
        "observaciones",
        "responsable",
        "criterio_validado_por",
        "reportado_por",
        "fuente_referencia",
    )
    @classmethod
    def limpiar_textos(cls, value: str | None) -> str | None:
        return strip_text(value)


class KoboImportError(BaseModel):
    indice: int
    codigo_unico: str | None = None
    detalle: str


class KoboImportResponse(BaseModel):
    creados: int
    inspecciones_agregadas: int
    errores: list[KoboImportError]
    codigos_procesados: list[str] = Field(default_factory=list)
