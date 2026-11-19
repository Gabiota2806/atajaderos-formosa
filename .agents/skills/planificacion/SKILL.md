---
name: planificacion
description: Guía para planificar Historias de Usuario, Specs SDD y GitHub Issues en Atajaderos Formosa. Usar ante "/planificacion" o "Modo Planificación".
---

# Skill: Planificación Ágil con GitHub Issues & SDD

1. **Recepción y Entrevista (`/grill-me`):**
   - Aceptar requerimiento inline (`/planificacion <descripción>`) o interactivo.
   - Si hay dudas de arquitectura/UX, usar `ask_question` punto por punto.
2. **Borrador Completo en Chat:**
   - Historia de Usuario + criterios Gherkin + cumplimiento AI LAB.
   - Lista de **GitHub Issues atómicos** (título, etiquetas, responsable del Equipo 6, archivos afectados y DoD).
   - Propuesta de Spec Modular en `docs/specs/<modulo>/spec.md`.
3. **PAUSA OBLIGATORIA:** NUNCA crear GitHub Issues ni archivos en `docs/specs/` sin el "OK" explícito del desarrollador.
4. **Registro tras el "OK":**
   - Crear Issues con `gh issue create`.
   - Crear/actualizar `docs/specs/<modulo>/spec.md` desde `docs/specs/template_module_spec.md`.
   - Devolver enlaces a los Issues y el comando listo (`/desarrollo-tarea #<num> local`).
