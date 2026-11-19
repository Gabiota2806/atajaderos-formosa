import PrototypeBanner from '@/components/PrototypeBanner';
import { useAuth } from '@/context/AuthContext';
import { LockClosedIcon, MapPinIcon } from '@heroicons/react/24/outline';
import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

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
      setError(
        err instanceof Error ? err.message : 'No se pudo iniciar sesión.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-slate-100">
      <PrototypeBanner />

      <div className="flex flex-1 flex-col items-center justify-center px-4 py-10">
        <Link
          to="/"
          className="mb-6 inline-flex items-center gap-2 text-lg font-bold text-slate-900"
        >
          <MapPinIcon className="h-6 w-6 text-teal-700" aria-hidden="true" />
          Atajaderos Formosa · Operación Agua
        </Link>

        <div className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2">
            <LockClosedIcon
              className="h-5 w-5 text-teal-700"
              aria-hidden="true"
            />
            <h1 className="text-lg font-semibold text-slate-900">
              Ingreso al prototipo
            </h1>
          </div>

          {error && (
            <div
              role="alert"
              className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-slate-700"
              >
                Correo electrónico
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="username"
                className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-xs focus:border-teal-600 focus:outline-none focus:ring-1 focus:ring-teal-600"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-slate-700"
              >
                Contraseña
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-xs focus:border-teal-600 focus:outline-none focus:ring-1 focus:ring-teal-600"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-md bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-60"
            >
              {submitting ? 'Ingresando...' : 'Ingresar'}
            </button>
          </form>

          <div className="mt-6 rounded-md border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700">
            <p className="font-semibold text-slate-900">
              Accesos de demostración (DATO DE PRUEBA · contraseña:{' '}
              <code className="rounded bg-slate-200 px-1 py-0.5">password</code>
              )
            </p>
            <div className="mt-2 flex flex-col gap-1.5">
              <button
                type="button"
                onClick={() => {
                  setEmail('inspector@atajaderos.ar');
                  setPassword('password');
                }}
                className="flex items-center justify-between rounded border border-slate-200 bg-white px-2.5 py-1.5 text-left hover:bg-slate-100"
              >
                <span className="font-medium text-slate-900">
                  Inspector de campo
                </span>
                <span className="text-slate-500">
                  inspector@atajaderos.ar
                </span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setEmail('referente@atajaderos.ar');
                  setPassword('password');
                }}
                className="flex items-center justify-between rounded border border-slate-200 bg-white px-2.5 py-1.5 text-left hover:bg-slate-100"
              >
                <span className="font-medium text-slate-900">
                  Referente de mesa
                </span>
                <span className="text-slate-500">
                  referente@atajaderos.ar
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
