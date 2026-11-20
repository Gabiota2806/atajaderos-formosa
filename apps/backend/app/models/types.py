from typing import Any

from sqlalchemy import func
from sqlalchemy.sql.elements import ColumnElement
from sqlalchemy.types import UserDefinedType


def point_4326_ewkt(longitud: float, latitud: float) -> str:
    """Construye la representación EWKT EPSG:4326 en orden (longitud, latitud)."""
    return f"SRID=4326;POINT({longitud} {latitud})"


class GeometryPoint4326(UserDefinedType[str]):
    """Tipo PostGIS geometry(Point, 4326) compatible con SQLAlchemy 2.0 sin geoalchemy2."""

    cache_ok = True

    def get_col_spec(self, **kw: Any) -> str:
        return "geometry(Point, 4326)"

    def bind_expression(self, bindvalue: ColumnElement[Any]) -> ColumnElement[Any]:
        return func.ST_GeomFromEWKT(bindvalue, type_=self)

    def column_expression(self, col: ColumnElement[Any]) -> ColumnElement[Any]:
        return func.ST_AsEWKT(col)
