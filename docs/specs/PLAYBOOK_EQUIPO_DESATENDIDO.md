# Playbook de Desarrollo Desatendido por Rol (`/goal` · Equipo 6 UTN)

> **PROTOTIPO · AI LAB Misión: Código Formosa · no es una herramienta oficial**

Guía operativa para que cada integrante del **Equipo 6** ejecute su agente en **modo desatendido (`/goal`)** trabajando en su propio módulo sin tocar código ni tareas de otros compañeros.

---

## 1. Preparación Única en la PC de Cada Integrante (Antes de Lanzar `/goal`)

1. **Actualizar `develop` (ya contiene `00_CORE_CONTRACTS.md` y las 4 specs):**
   ```bash
   git checkout develop
   git pull origin develop
   ```
2. **Levantar o reconstruir el entorno 100 % Docker:**
   ```bash
   cp -n .env.example .env
   docker compose up -d --build
   docker compose exec backend uv run --no-sync alembic upgrade head
   docker compose exec backend uv run --no-sync python -m app.seeds.seed_demo
   ```
3. **Crear tu rama exclusiva desde `develop` (ver sección 3)** y luego abrir el chat del agente con el comando `/goal` pegando **únicamente el prompt de tu rol**.

---

## 2. Orden de Coordinación en 3 Olas (Sin Bloqueos y con Presentación Real)

- **Ola 1 — Arrancan YA en paralelo (minuto 0):**
  - **Maximiliano** ejecuta primero **Prompt 1A (Issue `#1`: modelos + Alembic `0002`)** (~5–10 min), abre PR hacia `develop` y Gabriel la aprueba. Luego Maximiliano sigue con **Prompt 1B (`#2` y `#3`)**.
  - **Matías** arranca **ya mismo en paralelo** con **Prompt 2 (`#5` y `#6`)** (no necesita esperar al backend porque consume el contrato `00_CORE_CONTRACTS.md`).
- **Ola 2 — Apenas `Issue #1` esté fusionado en `develop` (~10 min después):**
  - **Facundo (`#4`):** su seed (`seed_demo.py`) y `resumir_triage_mesa` importan los modelos `Atajadero` e `Inspeccion` de `apps/backend/app/models/` creados en el Issue `#1`.
  - Por eso, apenas `Issue #1` esté en `develop`, Facundo hace `git pull origin develop` y lanza **Prompt 3 (`#4`)** 100 % desatendido sin choques.
  - *(Alternativa sin esperar: mientras Maximiliano termina `#1`, Facundo puede avanzar con `riachosFormosaGeoJson.ts` y `hipotesis_satelital_gee.json`).*
- **Ola 3 — AL FINAL (cuando `#1` a `#6` ya estén integrados y verificados en `develop`):**
  - **Fabrizio y Gabriel** hacen `git pull origin develop`, levantan el sistema completo en Docker y lanzan **Prompt 4 (`#7`)** para tomar **capturas reales** de `http://localhost:5173` y redactar `ficha_tecnica.md`, `ficha_fuentes.md`, guion del video ≤ 120 s, speech de 3 min y diseño del póster alineados al 100 % con el sistema real terminado.

---

## 3. Prompts Listos para Copiar y Pegar con `/goal`

### 3.1. Maximiliano González — Backend & PostGIS (Issues `#1`, `#2`, `#3`)

**Paso 1A (Issue `#1` primero para destrabar a Facundo):**
```bash
git checkout -b feat/1-modelos-postgis-atajaderos develop
```
Prompt para `/goal`:
> Modo desatendido por rol (SDD): eres el implementador exclusivo del módulo Backend (`01_backend_atajaderos`).
> Lee ÚNICAMENTE `docs/specs/00_CORE_CONTRACTS.md` y `docs/specs/01_backend_atajaderos/spec.md` (RF-BK-01 y RF-BK-02), más `apps/backend/app/models/` y `apps/backend/alembic/`. NO leas ni modifiques `apps/frontend/`, `asistente_ia.py`, `seed_demo.py` ni `docs/ficha_*`.
> Implementa el Issue #1: los 6 `StrEnum` en `apps/backend/app/enums/`, modelos SQLAlchemy 2.0 `Atajadero` e `Inspeccion` con UUID v4 + `codigo_unico` inmutable + geometría PostGIS `Point(4326)`, y la migración Alembic `0002_create_atajaderos_inspecciones.py`.
> Verifica dentro de Docker ejecutando `docker compose exec backend uv run --no-sync alembic upgrade head`, `ruff check .`, `ruff format --check .` y `pytest`.
> Cuando todo esté en verde, haz commit (`feat(#1): ...`), push y crea una PR abierta hacia `develop` con `Closes #1` (PROHIBIDO auto-merge).

**Paso 1B (Issues `#2` y `#3`):**
```bash
git checkout -b feat/2-3-api-atajaderos-inspecciones develop
```
Prompt para `/goal`:
> Modo desatendido por rol (SDD): eres el implementador exclusivo del módulo Backend (`01_backend_atajaderos`).
> Lee ÚNICAMENTE `docs/specs/00_CORE_CONTRACTS.md`, `docs/specs/01_backend_atajaderos/spec.md` (RF-BK-03 a RF-BK-07) y `apps/backend/`. NO leas ni modifiques `apps/frontend/`, `asistente_ia.py` ni `seed_demo.py`.
> Implementa los Issues #2 y #3 mediante TDD estricto en `apps/backend/tests/`: schemas Pydantic v2 (validando bounding box de Formosa `-27.0..-22.0`, `-62.5..-57.5`), endpoints `/api/atajaderos`, `/api/atajaderos/geojson`, `/api/avisos` (público forzado a `sin_validar` + `a_verificar`), `/api/atajaderos/{codigo_unico}/inspecciones` (checklist FAO/FHWA, fotos `/uploads` con hash `SHA-256` y máquina de estados `422`) y `/api/atajaderos/importar-kobo`, registrando los routers en `apps/backend/app/main.py`.
> Verifica 100 % en Docker (`alembic upgrade head`, `pytest`, `ruff check .`, `ruff format --check .`), haz commit referenciando `#2` y `#3`, push y abre PR hacia `develop` con `Closes #2` y `Closes #3` (PROHIBIDO auto-merge).

---

### 3.2. Matías Daniel Núñez — Frontend React/Bun + Leaflet (Issues `#5`, `#6`)
```bash
git checkout -b feat/5-6-frontend-mapa-y-flujos develop
```
Prompt para `/goal`:
> Modo desatendido por rol (SDD): eres el implementador exclusivo del módulo Frontend (`02_frontend_react_bun`).
> Lee ÚNICAMENTE `docs/specs/00_CORE_CONTRACTS.md`, `docs/specs/02_frontend_react_bun/spec.md` y `apps/frontend/src/`. TIENES PROHIBIDO leer o modificar `apps/backend/` y NO modifiques `apps/frontend/src/data/riachosFormosaGeoJson.ts` (solo impórtalo si existe, o usa una constante temporal inline dentro de `MapaAtajaderos.tsx` si aún no se fusionó la rama de Facundo, manteniendo el contrato GeoJSON).
> Tienes libertad total sobre la estética visual y fidelidad a tus mockups, respetando obligatoriamente: `<PrototypeBanner />` visible en toda vista, etiquetas `SIMULADO`/`OBSERVADO`/`REFERENCIA`, solo íconos `@heroicons/react` (0 emojis), diseño 100 % responsive Mobile-First en todas las vistas, `public/manifest.webmanifest` y los 7 RFs (`RF-FE-01` a `RF-FE-07`: mapa Leaflet real de Formosa, tabla con `fecha_ultima_inspeccion`, descarga GeoJSON, ruta pública `/reportar` con cola offline en `localStorage` y auto-envío `online`, ficha 1:N con hash `SHA-256`, formulario con checklist FAO/FHWA, importador Kobo y Copiloto IA con confirmación humana).
> Verifica con `docker compose exec frontend bun run build` (`tsc --noEmit && vite build`), comprueba 0 emojis en `apps/frontend/src/` y revisa que `http://localhost:5173` renderice sin errores JS. Haz commit referenciando `#5` y `#6`, push y abre PR hacia `develop` con `Closes #5` y `Closes #6` (PROHIBIDO auto-merge).

---

### 3.3. Facundo Joaquín Leiva — GeoAI, Seed Realista de Formosa y Capas SIG (Issue `#4`)
*(Asegurarse de hacer `git pull origin develop` con Issue `#1` ya fusionado).*
```bash
git checkout -b feat/4-geoai-seed-formosa develop
```
Prompt para `/goal`:
> Modo desatendido por rol (SDD): eres el implementador exclusivo del módulo GeoAI y Datos (`03_geoai_apis_datos`).
> Lee ÚNICAMENTE `docs/specs/00_CORE_CONTRACTS.md`, `docs/specs/03_geoai_apis_datos/spec.md`, `apps/backend/app/models/` y `apps/backend/app/enums/`. NO modifiques `apps/backend/app/models/`, `apps/backend/app/api/routes/atajaderos.py`, ni `apps/frontend/src/pages/` o `components/`.
> Implementa el Issue #4:
> 1. `apps/backend/app/schemas/asistente.py`, `apps/backend/app/services/asistente_ia.py` (Modo 1 `estructurar_nota_campo` y Modo 2 `resumir_triage_mesa` con Gemini API proxy + fallback determinístico offline sin escribir nunca en BD) y `apps/backend/app/api/routes/asistente.py` (registrando `asistente.router` en `main.py`).
> 2. `apps/backend/app/seeds/seed_demo.py` idempotente con los usuarios demo y los 10 atajaderos `SIMULADO` sobre los 4 corredores reales de Formosa + sus inspecciones 1:N.
> 3. `apps/frontend/src/data/riachosFormosaGeoJson.ts` y `docs/ejemplos/hipotesis_satelital_gee.json`.
> 4. Suite TDD `apps/backend/tests/test_asistente.py` (Modo 1, Modo 2, fallback offline y rechazo `422`).
> Verifica en Docker ejecutando 2 veces `python -m app.seeds.seed_demo`, `pytest`, `ruff check .` y `ruff format --check .`. Haz commit (`feat(#4): ...`), push y abre PR hacia `develop` con `Closes #4` (PROHIBIDO auto-merge).

---

### 3.4. Fabrizio Facundo Ginéz & Antonio Gabriel Pineda — Documentación, Video, Speech y Póster (Issue `#7`)
*(Ejecutar en Ola 3 — al FINAL, cuando las PRs de `#1` a `#6` ya estén integradas en `develop` y levantadas en Docker).*
```bash
git checkout -b docs/7-entrega-ficha-guion develop
```
Prompt para `/goal`:
> Modo desatendido por rol (SDD): eres el responsable exclusivo del módulo de Entrega Final (`04_entrega_speech_poster`).
> Lee ÚNICAMENTE `docs/specs/00_CORE_CONTRACTS.md`, `docs/03_antecedentes_y_soluciones_comparadas.md`, `docs/specs/04_entrega_speech_poster/spec.md`, `docs/specs/CHECKLIST_RESULTADO_FINAL.md`, `docs/ficha_tecnica.md`, `docs/ficha_fuentes.md` y `README.md`. TIENES PROHIBIDO tocar archivos dentro de `apps/`.
> Con el sistema completo corriendo en `http://localhost:5173` y `http://localhost:8000/docs`, usa el navegador/Playwright para inspeccionar y tomar capturas reales de las pantallas terminadas (escritorio y móvil) y verificar el flujo E2E de `docs/specs/CHECKLIST_RESULTADO_FINAL.md`.
> Implementa el Issue #7: completa `docs/ficha_tecnica.md` (1 página), verifica consistencia de `docs/ficha_fuentes.md`, redacta `docs/guion_video_y_pitch.md` (guion segundo a segundo del video MP4 ≤ 120 s basado en las pantallas reales, speech de 3 minutos y estructura del póster del sábado 21/11 con las capturas reales cubriendo los 100 pts de la rúbrica) y actualiza `README.md` y `docs/changelog.md`.
> Haz commit (`docs(#7): ...`), push y abre PR hacia `develop` con `Closes #7` (PROHIBIDO auto-merge).

---

## 4. Rol del Integrador / QA (Gabriel Pineda) al Recibir las PRs
1. Auditar cada PR en orden (`#1` → `#2/#3` → `#4` → `#5/#6` → `#7`) ejecutando `/auditoria #<num>`.
2. Verificar integración completa en Docker (`alembic upgrade head`, `seed_demo`, `pytest`, `ruff`, `bun run build`) y flujo E2E en navegador móvil y escritorio.
3. Aprobar y fusionar manualmente hacia `develop` (y luego crear el release final hacia `main` antes del viernes 20/11 a las 18:00 h).
