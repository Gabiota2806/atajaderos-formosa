import uuid
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.enums import (
    CategoriaDato,
    EstadoAtajadero,
    InterrupcionEscurrimiento,
    TipoEmplazamiento,
)
from app.schemas.common import (
    strip_required_text,
    strip_text,
    validate_codigo_unico,
    validate_formosa_latitud,
    validate_formosa_longitud,
)
from app.schemas.inspeccion import InspeccionResponse


class AtajaderoCreate(BaseModel):
    nombre_referencia: str
    latitud: float
    longitud: float
    departamento: str
    cuenca_riacho: str
    tipo_emplazamiento: TipoEmplazamiento = TipoEmplazamiento.A_DETERMINAR
    estado: EstadoAtajadero = EstadoAtajadero.SIN_VALIDAR
    interrumpe_escurrimiento: InterrupcionEscurrimiento = InterrupcionEscurrimiento.A_VERIFICAR
    categoria_dato: CategoriaDato = CategoriaDato.SIMULADO
    codigo_unico: str | None = None
    criterio_validado_por: str | None = Field(default=None, max_length=255)
    observaciones_iniciales: str | None = None
    reportado_por: str | None = Field(default=None, max_length=150)
    fuente_referencia: str | None = Field(default=None, max_length=200)

    @field_validator("nombre_referencia")
    @classmethod
    def validar_nombre_referencia(cls, value: str) -> str:
        return strip_required_text(value, "nombre_referencia", min_length=3, max_length=200)

    @field_validator("departamento")
    @classmethod
    def validar_departamento(cls, value: str) -> str:
        return strip_required_text(value, "departamento", min_length=2, max_length=100)

    @field_validator("cuenca_riacho")
    @classmethod
    def validar_cuenca_riacho(cls, value: str) -> str:
        return strip_required_text(value, "cuenca_riacho", min_length=2, max_length=150)

    @field_validator("latitud")
    @classmethod
    def validar_latitud(cls, value: float) -> float:
        return validate_formosa_latitud(value)

    @field_validator("longitud")
    @classmethod
    def validar_longitud(cls, value: float) -> float:
        return validate_formosa_longitud(value)

    @field_validator("codigo_unico")
    @classmethod
    def validar_codigo(cls, value: str | None) -> str | None:
        return validate_codigo_unico(value)

    @field_validator(
        "criterio_validado_por",
        "observaciones_iniciales",
        "reportado_por",
        "fuente_referencia",
    )
    @classmethod
    def limpiar_opcionales(cls, value: str | None) -> str | None:
        return strip_text(value)


class AvisoPublicoCreate(BaseModel):
    model_config = ConfigDict(extra="ignore")

    nombre_referencia: str
    latitud: float
    longitud: float
    departamento: str
    cuenca_riacho: str
    descripcion_aviso: str
    reportado_por: str | None = Field(default=None, max_length=150)

    @field_validator("nombre_referencia")
    @classmethod
    def validar_nombre_referencia(cls, value: str) -> str:
        return strip_required_text(value, "nombre_referencia", min_length=3, max_length=200)

    @field_validator("departamento")
    @classmethod
    def validar_departamento(cls, value: str) -> str:
        return strip_required_text(value, "departamento", min_length=2, max_length=100)

    @field_validator("cuenca_riacho")
    @classmethod
    def validar_cuenca_riacho(cls, value: str) -> str:
        return strip_required_text(value, "cuenca_riacho", min_length=2, max_length=150)

    @field_validator("descripcion_aviso")
    @classmethod
    def validar_descripcion_aviso(cls, value: str) -> str:
        return strip_required_text(value, "descripcion_aviso", min_length=10, max_length=2000)

    @field_validator("latitud")
    @classmethod
    def validar_latitud(cls, value: float) -> float:
        return validate_formosa_latitud(value)

    @field_validator("longitud")
    @classmethod
    def validar_longitud(cls, value: float) -> float:
        return validate_formosa_longitud(value)

    @field_validator("reportado_por")
    @classmethod
    def limpiar_reportado_por(cls, value: str | None) -> str | None:
        return strip_text(value)


class AtajaderoSummary(BaseModel):
    id: uuid.UUID
    codigo_unico: str
    nombre_referencia: str
    latitud: float
    longitud: float
    departamento: str
    cuenca_riacho: str
    tipo_emplazamiento: TipoEmplazamiento
    estado: EstadoAtajadero
    interrumpe_escurrimiento: InterrupcionEscurrimiento
    categoria_dato: CategoriaDato
    criterio_validado_por: str | None = None
    observaciones_iniciales: str | None = None
    reportado_por: str | None = None
    fuente_referencia: str | None = None
    fecha_ultima_inspeccion: datetime | None = None
    total_inspecciones: int = 0
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AtajaderoDetail(AtajaderoSummary):
    inspecciones: list[InspeccionResponse] = Field(default_factory=list)
    evidencia_inicial_fotos: list[str] = Field(default_factory=list)
    evidencia_inicial_hashes_sha256: list[str] = Field(default_factory=list)


class AtajaderoListResponse(BaseModel):
    total: int
    items: list[AtajaderoSummary]


class GeoJSONPoint(BaseModel):
    type: Literal["Point"] = "Point"
    coordinates: list[float]


class GeoJSONFeatureProperties(BaseModel):
    id: uuid.UUID
    codigo_unico: str
    nombre_referencia: str
    departamento: str
    cuenca_riacho: str
    tipo_emplazamiento: TipoEmplazamiento
    estado: EstadoAtajadero
    interrumpe_escurrimiento: InterrupcionEscurrimiento
    categoria_dato: CategoriaDato
    criterio_validado_por: str | None = None
    fecha_ultima_inspeccion: datetime | None = None
    total_inspecciones: int = 0


class GeoJSONFeature(BaseModel):
    type: Literal["Feature"] = "Feature"
    id: str
    geometry: GeoJSONPoint
    properties: GeoJSONFeatureProperties


class GeoJSONMetadata(BaseModel):
    es_prototipo: bool = True
    leyenda: str
    crs: Literal["EPSG:4326"] = "EPSG:4326"
    total: int


class GeoJSONFeatureCollection(BaseModel):
    type: Literal["FeatureCollection"] = "FeatureCollection"
    name: str = "atajaderos_formosa"
    metadata: GeoJSONMetadata
    features: list[GeoJSONFeature]
