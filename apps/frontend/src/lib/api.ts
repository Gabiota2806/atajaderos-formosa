import { ApiError } from '@/lib/apiError';
import {
  AsistenteRequest,
  AsistenteResponse,
  AtajaderoCreate,
  AtajaderoDetail,
  AtajaderoListResponse,
  AvisoCreado,
  AvisoPayload,
  FiltrosAtajaderos,
  HealthResponse,
  InspeccionCreate,
  InspeccionResponse,
  KoboImportErrorApi,
  KoboImportItem,
  KoboImportResult,
  TokenResponse,
  User,
} from '@/types';

export { ApiError } from '@/lib/apiError';
export * from '@/lib/validaciones';
export type { AvisoCreado, AvisoPayload } from '@/types';

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

// Pydantic antepone "Value error, " a los mensajes de validación: se quita
// para que el usuario lea solo el motivo.
function limpiarMensaje(m: string): string {
  return m.replace(/^Value error,\s*/i, '');
}

// FastAPI devuelve `detail` como texto o como lista de errores de validación.
function mensajeDeDetalle(detail: unknown): string | null {
  if (typeof detail === 'string') return limpiarMensaje(detail);
  if (Array.isArray(detail)) {
    const mensajes = detail
      .map((d) =>
        d && typeof d === 'object' && 'msg' in d ? limpiarMensaje(String(d.msg)) : null,
      )
      .filter(Boolean);
    return mensajes.length ? mensajes.join(' ') : null;
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

// --- Inventario ---

export function fetchAtajaderos(
  filtros: FiltrosAtajaderos = {},
): Promise<AtajaderoListResponse> {
  return apiRequest<AtajaderoListResponse>(`/api/atajaderos${aQueryString(filtros)}`);
}

export function fetchAtajaderoDetalle(codigo: string): Promise<AtajaderoDetail> {
  return apiRequest<AtajaderoDetail>(`/api/atajaderos/${encodeURIComponent(codigo)}`);
}

export function crearAtajadero(payload: AtajaderoCreate): Promise<AtajaderoDetail> {
  return apiRequest<AtajaderoDetail>('/api/atajaderos', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function crearInspeccion(
  codigo: string,
  payload: InspeccionCreate,
  foto: File | null,
  _responsable?: string,
): Promise<InspeccionResponse> {
  // El responsable lo toma el backend del usuario autenticado (JWT).
  const form = new FormData();
  form.append('tipo_registro', payload.tipo_registro);
  form.append('estado_observado', payload.estado_observado);
  form.append('interrumpe_escurrimiento', payload.interrumpe_escurrimiento);
  payload.indicadores_visuales.forEach((i) => form.append('indicadores_visuales', i));
  form.append('observaciones', payload.observaciones);
  if (foto) form.append('foto', foto, foto.name);
  return apiRequest<InspeccionResponse>(
    `/api/atajaderos/${encodeURIComponent(codigo)}/inspecciones`,
    { method: 'POST', body: form },
  );
}

export async function importarKobo(
  registros: KoboImportItem[],
  _responsable?: string,
): Promise<KoboImportResult> {
  // El backend devuelve cada error como objeto: la interfaz los recibe como texto.
  const r = await apiRequest<Omit<KoboImportResult, 'errores'> & { errores: KoboImportErrorApi[] }>(
    '/api/atajaderos/importar-kobo',
    { method: 'POST', body: JSON.stringify({ registros }) },
  );
  return {
    ...r,
    errores: r.errores.map(
      (e) =>
        `Registro ${e.indice + 1}${e.codigo_unico ? ` (${e.codigo_unico})` : ''}: ${e.detalle
          .split('; ')
          .map((m) => m.replace(/^[a-z_]+: Value error,\s*/i, ''))
          .join(' ')}`,
    ),
  };
}

// --- Copiloto IA (solo lectura respecto a la base de datos) ---

export function consultarAsistente(req: AsistenteRequest): Promise<AsistenteResponse> {
  return apiRequest<AsistenteResponse>('/api/asistente/resumir', {
    method: 'POST',
    body: JSON.stringify(req),
  });
}

// --- GeoJSON (QGIS / QField) ---

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
  return apiRequest<FeatureCollectionAtajaderos>(
    `/api/atajaderos/geojson${aQueryString(filtros)}`,
  );
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

// --- Avisos vecinales (POST /api/avisos, público, Forma B) ---

export function enviarAviso(
  payload: AvisoPayload,
  foto?: Blob | null,
): Promise<AvisoCreado> {
  const form = new FormData();
  Object.entries(payload).forEach(([clave, valor]) => {
    if (valor !== undefined && valor !== '') form.append(clave, String(valor));
  });
  if (foto) form.append('foto', foto, 'aviso.jpg');
  return apiRequest<AvisoCreado>('/api/avisos', { method: 'POST', body: form });
}
