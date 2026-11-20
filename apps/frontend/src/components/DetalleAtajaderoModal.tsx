import CodigoAtajadero from '@/components/CodigoAtajadero';
import CopilotoIaPanel from '@/components/CopilotoIaPanel';
import EtiquetaCategoria from '@/components/EtiquetaCategoria';
import Modal from '@/components/Modal';
import { fetchAtajaderoDetalle } from '@/lib/api';
import {
  CLASES_ESCURRIMIENTO,
  CRITERIO_ESTADO,
  ENCUADRE_EMPLAZAMIENTO,
  ETIQUETA_EMPLAZAMIENTO,
  ETIQUETA_ESCURRIMIENTO,
  ETIQUETA_ESTADO,
  ETIQUETA_INDICADOR,
  ETIQUETA_TIPO_REGISTRO,
  formatearFecha,
} from '@/lib/dominio';
import { AtajaderoDetail, InspeccionResponse } from '@/types';
import {
  ArrowPathIcon,
  ClipboardDocumentCheckIcon,
  ClipboardDocumentIcon,
  FlagIcon,
  PhotoIcon,
  UserIcon,
  WrenchScrewdriverIcon,
} from '@heroicons/react/24/outline';
import { useCallback, useEffect, useState } from 'react';

interface DetalleAtajaderoModalProps {
  codigo: string;
  onCerrar: () => void;
  onNuevaInspeccion: (atajadero: AtajaderoDetail) => void;
  // Cambia cuando se guardó una inspección: fuerza a recargar el historial.
  version?: number;
}

// El backend (#2) hoy guarda la evidencia del aviso también como texto dentro
// de observaciones_iniciales ("[EVIDENCIA_INICIAL:{...}]"), además de
// devolverla en evidencia_inicial_fotos. Se oculta ese bloque en la vista.
function textoAvisoInicial(texto: string | null | undefined): string {
  return (texto ?? '').replace(/\s*\[EVIDENCIA_INICIAL:[\s\S]*\]\s*$/, '').trim();
}

function fechaHora(iso: string): string {
  return new Date(iso).toLocaleString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  });
}

// "Antes → después": el valor anterior tachado, para leer cómo evolucionó.
function Cambio({ antes, despues, destacar }: { antes?: string; despues: string; destacar?: boolean }) {
  return (
    <span className="text-xs">
      {antes && antes !== despues && (
        <>
          <span className="text-slate-400 line-through">{antes}</span>
          <span className="mx-1 text-slate-400">→</span>
        </>
      )}
      <span
        className={`rounded px-1.5 py-0.5 ${
          destacar ? 'bg-red-50 text-red-800' : 'border border-slate-300 text-slate-700'
        }`}
      >
        {despues}
      </span>
    </span>
  );
}

function EventoHistorial({
  registro: r,
  anterior,
}: {
  registro: InspeccionResponse;
  anterior?: InspeccionResponse;
}) {
  const Icono = r.tipo_registro === 'intervencion' ? WrenchScrewdriverIcon : ClipboardDocumentCheckIcon;
  return (
    <li className="relative grid grid-cols-[32px_minmax(0,1fr)] gap-3 pb-3">
      <span
        className={`z-10 mt-3 flex h-8 w-8 items-center justify-center rounded-full ${
          r.tipo_registro === 'intervencion' ? 'bg-sky-50 text-sky-800' : 'bg-teal-50 text-teal-800'
        }`}
      >
        <Icono className="h-4 w-4" aria-hidden="true" />
      </span>
      <article className="rounded-lg border border-slate-200 bg-white p-3 sm:p-4">
        <header className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
          <h3 className="text-[15px] font-semibold text-slate-900">
            {ETIQUETA_TIPO_REGISTRO[r.tipo_registro]}
          </h3>
          <time className="text-xs text-slate-500" dateTime={r.fecha_inspeccion}>
            {fechaHora(r.fecha_inspeccion)}
          </time>
        </header>
        <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-500">
          <UserIcon className="h-3.5 w-3.5" aria-hidden="true" />
          {r.responsable}
        </p>

        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1.5">
          <Cambio
            antes={anterior && `Escurrimiento: ${ETIQUETA_ESCURRIMIENTO[anterior.interrumpe_escurrimiento]}`}
            despues={`Escurrimiento: ${ETIQUETA_ESCURRIMIENTO[r.interrumpe_escurrimiento]}`}
            destacar={r.interrumpe_escurrimiento === 'si'}
          />
          <Cambio
            antes={anterior && ETIQUETA_ESTADO[anterior.estado_observado]}
            despues={ETIQUETA_ESTADO[r.estado_observado]}
          />
        </div>

        {r.indicadores_visuales.length > 0 && (
          <ul className="mt-2 flex flex-wrap gap-1" aria-label="Indicadores visuales">
            {r.indicadores_visuales.map((i) => (
              <li key={i} className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-700">
                {ETIQUETA_INDICADOR[i]}
              </li>
            ))}
          </ul>
        )}

        <p className="mt-2 text-sm leading-relaxed text-slate-700">{r.observaciones}</p>

        {r.evidencia_fotos.length > 0 && (
          <ul className="mt-3 flex flex-wrap gap-2" aria-label="Evidencia fotográfica">
            {r.evidencia_fotos.map((url, i) => {
              const hash = r.fotos_hashes_sha256[i];
              return (
                <li key={url} className="w-24">
                  <a href={url} target="_blank" rel="noreferrer">
                    <img
                      src={url}
                      alt={`Evidencia ${i + 1} del ${formatearFecha(r.fecha_inspeccion)}`}
                      className="h-24 w-24 rounded-md object-cover"
                    />
                  </a>
                  {hash && (
                    <p
                      className="mt-1 truncate font-mono text-[10px] text-slate-500"
                      title={`SHA-256: ${hash}`}
                    >
                      SHA-256 {hash.slice(0, 10)}…
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </article>
    </li>
  );
}

export default function DetalleAtajaderoModal({
  codigo,
  onCerrar,
  onNuevaInspeccion,
  version = 0,
}: DetalleAtajaderoModalProps) {
  const [detalle, setDetalle] = useState<AtajaderoDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiado, setCopiado] = useState(false);

  const cargar = useCallback(() => {
    setError(null);
    fetchAtajaderoDetalle(codigo)
      .then(setDetalle)
      .catch((e: unknown) => setError(e instanceof Error ? e.message : 'No se pudo cargar la ficha.'));
  }, [codigo]);

  useEffect(cargar, [cargar, version]);

  const ultima = detalle?.inspecciones[0];
  const fuente = ultima
    ? `Fuente: ${ETIQUETA_TIPO_REGISTRO[ultima.tipo_registro].toLowerCase()} del ${formatearFecha(ultima.fecha_inspeccion)} · ${ultima.responsable}`
    : 'Fuente: registro preliminar, sin inspección presencial';
  const esPreliminar = detalle && detalle.estado !== 'sin_validar' && !detalle.criterio_validado_por;
  const totalFotos = detalle?.inspecciones.reduce((n, i) => n + i.evidencia_fotos.length, 0) ?? 0;

  const copiarCoordenadas = async () => {
    if (!detalle) return;
    try {
      await navigator.clipboard.writeText(`${detalle.latitud}, ${detalle.longitud}`);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 1500);
    } catch {
      // portapapeles no disponible (http por IP): no es crítico
    }
  };

  return (
    <Modal
      ancho="xl"
      onCerrar={onCerrar}
      titulo={
        <div>
          <div className="flex flex-wrap items-center gap-1.5">
            <CodigoAtajadero codigo={codigo} grande />
            {detalle && <EtiquetaCategoria categoria={detalle.categoria_dato} />}
          </div>
          <h2 className="titulo-ancho mt-1.5 text-xl font-extrabold text-tinta">
            {detalle?.nombre_referencia ?? 'Cargando ficha…'}
          </h2>
          {detalle && (
            <p className="text-sm text-slate-600">
              <span className="rotulo-agua font-semibold">{detalle.cuenca_riacho}</span>, Dpto.{' '}
              {detalle.departamento}.{' '}
              <button
                type="button"
                onClick={() => void copiarCoordenadas()}
                className="inline-flex items-center gap-1 font-mono text-xs text-slate-600 hover:text-slate-900"
                title="Copiar coordenadas"
              >
                {detalle.latitud.toFixed(4)}, {detalle.longitud.toFixed(4)}
                <ClipboardDocumentIcon className="h-3.5 w-3.5" aria-hidden="true" />
                {copiado && <span className="font-sans text-teal-700">Copiado</span>}
              </button>
            </p>
          )}
        </div>
      }
      pie={
        detalle && (
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onCerrar}
              className="min-h-[44px] rounded-lg border border-slate-300 px-4 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Cerrar
            </button>
            <button
              type="button"
              onClick={() => onNuevaInspeccion(detalle)}
              className="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-lg bg-teal-700 px-4 text-sm font-semibold text-white hover:bg-teal-800"
            >
              <ClipboardDocumentCheckIcon className="h-4 w-4" aria-hidden="true" />
              Nueva inspección
            </button>
          </div>
        )
      }
    >
      {error ? (
        <div className="m-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <p>{error}</p>
          <button
            type="button"
            onClick={cargar}
            className="mt-2 inline-flex min-h-[44px] items-center gap-1.5 font-semibold"
          >
            <ArrowPathIcon className="h-4 w-4" aria-hidden="true" />
            Reintentar
          </button>
        </div>
      ) : !detalle ? (
        <p className="p-6 text-sm text-slate-600">Cargando ficha e historial…</p>
      ) : (
        <div className="space-y-4 p-4 sm:p-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className={`rounded-lg border px-4 py-3 ${CLASES_ESCURRIMIENTO[detalle.interrumpe_escurrimiento]}`}>
              <p className="text-xs">¿Interrumpe el escurrimiento?</p>
              <p className="text-xl font-semibold">
                {ETIQUETA_ESCURRIMIENTO[detalle.interrumpe_escurrimiento]}
              </p>
              <p className="mt-1 text-xs">{fuente}</p>
            </div>
            <div className="rounded-lg border border-slate-200 px-4 py-3">
              <p className="text-xs text-slate-500">Estado</p>
              <p className="text-xl font-semibold text-slate-900">{ETIQUETA_ESTADO[detalle.estado]}</p>
              <p className="mt-1 text-xs leading-snug text-slate-600">
                Criterio: {CRITERIO_ESTADO[detalle.estado]}
              </p>
              {esPreliminar && (
                <p className="mt-1 flex items-center gap-1 text-xs font-medium text-amber-800">
                  <UserIcon className="h-3.5 w-3.5" aria-hidden="true" />
                  Preliminar · falta validar por técnico
                </p>
              )}
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
            <section aria-label="Historial">
              <div className="mb-3 flex items-baseline justify-between">
                <h3 className="text-base font-semibold text-slate-900">Historial</h3>
                <p className="text-xs text-slate-500">Solo se agregan registros; nunca se editan.</p>
              </div>
              {detalle.inspecciones.length === 0 ? (
                <p className="flex items-center gap-2 rounded-lg border border-dashed border-slate-300 p-4 text-sm text-slate-600">
                  <FlagIcon className="h-5 w-5 shrink-0" aria-hidden="true" />
                  Sin inspecciones todavía. Es un registro preliminar: el estado técnico lo
                  asigna la primera inspección presencial.
                </p>
              ) : (
                <ol className="relative">
                  <span
                    className="absolute bottom-6 left-4 top-4 w-px bg-slate-200"
                    aria-hidden="true"
                  />
                  {detalle.inspecciones.map((r, i) => (
                    <EventoHistorial key={r.id} registro={r} anterior={detalle.inspecciones[i + 1]} />
                  ))}
                </ol>
              )}
            </section>

            <aside className="space-y-4">
              {/* Booleano explícito: con 0 fotos, `length` dibujaría un "0" suelto. */}
              {Boolean(textoAvisoInicial(detalle.observaciones_iniciales) || detalle.evidencia_inicial_fotos?.length) && (
                <section
                  aria-label="Origen del registro"
                  className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm"
                >
                  <p className="text-xs font-semibold text-amber-900">Origen del registro</p>
                  {textoAvisoInicial(detalle.observaciones_iniciales) && (
                    <p className="mt-1 leading-relaxed text-amber-950">
                      {textoAvisoInicial(detalle.observaciones_iniciales)}
                    </p>
                  )}
                  {detalle.reportado_por && (
                    <p className="mt-1 text-xs text-amber-900">Reportado por: {detalle.reportado_por}</p>
                  )}
                  {detalle.evidencia_inicial_fotos?.map((url, i) => {
                    const hash = detalle.evidencia_inicial_hashes_sha256?.[i];
                    return (
                      <a key={url} href={url} target="_blank" rel="noreferrer" className="mt-2 block">
                        <img
                          src={url}
                          alt="Foto adjunta al aviso inicial"
                          className="max-h-40 w-full rounded-md object-cover"
                        />
                        {hash && (
                          <span
                            className="mt-1 block truncate font-mono text-[10px] text-amber-900"
                            title={`SHA-256: ${hash}`}
                          >
                            SHA-256 {hash.slice(0, 10)}…
                          </span>
                        )}
                      </a>
                    );
                  })}
                </section>
              )}
              <CopilotoIaPanel modo="resumir_triage_mesa" codigoUnico={codigo} />
              <dl className="space-y-3 rounded-lg border border-slate-200 p-3 text-sm">
                <div>
                  <dt className="text-xs text-slate-500">Emplazamiento</dt>
                  <dd className="font-medium text-slate-900">
                    {ETIQUETA_EMPLAZAMIENTO[detalle.tipo_emplazamiento]}
                  </dd>
                  <dd className="text-xs text-slate-600">
                    {ENCUADRE_EMPLAZAMIENTO[detalle.tipo_emplazamiento]}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-500">Registros</dt>
                  <dd className="text-slate-900">{detalle.inspecciones.length}</dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-500">Evidencia fotográfica</dt>
                  <dd className="flex items-center gap-1 text-slate-900">
                    <PhotoIcon className="h-4 w-4 text-slate-500" aria-hidden="true" />
                    {totalFotos} {totalFotos === 1 ? 'foto' : 'fotos'} con sello SHA-256
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-500">Categoría del dato</dt>
                  <dd>
                    <EtiquetaCategoria categoria={detalle.categoria_dato} />
                  </dd>
                </div>
              </dl>
            </aside>
          </div>
        </div>
      )}
    </Modal>
  );
}
