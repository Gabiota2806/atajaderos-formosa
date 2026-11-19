# Backlog del Sprint (17/11 → 20/11 · 18:00 h)

> Tablero de referencia en Markdown complementario a **GitHub Issues** (`https://github.com/Gabiota2806/atajaderos-formosa/issues`).

## Leyenda de Estados
`[ ] Pendiente` · `[/] En progreso` · `[x] Completado`

## 1. Definición y Cimientos (Martes 17/11 → Miércoles 18/11)
- [x] Responder **Las 7 Preguntas** y volcar el acuerdo final en `docs/00_resumen_desafio.md`.
- [x] Definir roles de cada integrante, docente referente (`Lautaro Rolón`) y **stack tecnológico** (**Monorepo FastAPI Python/uv + React/Bun/Vite TS + PostgreSQL 18/PostGIS en Docker**).
- [x] Definir criterios escritos de estado de atajaderos (`operativo`, `con_deterioro`, `fuera_de_servicio`, `sin_validar`) y campo `interrumpe_escurrimiento`.
- [x] Crear repositorio GitHub público del Equipo 6 (`Gabiota2806/atajaderos-formosa`) con protección de ramas `main` y `develop`.
- [x] Inicializar monorepo 100 % dockerizado (`apps/backend/`, `apps/frontend/`, `compose.yaml`, `docker/init-testing-db.sql`, `docs/`, `README.md`, `.env.example`, `.gitignore`, `uv.lock`, `bun.lock`, Auth JWT + seed demo + `pytest` + Ruff + entorno agéntico).

## 2. Backend y Datos (`apps/backend/` · FastAPI + PostgreSQL 18)
- [ ] Modelar migraciones Alembic, modelos SQLAlchemy 2.0 y `StrEnum` para `Atajadero` e `Inspeccion` (con `codigo_unico` inmutable y `categoria_dato`).
- [ ] Implementar endpoints principales (alta, consulta/filtros GeoJSON, detalle + historial de inspecciones/intervenciones y subida de fotos a `/uploads`).
- [ ] Implementar validación estricta con Pydantic v2 y pruebas automatizadas `pytest` contra `atajaderos_test` (caso feliz + caso de entrada inválida).
- [ ] Preparar `seed_demo.py` con 8–12 atajaderos rotulados explícitamente como `SIMULADO / DATO DE PRUEBA` + importación KoboToolbox.
- [ ] Implementar servicio de asistente IA *Human-in-the-Loop* (Gemini API proxy + fallback determinístico offline).

## 3. Frontend y Experiencia (`apps/frontend/` · React + Bun + Vite + Leaflet)
- [x] Mostrar en toda pantalla la leyenda obligatoria (`<PrototypeBanner />`) y pantalla de login con perfiles demo (`inspector@atajaderos.ar` / `referente@atajaderos.ar`).
- [ ] Distinguir visualmente etiquetas de categoría (`SIMULADO`, `OBSERVADO`, `REFERENCIA`) y límites del sistema.
- [ ] Implementar vista de mapa Leaflet + tablero para consultar inventario, capas IGN/Sentinel-2 y filtrar por escurrimiento/estado.
- [ ] Implementar formulario de registro de atajadero e inspección/intervención con adjunto de fotografía y flujo simplificado de campo.
- [ ] Integrar panel del asistente IA *Human-in-the-Loop* con confirmación humana explícita y manejo de estados de carga, vacío y error.

## 4. Calidad, Verificación y Entregables Finales (Jueves 19 → Viernes 20 · 18 h)
- [ ] Probar flujo completo desde un **clonado limpio** siguiendo únicamente el `README.md`.
- [ ] Completar `docs/ficha_tecnica.md` (1 página) y `docs/ficha_fuentes.md`.
- [ ] Grabar video MP4 (≤ 120 segundos, pantalla + voz) con copia local de respaldo.
- [ ] Diseñar póster y ensayar pitch de 3 minutos para el sábado 21/11.
- [ ] Etiquetar commit/tag final evaluable en `main` antes del **viernes 20/11 a las 18:00 h**.
