---
name: fastapi-best-practices
description: Estándares de desarrollo para el backend FastAPI (Python 3.12, uv, SQLAlchemy 2.0, Alembic, Pydantic v2, PostgreSQL 18 / PostGIS, pytest y Ruff) en apps/backend/.
---

# FastAPI + SQLAlchemy 2.0 + pytest Best Practices (`apps/backend/`)

## 1. Arquitectura y Capas
- `app/api/routes/`: routers delgados; validan entrada vía Pydantic v2, inyectan `Session` con `Depends(get_db)` y delegan lógica de negocio compleja a `app/services/`.
- `app/models/`: modelos SQLAlchemy 2.0 con `Mapped[...]` y `mapped_column(...)`.
- `app/schemas/`: modelos Pydantic v2 separados para `Create`, `Update` y `Response` (`ConfigDict(from_attributes=True)`).
- `app/enums/`: `StrEnum` para dominios cerrados (`UserRole`, `EstadoAtajadero`, `InterrupcionEscurrimiento`, `CategoriaDato`).
- `app/seeds/`: seeders idempotentes rotulando explícitamente registros demo como `SIMULADO`.

## 2. Reglas de Integridad y Validación
- Validar rangos geográficos de Formosa (latitud/longitud) y valores permitidos en Pydantic v2 para rechazar entradas inválidas con `422 Unprocessable Entity` y mensajes claros en español.
- Mantener `codigo_unico` como clave inmutable (nunca permitir sobrescribirlo en `PATCH`/`PUT`).
- Evitar consultas N+1 usando `selectinload` / `joinedload` en relaciones de historial (`atajadero.inspecciones`).
- Toda migración de esquema debe registrarse en `apps/backend/alembic/versions/` y aplicarse con `docker compose exec backend uv run --no-sync alembic upgrade head`.

## 3. Pruebas (pytest) y Estilo (Ruff)
- Escribir tests en `apps/backend/tests/` usando las fixtures `client` y `db_session` (corren contra PostgreSQL 18 `atajaderos_test`).
- Cubrir SIEMPRE al menos un escenario feliz y un escenario de **entrada inválida** (`422` / `400` / `401`).
- Comandos obligatorios dentro de Docker:
  - `docker compose exec backend uv run --no-sync ruff check .`
  - `docker compose exec backend uv run --no-sync ruff format --check .`
  - `docker compose exec backend uv run --no-sync pytest -v`
