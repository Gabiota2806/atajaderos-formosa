# Arquitectura y Contrato Técnico (FastAPI + React/Bun + PostgreSQL 18)

> Documento vivo del monorepo 100 % dockerizado (`apps/backend/` + `apps/frontend/` + `postgres`), alineado con `07_Entrega_Tecnica_Software.pdf` y acordado el 18/11/2026 por recomendación del docente referente UTN (**Lautaro Rolón**).

## 1. Decisiones de Stack (100 % Docker — `compose.yaml`)
- **Backend (`apps/backend/`):** **Python 3.12** + **`uv`** (`pyproject.toml` + `uv.lock`) + **FastAPI** + **SQLAlchemy 2.0** + **Alembic** + **`psycopg`** (v3) + **Pydantic v2** + **PyJWT** + **`pwdlib[argon2]`** + **`pytest`/`httpx`** + **Ruff**.
- **Frontend (`apps/frontend/`):** **Bun** (`package.json` + `bun.lock`) + **React 18** + **Vite 6** + **TypeScript (`.tsx`)** + **Tailwind CSS v4** (`@tailwindcss/vite`) + **React Router** + **Leaflet** (`@types/leaflet`) + **`@heroicons/react`** (SVGs vectoriales estrictos).
- **Base de datos y almacenamiento:** **PostgreSQL 18 + PostGIS 3.7** (`postgis/postgis:18-3.7`, bases `atajaderos` y `atajaderos_test`) + volumen local `uploads_data` (`/app/uploads`, servido en `/uploads`).
- **Componente IA / GeoAI:** Servicio proxy en FastAPI hacia **Gemini API** (`GEMINI_API_KEY`, `GEMINI_MODEL=gemini-3.5-flash-lite`) con **degradación determinística offline automática** si falta la API key o no hay conectividad; siempre exige confirmación humana (*Human-in-the-Loop*).
- **Puertos locales (Docker):**
  - Frontend (Vite + proxy `/api` y `/uploads` → `backend:8000`): `http://localhost:5173`
  - Backend FastAPI + Swagger OpenAPI: `http://localhost:8000` (`http://localhost:8000/docs`)
  - PostgreSQL 18 + PostGIS 3.7: `localhost:5432`

## 2. Modelo de Dominio Mínimo (Atajaderos)

### Entidad `User` *(implementada en migración `0001_create_users`)*
- `id`, `name`, `email` (único), `role` (`UserRole`: `inspector` | `referente_mesa`), `hashed_password` (Argon2), timestamps.

### Entidad `Atajadero`
> **Contrato Maestro SDD Vigente:** Ver detalle completo de tipos, máquina de estados y reglas anti-agotamiento de tokens en [`docs/specs/00_CORE_CONTRACTS.md`](specs/00_CORE_CONTRACTS.md).

| Campo | Tipo lógico | Regla / Restricción |
| :--- | :--- | :--- |
| `id` | `UUID v4` (PK) | Clave técnica interna inmutable (patrón QField/PostGIS sin colisiones offline) |
| `codigo_unico` | `string` (único) | Inmutable (ej. `ATJ-FSA-0001`). No cambia ni se reutiliza si cambia nombre o estado |
| `nombre_referencia` | `string` | Nombre o paraje descriptivo |
| `latitud` / `longitud` + `geom` | `decimal` + `Point(4326)` | Coordenadas obligatorias dentro del rango geográfico de Formosa (`-27.0 a -22.0`, `-62.5 a -57.5`) |
| `departamento` / `cuenca_riacho` | `string` | Referencia territorial / corredor fluvial asociado |
| `tipo_emplazamiento` | `StrEnum` | `en_cauce_activo` \| `lateral_fuera_de_cauce` \| `alcantarilla_vial` \| `a_determinar` (Ley 1.246 Art. 88° vs. Ley 1.314 Art. 40°) |
| `estado` | `StrEnum` | Criterios escritos: `sin_validar` \| `operativo` \| `con_deterioro` \| `fuera_de_servicio` |
| `interrumpe_escurrimiento` | `StrEnum` | `si` \| `no` \| `a_verificar` (dato clave frente a El Niño) |
| `categoria_dato` | `StrEnum` | Obligatorio: `SIMULADO` (para datos demo) \| `OBSERVADO` \| `REFERENCIA` |
| `criterio_validado_por` | `string` | Indica si fue validado presencialmente por inspector o si es registro preliminar/aviso |
| `fecha_ultima_inspeccion` | `datetime \| null` | Expuesta en tabla y mapa (patrón Ceará/AESA para transparencia de lecturas rezagadas) |

### Entidad `Inspeccion` (Historial 1:N Append-Only)
| Campo | Tipo lógico | Regla / Restricción |
| :--- | :--- | :--- |
| `id` | `UUID v4` (PK) | Identificador de inspección / intervención |
| `atajadero_id` | `UUID` (FK) | Referencia a `Atajadero.id` (expuesta también por `codigo_unico`) |
| `fecha_inspeccion` | `datetime` | ISO 8601 con zona horaria |
| `responsable` | `string` | Persona o perfil que inspecciona |
| `estado_observado` | `StrEnum` | Estado relevado en esa fecha (prohibido regresar a `sin_validar`) |
| `interrumpe_escurrimiento` | `StrEnum` | Estado del paso del agua en esa inspección |
| `tipo_registro` | `StrEnum` | `inspeccion` \| `intervencion` |
| `indicadores_visuales` | `array<StrEnum>` | Checklist FAO Paper 64 / ASDSO / FHWA (5 patologías observables en terreno) |
| `observaciones` | `text` | Detalle de evidencia o intervención realizada ($\ge 10$ caracteres) |
| `evidencia_fotos` / `fotos_hashes_sha256` | `array<string>` | Rutas bajo `/uploads/...` + sello criptográfico `SHA-256` (Decreto-Ley N° 971/1980) |

## 3. Contrato REST Frontend ↔ Backend (11 Endpoints Implementados — FastAPI OpenAPI)

### Salud y autenticación
- `GET /api/health` → Estado del servicio, `es_prototipo: true`, leyenda oficial y `ia_modo` (`ia_asistida` | `deterministico_offline`).
- `POST /api/auth/login` → Autenticación JWT (`email`, `password` → `access_token`, `user`).
- `GET /api/auth/me` → Perfil del usuario autenticado (`Authorization: Bearer <token>`).

### Inventario, inspecciones, avisos y Copiloto IA (conectados 100 % en frontend)
- `POST /api/avisos` *(público — Forma B)* → Aviso vecinal/ciudadano (con cola offline `localStorage` + auto-envío desde `/reportar`), forzado en backend a `estado="sin_validar"`, `interrumpe_escurrimiento="a_verificar"`, `tipo_emplazamiento="a_determinar"` y `categoria_dato="SIMULADO"`.
- `GET /api/atajaderos` → Lista filtrable de atajaderos (`estado`, `interrumpe_escurrimiento`, `tipo_emplazamiento`, `categoria_dato`, `departamento`, `cuenca_riacho`, `q`) con `fecha_ultima_inspeccion` y `total_inspecciones`.
- `GET /api/atajaderos/geojson` → Exportación `FeatureCollection` GeoJSON EPSG:4326 compatible con QGIS / QField.
- `POST /api/atajaderos` → Alta autenticada de atajadero (autogenera/valida `codigo_unico` inmutable, valida coordenadas de Formosa y `categoria_dato`).
- `GET /api/atajaderos/{codigo_unico}` → Detalle del atajadero + historial 1:N *append-only* de inspecciones/intervenciones.
- `POST /api/atajaderos/{codigo_unico}/inspecciones` → Registra nueva inspección o intervención (JSON o `multipart/form-data` para adjunto de fotografía con hash `SHA-256` y checklist FAO/ASDSO/FHWA).
- `POST /api/atajaderos/importar-kobo` → Importación por lotes JSON o `FeatureCollection` GeoJSON (KoboToolbox / QField / hipótesis satelitales externas GEE).
- `POST /api/asistente/resumir` → Copiloto IA *Human-in-the-Loop* en modo solo lectura (`estructurar_nota_campo` y `resumir_triage_mesa`; proxy Gemini `gemini-3.5-flash-lite` + fallback `deterministico_offline`).

### Reglas de Validación y Manejo de Errores (`07_Entrega_Tecnica_Software.pdf`)
- **Validación estricta en backend (Pydantic v2):** Rechazar con `422` / `400` / `401` coordenadas fuera de rango, estados no permitidos, credenciales inválidas o campos obligatorios vacíos.
- **Estados en interfaz React:** Mostrar explícitamente estado de carga, estado vacío y errores recuperables sin romper el flujo.
- **Pruebas mínimas obligatorias (`pytest` en Docker):** Flujo principal end-to-end y casos de entrada inválida documentados en `README.md`.
