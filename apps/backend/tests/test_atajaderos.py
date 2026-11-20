import hashlib
import uuid
from collections.abc import Generator
from datetime import UTC, datetime, timedelta
from pathlib import Path

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.core.security import create_access_token, hash_password
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

UPLOADS_DIR = Path(__file__).resolve().parents[1] / "uploads"
VALID_JPEG_BYTES = b"\xff\xd8\xff\xe0\x00\x10JFIF\x00\x01\x01\x00\x00\x01\x00\x01\x00\x00\xff\xd9"
LEYENDA_ESPERADA = "PROTOTIPO · AI LAB Misión: Código Formosa · no es una herramienta oficial"


@pytest.fixture(autouse=True)
def limpiar_uploads_creados() -> Generator[None, None, None]:
    UPLOADS_DIR.mkdir(parents=True, exist_ok=True)
    previos = {p.name for p in UPLOADS_DIR.iterdir()}
    yield
    for archivo in UPLOADS_DIR.iterdir():
        if archivo.name not in previos and archivo.name != ".gitkeep":
            archivo.unlink(missing_ok=True)


def _auth_headers(
    db_session: Session,
    role: UserRole = UserRole.INSPECTOR,
    email: str | None = None,
) -> tuple[User, dict[str, str]]:
    user_email = email or f"{role.value}.{uuid.uuid4().hex[:6]}@formosa.gob.ar"
    user = User(
        name=f"Usuario {role.value}",
        email=user_email,
        role=role.value,
        hashed_password=hash_password("ClaveSegura123!"),
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    token = create_access_token(subject=user.email, role=user.role)
    return user, {"Authorization": f"Bearer {token}"}


def test_atajaderos_endpoints_protegidos_requieren_jwt(client: TestClient) -> None:
    assert client.get("/api/atajaderos").status_code == 401
    assert client.get("/api/atajaderos/geojson").status_code == 401
    assert client.get("/api/atajaderos/ATJ-FSA-0001").status_code == 401
    assert (
        client.post(
            "/api/atajaderos",
            json={
                "nombre_referencia": "Sin Token",
                "latitud": -25.1,
                "longitud": -59.4,
                "departamento": "Patiño",
                "cuenca_riacho": "Riacho Monte Lindo",
            },
        ).status_code
        == 401
    )


def test_crear_atajadero_autogenera_codigo_y_valida_duplicado_409(
    client: TestClient,
    db_session: Session,
) -> None:
    _, headers = _auth_headers(db_session, UserRole.REFERENTE_MESA)

    primero = client.post(
        "/api/atajaderos",
        headers=headers,
        json={
            "nombre_referencia": "Cruce RP 24 - Riacho El Porteño",
            "latitud": -24.9814,
            "longitud": -59.8412,
            "departamento": "Patiño",
            "cuenca_riacho": "Riacho El Porteño",
            "tipo_emplazamiento": TipoEmplazamiento.EN_CAUCE_ACTIVO.value,
            "categoria_dato": CategoriaDato.SIMULADO.value,
        },
    )
    assert primero.status_code == 201
    body_1 = primero.json()
    assert body_1["codigo_unico"] == "ATJ-FSA-0001"
    assert body_1["estado"] == EstadoAtajadero.SIN_VALIDAR.value
    assert body_1["interrumpe_escurrimiento"] == InterrupcionEscurrimiento.A_VERIFICAR.value
    assert body_1["total_inspecciones"] == 0

    segundo = client.post(
        "/api/atajaderos",
        headers=headers,
        json={
            "nombre_referencia": "Indicio Sentinel RN 86",
            "latitud": -24.65,
            "longitud": -59.10,
            "departamento": "Pilagá",
            "cuenca_riacho": "Riacho El Porteño",
            "categoria_dato": CategoriaDato.REFERENCIA.value,
        },
    )
    assert segundo.status_code == 201
    assert segundo.json()["codigo_unico"] == "ATJ-FSA-0002"

    explicito = client.post(
        "/api/atajaderos",
        headers=headers,
        json={
            "codigo_unico": "atj-fsa-0050",
            "nombre_referencia": "Tramo Inferior Riacho Salado",
            "latitud": -26.15,
            "longitud": -58.45,
            "departamento": "Laishí",
            "cuenca_riacho": "Riacho Salado",
            "tipo_emplazamiento": TipoEmplazamiento.LATERAL_FUERA_DE_CAUCE.value,
            "estado": EstadoAtajadero.OPERATIVO.value,
            "interrumpe_escurrimiento": InterrupcionEscurrimiento.NO.value,
            "categoria_dato": CategoriaDato.OBSERVADO.value,
        },
    )
    assert explicito.status_code == 201
    assert explicito.json()["codigo_unico"] == "ATJ-FSA-0050"

    geo_row = db_session.execute(
        text(
            "SELECT ST_SRID(geom), ST_X(geom), ST_Y(geom) "
            "FROM atajaderos WHERE codigo_unico = :codigo"
        ),
        {"codigo": "ATJ-FSA-0001"},
    ).one()
    assert geo_row[0] == 4326
    assert geo_row[1] == pytest.approx(-59.8412)
    assert geo_row[2] == pytest.approx(-24.9814)

    duplicado = client.post(
        "/api/atajaderos",
        headers=headers,
        json={
            "codigo_unico": "ATJ-FSA-0050",
            "nombre_referencia": "Duplicado",
            "latitud": -26.15,
            "longitud": -58.45,
            "departamento": "Laishí",
            "cuenca_riacho": "Riacho Salado",
        },
    )
    assert duplicado.status_code == 409


def test_crear_atajadero_rechaza_entradas_invalidas_422(
    client: TestClient,
    db_session: Session,
) -> None:
    _, headers = _auth_headers(db_session)

    casos_invalidos = [
        {
            "nombre_referencia": "Buenos Aires",
            "latitud": -34.60,
            "longitud": -58.38,
            "departamento": "Patiño",
            "cuenca_riacho": "Riacho Pilagá",
        },
        {
            "nombre_referencia": "Longitud Oeste Fuera de Formosa",
            "latitud": -25.00,
            "longitud": -63.00,
            "departamento": "Matacos",
            "cuenca_riacho": "Río Teuco",
        },
        {
            "nombre_referencia": "Latitud Norte Fuera de Formosa",
            "latitud": -21.50,
            "longitud": -59.50,
            "departamento": "Ramón Lista",
            "cuenca_riacho": "Bañado La Estrella",
        },
        {
            "nombre_referencia": "Estado Inválido",
            "latitud": -25.10,
            "longitud": -59.20,
            "departamento": "Patiño",
            "cuenca_riacho": "Riacho Pilagá",
            "estado": "destruido",
        },
        {
            "nombre_referencia": "Categoría Minúscula Inválida",
            "latitud": -25.10,
            "longitud": -59.20,
            "departamento": "Patiño",
            "cuenca_riacho": "Riacho Pilagá",
            "categoria_dato": "simulado",
        },
        {
            "codigo_unico": "XYZ-123",
            "nombre_referencia": "Código Malformado",
            "latitud": -25.10,
            "longitud": -59.20,
            "departamento": "Patiño",
            "cuenca_riacho": "Riacho Pilagá",
        },
        {
            "nombre_referencia": "AB",
            "latitud": -25.10,
            "longitud": -59.20,
            "departamento": "Patiño",
            "cuenca_riacho": "Riacho Pilagá",
        },
    ]

    for payload in casos_invalidos:
        resp = client.post("/api/atajaderos", headers=headers, json=payload)
        assert resp.status_code == 422


def test_listado_y_geojson_con_filtros_y_detalle_1_a_n(
    client: TestClient,
    db_session: Session,
) -> None:
    inspector, headers = _auth_headers(db_session, UserRole.INSPECTOR)
    t0 = datetime(2026, 11, 10, 10, 0, tzinfo=UTC)

    atj1 = Atajadero(
        codigo_unico="ATJ-FSA-0001",
        nombre_referencia="Laguna Gallo Sur",
        latitud=-25.12,
        longitud=-59.45,
        departamento="Patiño",
        cuenca_riacho="Sistema Riacho Monte Lindo",
        tipo_emplazamiento=TipoEmplazamiento.EN_CAUCE_ACTIVO.value,
        estado=EstadoAtajadero.CON_DETERIORO.value,
        interrumpe_escurrimiento=InterrupcionEscurrimiento.SI.value,
        categoria_dato=CategoriaDato.SIMULADO.value,
        fecha_ultima_inspeccion=t0 + timedelta(days=2),
    )
    atj2 = Atajadero(
        codigo_unico="ATJ-FSA-0002",
        nombre_referencia="Mojón de Fierro",
        latitud=-26.05,
        longitud=-58.02,
        departamento="Formosa",
        cuenca_riacho="Riacho Pilagá",
        tipo_emplazamiento=TipoEmplazamiento.LATERAL_FUERA_DE_CAUCE.value,
        estado=EstadoAtajadero.OPERATIVO.value,
        interrumpe_escurrimiento=InterrupcionEscurrimiento.NO.value,
        categoria_dato=CategoriaDato.OBSERVADO.value,
    )
    atj3 = Atajadero(
        codigo_unico="ATJ-FSA-0003",
        nombre_referencia="Monte Lindo Chico RN 11",
        latitud=-25.70,
        longitud=-58.65,
        departamento="Pirané",
        cuenca_riacho="Sistema Riacho Monte Lindo",
        tipo_emplazamiento=TipoEmplazamiento.ALCANTARILLA_VIAL.value,
        estado=EstadoAtajadero.SIN_VALIDAR.value,
        interrumpe_escurrimiento=InterrupcionEscurrimiento.A_VERIFICAR.value,
        categoria_dato=CategoriaDato.REFERENCIA.value,
    )
    db_session.add_all([atj1, atj2, atj3])
    db_session.flush()

    db_session.add_all(
        [
            Inspeccion(
                atajadero_id=atj1.id,
                inspector_id=inspector.id,
                responsable=inspector.name,
                fecha_inspeccion=t0,
                tipo_registro=TipoRegistro.INSPECCION.value,
                estado_observado=EstadoAtajadero.CON_DETERIORO.value,
                interrumpe_escurrimiento=InterrupcionEscurrimiento.SI.value,
                indicadores_visuales=[IndicadorVisual.CIERRE_TOTAL_SIN_VERTEDERO.value],
                observaciones="Primera inspección de campo en Laguna Gallo.",
            ),
            Inspeccion(
                atajadero_id=atj1.id,
                inspector_id=inspector.id,
                responsable=inspector.name,
                fecha_inspeccion=t0 + timedelta(days=2),
                tipo_registro=TipoRegistro.INTERVENCION.value,
                estado_observado=EstadoAtajadero.CON_DETERIORO.value,
                interrumpe_escurrimiento=InterrupcionEscurrimiento.SI.value,
                indicadores_visuales=[IndicadorVisual.RIESGO_SOBREPASO_BORDE_LIBRE.value],
                observaciones="Seguimiento técnico con intimación por riesgo de sobrepaso.",
            ),
        ]
    )
    db_session.commit()

    listado = client.get("/api/atajaderos", headers=headers)
    assert listado.status_code == 200
    data = listado.json()
    assert data["total"] == 3
    assert len(data["items"]) == 3
    assert data["items"][0]["codigo_unico"] == "ATJ-FSA-0001"
    assert data["items"][0]["total_inspecciones"] == 2
    assert data["items"][0]["fecha_ultima_inspeccion"] is not None

    filtrado = client.get(
        "/api/atajaderos",
        headers=headers,
        params={
            "estado": "con_deterioro",
            "interrumpe_escurrimiento": "si",
            "tipo_emplazamiento": "en_cauce_activo",
            "departamento": "Patiño",
            "cuenca_riacho": "Monte Lindo",
            "q": "Gallo",
        },
    )
    assert filtrado.status_code == 200
    assert filtrado.json()["total"] == 1
    assert filtrado.json()["items"][0]["codigo_unico"] == "ATJ-FSA-0001"

    assert (
        client.get("/api/atajaderos", headers=headers, params={"estado": "inexistente"}).status_code
        == 422
    )

    geojson_resp = client.get(
        "/api/atajaderos/geojson",
        headers=headers,
        params={"departamento": "Formosa"},
    )
    assert geojson_resp.status_code == 200
    fc = geojson_resp.json()
    assert fc["type"] == "FeatureCollection"
    assert fc["metadata"]["es_prototipo"] is True
    assert fc["metadata"]["leyenda"] == LEYENDA_ESPERADA
    assert fc["metadata"]["crs"] == "EPSG:4326"
    assert fc["metadata"]["total"] == 1
    assert len(fc["features"]) == 1
    feature = fc["features"][0]
    assert feature["type"] == "Feature"
    assert feature["id"] == "ATJ-FSA-0002"
    assert feature["geometry"]["type"] == "Point"
    assert feature["geometry"]["coordinates"] == pytest.approx([-58.02, -26.05])
    assert feature["properties"]["codigo_unico"] == "ATJ-FSA-0002"
    assert feature["properties"]["categoria_dato"] == "OBSERVADO"

    detalle = client.get("/api/atajaderos/ATJ-FSA-0001", headers=headers)
    assert detalle.status_code == 200
    det_body = detalle.json()
    assert det_body["total_inspecciones"] == 2
    assert len(det_body["inspecciones"]) == 2
    fechas = [item["fecha_inspeccion"] for item in det_body["inspecciones"]]
    assert fechas == sorted(fechas, reverse=True)

    assert client.get("/api/atajaderos/ATJ-FSA-9999", headers=headers).status_code == 404


def test_aviso_publico_forma_b_json_fuerza_sin_validar_y_ignora_estado(
    client: TestClient,
) -> None:
    resp = client.post(
        "/api/avisos",
        json={
            "nombre_referencia": "Pozo del Tigre / A° Tatú Piré",
            "latitud": -25.12,
            "longitud": -59.45,
            "departamento": "Patiño",
            "cuenca_riacho": "A° Tatú Piré",
            "descripcion_aviso": (
                "Terraplén nuevo detectado cerca del camino vecinal reteniendo agua."
            ),
            "reportado_por": "Vecino Comisión de Fomento",
            "estado": "operativo",
            "interrumpe_escurrimiento": "si",
            "tipo_emplazamiento": "en_cauce_activo",
            "categoria_dato": "OBSERVADO",
            "criterio_validado_por": "Intento de bypass",
            "codigo_unico": "ATJ-FSA-9999",
        },
    )
    assert resp.status_code == 201
    body = resp.json()
    assert body["codigo_unico"] == "ATJ-FSA-0001"
    assert body["estado"] == EstadoAtajadero.SIN_VALIDAR.value
    assert body["interrumpe_escurrimiento"] == InterrupcionEscurrimiento.A_VERIFICAR.value
    assert body["tipo_emplazamiento"] == TipoEmplazamiento.A_DETERMINAR.value
    assert body["categoria_dato"] == CategoriaDato.SIMULADO.value
    assert body["criterio_validado_por"] == "Aviso vecinal (pendiente validación presencial)"
    assert body["fecha_ultima_inspeccion"] is None
    assert body["total_inspecciones"] == 0


def test_aviso_publico_multipart_con_foto_y_sha256(
    client: TestClient,
    db_session: Session,
) -> None:
    expected_sha256 = hashlib.sha256(VALID_JPEG_BYTES).hexdigest()

    resp = client.post(
        "/api/avisos",
        data={
            "nombre_referencia": "Laguna Gallo Borde Norte",
            "latitud": "-25.12",
            "longitud": "-59.45",
            "departamento": "Patiño",
            "cuenca_riacho": "Sistema Riacho Monte Lindo",
            "descripcion_aviso": "Desborde incipiente sobre huella rural tras lluvias intensas.",
            "reportado_por": "Productor Local",
            "estado": "operativo",
        },
        files={"foto": ("aviso.jpg", VALID_JPEG_BYTES, "image/jpeg")},
    )
    assert resp.status_code == 201
    body = resp.json()
    assert body["estado"] == EstadoAtajadero.SIN_VALIDAR.value
    assert body["interrumpe_escurrimiento"] == InterrupcionEscurrimiento.A_VERIFICAR.value
    assert len(body["evidencia_inicial_fotos"]) == 1
    foto_url = body["evidencia_inicial_fotos"][0]
    assert foto_url.startswith("/uploads/")
    assert body["evidencia_inicial_hashes_sha256"] == [expected_sha256]

    descarga = client.get(foto_url)
    assert descarga.status_code == 200
    assert descarga.content == VALID_JPEG_BYTES

    _, headers = _auth_headers(db_session)
    detalle = client.get(f"/api/atajaderos/{body['codigo_unico']}", headers=headers)
    assert detalle.status_code == 200
    assert detalle.json()["evidencia_inicial_fotos"] == [foto_url]
    assert detalle.json()["evidencia_inicial_hashes_sha256"] == [expected_sha256]


def test_aviso_publico_rechaza_entradas_invalidas_422(client: TestClient) -> None:
    antes = {p.name for p in UPLOADS_DIR.iterdir()}

    fuera_formosa = client.post(
        "/api/avisos",
        json={
            "nombre_referencia": "Fuera de Provincia",
            "latitud": -34.60,
            "longitud": -58.38,
            "departamento": "Patiño",
            "cuenca_riacho": "Riacho Pilagá",
            "descripcion_aviso": "Descripción suficientemente larga para probar coordenadas.",
        },
    )
    assert fuera_formosa.status_code == 422

    desc_corta = client.post(
        "/api/avisos",
        json={
            "nombre_referencia": "Aviso Corto",
            "latitud": -25.12,
            "longitud": -59.45,
            "departamento": "Patiño",
            "cuenca_riacho": "Riacho Pilagá",
            "descripcion_aviso": "Corto",
        },
    )
    assert desc_corta.status_code == 422

    mime_invalido = client.post(
        "/api/avisos",
        data={
            "nombre_referencia": "Archivo Texto",
            "latitud": "-25.12",
            "longitud": "-59.45",
            "departamento": "Patiño",
            "cuenca_riacho": "Riacho Pilagá",
            "descripcion_aviso": "Adjunto de texto plano prohibido en el formulario.",
        },
        files={"foto": ("nota.txt", b"hola mundo", "text/plain")},
    )
    assert mime_invalido.status_code == 422

    firma_falsa = client.post(
        "/api/avisos",
        data={
            "nombre_referencia": "Firma Falsa",
            "latitud": "-25.12",
            "longitud": "-59.45",
            "departamento": "Patiño",
            "cuenca_riacho": "Riacho Pilagá",
            "descripcion_aviso": "Archivo con extensión y MIME JPEG pero contenido inválido.",
        },
        files={"foto": ("falsa.jpg", b"NO_ES_UN_JPEG_REAL", "image/jpeg")},
    )
    assert firma_falsa.status_code == 422

    archivo_gigante = client.post(
        "/api/avisos",
        data={
            "nombre_referencia": "Archivo Gigante",
            "latitud": "-25.12",
            "longitud": "-59.45",
            "departamento": "Patiño",
            "cuenca_riacho": "Riacho Pilagá",
            "descripcion_aviso": "Archivo que excede el límite de 5 MB permitido.",
        },
        files={
            "foto": (
                "grande.jpg",
                b"\xff\xd8\xff\xe0" + (b"\x00" * (5 * 1024 * 1024 + 32)),
                "image/jpeg",
            )
        },
    )
    assert archivo_gigante.status_code == 422

    despues = {p.name for p in UPLOADS_DIR.iterdir()}
    assert despues == antes
