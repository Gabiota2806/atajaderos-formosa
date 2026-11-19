from enum import StrEnum


class UserRole(StrEnum):
    INSPECTOR = "inspector"
    REFERENTE_MESA = "referente_mesa"

    @property
    def etiqueta(self) -> str:
        if self is UserRole.INSPECTOR:
            return "Inspector de campo"
        return "Referente de mesa"
