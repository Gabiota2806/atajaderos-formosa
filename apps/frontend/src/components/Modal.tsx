import { ExclamationTriangleIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { PropsWithChildren, ReactNode, useEffect, useId, useRef } from 'react';

interface ModalProps {
  titulo: ReactNode;
  onCerrar: () => void;
  ancho?: 'md' | 'lg' | 'xl';
  // Contenido fijo al pie (acciones); el cuerpo scrollea entre header y pie.
  pie?: ReactNode;
}

const ANCHOS = { md: 'sm:max-w-lg', lg: 'sm:max-w-2xl', xl: 'sm:max-w-[1100px]' };

// Base de todos los modales: pantalla completa en móvil, centrado en escritorio,
// max-h-[92vh] con scroll interno (DoD del issue #6).
export default function Modal({
  titulo,
  onCerrar,
  ancho = 'lg',
  pie,
  children,
}: PropsWithChildren<ModalProps>) {
  const idTitulo = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const onCerrarRef = useRef(onCerrar);
  onCerrarRef.current = onCerrar;

  useEffect(() => {
    const anterior = document.activeElement as HTMLElement | null;
    panelRef.current?.focus();
    const alTeclear = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCerrarRef.current();
    };
    const overflowPrevio = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', alTeclear);
    return () => {
      window.removeEventListener('keydown', alTeclear);
      document.body.style.overflow = overflowPrevio;
      anterior?.focus();
    };
  }, []);

  return (
    <div
      className="fixed inset-0 z-[2000] flex items-stretch justify-center bg-slate-900/50 sm:items-center sm:p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onCerrar();
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={idTitulo}
        tabIndex={-1}
        className={`flex h-full w-full flex-col bg-white outline-none sm:h-auto sm:max-h-[92vh] sm:rounded-xl sm:shadow-2xl ${ANCHOS[ancho]}`}
      >
        {/* En móvil el modal tapa toda la pantalla: la leyenda obligatoria va adentro. */}
        <p className="flex items-center justify-center gap-1.5 border-b border-amber-300 bg-amber-50 px-3 py-1.5 text-center text-[11px] font-semibold text-amber-950 sm:hidden">
          <ExclamationTriangleIcon className="h-3.5 w-3.5 shrink-0 text-amber-700" aria-hidden="true" />
          PROTOTIPO · AI LAB Misión: Código Formosa · no es una herramienta oficial
        </p>
        <header className="flex items-start justify-between gap-3 border-b border-slate-200 px-4 py-3 sm:px-5">
          <div id={idTitulo} className="min-w-0 flex-1">
            {titulo}
          </div>
          <button
            type="button"
            onClick={onCerrar}
            className="-mr-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100"
            aria-label="Cerrar"
          >
            <XMarkIcon className="h-5 w-5" aria-hidden="true" />
          </button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
        {pie && (
          <footer className="border-t border-slate-200 px-4 py-3 sm:px-5">{pie}</footer>
        )}
      </div>
    </div>
  );
}
