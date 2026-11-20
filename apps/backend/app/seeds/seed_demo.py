from datetime import UTC, datetime, timedelta
from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import SessionLocal
from app.core.security import hash_password
from app.enums.categoria_dato import CategoriaDato
from app.enums.estado_atajadero import EstadoAtajadero
from app.enums.interrupcion_escurrimiento import InterrupcionEscurrimiento
from app.enums.tipo_emplazamiento import TipoEmplazamiento
from app.enums.tipo_registro import TipoRegistro
from app.enums.user_role import UserRole
from app.models.atajadero import Atajadero
from app.models.inspeccion import Inspeccion
from app.models.user import User

DEMO_USERS = [
    {
        "name": "Inspector de Campo (Demo)",
        "email": "inspector@atajaderos.ar",
        "role": UserRole.INSPECTOR.value,
        "password": "password",
    },
    {
        "name": "Referente de Mesa (Demo)",
        "email": "referente@atajaderos.ar",
        "role": UserRole.REFERENTE_MESA.value,
        "password": "password",
    },
]


def _build_demo_atajaderos(now: datetime) -> list[dict[str, Any]]:
    return [
        {
            "codigo_unico": "ATJ-FSA-0001",
            "nombre_referencia": "Cruce RP 24 · Riacho El Porteño (SIMULADO)",
            "latitud": -25.1200,
            "longitud": -59.4500,
            "departamento": "Patiño",
            "cuenca_riacho": "Riacho El Porteño",
            "tipo_emplazamiento": TipoEmplazamiento.EN_CAUCE_ACTIVO.value,
            "estado": EstadoAtajadero.CON_DETERIORO.value,
            "interrumpe_escurrimiento": InterrupcionEscurrimiento.SI.value,
            "criterio_validado_por": "Inspector de Campo (Demo)",
            "fuente_referencia": (
                "Seed demo corredor El Porteño – He-Hé (SIMULADO / DATO DE PRUEBA)"
            ),
            "inspecciones": [
                {
                    "dias_atras": 90,
                    "tipo_registro": TipoRegistro.INSPECCION.value,
                    "estado_observado": EstadoAtajadero.OPERATIVO.value,
                    "interrumpe_escurrimiento": InterrupcionEscurrimiento.NO.value,
                    "indicadores_visuales": [],
                    "observaciones": (
                        "DATO DE PRUEBA: Terraplén con paso lateral libre y borde libre adecuado."
                    ),
                },
                {
                    "dias_atras": 35,
                    "tipo_registro": TipoRegistro.INTERVENCION.value,
                    "estado_observado": EstadoAtajadero.OPERATIVO.value,
                    "interrumpe_escurrimiento": InterrupcionEscurrimiento.NO.value,
                    "indicadores_visuales": [],
                    "observaciones": (
                        "DATO DE PRUEBA: Limpieza preventiva de ramas en canal aliviadero lateral."
                    ),
                },
                {
                    "dias_atras": 18,
                    "tipo_registro": TipoRegistro.INSPECCION.value,
                    "estado_observado": EstadoAtajadero.CON_DETERIORO.value,
                    "interrumpe_escurrimiento": InterrupcionEscurrimiento.SI.value,
                    "indicadores_visuales": [
                        "cierre_total_sin_vertedero",
                        "riesgo_sobrepaso_borde_libre",
                    ],
                    "observaciones": (
                        "DATO DE PRUEBA: Cierre del paso lateral tras lluvias; "
                        "borde libre menor a 15 cm."
                    ),
                },
            ],
        },
        {
            "codigo_unico": "ATJ-FSA-0002",
            "nombre_referencia": "Cruce RN 86 · Riacho El Porteño (SIMULADO)",
            "latitud": -24.9800,
            "longitud": -58.8500,
            "departamento": "Pilagás",
            "cuenca_riacho": "Riacho El Porteño",
            "tipo_emplazamiento": TipoEmplazamiento.EN_CAUCE_ACTIVO.value,
            "estado": EstadoAtajadero.SIN_VALIDAR.value,
            "interrumpe_escurrimiento": InterrupcionEscurrimiento.A_VERIFICAR.value,
            "criterio_validado_por": None,
            "fuente_referencia": "Hipótesis satelital Sentinel-2 sin lectura en campo (SIMULADO)",
            "inspecciones": [],
        },
        {
            "codigo_unico": "ATJ-FSA-0003",
            "nombre_referencia": "Cruce RP 26 · Riacho He-Hé (SIMULADO)",
            "latitud": -25.1800,
            "longitud": -58.5200,
            "departamento": "Pilcomayo",
            "cuenca_riacho": "Riacho He-Hé",
            "tipo_emplazamiento": TipoEmplazamiento.LATERAL_FUERA_DE_CAUCE.value,
            "estado": EstadoAtajadero.OPERATIVO.value,
            "interrumpe_escurrimiento": InterrupcionEscurrimiento.NO.value,
            "criterio_validado_por": "Inspector de Campo (Demo)",
            "fuente_referencia": (
                "Reservorio lateral Ley 1.246 Art. 88° (SIMULADO / DATO DE PRUEBA)"
            ),
            "inspecciones": [
                {
                    "dias_atras": 12,
                    "tipo_registro": TipoRegistro.INSPECCION.value,
                    "estado_observado": EstadoAtajadero.OPERATIVO.value,
                    "interrumpe_escurrimiento": InterrupcionEscurrimiento.NO.value,
                    "indicadores_visuales": [],
                    "observaciones": (
                        "DATO DE PRUEBA: Obra lateral fuera del cauce principal "
                        "con vertedero libre."
                    ),
                }
            ],
        },
        {
            "codigo_unico": "ATJ-FSA-0004",
            "nombre_referencia": "Paraje Laguna Gallo · Riacho Monte Lindo (SIMULADO)",
            "latitud": -25.4200,
            "longitud": -59.3000,
            "departamento": "Patiño",
            "cuenca_riacho": "Riacho Monte Lindo",
            "tipo_emplazamiento": TipoEmplazamiento.EN_CAUCE_ACTIVO.value,
            "estado": EstadoAtajadero.CON_DETERIORO.value,
            "interrumpe_escurrimiento": InterrupcionEscurrimiento.SI.value,
            "criterio_validado_por": "Inspector de Campo (Demo)",
            "fuente_referencia": "Corredor Monte Lindo – Laguna Gallo (SIMULADO / DATO DE PRUEBA)",
            "inspecciones": [
                {
                    "dias_atras": 22,
                    "tipo_registro": TipoRegistro.INSPECCION.value,
                    "estado_observado": EstadoAtajadero.CON_DETERIORO.value,
                    "interrumpe_escurrimiento": InterrupcionEscurrimiento.SI.value,
                    "indicadores_visuales": [
                        "riesgo_sobrepaso_borde_libre",
                        "filtracion_turbia_tubificacion",
                    ],
                    "observaciones": (
                        "DATO DE PRUEBA: Nivel de agua al tope del coronamiento y "
                        "filtración turbia en talud."
                    ),
                }
            ],
        },
        {
            "codigo_unico": "ATJ-FSA-0005",
            "nombre_referencia": "Cruce RN 11 · Riacho Monte Lindo Chico (SIMULADO)",
            "latitud": -25.8800,
            "longitud": -58.2800,
            "departamento": "Formosa",
            "cuenca_riacho": "Riacho Monte Lindo",
            "tipo_emplazamiento": TipoEmplazamiento.ALCANTARILLA_VIAL.value,
            "estado": EstadoAtajadero.FUERA_DE_SERVICIO.value,
            "interrumpe_escurrimiento": InterrupcionEscurrimiento.SI.value,
            "criterio_validado_por": "Referente de Mesa (Demo)",
            "fuente_referencia": "Cruce vial RN 11 · Alerta DPV (SIMULADO / DATO DE PRUEBA)",
            "inspecciones": [
                {
                    "dias_atras": 25,
                    "tipo_registro": TipoRegistro.INSPECCION.value,
                    "estado_observado": EstadoAtajadero.FUERA_DE_SERVICIO.value,
                    "interrumpe_escurrimiento": InterrupcionEscurrimiento.SI.value,
                    "indicadores_visuales": ["alcantarilla_obstruida"],
                    "observaciones": (
                        "DATO DE PRUEBA: Terraplén colapsado sobre alcantarilla vial "
                        "obstruida con sedimentos."
                    ),
                }
            ],
        },
        {
            "codigo_unico": "ATJ-FSA-0006",
            "nombre_referencia": "Pozo del Tigre · A° Tatú Piré (SIMULADO)",
            "latitud": -24.8900,
            "longitud": -60.3200,
            "departamento": "Patiño",
            "cuenca_riacho": "Arroyo Tatú Piré",
            "tipo_emplazamiento": TipoEmplazamiento.A_DETERMINAR.value,
            "estado": EstadoAtajadero.SIN_VALIDAR.value,
            "interrumpe_escurrimiento": InterrupcionEscurrimiento.A_VERIFICAR.value,
            "criterio_validado_por": None,
            "fuente_referencia": "Aviso vecinal preliminar para demostración en vivo (SIMULADO)",
            "inspecciones": [],
        },
        {
            "codigo_unico": "ATJ-FSA-0007",
            "nombre_referencia": "Mojón de Fierro · Riacho Pilagá (SIMULADO)",
            "latitud": -26.0200,
            "longitud": -58.1800,
            "departamento": "Formosa",
            "cuenca_riacho": "Riacho Pilagá",
            "tipo_emplazamiento": TipoEmplazamiento.LATERAL_FUERA_DE_CAUCE.value,
            "estado": EstadoAtajadero.OPERATIVO.value,
            "interrumpe_escurrimiento": InterrupcionEscurrimiento.NO.value,
            "criterio_validado_por": "Inspector de Campo (Demo)",
            "fuente_referencia": "Corredor Riacho Pilagá (SIMULADO / DATO DE PRUEBA)",
            "inspecciones": [
                {
                    "dias_atras": 8,
                    "tipo_registro": TipoRegistro.INSPECCION.value,
                    "estado_observado": EstadoAtajadero.OPERATIVO.value,
                    "interrumpe_escurrimiento": InterrupcionEscurrimiento.NO.value,
                    "indicadores_visuales": [],
                    "observaciones": (
                        "DATO DE PRUEBA: Atajadero lateral operativo sin afectación "
                        "al escurrimiento."
                    ),
                }
            ],
        },
        {
            "codigo_unico": "ATJ-FSA-0008",
            "nombre_referencia": "Boca Riacho Pilagá · Alcantarilla RP (SIMULADO)",
            "latitud": -26.0800,
            "longitud": -58.1200,
            "departamento": "Formosa",
            "cuenca_riacho": "Riacho Pilagá",
            "tipo_emplazamiento": TipoEmplazamiento.ALCANTARILLA_VIAL.value,
            "estado": EstadoAtajadero.CON_DETERIORO.value,
            "interrumpe_escurrimiento": InterrupcionEscurrimiento.SI.value,
            "criterio_validado_por": "Inspector de Campo (Demo)",
            "fuente_referencia": "Tramo inferior Riacho Pilagá (SIMULADO / DATO DE PRUEBA)",
            "inspecciones": [
                {
                    "dias_atras": 19,
                    "tipo_registro": TipoRegistro.INSPECCION.value,
                    "estado_observado": EstadoAtajadero.CON_DETERIORO.value,
                    "interrumpe_escurrimiento": InterrupcionEscurrimiento.SI.value,
                    "indicadores_visuales": [
                        "alcantarilla_obstruida",
                        "grietas_o_bioperturbacion",
                    ],
                    "observaciones": (
                        "DATO DE PRUEBA: Caño de alcantarilla semiobstruido con ramas "
                        "y grietas en talud."
                    ),
                }
            ],
        },
        {
            "codigo_unico": "ATJ-FSA-0009",
            "nombre_referencia": "Cercanías Vertedero RP 28 · Campo del Cielo (SIMULADO)",
            "latitud": -24.4200,
            "longitud": -60.4000,
            "departamento": "Patiño",
            "cuenca_riacho": "Bañado La Estrella – Riacho Salado",
            "tipo_emplazamiento": TipoEmplazamiento.EN_CAUCE_ACTIVO.value,
            "estado": EstadoAtajadero.SIN_VALIDAR.value,
            "interrumpe_escurrimiento": InterrupcionEscurrimiento.A_VERIFICAR.value,
            "criterio_validado_por": None,
            "fuente_referencia": "Reporte preliminar corredor Bañado La Estrella (SIMULADO)",
            "inspecciones": [],
        },
        {
            "codigo_unico": "ATJ-FSA-0010",
            "nombre_referencia": "Tramo Inferior · Riacho Salado (SIMULADO)",
            "latitud": -26.5200,
            "longitud": -58.5500,
            "departamento": "Laishí",
            "cuenca_riacho": "Bañado La Estrella – Riacho Salado",
            "tipo_emplazamiento": TipoEmplazamiento.LATERAL_FUERA_DE_CAUCE.value,
            "estado": EstadoAtajadero.OPERATIVO.value,
            "interrumpe_escurrimiento": InterrupcionEscurrimiento.NO.value,
            "criterio_validado_por": "Inspector de Campo (Demo)",
            "fuente_referencia": "Corredor Riacho Salado en Laishí (SIMULADO / DATO DE PRUEBA)",
            "inspecciones": [
                {
                    "dias_atras": 10,
                    "tipo_registro": TipoRegistro.INSPECCION.value,
                    "estado_observado": EstadoAtajadero.OPERATIVO.value,
                    "interrumpe_escurrimiento": InterrupcionEscurrimiento.NO.value,
                    "indicadores_visuales": [],
                    "observaciones": (
                        "DATO DE PRUEBA: Reservorio lateral en buen estado, escurrimiento libre."
                    ),
                }
            ],
        },
    ]


def seed_demo_users(db: Session) -> list[User]:
    seeded: list[User] = []
    for item in DEMO_USERS:
        existing = db.scalar(select(User).where(User.email == item["email"]))
        if existing is None:
            user = User(
                name=item["name"],
                email=item["email"],
                role=item["role"],
                hashed_password=hash_password(item["password"]),
            )
            db.add(user)
            seeded.append(user)
        else:
            existing.name = item["name"]
            existing.role = item["role"]
            existing.hashed_password = hash_password(item["password"])
            seeded.append(existing)
    db.commit()
    for user in seeded:
        db.refresh(user)
    return seeded


def seed_demo_atajaderos(db: Session) -> list[Atajadero]:
    now = datetime.now(UTC)
    seeded: list[Atajadero] = []
    for item in _build_demo_atajaderos(now):
        inspecciones_raw: list[dict[str, Any]] = item["inspecciones"]
        ultima_fecha: datetime | None = None
        if inspecciones_raw:
            min_dias = min(int(i["dias_atras"]) for i in inspecciones_raw)
            ultima_fecha = now - timedelta(days=min_dias)

        existing = db.scalar(
            select(Atajadero).where(Atajadero.codigo_unico == item["codigo_unico"])
        )
        if existing is None:
            atajadero = Atajadero(
                codigo_unico=item["codigo_unico"],
                nombre_referencia=item["nombre_referencia"],
                latitud=item["latitud"],
                longitud=item["longitud"],
                departamento=item["departamento"],
                cuenca_riacho=item["cuenca_riacho"],
                tipo_emplazamiento=item["tipo_emplazamiento"],
                estado=item["estado"],
                interrumpe_escurrimiento=item["interrumpe_escurrimiento"],
                categoria_dato=CategoriaDato.SIMULADO.value,
                criterio_validado_por=item["criterio_validado_por"],
                fuente_referencia=item["fuente_referencia"],
                fecha_ultima_inspeccion=ultima_fecha,
            )
            db.add(atajadero)
            db.flush()
            for insp in inspecciones_raw:
                db.add(
                    Inspeccion(
                        atajadero_id=atajadero.id,
                        responsable=item["criterio_validado_por"] or "Inspector de Campo (Demo)",
                        fecha_inspeccion=now - timedelta(days=int(insp["dias_atras"])),
                        tipo_registro=insp["tipo_registro"],
                        estado_observado=insp["estado_observado"],
                        interrumpe_escurrimiento=insp["interrumpe_escurrimiento"],
                        indicadores_visuales=list(insp["indicadores_visuales"]),
                        observaciones=insp["observaciones"],
                    )
                )
            seeded.append(atajadero)
        else:
            existing.nombre_referencia = item["nombre_referencia"]
            existing.latitud = item["latitud"]
            existing.longitud = item["longitud"]
            existing.departamento = item["departamento"]
            existing.cuenca_riacho = item["cuenca_riacho"]
            existing.tipo_emplazamiento = item["tipo_emplazamiento"]
            existing.estado = item["estado"]
            existing.interrumpe_escurrimiento = item["interrumpe_escurrimiento"]
            existing.categoria_dato = CategoriaDato.SIMULADO.value
            existing.criterio_validado_por = item["criterio_validado_por"]
            existing.fuente_referencia = item["fuente_referencia"]
            existing.fecha_ultima_inspeccion = ultima_fecha
            seeded.append(existing)

    db.commit()
    for atajadero in seeded:
        db.refresh(atajadero)
    return seeded


def main() -> None:
    db = SessionLocal()
    try:
        users = seed_demo_users(db)
        atajaderos = seed_demo_atajaderos(db)
        print(
            f"Seed completado (SIMULADO / DATO DE PRUEBA): {len(users)} usuarios demo "
            f"y {len(atajaderos)} atajaderos de Formosa disponibles."
        )
    finally:
        db.close()


if __name__ == "__main__":
    main()
