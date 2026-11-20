from pathlib import Path
from typing import Annotated, Any

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from pydantic import ValidationError
from sqlalchemy import func, or_, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, selectinload

from app.api.deps import get_current_user
from app.api.helpers import (
    LEYENDA_PROTOTIPO,
    build_atajadero_detail,
    build_atajadero_summary,
    cleanup_files,
    extract_body_and_uploads,
    format_evidencia_inicial_nota,
    generate_next_codigo_unico,
    sanitize_validation_errors,
    save_validated_image,
)
from app.core.database import get_db
from app.enums import (
    CategoriaDato,
    EstadoAtajadero,
    InterrupcionEscurrimiento,
    TipoEmplazamiento,
)
from app.models import Atajadero, Inspeccion, User
from app.schemas import (
    AtajaderoCreate,
    AtajaderoDetail,
    AtajaderoListResponse,
    AvisoPublicoCreate,
    GeoJSONFeature,
    GeoJSONFeatureCollection,
    GeoJSONFeatureProperties,
    GeoJSONMetadata,
    GeoJSONPoint,
)

router = APIRouter(tags=["Atajaderos"])


def _build_filtered_atajaderos_stmt(
    estado: EstadoAtajadero | None = None,
    interrumpe_escurrimiento: InterrupcionEscurrimiento | None = None,
    tipo_emplazamiento: TipoEmplazamiento | None = None,
    categoria_dato: CategoriaDato | None = None,
    departamento: str | None = None,
    cuenca_riacho: str | None = None,
    q: str | None = None,
) -> Any:
    counts_subq = (
        select(
            Inspeccion.atajadero_id.label("atajadero_id"),
            func.count(Inspeccion.id).label("total_inspecciones"),
        )
        .group_by(Inspeccion.atajadero_id)
        .subquery()
    )
    stmt = select(
        Atajadero,
        func.coalesce(counts_subq.c.total_inspecciones, 0).label("total_inspecciones"),
    ).outerjoin(counts_subq, counts_subq.c.atajadero_id == Atajadero.id)

    if estado is not None:
        stmt = stmt.where(Atajadero.estado == estado.value)
    if interrumpe_escurrimiento is not None:
        stmt = stmt.where(Atajadero.interrumpe_escurrimiento == interrumpe_escurrimiento.value)
    if tipo_emplazamiento is not None:
        stmt = stmt.where(Atajadero.tipo_emplazamiento == tipo_emplazamiento.value)
    if categoria_dato is not None:
        stmt = stmt.where(Atajadero.categoria_dato == categoria_dato.value)
    if departamento and departamento.strip():
        stmt = stmt.where(Atajadero.departamento.ilike(f"%{departamento.strip()}%"))
    if cuenca_riacho and cuenca_riacho.strip():
        stmt = stmt.where(Atajadero.cuenca_riacho.ilike(f"%{cuenca_riacho.strip()}%"))
    if q and q.strip():
        termino = f"%{q.strip()}%"
        stmt = stmt.where(
            or_(
                Atajadero.codigo_unico.ilike(termino),
                Atajadero.nombre_referencia.ilike(termino),
                Atajadero.departamento.ilike(termino),
                Atajadero.cuenca_riacho.ilike(termino),
            )
        )
    return stmt.order_by(Atajadero.codigo_unico.asc())


@router.get("/atajaderos", response_model=AtajaderoListResponse)
def listar_atajaderos(
    db: Annotated[Session, Depends(get_db)],
    _current_user: Annotated[User, Depends(get_current_user)],
    estado: Annotated[EstadoAtajadero | None, Query()] = None,
    interrumpe_escurrimiento: Annotated[InterrupcionEscurrimiento | None, Query()] = None,
    tipo_emplazamiento: Annotated[TipoEmplazamiento | None, Query()] = None,
    categoria_dato: Annotated[CategoriaDato | None, Query()] = None,
    departamento: Annotated[str | None, Query()] = None,
    cuenca_riacho: Annotated[str | None, Query()] = None,
    q: Annotated[str | None, Query()] = None,
) -> AtajaderoListResponse:
    stmt = _build_filtered_atajaderos_stmt(
        estado=estado,
        interrumpe_escurrimiento=interrumpe_escurrimiento,
        tipo_emplazamiento=tipo_emplazamiento,
        categoria_dato=categoria_dato,
        departamento=departamento,
        cuenca_riacho=cuenca_riacho,
        q=q,
    )
    rows = db.execute(stmt).all()
    items = [build_atajadero_summary(atajadero, int(total_insp)) for atajadero, total_insp in rows]
    return AtajaderoListResponse(total=len(items), items=items)


@router.get("/atajaderos/geojson", response_model=GeoJSONFeatureCollection)
def exportar_atajaderos_geojson(
    db: Annotated[Session, Depends(get_db)],
    _current_user: Annotated[User, Depends(get_current_user)],
    estado: Annotated[EstadoAtajadero | None, Query()] = None,
    interrumpe_escurrimiento: Annotated[InterrupcionEscurrimiento | None, Query()] = None,
    tipo_emplazamiento: Annotated[TipoEmplazamiento | None, Query()] = None,
    categoria_dato: Annotated[CategoriaDato | None, Query()] = None,
    departamento: Annotated[str | None, Query()] = None,
    cuenca_riacho: Annotated[str | None, Query()] = None,
    q: Annotated[str | None, Query()] = None,
) -> GeoJSONFeatureCollection:
    stmt = _build_filtered_atajaderos_stmt(
        estado=estado,
        interrumpe_escurrimiento=interrumpe_escurrimiento,
        tipo_emplazamiento=tipo_emplazamiento,
        categoria_dato=categoria_dato,
        departamento=departamento,
        cuenca_riacho=cuenca_riacho,
        q=q,
    )
    rows = db.execute(stmt).all()
    features: list[GeoJSONFeature] = []
    for atajadero, total_insp in rows:
        features.append(
            GeoJSONFeature(
                id=atajadero.codigo_unico,
                geometry=GeoJSONPoint(coordinates=[atajadero.longitud, atajadero.latitud]),
                properties=GeoJSONFeatureProperties(
                    id=atajadero.id,
                    codigo_unico=atajadero.codigo_unico,
                    nombre_referencia=atajadero.nombre_referencia,
                    departamento=atajadero.departamento,
                    cuenca_riacho=atajadero.cuenca_riacho,
                    tipo_emplazamiento=atajadero.tipo_emplazamiento_enum,
                    estado=atajadero.estado_enum,
                    interrumpe_escurrimiento=atajadero.interrumpe_escurrimiento_enum,
                    categoria_dato=atajadero.categoria_dato_enum,
                    criterio_validado_por=atajadero.criterio_validado_por,
                    fecha_ultima_inspeccion=atajadero.fecha_ultima_inspeccion,
                    total_inspecciones=int(total_insp),
                ),
            )
        )

    return GeoJSONFeatureCollection(
        metadata=GeoJSONMetadata(
            es_prototipo=True,
            leyenda=LEYENDA_PROTOTIPO,
            total=len(features),
        ),
        features=features,
    )


@router.post("/atajaderos", response_model=AtajaderoDetail, status_code=status.HTTP_201_CREATED)
def crear_atajadero(
    payload: AtajaderoCreate,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> AtajaderoDetail:
    if payload.codigo_unico is not None:
        existente = db.scalar(
            select(Atajadero.id).where(Atajadero.codigo_unico == payload.codigo_unico)
        )
        if existente is not None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Ya existe un atajadero con codigo_unico '{payload.codigo_unico}'.",
            )

    atajadero: Atajadero | None = None
    max_intentos = 1 if payload.codigo_unico is not None else 3
    for intento in range(max_intentos):
        codigo = payload.codigo_unico or generate_next_codigo_unico(db)
        nuevo = Atajadero(
            codigo_unico=codigo,
            nombre_referencia=payload.nombre_referencia,
            latitud=payload.latitud,
            longitud=payload.longitud,
            departamento=payload.departamento,
            cuenca_riacho=payload.cuenca_riacho,
            tipo_emplazamiento=payload.tipo_emplazamiento.value,
            estado=payload.estado.value,
            interrumpe_escurrimiento=payload.interrumpe_escurrimiento.value,
            categoria_dato=payload.categoria_dato.value,
            criterio_validado_por=payload.criterio_validado_por,
            observaciones_iniciales=payload.observaciones_iniciales,
            reportado_por=payload.reportado_por,
            fuente_referencia=payload.fuente_referencia,
            created_by_id=current_user.id,
        )
        try:
            with db.begin_nested():
                db.add(nuevo)
                db.flush()
            atajadero = nuevo
            break
        except IntegrityError as exc:
            if payload.codigo_unico is not None:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail=f"Ya existe un atajadero con codigo_unico '{payload.codigo_unico}'.",
                ) from exc
            if intento == max_intentos - 1:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="No se pudo generar un codigo_unico único tras reintentos.",
                ) from exc

    assert atajadero is not None
    db.commit()

    cargado = db.execute(
        select(Atajadero)
        .options(selectinload(Atajadero.inspecciones))
        .where(Atajadero.id == atajadero.id)
    ).scalar_one()
    return build_atajadero_detail(cargado)


@router.get("/atajaderos/{codigo_unico}", response_model=AtajaderoDetail)
def obtener_atajadero(
    codigo_unico: str,
    db: Annotated[Session, Depends(get_db)],
    _current_user: Annotated[User, Depends(get_current_user)],
) -> AtajaderoDetail:
    codigo = codigo_unico.strip().upper()
    atajadero = db.execute(
        select(Atajadero)
        .options(selectinload(Atajadero.inspecciones))
        .where(Atajadero.codigo_unico == codigo)
    ).scalar_one_or_none()
    if atajadero is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No se encontró el atajadero '{codigo}'.",
        )
    return build_atajadero_detail(atajadero)


@router.post("/avisos", response_model=AtajaderoDetail, status_code=status.HTTP_201_CREATED)
async def crear_aviso_publico(
    request: Request,
    db: Annotated[Session, Depends(get_db)],
) -> AtajaderoDetail:
    raw_data, uploads = await extract_body_and_uploads(request)

    try:
        aviso = AvisoPublicoCreate.model_validate(raw_data)
    except ValidationError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail=sanitize_validation_errors(exc),
        ) from exc

    saved_fotos: list[str] = []
    saved_hashes: list[str] = []
    saved_paths: list[Path] = []

    try:
        for upload in uploads:
            foto_url, sha256_hex, file_path = await save_validated_image(upload, prefix="aviso")
            saved_fotos.append(foto_url)
            saved_hashes.append(sha256_hex)
            saved_paths.append(file_path)

        nota_inicial = format_evidencia_inicial_nota(
            aviso.descripcion_aviso,
            saved_fotos,
            saved_hashes,
        )

        atajadero: Atajadero | None = None
        for intento in range(3):
            codigo = generate_next_codigo_unico(db)
            nuevo = Atajadero(
                codigo_unico=codigo,
                nombre_referencia=aviso.nombre_referencia,
                latitud=aviso.latitud,
                longitud=aviso.longitud,
                departamento=aviso.departamento,
                cuenca_riacho=aviso.cuenca_riacho,
                tipo_emplazamiento=TipoEmplazamiento.A_DETERMINAR.value,
                estado=EstadoAtajadero.SIN_VALIDAR.value,
                interrumpe_escurrimiento=InterrupcionEscurrimiento.A_VERIFICAR.value,
                categoria_dato=CategoriaDato.SIMULADO.value,
                criterio_validado_por="Aviso vecinal (pendiente validación presencial)",
                observaciones_iniciales=nota_inicial,
                reportado_por=aviso.reportado_por,
                fuente_referencia="Aviso vecinal público (Forma B)",
                fecha_ultima_inspeccion=None,
            )
            try:
                with db.begin_nested():
                    db.add(nuevo)
                    db.flush()
                atajadero = nuevo
                break
            except IntegrityError as exc:
                if intento == 2:
                    raise HTTPException(
                        status_code=status.HTTP_409_CONFLICT,
                        detail="No se pudo asignar un codigo_unico único para el aviso.",
                    ) from exc

        assert atajadero is not None
        db.commit()
    except Exception:
        db.rollback()
        cleanup_files(saved_paths)
        raise

    cargado = db.execute(
        select(Atajadero)
        .options(selectinload(Atajadero.inspecciones))
        .where(Atajadero.id == atajadero.id)
    ).scalar_one()
    return build_atajadero_detail(cargado)
