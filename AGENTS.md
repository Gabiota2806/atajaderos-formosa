# Directivas Agénticas del Proyecto (Atajaderos Formosa — AI LAB · Equipo 6)

## 1. Contexto de Ejecución y Dependencias (Monorepo 100 % Dockerizado)
Esta aplicación es un monorepo **FastAPI (Python 3.12 + `uv`) + React/Bun/Vite (TypeScript) + PostgreSQL 18 / PostGIS 3.7** ejecutándose dentro de Docker (`compose.yaml`), conforme al anexo `07_Entrega_Tecnica_Software.pdf`:
- **Backend (`apps/backend/`):** Python 3.12, `uv` (`pyproject.toml` + `uv.lock`), FastAPI, SQLAlchemy 2.0, Alembic, `psycopg`, Pydantic v2, PyJWT, `pwdlib[argon2]`, `pytest`/`httpx`, Ruff.
- **Frontend (`apps/frontend/`):** Bun (`package.json` + `bun.lock`), React 18, Vite 6, TypeScript estricto (`.tsx`), Tailwind CSS v4 (`@tailwindcss/vite`), React Router, Leaflet (`@types/leaflet`), `@heroicons/react`.
- **Base de datos (`postgres`):** PostgreSQL 18 + PostGIS 3.7 (`postgis/postgis:18-3.7`, bases `atajaderos` y `atajaderos_test`).

## 2. Entorno de Comandos (Docker Puro — `compose.yaml`)
Todo comando de Python, Alembic, pytest, Ruff, Bun y Vite DEBE ejecutarse dentro de los contenedores `backend` y `frontend` para garantizar paridad exacta entre los 5 integrantes y el clonado limpio:
- **Tests Backend (pytest):** `docker compose exec backend uv run --no-sync pytest`
- **Linter / Formato Backend (Ruff):** `docker compose exec backend uv run --no-sync ruff check .` y `docker compose exec backend uv run --no-sync ruff format --check .`
- **Migraciones (Alembic):** `docker compose exec backend uv run --no-sync alembic upgrade head`
- **Seed Demo (`SIMULADO`):** `docker compose exec backend uv run --no-sync python -m app.seeds.seed_demo`
- **Dependencias Backend (`uv`):** `docker compose exec backend uv add <paquete>` (actualiza `pyproject.toml` y `uv.lock`)
- **Build & Typecheck Frontend (Bun):** `docker compose exec frontend bun run build` (`tsc --noEmit && vite build`)
- **Dependencias Frontend (`bun`):** `docker compose exec frontend bun add <paquete>` (actualiza `package.json` y `bun.lock`)

## 3. Reglas Obligatorias del Desafío AI LAB (No Negociables)
- **Leyenda visible en toda pantalla:** `PROTOTIPO · AI LAB Misión: Código Formosa · no es una herramienta oficial` (componente `<PrototypeBanner />`).
- **Taxonomía de datos explícita:** distinguir siempre `DATO OBSERVADO`, `DOCUMENTO DE REFERENCIA` y `SIMULADO` (nunca mezclar datos simulados con datos oficiales sin rotular).
- **Código único inmutable:** cada atajadero tiene un `codigo_unico` que no cambia aunque cambie su nombre o estado.
- **Dato prioritario El Niño:** registrar explícitamente `interrumpe_escurrimiento` (`si`, `no`, `a_verificar`).
- **Límite de responsabilidad e IA:** el sistema NO asigna estados técnicos definitivos sin criterios escritos/validados ni reemplaza inspecciones presenciales. El asistente IA (Gemini proxy en FastAPI con fallback determinístico offline) actúa únicamente como copiloto *Human-in-the-Loop* con confirmación humana obligatoria.

## 4. Arquitectura Multiagente y Roles
Este proyecto implementa el flujo de trabajo multiagente basado en especificaciones modulares y **GitHub Issues**:
- **Coordinador**: Dirige el flujo sin escribir código.
- **Planificador**: Redacta specs modulares en `docs/specs/<modulo>/spec.md` y planes de tareas para GitHub Issues.
- **Implementador**: Ejecuta tareas (Issues `#N`) mediante TDD estricto con `docker compose exec backend uv run --no-sync pytest` y `docker compose exec frontend bun run build`.
- **Revisor (QA)**: Audita specs y valida la implementación RF por RF emitiendo veredictos (`VEREDICTO: APROBADO` o `VEREDICTO: CAMBIOS NECESARIOS`).

## 5. Especificaciones Técnicas Modulares (SDD)
- Toda funcionalidad pertenece a un módulo y se especifica en `docs/specs/<modulo>/spec.md`.
- Las decisiones y convenciones transversales residen en `docs/specs/global_spec.md`.
- No generes código sin contrastar antes contra el GitHub Issue (`gh issue view <num>`) y la spec modular afectada.

## 6. Convenciones de Código y Arquitectura
- Respeta la estructura del monorepo (`apps/backend/`, `apps/frontend/`, `docs/`); no crees nuevas carpetas raíz sin aprobación.
- Utiliza nombres descriptivos en español para campos y reglas de negocio (`codigo_unico`, `interrumpe_escurrimiento`, `categoria_dato`).
- Modela dominios cerrados con `StrEnum` en `apps/backend/app/enums/` (`UserRole`, `EstadoAtajadero`, `InterrupcionEscurrimiento`, `CategoriaDato`) y tipos espejo en `apps/frontend/src/types/`.
- **Iconografía:** Utiliza exclusivamente SVGs vectoriales (`@heroicons/react`) estilizados con clases utilitarias (`h-4 w-4` o `h-5 w-5`). **PROHIBIDO** el uso de emojis o caracteres tipográficos sustitutos en la interfaz de usuario.
- **Pruebas obligatorias:** Toda funcionalidad debe cubrir tanto el **flujo principal** como al menos un **caso de entrada inválida** (`422`/`400`/`401`).

## 7. Regla Estricta de Pull Requests, GitHub Issues y Control de Versiones
- **PROHIBIDO EL AUTO-MERGE**: Bajo ninguna circunstancia el agente debe fusionar automáticamente ramas hacia `develop` o `main`.
- **Ramas:** `main` (entrega estable protegida), `develop` (integración protegida), y ramas por Issue `feat/<num>-<slug>` o `fix/<num>-<slug>` creadas siempre desde `develop`.
- **Commits:** Conventional Commits en español referenciando el GitHub Issue (ej. `feat(#12): implementar mapa interactivo de atajaderos`).
- **Pull Requests:** Apuntar siempre hacia `develop` incluyendo `Closes #<num>` en la descripción, creada con `gh pr create --base develop` o enlace directo a GitHub compare, quedando abierta para auditoría y revisión humana.
