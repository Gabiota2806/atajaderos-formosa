import { ATAJADEROS_SIMULADOS } from '@/lib/mockAtajaderos';
import {
  AtajaderoListResponse,
  FiltrosAtajaderos,
  HealthResponse,
  TokenResponse,
  User,
} from '@/types';

// Mientras el backend no exponga GET /api/atajaderos, el frontend usa el
// dataset SIMULADO local. Pasar a false cuando el endpoint esté disponible.
const USAR_DATOS_SIMULADOS = true;

const TOKEN_STORAGE_KEY = 'atajaderos_jwt_token';

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_STORAGE_KEY);
}

export function setStoredToken(token: string | null): void {
  if (token) {
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
  }
}

// Error HTTP con código: permite distinguir validación (422) de fallas de red.
export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// FastAPI devuelve `detail` como texto o como lista de errores de validación.
function mensajeDeDetalle(detail: unknown): string | null {
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail)) {
    const mensajes = detail
      .map((d) => (d && typeof d === 'object' && 'msg' in d ? String(d.msg) : null))
      .filter(Boolean);
    return mensajes.length ? mensajes.join(' · ') : null;
  }
  return null;
}

async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getStoredToken();
  const headers = new Headers(init?.headers);
  if (!headers.has('Content-Type') && !(init?.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(path, { ...init, headers });
  if (!response.ok) {
    let message = `Error HTTP ${response.status}`;
    try {
      const payload = (await response.json()) as { detail?: unknown };
      message = mensajeDeDetalle(payload.detail) ?? message;
    } catch {
      // mantener mensaje por defecto
    }
    throw new ApiError(message, response.status);
  }

  return (await response.json()) as T;
}

export function fetchHealth(): Promise<HealthResponse> {
  return apiRequest<HealthResponse>('/api/health');
}

export function loginRequest(
  email: string,
  password: string,
): Promise<TokenResponse> {
  return apiRequest<TokenResponse>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export function fetchMe(): Promise<User> {
  return apiRequest<User>('/api/auth/me');
}

function aQueryString(filtros: FiltrosAtajaderos): string {
  const params = new URLSearchParams();
  Object.entries(filtros).forEach(([clave, valor]) => {
    if (valor) params.set(clave, valor);
  });
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

function filtrarSimulados(filtros: FiltrosAtajaderos): AtajaderoListResponse {
  const texto = filtros.q?.trim().toLowerCase();
  const items = ATAJADEROS_SIMULADOS.filter(
    (a) =>
      (!filtros.estado || a.estado === filtros.estado) &&
      (!filtros.interrumpe_escurrimiento ||
        a.interrumpe_escurrimiento === filtros.interrumpe_escurrimiento) &&
      (!filtros.tipo_emplazamiento ||
        a.tipo_emplazamiento === filtros.tipo_emplazamiento) &&
      (!filtros.departamento || a.departamento === filtros.departamento) &&
      (!filtros.cuenca_riacho || a.cuenca_riacho === filtros.cuenca_riacho) &&
      (!texto ||
        `${a.codigo_unico} ${a.nombre_referencia} ${a.cuenca_riacho}`
          .toLowerCase()
          .includes(texto)),
  );
  return { total: items.length, items };
}

export async function fetchAtajaderos(
  filtros: FiltrosAtajaderos = {},
): Promise<AtajaderoListResponse> {
  if (USAR_DATOS_SIMULADOS) {
    // Pequeña demora para que los estados de carga se vean como con red real.
    await new Promise((resolve) => setTimeout(resolve, 300));
    return filtrarSimulados(filtros);
  }
  return apiRequest<AtajaderoListResponse>(
    `/api/atajaderos${aQueryString(filtros)}`,
  );
}

export interface FeatureCollectionAtajaderos {
  type: 'FeatureCollection';
  features: {
    type: 'Feature';
    geometry: { type: 'Point'; coordinates: [number, number] };
    properties: Record<string, unknown>;
  }[];
}

// GET /api/atajaderos/geojson (EPSG:4326, compatible QGIS/QField).
export async function fetchAtajaderosGeojson(
  filtros: FiltrosAtajaderos = {},
): Promise<FeatureCollectionAtajaderos> {
  if (USAR_DATOS_SIMULADOS) {
    const { items } = filtrarSimulados(filtros);
    return {
      type: 'FeatureCollection',
      features: items.map(({ latitud, longitud, ...propiedades }) => ({
        type: 'Feature',
        // GeoJSON ordena [longitud, latitud], al revés que Leaflet.
        geometry: { type: 'Point', coordinates: [longitud, latitud] },
        properties: propiedades,
      })),
    };
  }
  return apiRequest<FeatureCollectionAtajaderos>(
    `/api/atajaderos/geojson${aQueryString(filtros)}`,
  );
}

// --- Avisos vecinales (POST /api/avisos, público, Forma B) ---

export interface AvisoPayload {
  nombre_referencia: string;
  latitud: number;
  longitud: number;
  departamento: string;
  cuenca_riacho: string;
  descripcion_aviso: string;
  reportado_por?: string;
}

export interface AvisoCreado {
  codigo_unico: string;
}

// Mismas reglas que el backend (00_CORE_CONTRACTS.md §1.5 y §3): se validan
// también acá para dar feedback inmediato, pero el backend sigue siendo la autoridad.
export const LIMITES_FORMOSA = {
  latMin: -27.0,
  latMax: -22.0,
  lonMin: -62.5,
  lonMax: -57.5,
};
export const MIN_CARACTERES_DESCRIPCION = 10;

export function validarAviso(p: AvisoPayload): Record<string, string> {
  const errores: Record<string, string> = {};
  const { latMin, latMax, lonMin, lonMax } = LIMITES_FORMOSA;
  if (
    !Number.isFinite(p.latitud) ||
    !Number.isFinite(p.longitud) ||
    p.latitud < latMin ||
    p.latitud > latMax ||
    p.longitud < lonMin ||
    p.longitud > lonMax
  ) {
    errores.ubicacion =
      'La ubicación tiene que estar dentro de la provincia de Formosa. Marcá el punto en el mapa o usá tu GPS.';
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

let contadorSimulado = 0;

export async function enviarAviso(
  payload: AvisoPayload,
  foto?: Blob | null,
): Promise<AvisoCreado> {
  if (USAR_DATOS_SIMULADOS) {
    await new Promise((resolve) => setTimeout(resolve, 500));
    // Emula la red: sin conexión el fetch real fallaría con TypeError.
    if (!navigator.onLine) throw new TypeError('Failed to fetch');
    const errores = validarAviso(payload);
    if (Object.keys(errores).length) {
      throw new ApiError(Object.values(errores).join(' · '), 422);
    }
    contadorSimulado += 1;
    return { codigo_unico: `ATJ-FSA-${String(100 + contadorSimulado).padStart(4, '0')}` };
  }

  const form = new FormData();
  Object.entries(payload).forEach(([clave, valor]) => {
    if (valor !== undefined && valor !== '') form.append(clave, String(valor));
  });
  if (foto) form.append('foto', foto, 'aviso.jpg');
  return apiRequest<AvisoCreado>('/api/avisos', { method: 'POST', body: form });
}

export async function descargarGeojson(): Promise<void> {
  const coleccion = await fetchAtajaderosGeojson();
  const blob = new Blob([JSON.stringify(coleccion, null, 2)], {
    type: 'application/geo+json',
  });
  const url = URL.createObjectURL(blob);
  const enlace = document.createElement('a');
  enlace.href = url;
  enlace.download = `atajaderos-formosa-${new Date().toISOString().slice(0, 10)}.geojson`;
  enlace.click();
  URL.revokeObjectURL(url);
}
