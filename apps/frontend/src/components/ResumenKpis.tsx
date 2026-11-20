import { estadoLectura } from '@/lib/dominio';
import { AtajaderoSummary } from '@/types';

interface Kpi {
  etiqueta: string;
  valor: number;
  clase: string;
}

// 4 KPIs de RF-FE-03, calculados sobre el inventario completo (no sobre lo filtrado),
// para que la mesa siempre vea el panorama general.
export default function ResumenKpis({
  atajaderos,
}: {
  atajaderos: AtajaderoSummary[];
}) {
  const kpis: Kpi[] = [
    {
      etiqueta: 'Inventario',
      valor: atajaderos.length,
      clase: 'text-slate-900',
    },
    {
      etiqueta: 'Interrumpen',
      valor: atajaderos.filter((a) => a.interrumpe_escurrimiento === 'si').length,
      clase: 'text-red-700',
    },
    {
      etiqueta: 'A verificar',
      valor: atajaderos.filter((a) => a.interrumpe_escurrimiento === 'a_verificar')
        .length,
      clase: 'text-amber-700',
    },
    {
      etiqueta: 'Sin lectura o rezagada',
      valor: atajaderos.filter(
        (a) => estadoLectura(a.fecha_ultima_inspeccion) !== 'al_dia',
      ).length,
      clase: 'text-slate-900',
    },
  ];

  const total = atajaderos.length || 1;
  // Color de la barra según el KPI: muestra qué parte del inventario representa.
  const BARRA: Record<string, string> = {
    Interrumpen: 'bg-red-600',
    'A verificar': 'bg-amber-500',
    'Sin lectura o rezagada': 'bg-slate-500',
  };

  return (
    <dl className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-2">
      {kpis.map((k) => (
        <div key={k.etiqueta} className="rounded-xl border border-tinta/5 bg-white/70 px-3 pb-2.5 pt-2">
          <dt className="text-xs leading-tight text-slate-600">{k.etiqueta}</dt>
          <dd className={`numero-ancho mt-0.5 text-[1.7rem] font-extrabold leading-none ${k.clase}`}>
            {k.valor}
            {BARRA[k.etiqueta] && (
              <span className="ml-1 align-baseline text-xs font-medium tracking-normal text-slate-400" style={{ fontStretch: '100%' }}>
                de {atajaderos.length}
              </span>
            )}
          </dd>
          {BARRA[k.etiqueta] && (
            <div className="mt-2 h-1 overflow-hidden rounded-full bg-slate-200" aria-hidden="true">
              <div
                className={`h-full rounded-full ${BARRA[k.etiqueta]}`}
                style={{ width: `${Math.round((k.valor / total) * 100)}%` }}
              />
            </div>
          )}
        </div>
      ))}
    </dl>
  );
}
