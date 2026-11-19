# AI LAB Misión: Código Formosa — Operación Agua · Desafío 1: Atajaderos

> **PROTOTIPO · AI LAB Misión: Código Formosa · no es una herramienta oficial**

## 1. Equipo 6 — Los Más Experimentados (UTN Extensión Áulica Formosa)
- **Integrantes:**
  - Enrique Maximiliano González *(Arquitectura y Backend FastAPI — `apps/backend/`)*
  - Matías Daniel Núñez *(Frontend React + Bun + Vite + Mapa Leaflet — `apps/frontend/`)*
  - Facundo Joaquín Leiva *(Datos, Fuentes y GeoAI)*
  - Antonio Gabriel Pineda *(QA, Repo, Docker y Documentación)*
  - Fabrizio Facundo Ginéz *(Producto, Póster, Video y Pitch)*
- **Docente referente:** Lautaro Rolón
- **Repositorio público:** https://github.com/Gabiota2806/atajaderos-formosa
- **Organización:** Secretaría de Estado de Ciencia y Tecnología + Clúster de Innovación Tecnológica Formosa (CITF, `clusteritf@gmail.com`) + mentoría de Push Software.

## 2. El Desafío Asignado: Atajaderos
- **Problema:** Los atajaderos son obras para retener agua de los riachos. En Formosa hace falta organizar su ubicación, estado, historial de intervenciones y antecedentes de inspección, priorizando detectar intervenciones que **interrumpan el escurrimiento del riacho** frente al evento El Niño.
- **Pregunta orientadora:** *¿Cómo podemos organizar información territorial para conocer, inventariar y realizar el seguimiento del estado de los atajaderos de Formosa?*
- **Capacidades mínimas del prototipo:**
  1. Registrar un atajadero con **código único inmutable** (no cambia aunque cambie su nombre o estado) y ubicación geográfica.
  2. Registrar estado con **criterios explícitos y escritos** (ej. `operativo`, `con_deterioro`, `fuera_de_servicio`, `sin_validar`) + si **interrumpe el escurrimiento** (`si`, `no`, `a_verificar`).
  3. Adjuntar evidencia fotográfica/territorial, fecha y responsable de inspección.
  4. Registrar historial de intervenciones realizadas.
  5. Consultar el inventario en un **mapa o tablero**.
- **Límite de responsabilidad:** La herramienta **no** asigna estados técnicos sin criterios definidos, **no** reemplaza inspecciones presenciales ni emite alertas/pronósticos oficiales. Los datos de demo deben rotularse como `SIMULADO` / `DATO DE PRUEBA`.

## 3. Reglas Transversales del Kit y Estructura del Monorepo
- **Categorías de datos (obligatorio mostrar en pantalla):**
  - `DATO OBSERVADO`: Mediciones/umbrales oficiales (INA, SMN, NOAA; kit congelado al `31/10/2026`).
  - `DOCUMENTO DE REFERENCIA`: Boletines, reportes diarios, cartografía IGN y fuentes oficiales.
  - `SIMULADO`: Sectores ficticios (`K10`), salidas de prueba, escenarios y datos de demo.
- **Leyenda obligatoria en toda pantalla, video y ficha:**
  `PROTOTIPO · AI LAB Misión: Código Formosa · no es una herramienta oficial`
- **Estructura del monorepo (alineada 100 % con `07_Entrega_Tecnica_Software.pdf`):**
  - `apps/backend/`: **FastAPI** (Python 3.12 + `uv` + SQLAlchemy 2.0 + Alembic + `psycopg` + Pydantic v2 + `pytest` + Ruff).
  - `apps/frontend/`: **React + Bun + Vite + TypeScript** + Tailwind CSS v4 + **Leaflet** + Heroicons SVG.
  - `postgres`: **PostgreSQL 18 + PostGIS 3.7** (`postgis/postgis:18-3.7`, bases `atajaderos` y `atajaderos_test`).
  - `docs/`: fuentes, contratos, specs SDD, fichas y changelog.
  - `compose.yaml`, `README.md`, `.env.example`, `.gitignore`, `apps/backend/uv.lock` y `apps/frontend/bun.lock`.

## 4. Las 7 Preguntas Previas al Desarrollo (Completadas)
1. **El Usuario:** Técnicos e inspectores de la mesa interinstitucional por El Niño (agente que releva en territorio + referente de mesa que prioriza intervenciones desde el mapa/tablero).
2. **El Problema:** Falta de un inventario unificado y trazable de atajaderos en Formosa (ubicación, criterios explícitos de estado, historial de intervenciones y registro de si interrumpen el escurrimiento del riacho frente a El Niño).
3. **La Solución (función principal):** Monorepo web **FastAPI + React/Bun** con mapa interactivo Leaflet para dar de alta atajaderos con código único inmutable, cargar inspecciones/intervenciones con evidencia fotográfica, criterios escritos de estado y bandera de escurrimiento, consultar historial y sumar formulario simplificado tipo campo / importación desde KoboToolbox.
4. **Los Datos (qué necesitamos y de dónde):** Capas SIG oficiales del IGN (`REFERENCIA`), escalas/umbrales INA y boletines SMN/NOAA del kit oficial al 31/10/2026 (`OBSERVADO`/`REFERENCIA`), escenas puntuales de Copernicus Sentinel-2 (`OBSERVADO`) y Global Surface Water Explorer (`REFERENCIA`), más dataset de demostración creado por el equipo rotulado `SIMULADO / DATO DE PRUEBA`.
5. **La Demostración (qué mostraremos en vivo al jurado):** Simulación de un aviso vecinal por posible bloqueo en un riacho: búsqueda en el inventario, registro de inspección de verificación con foto, documentación de la decisión humana y prueba de rechazo de entrada inválida.
6. **Los Límites (qué NO podemos asegurar):** No reemplaza inspecciones presenciales en campo; no asigna estados técnicos sin criterios validados; no accede al relevamiento oficial provincial no publicado (`SIMULADO / DATO DE PRUEBA`); no emite alertas ni pronósticos oficiales; la decisión operativa siempre es humana.
7. **El Aporte Tecnológico (por qué IA / tecnología aporta valor real):** Trazabilidad inmutable y georreferenciación + asistente IA acotado (*Human-in-the-Loop*, Gemini proxy en FastAPI con fallback determinístico offline) que resume historiales de inspección o estructura observaciones de campo en un borrador de ficha, exigiendo confirmación humana y sin asignar estados automáticamente.

## 5. Cronograma y Evaluación (100 pts)
- **Jueves 19/11 (18 h):** Ventana de consulta virtual / mentoría sobre El Niño.
- **Viernes 20/11 (18 h):** Entrega en plataforma (monorepo + commit/tag + video MP4 ≤ 120 s + `ficha_tecnica.md` + `ficha_fuentes.md`).
- **Sábado 21/11 (desde 9:30 / 10:00 h):** Simulación ante mesa evaluadora + exposición de póster + pitch de 3 minutos.
- **Rúbrica:** Utilidad para decidir (`30`) · Rigor (`25`) · Honestidad frente a incertidumbre e IA (`15`) · Continuidad (`15`) · Equipo y comunicación (`15`).
