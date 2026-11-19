from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.api.helpers import UPLOADS_DIR
from app.api.routes import atajaderos, auth, health, inspecciones
from app.core.config import settings

UPLOADS_DIR.mkdir(parents=True, exist_ok=True)

app = FastAPI(
    title=settings.app_name,
    description=(
        "PROTOTIPO · AI LAB Misión: Código Formosa · no es una herramienta oficial. "
        "API REST para el inventario territorial de atajaderos (Equipo 6 UTN)."
    ),
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/uploads", StaticFiles(directory=str(UPLOADS_DIR)), name="uploads")

app.include_router(health.router, prefix="/api")
app.include_router(auth.router, prefix="/api")
app.include_router(atajaderos.router, prefix="/api")
app.include_router(inspecciones.router, prefix="/api")
