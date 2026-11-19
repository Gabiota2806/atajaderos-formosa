import json
import uuid
from datetime import UTC, datetime, timedelta

import pytest
from sqlalchemy import select, text, update
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, selectinload

from app.core.security import hash_password
from app.enums import (
    CategoriaDato,
    EstadoAtajadero,
    IndicadorVisual,
    InterrupcionEscurrimiento,
    TipoEmplazamiento,
    TipoRegistro,
    UserRole,
)
from app.models import Atajadero, Inspeccion, User


def test_strenums_contrato_valores_y_etiquetas() -> None:
    assert [e.value for e in UserRole] == ["inspector", "referente_mesa"]
    assert [e.value for e in EstadoAtajadero] == [
        "sin_validar",
        "operativo",
        "con_deterioro",
        "fuera_de_servicio",
    ]
    assert [e.value for e in InterrupcionEscurrimiento] == ["si", "no", "a_verificar"]
    assert [e.value for e in TipoEmplazamiento] == [
        "en_cauce_activo",
        "lateral_fuera_de_cauce",
        "alcantarilla_vial",
        "a_determinar",
    ]
    assert [e.value for e in CategoriaDato] == ["SIMULADO", "OBSERVADO", "REFERENCIA"]
    assert [e.value for e in TipoRegistro] == ["inspeccion", "intervencion"]
    assert [e.value for e in IndicadorVisual] == [
        "cierre_total_sin_vertedero",
        "riesgo_sobrepaso_borde_libre",
        "filtracion_turbia_tubificacion",
        "grietas_o_bioperturbacion",
        "alcantarilla_obstruida",
    ]

    for enum_cls in (
        UserRole,
        EstadoAtajadero,
        InterrupcionEscurrimiento,
        TipoEmplazamiento,
        CategoriaDato,
        TipoRegistro,
        IndicadorVisual,
    ):
        for miembro in enum_cls:
            assert isinstance(miembro.etiqueta, str)
            assert len(miembro.etiqueta) > 0

    with pytest.raises(ValueError):
        EstadoAtajadero("estado_inexistente")
    with pytest.raises(ValueError):
        CategoriaDato("simulado")


def test_atajadero_creacion_postgis_y_sincronizacion_geom(db_session: Session) -> None:
    atajadero = Atajadero(
        codigo_unico="ATJ-FSA-0001",
        nombre_referencia="Cruce RP 24 - Riacho El Porteño",
        latitud=-24.9814,
        longitud=-59.8412,
        departamento="Patiño",
        cuenca_riacho="Riacho El Porteño",
        tipo_emplazamiento=TipoEmplazamiento.EN_CAUCE_ACTIVO.value,
    )
    db_session.add(atajadero)
    db_session.commit()
    db_session.refresh(atajadero)

    assert isinstance(atajadero.id, uuid.UUID)
    assert atajadero.id.version == 4
    assert atajadero.estado == EstadoAtajadero.SIN_VALIDAR.value
    assert atajadero.interrumpe_escurrimiento == InterrupcionEscurrimiento.A_VERIFICAR.value
    assert atajadero.categoria_dato == CategoriaDato.SIMULADO.value
    assert atajadero.fecha_ultima_inspeccion is None
    assert atajadero.estado_enum is EstadoAtajadero.SIN_VALIDAR
    assert atajadero.interrumpe_escurrimiento_enum is InterrupcionEscurrimiento.A_VERIFICAR
    assert atajadero.tipo_emplazamiento_enum is TipoEmplazamiento.EN_CAUCE_ACTIVO
    assert atajadero.categoria_dato_enum is CategoriaDato.SIMULADO

    geo_row = db_session.execute(
        text(
            "SELECT ST_SRID(geom), ST_GeometryType(geom), ST_X(geom), ST_Y(geom), "
            "ST_AsGeoJSON(geom) FROM atajaderos WHERE codigo_unico = :codigo"
        ),
        {"codigo": "ATJ-FSA-0001"},
    ).one()
    assert geo_row[0] == 4326
    assert geo_row[1] == "ST_Point"
    assert geo_row[2] == pytest.approx(-59.8412)
    assert geo_row[3] == pytest.approx(-24.9814)
    geojson = json.loads(geo_row[4])
    assert geojson["type"] == "Point"
    assert geojson["coordinates"] == pytest.approx([-59.8412, -24.9814])

    gist_index = db_session.execute(
        text(
            "SELECT indexdef FROM pg_indexes "
            "WHERE tablename = 'atajaderos' AND indexname = 'ix_atajaderos_geom'"
        )
    ).scalar_one()
    assert "using gist" in gist_index.lower()

    atajadero.latitud = -25.12
    atajadero.longitud = -59.45
    db_session.commit()
    db_session.refresh(atajadero)

    updated_coords = db_session.execute(
        text("SELECT ST_X(geom), ST_Y(geom) FROM atajaderos WHERE id = :id"),
        {"id": atajadero.id},
    ).one()
    assert updated_coords[0] == pytest.approx(-59.45)
    assert updated_coords[1] == pytest.approx(-25.12)

    # Actualización parcial de latitud con instancia expirada tras commit()
    atajadero.latitud = -25.15
    db_session.commit()
    partial_coords = db_session.execute(
        text("SELECT ST_X(geom), ST_Y(geom) FROM atajaderos WHERE id = :id"),
        {"id": atajadero.id},
    ).one()
    assert partial_coords[0] == pytest.approx(-59.45)
    assert partial_coords[1] == pytest.approx(-25.15)

    # Verifica que un INSERT SQL directo sin columna geom dispare el trigger PostGIS
    db_session.execute(
        text(
            "INSERT INTO atajaderos (codigo_unico, nombre_referencia, latitud, longitud, "
            "departamento, cuenca_riacho) VALUES (:codigo, :nombre, :lat, :lon, :depto, :cuenca)"
        ),
        {
            "codigo": "ATJ-FSA-0002",
            "nombre": "Indicio RN 86",
            "lat": -24.65,
            "lon": -59.10,
            "depto": "Pilagá",
            "cuenca": "Riacho El Porteño",
        },
    )
    db_session.commit()
    sql_coords = db_session.execute(
        text(
            "SELECT ST_SRID(geom), ST_X(geom), ST_Y(geom) FROM atajaderos WHERE codigo_unico = :c"
        ),
        {"c": "ATJ-FSA-0002"},
    ).one()
    assert sql_coords[0] == 4326
    assert sql_coords[1] == pytest.approx(-59.10)
    assert sql_coords[2] == pytest.approx(-24.65)


def test_atajadero_inmutabilidad_codigo_unico_y_validaciones_db(db_session: Session) -> None:
    atajadero = Atajadero(
        codigo_unico="ATJ-FSA-0003",
        nombre_referencia="Riacho He-Hé cruce RP 26",
        latitud=-25.25,
        longitud=-58.55,
        departamento="Pilcomayo",
        cuenca_riacho="Riacho He-Hé",
    )
    db_session.add(atajadero)
    db_session.commit()

    # Mutación vía ORM debe fallar y conservar el valor original
    atajadero.codigo_unico = "ATJ-FSA-9999"
    with pytest.raises(ValueError, match="inmutable"):
        db_session.commit()
    db_session.rollback()

    codigo_actual = db_session.execute(
        select(Atajadero.codigo_unico).where(Atajadero.id == atajadero.id)
    ).scalar_one()
    assert codigo_actual == "ATJ-FSA-0003"

    # Mutación vía UPDATE SQL directo debe fallar en el trigger de PostgreSQL
    with pytest.raises(IntegrityError):
        db_session.execute(
            update(Atajadero)
            .where(Atajadero.id == atajadero.id)
            .values(codigo_unico="ATJ-FSA-9999")
        )
        db_session.commit()
    db_session.rollback()

    # Código único duplicado
    duplicado = Atajadero(
        codigo_unico="ATJ-FSA-0003",
        nombre_referencia="Duplicado",
        latitud=-25.25,
        longitud=-58.55,
        departamento="Pilcomayo",
        cuenca_riacho="Riacho He-Hé",
    )
    db_session.add(duplicado)
    with pytest.raises(IntegrityError):
        db_session.commit()
    db_session.rollback()

    # Coordenadas fuera de Formosa
    fuera_de_rango = Atajadero(
        codigo_unico="ATJ-FSA-0004",
        nombre_referencia="Buenos Aires",
        latitud=-34.60,
        longitud=-58.38,
        departamento="Patiño",
        cuenca_riacho="Riacho Pilagá",
    )
    db_session.add(fuera_de_rango)
    with pytest.raises(IntegrityError):
        db_session.commit()
    db_session.rollback()

    # Valores fuera de los StrEnum permitidos
    for kwargs in (
        {"estado": "invalido"},
        {"interrumpe_escurrimiento": "tal_vez"},
        {"tipo_emplazamiento": "dique_marino"},
        {"categoria_dato": "simulado"},
    ):
        invalido = Atajadero(
            codigo_unico="ATJ-FSA-0005",
            nombre_referencia="Enum Inválido",
            latitud=-25.10,
            longitud=-59.20,
            departamento="Patiño",
            cuenca_riacho="Riacho Pilagá",
            **kwargs,
        )
        db_session.add(invalido)
        with pytest.raises(IntegrityError):
            db_session.commit()
        db_session.rollback()


def test_inspeccion_relacion_1_a_n_append_only_y_entradas_invalidas(db_session: Session) -> None:
    inspector = User(
        name="Inspector Formosa",
        email="inspector.atajaderos@formosa.gob.ar",
        role=UserRole.INSPECTOR.value,
        hashed_password=hash_password("ClaveSegura123!"),
    )
    db_session.add(inspector)
    db_session.flush()

    atajadero = Atajadero(
        codigo_unico="ATJ-FSA-0006",
        nombre_referencia="Laguna Gallo",
        latitud=-25.12,
        longitud=-59.45,
        departamento="Patiño",
        cuenca_riacho="Sistema Riacho Monte Lindo",
        created_by_id=inspector.id,
    )
    db_session.add(atajadero)
    db_session.flush()

    base_time = datetime(2026, 11, 10, 12, 0, tzinfo=UTC)
    hash_1 = "a" * 64
    hash_2 = "b" * 64
    hash_3 = "c" * 64

    inspecciones = [
        Inspeccion(
            atajadero_id=atajadero.id,
            inspector_id=inspector.id,
            responsable=inspector.name,
            fecha_inspeccion=base_time,
            tipo_registro=TipoRegistro.INSPECCION.value,
            estado_observado=EstadoAtajadero.CON_DETERIORO.value,
            interrumpe_escurrimiento=InterrupcionEscurrimiento.SI.value,
            indicadores_visuales=[
                IndicadorVisual.CIERRE_TOTAL_SIN_VERTEDERO.value,
                IndicadorVisual.RIESGO_SOBREPASO_BORDE_LIBRE.value,
            ],
            observaciones="Primera visita presencial con cierre de cauce sin vertedero.",
            evidencia_fotos=["/uploads/atj_0006_1.jpg"],
            fotos_hashes_sha256=[hash_1],
        ),
        Inspeccion(
            atajadero_id=atajadero.id,
            inspector_id=inspector.id,
            responsable=inspector.name,
            fecha_inspeccion=base_time + timedelta(days=3),
            tipo_registro=TipoRegistro.INTERVENCION.value,
            estado_observado=EstadoAtajadero.CON_DETERIORO.value,
            interrumpe_escurrimiento=InterrupcionEscurrimiento.SI.value,
            indicadores_visuales=[IndicadorVisual.GRIETAS_O_BIOPERTURBACION.value],
            observaciones="Intimación formal y replanteo de aliviadero lateral.",
            evidencia_fotos=["/uploads/atj_0006_2.jpg"],
            fotos_hashes_sha256=[hash_2],
        ),
        Inspeccion(
            atajadero_id=atajadero.id,
            inspector_id=inspector.id,
            responsable=inspector.name,
            fecha_inspeccion=base_time + timedelta(days=7),
            tipo_registro=TipoRegistro.INSPECCION.value,
            estado_observado=EstadoAtajadero.OPERATIVO.value,
            interrumpe_escurrimiento=InterrupcionEscurrimiento.NO.value,
            indicadores_visuales=[],
            observaciones="Verificación posterior a apertura de vertedero funcional.",
            evidencia_fotos=["/uploads/atj_0006_3.jpg"],
            fotos_hashes_sha256=[hash_3],
        ),
    ]
    db_session.add_all(inspecciones)
    db_session.commit()
    db_session.expire_all()

    cargado = db_session.execute(
        select(Atajadero)
        .options(selectinload(Atajadero.inspecciones))
        .where(Atajadero.codigo_unico == "ATJ-FSA-0006")
    ).scalar_one()

    assert len(cargado.inspecciones) == 3
    fechas = [item.fecha_inspeccion for item in cargado.inspecciones]
    assert fechas == sorted(fechas, reverse=True)
    assert cargado.inspecciones[0].id.version == 4
    assert cargado.inspecciones[0].estado_observado_enum is EstadoAtajadero.OPERATIVO
    assert cargado.inspecciones[1].tipo_registro_enum is TipoRegistro.INTERVENCION
    assert cargado.inspecciones[2].interrumpe_escurrimiento_enum is InterrupcionEscurrimiento.SI
    assert cargado.inspecciones[2].fotos_hashes_sha256 == [hash_1]

    # Entrada inválida: tipo_registro o estado_observado inexistente
    for campo_invalido in (
        {"tipo_registro": "auditoria_externa"},
        {"estado_observado": "destruido"},
        {"interrumpe_escurrimiento": "desconocido"},
    ):
        bad_insp = Inspeccion(
            atajadero_id=atajadero.id,
            responsable="Inspector",
            tipo_registro=campo_invalido.get("tipo_registro", TipoRegistro.INSPECCION.value),
            estado_observado=campo_invalido.get(
                "estado_observado", EstadoAtajadero.OPERATIVO.value
            ),
            interrumpe_escurrimiento=campo_invalido.get(
                "interrumpe_escurrimiento", InterrupcionEscurrimiento.NO.value
            ),
            observaciones="Observación de prueba para validar check constraint.",
        )
        db_session.add(bad_insp)
        with pytest.raises(IntegrityError):
            db_session.commit()
        db_session.rollback()

    # Entrada inválida: FK atajadero_id inexistente
    huerfana = Inspeccion(
        atajadero_id=uuid.uuid4(),
        responsable="Inspector",
        estado_observado=EstadoAtajadero.OPERATIVO.value,
        observaciones="Intento con atajadero_id inexistente.",
    )
    db_session.add(huerfana)
    with pytest.raises(IntegrityError):
        db_session.commit()
    db_session.rollback()
