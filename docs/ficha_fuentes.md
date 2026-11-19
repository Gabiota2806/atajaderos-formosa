# Ficha de fuentes · AI LAB Misión: Código Formosa
Herramienta: ____________________ · Equipo: Equipo 6 · Los Más Experimentados (UTN)

Cada cifra, umbral, serie o capa que la herramienta muestra, con su fuente y su categoría. Regla: si no está acá, no se muestra.

| Qué muestra la herramienta | Valor o rango | Fuente (archivo del kit o URL) | Categoría (observado / referencia / simulado) | Fecha del dato |
| :--- | :--- | :--- | :--- | :--- |
| Registros de atajaderos de demostración | Inventario demo | Datos de prueba generados para la simulación | Simulado | 17/11/2026 |
| Imágenes ópticas Sentinel-2 (10 m) | Cobertura territorial | Copernicus Browser (`browser.dataspace.copernicus.eu`) | Observado | *(fecha consulta)* |
| Historial de agua superficial (30 m) | Serie 1984–2021 (Landsat) | Global Surface Water Explorer (`global-surface-water.appspot.com`) | Referencia | *(fecha consulta)* |
| Capas vectoriales de hidrografía, límites y red vial | Base cartográfica oficial | IGN · Capas SIG / WFS (`ign.gob.ar`) | Referencia (Base cartográfica) | *(fecha consulta)* |

Fuentes externas usadas (URL y fecha de consulta):
- AGENFOR (5/9/2026) y El Monterizo (17/9/2026): contexto provincial del relevamiento de atajaderos frente a El Niño (citadas en la guía oficial del Desafío 1, consultadas el 16/11/2026).
- Marco normativo de Formosa (`REFERENCIA`, consultado el 19/11/2026): Ley Provincial N° 1.246 — Código de Aguas (Art. 88° Registro de Atajaderos), Ley Provincial N° 1.314 — Código Rural (Art. 40° prohibición sobre corrientes), Decreto-Ley N° 971/1980 — Procedimientos Administrativos (`saij.gob.ar`) y Decreto N° 1.228/04–05 (UPCA).
- Portal Hidrológico do Ceará — COGERH / FUNCEME (`https://www.hidro.ce.gov.br/`, consultado el 18–19/11/2026): 157 açudes estratégicos, 51.655 espejos difusos $\ge 0,3\text{ ha}$ (Sentinel-2 Script Base 3.0), 6 bandas explícitas y fecha visible de lecturas rezagadas.
- MapBiomas Água / MapBiomas Chaco (`https://plataforma.agua.mapbiomas.org/`, `https://chaco.mapbiomas.org/`, ATBD Col. 4/5, consultado el 18–19/11/2026): metodología subpíxel SWSC (Landsat 30 m), fusión Sentinel-1/2 y limitaciones bajo vegetación ribereña chaqueña.
- AESA Paraíba — Volume dos Açudes (`https://www.aesa.pb.gov.br/volume-dos-acudes/`, Informe PROGESTÃO 2025, consultado el 18–19/11/2026): monitoreo híbrido (136 réguas + 63 HidroObserva + 5 PCDs) y gobernanza *Alocação Negociada de Água*.
- QField / QFieldCloud para QGIS y PostGIS (`https://docs.qfield.org/`, consultado el 18–19/11/2026): arquitectura 1:N offline-first con UUID v4 inmutable, política de conflicto Manual y evidencia fotográfica con EXIF/sellado.
- Estándares técnicos de hidrología, inspección visual y radar SAR (`REFERENCIA`, consultado el 19/11/2026): FAO Paper 64 (*Manual on Small Earth Dams*), ASDSO, FHWA *Culvert Inspection Manual*, DINAGUA Uruguay (Decreto N° 123/999), DEA Waterbodies / AusDams Australia, estudios UFC/FUNCEME (rotura en cascada cuenca Nogueira 2025), UN-SPIDER, Copernicus Sentinel-1C/D, CONAE SAOCOM y NASA–ISRO NISAR.
- *(Agregar aquí cualquier otra fuente incorporada: INA, SMN, NOAA, parte hídrico provincial, etc.)*
