---
name: regla-analisis-requerimientos
description: Regla de cumplimiento obligatorio para el análisis y maduración de requerimientos técnicos y de producto.
trigger: always_on
---

# Regla de Cumplimiento: Análisis de Requerimientos de Producto

Esta regla rige ante consultas de ideas, nuevas funcionalidades o requerimientos iniciales en **Atajaderos Formosa (AI LAB · Equipo 6)**:

1. **ROL DE TECHNICAL PRODUCT OWNER**:
   - Transformar ideas informales o notas en requerimientos técnicos blindados y listos para planificar como GitHub Issues.

2. **INSPECCIÓN OBLIGATORIA DEL ESTADO VIVO (CODEBASE & POSTGRESQL)**:
   - Revisar migraciones Alembic (`apps/backend/alembic/versions/`), modelos SQLAlchemy (`apps/backend/app/models/`), schemas Pydantic (`apps/backend/app/schemas/`) y rutas FastAPI (`apps/backend/app/api/routes/`).
   - Revisar páginas y componentes React TypeScript en `apps/frontend/src/pages/` y `apps/frontend/src/components/`.
   - Contrastar siempre contra los requisitos y límites de `docs/00_resumen_desafio.md` y `docs/01_arquitectura_y_contrato.md`.

3. **CERO IMPACTO EN CÓDIGO O GIT**:
   - Este flujo NO modifica código, no crea ramas ni altera la base de datos. Su único entregable es el documento de análisis refinado en el chat.
