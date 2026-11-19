# Arquitectura y Contrato Técnico (FastAPI + React/Bun + PostgreSQL 18)

> Documento vivo del monorepo 100 % dockerizado (`apps/backend/` + `apps/frontend/` + `postgres`), alineado con `07_Entrega_Tecnica_Software.pdf` y acordado el 18/11/2026 por recomendación del docente referente UTN (**Lautaro Rolón**).

## 1. Decisiones de Stack (100 % Docker — `compose.yaml`)
- **Backend (`apps/backend/`):** **Python 3.12** + **`uv`** (`pyproject.toml` + `uv.lock`) + **FastAPI** + **SQLAlchemy 2.0** + **Alembic** + **`psycopg`** (v3) + **Pydantic v2** + **PyJWT** + **`pwdlib[argon2]`** + **`pytest`/`httpx`** + **Ruff**.
- **Frontend (`apps/frontend/`):** **Bun** (`package.json` + `bun.lock`) + **React 18** + **Vite 6** + **TypeScript (`.tsx`)** + **Tailwind CSS v4** (`@tailwindcss/vite`) + **React Router** + **Leaflet** (`@types/leaflet`) + **`@heroicons/react`** (SVGs vectoriales estrictos).
- **Base de datos y almacenamiento:** **PostgreSQL 18 + PostGIS 3.7** (`postgis/postgis:18-3.7`, bases `atajaderos` y `atajaderos_test`) + volumen local `uploads_data` (`/app/uploads`, servido en `/uploads`).
- **Componente IA / GeoAI:** Servicio proxy en FastAPI hacia **Gemini API** (`GEMINI_API_KEY`, `GEMINI_MODEL`) con **degradación determinística offline automática** si falta la API key o no hay conectividad; siempre exige confirmación humana (*Human-in-the-Loop*).
- **Puertos locales (Docker):**
  - Frontend (Vite + proxy `/api` y `/uploads` → `backend:8000`): `http://localhost:5173`
  - Backend FastAPI + Swagger OpenAPI: `http://localhost:8000` (`http://localhost:8000/docs`)
  - PostgreSQL 18 + PostGIS 3.7: `localhost:5432`

## 2. Modelo de Dominio Mínimo (Atajaderos)

### Entidad `User` *(implementada en migración `0001_create_users`)*
- `id`, `name`, `email` (único), `role` (`UserRole`: `inspector` | `referente_mesa`), `hashed_password` (Argon2), timestamps.

### Entidad `Atajadero`
| Campo | Tipo lógico | Regla / Restricción |
| :--- | :--- | :--- |
| `codigo_unico` | `string` (PK / único) | Inmutable (ej. `ATJ-0001`). No cambia si cambia nombre o estado |
| `nombre_referencia` | `string` | Nombre o paraje descriptivo |
| `latitud` / `longitud` | `decimal` (EPSG:4326) | Coordenadas obligatorias dentro del rango geográfico válido de Formosa |
| `departamento` / `cuenca_riacho` | `string` | Referencia territorial / curso de agua asociado |
| `estado` | `StrEnum` | Criterios escritos: `operativo` \| `con_deterioro` \| `fuera_de_servicio` \| `sin_validar` |
| `interrumpe_escurrimiento` | `StrEnum` | `si` \| `no` \| `a_verificar` (dato clave frente a El Niño) |
| `categoria_dato` | `StrEnum` | Obligatorio: `SIMULADO` (para datos demo) \| `OBSERVADO` \| `REFERENCIA` |
| `criterio_validado_por` | `string` | Indica si fue validado por técnico o si es registro preliminar |

### Entidad `Inspeccion` (Historial)
| Campo | Tipo lógico | Regla / Restricción |
| :--- | :--- | :--- |
| `id` | `int` / `uuid` | Identificador de inspección |
| `atajadero_codigo` | `string` (FK) | Referencia a `Atajadero.codigo_unico` |
| `fecha_inspeccion` | `datetime` | ISO 8601 con zona horaria |
| `responsable` | `string` | Persona o perfil que inspecciona |
| `estado_observado` | `StrEnum` | Estado relevado en esa fecha |
| `interrumpe_escurrimiento` | `StrEnum` | Estado del paso del agua en esa inspección |
| `tipo_registro` | `StrEnum` | `inspeccion` \| `intervencion` |
| `observaciones` | `text` | Detalle de evidencia o intervención realizada |
| `evidencia_fotos` | `array<url/path>` | Rutas bajo `/uploads/...` |

## 3. Contrato REST Frontend ↔ Backend (FastAPI OpenAPI)

### Endpoints implementados en la base
- `GET /api/health` → Estado del servicio, `es_prototipo: true`, leyenda oficial y modo IA (`ia_asistida` | `deterministico_offline`).
- `POST /api/auth/login` → Autenticación JWT (`email`, `password` → `access_token`, `user`).
- `GET /api/auth/me` → Perfil del usuario autenticado (`Authorization: Bearer <token>`).

### Endpoints del dominio (siguientes GitHub Issues)
- `GET /api/atajaderos` → Lista/GeoJSON de atajaderos (filtros por `estado`, `interrumpe_escurrimiento`, `departamento`).
- `POST /api/atajaderos` → Alta de atajadero (genera/valida `codigo_unico` inmutable, valida coordenadas y `categoria_dato`).
- `GET /api/atajaderos/{codigo_unico}` → Detalle del atajadero + historial completo de inspecciones/intervenciones.
- `POST /api/atajaderos/{codigo_unico}/inspecciones` → Registra nueva inspección o intervención (`multipart/form-data` para adjunto de fotografía).
- `POST /api/atajaderos/importar-kobo` → Importación de relevamientos tipo campo / KoboToolbox.
- `POST /api/asistente/resumir` → Asistente IA *Human-in-the-Loop* (Gemini proxy + fallback determinístico offline).

### Reglas de Validación y Manejo de Errores (`07_Entrega_Tecnica_Software.pdf`)
- **Validación estricta en backend (Pydantic v2):** Rechazar con `422` / `400` / `401` coordenadas fuera de rango, estados no permitidos, credenciales inválidas o campos obligatorios vacíos.
- **Estados en interfaz React:** Mostrar explícitamente estado de carga, estado vacío y errores recuperables sin romper el flujo.
- **Pruebas mínimas obligatorias (`pytest` en Docker):** Flujo principal end-to-end y casos de entrada inválida documentados en `README.md`.
