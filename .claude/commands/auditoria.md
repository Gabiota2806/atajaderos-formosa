---
description: Audita y valida rigurosamente una Pull Request o rama de GitHub Issue en Atajaderos Formosa antes de su integración a develop.
argument: "[#ISSUE o rama] [desarrollador] [modo]"
---

Ejecuta la auditoría y control de calidad de la PR o rama indicada ($ARGUMENTS) siguiendo rigurosamente las directivas del proyecto:

1. **Lectura del Issue, Skill y Reglas:**
   - Consulta el GitHub Issue (`gh issue view <num>`) y la PR (`gh pr view`).
   - Lee `.agents/skills/auditoria/SKILL.md` y `.agents/rules/2_auditoria_codigo.md`.
   - Consulta `docs/specs/<modulo>/spec.md` y `docs/specs/global_spec.md`.
2. **Posicionamiento en Rama:**
   - Ejecuta `git fetch origin && git checkout <rama> && git pull origin <rama>`.
3. **Ejecución de Pruebas, Linter y Build (Docker):**
   - `docker compose exec backend uv run --no-sync pytest`
   - `docker compose exec backend uv run --no-sync ruff check .`
   - `docker compose exec frontend bun run build`
   - Si algo falla, detén la auditoría de inmediato con `VEREDICTO: CAMBIOS NECESARIOS`.
   - Revisa `git diff origin/develop...HEAD`: criterios Gherkin, tipado estricto Python/TypeScript, cero emojis (solo SVGs `@heroicons/react`), `<PrototypeBanner />` y categorías `OBSERVADO`/`REFERENCIA`/`SIMULADO`.
   - Si hay cambios visuales, valida `http://localhost:5173` (consola JS y logs de `backend` limpios).
4. **Veredicto y Fusión:**
   - Encabeza con **`VEREDICTO: APROBADO`** o **`VEREDICTO: CAMBIOS NECESARIOS`**.
   - **Pausa obligatoria**: NUNCA fusiones automáticamente. Espera el "OK" humano antes de `gh pr merge <id> --merge`.
