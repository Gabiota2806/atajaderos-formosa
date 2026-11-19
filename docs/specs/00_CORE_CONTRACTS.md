# 00 · Contratos Base del Sistema (Single Source of Truth — SDD)

> **PROTOTIPO · AI LAB Misión: Código Formosa · no es una herramienta oficial**
> **Responsable de Control:** Antonio Gabriel Pineda (Documentación, Contratos y QA · Equipo 6 UTN)
> **Regla Estricta de Contexto (Anti-Agotamiento de Tokens):** Todo agente asignado a un módulo (`01_` a `04_`) DEBE leer exclusivamente este archivo (`docs/specs/00_CORE_CONTRACTS.md`) y su `spec.md` asignada. Tiene PROHIBIDO indexar o leer archivos de otros módulos fuera de su perímetro.

---

## 1. Reglas No Negociables del Desafío AI LAB
1. **Leyenda visible en toda pantalla:** `PROTOTIPO · AI LAB Misión: Código Formosa · no es una herramienta oficial` (`<PrototypeBanner />`).
2. **Taxonomía de datos obligatoria:** Todo registro y capa se rotula explícitamente como `OBSERVADO`, `REFERENCIA` o `SIMULADO`.
3. **Código único inmutable (`codigo_unico`):** Formato `ATJ-FSA-NNNN` (ej. `ATJ-FSA-0001`). Jamás cambia aunque cambie `nombre_referencia`, `estado` o `interrumpe_escurrimiento`, ni se reutiliza si la obra se desmantela o pasa a `fuera_de_servicio`.
4. **Límite jurídico e IA (*Human-in-the-Loop*, Decreto-Ley N° 971/1980):** La IA y los satélites jamás asignan estados definitivos ni escriben en PostgreSQL automáticamente; toda transición de estado requiere confirmación humana firmada por un usuario autenticado.
5. **Validación estricta (`HTTP 422`):** Toda entrada inválida (coordenadas fuera de Formosa, enum inexistente, observación vacía o intento de mutar `codigo_unico` / regresar a `sin_validar`) debe rechazarse con `HTTP 422`.
6. **Iconografía y Diseño Responsive Mobile-First (Todas las Vistas):** Exclusivamente `@heroicons/react` (SVGs vectoriales `h-4 w-4` / `h-5 w-5`), prohibición absoluta de emojis. **Todas las vistas** (`/`, `/login`, `/reportar`, `/dashboard`, mapa Leaflet, tabla/tarjetas, modales y Copiloto IA) DEBEN ser **100 % responsivas (*Mobile-First*, sin scroll horizontal en 360 px–640 px, tablet 768 px y escritorio $\ge 1280\text{ px}$)**, con `manifest.webmanifest` instalable en navegador móvil (sin generar APK nativo Android).
7. **Desacoplamiento de Scripts Satelitales Externos:** El prototipo **NO** ejecuta algoritmos satelitales ni CNN en vivo. Las imágenes Sentinel-2 / MapBiomas / Global Surface Water se consultan como capas de referencia visual y nuestra API queda preparada para que especialistas externos (UPCA / INTA / CONAE / Google Earth Engine) inyecten sus hipótesis satelitales como registros `sin_validar` + `a_verificar`.
8. **Entorno 100 % Docker (`compose.yaml`):**
   - Tests backend: `docker compose exec backend uv run --no-sync pytest`
   - Linter backend: `docker compose exec backend uv run --no-sync ruff check .` y `ruff format --check .`
   - Migraciones: `docker compose exec backend uv run --no-sync alembic upgrade head`
   - Seed demo: `docker compose exec backend uv run --no-sync python -m app.seeds.seed_demo`
   - Build frontend: `docker compose exec frontend bun run build` (`tsc --noEmit && vite build`)

---

## 2. Diccionario Global de Tipos y `StrEnum` (Backend Python ↔ Frontend TypeScript)

| Tipo (`StrEnum` en `apps/backend/app/enums/` ↔ Union TS en `apps/frontend/src/types/index.ts`) | Valores Permitidos (Exactos) | Significado / Criterio Escrito |
| :--- | :--- | :--- |
| `UserRole` | `inspector`, `referente_mesa` | Inspector releva en terreno; Referente prioriza y audita en mesa interinstitucional. |
| `EstadoAtajadero` | `sin_validar`, `operativo`, `con_deterioro`, `fuera_de_servicio` | `sin_validar`: registro preliminar (aviso vecinal, denuncia o indicio satelital) sin visita presencial. `operativo`: estructura íntegra con paso/vertedero funcional en última inspección. `con_deterioro`: erosión, pérdida de borde libre, colmatación o falta de vertedero. `fuera_de_servicio`: obra colapsada, removida o inhabilitada. |
| `InterrupcionEscurrimiento` | `si`, `no`, `a_verificar` | Dato prioritario frente a El Niño (`si` = bloqueo activo del escurrimiento natural del riacho o alcantarilla). |
| `TipoEmplazamiento` | `en_cauce_activo`, `lateral_fuera_de_cauce`, `alcantarilla_vial`, `a_determinar` | Concilia **Ley N° 1.246 (Art. 88° Registro de Atajaderos laterales)** vs. **Ley N° 1.314 (Art. 40° prohibición sobre corrientes activas)** y alertas de Vialidad (DPV). |
| `CategoriaDato` | `SIMULADO`, `OBSERVADO`, `REFERENCIA` | Todo dato del seed de demostración DEBE ser `SIMULADO`. |
| `TipoRegistro` | `inspeccion`, `intervencion` | `inspeccion`: relevamiento técnico presencial. `intervencion`: intimación formal, apertura de aliviadero, limpieza o remoción mecánica. |
| `IndicadorVisual` *(Protocolo FAO Paper 64 / ASDSO / FHWA)* | `cierre_total_sin_vertedero`, `riesgo_sobrepaso_borde_libre`, `filtracion_turbia_tubificacion`, `grietas_o_bioperturbacion`, `alcantarilla_obstruida` | Las 5 patologías observables a simple vista en terreno que ningún satélite puede diagnosticar. |

---

## 3. Máquina de Estados del Atajadero y Reglas de Transición

### Estados y Condiciones de Entrada
1. **`sin_validar`** *(Estado Inicial Obligatorio para avisos vecinales, denuncias municipales o hipótesis satelitales sin inspección presencial)*
   - `interrumpe_escurrimiento` por defecto: `a_verificar`.
   - `fecha_ultima_inspeccion`: `null`.
2. **`operativo` / `con_deterioro` / `fuera_de_servicio`** *(Estados Técnicos Validados)*
   - **Condición Obligatoria:** Al actualizar un atajadero existente, solo se alcanzan mediante una `Inspeccion` (`POST /api/atajaderos/{codigo_unico}/inspecciones`) con `observaciones` no vacías ($\ge 10$ caracteres) y `responsable` autenticado, actualizando `fecha_ultima_inspeccion`.

### Matriz de Transiciones Válidas e Inválidas (Obligatorio cubrir en `pytest`)

| Desde | Hacia | ¿Permitida? | Condición Obligatoria |
| :--- | :--- | :-: | :--- |
| *(Alta aviso / indicio satelital)* | `sin_validar` | **SÍ** | Requiere coordenadas en Formosa (`-27.0 <= lat <= -22.0`, `-62.5 <= lon <= -57.5`). |
| `sin_validar` | `operativo` / `con_deterioro` / `fuera_de_servicio` | **SÍ** | Vía registro de `Inspeccion` presencial (`tipo_registro = inspeccion`). |
| `con_deterioro` | `operativo` | **SÍ** | Vía registro de `Inspeccion` con `tipo_registro = intervencion` (ej. apertura de vertedero / limpieza) o `inspeccion` verificando adecuación. |
| `operativo` / `con_deterioro` | `fuera_de_servicio` | **SÍ** | Vía `inspeccion` (colapso) o `intervencion` (remoción mecánica); **el `codigo_unico` permanece inmutable**. |
| `operativo` / `con_deterioro` / `fuera_de_servicio` | `sin_validar` | **NO (`422`)** | Prohibido regresar un activo ya inspeccionado presencialmente a `sin_validar` (regresión de trazabilidad). |
| *Cualquier estado* | *(Cambio de `codigo_unico`)* | **NO (`422`)** | El `codigo_unico` es estrictamente inmutable tras su creación. |
| *Cualquier estado* | *(Mutación directa por Copiloto IA)* | **NO** | `POST /api/asistente/resumir` es de **solo lectura** respecto a PostgreSQL. |

---

## 4. Esquema OpenAPI Base (Contrato REST `/api`)

| Método y Ruta | Auth | Request Clave | Response Clave | Errores Esperados |
| :--- | :---: | :--- | :--- | :--- |
| `GET /api/health` | Pública | — | `{ status, es_prototipo, leyenda, modo_ia }` | — |
| `POST /api/auth/login` | Pública | `{ email, password }` | `{ access_token, token_type, user }` | `401` credenciales inválidas |
| `POST /api/avisos` | Pública *(Forma B)* | `multipart/form-data` o JSON: `nombre_referencia`, `latitud`, `longitud`, `departamento`, `cuenca_riacho`, `descripcion_aviso`, `reportado_por?`, `foto?` | `201 Created` (`AtajaderoDetail` forzado a `estado="sin_validar"`, `interrumpe_escurrimiento="a_verificar"`, `tipo_emplazamiento="a_determinar"`, `categoria_dato="SIMULADO"`) | `422` coords fuera de Formosa / descripción $< 10$ chars / archivo no imagen |
| `GET /api/auth/me` | JWT | Bearer Token | `{ id, name, email, role }` | `401` token inválido |
| `GET /api/atajaderos` | JWT | Query: `estado`, `interrumpe_escurrimiento`, `tipo_emplazamiento`, `departamento`, `cuenca_riacho`, `q` | `{ total, items: AtajaderoSummary[] }` *(incluye `fecha_ultima_inspeccion` y `total_inspecciones`)* | `401` |
| `GET /api/atajaderos/geojson` | JWT | Mismos filtros que listado | `FeatureCollection` GeoJSON EPSG:4326 *(compatible QGIS/QField)* | `401` |
| `POST /api/atajaderos` | JWT | `{ nombre_referencia, latitud, longitud, departamento, cuenca_riacho, tipo_emplazamiento, estado?, interrumpe_escurrimiento?, categoria_dato, codigo_unico?, criterio_validado_por? }` | `201 Created` (`AtajaderoDetail`) | `422` coords fuera de Formosa / enum inválido, `409` código duplicado |
| `GET /api/atajaderos/{codigo_unico}` | JWT | Path `codigo_unico` | `AtajaderoDetail` + `inspecciones: InspeccionResponse[]` *(1:N append-only orden DESC)* | `404` no existe |
| `POST /api/atajaderos/{codigo_unico}/inspecciones` | JWT | `multipart/form-data` o JSON: `tipo_registro`, `estado_observado`, `interrumpe_escurrimiento`, `indicadores_visuales[]`, `observaciones`, `foto?` | `201 Created` (`InspeccionResponse` con `evidencia_fotos` + `fotos_hashes_sha256`) | `422` transición prohibida (`-> sin_validar`) / observaciones vacías / archivo no imagen, `404` |
| `POST /api/atajaderos/importar-kobo` | JWT | `{ registros: KoboImportItem[] }` | `201 Created` `{ creados, inspecciones_agregadas, errores[] }` | `422` lote vacío o inválido |
| `POST /api/asistente/resumir` | JWT | `{ modo: "estructurar_nota_campo" \| "resumir_triage_mesa", texto_campo?, codigo_unico? }` | `{ modo_ejecucion: "ia_asistida" \| "deterministico_offline", requiere_confirmacion_humana: true, aviso_legal, resumen_tecnico, indicadores_sugeridos[], estado_sugerido?, escurrimiento_sugerido?, encuadre_normativo[] }` | `422` payload inconsistente, `404` atajadero inexistente |

---

## 5. Dataset de Prueba Realista de Formosa (`SIMULADO / DATO DE PRUEBA`)

El seed (`apps/backend/app/seeds/seed_demo.py`) DEBE ser idempotente y cargar **10 atajaderos** rotulados `categoria_dato = "SIMULADO"` sobre coordenadas reales de los **4 corredores críticos de Formosa** (documentados en `docs/03_antecedentes_y_soluciones_comparadas.md`):

1. **Corredor Riacho El Porteño – Riacho He-Hé (3 registros):**
   - `ATJ-FSA-0001` (Patiño, cruce RP 24, `en_cauce_activo`, `con_deterioro`, `si`, 3 registros históricos append-only).
   - `ATJ-FSA-0002` (Pilagá, cruce RN 86, `en_cauce_activo`, `sin_validar`, `a_verificar`, indicio Sentinel-2 sin lectura en campo).
   - `ATJ-FSA-0003` (Pilcomayo, Riacho He-Hé cruce RP 26, `lateral_fuera_de_cauce`, `operativo`, `no`).
2. **Corredor Sistema Riacho Monte Lindo y A° Tatú Piré (3 registros):**
   - `ATJ-FSA-0004` (Patiño, Laguna Gallo, `en_cauce_activo`, `con_deterioro`, `si`, alerta de sobrepaso / borde libre crítico).
   - `ATJ-FSA-0005` (Formosa/Pirané, Monte Lindo Chico cruce RN 11, `alcantarilla_vial`, `fuera_de_servicio`, `si`, lectura rezagada > 15 días).
   - `ATJ-FSA-0006` (Patiño, Pozo del Tigre / A° Tatú Piré, `a_determinar`, `sin_validar`, `a_verificar`, aviso vecinal listo para la demostración en vivo).
3. **Corredor Riacho Pilagá (2 registros):**
   - `ATJ-FSA-0007` (Formosa, Mojón de Fierro, `lateral_fuera_de_cauce`, `operativo`, `no`).
   - `ATJ-FSA-0008` (Formosa, Boca Riacho Pilagá, `alcantarilla_vial`, `con_deterioro`, `si`).
4. **Corredor Bañado La Estrella – Riacho Salado (2 registros):**
   - `ATJ-FSA-0009` (Patiño, cercanías Vertedero RP 28 / Campo del Cielo, `en_cauce_activo`, `sin_validar`, `a_verificar`).
   - `ATJ-FSA-0010` (Laishí, tramo inferior Riacho Salado, `lateral_fuera_de_cauce`, `operativo`, `no`).

---

## 6. Perímetro de Módulos (Aislamiento de Contexto)

| Spec Modular | Responsable | Perímetro de Escritura Exclusivo |
| :--- | :--- | :--- |
| `docs/specs/01_backend_atajaderos/spec.md` | Enrique Maximiliano González | `apps/backend/app/{enums,models,schemas,api}/`, `apps/backend/alembic/`, `apps/backend/tests/` |
| `docs/specs/02_frontend_react_bun/spec.md` | Matías Daniel Núñez | `apps/frontend/src/` (excepto `src/data/` compartido en lectura) |
| `docs/specs/03_geoai_apis_datos/spec.md` | Facundo Joaquín Leiva | `apps/backend/app/services/asistente_ia.py`, `apps/backend/app/api/routes/asistente.py`, `apps/backend/app/seeds/seed_demo.py`, `apps/frontend/src/data/` |
| `docs/specs/04_entrega_speech_poster/spec.md` | Fabrizio Facundo Ginéz & Antonio Gabriel Pineda | `docs/ficha_tecnica.md`, `docs/ficha_fuentes.md`, `docs/guion_video_y_pitch.md`, `README.md` |
