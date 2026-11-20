# Atajaderos Formosa — AI LAB Misión: Código Formosa (Operación Agua)

> **PROTOTIPO · AI LAB Misión: Código Formosa · no es una herramienta oficial**

Monorepo web desarrollado por el **Equipo 6 — Los Más Experimentados (UTN Extensión Áulica Formosa)** para el **Desafío 1: Atajaderos** de los Juegos Provinciales Tecnológicos 2026.

Permite construir un **inventario territorial trazable de atajaderos** en la provincia de Formosa con código único inmutable (`ATJ-FSA-NNNN`), criterios escritos de estado, evidencia fotográfica sellada con `SHA-256`, historial 1:N *append-only* de inspecciones/intervenciones, avisos vecinales offline-first, interoperabilidad GeoJSON/KoboToolbox/QField, Copiloto IA *Human-in-the-Loop* y registro explícito de si **interrumpen el escurrimiento del riacho** frente al fenómeno El Niño.

- **Versión evaluable (tag en `main`):** [`v1.0.0`](https://github.com/Gabiota2806/atajaderos-formosa/releases/tag/v1.0.0)

---

## Equipo y Roles

- **Enrique Maximiliano González:** Arquitectura, modelos PostGIS/Alembic y API REST FastAPI (`apps/backend/`)
- **Matías Daniel Núñez:** Frontend React + Bun + Vite, identidad cartográfica, mapa Leaflet, `/reportar` offline y modales (`apps/frontend/`)
- **Facundo Joaquín Leiva:** Datos, Fuentes, GeoAI y Copiloto IA *Human-in-the-Loop* (`asistente_ia.py`, proxy Gemini + fallback)
- **Antonio Gabriel Pineda:** Infraestructura Docker, contratos SDD, seed demo, QA integral y documentación (`docs/`, `compose.yaml`)
- **Fabrizio Facundo Ginéz:** Producto, narrativa, póster técnico, video demo y pitch
- **Docente referente UTN:** Lautaro Rolón

---

## Estructura del Monorepo y Stack (100 % Dockerizado)

Alineado con el anexo `07_Entrega_Tecnica_Software.pdf`:

```text
atajaderos-formosa/
├── apps/
│   ├── backend/      # Python 3.12 + uv + FastAPI + SQLAlchemy 2 + Alembic + PostGIS + pytest + Ruff
│   └── frontend/     # Bun + React 18 + Vite 6 + TypeScript + Tailwind CSS v4 + Leaflet + Heroicons SVG
├── docker/           # Inicialización PostGIS y base de testing (atajaderos_test)
├── docs/             # Fichas entregables, fuentes, arquitectura/contrato, antecedentes, specs SDD y ejemplos
├── scripts/          # tunnel.sh (Cloudflare Tunnel para pruebas móviles en campo)
├── compose.yaml      # Orquestación Docker: backend (:8000), frontend (:5173) y postgres (:5432)
├── .env.example      # Variables de entorno sin secretos
└── README.md         # Instalación, arranque, contrato y pruebas desde clonado limpio
```

**Versiones principales verificadas dentro de los contenedores Docker:**
- **Backend (`apps/backend/uv.lock`):** Python `3.12.16` · `uv` · FastAPI `0.165` · SQLAlchemy `2.1` · Alembic `1.20` · Pydantic `2.14` · `psycopg` v3 · PyJWT · `pwdlib[argon2]` · `pytest` `9.2` · Ruff
- **Frontend (`apps/frontend/bun.lock`):** Bun `1.4.5` · React `18.3` · Vite `6.4` · TypeScript `5.8` · Tailwind CSS `4.1` · React Router `7.5` · Leaflet `1.9.4` · `@heroicons/react` `2.2`
- **Base de datos:** PostgreSQL `18.6` + PostGIS `3.7` (`postgis/postgis:18-3.7`, bases `atajaderos` y `atajaderos_test`)

---

## Requisitos Previos (Clonado Limpio)

No hace falta instalar Python, Bun, Node ni PostgreSQL en el equipo anfitrión. Solo se requiere:
- **Git**
- **Docker** y **Docker Compose** (v2+)

---

## Instalación y Arranque desde Clonado Limpio

1. **Clonar el repositorio y entrar al directorio:**
   ```bash
   git clone https://github.com/Gabiota2806/atajaderos-formosa.git
   cd atajaderos-formosa
   ```

2. **Crear archivo de variables de entorno:**
   ```bash
   cp .env.example .env
   ```
   - **API externa opcional (Gemini):** para habilitar el modo `ia_asistida` del Copiloto IA, definir `GEMINI_API_KEY=<tu-clave>` y `GEMINI_MODEL=gemini-3.5-flash-lite` en `.env` (nunca commitear `.env`).
   - **Sin clave o sin internet:** si `GEMINI_API_KEY` queda vacía o falla la red, el backend degrada automáticamente a modo `deterministico_offline` sin producir errores 500.

3. **Construir y levantar los 3 contenedores (`postgres`, `backend`, `frontend`):**
   ```bash
   docker compose up -d --build
   ```

4. **Aplicar migraciones Alembic y cargar el dataset demo (`SIMULADO / DATO DE PRUEBA`):**
   ```bash
   docker compose exec backend uv run --no-sync alembic upgrade head
   docker compose exec backend uv run --no-sync python -m app.seeds.seed_demo
   ```
   *(El seed es 100 % idempotente: crea 2 usuarios demo y 10 atajaderos `SIMULADO` en los 4 corredores fluviales críticos de Formosa con su historial inicial).*

5. **Abrir en el navegador:**
   - Aplicación web (React + Vite, proxy `/api` y `/uploads` → `backend:8000`): **http://localhost:5173**
   - Aviso vecinal público offline-first (sin login): **http://localhost:5173/reportar**
   - Documentación interactiva OpenAPI (Swagger): **http://localhost:8000/docs**
   - Healthcheck JSON: **http://localhost:8000/api/health** · **http://localhost:5173/api/health**

---

## Usuarios de Demostración (`DATO DE PRUEBA`)

Cargados automáticamente por `app.seeds.seed_demo` y disponibles como botones de carga rápida en `/login`:

| Perfil | Correo | Contraseña |
| :--- | :--- | :--- |
| **Inspector de campo** | `inspector@atajaderos.ar` | `password` |
| **Referente de mesa** | `referente@atajaderos.ar` | `password` |

---

## Contrato Frontend ↔ Backend (11 Endpoints REST)

El frontend (`apps/frontend/src/lib/api.ts`) consume la API FastAPI (`apps/backend/app/api/routes/`) a través del proxy de Vite (`/api` → `http://backend:8000`).

| Método y Ruta | Auth | Propósito / Entrada clave | Salida principal | Errores esperados |
| :--- | :---: | :--- | :--- | :--- |
| `GET /api/health` | Pública | Estado del servicio y modo del copiloto IA | `200` `{ status, es_prototipo, leyenda, proyecto, ia_modo }` | — |
| `POST /api/auth/login` | Pública | Autenticación `{ email, password }` | `200` `{ access_token, token_type, user }` | `401` credenciales inválidas · `422` correo/campos inválidos |
| `GET /api/auth/me` | JWT | Perfil del usuario autenticado | `200` `{ id, name, email, role }` | `401` token ausente o inválido |
| `POST /api/avisos` | Pública | Aviso vecinal offline-first (JSON o `multipart/form-data` con `foto`) | `201` `AtajaderoDetail` forzado a `sin_validar` + `a_verificar` + `SIMULADO` | `422` coords fuera de Formosa (`-27..-22`, `-62.5..-57.5`), descripción `< 10` chars o archivo no imagen |
| `GET /api/atajaderos` | JWT | Listado filtrable (`estado`, `interrumpe_escurrimiento`, `tipo_emplazamiento`, `categoria_dato`, `departamento`, `cuenca_riacho`, `q`) | `200` `{ total, items[] }` con `fecha_ultima_inspeccion` y `total_inspecciones` | `401` · `422` filtro fuera de `StrEnum` |
| `GET /api/atajaderos/geojson` | JWT | Exportación SIG EPSG:4326 compatible con QGIS / QField (mismos filtros) | `200` `FeatureCollection` con `metadata.es_prototipo` y `leyenda` | `401` |
| `POST /api/atajaderos` | JWT | Alta técnica autenticada (autogenera `ATJ-FSA-NNNN` si no se envía `codigo_unico`) | `201` `AtajaderoDetail` | `401` · `409` `codigo_unico` duplicado · `422` coords/enum inválidos |
| `GET /api/atajaderos/{codigo_unico}` | JWT | Ficha completa + historial 1:N *append-only* ordenado DESC | `200` `AtajaderoDetail` (`inspecciones[]`, fotos y hashes `SHA-256`) | `401` · `404` código inexistente |
| `POST /api/atajaderos/{codigo_unico}/inspecciones` | JWT | Nueva inspección o intervención (JSON o `multipart/form-data`, checklist FAO/ASDSO/FHWA, foto `SHA-256`) | `201` `InspeccionResponse` (actualiza resumen y `fecha_ultima_inspeccion`) | `401` · `404` · `422` regresión a `sin_validar`, intento de mutar `codigo_unico` u observaciones `< 10` chars |
| `POST /api/atajaderos/importar-kobo` | JWT | Lote `{ registros: [...] }` o `FeatureCollection` GeoJSON (KoboToolbox / QField / GEE) | `201` `{ creados, inspecciones_agregadas, errores[], codigos_procesados[] }` | `401` · `422` lote vacío o JSON inválido |
| `POST /api/asistente/resumir` | JWT | Copiloto IA solo lectura (`estructurar_nota_campo` o `resumir_triage_mesa`) | `200` `{ modo_ejecucion, requiere_confirmacion_humana: true, aviso_legal, resumen_tecnico, ... }` | `401` · `404` código inexistente · `422` payload inconsistente |

---

## Ejemplos Reproducibles (Flujo Principal y Casos de Entrada Inválida)

```bash
# 1. Autenticación JWT (vía proxy del frontend en :5173)
TOKEN=$(curl -sS -X POST http://localhost:5173/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"inspector@atajaderos.ar","password":"password"}' \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['access_token'])")

# 2. Consultar inventario y exportar GeoJSON EPSG:4326 (QGIS/QField)
curl -sS -H "Authorization: Bearer $TOKEN" "http://localhost:5173/api/atajaderos?interrumpe_escurrimiento=si"
curl -sS -H "Authorization: Bearer $TOKEN" "http://localhost:5173/api/atajaderos/geojson"

# 3. Operación principal A: registrar aviso vecinal público (sin token -> 201 Created, forzado a sin_validar)
AVISO_CODE=$(curl -sS -X POST http://localhost:5173/api/avisos \
  -H "Content-Type: application/json" \
  -d '{"nombre_referencia":"Cruce demo Riacho He-Hé","latitud":-25.15,"longitud":-58.60,"departamento":"Pilcomayo","cuenca_riacho":"Riacho He-Hé","descripcion_aviso":"Terraplén nuevo cortando el paso del agua tras lluvia"}' \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['codigo_unico'])")
echo "Aviso creado: $AVISO_CODE"

# 4. Operación principal B: validar en campo con inspección 1:N + Copiloto IA solo lectura
curl -sS -X POST "http://localhost:5173/api/atajaderos/${AVISO_CODE}/inspecciones" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"tipo_registro":"inspeccion","estado_observado":"con_deterioro","interrumpe_escurrimiento":"si","indicadores_visuales":["cierre_total_sin_vertedero"],"observaciones":"Se verifica cierre transversal sin vertedero en visita presencial."}'

curl -sS -X POST http://localhost:5173/api/asistente/resumir \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"modo":"resumir_triage_mesa","codigo_unico":"ATJ-FSA-0001"}'

# 5. Caso de entrada inválida 1: coordenadas fuera de Formosa -> HTTP 422
curl -i -sS -X POST http://localhost:5173/api/avisos \
  -H "Content-Type: application/json" \
  -d '{"nombre_referencia":"Fuera de rango","latitud":-34.60,"longitud":-58.38,"departamento":"Formosa","cuenca_riacho":"Riacho Pilagá","descripcion_aviso":"Prueba de coordenada inválida fuera de Formosa"}'

# 6. Caso de entrada inválida 2: correo malformado en login -> HTTP 422
curl -i -sS -X POST http://localhost:5173/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"correo-invalido","password":""}'
```

---

## Ejecución de Pruebas, Linter, Build y QA Móvil (100 % Docker)

Las pruebas automatizadas del backend se ejecutan contra la base dedicada PostgreSQL `atajaderos_test` (actualmente **37 tests en verde**, cubriendo flujos principales, máquina de estados, inmutabilidad en PostGIS, `SHA-256`, importación Kobo/GeoJSON, Copiloto IA/fallback y entradas inválidas `401`/`404`/`409`/`422`):

```bash
# Tests backend (pytest)
docker compose exec backend uv run --no-sync pytest -v

# Linter y formato Python (Ruff)
docker compose exec backend uv run --no-sync ruff check .
docker compose exec backend uv run --no-sync ruff format --check .

# Chequeo estricto de TypeScript y build de producción (Bun + Vite)
docker compose exec frontend bun run build

# Opcional: exponer http://localhost:5173 por HTTPS temporal para pruebas móviles (GPS/cámara/offline)
./scripts/tunnel.sh start 5173
./scripts/tunnel.sh stop
```

---

## Documentación del Proyecto

- [Ficha técnica (entregable 1 página)](docs/ficha_tecnica.md)
- [Ficha de fuentes (entregable)](docs/ficha_fuentes.md)
- [Resumen del desafío y Las 7 Preguntas](docs/00_resumen_desafio.md)
- [Arquitectura y contrato técnico](docs/01_arquitectura_y_contrato.md)
- [Antecedentes y soluciones comparadas](docs/03_antecedentes_y_soluciones_comparadas.md)
- [Contratos SDD base (`00_CORE_CONTRACTS`)](docs/specs/00_CORE_CONTRACTS.md)
- [Plantilla de hipótesis satelital GEE (`SIMULADO`)](docs/ejemplos/hipotesis_satelital_gee.json)
- [Backlog del sprint](docs/02_backlog.md)
- [Changelog](docs/changelog.md)

---

## Límites de Responsabilidad

- **PROTOTIPO · AI LAB Misión: Código Formosa · no es una herramienta oficial.**
- Los 10 atajaderos de demostración precargados están rotulados como `SIMULADO / DATO DE PRUEBA` porque el relevamiento provincial oficial en curso no se encuentra publicado.
- Los criterios escritos de estado y el umbral de lectura rezagada (`> 14 días`) son una propuesta preliminar del equipo pendiente de validación por técnicos de la mesa.
- La herramienta no reemplaza inspecciones presenciales en campo, no asigna estados técnicos ni sanciones de forma automática y no emite alertas ni pronósticos hidrológicos oficiales. Toda decisión operativa permanece bajo responsabilidad humana (Decreto-Ley N° 971/1980).
