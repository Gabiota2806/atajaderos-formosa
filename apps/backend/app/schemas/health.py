from pydantic import BaseModel


class HealthResponse(BaseModel):
    status: str
    es_prototipo: bool
    leyenda: str
    proyecto: str
    ia_modo: str
