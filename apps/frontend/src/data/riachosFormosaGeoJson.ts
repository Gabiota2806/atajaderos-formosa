import type { FeatureCollection } from 'geojson';

/**
 * Trazas esquemáticas de referencia de los corredores fluviales principales de Formosa.
 * Categoría taxonómica: REFERENCIA (IGN / Ministerio de Producción y Ambiente).
 * Uso exclusivo para contextualización visual en el prototipo AI LAB.
 */
export const RIACHOS_FORMOSA_GEOJSON: FeatureCollection = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: {
        nombre: 'Riacho El Porteño',
        corredor: 'Corredor El Porteño – He-Hé',
        categoria_dato: 'REFERENCIA',
        fuente: 'IGN / Ministerio de Producción y Ambiente — Traza esquemática de REFERENCIA',
      },
      geometry: {
        type: 'LineString',
        coordinates: [
          [-60.15, -24.72],
          [-59.45, -25.12],
          [-58.85, -24.98],
          [-58.15, -25.02],
        ],
      },
    },
    {
      type: 'Feature',
      properties: {
        nombre: 'Riacho He-Hé',
        corredor: 'Corredor El Porteño – He-Hé',
        categoria_dato: 'REFERENCIA',
        fuente: 'IGN / Ministerio de Producción y Ambiente — Traza esquemática de REFERENCIA',
      },
      geometry: {
        type: 'LineString',
        coordinates: [
          [-59.2, -25.05],
          [-58.85, -25.14],
          [-58.52, -25.18],
          [-57.95, -25.32],
        ],
      },
    },
    {
      type: 'Feature',
      properties: {
        nombre: 'Riacho Monte Lindo y A° Tatú Piré',
        corredor: 'Sistema Riacho Monte Lindo',
        categoria_dato: 'REFERENCIA',
        fuente: 'IGN / Ministerio de Producción y Ambiente — Traza esquemática de REFERENCIA',
      },
      geometry: {
        type: 'LineString',
        coordinates: [
          [-60.32, -24.89],
          [-59.3, -25.42],
          [-58.75, -25.68],
          [-58.28, -25.88],
          [-57.88, -25.95],
        ],
      },
    },
    {
      type: 'Feature',
      properties: {
        nombre: 'Riacho Pilagá',
        corredor: 'Corredor Riacho Pilagá',
        categoria_dato: 'REFERENCIA',
        fuente: 'IGN / Ministerio de Producción y Ambiente — Traza esquemática de REFERENCIA',
      },
      geometry: {
        type: 'LineString',
        coordinates: [
          [-59.65, -25.35],
          [-58.95, -25.72],
          [-58.18, -26.02],
          [-58.12, -26.08],
        ],
      },
    },
    {
      type: 'Feature',
      properties: {
        nombre: 'Bañado La Estrella – Riacho Salado',
        corredor: 'Corredor Bañado La Estrella – Riacho Salado',
        categoria_dato: 'REFERENCIA',
        fuente: 'IGN / Ministerio de Producción y Ambiente — Traza esquemática de REFERENCIA',
      },
      geometry: {
        type: 'LineString',
        coordinates: [
          [-60.4, -24.42],
          [-59.75, -25.25],
          [-59.1, -26.05],
          [-58.55, -26.52],
        ],
      },
    },
  ],
};
