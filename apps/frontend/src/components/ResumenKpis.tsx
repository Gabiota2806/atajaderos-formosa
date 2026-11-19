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

  return (
    <dl className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-2">
      {kpis.map((k) => (
        <div key={k.etiqueta} className="rounded-lg bg-slate-100 px-3 py-2">
          <dt className="text-xs text-slate-600">{k.etiqueta}</dt>
          <dd className={`text-2xl font-semibold ${k.clase}`}>{k.valor}</dd>
        </div>
      ))}
    </dl>
  );
}
