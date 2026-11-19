# Especificación Modular 03: APIs Externas, GeoAI (Copiloto HITL) y Dataset Realista de Formosa

- **Módulo:** `03_geoai_apis_datos`
- **Responsable:** Facundo Joaquín Leiva *(Datos, Fuentes, Capas SIG y GeoAI)*
- **Contratos Obligatorios:** Leer únicamente `docs/specs/00_CORE_CONTRACTS.md` y este archivo. **NO** indexar el resto de `apps/frontend/` ni rutas CRUD ajenas.
- **Estado:** `Borrador`
- **Última Actualización:** 2026-11-19

---

## 1. Alcance y Propósito del Módulo
Implementar el componente inteligente acotado (*Human-in-the-Loop*), la base de datos de demostración georreferenciada sobre Formosa y las capas vectoriales de referencia hidrográfica:
1. **Servicio Copiloto IA (`apps/backend/app/services/asistente_ia.py` + `routes/asistente.py`):** Proxy seguro en FastAPI hacia **Gemini API** (`GEMINI_API_KEY`, `GEMINI_MODEL`) con **degradación determinística offline automática** (`deterministico_offline`) idéntica en contrato JSON.
2. **Dataset Demo Realista (`apps/backend/app/seeds/seed_demo.py`):** 10 atajaderos `SIMULADO` con coordenadas reales sobre los 4 corredores críticos de Formosa y sus historiales de inspecciones 1:N.
3. **Capa GeoJSON de Corredores Fluviales de Referencia (`apps/frontend/src/data/riachosFormosaGeoJson.ts`):** Trazas aproximadas de referencia de los riachos El Porteño, He-Hé, Monte Lindo, Pilagá y Salado para contextualizar el mapa Leaflet.

---

## 2. Requerimientos Funcionales (EARS)
- **RF-AI-01 (Proxy Seguro y Resiliencia Offline):** `POST /api/asistente/resumir` jamás expone `GEMINI_API_KEY` al cliente. Si la variable está vacía, caduca el timeout (8 s) o falla la red, conmuta silenciosamente y sin error `500` al motor `deterministico_offline`, informando `modo_ejecucion: "deterministico_offline"`.
- **RF-AI-02 (Modo 1 — Estructurador de Nota Cruda de Campo):** Recibe `modo="estructurar_nota_campo"` y `texto_campo`. Detecta qué indicadores de `IndicadorVisual` (FAO/ASDSO/FHWA) aparecen en el relato, redacta un borrador técnico estructurado y sugiere posibles criterios de `estado` y `interrumpe_escurrimiento` a verificar, devolviendo siempre `requiere_confirmacion_humana: true`.
- **RF-AI-03 (Modo 2 — Síntesis de Triage de Mesa):** Recibe `modo="resumir_triage_mesa"` y `codigo_unico`. Lee (solo lectura) el atajadero y su historial 1:N desde PostgreSQL, sintetiza la evolución temporal, señala antigüedad de la última inspección en campo, alerta si existe riesgo de sobrepaso / rotura en cascada o afectación a alcantarilla vial, y enumera el encuadre legal aplicable (**Ley N° 1.246 Art. 88°**, **Ley N° 1.314 Art. 40°** y **Decreto-Ley N° 971/1980**).
- **RF-AI-04 (Prohibición de Escritura Autónoma):** El servicio de asistente IA **no puede ejecutar `INSERT` ni `UPDATE`** sobre las tablas `atajaderos` ni `inspecciones`.
- **RF-AI-05 (Seed Idempotente sobre Corredores Reales de Formosa):** `seed_demo.py` inserta los usuarios demo (`inspector@atajaderos.ar`, `referente@atajaderos.ar`) y los **10 atajaderos `SIMULADO`** detallados en la Sección 5 de `00_CORE_CONTRACTS.md` (más sus inspecciones iniciales), sin duplicar registros si se ejecuta múltiples veces.
- **RF-AI-06 (Capas SIG de Referencia y Contrato para Scripts Satelitales Externos):** Definir en `apps/frontend/src/data/riachosFormosaGeoJson.ts` un `FeatureCollection` tipado con las trazas de los 4 corredores fluviales principales y la metadata de fuentes (`IGN / Ministerio de Producción y Ambiente — REFERENCIA`). Documentar un ejemplo de payload JSON (`docs/ejemplos/hipotesis_satelital_gee.json`) demostrando cómo especialistas externos (UPCA / INTA / CONAE con scripts en Google Earth Engine / Sentinel-2 / SAR) pueden inyectar detecciones hacia `POST /api/atajaderos/importar-kobo` siempre en estado `sin_validar` + `a_verificar`, sin que el prototipo ejecute algoritmos satelitales en vivo.

---

## 3. Criterios de Aceptación (Gherkin)

```gherkin
Escenario: Estructuración de nota de campo en modo determinístico offline sin API Key
  Dado que GEMINI_API_KEY no está configurada en el contenedor backend
  Cuando un inspector invoca POST /api/asistente/resumir con modo "estructurar_nota_campo" y texto mencionando "sin vertedero, agua a 10 cm de la cresta y alcantarilla tapada con ramas"
  Entonces el backend responde HTTP 200 con modo_ejecucion "deterministico_offline", requiere_confirmacion_humana true
  Y sugiere los indicadores ["cierre_total_sin_vertedero", "riesgo_sobrepaso_borde_libre", "alcantarilla_obstruida"] sin modificar la base de datos

Escenario: Ejecución idempotente del seed realista de Formosa
  Dado el contenedor backend conectado a PostgreSQL 18 / PostGIS 3.7
  Cuando se ejecuta dos veces seguidas python -m app.seeds.seed_demo
  Entonces existen exactamente 10 atajaderos rotulados categoria_dato "SIMULADO" dentro del bounding box geográfico de Formosa
```

---

## 4. Archivos del Perímetro de Implementación
- `apps/backend/app/schemas/asistente.py`
- `apps/backend/app/services/asistente_ia.py`
- `apps/backend/app/api/routes/asistente.py`
- `apps/backend/app/seeds/seed_demo.py`
- `apps/backend/tests/test_asistente.py`
- `apps/frontend/src/data/riachosFormosaGeoJson.ts`

---

## 5. Verificación Obligatoria en Docker
1. `docker compose exec backend uv run --no-sync python -m app.seeds.seed_demo` (ejecutar 2 veces y confirmar idempotencia).
2. `docker compose exec backend uv run --no-sync pytest tests/test_asistente.py` (cubriendo modo 1, modo 2, fallback offline y rechazo `422` ante payload vacío).
3. `docker compose exec backend uv run --no-sync ruff check .`
