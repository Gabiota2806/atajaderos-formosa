# Ficha de fuentes · AI LAB Misión: Código Formosa
> **PROTOTIPO · AI LAB Misión: Código Formosa · no es una herramienta oficial**

Herramienta: Atajaderos Formosa — Operación Agua · Equipo: Equipo 6 · Los Más Experimentados (UTN Extensión Áulica Formosa)

Cada cifra, umbral, serie o capa que la herramienta muestra, con su fuente y su categoría. Regla: si no está acá, no se muestra.

| Qué muestra la herramienta | Valor o rango | Fuente (archivo del kit o URL) | Categoría (observado / referencia / simulado) | Fecha del dato |
| :--- | :--- | :--- | :--- | :--- |
| Mapa base vial en Leaflet (`Mapa vial IGN`) | Teselas TMS EPSG:3857 (zoom hasta 18) | IGN · Argenmap TMS (`https://wms.ign.gob.ar/geoserver/gwc/service/tms/1.0.0/capabaseargenmap@EPSG%3A3857@png/{z}/{x}/{y}.png`) | Referencia (Base cartográfica) | 20/11/2026 |
| Capa satelital en Leaflet (`Satelital Esri`) | Mosaico satelital óptico (zoom hasta 18) | Esri · World Imagery (`https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}`) | Observado / Referencia | 20/11/2026 |
| Capa vectorial de corredores fluviales en el mapa | 5 trazas esquemáticas (`El Porteño`, `He-Hé`, `Monte Lindo / A° Tatú Piré`, `Pilagá`, `Bañado La Estrella – Salado`) | `apps/frontend/src/data/riachosFormosaGeoJson.ts` (trazas esquemáticas basadas en hidrografía IGN / MPyA) | Referencia | 19/11/2026 |
| Inventario demo de atajaderos e historial inicial | 10 atajaderos (`ATJ-FSA-0001` a `ATJ-FSA-0010`), 9 eventos históricos y 2 cuentas demo | `apps/backend/app/seeds/seed_demo.py` (datos ficticios de demostración; relevamiento oficial no publicado) | Simulado | 19/11/2026 |
| Lote de ejemplo KoboToolbox y plantilla satelital externa | 3 registros demo Kobo (incluye 1 fuera de rango) y 1 plantilla GEE ilustrativa | `apps/frontend/src/components/ImportarKoboModal.tsx` y `docs/ejemplos/hipotesis_satelital_gee.json` | Simulado | 19/11/2026 |
| Validación territorial y departamentos de Formosa | Lat `-27,0` a `-22,0`, Lon `-62,5` a `-57,5`; 9 departamentos provinciales | IGN · Capas SIG (`https://www.ign.gob.ar/NuestrasActividades/InformacionGeoespacial/CapasSIG`) | Referencia | 19/11/2026 |
| Criterios escritos de estado y bandera de escurrimiento | 4 estados (`sin_validar`, `operativo`, `con_deterioro`, `fuera_de_servicio`) y `interrumpe_escurrimiento` (`si`, `no`, `a_verificar`) | Propuesta preliminar escrita del Equipo 6 (`docs/specs/00_CORE_CONTRACTS.md`) — **no validada aún por técnico oficial** | Referencia | 18/11/2026 |
| Umbral de lectura rezagada en KPIs y cola de triage | `> 14 días` desde `fecha_ultima_inspeccion` | Criterio operativo preliminar del Equipo 6 (`apps/frontend/src/lib/dominio.ts`), inspirado en Ceará/AESA — **no validado aún por técnico oficial** | Referencia | 19/11/2026 |
| Checklist de 5 patologías visuales en inspecciones | Cierre total sin vertedero, riesgo de sobrepaso, filtración turbia/tubificación, grietas/cuevas, alcantarilla obstruida | FAO Paper 64 (*Manual on Small Earth Dams*), ASDSO y FHWA *Culvert Inspection Manual* | Referencia | 19/11/2026 |
| Encuadre normativo mostrado en ficha y Copiloto IA | Ley Prov. N° 1.246 (Art. 88°), Ley Prov. N° 1.314 (Art. 40°), Decreto-Ley N° 971/1980 | Legislación de la Provincia de Formosa vía SAIJ (`https://www.saij.gob.ar/`) | Referencia | 19/11/2026 |
| Contexto hidrométrico y climático El Niño *(referencia de escenario; no se carga en la BD del inventario)* | Puerto Formosa `5,60 m` (31/10/2026), alerta `7,80 m`, evacuación `8,30 m`, pico 2016 `9,81 m`; SMN 100 % El Niño; NOAA 83 % fuerte/muy fuerte | Kit Operación Agua v1.1 (`K3_estaciones_umbrales.json`, `K4_reporte_INA_2026-10-31.pdf`, `K5_boletin_ENSO.pdf`, `K9_fuentes.md` — INA, SMN, NOAA) | Observado (`K3`) / Referencia (`K4`, `K5`, `K9`) | 31/10/2026 |

### Aclaración sobre `K1` y `registro_limpieza.md`
Esta herramienta aborda el **Desafío 1 (Atajaderos)** y **no utiliza** la serie hidrométrica `K1` (`P1_DATA_INTEGRITY_dataset_participantes_v1.csv`, altura del río Paraguay en Puerto Formosa) ni los polígonos ficticios `K10`. Conforme al Documento Base v1.1 (*"K1 se audita cuando el proyecto utiliza esa serie"*), no corresponde adjuntar `registro_limpieza.md` de `K1`.

### Fuentes externas usadas (URL y fecha de consulta)
- **Fuentes recomendadas por la Guía Oficial del Desafío 1 (CITF, consultadas el 16–20/11/2026):**
  - IGN · Capas SIG y servicio WFS/TMS Argenmap (`https://www.ign.gob.ar/NuestrasActividades/InformacionGeoespacial/CapasSIG`, `https://www.ign.gob.ar/AreaServicios/Argenmap/Introduccion`): base cartográfica oficial usada en el mapa Leaflet (`REFERENCIA`).
  - Esri · World Imagery MapServer (`https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer`): capa satelital pública usada en el visor Leaflet para visualización sin credenciales (`OBSERVADO / REFERENCIA`).
  - Copernicus Browser — ESA (`https://browser.dataspace.copernicus.eu/`) y Global Surface Water Explorer — JRC/Google (`https://global-surface-water.appspot.com/`): fuentes abiertas de referencia para análisis satelital externo conectable vía `POST /api/atajaderos/importar-kobo` (no ejecutadas en vivo por el prototipo).
  - KoboToolbox (`https://www.kobotoolbox.org/`) y QGIS (`https://qgis.org/`): herramientas abiertas con las que el prototipo interopera mediante importación JSON/GeoJSON y exportación `GET /api/atajaderos/geojson`.
- **Contexto provincial citado en la guía oficial y prensa local (consultadas el 16–19/11/2026):**
  - AGENFOR (5/9/2026) y El Monterizo (17/9/2026): contexto provincial del relevamiento de atajaderos frente a El Niño (citados en la Guía Oficial del Desafío 1).
  - Dirección Provincial de Vialidad de Formosa (DPV, octubre 2026): advertencia sobre alcantarillas obstruidas en RN 11 y RN 95 (respalda la categoría `alcantarilla_vial`).
- **Marco normativo de Formosa (`REFERENCIA`, consultado el 19/11/2026):**
  - Ley Provincial N° 1.246 — Código de Aguas (Art. 88° Registro de Atajaderos), Ley Provincial N° 1.314 — Código Rural (Art. 40° prohibición sobre corrientes activas), Decreto-Ley N° 971/1980 — Procedimientos Administrativos (`https://www.saij.gob.ar/`) y Decreto N° 1.228/04–05 (UPCA).
- **Sistemas comparados y estándares técnicos de diseño (`REFERENCIA`, consolidados en `docs/03_antecedentes_y_soluciones_comparadas.md`, consultados el 18–19/11/2026):**
  - Portal Hidrológico do Ceará — COGERH / FUNCEME (`https://www.hidro.ce.gov.br/`): separación entre reservorios estratégicos y espejos difusos y fecha visible de última lectura.
  - MapBiomas Água / MapBiomas Chaco (`https://plataforma.agua.mapbiomas.org/`, `https://chaco.mapbiomas.org/`): alcance y limitaciones de clasificación satelital óptica/SAR en el Gran Chaco.
  - AESA Paraíba — Volume dos Açudes (`https://www.aesa.pb.gov.br/volume-dos-acudes/`): monitoreo híbrido y gobernanza participativa.
  - QField / QFieldCloud (`https://docs.qfield.org/`): patrón relacional 1:N offline-first con UUID v4 inmutable y política de conflictos manual.
  - Estándares de inspección y teledetección: FAO Paper 64 (*Manual on Small Earth Dams*), ASDSO, FHWA *Culvert Inspection Manual*, DINAGUA Uruguay (Decreto N° 123/999), DEA Waterbodies / AusDams Australia, UFC/FUNCEME (rotura en cascada), UN-SPIDER, Sentinel-1C/D, CONAE SAOCOM y NASA–ISRO NISAR.
