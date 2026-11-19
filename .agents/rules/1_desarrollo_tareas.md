---
name: regla-desarrollo-tareas
description: Regla de cumplimiento obligatorio para el ciclo de vida de desarrollo de tareas técnicas usando GitHub Issues, SDD modular y Docker (FastAPI + React/Bun).
trigger: always_on
---

# Regla de Cumplimiento: Metodología de Desarrollo de Tareas (GitHub Issues & SDD)

Esta regla rige de forma permanente en todas las sesiones y conversaciones en **Atajaderos Formosa (AI LAB · Equipo 6)**:

1. **ACTIVACIÓN HÍBRIDA, DETECCIÓN DE MODO Y CREACIÓN DE RAMA**:
   - **Activación Híbrida (Slash Command `/desarrollo-tarea`)**:
     * **Invocación Inline**: Si el desarrollador escribe `/desarrollo-tarea #<num> <modo>` (ej. `/desarrollo-tarea #12 local`), el agente extrae los parámetros y consulta el Issue directamente.
     * **Invocación Vacía / Asistida**: Si se invoca `/desarrollo-tarea` sin argumentos, activar `ask_question` solicitando el número de **GitHub Issue (`#N`)** y el modo de trabajo (`local` o `remoto`).
   - NUNCA escribas código, modifiques archivos ni crees ramas sin antes presentar un Plan Técnico detallado en el chat.
   - **Consulta de GitHub Issue y Spec Modular SDD**:
     * Ejecuta `gh issue view <num>` para leer alcance, responsables y criterios de aceptación.
     * Consulta `docs/specs/<modulo>/spec.md` y `docs/specs/global_spec.md` para extraer Requerimientos Funcionales (RF) y escenarios Gherkin.
   - **Inspección de Estado Vivo**:
     * Inspeccionar migraciones Alembic (`apps/backend/alembic/versions/`), modelos SQLAlchemy (`apps/backend/app/models/`), schemas Pydantic (`apps/backend/app/schemas/`) y componentes React (`apps/frontend/src/`).
   - DEBES pausar y esperar el "OK" explícito del desarrollador sobre el plan antes de tocar código, **salvo en Modo Desatendido por Rol (`/goal` sobre Specs SDD ya aprobadas en `docs/specs/00_CORE_CONTRACTS.md`)**, donde el plan ya fue aprobado en la especificación.
   - Tras el "OK" (o al iniciar en modo desatendido SDD), sincroniza `develop`, crea la rama `feat/<num>-<slug>` (o `fix/<num>-<slug>`) y súbela a GitHub.

2. **TDD, SMOKE TESTING Y PRE-VERIFICACIÓN TÉCNICA EN NAVEGADOR (100 % DOCKER)**:
   - **TDD Estricto (`pytest` en Docker)**: Escribe o actualiza pruebas en `apps/backend/tests/` cubriendo flujo feliz y al menos un **caso de entrada inválida** antes o en paralelo al código de producción.
   - Ejecuta la suite dentro de Docker: `docker compose exec backend uv run --no-sync pytest` (100 % en verde).
   - Ejecuta el linter/formato backend: `docker compose exec backend uv run --no-sync ruff check .` y `ruff format --check .`.
   - Si modificaste frontend, ejecuta `docker compose exec frontend bun run build` (`tsc --noEmit && vite build`).
   - **Estándar de Iconografía**: Queda **PROHIBIDO** usar emojis de texto o caracteres tipográficos sustitutos. Utilizar exclusivamente **SVGs vectoriales** (`@heroicons/react`) con clases utilitarias (`h-4 w-4` o `h-5 w-5`).
   - **Reglas AI LAB**: Mantener `<PrototypeBanner />`, rotular categorías (`OBSERVADO`, `REFERENCIA`, `SIMULADO`) y no automatizar decisiones operativas sin confirmación humana.
   - **Pre-Verificación Técnica en Navegador**:
     * Si la tarea afecta interfaz gráfica, navegar a la pantalla en `http://localhost:5173` con `/browser` o Playwright.
     * Constatar que renderice sin HTTP 500, sin errores de consola JS y con logs de `docker compose logs backend` limpios.
   - **GUARDIA ESTRICTA DE DOBLE VERIFICACIÓN**: La pre-verificación del asistente **NUNCA** sustituye la prueba manual humana.
   - **Entrega de la Guía de QA Manual**:
     * **En Modo Local**: Apuntar a `http://localhost:5173` (y Swagger backend en `http://localhost:8000/docs`).
     * **En Modo Remoto (móvil/campo)**: Ejecutar `./scripts/tunnel.sh start 5173` y entregar la URL `https://*.trycloudflare.com`. Al finalizar QA, cerrar con `./scripts/tunnel.sh stop`.
   - **PAUSA OBLIGATORIA**: Esperar el "OK" explícito confirmando las pruebas en el navegador. **Excepción Modo Desatendido (`/goal`)**: si el desarrollador indicó ejecución autónoma sobre su módulo SDD (`00_CORE_CONTRACTS.md` + `spec.md` asignada), el agente completa TDD (`pytest`, `ruff`, `bun run build`), commitea en su rama `feat/<num>-<slug>` y deja la **PR abierta hacia `develop`**, manteniendo la **prohibición absoluta de auto-merge** para preservar la revisión y QA humana antes de fusionar.

3. **REGISTRO EN DOCUMENTACIÓN Y COMMIT (SOLO TRAS EL OK DE QA)**:
   - Marca la subtarea como completada `[x]` en `docs/specs/<modulo>/spec.md` (y en `docs/02_backlog.md` si aplica).
   - Registra la entrada en `docs/changelog.md` bajo `## [Unreleased]`.
   - Realiza el commit en español con Conventional Commits referenciando el GitHub Issue (`feat(#12): ...`, `fix(#12): ...`, `test(#12): ...`).
   - Sube la rama a GitHub (`git push -u origin <rama>`).

4. **CREACIÓN DE PULL REQUEST (PROHIBIDO AUTO-MERGE)**:
   - **PROHIBICIÓN ESTRICTA DE AUTO-MERGE**: El agente **NUNCA** fusionará automáticamente ramas hacia `develop` o `main`. La PR DEBE quedar abierta para revisión humana.
   - Ejecutar `gh pr create --base develop --head <rama>` incluyendo `Closes #<num>` en el cuerpo (o entregar enlace de comparación si falla el CLI).
