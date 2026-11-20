import { departamentoInconsistente } from '@/geo/departamentos';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

// Control de rigor: si las coordenadas caen en otro departamento que el
// declarado (según los límites del IGN), se avisa en lugar de esconderlo.
export default function AvisoDepartamento({
  atajadero,
}: {
  atajadero: { latitud: number; longitud: number; departamento: string };
}) {
  const real = departamentoInconsistente(atajadero);
  if (!real) return null;
  return (
    <p
      role="note"
      className="mt-2 flex items-start gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-xs leading-snug text-amber-900"
    >
      <ExclamationTriangleIcon className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      <span>
        Según los límites del IGN, la ubicación cae en <strong>{real}</strong>, no en{' '}
        {atajadero.departamento} (dato declarado). Revisar coordenadas o departamento.
      </span>
    </p>
  );
}
