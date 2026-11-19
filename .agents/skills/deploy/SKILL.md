---
name: deploy
description: Guía para ejecutar releases seguros de develop hacia main y etiquetar la versión evaluable de la competencia. Usar ante "/deploy" o "Modo Deploy".
---

# Skill: Release y Tag Evaluable (`develop` -> `main`)

1. **Verificaciones Pre-Release (100 % Docker):**
   - `git checkout develop && git pull origin develop && git status`
   - `docker compose exec backend uv run --no-sync pytest`
   - `docker compose exec backend uv run --no-sync ruff check .` y `ruff format --check .`
   - `docker compose exec frontend bun run build`
   - Verificar `docs/ficha_tecnica.md`, `docs/ficha_fuentes.md`, `README.md`, `uv.lock` y `bun.lock`.
2. **Pull Request `develop -> main` (Sin Auto-Merge sin OK):**
   - `gh pr create --base main --head develop --title "Release vX.Y.Z: Entrega evaluable AI LAB"`.
   - Esperar confirmación humana antes de `gh pr merge` y etiquetar (`git tag -a vX.Y.Z -m "..." && git push origin vX.Y.Z`).
3. **Verificación Post-Merge:** probar arranque desde clonado limpio (`docker compose up -d --build`, migraciones, seed y `GET /api/health`).
