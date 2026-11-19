# Especificación Modular 04: Entrega Final, Ficha Técnica, Video 120 s, Speech 3 min y Póster

- **Módulo:** `04_entrega_speech_poster`
- **Responsables:** Fabrizio Facundo Ginéz *(Producto, Póster, Video y Pitch)* y Antonio Gabriel Pineda *(QA, Repo, Docker y Documentación)*
- **Contratos Obligatorios:** Leer únicamente `docs/specs/00_CORE_CONTRACTS.md`, `docs/03_antecedentes_y_soluciones_comparadas.md` y este archivo.
- **Estado:** `En Implementación`
- **Última Actualización:** 2026-11-19

---

## 1. Alcance y Propósito del Módulo
Garantizar el cumplimiento del 100 % de los entregables evaluables para el **viernes 20/11 a las 18:00 h** y la defensa presencial del **sábado 21/11** ante la mesa evaluadora (100 pts de la rúbrica):
1. **Documentación Oficial del Kit:** `docs/ficha_tecnica.md` (1 página), `docs/ficha_fuentes.md` (trazabilidad de cada cifra/capa) y `README.md` verificado desde **clonado limpio**.
2. **Guion de Video Demo (MP4 $\le 120$ segundos, pantalla + voz + copia local).**
3. **Estructura del Discurso / Pitch de 3 minutos** y **Diseño del Póster Técnico** del sábado 21/11.

---

## 2. Requerimientos Funcionales y de Entregables (EARS)
- **RF-ENT-01 (Ficha Técnica de 1 Página):** Completar `docs/ficha_tecnica.md` detallando problema, usuario, arquitectura Docker (FastAPI + React/Bun + PostGIS), límites de responsabilidad, criterios escritos y verificación de clonado limpio.
- **RF-ENT-02 (Ficha de Fuentes Completa):** Asegurar que toda cifra, umbral, normativa o capa visible en pantalla, póster o pitch figure en `docs/ficha_fuentes.md` con su categoría (`OBSERVADO` / `REFERENCIA` / `SIMULADO`) y fecha de consulta.
- **RF-ENT-03 (Guion del Video Demo $\le 120$ s):** Redactar en `docs/guion_video_y_pitch.md` el guion segundo a segundo:
  - `0:00–0:20`: Problema real en Formosa (La Niña vs. El Niño, bloqueos en riachos y rutas).
  - `0:20–0:45`: Mapa Leaflet real de Formosa, corredores fluviales, filtros El Niño, etiquetas `SIMULADO`/`REFERENCIA`/`OBSERVADO` y fecha de última inspección (inspiración Ceará/AESA).
  - `0:45–1:15`: Simulación de aviso vecinal en `ATJ-FSA-0006` (A° Tatú Piré / Monte Lindo): uso del Copiloto IA HITL para estructurar nota de campo, confirmación humana en el formulario con checklist FAO/FHWA y carga de foto sellada con `SHA-256`.
  - `1:15–1:35`: Demostración de rigor: rechazo de entrada inválida (`HTTP 422`) + exportación GeoJSON compatible con QGIS/QField.
  - `1:35–2:00`: Límites honestos (Decreto-Ley N° 971/1980, no reemplaza visita presencial) y cierre con leyenda obligatoria.
- **RF-ENT-04 (Esquema del Speech de 3 Minutos y Póster del Sábado 21/11):** Estructurar ambos materiales en `docs/guion_video_y_pitch.md` cubriendo los 5 criterios de la rúbrica:
  1. *Utilidad para decidir (30 pts)*
  2. *Rigor técnico y legal (25 pts)*
  3. *Honestidad frente a incertidumbre e IA (15 pts)*
  4. *Continuidad PostGIS + QGIS/QField + Hoja de ruta 3 fases (15 pts)*
  5. *Equipo y comunicación (15 pts)*
- **RF-ENT-05 (Validación de Clonado Limpio):** Confirmar que `git clone` + `docker compose up --build` + `alembic upgrade head` + `seed_demo` + `pytest` + `bun run build` funcionan sin intervención manual externa.

---

## 3. Archivos del Perímetro de Implementación
- `docs/ficha_tecnica.md`
- `docs/ficha_fuentes.md`
- `docs/guion_video_y_pitch.md`
- `docs/changelog.md`
- `README.md`
