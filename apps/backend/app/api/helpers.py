import hashlib
import json
import re
import uuid
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

from fastapi import HTTPException, Request, status
from pydantic import ValidationError
from sqlalchemy import text
from sqlalchemy.orm import Session
from starlette.datastructures import UploadFile as StarletteUploadFile

from app.enums import EstadoAtajadero
from app.models.atajadero import Atajadero
from app.schemas.atajadero import AtajaderoDetail, AtajaderoSummary
from app.schemas.inspeccion import InspeccionResponse

LEYENDA_PROTOTIPO = "PROTOTIPO · AI LAB Misión: Código Formosa · no es una herramienta oficial"
UPLOADS_DIR = Path(__file__).resolve().parents[2] / "uploads"
MAX_UPLOAD_BYTES = 5 * 1024 * 1024

ALLOWED_IMAGE_MIME_TO_EXT: dict[str, str] = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
}

_EVIDENCIA_MARKER_RE = re.compile(r"\[EVIDENCIA_INICIAL:(\{.*?\})\]")


def sanitize_validation_errors(exc: ValidationError) -> list[dict[str, Any]]:
    """Convierte errores de Pydantic en estructuras 100 % JSON-serializables."""
    sanitized: list[dict[str, Any]] = []
    for err in exc.errors():
        loc = [part if isinstance(part, int) else str(part) for part in err.get("loc", ())]
        sanitized.append(
            {
                "loc": loc,
                "msg": str(err.get("msg", "Error de validación.")),
                "type": str(err.get("type", "value_error")),
            }
        )
    return sanitized


def _has_valid_image_signature(content: bytes, mime_type: str) -> bool:
    if mime_type == "image/jpeg":
        return content.startswith(b"\xff\xd8\xff")
    if mime_type == "image/png":
        return content.startswith(b"\x89PNG\r\n\x1a\n")
    if mime_type == "image/webp":
        return len(content) >= 12 and content[:4] == b"RIFF" and content[8:12] == b"WEBP"
    return False


async def save_validated_image(
    upload: StarletteUploadFile,
    prefix: str,
) -> tuple[str, str, Path]:
    """Valida MIME, tamaño (<= 5 MB) y firma binaria, guarda en /uploads y calcula SHA-256."""
    raw_content_type = (upload.content_type or "").split(";")[0].strip().lower()
    ext = ALLOWED_IMAGE_MIME_TO_EXT.get(raw_content_type)
    if ext is None:
        await upload.close()
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="Tipo de archivo no permitido. Solo se aceptan imágenes JPEG, PNG o WEBP.",
        )

    try:
        content = await upload.read(MAX_UPLOAD_BYTES + 1)
    finally:
        await upload.close()

    if len(content) == 0:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="El archivo de imagen está vacío.",
        )

    if len(content) > MAX_UPLOAD_BYTES:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="La imagen supera el tamaño máximo permitido de 5 MB.",
        )

    if not _has_valid_image_signature(content, raw_content_type):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="El contenido del archivo no corresponde a una imagen válida (JPEG/PNG/WEBP).",
        )

    sha256_hex = hashlib.sha256(content).hexdigest()
    safe_prefix = re.sub(r"[^a-zA-Z0-9_-]", "_", prefix).strip("_") or "evidencia"
    filename = f"{safe_prefix}_{uuid.uuid4().hex[:12]}{ext}"

    UPLOADS_DIR.mkdir(parents=True, exist_ok=True)
    file_path = UPLOADS_DIR / filename
    file_path.write_bytes(content)

    return f"/uploads/{filename}", sha256_hex, file_path


def cleanup_files(paths: list[Path]) -> None:
    """Elimina archivos recién subidos si la transacción falla."""
    for path in paths:
        path.unlink(missing_ok=True)


def generate_next_codigo_unico(db: Session) -> str:
    """Genera el siguiente código secuencial inmutable con formato ATJ-FSA-NNNN."""
    max_num = db.execute(
        text(
            "SELECT COALESCE("
            "MAX(CAST(substring(codigo_unico FROM '^ATJ-FSA-([0-9]+)$') AS INTEGER)), "
            "0) FROM atajaderos WHERE codigo_unico ~ '^ATJ-FSA-[0-9]+$'"
        )
    ).scalar_one()
    return f"ATJ-FSA-{int(max_num) + 1:04d}"


def validate_estado_transition(estado_actual: str, estado_nuevo: EstadoAtajadero) -> None:
    """Valida la máquina de estados del atajadero prohibiendo regresar a sin_validar."""
    if estado_nuevo == EstadoAtajadero.SIN_VALIDAR:
        if estado_actual != EstadoAtajadero.SIN_VALIDAR.value:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
                detail=(
                    f"Transición prohibida: un atajadero ya validado en estado '{estado_actual}' "
                    "no puede regresar a 'sin_validar'."
                ),
            )
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail=(
                "Una inspección o intervención presencial debe asignar un estado técnico "
                "validado ('operativo', 'con_deterioro' o 'fuera_de_servicio'), no 'sin_validar'."
            ),
        )


def ensure_utc(dt: datetime | None) -> datetime:
    """Normaliza un datetime opcional a UTC con zona horaria."""
    if dt is None:
        return datetime.now(UTC)
    if dt.tzinfo is None:
        return dt.replace(tzinfo=UTC)
    return dt.astimezone(UTC)


def parse_indicadores_form(raw_values: list[Any]) -> list[str]:
    """Parsea indicadores visuales desde campos repetidos, JSON array o CSV en form-data."""
    indicadores: list[str] = []
    for raw in raw_values:
        if isinstance(raw, StarletteUploadFile):
            continue
        text_val = str(raw).strip()
        if not text_val:
            continue
        if text_val.startswith("["):
            try:
                parsed = json.loads(text_val)
            except json.JSONDecodeError:
                indicadores.append(text_val)
                continue
            if isinstance(parsed, list):
                for item in parsed:
                    item_str = str(item).strip()
                    if item_str:
                        indicadores.append(item_str)
            else:
                indicadores.append(text_val)
        else:
            for token in text_val.split(","):
                cleaned = token.strip()
                if cleaned:
                    indicadores.append(cleaned)
    return indicadores


async def extract_body_and_uploads(
    request: Request,
    list_fields: set[str] | None = None,
) -> tuple[dict[str, Any], list[StarletteUploadFile]]:
    """Extrae payload diccionario y archivos foto/fotos desde JSON o multipart/form-data."""
    content_type = (request.headers.get("content-type") or "").lower()
    raw_data: dict[str, Any] = {}
    uploads: list[StarletteUploadFile] = []

    if "multipart/form-data" in content_type or "application/x-www-form-urlencoded" in content_type:
        form = await request.form()
        collected_lists: dict[str, list[Any]] = {field: [] for field in (list_fields or set())}
        for key, value in form.multi_items():
            if isinstance(value, StarletteUploadFile):
                if key in {"foto", "fotos"} and not (value.filename == "" and value.size == 0):
                    uploads.append(value)
            elif key in collected_lists:
                collected_lists[key].append(value)
            elif key not in raw_data:
                raw_data[key] = value
        for field, values in collected_lists.items():
            if values:
                raw_data[field] = parse_indicadores_form(values)
        return raw_data, uploads

    try:
        body = await request.json()
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="El cuerpo de la solicitud debe ser JSON válido o multipart/form-data.",
        ) from exc
    if not isinstance(body, dict):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="El payload JSON debe ser un objeto.",
        )
    return body, uploads


def format_evidencia_inicial_nota(
    descripcion: str,
    fotos: list[str],
    hashes: list[str],
) -> str:
    """Adjunta la referencia de fotos SHA-256 iniciales al texto de aviso sin crear inspección."""
    if not fotos:
        return descripcion
    payload = json.dumps({"fotos": fotos, "hashes": hashes}, separators=(",", ":"))
    return f"{descripcion}\n[EVIDENCIA_INICIAL:{payload}]"


def extract_evidencia_inicial(observaciones_iniciales: str | None) -> tuple[list[str], list[str]]:
    """Extrae rutas /uploads y hashes SHA-256 de la evidencia inicial de un aviso."""
    if not observaciones_iniciales:
        return [], []
    match = _EVIDENCIA_MARKER_RE.search(observaciones_iniciales)
    if match is None:
        return [], []
    try:
        data = json.loads(match.group(1))
    except json.JSONDecodeError:
        return [], []
    fotos = data.get("fotos", [])
    hashes = data.get("hashes", [])
    if not isinstance(fotos, list) or not isinstance(hashes, list):
        return [], []
    return [str(f) for f in fotos], [str(h) for h in hashes]


def build_atajadero_summary(atajadero: Atajadero, total_inspecciones: int) -> AtajaderoSummary:
    """Construye AtajaderoSummary con total_inspecciones explícito."""
    return AtajaderoSummary(
        id=atajadero.id,
        codigo_unico=atajadero.codigo_unico,
        nombre_referencia=atajadero.nombre_referencia,
        latitud=atajadero.latitud,
        longitud=atajadero.longitud,
        departamento=atajadero.departamento,
        cuenca_riacho=atajadero.cuenca_riacho,
        tipo_emplazamiento=atajadero.tipo_emplazamiento_enum,
        estado=atajadero.estado_enum,
        interrumpe_escurrimiento=atajadero.interrumpe_escurrimiento_enum,
        categoria_dato=atajadero.categoria_dato_enum,
        criterio_validado_por=atajadero.criterio_validado_por,
        observaciones_iniciales=atajadero.observaciones_iniciales,
        reportado_por=atajadero.reportado_por,
        fuente_referencia=atajadero.fuente_referencia,
        fecha_ultima_inspeccion=atajadero.fecha_ultima_inspeccion,
        total_inspecciones=total_inspecciones,
        created_at=atajadero.created_at,
        updated_at=atajadero.updated_at,
    )


def build_atajadero_detail(atajadero: Atajadero) -> AtajaderoDetail:
    """Construye AtajaderoDetail con historial 1:N ordenado DESC y evidencia inicial."""
    evidencia_fotos, evidencia_hashes = extract_evidencia_inicial(atajadero.observaciones_iniciales)
    inspecciones = [InspeccionResponse.model_validate(item) for item in atajadero.inspecciones]
    return AtajaderoDetail(
        id=atajadero.id,
        codigo_unico=atajadero.codigo_unico,
        nombre_referencia=atajadero.nombre_referencia,
        latitud=atajadero.latitud,
        longitud=atajadero.longitud,
        departamento=atajadero.departamento,
        cuenca_riacho=atajadero.cuenca_riacho,
        tipo_emplazamiento=atajadero.tipo_emplazamiento_enum,
        estado=atajadero.estado_enum,
        interrumpe_escurrimiento=atajadero.interrumpe_escurrimiento_enum,
        categoria_dato=atajadero.categoria_dato_enum,
        criterio_validado_por=atajadero.criterio_validado_por,
        observaciones_iniciales=atajadero.observaciones_iniciales,
        reportado_por=atajadero.reportado_por,
        fuente_referencia=atajadero.fuente_referencia,
        fecha_ultima_inspeccion=atajadero.fecha_ultima_inspeccion,
        total_inspecciones=len(inspecciones),
        created_at=atajadero.created_at,
        updated_at=atajadero.updated_at,
        inspecciones=inspecciones,
        evidencia_inicial_fotos=evidencia_fotos,
        evidencia_inicial_hashes_sha256=evidencia_hashes,
    )
