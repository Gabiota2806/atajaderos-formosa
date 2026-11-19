import { COLOR_ESCURRIMIENTO } from '@/components/MapaAtajaderos';
import { ETIQUETA_ESCURRIMIENTO, ETIQUETA_ESTADO } from '@/lib/dominio';
import { EstadoAtajadero, InterrupcionEscurrimiento } from '@/types';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

export interface FiltrosTableroValor {
  escurrimiento: InterrupcionEscurrimiento[];
  estado: EstadoAtajadero | '';
  cuenca: string;
  q: string;
}

// Arranca mostrando solo lo urgente: la mesa entra a decidir qué intervenir.
export const FILTROS_INICIALES: FiltrosTableroValor = {
  escurrimiento: ['si', 'a_verificar'],
  estado: '',
  cuenca: '',
  q: '',
};

const OPCIONES_ESCURRIMIENTO: InterrupcionEscurrimiento[] = [
  'si',
  'a_verificar',
  'no',
];

interface FiltrosTableroProps {
  valor: FiltrosTableroValor;
  onCambiar: (valor: FiltrosTableroValor) => void;
  cuencas: string[];
}

export default function FiltrosTablero({
  valor,
  onCambiar,
  cuencas,
}: FiltrosTableroProps) {
  const alternarEscurrimiento = (opcion: InterrupcionEscurrimiento) => {
    const activo = valor.escurrimiento.includes(opcion);
    onCambiar({
      ...valor,
      escurrimiento: activo
        ? valor.escurrimiento.filter((o) => o !== opcion)
        : [...valor.escurrimiento, opcion],
    });
  };

  return (
    <div className="space-y-3">
      <label className="relative block">
        <span className="sr-only">Buscar atajadero</span>
        <MagnifyingGlassIcon
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
          aria-hidden="true"
        />
        <input
          type="search"
          value={valor.q}
          onChange={(e) => onCambiar({ ...valor, q: e.target.value })}
          placeholder="Código, paraje o riacho"
          className="min-h-[44px] w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
        />
      </label>

      <fieldset>
        <legend className="mb-1.5 text-xs font-medium text-slate-600">
          ¿Interrumpe el escurrimiento?
        </legend>
        <div className="flex flex-wrap gap-1.5">
          {OPCIONES_ESCURRIMIENTO.map((opcion) => {
            const activo = valor.escurrimiento.includes(opcion);
            return (
              <button
                key={opcion}
                type="button"
                aria-pressed={activo}
                onClick={() => alternarEscurrimiento(opcion)}
                className={`inline-flex min-h-[36px] items-center gap-1.5 rounded-full border px-3 text-sm transition-colors ${
                  activo
                    ? 'border-teal-600 bg-teal-50 text-teal-900'
                    : 'border-slate-300 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: COLOR_ESCURRIMIENTO[opcion] }}
                  aria-hidden="true"
                />
                {ETIQUETA_ESCURRIMIENTO[opcion]}
              </button>
            );
          })}
        </div>
      </fieldset>

      <div className="grid grid-cols-2 gap-2">
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-slate-600">
            Estado
          </span>
          <select
            value={valor.estado}
            onChange={(e) =>
              onCambiar({
                ...valor,
                estado: e.target.value as EstadoAtajadero | '',
              })
            }
            className="min-h-[44px] w-full rounded-lg border border-slate-300 bg-white px-2 text-sm text-slate-900"
          >
            <option value="">Todos</option>
            {(Object.keys(ETIQUETA_ESTADO) as EstadoAtajadero[]).map((e) => (
              <option key={e} value={e}>
                {ETIQUETA_ESTADO[e]}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-slate-600">
            Corredor / riacho
          </span>
          <select
            value={valor.cuenca}
            onChange={(e) => onCambiar({ ...valor, cuenca: e.target.value })}
            className="min-h-[44px] w-full rounded-lg border border-slate-300 bg-white px-2 text-sm text-slate-900"
          >
            <option value="">Todos</option>
            {cuencas.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
      </div>
    </div>
  );
}
