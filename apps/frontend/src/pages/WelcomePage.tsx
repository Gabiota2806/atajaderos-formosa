import CorteAtajadero from '@/components/CorteAtajadero';
import EtiquetaCategoria from '@/components/EtiquetaCategoria';
import Marca from '@/components/Marca';
import PrototypeBanner from '@/components/PrototypeBanner';
import { useAuth } from '@/context/AuthContext';
import { fetchHealth } from '@/lib/api';
import { CategoriaDato, HealthResponse } from '@/types';
import { MegaphoneIcon } from '@heroicons/react/24/outline';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

// Es una secuencia real (aviso -> inspección -> decisión): por eso va numerada.
const RECORRIDO = [
  {
    titulo: 'Un vecino avisa',
    texto:
      'Desde el celular, sin usuario y aunque no haya señal: el aviso se guarda y se envía solo al volver la conexión.',
  },
  {
    titulo: 'Un inspector verifica en el lugar',
    texto:
      'Foto con sello SHA-256, estado elegido según un criterio escrito y el dato clave: si el atajadero corta el escurrimiento.',
  },
  {
    titulo: 'La mesa decide qué intervenir',
    texto:
      'El tablero ordena primero los bloqueos activos. El copiloto resume y sugiere; la decisión siempre la firma una persona.',
  },
];

const CATEGORIAS: { categoria: CategoriaDato; texto: string }[] = [
  { categoria: 'OBSERVADO', texto: 'Medido o relevado: inspecciones en campo e imágenes satelitales.' },
  { categoria: 'REFERENCIA', texto: 'Fuentes oficiales de contexto, como la cartografía del IGN.' },
  {
    categoria: 'SIMULADO',
    texto:
      'Datos de prueba para la demo: el relevamiento provincial oficial todavía no está publicado.',
  },
];

const LIMITES = [
  'No reemplaza la inspección presencial.',
  'No asigna estados técnicos sin un criterio escrito y validado.',
  'No emite alertas ni pronósticos oficiales.',
];

export default function WelcomePage() {
  const { user } = useAuth();
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [sinApi, setSinApi] = useState(false);

  useEffect(() => {
    fetchHealth()
      .then(setHealth)
      .catch(() => setSinApi(true));
  }, []);

  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden bg-papel text-tinta">
      <PrototypeBanner />

      <header className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6">
        <Marca />
        <nav className="flex flex-wrap items-center gap-2">
          <Link
            to="/reportar"
            className="presionable inline-flex min-h-[44px] items-center gap-1.5 rounded-xl px-3 text-sm font-semibold text-teal-800 hover:bg-teal-50"
          >
            <MegaphoneIcon className="h-4 w-4" aria-hidden="true" />
            Avisar un bloqueo
          </Link>
          <Link
            to={user ? '/dashboard' : '/login'}
            className="presionable inline-flex min-h-[44px] items-center rounded-xl bg-tinta px-4 text-sm font-semibold text-white hover:bg-teal-900"
          >
            {user ? 'Ir al tablero' : 'Ingresar'}
          </Link>
        </nav>
      </header>

      <main className="flex-1">
        <section className="mx-auto grid w-full max-w-6xl items-center gap-10 px-4 pb-16 pt-6 sm:px-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:pt-12">
          <div>
            <h1 className="titulo-ancho text-[2.4rem] font-extrabold leading-[1.02] text-tinta sm:text-5xl lg:text-[3.4rem]">
              Saber qué atajaderos cortan el agua, antes de que llueva.
            </h1>
            <p className="mt-5 max-w-[34rem] text-lg leading-relaxed text-slate-700">
              Un inventario trazable de los atajaderos de Formosa: dónde están, en qué estado y si
              interrumpen el escurrimiento de los riachos frente a El Niño.
            </p>
            {/* flex-wrap + nowrap: si no entran juntos, el segundo baja entero
                en vez de partir el texto en dos líneas. */}
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to={user ? '/dashboard' : '/login'}
                className="presionable inline-flex min-h-[52px] w-full items-center justify-center whitespace-nowrap rounded-xl bg-teal-700 px-6 text-base font-semibold text-white shadow-lg shadow-teal-900/15 hover:bg-teal-800 sm:w-auto"
              >
                {user ? 'Ir al tablero' : 'Ingresar al tablero'}
              </Link>
              <Link
                to="/reportar"
                className="presionable inline-flex min-h-[52px] w-full items-center justify-center gap-2 whitespace-nowrap rounded-xl border border-tinta/15 bg-white px-6 text-base font-semibold text-tinta hover:border-tinta/30 sm:w-auto"
              >
                <MegaphoneIcon className="h-5 w-5" aria-hidden="true" />
                Avisar un posible bloqueo
              </Link>
            </div>
            <p className="mt-4 text-sm text-slate-500">
              Para avisar no hace falta usuario.
            </p>
          </div>

          <CorteAtajadero />
        </section>

        <section className="border-y border-tinta/10 bg-white">
          <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6">
            <h2 className="titulo-ancho text-2xl font-extrabold sm:text-3xl">Del aviso a la decisión</h2>
            <ol className="mt-10 grid gap-10 md:grid-cols-3 md:gap-8">
              {RECORRIDO.map((paso, i) => (
                <li key={paso.titulo} className="relative">
                  <span className="numero-ancho block text-5xl font-black text-teal-700/90">{i + 1}</span>
                  {/* Trazo de cauce que une los pasos en escritorio */}
                  {i < RECORRIDO.length - 1 && (
                    <span
                      className="absolute left-14 right-[-1rem] top-6 hidden border-t-2 border-dashed border-agua/30 md:block"
                      aria-hidden="true"
                    />
                  )}
                  <h3 className="mt-4 text-lg font-bold text-tinta">{paso.titulo}</h3>
                  <p className="mt-2 max-w-sm leading-relaxed text-slate-600">{paso.texto}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="mx-auto grid w-full max-w-6xl gap-12 px-4 py-16 sm:px-6 lg:grid-cols-2">
          <div>
            <h2 className="titulo-ancho text-2xl font-extrabold sm:text-3xl">Cada dato dice de dónde sale</h2>
            <p className="mt-3 max-w-lg leading-relaxed text-slate-600">
              Toda capa y todo registro llevan su categoría a la vista. Lo simulado nunca se mezcla con
              lo oficial.
            </p>
            <ul className="mt-8 space-y-4">
              {CATEGORIAS.map(({ categoria, texto }) => (
                <li key={categoria} className="flex items-start gap-4">
                  <span className="mt-0.5 w-28 shrink-0">
                    <EtiquetaCategoria categoria={categoria} />
                  </span>
                  <span className="leading-relaxed text-slate-700">{texto}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl bg-tinta p-6 text-white sm:p-8">
            <h2 className="titulo-ancho text-2xl font-extrabold">Lo que esta herramienta no hace</h2>
            <ul className="mt-6 space-y-4">
              {LIMITES.map((l) => (
                <li key={l} className="flex gap-3 leading-relaxed text-teal-50/90">
                  <span className="mt-2.5 h-px w-4 shrink-0 bg-teal-300" aria-hidden="true" />
                  {l}
                </li>
              ))}
            </ul>
            <p className="mt-6 leading-relaxed text-teal-50/70">
              Toda decisión operativa queda bajo responsabilidad humana.
            </p>
          </div>
        </section>
      </main>

      <footer className="border-t border-tinta/10">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-4 py-6 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>Equipo 6, Los Más Experimentados. UTN Extensión Áulica Formosa.</p>
          <p className="flex items-center gap-2">
            <span
              className={`h-2 w-2 rounded-full ${health ? 'bg-green-600' : sinApi ? 'bg-red-500' : 'bg-slate-300'}`}
              aria-hidden="true"
            />
            {health
              ? `Servidor conectado, IA en modo ${health.ia_modo === 'ia_asistida' ? 'asistida' : 'determinístico offline'}`
              : sinApi
                ? 'Servidor sin conexión'
                : 'Verificando el servidor'}
          </p>
        </div>
      </footer>
    </div>
  );
}
