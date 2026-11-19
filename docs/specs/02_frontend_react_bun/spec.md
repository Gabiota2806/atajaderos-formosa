# Especificación Modular 02: Frontend React/Bun, Mapa Leaflet Real y Flujo Operativo

- **Módulo:** `02_frontend_react_bun`
- **Responsable:** Matías Daniel Núñez *(Frontend React + Bun + Vite + TypeScript + Mapa Leaflet)*
- **Contratos Obligatorios:** Leer únicamente `docs/specs/00_CORE_CONTRACTS.md` y este archivo. **NO** indexar `apps/backend/`.
- **Estado:** `Borrador`
- **Última Actualización:** 2026-11-19

---

## 1. Alcance y Propósito del Módulo
Construir la interfaz operativa completa en **React 18 + Bun + Vite 6 + TypeScript estricto + Tailwind CSS v4 + Leaflet + `@heroicons/react`** (0 emojis en UI) consumiendo exclusivamente los endpoints del contrato `00_CORE_CONTRACTS.md`:
1. **Tablero y Mapa Real de Formosa (Leaflet):** Cartografía real interactiva de la provincia de Formosa (OpenStreetMap/IGN `REFERENCIA` + Vista Satelital Esri/Sentinel-2 `OBSERVADO`) con trazas GeoJSON de los 4 corredores de riachos críticos y marcadores con semáforo de escurrimiento.
2. **Padrón Trazable con `fecha_ultima_inspeccion`:** Filtros por corredor/riacho, estado, interrupción de escurrimiento y emplazamiento, KPIs superiores y botones de descarga GeoJSON (QField/QGIS) e importación KoboToolbox.
3. **Modales Operativos y Ruta Pública `/reportar`:** Alta de atajadero, Ficha Maestra Inmutable + Historial 1:N (*append-only*) con foto y hash `SHA-256`, Formulario de Inspección con checklist visual de 5 patologías FAO/FHWA, Panel Copiloto IA *Human-in-the-Loop* y vista pública móvil offline `/reportar`.

> **Autonomía de Diseño UI y Estilos:** El responsable de Frontend (**Matías Daniel Núñez**) y su agente tienen **libertad total sobre la estética visual** (paleta de colores, tema claro/oscuro, tipografía, espaciado, diseño de tarjetas, navegación y fidelidad a sus propios mockups). Las especificaciones de este documento regulan únicamente el **contrato funcional, los campos/enums, la responsividad *Mobile-First*, la iconografía SVG (`@heroicons/react`), las etiquetas `OBSERVADO`/`REFERENCIA`/`SIMULADO`, el `<PrototypeBanner />` y la confirmación humana en IA**.

---

## 2. Requerimientos Funcionales (EARS)
- **RF-FE-01 (Espejo de Tipos y Cliente API):** Definir en `apps/frontend/src/types/index.ts` todas las interfaces y uniones espejo de `00_CORE_CONTRACTS.md`, y centralizar llamadas `fetch` con Bearer JWT y manejo de errores `401`/`422` en `apps/frontend/src/lib/api.ts`.
- **RF-FE-02 (Mapa Real Leaflet de Formosa):** Implementar `src/components/MapaAtajaderos.tsx` centrado en Formosa (`[-24.85, -60.05]`, zoom `7`) con `LayersControl` que permite alternar entre:
  - *Mapa Vial/Topográfico (OSM / IGN)* — rotulado `REFERENCIA`.
  - *Imagen Satelital Óptica (Esri World Imagery / Sentinel-2)* — rotulado `OBSERVADO / REFERENCIA`.
  - Superposición de trazas GeoJSON de los 4 corredores reales (`src/data/riachosFormosaGeoJson.ts`, rotulado `REFERENCIA`).
  - Marcadores interactivos por atajadero coloreados por `interrumpe_escurrimiento` (`si` rojo, `a_verificar` ámbar, `no` verde) con popup informativo y botón "Ver Ficha e Historial".
- **RF-FE-03 (Tablero de Triage y Transparencia Temporal):** En `src/pages/DashboardPage.tsx`, mostrar `<PrototypeBanner />`, 4 tarjetas KPI, filtros reactivos, etiquetas de categoría (`SIMULADO`, `OBSERVADO`, `REFERENCIA`) y tabla con columna explícita **Última Inspección** (alertando `SIN LECTURA` si es `null` o `Lectura rezagada` si supera 14 días).
- **RF-FE-04 (Ficha 1:N y Formulario de Inspección con Checklist FAO/FHWA):**
  - `src/components/DetalleAtajaderoModal.tsx`: muestra el `codigo_unico` inmutable, `tipo_emplazamiento` (encuadre Ley 1.246 / 1.314), criterio técnico escrito y la línea de tiempo 1:N con fotografías bajo `/uploads/...` y su hash `SHA-256`.
  - `src/components/FormularioInspeccionModal.tsx`: despliega en vivo la definición escrita del `estado_observado` elegido, presenta los 5 chips/checkboxes del checklist FAO/ASDSO/FHWA, soporta adjunto fotográfico y muestra errores de validación `HTTP 422` sin perder los datos cargados.
- **RF-FE-05 (Interoperabilidad QField/Kobo y Copiloto IA HITL):**
  - `src/components/ImportarKoboModal.tsx`: permite pegar o cargar un archivo JSON de relevamiento offline y ejecutar `POST /api/atajaderos/importar-kobo`, además de un botón en el tablero que descarga `GET /api/atajaderos/geojson`.
  - `src/components/CopilotoIaPanel.tsx`: implementa Modo 1 (Estructurar nota cruda de campo con botón explícito **«Confirmación Humana: Aplicar Borrador al Formulario»**) y Modo 2 (Síntesis de Triage de Mesa), mostrando siempre el aviso de límite de responsabilidad y el badge `ia_asistida` vs `deterministico_offline`.
- **RF-FE-06 (Estados UI e Iconografía):** Todas las vistas gestionan estado de carga, estado vacío y errores recuperables; uso exclusivo de `@heroicons/react` (0 emojis).
- **RF-FE-07 (Diseño 100 % Responsive Mobile-First en TODAS las Vistas + Ruta Pública `/reportar` con Cola Offline Auto-Sync):**
  - **Todas las pantallas** (`/`, `/login`, `/reportar`, `/dashboard`, mapa Leaflet, KPIs, listado, modales de detalle/inspección/alta/importación y panel del Copiloto IA) DEBEN adaptarse limpiamente a **móvil (`360px–640px`), tablet (`768px`) y escritorio ($\ge 1280\text{ px}$)** sin desbordamiento horizontal (`overflow-x-hidden`), con apilamiento vertical en móvil (mapa arriba con altura controlada `h-[380px] sm:h-[460px] lg:h-[540px]`, tarjetas/lista táctil debajo, modales `w-full max-h-[92vh] overflow-y-auto` y áreas táctiles $\ge 44\text{ px}$).
  - **Versión Web Móvil Instalable (sin APK nativo):** Incluir `public/manifest.webmanifest` enlazado desde `index.html` con metadatos móviles (`theme-color`, `viewport`) para poder añadir la web a la pantalla de inicio en Android/iOS.
  - **Ruta Pública `/reportar` («Aviso Vecinal / Posible Bloqueo», Forma B):** Accesible sin login desde `/` y `/login`, con `<PrototypeBanner />`, captura de GPS (`navigator.geolocation`), selección táctil de punto en el mapa Leaflet real de Formosa y cámara trasera móvil (`<input type="file" accept="image/*" capture="environment">`).
  - **Cola Offline en `localStorage` con Envío Automático al Reconectarse:** Si el usuario envía un aviso en `/reportar` estando sin conexión (`!navigator.onLine` o fallo de red), el formulario se almacena en `localStorage` (`atajaderos_avisos_offline`) mostrando un indicador claro de avisos pendientes. Al recuperarse la conexión (evento `window.addEventListener("online")` o pulsando «Sincronizar pendientes ahora»), los avisos en cola se despachan automáticamente contra `POST /api/avisos` mostrando los `codigo_unico` confirmados.

---

## 3. Criterios de Aceptación (Gherkin)

```gherkin
Escenario: Aviso vecinal offline en móvil (/reportar) con reenvío automático al reconectarse
  Dado un ciudadano en /reportar desde un viewport móvil (390x844) sin conexión a internet
  Cuando completa las coordenadas en Formosa y pulsa "Enviar Aviso"
  Entonces el aviso se guarda en localStorage mostrando "1 aviso pendiente de envío (sin conexión)" sin perder los datos
  Y al recuperarse la conectividad (evento online) el aviso se despacha automáticamente a POST /api/avisos creando un registro "sin_validar"

Escenario: Consulta de mapa real de Formosa y filtrado por bloqueos El Niño
  Dado que el usuario inicia sesión en /login con referente@atajaderos.ar
  Cuando accede al Dashboard y filtra por interrumpe_escurrimiento = "si"
  Entonces el mapa Leaflet real de Formosa muestra únicamente los marcadores rojos activos sobre los corredores fluviales
  Y la tabla exhibe el codigo_unico, la categoría "SIMULADO" y la fecha de última inspección

Escenario: Aplicación controlada de borrador del Copiloto IA (Human-in-the-Loop)
  Dado un inspector en el Formulario de Inspección que escribe un relato libre y consulta al Copiloto IA
  Cuando recibe el borrador sugerido con patologías FAO/FHWA
  Entonces el sistema NO guarda nada en la base de datos hasta que el inspector pulsa "Aplicar Borrador al Formulario" y luego confirma manualmente el guardado
```

---

## 4. Archivos del Perímetro de Implementación
- `apps/frontend/public/manifest.webmanifest` y `apps/frontend/index.html`
- `apps/frontend/src/types/index.ts`
- `apps/frontend/src/lib/api.ts` y `apps/frontend/src/lib/offlineQueue.ts`
- `apps/frontend/src/components/MapaAtajaderos.tsx`
- `apps/frontend/src/components/FormularioAtajaderoModal.tsx`
- `apps/frontend/src/components/DetalleAtajaderoModal.tsx`
- `apps/frontend/src/components/FormularioInspeccionModal.tsx`
- `apps/frontend/src/components/CopilotoIaPanel.tsx`
- `apps/frontend/src/components/ImportarKoboModal.tsx`
- `apps/frontend/src/pages/ReportarAvisoPage.tsx` (ruta pública `/reportar`)
- `apps/frontend/src/pages/DashboardPage.tsx` y `apps/frontend/src/App.tsx`

---

## 5. Verificación Obligatoria en Docker
1. `docker compose exec frontend bun run build` (`tsc --noEmit && vite build` sin errores)
2. Verificar ausencia total de emojis en `apps/frontend/src/` y presencia de `<PrototypeBanner />` en todas las páginas.
3. Smoke test en `http://localhost:5173` sin errores en consola del navegador.
