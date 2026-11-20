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
- [x] Modelar migraciones Alembic (`0002_create_atajaderos_inspecciones`), modelos SQLAlchemy 2.0, trigger PostGIS de inmutabilidad y `StrEnum` para `Atajadero` e `Inspeccion` (`#1`, PR `#11`).
- [x] Implementar endpoints principales (alta, consulta/filtros, exportación GeoJSON EPSG:4326, aviso público Forma B, detalle 1:N + historial *append-only* y subida de fotos con sello `SHA-256` a `/uploads`) (`#2`, `#3`, PR `#14`).
- [x] Implementar validación estricta con Pydantic v2 y **37 pruebas automatizadas `pytest`** contra `atajaderos_test` (flujos principales + entradas inválidas `401`/`404`/`409`/`422`).
- [x] Preparar `seed_demo.py` idempotente con 10 atajaderos en los 4 corredores críticos de Formosa rotulados `SIMULADO / DATO DE PRUEBA` + importación por lotes KoboToolbox / QField / GEE (`#3`, `#4`, PR `#14`, `#18`).
- [x] Implementar servicio de Copiloto IA *Human-in-the-Loop* en solo lectura (proxy Gemini API `gemini-3.5-flash-lite` + fallback determinístico offline) (`#4`, PR `#18`).

## 3. Frontend y Experiencia (`apps/frontend/` · React + Bun + Vite + Leaflet)
- [x] Mostrar en toda pantalla la leyenda obligatoria (`<PrototypeBanner />`) y pantalla de login con perfiles demo (`inspector@atajaderos.ar` / `referente@atajaderos.ar`).
- [x] Distinguir visualmente etiquetas de categoría (`SIMULADO`, `OBSERVADO`, `REFERENCIA`) y límites del sistema en todas las vistas.
- [x] Implementar vista responsive Mobile-First de mapa Leaflet (IGN Argenmap + Esri World Imagery + 5 trazas de riachos) + tablero de triage con KPIs, cola de decisiones y filtros (`#5`, PR `#12`, `#15`).
- [x] Implementar ruta pública offline-first `/reportar`, ficha 1:N con `SHA-256`, formulario guiado de inspección con checklist FAO/ASDSO/FHWA e importador Kobo/QField (`#5`, `#6`, PR `#12`, `#13`, `#16`).
- [x] Integrar panel del Copiloto IA *Human-in-the-Loop* conectado 100 % al backend real (`POST /api/asistente/resumir`) con confirmación humana explícita y manejo de estados de carga, vacío y error (`#6`, `#7`, PR `#13`, `#16`).

## 4. Calidad, Verificación y Entregables Finales (Jueves 19 → Viernes 20 · 18 h)
- [x] Probar flujo completo desde un **clonado limpio** siguiendo únicamente el `README.md` (`#7`).
- [x] Completar `docs/ficha_tecnica.md` (1 página), `docs/ficha_fuentes.md`, `README.md` y documentación de contrato (`#7`).
- [ ] Grabar video MP4 (≤ 120 segundos, pantalla + voz) con copia local de respaldo *(Fabrizio Ginéz)*.
- [ ] Diseñar póster y ensayar pitch de 3 minutos para el sábado 21/11 *(Fabrizio Ginéz)*.
- [ ] Etiquetar tag final evaluable `v1.0.0` en `main` antes del **viernes 20/11 a las 18:00 h**.
