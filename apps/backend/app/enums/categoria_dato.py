from enum import StrEnum


class CategoriaDato(StrEnum):
    SIMULADO = "SIMULADO"
    OBSERVADO = "OBSERVADO"
    REFERENCIA = "REFERENCIA"

    @property
    def etiqueta(self) -> str:
        etiquetas = {
            CategoriaDato.SIMULADO: "Simulado (dato de prueba)",
            CategoriaDato.OBSERVADO: "Dato observado",
            CategoriaDato.REFERENCIA: "Documento de referencia",
        }
        return etiquetas[self]
