# Checklist de Resultado Final — Sistema Terminado (Issues #1 a #7)

> **PROTOTIPO · AI LAB Misión: Código Formosa · no es una herramienta oficial**

Documento de verificación integral para **Antonio Gabriel Pineda (QA / Integrador)** y todo el **Equipo 6**. Define exactamente **qué debe existir, funcionar y pasar pruebas** una vez integradas las Olas 1 y 2 (`#1` a `#6`) y antes de ejecutar la Ola 3 (`#7`: capturas reales, video, póster, pitch y release en `main` antes del viernes 20/11 a las 18:00 h).

---

## 1. Base de Datos y Persistencia (PostgreSQL 18 + PostGIS 3.7)

Al ejecutar `alembic upgrade head` y `python -m app.seeds.seed_demo`:
- [x] Existen las tablas `users`, `atajaderos` e `inspecciones` con claves primarias `UUID v4` (en `atajaderos` e `inspecciones`) y `id` en `users`.
- [x] La tabla `atajaderos` posee `codigo_unico` único e inmutable (`ATJ-FSA-NNNN`), `tipo_emplazamiento`, `estado`, `interrumpe_escurrimiento`, `categoria_dato`, `fecha_ultima_inspeccion` y geometría espacial `geom geometry(Point, 4326)` compatible con QGIS/PostGIS.
- [x] Existen los **2 usuarios demo** (`inspector@atajaderos.ar` y `referente@atajaderos.ar`, clave `password`).
- [x] Existen exactamente **10 atajaderos `SIMULADO`** distribuidos en coordenadas reales de los **4 corredores críticos de Formosa** (*El Porteño–He-Hé*, *Monte Lindo/Laguna Gallo*, *Pilagá/Mojón de Fierro* y *Bañado La Estrella–Salado*), con su historial 1:N inicial (incluyendo registros `sin_validar`, lecturas rezagadas `> 14 días` y casos `interrumpe_escurrimiento = si`).
- [x] Ejecutar `seed_demo` dos veces seguidas es **100 % idempotente** (no duplica registros).

---

## 2. Backend FastAPI y Pruebas Automatizadas (`apps/backend/`)

Al ejecutar `docker compose exec backend uv run --no-sync pytest`, `ruff check .` y `ruff format --check .`:
- [x] **100 % de los tests en verde** (`37 passed`) contra la base `atajaderos_test` y **0 errores de Ruff**.
- [x] **11 endpoints operativos en Swagger (`/docs`):**
  1. `GET /api/health` (devuelve `es_prototipo: true` e `ia_modo`).
  2. `POST /api/auth/login` y `GET /api/auth/me` (JWT + Argon2).
  3. `POST /api/avisos` *(público — Forma B)*: crea aviso con foto opcional sellada `SHA-256`, forzado en backend a `sin_validar` + `a_verificar` + `a_determinar`.
  4. `GET /api/atajaderos` (filtros combinados por estado, escurrimiento, emplazamiento, categoría, departamento, cuenca y búsqueda `q`).
  5. `GET /api/atajaderos/geojson` (`FeatureCollection` EPSG:4326 descargable y abrible directo en QGIS/QField).
  6. `POST /api/atajaderos` (autogenera `ATJ-FSA-NNNN`, valida coordenadas dentro de Formosa, rechaza `409` duplicados y `422` inválidos).
  7. `GET /api/atajaderos/{codigo_unico}` (ficha + historial 1:N ordenado descendentemente).
  8. `POST /api/atajaderos/{codigo_unico}/inspecciones` (`multipart/form-data` o JSON, checklist de 5 patologías FAO/FHWA, foto guardada en `/uploads` con hash `SHA-256`, actualización de `fecha_ultima_inspeccion`, rechazo `422` si intenta regresar a `sin_validar` o enviar observaciones `< 10` caracteres).
  9. `POST /api/atajaderos/importar-kobo` (importación masiva de lotes offline KoboToolbox / QField / scripts satelitales externos).
  10. `POST /api/asistente/resumir` (Copiloto IA en modo solo lectura con `estructurar_nota_campo`, `resumir_triage_mesa` y fallback automático a `deterministico_offline` sin escribir jamás en BD).

---

## 3. Frontend Web Responsive Mobile-First (`apps/frontend/`)

Al ejecutar `docker compose exec frontend bun run build` (`tsc --noEmit && vite build`) y navegar en `http://localhost:5173` (tanto en escritorio `1280px+` como en móvil `390x844`):
- [x] **Cero errores de TypeScript/Vite, cero errores en consola JS y cero emojis de texto** (solo `@heroicons/react`).
- [x] **`<PrototypeBanner />` visible en todas las vistas** (`/`, `/login`, `/reportar`, `/dashboard`) con la leyenda oficial.
- [x] **100 % Responsive Mobile-First en todas las pantallas:** sin scroll horizontal en celular (`360px–640px`), tablet ni PC, y con `manifest.webmanifest` funcional.
- [x] **Mapa Leaflet real de Formosa:** centrado en la provincia, alternando capa base Vial/IGN (`REFERENCIA`) y Satelital Esri (`OBSERVADO / REFERENCIA`), con las 5 trazas GeoJSON de los 4 corredores de riachos (`REFERENCIA`) y marcadores con semáforo (`rojo = si`, `ámbar = a_verificar`, `verde = no`).
- [x] **Tablero de Triage:** 4 KPIs operativos, filtros funcionales, etiquetas visibles (`SIMULADO`, `OBSERVADO`, `REFERENCIA`), columna **Última Inspección** (mostrando `SIN LECTURA` o días de rezago) y botón de descarga GeoJSON para QGIS/QField.
- [x] **Ruta Pública `/reportar` (Aviso Vecinal Offline):** accesible sin login, con GPS móvil / clic en mapa, cámara trasera y **cola offline en `localStorage`** que guarda avisos sin internet y los envía automáticamente al recuperar conexión (`online`).
- [x] **Flujo de Inspección Completo:** Ficha maestra con `codigo_unico` inmutable, línea de tiempo 1:N *append-only* con fotos y hash `SHA-256`, formulario con criterios escritos desplegados, checklist de 5 patologías FAO/FHWA, manejo visual limpio de errores `HTTP 422`, importador Kobo/QField y **Copiloto IA conectado al backend real con botón obligatorio de confirmación humana**.

---

## 4. Prueba End-to-End de Aceptación (Guión de Validación QA + Demo al Jurado)

Antes de ejecutar la **Ola 3 (`#7`)** y hacer el merge final hacia `main`, ejecutar este recorrido completo en vivo:
1. **Clonado limpio:** `git clone` en carpeta temporal + `cp .env.example .env` + `docker compose up -d --build` + `alembic upgrade head` + `seed_demo`.
2. **Aviso Vecinal Offline (`/reportar` en celular vía `./scripts/tunnel.sh start 5173`):** simular corte de red, enviar aviso en A° Tatú Piré (`Monte Lindo`), verificar que queda en cola local, restaurar red y comprobar que se envía solo generando un `ATJ-FSA-NNNN` en estado `sin_validar`.
3. **Triage del Referente (`/dashboard` con `referente@atajaderos.ar`):** filtrar bloqueos `si`, abrir `ATJ-FSA-0001`, consultar al **Copiloto IA (Modo 2)** y comprobar que resume riesgo en cascada y Ley 1.246 / 1.314 / Decreto-Ley 971/80 sin alterar la BD.
4. **Validación en Terreno del Inspector (`inspector@atajaderos.ar`):** usar **Copiloto IA (Modo 1)** sobre nota cruda, pulsar **«Confirmación Humana: Aplicar Borrador al Formulario»**, tildar indicadores FAO/FHWA, subir foto real y guardar; comprobar en la ficha el nuevo evento 1:N con su hash `SHA-256` y `fecha_ultima_inspeccion` actualizada.
5. **Prueba de Rigor (`422`):** intentar registrar un atajadero con latitud fuera de Formosa (ej. `-34.60`) y comprobar rechazo controlado `HTTP 422`.
6. **Interoperabilidad:** descargar el `GeoJSON` desde el botón del tablero y verificar que contiene los puntos válidos en EPSG:4326.

---

## 5. Entregables Documentales y Audiovisuales (Ola 3 — Viernes 20/11 · 18:00 h y Sábado 21/11)

Una vez verificados los puntos 1 a 4 con el sistema real funcionando:
- [ ] Capturas reales tomadas de la aplicación definitiva (`http://localhost:5173`) en escritorio y móvil *(Fabrizio Ginéz)*.
- [x] `README.md` actualizado y probado en clonado limpio.
- [x] `docs/ficha_tecnica.md` completa (1 página).
- [x] `docs/ficha_fuentes.md` completa con todas las fuentes (`OBSERVADO`, `REFERENCIA`, `SIMULADO`).
- [x] `docs/changelog.md` actualizado con todos los cambios integrados.
- [ ] Video MP4 de demostración (≤ 120 segundos, pantalla real + voz + copia local de respaldo) *(Fabrizio Ginéz)*.
- [ ] Póster impreso / digital (con capturas reales) y Speech de 3 minutos ensayado *(Fabrizio Ginéz)*.
- [ ] Commit final y tag evaluable `v1.0.0` en rama `main` antes del **viernes 20/11 a las 18:00 h**.
