# Atajaderos Formosa — AI LAB Misión: Código Formosa (Operación Agua)

> **PROTOTIPO · AI LAB Misión: Código Formosa · no es una herramienta oficial**

Monorepo web desarrollado por el **Equipo 6 — Los Más Experimentados (UTN Extensión Áulica Formosa)** para el **Desafío 1: Atajaderos** de los Juegos Provinciales Tecnológicos 2026.

Permite construir un **inventario territorial trazable de atajaderos** en la provincia de Formosa con código único inmutable, criterios escritos de estado, evidencia fotográfica, historial de inspecciones/intervenciones y registro explícito de si **interrumpen el escurrimiento del riacho** frente al fenómeno El Niño.

---

## Equipo y Roles

- **Maximiliano González:** Arquitectura y Backend FastAPI (`apps/backend/`)
- **Matías Núñez:** Frontend React + Bun + Vite + Mapa Leaflet (`apps/frontend/`)
- **Facundo Leiva:** Datos, Fuentes y GeoAI
- **Gabriel Pineda:** QA, Repo, Docker y Documentación
- **Fabrizio Ginéz:** Producto, Póster, Video y Pitch
- **Docente referente UTN:** Lautaro Rolón

---

## Estructura del Monorepo y Stack (100 % Dockerizado)

Alineado con el anexo `07_Entrega_Tecnica_Software.pdf`:

```text
atajaderos-formosa/
├── apps/
│   ├── backend/      # Python 3.12 + uv + FastAPI + SQLAlchemy 2.0 + Alembic + psycopg3 + pytest + Ruff
│   └── frontend/     # Bun + React 18 + Vite 6 + TypeScript + Tailwind CSS v4 + Leaflet + Heroicons SVG
├── docker/           # Inicialización PostGIS y base de testing (atajaderos_test)
├── docs/             # Fuentes, arquitectura/contrato, backlog, specs SDD y fichas entregables
├── scripts/          # tunnel.sh (Cloudflare Tunnel para pruebas móviles en campo)
├── compose.yaml      # Orquestación Docker: backend (:8000), frontend (:5173) y postgres (:5432)
├── .env.example      # Variables de entorno sin secretos
└── README.md         # Instalación, arranque y pruebas desde clonado limpio
```

**Versiones principales fijadas dentro de Docker:**
- **Backend:** Python `3.12` · `uv` (`apps/backend/uv.lock`) · FastAPI · SQLAlchemy `2.0` · Alembic · Pydantic `v2` · `pytest` · Ruff
- **Frontend:** Bun `1.4` (`apps/frontend/bun.lock`) · React `18.3` · Vite `6.4` · TypeScript `5.8` · Tailwind CSS `v4` · Leaflet `1.9.4` · `@heroicons/react`
- **Base de datos:** PostgreSQL `18` + PostGIS `3.7` (`postgis/postgis:18-3.7`)

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
   *(Opcional: definir `GEMINI_API_KEY` para respuestas asistidas por Gemini; si queda vacía, el servicio opera en modo `deterministico_offline` sin fallar).*

3. **Construir y levantar los 3 contenedores (`backend`, `frontend`, `postgres`):**
   ```bash
   docker compose up -d --build
   ```

4. **Aplicar migraciones Alembic y cargar perfiles de demostración (`DATO DE PRUEBA`):**
   ```bash
   docker compose exec backend uv run --no-sync alembic upgrade head
   docker compose exec backend uv run --no-sync python -m app.seeds.seed_demo
   ```

5. **Abrir en el navegador:**
   - Aplicación web (React + Vite): **http://localhost:5173**
   - Documentación interactiva de la API (Swagger / OpenAPI): **http://localhost:8000/docs**
   - Healthcheck JSON (directo y vía proxy frontend): **http://localhost:8000/api/health** · **http://localhost:5173/api/health**

---

## Usuarios de Demostración (`DATO DE PRUEBA`)

Cargados automáticamente por `app.seeds.seed_demo` y disponibles también como botones de carga rápida en `/login`:

| Perfil | Correo | Contraseña |
| :--- | :--- | :--- |
| **Inspector de campo** | `inspector@atajaderos.ar` | `password` |
| **Referente de mesa** | `referente@atajaderos.ar` | `password` |

---

## Ejemplo Reproducible del Contrato Frontend ↔ Backend

```bash
# 1. Flujo principal: login JWT contra el backend (vía proxy del frontend)
curl -sS -X POST http://localhost:5173/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"inspector@atajaderos.ar","password":"password"}'

# 2. Caso de entrada inválida (correo malformado -> HTTP 422)
curl -i -sS -X POST http://localhost:5173/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"correo-invalido","password":""}'
```

---

## Ejecución de Pruebas, Linter y Build (100 % Docker)

Las pruebas backend se ejecutan contra la base dedicada PostgreSQL `atajaderos_test`:

```bash
# Tests backend (pytest: flujo principal + entradas inválidas)
docker compose exec backend uv run --no-sync pytest -v

# Linter y formato Python (Ruff)
docker compose exec backend uv run --no-sync ruff check .
docker compose exec backend uv run --no-sync ruff format --check .

# Chequeo estricto de TypeScript y build de producción (Bun + Vite)
docker compose exec frontend bun run build
```

---

## Documentación del Proyecto

- [Resumen del desafío y Las 7 Preguntas](docs/00_resumen_desafio.md)
- [Arquitectura y contrato técnico](docs/01_arquitectura_y_contrato.md)
- [Backlog del sprint](docs/02_backlog.md)
- [Especificación técnica global](docs/specs/global_spec.md)
- [Ficha técnica (entregable)](docs/ficha_tecnica.md)
- [Ficha de fuentes (entregable)](docs/ficha_fuentes.md)
- [Changelog](docs/changelog.md)

---

## Límites de Responsabilidad

- **PROTOTIPO · AI LAB Misión: Código Formosa · no es una herramienta oficial.**
- Los registros de atajaderos de demostración están rotulados como `SIMULADO / DATO DE PRUEBA` porque el relevamiento provincial oficial en curso no se encuentra publicado.
- La herramienta no reemplaza inspecciones presenciales en campo, no asigna estados técnicos sin criterios escritos/validados ni emite alertas o pronósticos oficiales. Toda decisión operativa permanece bajo responsabilidad humana.
