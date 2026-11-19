import Modal from '@/components/Modal';
import { ApiError, importarKobo } from '@/lib/api';
import { KoboImportItem, KoboImportResult } from '@/types';
import {
  ArrowUpTrayIcon,
  CheckCircleIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { useRef, useState } from 'react';

// SIMULADO: lote de ejemplo para la demo. La tercera fila cae fuera de Formosa
// a propósito, para mostrar cómo se informa un registro rechazado.
const EJEMPLO = JSON.stringify(
  {
    registros: [
      {
        nombre_referencia: 'Relevamiento Kobo · Laguna Yema (DATO DE PRUEBA)',
        latitud: -24.27,
        longitud: -61.24,
        departamento: 'Bermejo',
        cuenca_riacho: 'A determinar',
      },
      {
        codigo_unico: 'ATJ-FSA-0002',
        estado_observado: 'con_deterioro',
        interrumpe_escurrimiento: 'si',
        indicadores_visuales: ['cierre_total_sin_vertedero'],
        observaciones: 'Relevamiento offline Kobo: terraplén cierra el cauce, sin vertedero.',
      },
      { nombre_referencia: 'Punto fuera de la provincia', latitud: -31.4, longitud: -64.18 },
    ],
  },
  null,
  2,
);

type Crudo = Record<string, unknown>;

function numero(v: unknown): number {
  return typeof v === 'string' ? Number(v.replace(',', '.')) : Number(v);
}

// Acepta: array de registros, { registros: [...] }, o GeoJSON FeatureCollection
// (QField/QGIS). Reconoce el campo _geolocation [lat, lon] del export de Kobo.
function normalizar(texto: string): KoboImportItem[] {
  const datos = JSON.parse(texto) as unknown;
  let filas: Crudo[] = [];
  if (Array.isArray(datos)) filas = datos as Crudo[];
  else if (datos && typeof datos === 'object') {
    const obj = datos as Crudo;
    if (Array.isArray(obj.registros)) filas = obj.registros as Crudo[];
    else if (obj.type === 'FeatureCollection' && Array.isArray(obj.features)) {
      filas = (obj.features as Crudo[]).map((f) => {
        const coords = (f.geometry as Crudo | undefined)?.coordinates as number[] | undefined;
        return { ...(f.properties as Crudo), longitud: coords?.[0], latitud: coords?.[1] };
      });
    }
  }
  if (!filas.length) {
    throw new Error('No se encontraron registros. Usá un array, { "registros": [...] } o un GeoJSON.');
  }
  return filas.map((f) => {
    const geo = Array.isArray(f._geolocation) ? (f._geolocation as unknown[]) : [];
    return {
      ...(f as unknown as KoboImportItem),
      nombre_referencia: String(f.nombre_referencia ?? f.nombre ?? f.name ?? ''),
      latitud: numero(f.latitud ?? f.lat ?? geo[0]),
      longitud: numero(f.longitud ?? f.lon ?? f.lng ?? geo[1]),
    };
  });
}

interface ImportarKoboModalProps {
  responsable: string;
  onCerrar: () => void;
  onImportado: () => void;
}

export default function ImportarKoboModal({ responsable, onCerrar, onImportado }: ImportarKoboModalProps) {
  const [texto, setTexto] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [resultado, setResultado] = useState<KoboImportResult | null>(null);
  const [importando, setImportando] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  let vistaPrevia: KoboImportItem[] | null = null;
  let errorFormato: string | null = null;
  if (texto.trim()) {
    try {
      vistaPrevia = normalizar(texto);
    } catch (e) {
      errorFormato = e instanceof SyntaxError ? 'El texto no es un JSON válido.' : (e as Error).message;
    }
  }

  const leerArchivo = async (archivo: File | undefined) => {
    if (!archivo) return;
    setResultado(null);
    setTexto(await archivo.text());
  };

  const importar = async () => {
    if (!vistaPrevia) return;
    setImportando(true);
    setError(null);
    try {
      const r = await importarKobo(vistaPrevia, responsable);
      setResultado(r);
      if (r.creados || r.inspecciones_agregadas) onImportado();
    } catch (e) {
      setError(e instanceof ApiError || e instanceof Error ? e.message : 'No se pudo importar.');
    } finally {
      setImportando(false);
    }
  };

  return (
    <Modal
      ancho="lg"
      onCerrar={onCerrar}
      titulo={
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Importar relevamiento KoboToolbox / QField</h2>
          <p className="text-sm text-slate-600">
            Los atajaderos nuevos entran como sin validar; los códigos existentes suman una inspección.
          </p>
        </div>
      }
      pie={
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCerrar}
            className="min-h-[44px] rounded-lg border border-slate-300 px-4 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            {resultado ? 'Cerrar' : 'Cancelar'}
          </button>
          <button
            type="button"
            onClick={() => void importar()}
            disabled={!vistaPrevia || importando}
            className="min-h-[44px] rounded-lg bg-teal-700 px-4 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-50"
          >
            {importando
              ? 'Importando…'
              : `Importar ${vistaPrevia ? vistaPrevia.length : ''} ${vistaPrevia?.length === 1 ? 'registro' : 'registros'}`}
          </button>
        </div>
      }
    >
      <div className="space-y-3 p-4 sm:p-5">
        <div className="flex flex-wrap gap-2">
          <input
            ref={inputRef}
            type="file"
            accept=".json,.geojson,application/json,application/geo+json"
            className="sr-only"
            onChange={(e) => void leerArchivo(e.target.files?.[0])}
          />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="inline-flex min-h-[44px] items-center gap-1.5 rounded-lg border border-slate-300 px-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <ArrowUpTrayIcon className="h-4 w-4" aria-hidden="true" />
            Elegir archivo JSON / GeoJSON
          </button>
          <button
            type="button"
            onClick={() => {
              setResultado(null);
              setTexto(EJEMPLO);
            }}
            className="inline-flex min-h-[44px] items-center gap-1.5 rounded-lg border border-dashed border-amber-600 px-3 text-sm font-medium text-amber-900 hover:bg-amber-50"
          >
            <DocumentTextIcon className="h-4 w-4" aria-hidden="true" />
            Cargar ejemplo (SIMULADO)
          </button>
        </div>

        <label className="block">
          <span className="mb-1 block text-sm font-semibold">O pegá el contenido</span>
          <textarea
            rows={8}
            value={texto}
            onChange={(e) => {
              setTexto(e.target.value);
              setResultado(null);
            }}
            spellCheck={false}
            placeholder='{ "registros": [ { "nombre_referencia": "...", "latitud": -25.1, "longitud": -59.9 } ] }'
            className="w-full rounded-lg border border-slate-300 p-3 font-mono text-xs text-slate-900 placeholder:text-slate-400 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
          />
        </label>

        {errorFormato && <p className="text-sm text-red-700">{errorFormato}</p>}
        {vistaPrevia && !resultado && (
          <p className="text-sm text-slate-600">
            {vistaPrevia.length} {vistaPrevia.length === 1 ? 'registro listo' : 'registros listos'} para
            importar. Se validan uno por uno: los inválidos se informan y no frenan al resto.
          </p>
        )}
        {error && (
          <p role="alert" className="text-sm text-red-700">
            {error}
          </p>
        )}

        {resultado && (
          <section className="space-y-2 rounded-lg border border-slate-200 p-3 text-sm" aria-live="polite">
            <p className="flex items-center gap-1.5 font-semibold text-green-800">
              <CheckCircleIcon className="h-5 w-5" aria-hidden="true" />
              {resultado.creados} {resultado.creados === 1 ? 'atajadero creado' : 'atajaderos creados'} ·{' '}
              {resultado.inspecciones_agregadas}{' '}
              {resultado.inspecciones_agregadas === 1 ? 'inspección agregada' : 'inspecciones agregadas'}
            </p>
            {resultado.errores.length > 0 && (
              <ul className="space-y-1 text-red-800">
                {resultado.errores.map((e) => (
                  <li key={e} className="flex items-start gap-1.5">
                    <ExclamationTriangleIcon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                    {e}
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}
      </div>
    </Modal>
  );
}
