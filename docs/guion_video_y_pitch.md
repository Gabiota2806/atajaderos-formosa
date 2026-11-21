# Guion de Video Demo (≤ 120 s), Speech de 3 Minutos y Diseño del Póster Técnico

> **PROTOTIPO · AI LAB Misión: Código Formosa · no es una herramienta oficial**

- **Herramienta:** Atajaderos Formosa — Operación Agua (`v1.0.0`)
- **Desafío:** Desafío 1 · Atajaderos (Juegos Provinciales Tecnológicos 2026 — AI LAB Misión: Código Formosa)
- **Equipo 6 — Los Más Experimentados (UTN Extensión Áulica Formosa):**
  - **Fabrizio Facundo Ginéz** *(Producto, narrativa, póster técnico, video demo y pitch)*
  - **Antonio Gabriel Pineda** *(Infraestructura Docker, contratos SDD, seed demo, QA integral y documentación)*
  - **Enrique Maximiliano González** *(Arquitectura, modelos PostGIS/Alembic y API REST FastAPI)*
  - **Matías Daniel Núñez** *(Frontend React/Bun, identidad cartográfica, mapa Leaflet, `/reportar` offline y modales)*
  - **Facundo Joaquín Leiva** *(Datos, fuentes, GeoAI y Copiloto IA Human-in-the-Loop)*
- **Docente referente UTN:** Lautaro Rolón
- **Repositorio y versión evaluable:** https://github.com/Gabiota2806/atajaderos-formosa (tag `v1.0.0` en rama `main`)

---

## 1. Guion del Video Demo (`RF-ENT-03` · MP4 ≤ 120 segundos)

### 1.1. Guion Segundo a Segundo (Pantalla Real + Voz en Off)

| Tramo | Pantalla / Acción en vivo (`http://localhost:5173`) | Locución (Voz en off) | Evidencia evaluable |
| :--- | :--- | :--- | :--- |
| **0:00–0:20**<br>*(20 s)* | **Portada `/` y contexto territorial.**<br>Mostrar `<PrototypeBanner />` visible en la parte superior. Hacer clic en **Ingresar al tablero** (`/login`) e iniciar sesión con `referente@atajaderos.ar` (clave `password`). | «Formosa es una planicie aluvial con pendiente mínima menor a medio metro por kilómetro: en años secos faltan reservas, pero bajo el fenómeno El Niño un terraplén transversal o una alcantarilla tapada desvían el agua decenas de kilómetros —como ocurrió en 1997, 1998 y 2016 sobre un 22 % de la provincia, o en temporales de 310 a 400 milímetros en mayo de 2025—. Presentamos **Atajaderos Formosa — Operación Agua**, un prototipo del Equipo 6 de UTN Formosa para inventariar atajaderos y priorizar los que interrumpen el escurrimiento.» | Leyenda oficial obligatoria visible desde el segundo 0; planteo claro del problema real (La Niña vs. El Niño, Monte Lindo/Laguna Gallo 2016 y alertas DPV en RN 11 y RN 95). |
| **0:20–0:45**<br>*(25 s)* | **Tablero `/dashboard` y mapa real de Formosa.**<br>Mostrar el mapa Leaflet recortado a Formosa con capas WFS oficiales del IGN (`REFERENCIA`: provincia, 9 departamentos con foco de departamento e hidrografía perenne e intermitente) y las 5 trazas de corredores críticos; alternar brevemente a capa satelital Esri (`OBSERVADO / REFERENCIA`), desplegar el panel tipo cortina y filtrar por **`interrumpe_escurrimiento = si`**. Señalar la columna **Última inspección** (`> 14 días` rezagado) y las etiquetas `SIMULADO / REFERENCIA / OBSERVADO`. | «En el tablero principal trabajamos sobre un mapa real de Formosa con límites departamentales e hidrografía oficial del IGN como `REFERENCIA`, más mosaico satelital Esri y los corredores críticos: El Porteño–He-Hé, Monte Lindo, Pilagá y Bañado La Estrella–Salado. Cada punto lleva código único inmutable, badge `SIMULADO` para el dataset demo, filtro prioritario para El Niño —¿interrumpe el escurrimiento?— y la fecha de última inspección con alerta de rezago mayor a 14 días, inspirada en Ceará y AESA.» | Mapa Leaflet real con capas IGN + Esri; control por departamento (`AvisoDepartamento`); 4 KPIs; filtros El Niño; taxonomía explícita `SIMULADO / REFERENCIA / OBSERVADO`. |
| **0:45–1:15**<br>*(30 s)* | **Flujo de aviso vecinal y validación en `ATJ-FSA-0006`.**<br>Mostrar brevemente la ruta pública `/reportar` (sin login, GPS/mapa y cola offline en `localStorage`). Luego volver al tablero autenticado como `inspector@atajaderos.ar`, abrir **`ATJ-FSA-0006`** (Pozo del Tigre / A° Tatú Piré, cuenca Monte Lindo, en estado `sin_validar`), abrir el **Copiloto IA HITL** (Modo 1 `estructurar_nota_campo`) con nota cruda de campo, pulsar el botón de **confirmación humana** para volcar el borrador, revisar criterios escritos desplegados y checklist FAO/ASDSO/FHWA, adjuntar foto y guardar inspección 1:N. | «Un vecino puede reportar un posible bloqueo desde `/reportar` incluso sin señal: el aviso queda en cola local y al enviarse al backend se fuerza a `sin_validar` y `a_verificar`. En `ATJ-FSA-0006` sobre el arroyo Tatú Piré, el inspector usa el Copiloto IA en modo solo lectura —con fallback determinístico offline automático— para estructurar su nota cruda de campo. La IA sugiere, pero exige confirmación humana explícita; al guardar con checklist FAO y FHWA, la foto queda sellada con hash `SHA-256` en un historial 1:N *append-only*.» | Flujo completo `/reportar` offline-first + `ATJ-FSA-0006` + Copiloto IA HITL con confirmación humana obligatoria + criterios escritos + checklist 5 patologías + evidencia `SHA-256`. |
| **1:15–1:35**<br>*(20 s)* | **Rigor técnico e interoperabilidad SIG.**<br>Intentar cargar una coordenada fuera de Formosa (ej. latitud `-34.60`) o mostrar en Swagger (`/docs`) / consola la respuesta **`HTTP 422`**; luego pulsar **Exportar GeoJSON** (`GET /api/atajaderos/geojson`) y señalar el botón de importación por lotes KoboToolbox/QField/GEE (`POST /api/atajaderos/importar-kobo`). | «El backend FastAPI sobre PostGIS rechaza con `HTTP 422` coordenadas fuera de la provincia, observaciones vacías o retrocesos prohibidos de estado, respaldado por 37 pruebas automatizadas en Docker. Además, exporta `GeoJSON` en EPSG:4326 directo para QGIS y QField e importa lotes de KoboToolbox o hipótesis satelitales externas como registros `sin_validar`.» | Prueba real de rechazo `HTTP 422`, interoperabilidad PostGIS/GeoJSON/QGIS/KoboToolbox y mención a la suite de 37 tests `pytest`. |
| **1:35–2:00**<br>*(25 s)* | **Límites honestos y cierre institucional.**<br>Mostrar ficha de `ATJ-FSA-0001` con aviso legal / encuadre normativo y cerrar enfocando la leyenda `<PrototypeBanner />`. | «Somos transparentes con los límites: este prototipo no contiene el relevamiento provincial oficial —los 10 registros demo son `SIMULADO`—, sus criterios escritos y el umbral de 14 días son preliminares para validar con UPCA, Vialidad y Producción, no usa la serie `K1` ni emite alertas hidrológicas. Bajo el Decreto-Ley 971 de 1980 y las Leyes 1.246 y 1.314, ninguna IA ni satélite reemplaza la inspección presencial ni el debido proceso humano. Prototipo AI LAB Misión: Código Formosa, no es una herramienta oficial.» | Honestidad frente a incertidumbre e IA; marco legal (Leyes 1.246, 1.314 y Decreto-Ley 971/1980); aclaración `SIMULADO` y no uso de `K1`; cierre con leyenda oficial. |

### 1.2. Checklist Operativo de Grabación y Copia Local
- **Formato del entregable:** MP4 (`H.264` + audio AAC limpio), resolución `1920×1080`, duración total **estricta ≤ 120 segundos** (objetivo recomendado: `1:52–1:57` para tener margen de seguridad).
- **Preparación previa del entorno Docker:**
  1. `docker compose up -d --build`
  2. `docker compose exec backend uv run --no-sync alembic upgrade head`
  3. `docker compose exec backend uv run --no-sync python -m app.seeds.seed_demo` (garantiza los 10 atajaderos `SIMULADO` y `ATJ-FSA-0006` limpio en `sin_validar` antes de grabar).
- **Cuentas demo para la grabación:** `referente@atajaderos.ar` y `inspector@atajaderos.ar` (contraseña `password`).
- **Reglas visuales durante la grabación:**
  - Mantener `<PrototypeBanner />` visible en toda toma (no recortar la barra superior).
  - Dejar legible el rótulo `SIMULADO / DATO DE PRUEBA` en el inventario demo y el hash `SHA-256` tras subir la foto de prueba.
  - Guardar una **copia local offline del video MP4** en pendrive/disco para la defensa presencial del sábado 21/11.

---

## 2. Speech / Pitch Presencial de 3 Minutos (`RF-ENT-04` · Sábado 21/11)

### 2.1. Guion Cronometrado (5 Bloques · 180 segundos · 100 pts de Rúbrica)

| Bloque y Tiempo | Criterio de Rúbrica Cubierto | Intervención Sugerida | Texto Base del Discurso |
| :--- | :--- | :--- | :--- |
| **1. Problema real y pregunta orientadora**<br>*(0:00–0:35 · 35 s)* | **Utilidad para decidir (30 pts)** + **Equipo y comunicación (15 pts)** | **Fabrizio Ginéz** *(Producto & Narrativa)* | «Buenos días al jurado. Somos el Equipo 6 de UTN Formosa. En nuestra provincia, con pendientes menores a medio metro por kilómetro, el problema de los atajaderos no es solo almacenaje en sequía: frente a El Niño, un terraplén sobre cauce o una alcantarilla vial tapada interrumpen el escurrimiento natural y agravan inundaciones en corredores como Monte Lindo, El Porteño, He-Hé, Pilagá y Salado. Hoy la mesa interinstitucional necesita responder rápido una pregunta concreta: ¿dónde está cada obra, bajo qué criterios escritos se evaluó, cuál es su historial y si bloquea o no el escurrimiento?» |
| **2. Solución operativa y demostración de flujo**<br>*(0:35–1:15 · 40 s)* | **Utilidad para decidir (30 pts)** | **Matías Núñez / Fabrizio Ginéz** | «Construimos **Atajaderos Formosa — Operación Agua**, una aplicación web responsive dockerizada sobre FastAPI y React con PostGIS. En el mapa de Formosa con límites e hidrografía del IGN y capa satelital Esri, la mesa filtra al instante por `interrumpe_escurrimiento = si`, controla inconsistencias geométricas por departamento y detecta lecturas rezagadas de más de 14 días. Desde la ruta pública `/reportar`, un vecino puede enviar un aviso incluso sin señal desde la cola offline en `localStorage`; ese aviso ingresa siempre como `sin_validar` y `a_verificar`. Luego el inspector en terreno registra la inspección 1:N *append-only* con criterios escritos visibles, checklist de 5 patologías de FAO/ASDSO/FHWA y fotografía sellada con hash `SHA-256`, bajo un código único inmutable `ATJ-FSA-NNNN` protegido por trigger en PostgreSQL.» |
| **3. Rigor técnico, jurídico e incertidumbre / IA**<br>*(1:15–1:55 · 40 s)* | **Rigor técnico y legal (25 pts)** + **Honestidad frente a IA e incertidumbre (15 pts)** | **Maximiliano González / Facundo Leiva** | «Todo dato en pantalla se rotula explícitamente como `OBSERVADO`, `REFERENCIA` o `SIMULADO` —nuestros 10 registros demo son `SIMULADO`, no el relevamiento oficial no publicado— y las entradas fuera de rango se rechazan con `HTTP 422`, verificadas con 37 tests `pytest`. ¿Por qué nuestro modelo distingue `tipo_emplazamiento` y exige *Human-in-the-Loop*? Porque la Ley Provincial 1.246 (Art. 88) permite registrar atajaderos laterales, mientras que la Ley 1.314 (Art. 40) prohíbe obras sobre corrientes activas, y el Decreto-Ley 971/1980 exige prueba fehaciente y debido proceso. Por eso nuestro Copiloto IA —con Gemini API y fallback determinístico offline— solo estructura notas de campo o resume triage en modo solo lectura: nunca escribe en base de datos ni reemplaza al inspector presencial.» |
| **4. Continuidad e interoperabilidad SIG**<br>*(1:55–2:30 · 35 s)* | **Continuidad PostGIS + QGIS/QField + Hoja de ruta (15 pts)** | **Antonio Gabriel Pineda** | «No diseñamos un prototipo cerrado ni reinventamos herramientas que la provincia ya usa: nuestra base espacial PostGIS exporta `GeoJSON` directo para QGIS y QField e importa lotes offline desde KoboToolbox o hipótesis satelitales externas como Sentinel-2, MapBiomas o futuro radar SAR SAOCOM de CONAE. Proponemos una hoja de ruta en tres fases: primero un piloto de 4 a 8 semanas con cuadrillas de UPCA, Vialidad y Producción en Monte Lindo y El Porteño–He-Hé para validar los criterios escritos hoy preliminares; segundo, estandarización fotográfica `SHA-256` y convenios INTA/CONAE entre 3 y 9 meses; y tercero, escalamiento provincial con gobernanza participativa en 9 a 18 meses.» |
| **5. Cierre honesto e invitación a preguntas**<br>*(2:30–3:00 · 30 s)* | **Honestidad (15 pts)** + **Equipo y comunicación (15 pts)** | **Fabrizio Ginéz** | «Este prototipo de código abierto arranca en cinco líneas con Docker desde clonado limpio, sin emitir alertas hidrológicas oficiales ni sustituir decisiones humanas. Organiza la trazabilidad técnica y jurídica que necesita Formosa antes de la próxima crecida de El Niño. Muchas gracias; quedamos a disposición para mostrar la demo o responder consultas.» |

### 2.2. Guía de Preguntas y Respuestas Rápidas (Defensa ante el Jurado)
1. **¿Por qué no utilizaron la serie `K1` del río Paraguay?**
   - *Respuesta:* Porque `K1` corresponde a la altura hidrométrica del río Paraguay en Puerto Formosa (otros desafíos del kit), mientras que el Desafío 1 trata sobre el inventario georreferenciado de atajaderos en riachos internos. Conforme al Documento Base v1.1 (*"K1 se audita cuando el proyecto utiliza esa serie"*), se dejó aclarado explícitamente en `docs/ficha_fuentes.md` y no se mezcló en la base del inventario.
2. **¿Qué pasa si se cae internet en el campo o falla la API de Gemini?**
   - *Respuesta:* El frontend (`/reportar`) almacena los avisos vecinales en `localStorage` y los sincroniza automáticamente al recuperar señal (`online`). En el backend, si falta `GEMINI_API_KEY` o falla la red, el Copiloto IA cambia automáticamente a `deterministico_offline` sin generar errores 500, manteniendo el flujo *Human-in-the-Loop*.
3. **¿La IA o el satélite puede multar o declarar irregular un atajadero?**
   - *Respuesta:* **No.** El satélite delimita espejos de agua con limitaciones bajo dosel o nubosidad (por eso solo ingresa hipótesis como `sin_validar` + `a_verificar`), y el Decreto-Ley N° 971/1980 exige debido proceso y constatación presencial. La herramienta solo ordena el triage y guarda evidencia fotográfica con `SHA-256`.
4. **¿Los 4 criterios de estado y el umbral de 14 días son oficiales?**
   - *Respuesta:* Son una **propuesta preliminar escrita** del equipo (inspirada en el criterio de lectura rezagada de Ceará/AESA y en manuales FAO/ASDSO/FHWA) pensada exactamente para que técnicos de UPCA, MPyA y DPV los ajusten y validen en Fase 1 antes de pasar a operación institucional.
5. **¿Cómo detectan si un registro tiene coordenadas que no coinciden con el departamento declarado?**
   - *Respuesta:* En el mapa y las fichas ejecutamos un control geométrico contra las capas oficiales de departamentos del IGN (`AvisoDepartamento`): si la coordenada cae en otro departamento, la interfaz lo advierte sin ocultar ni alterar silenciosamente el dato declarado.

---

## 3. Diseño y Maquetación del Póster Técnico (`RF-ENT-04` · Sábado 21/11)

### 3.1. Diagrama de Grilla del Póster (Formato Vertical A0/A1 o 16:9 Alta Resolución)

```text
+---------------------------------------------------------------------------------------------------+
|  ENCABEZADO                                                                                       |
|  [Banner Obligatorio]: PROTOTIPO · AI LAB Mision: Codigo Formosa · no es una herramienta oficial  |
|  Titulo: ATAJADEROS FORMOSA — OPERACION AGUA (Desafio 1 · Equipo 6 — UTN Formosa)                 |
|  Subtitulo: Inventario georreferenciado trazable, criterios escritos y triage frente a El Nino    |
+------------------------+------------------------+------------------------+------------------------+
| COLUMNA 1              | COLUMNA 2              | COLUMNA 3              | COLUMNA 4              |
| PROBLEMA Y MARCO LEGAL | ARQUITECTURA Y RIGOR   | FLUJO DE CAMPO Y HITL  | HONESTIDAD Y HOJA RUTA |
|                        |                        |                        |                        |
| - Pendiente < 0,5 m/km | - Monorepo 100% Docker | [Captura 2]:           | - Rotulado obligatorio:|
|   (planicie aluvial)   |   FastAPI + React/Bun  | Ficha 1:N append-only  |   OBSERVADO            |
| - 22% afectado en      |   + PostgreSQL 18 /    | + Checklist FAO/FHWA   |   REFERENCIA           |
|   El Nino 97/98/2016   |   PostGIS 3.7          | + Foto hash SHA-256    |   SIMULADO (10 demo)   |
| - Bloqueo riachos y    | - codigo_unico inmuta- |                        |                        |
|   alcantarillas DPV    |   ble ATJ-FSA-NNNN     | [Captura 3]:           | - Lo que NO afirma:    |
|   (RN 11 / RN 95)      |   (trigger PostgreSQL) | Copiloto IA HITL       |   no reemplaza campo,  |
| - Ley 1.246 Art. 88    | - Validacion HTTP 422  | (Gemini + fallback     |   criterios prelimi-   |
| - Ley 1.314 Art. 40    |   (37 tests pytest)    | offline, confirmacion  |   nares sin validar,   |
| - Dto-Ley 971/1980     | - Export GeoJSON QGIS  | humana obligatoria)    |   no usa serie K1      |
|                        |   + Import Kobo/GEE    |                        |                        |
| [Captura 1]:           |                        | [Captura 4]:           | - Continuidad 3 Fases: |
| Mapa Leaflet Formosa   | - Control geometrico   | Vista movil /reportar  |   1) 4-8 sem piloto    |
| IGN + Esri + filtros   |   departamentos IGN    | con cola offline en    |   2) 3-9 m protocolos  |
| interrumpe=si (>14 d)  |   (AvisoDepartamento)  | localStorage           |   3) 9-18 m provincia  |
+------------------------+------------------------+------------------------+------------------------+
|  PIE DE POSTER                                                                                    |
|  Equipo 6 (Gonzalez, Nunez, Leiva, Pineda, Ginez) · Docente: Lautaro Rolon · Tag: v1.0.0          |
|  [QR GitHub]: https://github.com/Gabiota2806/atajaderos-formosa · Licencia / Clonado limpio       |
+---------------------------------------------------------------------------------------------------+
```

### 3.2. Capturas Reales a Tomar de `http://localhost:5173` para Insertar en el Póster
Antes de exportar el póster final a PDF/PNG para impresión o proyección, tomar estas **4 capturas reales** con el sistema levantado en Docker (`seed_demo` cargado):
1. **Captura 1 (Escritorio `1440×900` — Mapa y Triage):** `/dashboard` mostrando el mapa recortado a Formosa con capas IGN (`REFERENCIA`), panel cortina desplegado, KPIs, filtro `interrumpe_escurrimiento = si`, etiqueta `SIMULADO` y columna de rezago `> 14 días`.
2. **Captura 2 (Escritorio `1440×900` — Ficha 1:N + `SHA-256`):** Modal de detalle de `ATJ-FSA-0001` o `ATJ-FSA-0006` mostrando `codigo_unico` inmutable, criterios escritos desplegados, checklist FAO/ASDSO/FHWA, aviso normativo y evidencia fotográfica con su hash `SHA-256`.
3. **Captura 3 (Escritorio `1440×900` — Copiloto IA HITL):** Panel del Copiloto IA con el modo `deterministico_offline` o `ia_asistida` activo, mostrando borrador estructurado, encuadre legal y el botón obligatorio **«Confirmación Humana: Aplicar Borrador al Formulario»**.
4. **Captura 4 (Móvil `390×844` — `/reportar` Offline-First):** Vista móvil de `/reportar` sin scroll horizontal, mostrando `<PrototypeBanner />`, selector de ubicación en mapa/GPS y el estado de cola local offline (`localStorage`).

---

## 4. Matriz de Trazabilidad con la Rúbrica (100 pts)

| Criterio de Evaluación | Puntaje | Respaldo en Video (`≤ 120 s`) | Respaldo en Speech (`3 min`) y Póster | Respaldo Verificable en el Repositorio |
| :--- | :---: | :--- | :--- | :--- |
| **1. Utilidad para decidir** | **30 pts** | `0:20–1:15`: filtros El Niño (`interrumpe_escurrimiento = si`), alerta `> 14 d` y flujo `ATJ-FSA-0006`. | Bloque 1 y 2 + Capturas 1, 2 y 4 del póster (pregunta, usuario mesa/campo y triage). | `apps/frontend/src/pages/DashboardPage.tsx`, `ReportarPage.tsx`, `apps/backend/app/api/routes/atajaderos.py`. |
| **2. Rigor técnico y legal** | **25 pts** | `0:20–0:45` y `1:15–1:35`: capas IGN `REFERENCIA`, `HTTP 422`, `SHA-256` y `codigo_unico`. | Bloque 3 + Columna 1 y 2 del póster (Leyes 1.246, 1.314, Dto-Ley 971/80, trigger PostGIS, 37 tests). | `apps/backend/alembic/versions/0002_*`, `apps/backend/tests/` (37 tests), `docs/ficha_fuentes.md`. |
| **3. Honestidad frente a incertidumbre e IA** | **15 pts** | `0:45–1:15` y `1:35–2:00`: Copiloto solo lectura HITL, `SIMULADO`, sin `K1` y límites explícitos. | Bloque 3 y 5 + Q&A + Columna 3 y 4 del póster (criterios preliminares, fallback offline). | `apps/backend/app/services/asistente_ia.py`, `docs/ficha_tecnica.md`, `AvisoDepartamento.tsx`. |
| **4. Continuidad y hoja de ruta** | **15 pts** | `1:15–1:35`: exportación `GeoJSON` EPSG:4326 e importación KoboToolbox/QField/GEE. | Bloque 4 + Columna 4 del póster (PostGIS + QGIS/QField + 3 fases 0–18 meses). | `GET /api/atajaderos/geojson`, `POST /api/atajaderos/importar-kobo`, `docs/03_antecedentes_y_soluciones_comparadas.md`, `hipotesis_satelital_gee.json`. |
| **5. Equipo y comunicación** | **15 pts** | `0:00–2:00`: guion claro ≤ 120 s, audio limpio, leyenda visible en toda pantalla. | Reparto de roles en Speech 3 min + grilla limpia del póster + QR a `v1.0.0`. | `README.md` (clonado limpio), `docs/specs/04_entrega_speech_poster/spec.md`, `docs/guion_video_y_pitch.md`. |
