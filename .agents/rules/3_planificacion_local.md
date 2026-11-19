---
name: regla-planificacion-local
description: Regla de cumplimiento obligatorio para la planificación ágil con GitHub Issues y Specs SDD.
trigger: always_on
---

# Regla de Cumplimiento: Metodología de Planificación (GitHub Issues & SDD)

Esta regla rige cada vez que se solicite planificar o crear tareas en **Atajaderos Formosa (AI LAB · Equipo 6)**:

1. **ACTIVACIÓN HÍBRIDA Y ENTREVISTA INTERACTIVA (`/planificacion`)**:
   - Puede invocarse vía `/planificacion <descripción>` o `/planificacion` sin argumentos (activando `ask_question`).
   - Si existen dudas de diseño, flujo o arquitectura, activar `/grill-me` usando `ask_question` punto por punto.

2. **PRESENTACIÓN DEL BORRADOR COMPLETO**:
   - Presentar en el chat:
     * **Historia / Módulo:** narrativa de negocio ("Como... quiero... para..."), criterios de aceptación Gherkin y cumplimiento AI LAB.
     * **GitHub Issues atómicos:** título, labels sugeridos, responsable del Equipo 6, archivos afectados y criterio "Hecho cuando...".
     * **Decisión SDD:** si requiere especificación técnica en `docs/specs/<modulo>/spec.md`.

3. **BLOQUEO ABSOLUTO DE CREACIÓN SIN "OK"**:
   - **REGLA ABSOLUTA:** NUNCA crear GitHub Issues (`gh issue create`) ni escribir archivos en `docs/specs/` o `docs/02_backlog.md` sin el **"OK"** explícito del desarrollador en el chat.

4. **REGISTRO EN GITHUB ISSUES Y SPEC SDD**:
   - Tras el "OK":
     * Crear los Issues en GitHub con `gh issue create` (o MCP GitHub).
     * Generar o actualizar `docs/specs/<modulo>/spec.md` siguiendo `docs/specs/template_module_spec.md`.
     * Entregar los enlaces a los Issues creados y el comando listo para comenzar (`/desarrollo-tarea #<num> local`).
