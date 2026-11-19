# Especificación Modular: [Nombre del Módulo]

- **Módulo:** `[identificador_modulo]`
- **GitHub Issue Principal:** `#XX`
- **Estado:** `Borrador` | `Aprobado` | `En Implementación` | `Cerrado`
- **Última Actualización:** 2026-11-18

---

## 1. Alcance y Propósito del Módulo
Descripción de las responsabilidades funcionales y de negocio que cubre este módulo dentro de **Atajaderos Formosa (AI LAB · Equipo 6)**.

---

## 2. Requerimientos Funcionales (EARS)
- **RF-[MOD]-01:** Descripción clara y no ambigua del requerimiento.
- **RF-[MOD]-02:** Descripción clara y no ambigua del requerimiento.

---

## 3. Criterios de Aceptación (Gherkin)

```gherkin
Escenario: [Nombre descriptivo del escenario principal]
  Dado [contexto inicial o estado del sistema]
  Cuando [acción que realiza el usuario o el sistema]
  Entonces [resultado observable y verificable]

Escenario: [Caso de error o entrada inválida]
  Dado [contexto inicial con datos inválidos]
  Cuando [el usuario intenta realizar la acción]
  Entonces [el backend responde 422/400 con detalle claro y la interfaz permanece estable]
```

---

## 4. Modelo de Datos y Entidades (PostgreSQL 18 / PostGIS 3.7 · SQLAlchemy 2 + Alembic)
- **Tablas Afectadas:** `nombre_tabla`
- **Campos Clave y Tipos:**
  - `id`: integer / string PK
  - `campo_ejemplo`: string, indexado
- **Relaciones:** `ForeignKey` / `relationship` hacia otras entidades.

---

## 5. Contrato REST (FastAPI) y Componentes React/TypeScript
- **Endpoints (`apps/backend/app/api/routes/`):**
  - `POST /api/modulo/...` ➔ schema Pydantic `ModuloCreate` / `ModuloResponse`
- **Páginas y Componentes UI (`apps/frontend/src/`):**
  - Página: `src/pages/ModuloPage.tsx`
  - Componentes: `src/components/Modulo...tsx`
- **Autorización:** Dependencia FastAPI `get_current_user` + validación de `UserRole`.
- **Cumplimiento AI LAB:**
  - Categoría de datos visible (`OBSERVADO` / `REFERENCIA` / `SIMULADO`).
  - Leyenda obligatoria `<PrototypeBanner />` visible y decisión operativa bajo responsabilidad humana.

---

## 6. Subtareas Técnicas Atómicas (GitHub Issues)
- [ ] `#XX` / `T1`: [Descripción atómica] — Cubre: `RF-[MOD]-01`
- [ ] `#YY` / `T2`: [Descripción atómica] — Cubre: `RF-[MOD]-02`
