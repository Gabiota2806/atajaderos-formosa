---
name: regla-auditoria-codigo
description: Regla de cumplimiento obligatorio para la auditoría y revisión rigurosa de código y Pull Requests del Equipo 6 antes de mergear a develop.
trigger: always_on
---

# Regla de Cumplimiento: Metodología de Auditoría y Control de Calidad de Código

Esta regla rige cada vez que se invoque el Slash Command `/auditoria` o se soliciten revisiones de código de compañeros (**Enrique Maximiliano González, Matías Daniel Núñez, Facundo Joaquín Leiva, Fabrizio Facundo Ginéz**) o auto-auditorías previas a la fusión:

1. **POSICIONAMIENTO EN LA RAMA Y SINCRONIZACIÓN**:
   - Al recibir el número de Issue (`#N`), PR o rama a auditar, sincronizar y hacer checkout:
     ```bash
     git fetch origin
     git checkout <rama>
     git pull origin <rama>
     ```
   - Consultar el GitHub Issue (`gh issue view <num>`) para identificar responsable y alcance.

2. **AUDITORÍA DE TESTS, LINTER Y BUILD (100 % DOCKER)**:
   - Backend tests: `docker compose exec backend uv run --no-sync pytest`.
   - Backend estilo: `docker compose exec backend uv run --no-sync ruff check .` y `ruff format --check .`.
   - Frontend build & tipos: `docker compose exec frontend bun run build`.
   - **BLOQUEO INMEDIATO**: Si algún test, linter o build falla, la auditoría se detiene con `VEREDICTO: CAMBIOS NECESARIOS`.

3. **INSPECCIÓN PROFUNDA DE CÓDIGO (GIT DIFF)**:
   - Comparar cambios frente a `develop`: `git diff origin/develop...HEAD`.
   - **Criterios de Inspección**:
     1. **Concordancia con Issue y Spec Modular**: ¿Cumple los RF y criterios Gherkin?
     2. **Convenciones de Código y Arquitectura**: Tipado estricto Python/TypeScript, `StrEnum`, Pydantic v2, prevención de N+1 en SQLAlchemy y validación de permisos/entradas inválidas.
     3. **Reglas AI LAB**: Leyenda `<PrototypeBanner />` visible, categorías `OBSERVADO`/`REFERENCIA`/`SIMULADO`, `codigo_unico` inmutable, prueba de entrada inválida y confirmación humana en IA.
     4. **Estándar de Iconografía**: Prohibición absoluta de emojis en componentes React/TS. Uso exclusivo de SVGs `@heroicons/react`.

4. **SMOKE TESTING Y VERIFICACIÓN VISUAL**:
   - Si la PR incluye cambios visuales, verificar en `http://localhost:5173` (consola JS y logs de `backend` limpios).

5. **EMISIÓN DEL VEREDICTO FORMAL**:
   Encabezar obligatoriamente el informe con:
   - **`VEREDICTO: APROBADO`**
   - **`VEREDICTO: CAMBIOS NECESARIOS`** (listando `archivo:línea`, defecto y corrección requerida).

6. **FUSIÓN ASISTIDA CON CONFIRMACIÓN HUMANA (DOBLE VERIFICACIÓN)**:
   - **GUARDIA BLOQUEANTE**: Aunque el veredicto sea `APROBADO`, **NUNCA fusionar automáticamente**.
   - Solicitar confirmación y "OK" explícito del desarrollador antes de ejecutar `gh pr merge <id> --merge` y limpiar ramas.
