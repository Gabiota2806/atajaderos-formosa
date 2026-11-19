---
name: regla-edicion-metodologias
description: Regla de cumplimiento obligatorio para la edición y evolución segura de reglas y skills en .agents/.
trigger: always_on
---

# Regla de Cumplimiento: Edición y Evolución de Metodologías Internas

Esta regla rige cada vez que se solicite modificar o refinar reglas y skills en `.agents/`:

1. **BLOQUEO ABSOLUTO DE MODIFICACIÓN DIRECTA**:
   - NUNCA edites archivos en `.agents/rules/` ni `.agents/skills/` de forma silenciosa o directa.

2. **PROPUESTA TÉCNICA "ANTES VS. DESPUÉS"**:
   - Presenta en el chat un cuadro comparativo detallado:
     * Regla o Skill afectada.
     * Texto actual vs. nuevo texto propuesto.
     * Justificación técnica del ajuste.
     * Análisis de impacto cruzado en otras reglas.

3. **PAUSA OBLIGATORIA DE APROBACIÓN**:
   - Esperar el "OK" explícito del desarrollador antes de tocar cualquier archivo en `.agents/`.
