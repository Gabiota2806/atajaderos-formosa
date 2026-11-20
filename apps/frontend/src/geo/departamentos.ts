import { DEPARTAMENTOS_FORMOSA_GEO } from '@/geo/formosaIgn';
import type { Feature, MultiPolygon, Polygon, Position } from 'geojson';

export function normalizarNombre(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();
}

// Ray casting: ¿el punto (lng, lat) cae dentro del anillo?
function dentroDeAnillo(lng: number, lat: number, anillo: Position[]): boolean {
  let adentro = false;
  for (let i = 0, j = anillo.length - 1; i < anillo.length; j = i++) {
    const [xi, yi] = anillo[i];
    const [xj, yj] = anillo[j];
    if (yi > lat !== yj > lat && lng < ((xj - xi) * (lat - yi)) / (yj - yi || 1e-12) + xi) {
      adentro = !adentro;
    }
  }
  return adentro;
}

const POLIGONOS = DEPARTAMENTOS_FORMOSA_GEO.features.map((f) => {
  const g = (f as Feature<MultiPolygon | Polygon>).geometry;
  return {
    nombre: String((f.properties as { nombre?: string })?.nombre ?? ''),
    poligonos: g.type === 'MultiPolygon' ? g.coordinates : [g.coordinates],
  };
});

// Departamento IGN donde cae el punto (o null si cae fuera de Formosa).
// Los límites están simplificados (~300 m): un punto pegado al borde puede
// quedar del otro lado.
export function departamentoGeometrico(lat: number, lng: number): string | null {
  const encontrado = POLIGONOS.find(({ poligonos }) =>
    poligonos.some((p) => dentroDeAnillo(lng, lat, p[0])),
  );
  return encontrado?.nombre ?? null;
}

// Si la ubicación cae en otro departamento que el declarado, devuelve cuál.
export function departamentoInconsistente(a: {
  latitud: number;
  longitud: number;
  departamento: string;
}): string | null {
  const real = departamentoGeometrico(a.latitud, a.longitud);
  if (!real || normalizarNombre(real) === normalizarNombre(a.departamento)) return null;
  return real;
}
