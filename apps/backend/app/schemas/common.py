import math
import re

FORMOSA_LAT_MIN = -27.0
FORMOSA_LAT_MAX = -22.0
FORMOSA_LON_MIN = -62.5
FORMOSA_LON_MAX = -57.5

CODIGO_UNICO_PATTERN = re.compile(r"^ATJ-FSA-\d{4,}$")


def validate_formosa_latitud(value: float) -> float:
    if not math.isfinite(value) or not (FORMOSA_LAT_MIN <= value <= FORMOSA_LAT_MAX):
        raise ValueError(
            "La latitud debe ubicarse dentro del territorio de Formosa (-27.0 a -22.0)."
        )
    return value


def validate_formosa_longitud(value: float) -> float:
    if not math.isfinite(value) or not (FORMOSA_LON_MIN <= value <= FORMOSA_LON_MAX):
        raise ValueError(
            "La longitud debe ubicarse dentro del territorio de Formosa (-62.5 a -57.5)."
        )
    return value


def validate_codigo_unico(value: str | None) -> str | None:
    if value is None:
        return None
    cleaned = value.strip().upper()
    if not cleaned:
        return None
    if not CODIGO_UNICO_PATTERN.match(cleaned):
        raise ValueError(
            "El codigo_unico debe respetar el formato ATJ-FSA-NNNN (ej. ATJ-FSA-0001)."
        )
    return cleaned


def strip_text(value: str | None) -> str | None:
    if value is None:
        return None
    cleaned = value.strip()
    return cleaned or None


def strip_required_text(
    value: str,
    field_label: str,
    min_length: int,
    max_length: int | None = None,
) -> str:
    cleaned = value.strip()
    if len(cleaned) < min_length:
        raise ValueError(f"El campo '{field_label}' debe tener al menos {min_length} caracteres.")
    if max_length is not None and len(cleaned) > max_length:
        raise ValueError(f"El campo '{field_label}' no puede superar los {max_length} caracteres.")
    return cleaned
