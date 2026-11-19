import CodigoAtajadero from '@/components/CodigoAtajadero';
import EtiquetaCategoria from '@/components/EtiquetaCategoria';
import {
  CLASES_ESCURRIMIENTO,
  CRITERIO_ESTADO,
  diasDesde,
  ETIQUETA_EMPLAZAMIENTO,
  ETIQUETA_ESCURRIMIENTO,
  ETIQUETA_ESTADO,
  estadoLectura,
  formatearFecha,
} from '@/lib/dominio';
import { AtajaderoSummary } from '@/types';
import { UserIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface FichaResumenProps {
  atajadero: AtajaderoSummary;
  onCerrar: () => void;
  onVerFicha?: (codigo: string) => void;
}

function TextoLectura({ fecha }: { fecha: string | null }) {
  const lectura = estadoLectura(fecha);
  if (!fecha || lectura === 'sin_lectura') {
    return <span className="font-semibold text-amber-800">SIN LECTURA</span>;
  }
  const dias = diasDesde(fecha);
  return (
    <span
      className={
        lectura === 'rezagada' ? 'font-semibold text-amber-800' : 'text-slate-900'
      }
    >
      Hace {dias} {dias === 1 ? 'día' : 'días'}
      {lectura === 'rezagada' && (
        <span className="block text-xs font-medium">Lectura rezagada</span>
      )}
    </span>
  );
}

export default function FichaResumen({
  atajadero: a,
  onCerrar,
  onVerFicha,
}: FichaResumenProps) {
  const fuente = a.fecha_ultima_inspeccion
    ? `Fuente: inspección del ${formatearFecha(a.fecha_ultima_inspeccion)}`
    : 'Fuente: registro preliminar, sin inspección presencial';
  const esPreliminar = a.estado !== 'sin_validar' && !a.criterio_validado_por;

  return (
    <section
      aria-label={`Resumen de ${a.codigo_unico}`}
      className="rounded-xl border border-slate-200 bg-white p-4 shadow-lg"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <CodigoAtajadero codigo={a.codigo_unico} grande />
          <EtiquetaCategoria categoria={a.categoria_dato} />
        </div>
        <button
          type="button"
          onClick={onCerrar}
          className="-m-2 flex h-11 w-11 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100"
          aria-label="Cerrar resumen"
        >
          <XMarkIcon className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>

      <h2 className="mt-2 text-lg font-semibold text-slate-900">
        {a.nombre_referencia}
      </h2>
      <p className="text-sm text-slate-600">
        {a.cuenca_riacho} · Dpto. {a.departamento}
      </p>
      <p className="mt-0.5 font-mono text-xs text-slate-500">
        {a.latitud.toFixed(4)}, {a.longitud.toFixed(4)}
      </p>

      <div
        className={`mt-3 rounded-lg border px-3 py-2 ${CLASES_ESCURRIMIENTO[a.interrumpe_escurrimiento]}`}
      >
        <p className="text-xs">¿Interrumpe el escurrimiento?</p>
        <p className="text-base font-semibold">
          {ETIQUETA_ESCURRIMIENTO[a.interrumpe_escurrimiento]}
        </p>
        <p className="text-xs">{fuente}</p>
      </div>

      <div className="mt-2 rounded-lg border border-slate-200 px-3 py-2">
        <p className="text-xs text-slate-500">Estado</p>
        <p className="text-base font-semibold text-slate-900">
          {ETIQUETA_ESTADO[a.estado]}
        </p>
        <p className="text-xs leading-snug text-slate-600">
          Criterio: {CRITERIO_ESTADO[a.estado]}
        </p>
        {esPreliminar && (
          <p className="mt-1 flex items-center gap-1 text-xs font-medium text-amber-800">
            <UserIcon className="h-3.5 w-3.5" aria-hidden="true" />
            Preliminar · falta validar por técnico
          </p>
        )}
      </div>

      <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-sm">
        <div>
          <dt className="text-xs text-slate-500">Última inspección</dt>
          <dd>
            <TextoLectura fecha={a.fecha_ultima_inspeccion} />
          </dd>
        </div>
        <div>
          <dt className="text-xs text-slate-500">Registros</dt>
          <dd className="text-slate-900">{a.total_inspecciones}</dd>
        </div>
        <div>
          <dt className="text-xs text-slate-500">Emplazamiento</dt>
          <dd className="text-slate-900">
            {ETIQUETA_EMPLAZAMIENTO[a.tipo_emplazamiento]}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-slate-500">Categoría del dato</dt>
          <dd>
            <EtiquetaCategoria categoria={a.categoria_dato} />
          </dd>
        </div>
      </dl>

      {onVerFicha && (
        <button
          type="button"
          onClick={() => onVerFicha(a.codigo_unico)}
          className="mt-4 min-h-[44px] w-full rounded-lg bg-teal-700 px-4 text-sm font-semibold text-white hover:bg-teal-800"
        >
          Ver ficha e historial
        </button>
      )}
    </section>
  );
}
