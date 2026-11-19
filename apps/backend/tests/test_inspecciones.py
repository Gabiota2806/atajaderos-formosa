import hashlib
import json
import uuid
from collections.abc import Generator
from datetime import UTC, datetime, timedelta
from pathlib import Path

import pytest
from fastapi.testclient import TestClient
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
from app.models import Atajadero, User

UPLOADS_DIR = Path(__file__).resolve().parents[1] / "uploads"
VALID_JPEG_BYTES = b"\xff\xd8\xff\xe0\x00\x10JFIF\x00\x01\x01\x00\x00\x01\x00\x01\x00\x00\xff\xd9"
VALID_PNG_BYTES = (
    b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01"
    b"\x00\x00\x00\x01\x08\x02\x00\x00\x00\x90wS\xde"
)


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
) -> tuple[User, dict[str, str]]:
    user = User(
        name="Inspector Campo Formosa",
        email=f"{role.value}.{uuid.uuid4().hex[:6]}@formosa.gob.ar",
        role=role.value,
        hashed_password=hash_password("ClaveSegura123!"),
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    token = create_access_token(subject=user.email, role=user.role)
    return user, {"Authorization": f"Bearer {token}"}


def _seed_atajadero(
    db_session: Session,
    codigo_unico: str = "ATJ-FSA-0001",
    estado: EstadoAtajadero = EstadoAtajadero.SIN_VALIDAR,
    interrumpe: InterrupcionEscurrimiento = InterrupcionEscurrimiento.A_VERIFICAR,
) -> Atajadero:
    atajadero = Atajadero(
        codigo_unico=codigo_unico,
        nombre_referencia="Laguna Gallo — Riacho Monte Lindo",
        latitud=-25.12,
        longitud=-59.45,
        departamento="Patiño",
        cuenca_riacho="Sistema Riacho Monte Lindo",
        tipo_emplazamiento=TipoEmplazamiento.EN_CAUCE_ACTIVO.value,
        estado=estado.value,
        interrumpe_escurrimiento=interrumpe.value,
        categoria_dato=CategoriaDato.SIMULADO.value,
    )
    db_session.add(atajadero)
    db_session.commit()
    db_session.refresh(atajadero)
    return atajadero


def test_inspecciones_e_importador_requieren_jwt(client: TestClient) -> None:
    resp_insp = client.post(
        "/api/atajaderos/ATJ-FSA-0001/inspecciones",
        json={
            "tipo_registro": "inspeccion",
            "estado_observado": "operativo",
            "interrumpe_escurrimiento": "no",
            "observaciones": "Verificación sin autenticación.",
        },
    )
    assert resp_insp.status_code == 401

    resp_kobo = client.post(
        "/api/atajaderos/importar-kobo",
        json={"registros": [{"nombre_referencia": "Test"}]},
    )
    assert resp_kobo.status_code == 401


def test_registrar_inspeccion_multipart_con_foto_sha256_y_checklist_fao(
    client: TestClient,
    db_session: Session,
) -> None:
    inspector, headers = _auth_headers(db_session, UserRole.INSPECTOR)
    _seed_atajadero(db_session, codigo_unico="ATJ-FSA-0001")
    expected_sha256 = hashlib.sha256(VALID_JPEG_BYTES).hexdigest()

    resp = client.post(
        "/api/atajaderos/ATJ-FSA-0001/inspecciones",
        headers=headers,
        data={
            "tipo_registro": TipoRegistro.INSPECCION.value,
            "estado_observado": EstadoAtajadero.CON_DETERIORO.value,
            "interrumpe_escurrimiento": InterrupcionEscurrimiento.SI.value,
            "indicadores_visuales": json.dumps(
                [
                    IndicadorVisual.CIERRE_TOTAL_SIN_VERTEDERO.value,
                    IndicadorVisual.RIESGO_SOBREPASO_BORDE_LIBRE.value,
                ]
            ),
            "observaciones": (
                "Cierre total del riacho sin aliviadero funcional y riesgo de sobrepaso."
            ),
        },
        files={"foto": ("evidencia_campo.jpg", VALID_JPEG_BYTES, "image/jpeg")},
    )
    assert resp.status_code == 201
    insp = resp.json()
    assert insp["responsable"] == inspector.name
    assert insp["estado_observado"] == EstadoAtajadero.CON_DETERIORO.value
    assert insp["interrumpe_escurrimiento"] == InterrupcionEscurrimiento.SI.value
    assert insp["indicadores_visuales"] == [
        IndicadorVisual.CIERRE_TOTAL_SIN_VERTEDERO.value,
        IndicadorVisual.RIESGO_SOBREPASO_BORDE_LIBRE.value,
    ]
    assert len(insp["evidencia_fotos"]) == 1
    foto_url = insp["evidencia_fotos"][0]
    assert foto_url.startswith("/uploads/")
    assert len(insp["fotos_hashes_sha256"]) == 1
    assert len(insp["fotos_hashes_sha256"][0]) == 64
    assert insp["fotos_hashes_sha256"][0] == expected_sha256

    descarga = client.get(foto_url)
    assert descarga.status_code == 200
    assert descarga.content == VALID_JPEG_BYTES

    detalle = client.get("/api/atajaderos/ATJ-FSA-0001", headers=headers)
    assert detalle.status_code == 200
    det = detalle.json()
    assert det["codigo_unico"] == "ATJ-FSA-0001"
    assert det["estado"] == EstadoAtajadero.CON_DETERIORO.value
    assert det["interrumpe_escurrimiento"] == InterrupcionEscurrimiento.SI.value
    assert det["fecha_ultima_inspeccion"] is not None
    assert det["total_inspecciones"] == 1
    assert inspector.name in (det["criterio_validado_por"] or "")


def test_maquina_estados_transiciones_validas_append_only(
    client: TestClient,
    db_session: Session,
) -> None:
    _, headers = _auth_headers(db_session, UserRole.INSPECTOR)
    _seed_atajadero(db_session, codigo_unico="ATJ-FSA-0004")
    base_dt = datetime(2026, 11, 15, 9, 0, tzinfo=UTC)

    r1 = client.post(
        "/api/atajaderos/ATJ-FSA-0004/inspecciones",
        headers=headers,
        json={
            "tipo_registro": "inspeccion",
            "estado_observado": "con_deterioro",
            "interrumpe_escurrimiento": "si",
            "indicadores_visuales": ["filtracion_turbia_tubificacion"],
            "observaciones": "Se observa filtración turbia al pie del terraplén.",
            "fecha_inspeccion": base_dt.isoformat(),
        },
    )
    assert r1.status_code == 201

    r2 = client.post(
        "/api/atajaderos/ATJ-FSA-0004/inspecciones",
        headers=headers,
        json={
            "tipo_registro": "intervencion",
            "estado_observado": "operativo",
            "interrumpe_escurrimiento": "no",
            "indicadores_visuales": [],
            "observaciones": "Apertura de vertedero lateral y estabilización ejecutada.",
            "fecha_inspeccion": (base_dt + timedelta(days=1)).isoformat(),
        },
    )
    assert r2.status_code == 201

    r3 = client.post(
        "/api/atajaderos/ATJ-FSA-0004/inspecciones",
        headers=headers,
        json={
            "tipo_registro": "intervencion",
            "estado_observado": "fuera_de_servicio",
            "interrumpe_escurrimiento": "no",
            "indicadores_visuales": [],
            "observaciones": "Remoción mecánica completa sobre cauce activo por ordenanza.",
            "fecha_inspeccion": (base_dt + timedelta(days=2)).isoformat(),
        },
    )
    assert r3.status_code == 201

    detalle = client.get("/api/atajaderos/ATJ-FSA-0004", headers=headers)
    assert detalle.status_code == 200
    body = detalle.json()
    assert body["codigo_unico"] == "ATJ-FSA-0004"
    assert body["estado"] == EstadoAtajadero.FUERA_DE_SERVICIO.value
    assert body["interrumpe_escurrimiento"] == InterrupcionEscurrimiento.NO.value
    assert body["total_inspecciones"] == 3
    estados_historial = [item["estado_observado"] for item in body["inspecciones"]]
    assert estados_historial == ["fuera_de_servicio", "operativo", "con_deterioro"]


def test_inspeccion_rechaza_transiciones_prohibidas_y_entradas_invalidas_422_y_404(
    client: TestClient,
    db_session: Session,
) -> None:
    _, headers = _auth_headers(db_session, UserRole.INSPECTOR)
    _seed_atajadero(
        db_session,
        codigo_unico="ATJ-FSA-0007",
        estado=EstadoAtajadero.SIN_VALIDAR,
    )
    _seed_atajadero(
        db_session,
        codigo_unico="ATJ-FSA-0008",
        estado=EstadoAtajadero.CON_DETERIORO,
        interrumpe=InterrupcionEscurrimiento.SI,
    )
    antes = {p.name for p in UPLOADS_DIR.iterdir()}

    inexistente = client.post(
        "/api/atajaderos/ATJ-FSA-9999/inspecciones",
        headers=headers,
        json={
            "tipo_registro": "inspeccion",
            "estado_observado": "operativo",
            "interrumpe_escurrimiento": "no",
            "observaciones": "Intento sobre código inexistente.",
        },
    )
    assert inexistente.status_code == 404

    sin_validar_a_sin_validar = client.post(
        "/api/atajaderos/ATJ-FSA-0007/inspecciones",
        headers=headers,
        json={
            "tipo_registro": "inspeccion",
            "estado_observado": "sin_validar",
            "interrumpe_escurrimiento": "a_verificar",
            "observaciones": "Visita sin asignar estado técnico validado.",
        },
    )
    assert sin_validar_a_sin_validar.status_code == 422

    regresion_prohibida = client.post(
        "/api/atajaderos/ATJ-FSA-0008/inspecciones",
        headers=headers,
        json={
            "tipo_registro": "inspeccion",
            "estado_observado": "sin_validar",
            "interrumpe_escurrimiento": "a_verificar",
            "observaciones": "Intento de regresar un activo validado a sin_validar.",
        },
    )
    assert regresion_prohibida.status_code == 422

    obs_corta = client.post(
        "/api/atajaderos/ATJ-FSA-0008/inspecciones",
        headers=headers,
        json={
            "tipo_registro": "inspeccion",
            "estado_observado": "operativo",
            "interrumpe_escurrimiento": "no",
            "observaciones": "Ok",
        },
    )
    assert obs_corta.status_code == 422

    indicador_invalido = client.post(
        "/api/atajaderos/ATJ-FSA-0008/inspecciones",
        headers=headers,
        json={
            "tipo_registro": "inspeccion",
            "estado_observado": "operativo",
            "interrumpe_escurrimiento": "no",
            "indicadores_visuales": ["indicador_inexistente"],
            "observaciones": "Indicador no contemplado en protocolo FAO/FHWA.",
        },
    )
    assert indicador_invalido.status_code == 422

    mutar_codigo = client.post(
        "/api/atajaderos/ATJ-FSA-0008/inspecciones",
        headers=headers,
        json={
            "codigo_unico": "ATJ-FSA-8888",
            "tipo_registro": "inspeccion",
            "estado_observado": "operativo",
            "interrumpe_escurrimiento": "no",
            "observaciones": "Intento de mutar codigo_unico desde payload.",
        },
    )
    assert mutar_codigo.status_code == 422

    archivo_invalido = client.post(
        "/api/atajaderos/ATJ-FSA-0008/inspecciones",
        headers=headers,
        data={
            "tipo_registro": "inspeccion",
            "estado_observado": "operativo",
            "interrumpe_escurrimiento": "no",
            "observaciones": "Adjunto inválido en inspección presencial.",
        },
        files={"foto": ("malware.exe", b"MZ\x90\x00", "application/octet-stream")},
    )
    assert archivo_invalido.status_code == 422

    archivo_grande = client.post(
        "/api/atajaderos/ATJ-FSA-0008/inspecciones",
        headers=headers,
        data={
            "tipo_registro": "inspeccion",
            "estado_observado": "operativo",
            "interrumpe_escurrimiento": "no",
            "observaciones": "Imagen PNG que excede el máximo de 5 MB permitido.",
        },
        files={
            "foto": (
                "enorme.png",
                VALID_PNG_BYTES[:8] + (b"\x00" * (5 * 1024 * 1024 + 64)),
                "image/png",
            )
        },
    )
    assert archivo_grande.status_code == 422

    despues = {p.name for p in UPLOADS_DIR.iterdir()}
    assert despues == antes


def test_importar_kobo_lote_mixto_crea_actualiza_y_reporta_errores(
    client: TestClient,
    db_session: Session,
) -> None:
    _, headers = _auth_headers(db_session, UserRole.REFERENTE_MESA)
    _seed_atajadero(
        db_session,
        codigo_unico="ATJ-FSA-0001",
        estado=EstadoAtajadero.CON_DETERIORO,
        interrumpe=InterrupcionEscurrimiento.SI,
    )

    resp = client.post(
        "/api/atajaderos/importar-kobo",
        headers=headers,
        json={
            "registros": [
                {
                    "nombre_referencia": "Hipótesis Sentinel-2 Riacho Pilagá",
                    "latitud": -25.45,
                    "longitud": -58.95,
                    "departamento": "Patiño",
                    "cuenca_riacho": "Riacho Pilagá",
                    "categoria_dato": "REFERENCIA",
                    "fuente_referencia": "Google Earth Engine / Sentinel-2",
                },
                {
                    "codigo_unico": "ATJ-FSA-0020",
                    "nombre_referencia": "Relevamiento Kobo QField RN 81",
                    "latitud": -24.72,
                    "longitud": -60.15,
                    "departamento": "Patiño",
                    "cuenca_riacho": "Bañado La Estrella",
                    "tipo_emplazamiento": "lateral_fuera_de_cauce",
                    "estado_observado": "operativo",
                    "interrumpe_escurrimiento": "no",
                    "categoria_dato": "SIMULADO",
                    "observaciones": "Carga offline sincronizada desde formulario KoboToolbox.",
                },
                {
                    "codigo_unico": "ATJ-FSA-0001",
                    "tipo_registro": "intervencion",
                    "estado_observado": "operativo",
                    "interrumpe_escurrimiento": "no",
                    "indicadores_visuales": [],
                    "observaciones": "Apertura de vertedero registrada en QField offline.",
                },
                {
                    "nombre_referencia": "Registro Inválido Fuera de Formosa",
                    "latitud": -34.60,
                    "longitud": -58.38,
                    "departamento": "Capital",
                    "cuenca_riacho": "Río de la Plata",
                },
                {
                    "codigo_unico": "ATJ-FSA-0001",
                    "estado_observado": "sin_validar",
                    "interrumpe_escurrimiento": "a_verificar",
                    "observaciones": "Regresión inválida hacia sin_validar en lote Kobo.",
                },
            ]
        },
    )
    assert resp.status_code == 201
    body = resp.json()
    assert body["creados"] == 2
    assert body["inspecciones_agregadas"] == 1
    assert len(body["errores"]) == 2
    assert [err["indice"] for err in body["errores"]] == [3, 4]
    assert "ATJ-FSA-0001" in body["codigos_procesados"]
    assert "ATJ-FSA-0020" in body["codigos_procesados"]

    actualizado = client.get("/api/atajaderos/ATJ-FSA-0001", headers=headers)
    assert actualizado.status_code == 200
    assert actualizado.json()["estado"] == EstadoAtajadero.OPERATIVO.value
    assert actualizado.json()["fecha_ultima_inspeccion"] is not None
    assert actualizado.json()["total_inspecciones"] == 1


def test_importar_kobo_geojson_y_lote_vacio_422(
    client: TestClient,
    db_session: Session,
) -> None:
    _, headers = _auth_headers(db_session, UserRole.REFERENTE_MESA)

    geojson_resp = client.post(
        "/api/atajaderos/importar-kobo",
        headers=headers,
        json={
            "type": "FeatureCollection",
            "features": [
                {
                    "type": "Feature",
                    "geometry": {"type": "Point", "coordinates": [-59.10, -24.65]},
                    "properties": {
                        "nombre_referencia": "Cruce RN 86 Exportado QGIS",
                        "departamento": "Pilagá",
                        "cuenca_riacho": "Riacho El Porteño",
                        "tipo_emplazamiento": "en_cauce_activo",
                        "categoria_dato": "SIMULADO",
                    },
                }
            ],
        },
    )
    assert geojson_resp.status_code == 201
    geo_body = geojson_resp.json()
    assert geo_body["creados"] == 1
    assert geo_body["errores"] == []

    assert (
        client.post(
            "/api/atajaderos/importar-kobo",
            headers=headers,
            json={"registros": []},
        ).status_code
        == 422
    )
    assert (
        client.post(
            "/api/atajaderos/importar-kobo",
            headers=headers,
            json={"type": "FeatureCollection", "features": []},
        ).status_code
        == 422
    )
    assert (
        client.post(
            "/api/atajaderos/importar-kobo",
            headers=headers,
            json={"invalido": True},
        ).status_code
        == 422
    )
