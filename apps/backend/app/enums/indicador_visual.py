from enum import StrEnum


class IndicadorVisual(StrEnum):
    CIERRE_TOTAL_SIN_VERTEDERO = "cierre_total_sin_vertedero"
    RIESGO_SOBREPASO_BORDE_LIBRE = "riesgo_sobrepaso_borde_libre"
    FILTRACION_TURBIA_TUBIFICACION = "filtracion_turbia_tubificacion"
    GRIETAS_O_BIOPERTURBACION = "grietas_o_bioperturbacion"
    ALCANTARILLA_OBSTRUIDA = "alcantarilla_obstruida"

    @property
    def etiqueta(self) -> str:
        etiquetas = {
            IndicadorVisual.CIERRE_TOTAL_SIN_VERTEDERO: "Cierre total sin vertedero",
            IndicadorVisual.RIESGO_SOBREPASO_BORDE_LIBRE: (
                "Riesgo de sobrepaso / borde libre crítico"
            ),
            IndicadorVisual.FILTRACION_TURBIA_TUBIFICACION: "Filtración turbia / tubificación",
            IndicadorVisual.GRIETAS_O_BIOPERTURBACION: "Grietas o bioperturbación",
            IndicadorVisual.ALCANTARILLA_OBSTRUIDA: "Alcantarilla obstruida",
        }
        return etiquetas[self]
