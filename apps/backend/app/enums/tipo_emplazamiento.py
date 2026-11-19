from enum import StrEnum


class TipoEmplazamiento(StrEnum):
    EN_CAUCE_ACTIVO = "en_cauce_activo"
    LATERAL_FUERA_DE_CAUCE = "lateral_fuera_de_cauce"
    ALCANTARILLA_VIAL = "alcantarilla_vial"
    A_DETERMINAR = "a_determinar"

    @property
    def etiqueta(self) -> str:
        etiquetas = {
            TipoEmplazamiento.EN_CAUCE_ACTIVO: "En cauce activo",
            TipoEmplazamiento.LATERAL_FUERA_DE_CAUCE: "Lateral fuera de cauce",
            TipoEmplazamiento.ALCANTARILLA_VIAL: "Alcantarilla vial",
            TipoEmplazamiento.A_DETERMINAR: "A determinar",
        }
        return etiquetas[self]
