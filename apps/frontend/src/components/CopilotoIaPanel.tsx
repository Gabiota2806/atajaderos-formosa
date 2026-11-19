import { ApiError, consultarAsistente } from '@/lib/api';
import {
  ETIQUETA_ESCURRIMIENTO,
  ETIQUETA_ESTADO,
  ETIQUETA_INDICADOR,
} from '@/lib/dominio';
import { AsistenteResponse, ModoAsistente } from '@/types';
import {
  CheckIcon,
  ExclamationTriangleIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import { useState } from 'react';

interface CopilotoIaPanelProps {
  modo: ModoAsistente;
  // Modo 1: texto crudo de campo. Modo 2: opcionalmente un atajadero puntual.
  textoCampo?: string;
  codigoUnico?: string;
  // Solo Modo 1: se llama ÚNICAMENTE al pulsar la confirmación humana.
  onAplicar?: (borrador: AsistenteResponse) => void;
}

const ETIQUETA_MODO_EJECUCION = {
  ia_asistida: 'IA asistida',
  deterministico_offline: 'Determinístico offline',
};

// Copiloto Human-in-the-Loop (RF-FE-05): nunca escribe en la base ni asigna
// estados; muestra un borrador y exige una acción humana explícita.
export default function CopilotoIaPanel({
  modo,
  textoCampo = '',
  codigoUnico,
  onAplicar,
}: CopilotoIaPanelProps) {
  const [borrador, setBorrador] = useState<AsistenteResponse | null>(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const esCampo = modo === 'estructurar_nota_campo';

  const consultar = async () => {
    setCargando(true);
    setError(null);
    try {
      setBorrador(
        await consultarAsistente({
          modo,
          texto_campo: esCampo ? textoCampo : undefined,
          codigo_unico: codigoUnico,
        }),
      );
    } catch (e) {
      setError(
        e instanceof ApiError || e instanceof Error
          ? e.message
          : 'El copiloto no respondió. Podés seguir sin él.',
      );
    } finally {
      setCargando(false);
    }
  };

  return (
    <section
      aria-label="Copiloto IA"
      className="rounded-lg border border-dashed border-slate-400 bg-slate-50/60 p-3"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="flex items-center gap-1.5 text-sm font-medium text-slate-700">
          <SparklesIcon className="h-4 w-4" aria-hidden="true" />
          {esCampo ? 'Ordenar notas con el copiloto' : 'Síntesis de triage con el copiloto'}
        </p>
        {!borrador && (
          <button
            type="button"
            onClick={() => void consultar()}
            disabled={cargando}
            className="inline-flex min-h-[40px] items-center rounded-lg border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
          >
            {cargando ? 'Generando…' : 'Generar borrador'}
          </button>
        )}
      </div>

      {error && <p className="mt-2 text-sm text-red-700">{error}</p>}

      {borrador && (
        <div className="mt-3 space-y-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-900">
              Borrador
            </span>
            <span className="rounded-full border border-slate-300 bg-white px-2 py-0.5 text-xs text-slate-700">
              {ETIQUETA_MODO_EJECUCION[borrador.modo_ejecucion]}
            </span>
          </div>

          <p className="flex items-start gap-1.5 text-xs text-amber-900">
            <ExclamationTriangleIcon className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            {borrador.aviso_legal}
          </p>

          {/* Otra tipografía: se distingue de lo que cargó una persona. */}
          <p className="font-serif text-[15px] leading-relaxed text-slate-800">
            {borrador.resumen_tecnico}
          </p>

          {borrador.indicadores_sugeridos.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {borrador.indicadores_sugeridos.map((i) => (
                <span
                  key={i}
                  className="rounded border border-slate-300 bg-white px-1.5 py-0.5 text-xs text-slate-700"
                >
                  {ETIQUETA_INDICADOR[i]}
                </span>
              ))}
            </div>
          )}

          {esCampo && (borrador.estado_sugerido || borrador.escurrimiento_sugerido) && (
            <p className="text-xs text-slate-600">
              Sugiere
              {borrador.escurrimiento_sugerido &&
                ` escurrimiento "${ETIQUETA_ESCURRIMIENTO[borrador.escurrimiento_sugerido]}"`}
              {borrador.estado_sugerido &&
                ` y estado "${ETIQUETA_ESTADO[borrador.estado_sugerido]}"`}
              . Revisalo: la decisión es tuya.
            </p>
          )}

          {borrador.encuadre_normativo.map((n) => (
            <p key={n} className="text-xs text-slate-600">
              {n}
            </p>
          ))}

          <div className="flex flex-col gap-2 pt-1 sm:flex-row">
            {esCampo && onAplicar && (
              <button
                type="button"
                onClick={() => {
                  onAplicar(borrador);
                  setBorrador(null);
                }}
                className="inline-flex min-h-[44px] flex-1 items-center justify-center gap-1.5 rounded-lg bg-teal-700 px-3 text-sm font-semibold text-white hover:bg-teal-800"
              >
                <CheckIcon className="h-4 w-4" aria-hidden="true" />
                Confirmación Humana: Aplicar Borrador al Formulario
              </button>
            )}
            <button
              type="button"
              onClick={() => setBorrador(null)}
              className="min-h-[44px] rounded-lg border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Descartar
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
