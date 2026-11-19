from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.enums.user_role import UserRole
from app.seeds.seed_demo import seed_demo_users


def test_seed_demo_es_idempotente_y_login_jwt_funciona(
    client: TestClient, db_session: Session
) -> None:
    seed_demo_users(db_session)
    users = seed_demo_users(db_session)

    assert len(users) == 2

    login_response = client.post(
        "/api/auth/login",
        json={"email": "referente@atajaderos.ar", "password": "password"},
    )
    assert login_response.status_code == 200
    data = login_response.json()
    assert data["token_type"] == "bearer"
    assert data["user"]["role"] == UserRole.REFERENTE_MESA.value

    me_response = client.get(
        "/api/auth/me",
        headers={"Authorization": f"Bearer {data['access_token']}"},
    )
    assert me_response.status_code == 200
    assert me_response.json()["email"] == "referente@atajaderos.ar"


def test_login_rechaza_credenciales_invalidas_y_entrada_malformada(
    client: TestClient, db_session: Session
) -> None:
    seed_demo_users(db_session)

    wrong_password = client.post(
        "/api/auth/login",
        json={"email": "inspector@atajaderos.ar", "password": "clave_incorrecta"},
    )
    assert wrong_password.status_code == 401

    invalid_email = client.post(
        "/api/auth/login",
        json={"email": "correo-invalido", "password": ""},
    )
    assert invalid_email.status_code == 422

    unauthenticated = client.get("/api/auth/me")
    assert unauthenticated.status_code == 401
