from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.user import User
from app.schemas.asistente import AsistenteRequest, AsistenteResponse
from app.services.asistente_ia import estructurar_nota, resumir_triage

router = APIRouter(tags=["asistente"])


@router.post("/asistente/resumir", response_model=AsistenteResponse)
def resumir(
    payload: AsistenteRequest,
    _current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
) -> AsistenteResponse:
    if payload.modo == "estructurar_nota_campo":
        return estructurar_nota(payload.texto_campo or "")

    try:
        return resumir_triage(db, payload.codigo_unico or "")
    except LookupError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No existe el atajadero {exc}.",
        ) from exc
