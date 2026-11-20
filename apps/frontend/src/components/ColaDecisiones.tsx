import CodigoAtajadero from '@/components/CodigoAtajadero';
import { ItemDecision, MotivoDecision } from '@/lib/dominio';
import {
  ClockIcon,
  EyeSlashIcon,
  MapPinIcon,
  NoSymbolIcon,
} from '@heroicons/react/24/outline';
import { ComponentType, SVGProps } from 'react';

const ICONO: Record<
  MotivoDecision,
  { Icono: ComponentType<SVGProps<SVGSVGElement>>; clase: string }
> = {
  bloqueo_activo: { Icono: NoSymbolIcon, clase: 'bg-red-50 text-red-700' },
  sin_inspeccion: { Icono: EyeSlashIcon, clase: 'bg-amber-50 text-amber-800' },
  rezagada: { Icono: ClockIcon, clase: 'bg-slate-100 text-slate-700' },
};

interface ColaDecisionesProps {
  items: ItemDecision[];
  seleccionado: string | null;
  onSeleccionar: (codigo: string) => void;
}

// Bandeja de lo que espera una decisión humana de la mesa (Human-in-the-Loop).
export default function ColaDecisiones({
  items,
  seleccionado,
  onSeleccionar,
}: ColaDecisionesProps) {
  if (items.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-slate-300 px-3 py-6 text-center text-sm text-slate-600">
        Nada pendiente con los filtros actuales.
      </p>
    );
  }

  return (
    <ul className="space-y-2">
      {items.map(({ atajadero: a, motivo, titulo, detalle }) => {
        const { Icono, clase } = ICONO[motivo];
        const activo = a.codigo_unico === seleccionado;
        return (
          <li key={a.codigo_unico}>
            <button
              type="button"
              onClick={() => onSeleccionar(a.codigo_unico)}
              aria-current={activo}
              className={`presionable elevable flex w-full gap-3 rounded-xl border p-3 text-left ${
                activo
                  ? 'border-teal-600 bg-teal-50/80 ring-1 ring-teal-600/20'
                  : 'border-tinta/10 bg-white hover:border-tinta/20'
              }`}
            >
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${clase}`}
              >
                <Icono className="h-4 w-4" aria-hidden="true" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-1.5">
                  <CodigoAtajadero codigo={a.codigo_unico} />
                  <span className="text-sm font-semibold text-slate-900">
                    {titulo}
                  </span>
                </span>
                <span className="mt-1 block truncate text-sm text-slate-700">
                  {a.nombre_referencia}
                </span>
                <span className="mt-0.5 block text-xs text-slate-500">
                  {detalle}
                </span>
              </span>
              <MapPinIcon
                className="mt-1 h-4 w-4 shrink-0 text-slate-400"
                aria-label="Ver en mapa"
              />
            </button>
          </li>
        );
      })}
    </ul>
  );
}
