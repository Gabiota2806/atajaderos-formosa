# Ficha técnica · AI LAB Misión: Código Formosa
PROTOTIPO · no es una herramienta oficial · Entrega: viernes 20/11/2026, 18 h

**Nombre de la herramienta:** Atajaderos Formosa — Operación Agua
**Equipo · institución · integrantes y rol de cada uno:** Equipo 6 · Los Más Experimentados · UTN Extensión Áulica Formosa — **Enrique Maximiliano González** (*Arquitectura, modelos PostGIS/Alembic y API REST FastAPI*), **Matías Daniel Núñez** (*Frontend React/Bun, identidad cartográfica, mapa Leaflet, `/reportar` offline y modales*), **Facundo Joaquín Leiva** (*Copiloto IA HITL con proxy Gemini/fallback, datos, fuentes y GeoAI*), **Antonio Gabriel Pineda** (*Infraestructura Docker, contratos SDD, seed demo, QA integral y documentación*), **Fabrizio Facundo Ginéz** (*Producto, narrativa, póster técnico, video demo y pitch*). Docente referente: **Lautaro Rolón**.
**Reto:** Desafío 1 · Atajaderos (Operación Agua)

## Usuario y pregunta
Está dirigida a técnicos e inspectores de la mesa interinstitucional por El Niño en Formosa —agentes que relevan obras en territorio y referentes que priorizan intervenciones desde el tablero—. Responde a cómo organizar información territorial trazable para inventariar atajaderos con código único inmutable, registrar su estado e historial y detectar cuáles interrumpen el escurrimiento de los riachos.

## Qué funciona hoy
- **Inventario georreferenciado y tablero de triage responsive (Mobile-First):** mapa interactivo Leaflet centrado en Formosa con capas alternables (IGN Argenmap `REFERENCIA` y Esri World Imagery `OBSERVADO / REFERENCIA`), 5 trazas esquemáticas de corredores fluviales (`REFERENCIA`), 4 KPIs operativos, filtros por escurrimiento/estado/cuenca/texto, cola de prioridad y columna de última inspección con aviso de lecturas rezagadas (`> 14 días`).
- **Trazabilidad 1:N *append-only* y cadena de custodia:** alta de atajaderos con `codigo_unico` inmutable (`ATJ-FSA-NNNN`, protegido por trigger en PostgreSQL/PostGIS), ficha de detalle con historial inmutable de inspecciones/intervenciones, criterios escritos desplegados, checklist de 5 patologías visuales (FAO Paper 64 / ASDSO / FHWA) y fotos selladas con hash `SHA-256`.
- **Aviso vecinal público offline-first (`/reportar`):** formulario sin login con GPS/selección en mapa y cámara trasera; sin señal guarda los avisos en `localStorage` y los envía automáticamente al reconectarse (`POST /api/avisos`), forzándolos siempre en backend a `sin_validar` + `a_verificar`.
- **Interoperabilidad SIG y campo:** importador por lotes JSON/GeoJSON compatible con KoboToolbox, QField y plantillas de hipótesis satelitales externas (`POST /api/atajaderos/importar-kobo`), y exportación `GeoJSON` EPSG:4326 (`GET /api/atajaderos/geojson`) abrible directo en QGIS/QField.
- **Copiloto IA *Human-in-the-Loop* (solo lectura):** conectado a `POST /api/asistente/resumir` en dos modos (estructurar notas crudas de campo y sintetizar triage por atajadero) con confirmación humana obligatoria y degradación determinística offline automática.
- **Rigor verificado:** validación estricta `HTTP 422`/`409`/`401` en backend, 11 endpoints conectados de punta a punta, **37 tests `pytest`** en verde, Ruff limpio, build TypeScript/Vite limpio y ejecución verificada desde clonado limpio en Docker.

## Qué falta para que la mesa la use
- **Validación técnica de criterios (prioridad 1):** los 4 criterios de estado y el umbral de rezago (`> 14 días`) son una propuesta preliminar del equipo y deben ser revisados y aprobados por técnicos de la mesa (UPCA, MPyA y DPV).
- **Datos oficiales:** incorporar el relevamiento provincial de atajaderos en curso (hoy no publicado) y reemplazar las trazas esquemáticas de riachos por capas vectoriales oficiales IGN/UPCA.
- **Operación institucional:** despliegue en servidor provincial con HTTPS, backups automáticos, almacenamiento de objetos para evidencias fotográficas, gestión de usuarios/auditoría institucional conforme al Decreto-Ley N° 971/1980 e integración directa con KoboToolbox/QFieldCloud y Vialidad (DPV).
- **Tiempo estimado:** Fase 1 piloto operativo en 2 corredores críticos (*Monte Lindo* y *El Porteño–He-Hé*): **4 a 8 semanas**; Fase 2 estandarización, protocolo fotográfico y convenios (INTA/CONAE): **3 a 6 meses**.

## Cómo está hecha
- **Stack 100 % Docker (`compose.yaml`):** `apps/backend/` (Python `3.12.16`, `uv`, FastAPI `0.165`, SQLAlchemy `2.1`, Alembic, Pydantic v2, PyJWT, Argon2, `pytest`, Ruff), `apps/frontend/` (Bun `1.4.5`, React `18.3`, Vite `6.4`, TypeScript `5.8`, Tailwind CSS `4.1`, Leaflet `1.9.4`, `@heroicons/react`) y `postgres` (PostgreSQL `18.6` + PostGIS `3.7`).
- **IA en el producto:** proxy en FastAPI hacia **Gemini API** (`gemini-3.5-flash-lite`, configurable vía `GEMINI_API_KEY` opcional) con degradación determinística offline automática (`deterministico_offline`); solo redacta borradores o resume historial y jamás escribe en base de datos ni asigna estados sin confirmación humana.
- **IA en el desarrollo:** asistentes agénticos de código (*Antigravity*, *Claude Code* y *OpenCode*) organizados bajo metodología SDD por rol (`docs/specs/`), con verificación manual de todas las fuentes/URLs, Pull Requests revisadas por el equipo y suite automatizada (`pytest`, Ruff, `tsc`).

## Lo que la herramienta no puede decir
- Los criterios escritos de estado y el umbral de rezago (`> 14 días`) son preliminares y **no fueron validados aún por un técnico oficial**; la herramienta no asigna estados técnicos definitivos ni aplica sanciones.
- No reemplaza inspecciones presenciales en terreno ni puede determinar profundidad, cota exacta ni estabilidad geotécnica desde imágenes satelitales.
- No contiene el relevamiento oficial provincial (los 10 atajaderos precargados son **`SIMULADO / DATO DE PRUEBA`**).
- No utiliza la serie hidrométrica `K1` del río Paraguay ni emite alertas tempranas o pronósticos hidrológicos oficiales; toda decisión operativa permanece bajo responsabilidad humana (Decreto-Ley N° 971/1980).

## Cómo se arranca (cinco líneas)
1. `git clone https://github.com/Gabiota2806/atajaderos-formosa.git && cd atajaderos-formosa`
2. `cp .env.example .env && docker compose up -d --build`
3. `docker compose exec backend uv run --no-sync alembic upgrade head`
4. `docker compose exec backend uv run --no-sync python -m app.seeds.seed_demo`
5. Abrir `http://localhost:5173` (Swagger en `http://localhost:8000/docs` · cuentas demo `inspector@atajaderos.ar` y `referente@atajaderos.ar`, clave `password` · tests: `docker compose exec backend uv run --no-sync pytest`).

## Repositorio
- **Tema elegido:** Desafío 1 · Atajaderos (Operación Agua)
- **URL del monorepo GitHub:** https://github.com/Gabiota2806/atajaderos-formosa
- **Tag evaluable:** `v1.0.0` (rama `main`: https://github.com/Gabiota2806/atajaderos-formosa/releases/tag/v1.0.0)
- **Frontend / Backend / Configuración:** `apps/frontend/` (React + Bun + Vite TS) · `apps/backend/` (FastAPI + Python 3.12 + `uv`) · PostgreSQL 18 + PostGIS 3.7 en `compose.yaml` · Variables en `.env.example` (sin secretos) · Comandos QA: `pytest -v`, `ruff check .`, `ruff format --check .` y `bun run build`.
