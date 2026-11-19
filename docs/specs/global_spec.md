# Especificación Técnica Global del Sistema

## 1. Arquitectura General y Topología
- **Nombre del Sistema:** Atajaderos Formosa — AI LAB Misión: Código Formosa (Operación Agua · Desafío 1 · Equipo 6 UTN)
- **Patrón Arquitectónico:** Monorepo desacoplado Frontend ↔ Backend API REST (`apps/frontend/` + `apps/backend/` + `docs/`), alineado al 100 % con `07_Entrega_Tecnica_Software.pdf`.
- **Entorno de Ejecución Predeterminado:** 100 % Dockerizado (`compose.yaml` con `backend` Python 3.12/`uv`, `frontend` Bun/Vite y `postgres` PostgreSQL 18 + PostGIS 3.7).
- **Ramas Principales:** `main` (entrega estable protegida) y `develop` (integración protegida).
- **Gestión de Tareas:** **GitHub Issues** (`#N`) + especificaciones SDD en `docs/specs/`.

---

## 2. Convenciones Transversales del Proyecto

### A. Autenticación, Roles y Permisos (RBAC)
- Autenticación JWT (`POST /api/auth/login`, `GET /api/auth/me`) con hashing Argon2 (`pwdlib[argon2]`).
- Roles modelados con `StrEnum` en `apps/backend/app/enums/user_role.py` y tipo espejo en `apps/frontend/src/types/index.ts`:
  - `inspector`: Inspector de campo (relevamiento, carga de atajaderos, inspecciones y evidencia fotográfica).
  - `referente_mesa`: Referente de la mesa interinstitucional (consulta, auditoría, priorización y validación de criterios/intervenciones).
- Usuarios demo precargados por `app.seeds.seed_demo` (`inspector@atajaderos.ar` y `referente@atajaderos.ar`, contraseña `password`) con carga rápida en Login y documentados en `README.md`.

### B. Base de Datos y Persistencia (PostgreSQL 18 + PostGIS 3.7)
- Motor: **PostgreSQL 18** con extensión **PostGIS 3.7** habilitada en `atajaderos` y `atajaderos_test`.
- ORM y Migraciones: **SQLAlchemy 2.0** (`Mapped`/`mapped_column`) + **Alembic** (`apps/backend/alembic/versions/`).
- **Inmutabilidad de identificadores:** cada registro de `atajaderos` posee un `codigo_unico` único e inmutable (ej. `ATJ-0001`).
- **Taxonomía de datos obligatoria:** `categoria_dato` (`OBSERVADO`, `REFERENCIA`, `SIMULADO`) y trazabilidad de responsable + fecha en `inspecciones`.
- **Evidencia fotográfica:** almacenada en `apps/backend/uploads/` (volumen `uploads_data`, servida bajo `/uploads`), validada en tamaño/MIME por FastAPI.

### C. Asistente IA Acotado (*Human-in-the-Loop*) y Manejo de Excepciones
- Integración vía **proxy seguro en FastAPI** hacia **Gemini API** (`GEMINI_API_KEY`, `GEMINI_MODEL`), nunca exponiendo la clave al navegador.
- **Degradación determinística offline automática:** si `GEMINI_API_KEY` está vacía o falla la red, el servicio devuelve un resumen/borrador determinístico basado en reglas locales, señalizando explícitamente el modo (`ia_asistida` vs `deterministico_offline`).
- **Límite inviolable:** la IA solo resume historial o propone borrador estructurado; jamás guarda ni asigna `estado` o `interrumpe_escurrimiento` sin confirmación humana explícita.

### D. Frontend, Estilos e Iconografía (`apps/frontend/`)
- Ecosistema de UI: **Bun + React 18 + Vite 6 + TypeScript estricto (`.tsx`) + React Router + Leaflet**.
- Estilos CSS: **Tailwind CSS v4** (`@tailwindcss/vite`, `@import "tailwindcss";` en `src/index.css`).
- **Estándar de iconos:** SVGs vectoriales (`@heroicons/react`) con clases utilitarias (`h-4 w-4` / `h-5 w-5`). Prohibición absoluta de emojis o caracteres tipográficos sustitutos en la interfaz.
- **Leyenda obligatoria en toda pantalla:** `<PrototypeBanner />` mostrando `PROTOTIPO · AI LAB Misión: Código Formosa · no es una herramienta oficial`.

---

## 3. Registro de Módulos del Sistema (SDD con Aislamiento de Contexto)

> **Regla Anti-Agotamiento de Tokens:** Cada agente o desarrollador lee únicamente `docs/specs/00_CORE_CONTRACTS.md` y la spec de su módulo asignado.

| Módulo | Archivo de Especificación | Estado | Responsable (Equipo 6) |
| :--- | :--- | :--- | :--- |
| `00_CORE_CONTRACTS` (Contratos Base, Enums, Máquina de Estados y OpenAPI) | `docs/specs/00_CORE_CONTRACTS.md` | *Aprobado (Local)* | Antonio Gabriel Pineda |
| `01_backend_atajaderos` (PostGIS, Modelos 1:N, CRUD, SHA-256 y Kobo) | `docs/specs/01_backend_atajaderos/spec.md` | *Borrador* | Enrique Maximiliano González |
| `02_frontend_react_bun` (React/Bun, Mapa Leaflet Real y Modales UI) | `docs/specs/02_frontend_react_bun/spec.md` | *Borrador* | Matías Daniel Núñez |
| `03_geoai_apis_datos` (Copiloto IA HITL, Seed Formosa y Trazas SIG) | `docs/specs/03_geoai_apis_datos/spec.md` | *Borrador* | Facundo Joaquín Leiva |
| `04_entrega_speech_poster` (Fichas, Video 120 s, Speech 3 min y Póster) | `docs/specs/04_entrega_speech_poster/spec.md` | *En progreso* | Fabrizio Facundo Ginéz / Antonio Gabriel Pineda |
