---
description: Inicia el ciclo de vida de desarrollo de un GitHub Issue en Atajaderos Formosa (FastAPI + React/Bun en Docker, TDD pytest, PR con Closes #N sin auto-merge).
argument: "[#ISSUE] [modo]"
---

Ejecuta el ciclo de vida de desarrollo del GitHub Issue indicado ($ARGUMENTS) siguiendo rigurosamente las directivas del proyecto:

1. **Lectura del Issue, Skill y Reglas:**
   - Consulta el Issue (`gh issue view <num>`) y la spec en `docs/specs/`.
   - Lee `.agents/skills/desarrollo-tarea/SKILL.md` y `.agents/rules/1_desarrollo_tareas.md`.
   - Consulta `docs/specs/global_spec.md`.
2. **Plan Técnico:**
   - Si no se especificó el Issue o el modo (`local`/`remoto`), solicita la información antes de continuar.
   - Formula un Plan Técnico estructurado (rama `feat/<num>-<slug>`, archivos en `apps/backend/` y/o `apps/frontend/`, migraciones Alembic, pruebas TDD en `pytest`).
   - **Pausa obligatoria**: Espera el "OK" explícito del usuario antes de crear ramas o escribir código.
3. **Desarrollo y TDD (100 % Docker):**
   - Crea la rama desde `develop` (`feat/<num>-<slug>` o `fix/<num>-<slug>`).
   - Aplica TDD: escribe primero pruebas en `apps/backend/tests/` (flujo feliz + entrada inválida).
   - Corre `docker compose exec backend uv run --no-sync pytest` y `docker compose exec backend uv run --no-sync ruff check .`.
   - Si modificaste frontend, corre `docker compose exec frontend bun run build`, valida ausencia de emojis (solo SVGs `@heroicons/react`) y consola limpia en `http://localhost:5173`.
   - Presenta la guía de QA manual y espera el "OK" del usuario.
4. **Pull Request (Sin Auto-Merge):**
   - Haz commit en español con Conventional Commits referenciando el Issue (`feat(#<num>): ...`).
   - Empuja la rama (`git push -u origin <rama>`) y crea la PR hacia `develop` con `gh pr create --base develop` incluyendo `Closes #<num>`.
   - **NUNCA HAGAS AUTO-MERGE**: Deja la PR abierta para revisión humana.
