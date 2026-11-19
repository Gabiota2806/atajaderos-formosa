import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

export default function PrototypeBanner() {
  return (
    <div
      role="status"
      className="w-full border-b border-amber-300 bg-amber-50 px-4 py-2 text-amber-950"
    >
      <div className="mx-auto flex max-w-7xl items-center justify-center gap-2 text-center text-xs font-semibold tracking-wide sm:text-sm">
        <ExclamationTriangleIcon
          className="h-4 w-4 shrink-0 text-amber-700"
          aria-hidden="true"
        />
        <span>
          PROTOTIPO · AI LAB Misión: Código Formosa · no es una herramienta
          oficial
        </span>
      </div>
    </div>
  );
}
