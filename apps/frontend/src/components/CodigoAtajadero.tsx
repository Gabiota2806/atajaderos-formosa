import { LockClosedIcon } from '@heroicons/react/24/outline';

// El código se muestra como "patente": fijo, monoespaciado y con candado,
// para comunicar que es inmutable (00_CORE_CONTRACTS.md §1.3).
export default function CodigoAtajadero({
  codigo,
  grande = false,
}: {
  codigo: string;
  grande?: boolean;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded border border-slate-400 bg-white font-mono font-semibold tracking-wide text-slate-900 ${
        grande ? 'px-2 py-0.5 text-sm' : 'px-1.5 text-xs'
      }`}
      title="Código único inmutable"
    >
      {codigo}
      <LockClosedIcon
        className={`${grande ? 'h-4 w-4' : 'h-3 w-3'} text-slate-500`}
        aria-label="inmutable"
      />
    </span>
  );
}
