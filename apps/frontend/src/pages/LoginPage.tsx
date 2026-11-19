import CurvasDeNivel from '@/components/CurvasDeNivel';
import Marca from '@/components/Marca';
import PrototypeBanner from '@/components/PrototypeBanner';
import { useAuth } from '@/context/AuthContext';
import {
  ArrowLeftIcon,
  ClipboardDocumentCheckIcon,
  ExclamationCircleIcon,
  MegaphoneIcon,
  PresentationChartLineIcon,
} from '@heroicons/react/24/outline';
import { ComponentType, FormEvent, SVGProps, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

// Usuarios de demostración precargados por el seed (DATO DE PRUEBA).
const PERFILES_DEMO: {
  rol: string;
  email: string;
  detalle: string;
  Icono: ComponentType<SVGProps<SVGSVGElement>>;
}[] = [
  {
    rol: 'Inspector de campo',
    email: 'inspector@atajaderos.ar',
    detalle: 'Releva en el lugar: inspecciones, fotos y estado.',
    Icono: ClipboardDocumentCheckIcon,
  },
  {
    rol: 'Referente de mesa',
    email: 'referente@atajaderos.ar',
    detalle: 'Prioriza desde el tablero qué intervenir primero.',
    Icono: PresentationChartLineIcon,
  },
];

const CLASE_INPUT =
  'mt-1.5 block min-h-[48px] w-full rounded-xl border border-slate-300 bg-white px-3.5 text-base text-tinta shadow-xs transition-[border-color,box-shadow] duration-150 placeholder:text-slate-400 focus:border-teal-600 focus:outline-none focus:ring-4 focus:ring-teal-600/15';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo iniciar sesión.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-papel">
      <PrototypeBanner />

      <div className="grid flex-1 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
        {/* Panel cartográfico: solo en escritorio, en móvil sería peso sin función. */}
        <aside className="relative hidden overflow-hidden bg-tinta lg:flex lg:flex-col lg:justify-between lg:p-10">
          <CurvasDeNivel className="absolute inset-0 h-full w-full" />
          <div className="relative">
            <Marca invertida />
          </div>
          <div className="relative max-w-md">
            <p className="titulo-ancho text-3xl font-extrabold leading-tight text-white">
              El dato que importa frente a El Niño: si el agua puede seguir su curso.
            </p>
            <p className="mt-4 leading-relaxed text-teal-50/75">
              Inventario trazable de atajaderos de Formosa, con código único, criterio escrito y
              evidencia de cada inspección.
            </p>
          </div>
        </aside>

        <main className="flex flex-col items-center justify-center px-4 py-10 sm:px-8">
          <div className="mb-8 lg:hidden">
            <Marca />
          </div>

          <div className="w-full max-w-md">
            <Link
              to="/"
              className="presionable -ml-2 mb-6 inline-flex min-h-[44px] items-center gap-1.5 rounded-lg px-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 hover:text-tinta"
            >
              <ArrowLeftIcon className="h-4 w-4" aria-hidden="true" />
              Volver al inicio
            </Link>
            <h1 className="titulo-ancho text-3xl font-extrabold text-tinta">Ingresar</h1>
            <p className="mt-2 text-slate-600">Accedé al tablero de la mesa o a la carga de campo.</p>

            {error && (
              <div
                role="alert"
                className="entrada-suave mt-5 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3.5 py-3 text-sm text-red-800"
              >
                <ExclamationCircleIcon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-tinta">
                  Correo electrónico
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="username"
                  placeholder="nombre@atajaderos.ar"
                  className={CLASE_INPUT}
                />
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-tinta">
                  Contraseña
                </label>
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  className={CLASE_INPUT}
                />
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="presionable min-h-[52px] w-full rounded-xl bg-teal-700 px-4 text-base font-semibold text-white shadow-lg shadow-teal-900/15 hover:bg-teal-800 disabled:opacity-60"
              >
                {submitting ? 'Ingresando…' : 'Ingresar'}
              </button>
            </form>

            <section className="mt-8" aria-labelledby="titulo-demo">
              <div className="flex items-baseline justify-between gap-2">
                <h2 id="titulo-demo" className="text-sm font-semibold text-tinta">
                  Perfiles de demostración
                </h2>
                <span className="text-xs text-slate-500">
                  DATO DE PRUEBA, contraseña <code className="rounded bg-slate-200 px-1">password</code>
                </span>
              </div>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {PERFILES_DEMO.map(({ rol, email: correo, detalle, Icono }) => {
                  const activo = email === correo;
                  return (
                    <button
                      key={correo}
                      type="button"
                      onClick={() => {
                        setEmail(correo);
                        setPassword('password');
                        setError(null);
                      }}
                      aria-pressed={activo}
                      className={`presionable elevable rounded-xl border p-3.5 text-left ${
                        activo ? 'border-teal-600 bg-teal-50/70' : 'border-slate-200 bg-white'
                      }`}
                    >
                      <Icono className={`h-5 w-5 ${activo ? 'text-teal-700' : 'text-slate-500'}`} aria-hidden="true" />
                      <span className="mt-2 block font-semibold text-tinta">{rol}</span>
                      <span className="mt-0.5 block text-sm leading-snug text-slate-600">{detalle}</span>
                    </button>
                  );
                })}
              </div>
            </section>

            <Link
              to="/reportar"
              className="presionable mt-8 flex items-center gap-3 rounded-xl border border-dashed border-slate-300 p-4 text-sm hover:border-teal-600"
            >
              <MegaphoneIcon className="h-5 w-5 shrink-0 text-teal-700" aria-hidden="true" />
              <span>
                <span className="block font-semibold text-tinta">¿Viste un posible bloqueo?</span>
                <span className="text-slate-600">Avisá sin registrarte.</span>
              </span>
            </Link>
          </div>
        </main>
      </div>
    </div>
  );
}
