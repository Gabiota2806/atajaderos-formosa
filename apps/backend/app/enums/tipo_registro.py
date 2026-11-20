from enum import StrEnum


class TipoRegistro(StrEnum):
    INSPECCION = "inspeccion"
    INTERVENCION = "intervencion"

    @property
    def etiqueta(self) -> str:
        etiquetas = {
            TipoRegistro.INSPECCION: "Inspección",
            TipoRegistro.INTERVENCION: "Intervención",
        }
        return etiquetas[self]
