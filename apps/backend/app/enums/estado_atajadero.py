from enum import StrEnum


class EstadoAtajadero(StrEnum):
    SIN_VALIDAR = "sin_validar"
    OPERATIVO = "operativo"
    CON_DETERIORO = "con_deterioro"
    FUERA_DE_SERVICIO = "fuera_de_servicio"

    @property
    def etiqueta(self) -> str:
        etiquetas = {
            EstadoAtajadero.SIN_VALIDAR: "Sin validar",
            EstadoAtajadero.OPERATIVO: "Operativo",
            EstadoAtajadero.CON_DETERIORO: "Con deterioro",
            EstadoAtajadero.FUERA_DE_SERVICIO: "Fuera de servicio",
        }
        return etiquetas[self]
