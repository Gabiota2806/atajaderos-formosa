from fastapi import APIRouter

from app.core.config import settings
from app.schemas.health import HealthResponse

router = APIRouter(tags=["Salud"])


@router.get("/health", response_model=HealthResponse)
def health_check() -> HealthResponse:
    ia_modo = "ia_asistida" if settings.gemini_api_key.strip() else "deterministico_offline"
    return HealthResponse(
        status="ok",
        es_prototipo=True,
        leyenda="PROTOTIPO · AI LAB Misión: Código Formosa · no es una herramienta oficial",
        proyecto="AI LAB Misión: Código Formosa · Desafío 1: Atajaderos (Equipo 6 UTN)",
        ia_modo=ia_modo,
    )
