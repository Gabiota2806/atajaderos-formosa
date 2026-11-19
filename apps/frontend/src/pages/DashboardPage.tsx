import PrototypeBanner from '@/components/PrototypeBanner';
import { useAuth } from '@/context/AuthContext';
import {
  ArrowRightOnRectangleIcon,
  MapPinIcon,
  UserCircleIcon,
} from '@heroicons/react/24/outline';

export default function DashboardPage() {
  const { user, logout } = useAuth();

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900">
      <PrototypeBanner />

      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <MapPinIcon className="h-6 w-6 text-teal-700" aria-hidden="true" />
            <span className="text-base font-bold text-slate-900">
              Tablero Territorial de Atajaderos
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-slate-700">
              <UserCircleIcon
                className="h-5 w-5 text-slate-500"
                aria-hidden="true"
              />
              <span>{user?.name}</span>
              <span className="rounded-full bg-teal-50 px-2 py-0.5 text-xs font-medium text-teal-800">
                {user?.role === 'referente_mesa'
                  ? 'Referente de mesa'
                  : 'Inspector de campo'}
              </span>
            </div>

            <button
              type="button"
              onClick={logout}
              className="inline-flex items-center gap-1 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100"
            >
              <ArrowRightOnRectangleIcon
                className="h-4 w-4"
                aria-hidden="true"
              />
              Salir
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl flex-1 px-6 py-8">
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h1 className="text-xl font-semibold text-slate-900">
              Base lista para el módulo de inventario y mapa Leaflet
            </h1>
            <span className="rounded border border-amber-300 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-900">
              SIMULADO / DATO DE PRUEBA
            </span>
          </div>
          <p className="mt-2 text-sm text-slate-600">
            Sesión autenticada correctamente contra el backend FastAPI +
            PostgreSQL 18. Los siguientes GitHub Issues incorporarán el mapa
            interactivo Leaflet, el alta con código único inmutable, el
            historial de inspecciones con evidencia fotográfica y el asistente IA
            Human-in-the-Loop.
          </p>
        </div>
      </main>
    </div>
  );
}
