import { CategoriaDato } from '@/types';

// SIMULADO lleva borde punteado: se lee como "no firme" a simple vista.
const CLASES: Record<CategoriaDato, string> = {
  SIMULADO: 'border-dashed border-amber-600 text-amber-800',
  OBSERVADO: 'border-solid border-sky-600 text-sky-800',
  REFERENCIA: 'border-solid border-slate-400 text-slate-700',
};

export default function EtiquetaCategoria({
  categoria,
}: {
  categoria: CategoriaDato;
}) {
  return (
    <span
      className={`inline-flex rounded border bg-white px-1.5 text-[11px] font-semibold tracking-wide ${CLASES[categoria]}`}
    >
      {categoria}
    </span>
  );
}
