# Antecedentes y Soluciones Comparadas (Investigación Profunda de Referencia)

> **PROTOTIPO · AI LAB Misión: Código Formosa · no es una herramienta oficial**

Documento consolidado de respaldo técnico, jurídico e hidrológico del **Equipo 6 — Los Más Experimentados (UTN Formosa)**, enriquecido con la investigación profunda (Deep Research, 19/11/2026) sobre Formosa, el Gran Chaco y 6 experiencias internacionales comparadas.

---

## 1. Diagnóstico Local en Formosa: Hidrología de Llanura, Antecedentes y Marco Normativo

### 1.1. Red Hidrográfica Crítica y Antecedentes Documentados
La provincia de Formosa es una planicie aluvial con pendiente regional mínima ($<0,5\text{ m/km}$) de oeste a este hacia el Río Paraguay. Bajo esa topografía, cualquier terraplén transversal —un atajadero predial o un terraplén vial con alcantarilla tapada— altera el drenaje a escala de decenas de kilómetros:
- **Riacho El Porteño (300–350 km) y Riacho He-Hé (~200 km):** Recorren Patiño, Pilagá y Pilcomayo paralelos a la RN 86 y cruzados por RP 23, 24, 26, 28 y RN 11. Existen antecedentes reiterados de atajaderos privados sobre el cauce, obras de reactivación estatal (110–120 km en He-Hé) y estudios hidrológicos del INTA (10 estaciones en El Porteño).
- **Sistema Riacho Monte Lindo (Grande ~300 km, Chico ~160 km y A° Tatú Piré ~250 km):** En enero de 2016 su crecida anegó familias en **Laguna Gallo** y motivó denuncias oficiales por atajaderos irregulares que inundaban campos vecinos.
- **Riacho Pilagá (~210 km):** Relevamientos provinciales de riesgo hídrico en **Boca Riacho Pilagá** y **Mojón de Fierro** (2013).
- **Bañado La Estrella y Riacho Salado:** Regulado en la RP 28 (vertedero de 900 m por el que circularon ~1.500 m³/s en abril de 2025; reclamos en Campo del Cielo y advertencias viales por riesgo hacia Las Lomitas y canal Montelindo).
- **Presión hidroclimática 2025–2027:** En mayo de 2025 temporales de 310–400 mm provocaron evacuaciones (El Coatí 400 mm, Alto Alegre 367 mm, Palo Santo 315 mm, El Bañadero 310 mm). En 1997, 1998 y 2016 los eventos El Niño afectaron en conjunto un 22 % de la provincia (~1.350.000 ha). En octubre de 2026 la Dirección Provincial de Vialidad (DPV) advirtió que alcantarillas sin limpiar en **RN 11 y RN 95** convierten terraplenes viales en diques.

### 1.2. Marco Jurídico Provincial (Por Qué Nuestra Arquitectura Exige `tipo_emplazamiento` y *Human-in-the-Loop*)
- **Ley Provincial N° 1.246 (Código de Aguas, 1997):** Declara de dominio público las aguas que corren por cauces naturales (Arts. 7°–8°). Su **Artículo 88° («Registro de atajadero»)** obliga a registrar los atajaderos pecuarios y tramitar título de concesión (multas en Arts. 283°–285°).
- **Ley Provincial N° 1.314 (Código Rural — Art. 40°):** Establece tajantemente que *"quedan prohibidos los atajaderos sobre corrientes de aguas"*.
  - *Implicancia de diseño:* Nuestro sistema incorpora `tipo_emplazamiento` (`en_cauce_activo`, `lateral_fuera_de_cauce`, `alcantarilla_vial`, `a_determinar`) para diferenciar obras laterales concesionables (Art. 88° Ley 1.246) de cierres prohibidos sobre corrientes activas (Art. 40° Ley 1.314).
- **Decreto-Ley N° 971/1980 (Ley de Procedimientos Administrativos de Formosa):** Exige debido proceso, prueba fehaciente verificada en terreno, notificación y derecho a descargo previo antes de intimar, sancionar o remover. **Bloquea jurídicamente cualquier sanción o clasificación automática por IA/satélite** y fundamenta el sellado fotográfico `SHA-256` en historial *append-only*.
- **Brecha institucional (Diagnóstico FAO sobre UPCA, Decreto N° 1.228/04–05):** Ausencia de telemedición en la red secundaria y carencia de un SIG dinámico actualizado de atajaderos.

---

## 2. Análisis Técnico Comparado de los 4 Sistemas de Referencia

### 2.1. Portal Hidrológico do Ceará (COGERH + FUNCEME — Brasil)
- **Fuente:** `https://www.hidro.ce.gov.br/` y App Móvil oficial (actualización cada 7 min).
- **Escala verificada:** Separa **157 açudes estratégicos** monitoreados diariamente *in situ* (144 activos al 18/11/2026, 18.567 hm³) del mapeo satelital de la *açudagem difusa* mediante *Script Base 3.0* en Google Earth Engine sobre **Sentinel-2 (10 m)**: **51.655 espejos de agua $\ge 0,3\text{ ha}$** (87,64 % entre 0,3 y 5 ha).
- **Umbrales y transparencia:** 6 bandas explícitas (*Muito Crítica* 0–10 %, *Crítica* 10,1–30 %, *Alerta* 30,1–50 %, *Confortável* 50,1–70 %, *Muito Confortável* 70,1–100 %, *Vertendo* > 100 %) e impresión individual de la **fecha de última lectura** cuando una estación está rezagada.

### 2.2. MapBiomas Água y MapBiomas Chaco
- **Fuente:** `https://plataforma.agua.mapbiomas.org/` y `https://chaco.mapbiomas.org/`.
- **Metodología verificada (ATBD Col. 4 / Col. 5):** Serie 1985–2025 sobre Landsat (30 m) usando el **Clasificador Subpíxel de Superficie de Agua (SWSC)** con Análisis de Mezcla Espectral y lógica difusa (probabilidad > 0,67 agua; < 0,35 descarte sombra), segmentación **SNIC** y **Random Forest** para separar cuerpos naturales de reservorios; en Col. 4 incorporó fusión **Sentinel-1 (SAR) + Sentinel-2 (10 m)** para cambios recientes.
- **Limitación crítica en el Chaco:** MapBiomas Chaco 30 m agrupa una sola clase de agua (ID 26) sin desagregar micro-atajaderos y sufre omisiones bajo vegetación herbácea, dosel ribereño y aguas con alta carga sedimentaria.

### 2.3. AESA Paraíba — Volume dos Açudes (Brasil)
- **Fuente:** `https://www.aesa.pb.gov.br/volume-dos-acudes/` (Informe PROGESTÃO 2025).
- **Monitoreo híbrido de 3 niveles:** 136 açudes medidos en escalas (*réguas linimétricas*), 63 sitios semiautomáticos (*HidroObserva* vía GPRS) y 5 PCDs automáticas en el eje PISF.
- **Gobernanza:** 6 bandas (*Crítica* < 10 %, *Atenção* 10,1–20 %, *Observação* 20,1–50 %, *Normalidade* 50,1–70 %, *Favorável* 70,1–100 %, *Vertendo* > 100 %) que sustentan la **Alocação Negociada de Água** con Comités de Cuenca y derecho de defensa administrativo (*Portaria AESA DP N° 005/2026*).

### 2.4. QField / QFieldCloud + QGIS + PostGIS
- **Fuente:** `https://qfield.org/` (`docs.qfield.org`).
- **Patrón de campo *offline-first*:** Modelo relacional **1:N** (`activo` $\rightarrow$ `inspecciones`) usando **UUID v4 inmutable** (abandonando enteros auto-incrementales `fid` que colisionan offline), política de conflictos **Manual** (nunca *Last Wins*), restricciones duras de formulario (*Constraints*) y cámara interna con metadatos EXIF + sellado de evidencia.

---

## 3. Evidencia Hidrológica (Ceará, Uruguay, Australia), Inspección Visual (FAO/FHWA) y Teledetección SAR

- **Conectividad y Rotura en Cascada (UFC/FUNCEME Ceará):** En la cuenca del embalse Orós (4.717 reservorios, modelo *ResNetM*), la **topología de la red** resultó el factor dominante de conectividad ($SI = 1,07$). En la cuenca del río Nogueira (modelo HEC-HMS/HEC-RAS, octubre 2025), crecidas extremas activaron **roturas en cascada** (colapsando 13 de 15 presas sin vertedero) y movilizando **152.043 toneladas de sedimento** —**13,3 veces la producción natural de toda la cuenca**—, pulso que en la llanura formoseña colmataría riachos y alcantarillas viales.
- **Uruguay (DINAGUA — Decreto N° 123/999):** Clasifica tajamares y represas por altura ($H$), área de cuenca ($A$) y volumen ($V$), aplicando multas más severas cuando hay perjuicio a terceros y otorgando vista previa obligatoria de 10 días.
- **Australia (DEA Waterbodies & AusDams — Murray-Darling Basin):** DEA Waterbodies monitorea $>300.000$ cuerpos ($\ge 2.700\text{ m}^2$) con código espacial `geohash`; *AusDams* (CNN) halló 1,765 millones de *farm dams* (11,5 % ausentes en mapas oficiales), interceptando hasta **30 % de la escorrentía neta** en estiaje.
- **5 Patologías Visuales de Terreno (FAO Paper 64 / ASDSO / Manual FHWA):** (1) Cierre total sin vertedero ni descarga mínima, (2) Riesgo de sobrepaso / pérdida de borde libre (~40 % de fallas en presas de tierra), (3) Tubificación / filtración turbia (*piping*) o remolino, (4) Grietas transversales, deslizamientos, árboles/raíces o madrigueras, y (5) Obstrucción de alcantarilla vial conexa (efecto dique).
- **Teledetección Óptica vs. Radar SAR en El Niño:** Según Tarpanelli et al. (2022, NHESS), la nubosidad bloquea el 72 % de las inundaciones para **Sentinel-2 óptico** (solo 28 % observables) frente a 58 % con **Sentinel-1 SAR Banda C** (constelación dual **1C/1D** con revisita de 6 días abierta al público desde abril de 2026). Para penetrar selvas en galería ribereñas donde Banda C no llega, se suma **Banda L** con **SAOCOM 1A/1B (CONAE)** y **NISAR (NASA–ISRO, colecciones validadas abiertas en noviembre de 2026)**. Aun así (UN-SPIDER 2024), el satélite delimita superficie pero no profundidad ni estabilidad geotécnica.

---

## 4. Hoja de Ruta de Continuidad (3 Fases) y Transferencia al Prototipo
1. **Fase 1 (0–3 meses — Piloto pre-El Niño):** Corredores críticos Monte Lindo (Laguna Gallo / Colonia Pastoril) y El Porteño–He-Hé (cruces RP 23, 24, 26, 28 y RN 86/11) validando nuestro prototipo PostGIS + QField/Kobo con cuadrillas UPCA–DPV–MPyA.
2. **Fase 2 (3–9 meses — Estandarización y Convenios):** Protocolo fotográfico `SHA-256`, convenios UPCA–CONAE (SAOCOM emergencias) y reconversión productiva con INTA (represas fuera de cauce con piletas de decantación).
3. **Fase 3 (9–18 meses — Escalamiento y Gobernanza Participativa):** Extensión a Pilagá, Salado y Timbó Porá + visor agregado del *Sistema de Información Hídrica Provincial* (Decreto N° 1.228/04) articulado con Mesas de Agua locales (modelo *Alocação Negociada* de AESA).
