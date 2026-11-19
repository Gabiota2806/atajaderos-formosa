# Instrucciones para Claude Code — Atajaderos Formosa (AI LAB · Equipo 6)

## Entorno de Ejecución (100 % Docker — `compose.yaml`)
- Tests Backend (pytest): `docker compose exec backend uv run --no-sync pytest`
- Linter Backend (Ruff): `docker compose exec backend uv run --no-sync ruff check .`
- Formato Backend (Ruff): `docker compose exec backend uv run --no-sync ruff format --check .`
- Migraciones (Alembic): `docker compose exec backend uv run --no-sync alembic upgrade head`
- Seed Demo (`SIMULADO`): `docker compose exec backend uv run --no-sync python -m app.seeds.seed_demo`
- Build & Typecheck Frontend (Bun): `docker compose exec frontend bun run build`

---

## Flujo Multiagente, GitHub Issues y Especificaciones Modulares (SDD)
Este repositorio opera bajo metodología multiagente coordinada con **GitHub Issues** (no Jira):
1. **Issues y Specs Modulares**: Consultar el Issue (`gh issue view <num>`) y la spec en `docs/specs/<modulo>/spec.md`.
2. **Spec Global**: La arquitectura y convenciones transversales residen en `docs/specs/global_spec.md`.
3. **Roles Operativos**:
   - **Planificación**: Define o actualiza la spec modular y desglosa GitHub Issues antes de escribir código.
   - **Implementación**: Crea rama `feat/<num>-<slug>` desde `develop` y aplica TDD estricto con `pytest` (flujo feliz + entrada inválida).
   - **Revisión**: Comprueba que `pytest`, `ruff check` y `bun run build` pasen al 100 % y valida el diff.

---

## Reglas Inviolables
- **Cero Auto-Merge**: Nunca fusiones ramas automáticamente a `develop` o `main`. Deja la Pull Request abierta hacia `develop` con `Closes #<num>` para revisión humana.
- **TDD Obligatorio**: Todo cambio de backend debe contar con pruebas `pytest` contra PostgreSQL `atajaderos_test` (flujo feliz + entrada inválida).
- **Iconografía**: En componentes React/TypeScript usa únicamente SVGs vectoriales (`@heroicons/react`). Prohibido usar emojis de texto en la UI.
- **Reglas AI LAB**: Mantener visible `<PrototypeBanner />`, rotular categorías (`OBSERVADO`, `REFERENCIA`, `SIMULADO`), preservar `codigo_unico` inmutable y exigir confirmación humana en cualquier asistencia IA.
- **Formato**: Ejecuta `ruff check .` y `bun run build` antes de commitear.
