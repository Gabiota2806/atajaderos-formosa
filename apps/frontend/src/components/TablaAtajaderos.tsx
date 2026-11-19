import CodigoAtajadero from '@/components/CodigoAtajadero';
import EtiquetaCategoria from '@/components/EtiquetaCategoria';
import { COLOR_ESCURRIMIENTO } from '@/components/MapaAtajaderos';
import {
  diasDesde,
  ETIQUETA_ESCURRIMIENTO,
  ETIQUETA_ESTADO,
  estadoLectura,
  formatearFecha,
} from '@/lib/dominio';
import { AtajaderoSummary } from '@/types';

function CeldaLectura({ fecha }: { fecha: string | null }) {
  const lectura = estadoLectura(fecha);
  if (!fecha || lectura === 'sin_lectura') {
    return (
      <span className="rounded bg-amber-100 px-1.5 py-0.5 text-xs font-semibold text-amber-900">
        SIN LECTURA
      </span>
    );
  }
  return (
    <span className="whitespace-nowrap">
      {formatearFecha(fecha)}
      {lectura === 'rezagada' && (
        <span className="ml-1.5 rounded bg-amber-100 px-1.5 py-0.5 text-xs font-semibold text-amber-900">
          Lectura rezagada · {diasDesde(fecha)} d
        </span>
      )}
    </span>
  );
}

function PuntoEscurrimiento({ a }: { a: AtajaderoSummary }) {
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
      <span
        className="h-2.5 w-2.5 rounded-full"
        style={{ backgroundColor: COLOR_ESCURRIMIENTO[a.interrumpe_escurrimiento] }}
        aria-hidden="true"
      />
      {ETIQUETA_ESCURRIMIENTO[a.interrumpe_escurrimiento]}
    </span>
  );
}

interface TablaAtajaderosProps {
  atajaderos: AtajaderoSummary[];
  seleccionado: string | null;
  onSeleccionar: (codigo: string) => void;
}

// Tabla en tablet/escritorio; tarjetas en móvil para no desbordar a lo ancho.
export default function TablaAtajaderos({
  atajaderos,
  seleccionado,
  onSeleccionar,
}: TablaAtajaderosProps) {
  if (atajaderos.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-slate-300 px-3 py-8 text-center text-sm text-slate-600">
        Ningún atajadero coincide con los filtros. Probá activar más opciones de
        escurrimiento.
      </p>
    );
  }

  return (
    <>
      <ul className="space-y-2 md:hidden">
        {atajaderos.map((a) => (
          <li key={a.codigo_unico}>
            <button
              type="button"
              onClick={() => onSeleccionar(a.codigo_unico)}
              className={`w-full rounded-lg border p-3 text-left text-sm ${
                a.codigo_unico === seleccionado
                  ? 'border-teal-600 bg-teal-50/60'
                  : 'border-slate-200 bg-white'
              }`}
            >
              <span className="flex flex-wrap items-center gap-1.5">
                <CodigoAtajadero codigo={a.codigo_unico} />
                <EtiquetaCategoria categoria={a.categoria_dato} />
              </span>
              <span className="mt-1 block font-medium text-slate-900">
                {a.nombre_referencia}
              </span>
              <span className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-slate-700">
                <PuntoEscurrimiento a={a} />
                <span>{ETIQUETA_ESTADO[a.estado]}</span>
              </span>
              <span className="mt-1.5 block text-xs text-slate-600">
                Última inspección: <CeldaLectura fecha={a.fecha_ultima_inspeccion} />
              </span>
            </button>
          </li>
        ))}
      </ul>

      <div className="hidden overflow-x-auto rounded-lg border border-slate-200 bg-white md:block">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs text-slate-600">
            <tr>
              <th className="px-3 py-2 font-medium">Código</th>
              <th className="px-3 py-2 font-medium">Atajadero</th>
              <th className="px-3 py-2 font-medium">Escurrimiento</th>
              <th className="px-3 py-2 font-medium">Estado</th>
              <th className="px-3 py-2 font-medium">Última inspección</th>
              <th className="px-3 py-2 font-medium">Categoría</th>
            </tr>
          </thead>
          <tbody>
            {atajaderos.map((a) => (
              <tr
                key={a.codigo_unico}
                onClick={() => onSeleccionar(a.codigo_unico)}
                className={`cursor-pointer border-t border-slate-100 ${
                  a.codigo_unico === seleccionado ? 'bg-teal-50/60' : 'hover:bg-slate-50'
                }`}
              >
                <td className="px-3 py-2.5">
                  <CodigoAtajadero codigo={a.codigo_unico} />
                </td>
                <td className="px-3 py-2.5">
                  <span className="block font-medium text-slate-900">
                    {a.nombre_referencia}
                  </span>
                  <span className="text-xs text-slate-500">
                    {a.cuenca_riacho} · {a.departamento}
                  </span>
                </td>
                <td className="px-3 py-2.5">
                  <PuntoEscurrimiento a={a} />
                </td>
                <td className="px-3 py-2.5 whitespace-nowrap">
                  {ETIQUETA_ESTADO[a.estado]}
                </td>
                <td className="px-3 py-2.5">
                  <CeldaLectura fecha={a.fecha_ultima_inspeccion} />
                </td>
                <td className="px-3 py-2.5">
                  <EtiquetaCategoria categoria={a.categoria_dato} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
