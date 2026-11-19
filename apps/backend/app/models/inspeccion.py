from __future__ import annotations

import uuid
from datetime import UTC, datetime
from typing import TYPE_CHECKING

from sqlalchemy import (
    CheckConstraint,
    DateTime,
    ForeignKey,
    Index,
    String,
    Text,
    Uuid,
    desc,
    func,
    text,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.enums.estado_atajadero import EstadoAtajadero
from app.enums.interrupcion_escurrimiento import InterrupcionEscurrimiento
from app.enums.tipo_registro import TipoRegistro
from app.models.base import Base

if TYPE_CHECKING:
    from app.models.atajadero import Atajadero
    from app.models.user import User


class Inspeccion(Base):
    __tablename__ = "inspecciones"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        server_default=text("gen_random_uuid()"),
    )
    atajadero_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("atajaderos.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    inspector_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    responsable: Mapped[str] = mapped_column(String(150), nullable=False)
    fecha_inspeccion: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        server_default=func.now(),
        nullable=False,
        index=True,
    )
    tipo_registro: Mapped[str] = mapped_column(
        String(40),
        nullable=False,
        default=TipoRegistro.INSPECCION.value,
        server_default=TipoRegistro.INSPECCION.value,
    )
    estado_observado: Mapped[str] = mapped_column(String(40), nullable=False)
    interrumpe_escurrimiento: Mapped[str] = mapped_column(
        String(40),
        nullable=False,
        default=InterrupcionEscurrimiento.A_VERIFICAR.value,
        server_default=InterrupcionEscurrimiento.A_VERIFICAR.value,
    )
    indicadores_visuales: Mapped[list[str]] = mapped_column(
        JSONB, nullable=False, default=list, server_default=text("'[]'::jsonb")
    )
    observaciones: Mapped[str] = mapped_column(Text, nullable=False)
    evidencia_fotos: Mapped[list[str]] = mapped_column(
        JSONB, nullable=False, default=list, server_default=text("'[]'::jsonb")
    )
    fotos_hashes_sha256: Mapped[list[str]] = mapped_column(
        JSONB, nullable=False, default=list, server_default=text("'[]'::jsonb")
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    __table_args__ = (
        Index("ix_inspecciones_atajadero_fecha", atajadero_id, desc(fecha_inspeccion)),
        CheckConstraint(
            "tipo_registro IN ('inspeccion', 'intervencion')",
            name="ck_inspecciones_tipo_registro",
        ),
        CheckConstraint(
            "estado_observado IN ('sin_validar', 'operativo', "
            "'con_deterioro', 'fuera_de_servicio')",
            name="ck_inspecciones_estado_observado",
        ),
        CheckConstraint(
            "interrumpe_escurrimiento IN ('si', 'no', 'a_verificar')",
            name="ck_inspecciones_interrumpe_escurrimiento",
        ),
    )

    atajadero: Mapped[Atajadero] = relationship("Atajadero", back_populates="inspecciones")
    inspector: Mapped[User | None] = relationship("User")

    @property
    def tipo_registro_enum(self) -> TipoRegistro:
        return TipoRegistro(self.tipo_registro)

    @property
    def estado_observado_enum(self) -> EstadoAtajadero:
        return EstadoAtajadero(self.estado_observado)

    @property
    def interrumpe_escurrimiento_enum(self) -> InterrupcionEscurrimiento:
        return InterrupcionEscurrimiento(self.interrumpe_escurrimiento)
