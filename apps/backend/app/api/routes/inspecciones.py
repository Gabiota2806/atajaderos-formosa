from pathlib import Path
from typing import Annotated, Any

from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import ValidationError
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.api.helpers import (
    cleanup_files,
    ensure_utc,
    extract_body_and_uploads,
    generate_next_codigo_unico,
    sanitize_validation_errors,
    save_validated_image,
    validate_estado_transition,
)
from app.core.database import get_db
from app.enums import (
    EstadoAtajadero,
    InterrupcionEscurrimiento,
    TipoEmplazamiento,
)
from app.models import Atajadero, Inspeccion, User
from app.schemas import (
    InspeccionCreate,
    InspeccionResponse,
    KoboImportError,
    KoboImportItem,
    KoboImportResponse,
)

router = APIRouter(tags=["Inspecciones"])


def _extract_kobo_raw_items(body: Any) -> list[Any]:
    if not isinstance(body, dict):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="El cuerpo de importación debe ser un objeto JSON válido.",
        )

    if body.get("type") == "FeatureCollection":
        features = body.get("features")
        if not isinstance(features, list) or len(features) == 0:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
                detail="El FeatureCollection GeoJSON debe incluir al menos un Feature.",
            )
        items: list[Any] = []
        for feature in features:
            if not isinstance(feature, dict):
                items.append(feature)
                continue
            props = feature.get("properties")
            merged: dict[str, Any] = dict(props) if isinstance(props, dict) else {}
            geometry = feature.get("geometry")
            if isinstance(geometry, dict) and geometry.get("type") == "Point":
                coords = geometry.get("coordinates")
                if isinstance(coords, list) and len(coords) >= 2:
                    merged.setdefault("longitud", coords[0])
                    merged.setdefault("latitud", coords[1])
            items.append(merged)
        return items

    registros = body.get("registros")
    if not isinstance(registros, list) or len(registros) == 0:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="El lote debe incluir una lista no vacía en 'registros' o 'features'.",
        )
    return registros


def _format_validation_message(exc: ValidationError) -> str:
    mensajes: list[str] = []
    for err in exc.errors():
        loc = ".".join(str(part) for part in err.get("loc", ()))
        msg = str(err.get("msg", "Error de validación."))
        mensajes.append(f"{loc}: {msg}" if loc else msg)
    return "; ".join(mensajes)


@router.post(
    "/atajaderos/importar-kobo",
    response_model=KoboImportResponse,
    status_code=status.HTTP_201_CREATED,
)
async def importar_kobo(
    request: Request,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> KoboImportResponse:
    try:
        body = await request.json()
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="El cuerpo de la solicitud debe ser JSON válido.",
        ) from exc

    raw_items = _extract_kobo_raw_items(body)

    creados = 0
    inspecciones_agregadas = 0
    errores: list[KoboImportError] = []
    codigos_procesados: list[str] = []

    for indice, raw_item in enumerate(raw_items):
        raw_codigo = (
            str(raw_item.get("codigo_unico")).strip().upper()
            if isinstance(raw_item, dict) and raw_item.get("codigo_unico") is not None
            else None
        )
        try:
            if not isinstance(raw_item, dict):
                raise ValueError("Cada registro del lote debe ser un objeto JSON.")
            item = KoboImportItem.model_validate(raw_item)
        except ValidationError as exc:
            errores.append(
                KoboImportError(
                    indice=indice,
                    codigo_unico=raw_codigo,
                    detalle=_format_validation_message(exc),
                )
            )
            continue
        except ValueError as exc:
            errores.append(
                KoboImportError(
                    indice=indice,
                    codigo_unico=raw_codigo,
                    detalle=str(exc),
                )
            )
            continue

        try:
            with db.begin_nested():
                existente = (
                    db.scalar(select(Atajadero).where(Atajadero.codigo_unico == item.codigo_unico))
                    if item.codigo_unico is not None
                    else None
                )

                if existente is not None:
                    estado_nuevo = item.estado_observado or item.estado
                    if estado_nuevo is None:
                        raise ValueError(
                            "Debe indicar 'estado_observado' para agregar una inspección "
                            "a un atajadero existente."
                        )
                    validate_estado_transition(existente.estado, estado_nuevo)

                    if not item.observaciones or len(item.observaciones) < 10:
                        raise ValueError(
                            "Las observaciones deben tener al menos 10 caracteres al agregar "
                            "una inspección."
                        )

                    interrumpe_nuevo = (
                        item.interrumpe_escurrimiento or existente.interrumpe_escurrimiento_enum
                    )
                    fecha_insp = ensure_utc(item.fecha_inspeccion)
                    responsable = item.responsable or current_user.name

                    inspeccion = Inspeccion(
                        atajadero_id=existente.id,
                        inspector_id=current_user.id,
                        responsable=responsable,
                        fecha_inspeccion=fecha_insp,
                        tipo_registro=item.tipo_registro.value,
                        estado_observado=estado_nuevo.value,
                        interrumpe_escurrimiento=interrumpe_nuevo.value,
                        indicadores_visuales=[ind.value for ind in item.indicadores_visuales],
                        observaciones=item.observaciones,
                        evidencia_fotos=[],
                        fotos_hashes_sha256=[],
                    )
                    db.add(inspeccion)

                    existente.estado = estado_nuevo.value
                    existente.interrumpe_escurrimiento = interrumpe_nuevo.value
                    if item.tipo_emplazamiento is not None:
                        existente.tipo_emplazamiento = item.tipo_emplazamiento.value
                    existente.criterio_validado_por = (
                        item.criterio_validado_por or f"Importación Kobo/QField ({responsable})"
                    )
                    if existente.fecha_ultima_inspeccion is None or fecha_insp >= ensure_utc(
                        existente.fecha_ultima_inspeccion
                    ):
                        existente.fecha_ultima_inspeccion = fecha_insp

                    db.flush()
                    inspecciones_agregadas += 1
                    if existente.codigo_unico not in codigos_procesados:
                        codigos_procesados.append(existente.codigo_unico)
                else:
                    if (
                        not item.nombre_referencia
                        or len(item.nombre_referencia) < 3
                        or item.latitud is None
                        or item.longitud is None
                        or not item.departamento
                        or len(item.departamento) < 2
                        or not item.cuenca_riacho
                        or len(item.cuenca_riacho) < 2
                    ):
                        raise ValueError(
                            "Para dar de alta un nuevo atajadero son obligatorios "
                            "nombre_referencia, latitud, longitud, departamento y cuenca_riacho."
                        )

                    estado_inicial = item.estado_observado or item.estado
                    if estado_inicial is None:
                        estado_inicial = EstadoAtajadero.SIN_VALIDAR

                    interrumpe_inicial = (
                        item.interrumpe_escurrimiento or InterrupcionEscurrimiento.A_VERIFICAR
                    )
                    tipo_empl = item.tipo_emplazamiento or TipoEmplazamiento.A_DETERMINAR
                    fecha_insp = (
                        ensure_utc(item.fecha_inspeccion)
                        if estado_inicial != EstadoAtajadero.SIN_VALIDAR
                        else None
                    )
                    if estado_inicial != EstadoAtajadero.SIN_VALIDAR and (
                        not item.observaciones or len(item.observaciones) < 10
                    ):
                        raise ValueError(
                            "Un alta en estado técnico validado requiere 'observaciones' "
                            "de al menos 10 caracteres."
                        )

                    codigo_nuevo = item.codigo_unico or generate_next_codigo_unico(db)
                    responsable = item.responsable or current_user.name
                    nuevo = Atajadero(
                        codigo_unico=codigo_nuevo,
                        nombre_referencia=item.nombre_referencia,
                        latitud=item.latitud,
                        longitud=item.longitud,
                        departamento=item.departamento,
                        cuenca_riacho=item.cuenca_riacho,
                        tipo_emplazamiento=tipo_empl.value,
                        estado=estado_inicial.value,
                        interrumpe_escurrimiento=interrumpe_inicial.value,
                        categoria_dato=item.categoria_dato.value,
                        criterio_validado_por=(
                            item.criterio_validado_por
                            or (
                                f"Importación Kobo/QField ({responsable})"
                                if estado_inicial != EstadoAtajadero.SIN_VALIDAR
                                else None
                            )
                        ),
                        observaciones_iniciales=item.observaciones,
                        reportado_por=item.reportado_por,
                        fuente_referencia=item.fuente_referencia or "Importación Kobo / QField",
                        fecha_ultima_inspeccion=fecha_insp,
                        created_by_id=current_user.id,
                    )
                    db.add(nuevo)
                    db.flush()

                    if estado_inicial != EstadoAtajadero.SIN_VALIDAR and item.observaciones:
                        assert fecha_insp is not None
                        insp_inicial = Inspeccion(
                            atajadero_id=nuevo.id,
                            inspector_id=current_user.id,
                            responsable=responsable,
                            fecha_inspeccion=fecha_insp,
                            tipo_registro=item.tipo_registro.value,
                            estado_observado=estado_inicial.value,
                            interrumpe_escurrimiento=interrumpe_inicial.value,
                            indicadores_visuales=[ind.value for ind in item.indicadores_visuales],
                            observaciones=item.observaciones,
                            evidencia_fotos=[],
                            fotos_hashes_sha256=[],
                        )
                        db.add(insp_inicial)
                        db.flush()

                    creados += 1
                    codigos_procesados.append(codigo_nuevo)
        except HTTPException as exc:
            errores.append(
                KoboImportError(
                    indice=indice,
                    codigo_unico=item.codigo_unico or raw_codigo,
                    detalle=str(exc.detail),
                )
            )
        except Exception as exc:
            errores.append(
                KoboImportError(
                    indice=indice,
                    codigo_unico=item.codigo_unico or raw_codigo,
                    detalle=str(exc),
                )
            )

    db.commit()
    return KoboImportResponse(
        creados=creados,
        inspecciones_agregadas=inspecciones_agregadas,
        errores=errores,
        codigos_procesados=codigos_procesados,
    )


@router.post(
    "/atajaderos/{codigo_unico}/inspecciones",
    response_model=InspeccionResponse,
    status_code=status.HTTP_201_CREATED,
)
async def registrar_inspeccion(
    codigo_unico: str,
    request: Request,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> InspeccionResponse:
    codigo = codigo_unico.strip().upper()
    atajadero = db.scalar(select(Atajadero).where(Atajadero.codigo_unico == codigo))
    if atajadero is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No se encontró el atajadero '{codigo}'.",
        )

    raw_data, uploads = await extract_body_and_uploads(
        request,
        list_fields={"indicadores_visuales"},
    )

    codigo_en_payload = raw_data.get("codigo_unico")
    if codigo_en_payload is not None and str(codigo_en_payload).strip().upper() != codigo:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail=(
                f"El codigo_unico '{codigo}' es inmutable y no puede modificarse mediante "
                "una inspección."
            ),
        )

    try:
        payload = InspeccionCreate.model_validate(raw_data)
    except ValidationError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail=sanitize_validation_errors(exc),
        ) from exc

    validate_estado_transition(atajadero.estado, payload.estado_observado)

    saved_fotos: list[str] = []
    saved_hashes: list[str] = []
    saved_paths: list[Path] = []

    try:
        for upload in uploads:
            foto_url, sha256_hex, file_path = await save_validated_image(
                upload,
                prefix=codigo.lower(),
            )
            saved_fotos.append(foto_url)
            saved_hashes.append(sha256_hex)
            saved_paths.append(file_path)

        fecha_insp = ensure_utc(payload.fecha_inspeccion)
        responsable = payload.responsable or current_user.name

        inspeccion = Inspeccion(
            atajadero_id=atajadero.id,
            inspector_id=current_user.id,
            responsable=responsable,
            fecha_inspeccion=fecha_insp,
            tipo_registro=payload.tipo_registro.value,
            estado_observado=payload.estado_observado.value,
            interrumpe_escurrimiento=payload.interrumpe_escurrimiento.value,
            indicadores_visuales=[ind.value for ind in payload.indicadores_visuales],
            observaciones=payload.observaciones,
            evidencia_fotos=saved_fotos,
            fotos_hashes_sha256=saved_hashes,
        )
        db.add(inspeccion)

        atajadero.estado = payload.estado_observado.value
        atajadero.interrumpe_escurrimiento = payload.interrumpe_escurrimiento.value
        if payload.tipo_emplazamiento is not None:
            atajadero.tipo_emplazamiento = payload.tipo_emplazamiento.value
        atajadero.criterio_validado_por = (
            payload.criterio_validado_por
            or f"{payload.tipo_registro.etiqueta} presencial ({responsable})"
        )
        if atajadero.fecha_ultima_inspeccion is None or fecha_insp >= ensure_utc(
            atajadero.fecha_ultima_inspeccion
        ):
            atajadero.fecha_ultima_inspeccion = fecha_insp

        db.commit()
        db.refresh(inspeccion)
        return InspeccionResponse.model_validate(inspeccion)
    except Exception:
        db.rollback()
        cleanup_files(saved_paths)
        raise
