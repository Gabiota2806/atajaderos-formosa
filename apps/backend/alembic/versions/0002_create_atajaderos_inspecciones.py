"""crear tablas atajaderos e inspecciones con geometria PostGIS 4326

Revision ID: 0002_atajaderos_inspecciones
Revises: 0001_create_users
Create Date: 2026-11-19 15:50:00
"""

from collections.abc import Sequence
from typing import Any

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

revision: str = "0002_atajaderos_inspecciones"
down_revision: str | Sequence[str] | None = "0001_create_users"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


class _GeometryPoint4326(sa.types.UserDefinedType[str]):
    cache_ok = True

    def get_col_spec(self, **kw: Any) -> str:
        return "geometry(Point, 4326)"


_TRIGGER_FUNCTION_SQL = """
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

_DROP_TRIGGER_SQL = "DROP TRIGGER IF EXISTS trg_atajaderos_enforce_invariants ON atajaderos;"

_CREATE_TRIGGER_SQL = """
CREATE TRIGGER trg_atajaderos_enforce_invariants
BEFORE INSERT OR UPDATE ON atajaderos
FOR EACH ROW
EXECUTE FUNCTION atajaderos_enforce_invariants();
"""


def upgrade() -> None:
    op.execute("CREATE EXTENSION IF NOT EXISTS postgis")

    op.create_table(
        "atajaderos",
        sa.Column(
            "id",
            sa.Uuid(as_uuid=True),
            server_default=sa.text("gen_random_uuid()"),
            nullable=False,
        ),
        sa.Column("codigo_unico", sa.String(length=32), nullable=False),
        sa.Column("nombre_referencia", sa.String(length=200), nullable=False),
        sa.Column("latitud", sa.Double(), nullable=False),
        sa.Column("longitud", sa.Double(), nullable=False),
        sa.Column("geom", _GeometryPoint4326(), nullable=False),
        sa.Column("departamento", sa.String(length=100), nullable=False),
        sa.Column("cuenca_riacho", sa.String(length=150), nullable=False),
        sa.Column(
            "tipo_emplazamiento",
            sa.String(length=40),
            server_default="a_determinar",
            nullable=False,
        ),
        sa.Column(
            "estado",
            sa.String(length=40),
            server_default="sin_validar",
            nullable=False,
        ),
        sa.Column(
            "interrumpe_escurrimiento",
            sa.String(length=40),
            server_default="a_verificar",
            nullable=False,
        ),
        sa.Column(
            "categoria_dato",
            sa.String(length=40),
            server_default="SIMULADO",
            nullable=False,
        ),
        sa.Column("criterio_validado_por", sa.String(length=255), nullable=True),
        sa.Column("observaciones_iniciales", sa.Text(), nullable=True),
        sa.Column("reportado_por", sa.String(length=150), nullable=True),
        sa.Column("fuente_referencia", sa.String(length=200), nullable=True),
        sa.Column("fecha_ultima_inspeccion", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_by_id", sa.Integer(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["created_by_id"], ["users.id"], ondelete="SET NULL"),
        sa.CheckConstraint(
            "char_length(btrim(codigo_unico)) > 0",
            name="ck_atajaderos_codigo_unico_no_vacio",
        ),
        sa.CheckConstraint(
            "latitud >= -27.0 AND latitud <= -22.0",
            name="ck_atajaderos_latitud_formosa",
        ),
        sa.CheckConstraint(
            "longitud >= -62.5 AND longitud <= -57.5",
            name="ck_atajaderos_longitud_formosa",
        ),
        sa.CheckConstraint(
            "tipo_emplazamiento IN ('en_cauce_activo', 'lateral_fuera_de_cauce', "
            "'alcantarilla_vial', 'a_determinar')",
            name="ck_atajaderos_tipo_emplazamiento",
        ),
        sa.CheckConstraint(
            "estado IN ('sin_validar', 'operativo', 'con_deterioro', 'fuera_de_servicio')",
            name="ck_atajaderos_estado",
        ),
        sa.CheckConstraint(
            "interrumpe_escurrimiento IN ('si', 'no', 'a_verificar')",
            name="ck_atajaderos_interrumpe_escurrimiento",
        ),
        sa.CheckConstraint(
            "categoria_dato IN ('SIMULADO', 'OBSERVADO', 'REFERENCIA')",
            name="ck_atajaderos_categoria_dato",
        ),
    )

    op.create_index("ix_atajaderos_codigo_unico", "atajaderos", ["codigo_unico"], unique=True)
    op.create_index(
        "ix_atajaderos_geom",
        "atajaderos",
        ["geom"],
        unique=False,
        postgresql_using="gist",
    )
    op.create_index("ix_atajaderos_departamento", "atajaderos", ["departamento"], unique=False)
    op.create_index("ix_atajaderos_cuenca_riacho", "atajaderos", ["cuenca_riacho"], unique=False)
    op.create_index(
        "ix_atajaderos_tipo_emplazamiento",
        "atajaderos",
        ["tipo_emplazamiento"],
        unique=False,
    )
    op.create_index("ix_atajaderos_estado", "atajaderos", ["estado"], unique=False)
    op.create_index(
        "ix_atajaderos_interrumpe_escurrimiento",
        "atajaderos",
        ["interrumpe_escurrimiento"],
        unique=False,
    )
    op.create_index("ix_atajaderos_categoria_dato", "atajaderos", ["categoria_dato"], unique=False)
    op.create_index("ix_atajaderos_created_by_id", "atajaderos", ["created_by_id"], unique=False)

    op.execute(_TRIGGER_FUNCTION_SQL)
    op.execute(_DROP_TRIGGER_SQL)
    op.execute(_CREATE_TRIGGER_SQL)

    op.create_table(
        "inspecciones",
        sa.Column(
            "id",
            sa.Uuid(as_uuid=True),
            server_default=sa.text("gen_random_uuid()"),
            nullable=False,
        ),
        sa.Column("atajadero_id", sa.Uuid(as_uuid=True), nullable=False),
        sa.Column("inspector_id", sa.Integer(), nullable=True),
        sa.Column("responsable", sa.String(length=150), nullable=False),
        sa.Column(
            "fecha_inspeccion",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column(
            "tipo_registro",
            sa.String(length=40),
            server_default="inspeccion",
            nullable=False,
        ),
        sa.Column("estado_observado", sa.String(length=40), nullable=False),
        sa.Column(
            "interrumpe_escurrimiento",
            sa.String(length=40),
            server_default="a_verificar",
            nullable=False,
        ),
        sa.Column(
            "indicadores_visuales",
            postgresql.JSONB(astext_type=sa.Text()),
            server_default=sa.text("'[]'::jsonb"),
            nullable=False,
        ),
        sa.Column("observaciones", sa.Text(), nullable=False),
        sa.Column(
            "evidencia_fotos",
            postgresql.JSONB(astext_type=sa.Text()),
            server_default=sa.text("'[]'::jsonb"),
            nullable=False,
        ),
        sa.Column(
            "fotos_hashes_sha256",
            postgresql.JSONB(astext_type=sa.Text()),
            server_default=sa.text("'[]'::jsonb"),
            nullable=False,
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["atajadero_id"], ["atajaderos.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["inspector_id"], ["users.id"], ondelete="SET NULL"),
        sa.CheckConstraint(
            "tipo_registro IN ('inspeccion', 'intervencion')",
            name="ck_inspecciones_tipo_registro",
        ),
        sa.CheckConstraint(
            "estado_observado IN ('sin_validar', 'operativo', "
            "'con_deterioro', 'fuera_de_servicio')",
            name="ck_inspecciones_estado_observado",
        ),
        sa.CheckConstraint(
            "interrumpe_escurrimiento IN ('si', 'no', 'a_verificar')",
            name="ck_inspecciones_interrumpe_escurrimiento",
        ),
    )

    op.create_index("ix_inspecciones_atajadero_id", "inspecciones", ["atajadero_id"], unique=False)
    op.create_index("ix_inspecciones_inspector_id", "inspecciones", ["inspector_id"], unique=False)
    op.create_index(
        "ix_inspecciones_fecha_inspeccion",
        "inspecciones",
        ["fecha_inspeccion"],
        unique=False,
    )
    op.create_index(
        "ix_inspecciones_atajadero_fecha",
        "inspecciones",
        ["atajadero_id", sa.text("fecha_inspeccion DESC")],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index("ix_inspecciones_atajadero_fecha", table_name="inspecciones")
    op.drop_index("ix_inspecciones_fecha_inspeccion", table_name="inspecciones")
    op.drop_index("ix_inspecciones_inspector_id", table_name="inspecciones")
    op.drop_index("ix_inspecciones_atajadero_id", table_name="inspecciones")
    op.drop_table("inspecciones")

    op.execute(_DROP_TRIGGER_SQL)
    op.execute("DROP FUNCTION IF EXISTS atajaderos_enforce_invariants();")

    op.drop_index("ix_atajaderos_created_by_id", table_name="atajaderos")
    op.drop_index("ix_atajaderos_categoria_dato", table_name="atajaderos")
    op.drop_index("ix_atajaderos_interrumpe_escurrimiento", table_name="atajaderos")
    op.drop_index("ix_atajaderos_estado", table_name="atajaderos")
    op.drop_index("ix_atajaderos_tipo_emplazamiento", table_name="atajaderos")
    op.drop_index("ix_atajaderos_cuenca_riacho", table_name="atajaderos")
    op.drop_index("ix_atajaderos_departamento", table_name="atajaderos")
    op.drop_index("ix_atajaderos_geom", table_name="atajaderos")
    op.drop_index("ix_atajaderos_codigo_unico", table_name="atajaderos")
    op.drop_table("atajaderos")
