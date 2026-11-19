import { MapPinIcon } from '@heroicons/react/24/solid';
import { Link } from 'react-router-dom';

// Identidad compartida: el mismo pin de siempre, con composición propia.
export default function Marca({
  a = '/',
  invertida = false,
  subtitulo = true,
}: {
  a?: string;
  invertida?: boolean;
  subtitulo?: boolean;
}) {
  return (
    <Link to={a} className="group inline-flex items-center gap-2.5" aria-label="Atajaderos Formosa, inicio">
      <span
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] ${
          invertida ? 'bg-white/10 ring-1 ring-white/20' : 'bg-teal-700 shadow-sm shadow-teal-900/20'
        }`}
      >
        <MapPinIcon className="h-5 w-5 text-white" aria-hidden="true" />
      </span>
      <span className="leading-none">
        <span
          className={`titulo-ancho block text-[15px] font-extrabold ${invertida ? 'text-white' : 'text-tinta'}`}
        >
          Atajaderos Formosa
        </span>
        {subtitulo && (
          <span className={`mt-1 block text-xs ${invertida ? 'text-teal-100/80' : 'text-slate-500'}`}>
            Operación Agua
          </span>
        )}
      </span>
    </Link>
  );
}
