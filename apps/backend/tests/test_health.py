from fastapi.testclient import TestClient


def test_health_check_declara_condicion_de_prototipo(client: TestClient) -> None:
    response = client.get("/api/health")

    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "ok"
    assert body["es_prototipo"] is True
    assert (
        body["leyenda"]
        == "PROTOTIPO · AI LAB Misión: Código Formosa · no es una herramienta oficial"
    )
    assert body["ia_modo"] in {"ia_asistida", "deterministico_offline"}
