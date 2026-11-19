import { AtajaderoCreate, AvisoPayload, InspeccionCreate } from '@/types';

// Mismas reglas que el backend (00_CORE_CONTRACTS.md §1.5 y §3). Se validan en
// el navegador para dar feedback inmediato; el backend sigue siendo la autoridad.

export const LIMITES_FORMOSA = {
  latMin: -27.0,
  latMax: -22.0,
  lonMin: -62.5,
  lonMax: -57.5,
};

export const MIN_CARACTERES_DESCRIPCION = 10;
export const MIN_CARACTERES_OBSERVACIONES = 10;

export const MENSAJE_FUERA_DE_FORMOSA =
  'La ubicación tiene que estar dentro de la provincia de Formosa.';

export function dentroDeFormosa(lat: number, lon: number): boolean {
  const { latMin, latMax, lonMin, lonMax } = LIMITES_FORMOSA;
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lon) &&
    lat >= latMin &&
    lat <= latMax &&
    lon >= lonMin &&
    lon <= lonMax
  );
}

export function validarAviso(p: AvisoPayload): Record<string, string> {
  const errores: Record<string, string> = {};
  if (!dentroDeFormosa(p.latitud, p.longitud)) {
    errores.ubicacion = `${MENSAJE_FUERA_DE_FORMOSA} Marcá el punto en el mapa o usá tu GPS.`;
  }
  if (!p.nombre_referencia.trim()) {
    errores.nombre_referencia = 'Contanos cómo se conoce el lugar (paraje, campo o ruta).';
  }
  if (!p.departamento) {
    errores.departamento = 'Elegí el departamento.';
  }
  if (p.descripcion_aviso.trim().length < MIN_CARACTERES_DESCRIPCION) {
    errores.descripcion_aviso = `Describí lo que ves con al menos ${MIN_CARACTERES_DESCRIPCION} caracteres.`;
  }
  return errores;
}

export function validarAtajadero(p: AtajaderoCreate): Record<string, string> {
  const errores: Record<string, string> = {};
  if (!dentroDeFormosa(p.latitud, p.longitud)) {
    errores.ubicacion = `${MENSAJE_FUERA_DE_FORMOSA} Marcá el punto en el mapa.`;
  }
  if (!p.nombre_referencia.trim()) errores.nombre_referencia = 'Ingresá un nombre de referencia.';
  if (!p.departamento) errores.departamento = 'Elegí el departamento.';
  if (!p.cuenca_riacho.trim()) errores.cuenca_riacho = 'Ingresá el riacho o cuenca.';
  return errores;
}

export function validarInspeccion(p: InspeccionCreate): Record<string, string> {
  const errores: Record<string, string> = {};
  if (p.estado_observado === 'sin_validar') {
    errores.estado_observado =
      'Una inspección no puede dejar el atajadero en "sin validar": elegí un estado técnico.';
  }
  if (p.observaciones.trim().length < MIN_CARACTERES_OBSERVACIONES) {
    errores.observaciones = `Las observaciones necesitan al menos ${MIN_CARACTERES_OBSERVACIONES} caracteres.`;
  }
  return errores;
}
