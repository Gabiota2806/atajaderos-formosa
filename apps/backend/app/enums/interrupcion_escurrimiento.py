from enum import StrEnum


class InterrupcionEscurrimiento(StrEnum):
    SI = "si"
    NO = "no"
    A_VERIFICAR = "a_verificar"

    @property
    def etiqueta(self) -> str:
        etiquetas = {
            InterrupcionEscurrimiento.SI: "Sí",
            InterrupcionEscurrimiento.NO: "No",
            InterrupcionEscurrimiento.A_VERIFICAR: "A verificar",
        }
        return etiquetas[self]
