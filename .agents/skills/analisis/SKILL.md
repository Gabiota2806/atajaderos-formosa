---
name: analisis
description: Metodología para analizar y madurar requerimientos contra el estado vivo del monorepo FastAPI + React/Bun + PostgreSQL 18 antes de planificar GitHub Issues. Usar ante "/analisis".
---

# Skill: Análisis de Requerimientos (Atajaderos Formosa)

1. **Inspección Viva (Sin modificar código ni Git):**
   - Inspeccionar `apps/backend/alembic/versions/`, `apps/backend/app/models/`, `apps/backend/app/schemas/` y `apps/backend/app/api/routes/`.
   - Inspeccionar `apps/frontend/src/pages/`, `src/components/` y `src/types/`.
   - Contrastar contra `docs/00_resumen_desafio.md`, `docs/01_arquitectura_y_contrato.md` y `docs/specs/global_spec.md`.
2. **Entrevista Corta (2–4 preguntas):** aclarar reglas de negocio, casos borde, roles (`inspector` / `referente_mesa`) y límites AI LAB.
3. **Entregable:** bloque Markdown estructurado listo para pasar a `/planificacion` y crear GitHub Issues.
