# Especificación Modular 01: Backend, PostGIS, Inventario e Inspecciones

- **Módulo:** `01_backend_atajaderos`
- **Responsable:** Enrique Maximiliano González *(Arquitectura y Backend FastAPI)*
- **Contratos Obligatorios:** Leer únicamente `docs/specs/00_CORE_CONTRACTS.md` y este archivo. **NO** indexar `apps/frontend/` ni el resto de `docs/`.
- **Estado:** `Borrador`
- **Última Actualización:** 2026-11-19

---

## 1. Alcance y Propósito del Módulo
Implementar el núcleo transaccional y geoespacial en **FastAPI + SQLAlchemy 2.0 + Alembic + PostgreSQL 18 / PostGIS 3.7**:
1. Modelos relacionales 1:N (`Atajadero` $\rightarrow$ `Inspeccion`) con clave técnica `UUID` + `codigo_unico` inmutable (`ATJ-FSA-NNNN`) y geometría `POINT` EPSG:4326 en PostGIS.
2. Endpoints REST de inventario, exportación `GeoJSON` (compatible QGIS/QField), historial *append-only* de inspecciones/intervenciones con carga de fotos selladas con hash `SHA-256` e importación por lotes tipo KoboToolbox/QField.
3. Suite TDD (`pytest` en Docker contra `atajaderos_test`) cubriendo flujo feliz, máquina de estados y rechazos `HTTP 422`.

---

## 2. Requerimientos Funcionales (EARS)
- **RF-BK-01 (Enumerados Cerrados):** Definir `StrEnum` exactos del contrato `00_CORE_CONTRACTS.md` en `apps/backend/app/enums/` (`EstadoAtajadero`, `InterrupcionEscurrimiento`, `TipoEmplazamiento`, `CategoriaDato`, `TipoRegistro`, `IndicadorVisual`).
- **RF-BK-02 (Persistencia PostGIS + Inmutabilidad):** Crear migración Alembic `0002_create_atajaderos_inspecciones.py` con tablas `atajaderos` (PK `id: UUID`, `codigo_unico` único e inmutable, `latitud`, `longitud`, columna PostGIS `geom geometry(Point, 4326)` con índice GIST o poblada vía `ST_SetSRID(ST_MakePoint(lon, lat), 4326)`, `tipo_emplazamiento`, `estado`, `interrumpe_escurrimiento`, `categoria_dato`, `fecha_ultima_inspeccion`) e `inspecciones` (PK `id: UUID`, FK `atajadero_id`, `indicadores_visuales` JSONB/JSON, `evidencia_fotos` JSON, `fotos_hashes_sha256` JSON).
- **RF-BK-03 (Inventario y Exportación GeoJSON):** Exponer `GET /api/atajaderos` (filtros por `estado`, `interrumpe_escurrimiento`, `tipo_emplazamiento`, `departamento`, `cuenca_riacho` y búsqueda `q`), `GET /api/atajaderos/geojson` (`FeatureCollection` EPSG:4326) y `GET /api/atajaderos/{codigo_unico}` (detalle + historial 1:N ordenado DESC sin N+1 usando `selectinload`).
- **RF-BK-04 (Alta con Validación Territorial):** `POST /api/atajaderos` valida con Pydantic v2 que `-27.0 <= latitud <= -22.0` y `-62.5 <= longitud <= -57.5` (rango geográfico de Formosa), autogenera `codigo_unico` secuencial `ATJ-FSA-NNNN` si no se envía, y rechaza códigos duplicados con `HTTP 409`.
- **RF-BK-05 (Inspecciones 1:N Append-Only y Hash SHA-256):** `POST /api/atajaderos/{codigo_unico}/inspecciones` acepta `multipart/form-data` (o JSON), valida la máquina de estados (rechazando con `422` regresar a `sin_validar` o enviar `observaciones` de menos de 10 caracteres), guarda la imagen en `/app/uploads` validando MIME (`image/jpeg`, `image/png`, `image/webp`) y tamaño ($\le 5\text{ MB}$), calcula `hashlib.sha256` del archivo original y actualiza `estado`, `interrumpe_escurrimiento`, `criterio_validado_por` y `fecha_ultima_inspeccion` en `atajaderos` sin alterar `codigo_unico`.
- **RF-BK-06 (Importación Offline KoboToolbox / QField / Hipótesis Satelitales):** `POST /api/atajaderos/importar-kobo` procesa un lote JSON/GeoJSON de registros de campo o de scripts externos de especialistas SIG (Google Earth Engine / QGIS), crea atajaderos nuevos (o agrega inspección si `codigo_unico` ya existe) y devuelve conteo de creados/actualizados/errores por ítem.
- **RF-BK-07 (Endpoint Público de Aviso Vecinal — Forma B):** Exponer `POST /api/avisos` (sin JWT, acepta JSON o `multipart/form-data` con foto opcional sellada con `SHA-256`). Valida bounding box de Formosa (`-27.0 <= lat <= -22.0`, `-62.5 <= lon <= -57.5`) y descripción $\ge 10$ caracteres (`HTTP 422`), e **ignora/prohíbe** cualquier estado técnico enviado por el cliente: siempre persiste el nuevo activo con `estado = "sin_validar"`, `interrumpe_escurrimiento = "a_verificar"`, `tipo_emplazamiento = "a_determinar"`, `categoria_dato = "SIMULADO"` y `criterio_validado_por = "Aviso vecinal (pendiente validación presencial)"`, registrando la descripción/foto como nota inicial.

---

## 3. Criterios de Aceptación (Gherkin)

```gherkin
Escenario: Aviso vecinal público sin login (Forma B) ingresa blindado como sin_validar
  Dado un vecino o productor sin sesión iniciada
  Cuando envía POST /api/avisos con coordenadas en Laguna Gallo (-25.12, -59.45) y descripción válida
  Entonces el backend responde HTTP 201 con codigo_unico "ATJ-FSA-NNNN", estado "sin_validar" e interrumpe_escurrimiento "a_verificar"
  Y jamás asigna estado "operativo", "con_deterioro" ni "si" sin inspección presencial autenticada

Escenario: Alta de atajadero y verificación de exportación GeoJSON compatible con QField
  Dado un usuario autenticado con JWT válido
  Cuando envía POST /api/atajaderos con coordenadas (-24.9814, -59.8412) y categoria_dato "SIMULADO"
  Entonces el backend responde HTTP 201 con codigo_unico formato "ATJ-FSA-NNNN"
  Y GET /api/atajaderos/geojson incluye ese Feature Point en EPSG:4326

Escenario: Registro de inspección con fotografía sellada con SHA-256 y checklist FAO/FHWA
  Dado un atajadero existente en estado "sin_validar"
  Cuando el inspector envía POST /api/atajaderos/{codigo_unico}/inspecciones con foto JPEG e indicadores ["cierre_total_sin_vertedero", "riesgo_sobrepaso_borde_libre"]
  Entonces responde HTTP 201 con ruta bajo "/uploads/..." y su hash SHA-256 de 64 caracteres hexadecimales
  Y el atajadero actualiza su fecha_ultima_inspeccion sin modificar su codigo_unico

Escenario: Rechazo de entrada inválida y regresión de estado prohibida (HTTP 422)
  Dado un atajadero ya validado en estado "con_deterioro"
  Cuando se intenta registrar una inspección volviendo a "sin_validar" o con latitud -34.60 (fuera de Formosa)
  Entonces el backend responde HTTP 422 detallando el motivo del rechazo
```

---

## 4. Archivos del Perímetro de Implementación
- `apps/backend/app/enums/` (`estado_atajadero.py`, `interrupcion_escurrimiento.py`, `tipo_emplazamiento.py`, `categoria_dato.py`, `tipo_registro.py`, `indicador_visual.py`, `__init__.py`)
- `apps/backend/app/models/` (`atajadero.py`, `inspeccion.py`, `__init__.py`)
- `apps/backend/alembic/versions/0002_create_atajaderos_inspecciones.py`
- `apps/backend/app/schemas/` (`atajadero.py`, `inspeccion.py`)
- `apps/backend/app/api/routes/` (`atajaderos.py`, `inspecciones.py`) y registro en `apps/backend/app/main.py`
- `apps/backend/tests/` (`test_atajaderos.py`, `test_inspecciones.py`)

---

## 5. Verificación Obligatoria en Docker
1. `docker compose exec backend uv run --no-sync alembic upgrade head`
2. `docker compose exec backend uv run --no-sync pytest` (100 % verde)
3. `docker compose exec backend uv run --no-sync ruff check .` y `ruff format --check .`
