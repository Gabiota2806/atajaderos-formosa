---
name: auditoria
description: Guía paso a paso para auditar, revisar y validar Pull Requests de GitHub Issues en Atajaderos Formosa antes del merge hacia develop. Usar ante "/auditoria" o "Modo Auditoría".
---

# Skill: Auditoría y Revisión de Código

1. **Checkout:** `gh issue view <num>`, `git fetch origin && git checkout <rama> && git pull origin <rama>`.
2. **Checks bloqueantes (Docker):**
   - `docker compose exec backend uv run --no-sync pytest`
   - `docker compose exec backend uv run --no-sync ruff check .` y `ruff format --check .`
   - `docker compose exec frontend bun run build`
   - Si algo falla, emitir `VEREDICTO: CAMBIOS NECESARIOS`.
3. **Revisión de Diff (`git diff origin/develop...HEAD`):** apego a spec SDD, tipado Python/TS, reglas AI LAB (`<PrototypeBanner />`, categorías, `codigo_unico` inmutable, entrada inválida, confirmación humana IA) y cero emojis en UI.
4. **Smoke Test Visual:** `http://localhost:5173` (consola JS y logs de `backend` limpios).
5. **Veredicto y Merge Asistido:** encabezar con `VEREDICTO: APROBADO` o `VEREDICTO: CAMBIOS NECESARIOS`. **Nunca mergear sin OK humano explícito.**
