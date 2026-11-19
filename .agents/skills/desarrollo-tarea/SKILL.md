---
name: desarrollo-tarea
description: Guía y flujo operativo paso a paso para el desarrollo e implementación de GitHub Issues en el monorepo FastAPI + React/Bun dentro de Docker. Usar al iniciar o trabajar en cualquier Issue (#N).
---

# Skill: Desarrollo e Implementación de Tareas (GitHub Issues)

1. **Activación, Issue y Plan Técnico:**
   - Leer Issue (`gh issue view <num>`), `docs/specs/<modulo>/spec.md` y `docs/specs/global_spec.md`.
   - Inspeccionar `apps/backend/app/` y `apps/frontend/src/`.
   - Presentar Plan Técnico (rama `feat/<num>-<slug>`, archivos, migraciones Alembic, tests `pytest`) y **pausar esperando OK**.
2. **Desarrollo, TDD y Verificación en Docker:**
   - Tests backend (`pytest` contra `atajaderos_test`, flujo feliz + entrada inválida): `docker compose exec backend uv run --no-sync pytest`.
   - Linter backend: `docker compose exec backend uv run --no-sync ruff check .` y `ruff format --check .`.
   - Frontend build & tipos: `docker compose exec frontend bun run build`.
   - Solo SVGs `@heroicons/react` (sin emojis), `<PrototypeBanner />` visible y categorías de datos explícitas.
   - Entregar guía de QA manual (`http://localhost:5173` en local o `./scripts/tunnel.sh start 5173` en remoto) y **pausar esperando OK humano**.
3. **Documentación, Commit y PR (Sin Auto-Merge):**
   - Actualizar spec modular y `docs/changelog.md`.
   - Commit Conventional Commits (`feat(#<num>): ...`), push y `gh pr create --base develop` con `Closes #<num>`.
   - **PROHIBIDO AUTO-MERGE**.
