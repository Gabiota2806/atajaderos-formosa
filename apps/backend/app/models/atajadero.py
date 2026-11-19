from __future__ import annotations

import uuid
from datetime import datetime
from typing import TYPE_CHECKING, Any

from sqlalchemy import (
    CheckConstraint,
    DateTime,
    Double,
    ForeignKey,
    Index,
    String,
    Text,
    Uuid,
    event,
    func,
    inspect,
    select,
    text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.enums.categoria_dato import CategoriaDato
from app.enums.estado_atajadero import EstadoAtajadero
from app.enums.interrupcion_escurrimiento import InterrupcionEscurrimiento
from app.enums.tipo_emplazamiento import TipoEmplazamiento
from app.models.base import Base
from app.models.types import GeometryPoint4326, point_4326_ewkt

if TYPE_CHECKING:
    from app.models.inspeccion import Inspeccion
    from app.models.user import User

ATAJADEROS_TRIGGER_FUNCTION_SQL = """
CREATE OR REPLACE FUNCTION atajaderos_enforce_invariants()
RETURNS trigger AS $$
BEGIN
    IF TG_OP = 'UPDATE' THEN
        IF NEW.codigo_unico IS DISTINCT FROM OLD.codigo_unico THEN
            RAISE EXCEPTION USING
                MESSAGE = 'El codigo_unico es inmutable y no puede modificarse: '
                    || OLD.codigo_unico,
                ERRCODE = 'check_violation';
        END IF;
        IF NEW.geom IS NULL OR (
            (NEW.latitud IS DISTINCT FROM OLD.latitud OR NEW.longitud IS DISTINCT FROM OLD.longitud)
            AND NOT (NEW.geom IS DISTINCT FROM OLD.geom)
        ) THEN
            NEW.geom := ST_SetSRID(ST_MakePoint(NEW.longitud, NEW.latitud), 4326);
        END IF;
    ELSIF TG_OP = 'INSERT' THEN
        IF NEW.geom IS NULL THEN
            NEW.geom := ST_SetSRID(ST_MakePoint(NEW.longitud, NEW.latitud), 4326);
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
"""

ATAJADEROS_DROP_TRIGGER_SQL = (
    "DROP TRIGGER IF EXISTS trg_atajaderos_enforce_invariants ON atajaderos;"
)

ATAJADEROS_CREATE_TRIGGER_SQL = """
CREATE TRIGGER trg_atajaderos_enforce_invariants
BEFORE INSERT OR UPDATE ON atajaderos
FOR EACH ROW
EXECUTE FUNCTION atajaderos_enforce_invariants();
"""


class Atajadero(Base):
    __tablename__ = "atajaderos"
    __table_args__ = (
        Index("ix_atajaderos_geom", "geom", postgresql_using="gist"),
        CheckConstraint(
            "char_length(btrim(codigo_unico)) > 0",
            name="ck_atajaderos_codigo_unico_no_vacio",
        ),
        CheckConstraint(
            "latitud >= -27.0 AND latitud <= -22.0",
            name="ck_atajaderos_latitud_formosa",
        ),
        CheckConstraint(
            "longitud >= -62.5 AND longitud <= -57.5",
            name="ck_atajaderos_longitud_formosa",
        ),
        CheckConstraint(
            "tipo_emplazamiento IN ('en_cauce_activo', 'lateral_fuera_de_cauce', "
            "'alcantarilla_vial', 'a_determinar')",
            name="ck_atajaderos_tipo_emplazamiento",
        ),
        CheckConstraint(
            "estado IN ('sin_validar', 'operativo', 'con_deterioro', 'fuera_de_servicio')",
            name="ck_atajaderos_estado",
        ),
        CheckConstraint(
            "interrumpe_escurrimiento IN ('si', 'no', 'a_verificar')",
            name="ck_atajaderos_interrumpe_escurrimiento",
        ),
        CheckConstraint(
            "categoria_dato IN ('SIMULADO', 'OBSERVADO', 'REFERENCIA')",
            name="ck_atajaderos_categoria_dato",
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        server_default=text("gen_random_uuid()"),
    )
    codigo_unico: Mapped[str] = mapped_column(String(32), unique=True, index=True, nullable=False)
    nombre_referencia: Mapped[str] = mapped_column(String(200), nullable=False)
    latitud: Mapped[float] = mapped_column(Double(), nullable=False)
    longitud: Mapped[float] = mapped_column(Double(), nullable=False)
    geom: Mapped[str] = mapped_column(GeometryPoint4326(), nullable=False)
    departamento: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    cuenca_riacho: Mapped[str] = mapped_column(String(150), nullable=False, index=True)
    tipo_emplazamiento: Mapped[str] = mapped_column(
        String(40),
        nullable=False,
        default=TipoEmplazamiento.A_DETERMINAR.value,
        server_default=TipoEmplazamiento.A_DETERMINAR.value,
        index=True,
    )
    estado: Mapped[str] = mapped_column(
        String(40),
        nullable=False,
        default=EstadoAtajadero.SIN_VALIDAR.value,
        server_default=EstadoAtajadero.SIN_VALIDAR.value,
        index=True,
    )
    interrumpe_escurrimiento: Mapped[str] = mapped_column(
        String(40),
        nullable=False,
        default=InterrupcionEscurrimiento.A_VERIFICAR.value,
        server_default=InterrupcionEscurrimiento.A_VERIFICAR.value,
        index=True,
    )
    categoria_dato: Mapped[str] = mapped_column(
        String(40),
        nullable=False,
        default=CategoriaDato.SIMULADO.value,
        server_default=CategoriaDato.SIMULADO.value,
        index=True,
    )
    criterio_validado_por: Mapped[str | None] = mapped_column(String(255), nullable=True)
    observaciones_iniciales: Mapped[str | None] = mapped_column(Text, nullable=True)
    reportado_por: Mapped[str | None] = mapped_column(String(150), nullable=True)
    fuente_referencia: Mapped[str | None] = mapped_column(String(200), nullable=True)
    fecha_ultima_inspeccion: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    created_by_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    inspecciones: Mapped[list[Inspeccion]] = relationship(
        "Inspeccion",
        back_populates="atajadero",
        order_by="desc(Inspeccion.fecha_inspeccion), desc(Inspeccion.created_at)",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
    created_by: Mapped[User | None] = relationship("User")

    @property
    def estado_enum(self) -> EstadoAtajadero:
        return EstadoAtajadero(self.estado)

    @property
    def interrumpe_escurrimiento_enum(self) -> InterrupcionEscurrimiento:
        return InterrupcionEscurrimiento(self.interrumpe_escurrimiento)

    @property
    def tipo_emplazamiento_enum(self) -> TipoEmplazamiento:
        return TipoEmplazamiento(self.tipo_emplazamiento)

    @property
    def categoria_dato_enum(self) -> CategoriaDato:
        return CategoriaDato(self.categoria_dato)


@event.listens_for(Atajadero, "before_insert")
def _atajadero_before_insert(_mapper: Any, _connection: Any, target: Atajadero) -> None:
    if target.geom is None and target.latitud is not None and target.longitud is not None:
        target.geom = point_4326_ewkt(target.longitud, target.latitud)


@event.listens_for(Atajadero, "before_update")
def _atajadero_before_update(_mapper: Any, connection: Any, target: Atajadero) -> None:
    state = inspect(target)
    codigo_history = state.attrs.codigo_unico.history
    if codigo_history.has_changes():
        if codigo_history.deleted:
            valor_anterior = codigo_history.deleted[0]
        else:
            valor_anterior = connection.execute(
                select(Atajadero.codigo_unico).where(Atajadero.id == target.id)
            ).scalar_one_or_none()
        if valor_anterior is not None and valor_anterior != target.codigo_unico:
            raise ValueError(
                f"El codigo_unico '{valor_anterior}' es inmutable y no puede modificarse."
            )

    lat_changed = state.attrs.latitud.history.has_changes()
    lon_changed = state.attrs.longitud.history.has_changes()
    geom_changed = state.attrs.geom.history.has_changes()
    geom_is_none = "geom" not in state.unloaded and target.geom is None
    if geom_is_none or ((lat_changed or lon_changed) and not geom_changed):
        if "latitud" in state.unloaded or "longitud" in state.unloaded:
            row = connection.execute(
                select(Atajadero.latitud, Atajadero.longitud).where(Atajadero.id == target.id)
            ).one_or_none()
            if row is not None:
                lat = row[0] if "latitud" in state.unloaded else target.latitud
                lon = row[1] if "longitud" in state.unloaded else target.longitud
                target.geom = point_4326_ewkt(lon, lat)
        else:
            target.geom = point_4326_ewkt(target.longitud, target.latitud)


@event.listens_for(Atajadero.__table__, "after_create")
def _atajadero_after_create(_target: Any, connection: Any, **_kw: Any) -> None:
    connection.execute(text(ATAJADEROS_TRIGGER_FUNCTION_SQL))
    connection.execute(text(ATAJADEROS_DROP_TRIGGER_SQL))
    connection.execute(text(ATAJADEROS_CREATE_TRIGGER_SQL))
