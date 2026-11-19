import { ApiError, AvisoPayload, enviarAviso } from '@/lib/api';

// Cola offline de avisos vecinales (RF-FE-07).
// Clave fijada por la spec: atajaderos_avisos_offline.
const CLAVE = 'atajaderos_avisos_offline';
export const EVENTO_COLA = 'atajaderos:cola-avisos';

export interface AvisoPendiente {
  id: string;
  creado_en: string;
  datos: AvisoPayload;
  foto_data_url: string | null;
}

export interface ResultadoSincronizacion {
  confirmados: string[];
  rechazados: { aviso: AvisoPendiente; motivo: string }[];
  pendientes: number;
}

function notificar() {
  window.dispatchEvent(new Event(EVENTO_COLA));
}

export function leerCola(): AvisoPendiente[] {
  try {
    const crudo = localStorage.getItem(CLAVE);
    return crudo ? (JSON.parse(crudo) as AvisoPendiente[]) : [];
  } catch {
    return [];
  }
}

function guardarCola(cola: AvisoPendiente[]) {
  localStorage.setItem(CLAVE, JSON.stringify(cola));
  notificar();
}

export function encolarAviso(
  datos: AvisoPayload,
  fotoDataUrl: string | null,
): AvisoPendiente {
  const aviso: AvisoPendiente = {
    // randomUUID solo existe en https/localhost; en http por IP de red local no.
    id:
      typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    creado_en: new Date().toISOString(),
    datos,
    foto_data_url: fotoDataUrl,
  };
  const cola = [...leerCola(), aviso];
  try {
    guardarCola(cola);
  } catch {
    // Sin espacio: se guarda el aviso sin la foto antes que perderlo entero.
    aviso.foto_data_url = null;
    guardarCola([...leerCola(), aviso]);
  }
  return aviso;
}

// Achica la foto antes de guardarla: localStorage ronda los 5 MB por sitio.
export async function fotoADataUrl(
  archivo: File,
  ladoMaximo = 1280,
  calidad = 0.7,
): Promise<string> {
  const bitmap = await createImageBitmap(archivo);
  const escala = Math.min(1, ladoMaximo / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * escala);
  canvas.height = Math.round(bitmap.height * escala);
  canvas.getContext('2d')?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return canvas.toDataURL('image/jpeg', calidad);
}

async function dataUrlABlob(dataUrl: string): Promise<Blob> {
  return (await fetch(dataUrl)).blob();
}

let sincronizando = false;

// Envía en orden; ante falla de red corta y deja el resto para el próximo intento.
// Un 422 no se reintenta: se descarta de la cola y se informa como rechazado.
export async function sincronizarCola(): Promise<ResultadoSincronizacion> {
  const resultado: ResultadoSincronizacion = {
    confirmados: [],
    rechazados: [],
    pendientes: leerCola().length,
  };
  if (sincronizando) return resultado;
  sincronizando = true;

  try {
    for (const aviso of leerCola()) {
      try {
        const foto = aviso.foto_data_url
          ? await dataUrlABlob(aviso.foto_data_url)
          : null;
        const creado = await enviarAviso(aviso.datos, foto);
        resultado.confirmados.push(creado.codigo_unico);
      } catch (error) {
        if (error instanceof ApiError && error.status === 422) {
          resultado.rechazados.push({ aviso, motivo: error.message });
        } else {
          break; // sigue sin red: se reintenta más tarde
        }
      }
      guardarCola(leerCola().filter((a) => a.id !== aviso.id));
    }
  } finally {
    sincronizando = false;
    resultado.pendientes = leerCola().length;
  }
  return resultado;
}
