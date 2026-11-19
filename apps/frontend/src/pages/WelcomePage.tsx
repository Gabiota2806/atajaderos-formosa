import PrototypeBanner from '@/components/PrototypeBanner';
import { useAuth } from '@/context/AuthContext';
import { fetchHealth } from '@/lib/api';
import { HealthResponse } from '@/types';
import {
  ArrowRightIcon,
  MapPinIcon,
  MegaphoneIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

export default function WelcomePage() {
  const { user } = useAuth();
  const [health, setHealth] = useState<HealthResponse | null>(null);

  useEffect(() => {
    fetchHealth()
      .then((data) => setHealth(data))
      .catch(() => setHealth(null));
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900">
      <PrototypeBanner />

      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <MapPinIcon className="h-6 w-6 text-teal-700" aria-hidden="true" />
            <span className="text-base font-bold tracking-tight text-slate-900">
              Atajaderos Formosa · Operación Agua
            </span>
          </div>
          <nav className="flex flex-wrap items-center justify-end gap-2">
            <Link
              to="/reportar"
              className="inline-flex min-h-[44px] items-center gap-1.5 rounded-md border border-teal-700 px-4 py-2 text-sm font-semibold text-teal-800 hover:bg-teal-50"
            >
              <MegaphoneIcon className="h-4 w-4" aria-hidden="true" />
              Avisar un bloqueo
            </Link>
            <Link
              to={user ? '/dashboard' : '/login'}
              className="inline-flex items-center gap-1.5 rounded-md bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800"
            >
              {user ? 'Ir al tablero' : 'Ingresar al prototipo'}
              <ArrowRightIcon className="h-4 w-4" aria-hidden="true" />
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col justify-center px-6 py-12">
        <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-800">
          <ShieldCheckIcon className="h-4 w-4" aria-hidden="true" />
          Equipo 6 · Los Más Experimentados · UTN Extensión Áulica Formosa
        </span>

        <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          Inventario Territorial y Seguimiento de Atajaderos en Formosa
        </h1>

        <p className="mt-4 max-w-3xl text-base leading-relaxed text-slate-600">
          Prototipo diseñado para la mesa interinstitucional frente al fenómeno
          El Niño: organiza atajaderos con código único inmutable, criterios
          escritos de estado, evidencia fotográfica, historial de inspecciones y
          registro explícito de interrupción de escurrimiento en riachos.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Categoría de datos demo
            </p>
            <p className="mt-1 text-sm font-medium text-slate-900">
              SIMULADO / DATO DE PRUEBA
            </p>
            <p className="mt-1 text-xs text-slate-600">
              El relevamiento provincial oficial no está publicado; cada capa y
              registro declara su fuente y categoría.
            </p>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Decisión humana
            </p>
            <p className="mt-1 text-sm font-medium text-slate-900">
              Sin alertas ni estados automáticos
            </p>
            <p className="mt-1 text-xs text-slate-600">
              La aplicación no reemplaza inspecciones presenciales ni emite
              alertas oficiales.
            </p>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Estado del backend FastAPI
            </p>
            <p className="mt-1 text-sm font-medium text-slate-900">
              {health
                ? `Conectado (${health.ia_modo})`
                : 'Verificando conexión...'}
            </p>
            <p className="mt-1 text-xs text-slate-600">
              API REST + PostgreSQL 18 / PostGIS 3.7 dockerizado.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
