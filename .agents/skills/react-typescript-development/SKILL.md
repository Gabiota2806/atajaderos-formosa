---
name: react-typescript-development
description: Estándares para el frontend React 18 + Bun + Vite + TypeScript estricto + Tailwind CSS v4 + Leaflet + Heroicons en apps/frontend/.
---

# React + Bun + TypeScript + Leaflet (`apps/frontend/`)

## 1. Estructura y Tipado Estricto
- Páginas en `src/pages/*Page.tsx`, componentes reutilizables en `src/components/*.tsx`, cliente HTTP en `src/lib/api.ts` y contratos de datos en `src/types/index.ts`.
- Respetar `strict: true`, `noUnusedLocals: true` y `noUnusedParameters: true` en `tsconfig.json`.
- Verificar compilación y tipos dentro de Docker antes de commitear: `docker compose exec frontend bun run build`.

## 2. Consumo de API y Estados de UI
- Llamar al backend mediante rutas relativas `/api/...` (Vite proxea `/api` y `/uploads` hacia `http://backend:8000` en Docker y en túneles móviles).
- Toda pantalla con llamadas al backend DEBE mostrar: estado de carga, estado vacío y errores recuperables sin romper el flujo.
- Mantener visible `<PrototypeBanner />` y badges explícitos de categoría (`SIMULADO`, `OBSERVADO`, `REFERENCIA`).

## 3. Mapas Leaflet e Iconografía
- Importar `leaflet/dist/leaflet.css` al renderizar mapas Leaflet y tipar marcadores/capas con `@types/leaflet`.
- Declarar siempre fuente, fecha y categoría en cada capa cartográfica (IGN, Sentinel-2, Global Surface Water, datos demo).
- Usar exclusivamente iconos SVG de `@heroicons/react` (`h-4 w-4` o `h-5 w-5`). **PROHIBIDO** usar emojis de texto en la UI.
