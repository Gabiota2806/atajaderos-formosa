# Changelog

Todos los cambios notables de **Atajaderos Formosa (AI LAB Misión: Código Formosa · Equipo 6 UTN)** serán documentados en este archivo.
El formato sigue [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/) y versionado semántico.

## [Unreleased]
### Added
- Creación de `docs/guion_video_y_pitch.md` (guion segundo a segundo del video demo ≤ 120 s, speech de 3 minutos, Q&A y maquetación del póster técnico del sábado 21/11 — `#7`).
- Registro en `docs/ficha_fuentes.md` de las capas vectoriales IGN WFS incorporadas al mapa recortado de Formosa y control geométrico por departamento (PR `#21`).

## [1.0.0] - 2026-11-20
### Added
- **Monorepo 100 % Dockerizado:** `apps/backend/` (Python `3.12.16` + `uv` + FastAPI + SQLAlchemy 2 + Alembic + `psycopg` + Pydantic v2 + `pytest` + Ruff), `apps/frontend/` (Bun `1.4.5` + React 18 + Vite 6 + TypeScript + Tailwind CSS v4 + Leaflet + Heroicons SVG) y `postgres` (PostgreSQL `18.6` + PostGIS `3.7`).
- **Base de datos espacial y trazabilidad (`#1`, PR `#11`):** `StrEnum` de dominio (`UserRole`, `EstadoAtajadero`, `InterrupcionEscurrimiento`, `TipoEmplazamiento`, `CategoriaDato`, `TipoRegistro`, `IndicadorVisual`), migración Alembic `0002`, geometría `Point(4326)` con índice GiST y trigger PostgreSQL que garantiza inmutabilidad de `codigo_unico` (`ATJ-FSA-NNNN`).
- **API REST completa (11 endpoints) (`#2`, `#3`, `#4`, PR `#14`, `#18`):** salud (`GET /api/health`), auth JWT (`POST /api/auth/login`, `GET /api/auth/me`), aviso vecinal público (`POST /api/avisos`), inventario filtrable (`GET /api/atajaderos`), exportación SIG (`GET /api/atajaderos/geojson`), alta autenticada (`POST /api/atajaderos`), ficha 1:N *append-only* (`GET /api/atajaderos/{codigo_unico}`), registro de inspecciones/intervenciones con checklist FAO/ASDSO/FHWA y fotos selladas `SHA-256` (`POST /api/atajaderos/{codigo_unico}/inspecciones`), importación por lotes KoboToolbox/QField/GEE (`POST /api/atajaderos/importar-kobo`) y Copiloto IA *Human-in-the-Loop* en solo lectura (`POST /api/asistente/resumir`).
- **Dataset realista y capas de contexto (`#4`, PR `#18`):** seed idempotente de 10 atajaderos `SIMULADO / DATO DE PRUEBA` en 4 corredores críticos de Formosa, 5 trazas esquemáticas GeoJSON de riachos (`REFERENCIA`) y plantilla satelital `docs/ejemplos/hipotesis_satelital_gee.json`.
- **Frontend Web Responsive Mobile-First (`#5`, `#6`, PR `#12`, `#13`, `#15`, `#16`):** landing, login con perfiles demo, tablero con mapa Leaflet (IGN Argenmap `REFERENCIA` + Esri World Imagery `OBSERVADO / REFERENCIA` + corredores fluviales), modo claro/oscuro, panel de triage plegable con 4 KPIs y aviso de lecturas rezagadas (`> 14 días`), ruta pública `/reportar` con cola offline `localStorage` y auto-sincronización, ficha 1:N con `SHA-256`, asistente de inspección guiado, importador Kobo/QField y panel del Copiloto IA con confirmación humana obligatoria.
- **Documentación oficial de entrega (`#7`):** `docs/ficha_tecnica.md` (1 página), `docs/ficha_fuentes.md` completa (incluyendo aclaración de no aplicabilidad de `K1`), `README.md` con contrato de los 11 endpoints y ejemplos reproducibles (`curl` + `422`), `docs/03_antecedentes_y_soluciones_comparadas.md` y verificación desde clonado limpio.

### Changed
- Conexión 100 % real del Copiloto IA en frontend (`apps/frontend/src/lib/api.ts`, `DashboardPage.tsx`, `CopilotoIaPanel.tsx`) hacia `POST /api/asistente/resumir`, eliminando los mocks locales obsoletos (`mockBackend.ts`, `mockAtajaderos.ts`).
- Actualización del modelo Gemini por defecto a `gemini-3.5-flash-lite` y precisión de enums permitidos en `SYSTEM_INSTRUCTION` para respuestas estructuradas en modo `ia_asistida` con fallback determinístico offline intacto.
- Etiquetado SELinux `:z` en los montajes bind de `compose.yaml` (PR `#17`) para compatibilidad multiplataforma.
