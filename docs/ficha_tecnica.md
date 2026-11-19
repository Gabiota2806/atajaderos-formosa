# Ficha técnica · AI LAB Misión: Código Formosa
PROTOTIPO · no es una herramienta oficial · Entrega: viernes 20/11/2026, 18 h

**Nombre de la herramienta:** Atajaderos Formosa — Operación Agua
**Equipo · institución · integrantes y rol de cada uno:** Equipo 6 · Los Más Experimentados · UTN Extensión Áulica Formosa — Enrique Maximiliano González (*Arquitectura y Backend FastAPI*), Matías Daniel Núñez (*Frontend React/Bun y Mapa Leaflet*), Facundo Joaquín Leiva (*Datos, Fuentes y GeoAI*), Antonio Gabriel Pineda (*QA, Repo, Docker y Documentación*), Fabrizio Facundo Ginéz (*Producto, Póster, Video y Pitch*). Docente referente: Lautaro Rolón.
**Reto:** Desafío 1 · Atajaderos (Operación Agua)

## Usuario y pregunta
Técnicos e inspectores de la mesa interinstitucional por El Niño en Formosa (agentes que relevan en territorio y referentes de mesa que priorizan intervenciones). Responde a cómo organizar información territorial trazable para inventariar atajaderos, registrar su estado e historial y detectar cuáles interrumpen el escurrimiento de los riachos.

## Qué funciona hoy
*(Actualizar antes de la entrega del viernes 20/11 con la lista exacta de funciones verificadas en vivo)*

## Qué falta para que la mesa la use
*(Datos reales del relevamiento provincial en curso, permisos institucionales, integraciones oficiales, validación técnica de los criterios de estado en campo, tiempo estimado. Es la parte que más lee la mesa)*

## Cómo está hecha
Monorepo **100 % dockerizado** (`compose.yaml`) compuesto por:
- **Backend (`apps/backend/`):** FastAPI (Python 3.12 + `uv`), SQLAlchemy 2.0, Alembic, Pydantic v2, autenticación JWT, almacenamiento local de evidencias fotográficas y `pytest`/`ruff`.
- **Frontend (`apps/frontend/`):** React 18 + Bun + Vite + TypeScript estricto + Tailwind CSS v4 + Leaflet para cartografía + `@heroicons/react`.
- **Base de datos:** PostgreSQL 18 + PostGIS 3.7 (`postgis/postgis:18-3.7`).
- **IA acotada (*Human-in-the-Loop*):** Proxy seguro en FastAPI hacia Gemini API con degradación determinística offline para resumir historiales o estructurar borradores bajo validación humana obligatoria.

## Lo que la herramienta no puede decir
- No asigna estados técnicos definitivos sin criterios validados por un técnico ni reemplaza inspecciones presenciales en campo.
- No utiliza el relevamiento provincial oficial en curso (datos no publicados; los registros de demo son `SIMULADO / DATO DE PRUEBA`).
- No emite alertas tempranas ni pronósticos hidrológicos oficiales; las decisiones operativas permanecen bajo responsabilidad humana.

## Cómo se arranca (cinco líneas)
1. `git clone https://github.com/Gabiota2806/atajaderos-formosa.git && cd atajaderos-formosa`
2. `cp .env.example .env && docker compose up -d --build`
3. `docker compose exec backend uv run --no-sync alembic upgrade head`
4. `docker compose exec backend uv run --no-sync python -m app.seeds.seed_demo`
5. Abrir `http://localhost:5173` (Swagger backend en `http://localhost:8000/docs` · tests: `docker compose exec backend uv run --no-sync pytest`).

## Repositorio
- **Tema elegido:** Desafío 1 · Atajaderos (Operación Agua)
- **URL del monorepo GitHub:** https://github.com/Gabiota2806/atajaderos-formosa
- **Commit o tag evaluable:** *(A completar al cerrar sprint)*
- **Frontend / Backend / Configuración:** `apps/frontend/` (React + Bun + Vite TS) · `apps/backend/` (FastAPI + Python 3.12 + `uv`) · PostgreSQL 18 + PostGIS 3.7 en `compose.yaml`
