import ColaDecisiones from '@/components/ColaDecisiones';
import CopilotoIaPanel from '@/components/CopilotoIaPanel';
import DetalleAtajaderoModal from '@/components/DetalleAtajaderoModal';
import FichaResumen from '@/components/FichaResumen';
import FormularioAtajaderoModal from '@/components/FormularioAtajaderoModal';
import FormularioInspeccionModal from '@/components/FormularioInspeccionModal';
import ImportarKoboModal from '@/components/ImportarKoboModal';
import FiltrosTablero, {
  FILTROS_INICIALES,
  FiltrosTableroValor,
} from '@/components/FiltrosTablero';
import MapaAtajaderos from '@/components/MapaAtajaderos';
import PrototypeBanner from '@/components/PrototypeBanner';
import ResumenKpis from '@/components/ResumenKpis';
import TablaAtajaderos from '@/components/TablaAtajaderos';
import { useAuth } from '@/context/AuthContext';
import { descargarGeojson, fetchAtajaderos } from '@/lib/api';
import { armarColaDecisiones } from '@/lib/dominio';
import { AtajaderoSummary } from '@/types';
import type { FeatureCollection } from 'geojson';
import {
  ArrowDownTrayIcon,
  ArrowPathIcon,
  ArrowRightOnRectangleIcon,
  ArrowUpTrayIcon,
  MapIcon,
  MapPinIcon,
  PlusIcon,
  TableCellsIcon,
} from '@heroicons/react/24/outline';
import { useCallback, useEffect, useMemo, useState } from 'react';

type Vista = 'mapa' | 'tabla';

// Un único modal abierto por vez: nunca se apilan.
type ModalAbierto =
  | { tipo: 'detalle'; codigo: string }
  | { tipo: 'inspeccion'; atajadero: AtajaderoSummary }
  | { tipo: 'alta' }
  | { tipo: 'kobo' }
  | null;

// Trazas REFERENCIA de los 4 corredores: las provee Facundo (módulo 03) en
// src/data/riachosFormosaGeoJson.ts. No se importa todavía porque el archivo
// aún no existe en develop y rompería tsc. Al integrarlo, reemplazar por:
//   import { RIACHOS_FORMOSA_GEOJSON } from '@/data/riachosFormosaGeoJson';
//   const RIACHOS = RIACHOS_FORMOSA_GEOJSON;
const RIACHOS: FeatureCollection | null = null;

function aplicarFiltros(
  atajaderos: AtajaderoSummary[],
  f: FiltrosTableroValor,
): AtajaderoSummary[] {
  const texto = f.q.trim().toLowerCase();
  return atajaderos.filter(
    (a) =>
      f.escurrimiento.includes(a.interrumpe_escurrimiento) &&
      (!f.estado || a.estado === f.estado) &&
      (!f.cuenca || a.cuenca_riacho === f.cuenca) &&
      (!texto ||
        `${a.codigo_unico} ${a.nombre_referencia} ${a.cuenca_riacho} ${a.departamento}`
          .toLowerCase()
          .includes(texto)),
  );
}

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const [atajaderos, setAtajaderos] = useState<AtajaderoSummary[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filtros, setFiltros] = useState<FiltrosTableroValor>(FILTROS_INICIALES);
  const [seleccionado, setSeleccionado] = useState<string | null>(null);
  const [vista, setVista] = useState<Vista>('mapa');
  const [modal, setModal] = useState<ModalAbierto>(null);
  const [versionDetalle, setVersionDetalle] = useState(0);
  const responsable = user?.name ?? 'Usuario autenticado';

  const cargar = useCallback(() => {
    setCargando(true);
    setError(null);
    // Se trae el inventario completo una vez: los chips de escurrimiento son
    // multi-selección y el endpoint acepta un único valor por filtro.
    fetchAtajaderos()
      .then((r) => setAtajaderos(r.items))
      .catch((e: unknown) =>
        setError(e instanceof Error ? e.message : 'No se pudo cargar el inventario.'),
      )
      .finally(() => setCargando(false));
  }, []);

  useEffect(cargar, [cargar]);

  const filtrados = useMemo(
    () => aplicarFiltros(atajaderos, filtros),
    [atajaderos, filtros],
  );
  const cola = useMemo(() => armarColaDecisiones(filtrados), [filtrados]);
  const cuencas = useMemo(
    () => [...new Set(atajaderos.map((a) => a.cuenca_riacho))].sort(),
    [atajaderos],
  );
  const actual = atajaderos.find((a) => a.codigo_unico === seleccionado) ?? null;

  const verEnMapa = (codigo: string) => {
    setSeleccionado(codigo);
    setVista('mapa');
  };

  const verFicha = (codigo: string) => {
    setSeleccionado(codigo);
    setModal({ tipo: 'detalle', codigo });
  };

  const modales = (() => {
    if (!modal) return null;
    switch (modal.tipo) {
      case 'detalle':
        return (
          <DetalleAtajaderoModal
            codigo={modal.codigo}
            version={versionDetalle}
            onCerrar={() => setModal(null)}
            onNuevaInspeccion={(a) => setModal({ tipo: 'inspeccion', atajadero: a })}
          />
        );
      case 'inspeccion':
        return (
          <FormularioInspeccionModal
            atajadero={modal.atajadero}
            responsable={responsable}
            onCerrar={() => setModal({ tipo: 'detalle', codigo: modal.atajadero.codigo_unico })}
            onGuardado={() => {
              setVersionDetalle((v) => v + 1);
              cargar();
              setModal({ tipo: 'detalle', codigo: modal.atajadero.codigo_unico });
            }}
          />
        );
      case 'alta':
        return (
          <FormularioAtajaderoModal
            onCerrar={() => setModal(null)}
            onCreado={(a) => {
              cargar();
              verFicha(a.codigo_unico);
            }}
          />
        );
      case 'kobo':
        return (
          <ImportarKoboModal
            responsable={responsable}
            onCerrar={() => setModal(null)}
            onImportado={cargar}
          />
        );
    }
  })();

  const botonVista = (valor: Vista, etiqueta: string, Icono: typeof MapIcon) => (
    <button
      type="button"
      onClick={() => setVista(valor)}
      aria-pressed={vista === valor}
      className={`inline-flex min-h-[40px] items-center gap-1.5 rounded-md px-3 text-sm font-medium ${
        vista === valor
          ? 'bg-white text-slate-900 shadow-sm'
          : 'text-slate-600 hover:text-slate-900'
      }`}
    >
      <Icono className="h-4 w-4" aria-hidden="true" />
      {etiqueta}
    </button>
  );

  const panelTriage = (
    <>
      <ResumenKpis atajaderos={atajaderos} />
      <CopilotoIaPanel modo="resumir_triage_mesa" />
      <FiltrosTablero valor={filtros} onCambiar={setFiltros} cuencas={cuencas} />
      <div>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-900">Requiere decisión</h2>
          <span className="rounded-full bg-teal-700 px-2 py-0.5 text-xs font-semibold text-white">
            {cola.length}
          </span>
        </div>
        <ColaDecisiones
          items={cola}
          seleccionado={seleccionado}
          onSeleccionar={setSeleccionado}
        />
      </div>
    </>
  );

  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden bg-slate-50 text-slate-900 lg:h-screen">
      <PrototypeBanner />

      <header className="border-b border-slate-200 bg-white">
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-3">
          <div className="flex items-center gap-2">
            <MapPinIcon className="h-6 w-6 text-teal-700" aria-hidden="true" />
            <span className="text-base font-bold text-slate-900">
              Tablero territorial de atajaderos
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex rounded-lg bg-slate-100 p-1">
              {botonVista('mapa', 'Mapa', MapIcon)}
              {botonVista('tabla', 'Tabla', TableCellsIcon)}
            </div>
            <button
              type="button"
              onClick={() => setModal({ tipo: 'alta' })}
              className="inline-flex min-h-[44px] items-center gap-1.5 rounded-lg bg-teal-700 px-3 text-sm font-semibold text-white hover:bg-teal-800"
            >
              <PlusIcon className="h-4 w-4" aria-hidden="true" />
              Nuevo atajadero
            </button>
            <button
              type="button"
              onClick={() => setModal({ tipo: 'kobo' })}
              className="inline-flex min-h-[44px] items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
              title="Importar relevamiento KoboToolbox / QField"
            >
              <ArrowUpTrayIcon className="h-4 w-4" aria-hidden="true" />
              Kobo
            </button>
            <button
              type="button"
              onClick={() => void descargarGeojson()}
              className="inline-flex min-h-[44px] items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
              title="Descargar GeoJSON para QGIS / QField"
            >
              <ArrowDownTrayIcon className="h-4 w-4" aria-hidden="true" />
              GeoJSON
            </button>
            <span className="hidden rounded-full bg-teal-50 px-2.5 py-1 text-xs font-medium text-teal-800 sm:inline">
              {user?.role === 'referente_mesa' ? 'Referente de mesa' : 'Inspector de campo'}
            </span>
            <button
              type="button"
              onClick={logout}
              className="inline-flex min-h-[44px] items-center gap-1 rounded-lg px-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
            >
              <ArrowRightOnRectangleIcon className="h-4 w-4" aria-hidden="true" />
              Salir
            </button>
          </div>
        </div>
      </header>

      {error ? (
        <div className="m-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <p className="font-semibold">No se pudo cargar el inventario</p>
          <p className="mt-1">{error}</p>
          <button
            type="button"
            onClick={cargar}
            className="mt-3 inline-flex min-h-[44px] items-center gap-1.5 rounded-lg border border-red-300 bg-white px-3 font-medium hover:bg-red-100"
          >
            <ArrowPathIcon className="h-4 w-4" aria-hidden="true" />
            Reintentar
          </button>
        </div>
      ) : vista === 'tabla' ? (
        <main className="mx-auto w-full max-w-7xl flex-1 space-y-4 p-4 lg:overflow-y-auto">
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
            <ResumenKpis atajaderos={atajaderos} />
            <FiltrosTablero valor={filtros} onCambiar={setFiltros} cuencas={cuencas} />
          </div>
          <p className="text-sm text-slate-600">
            {filtrados.length} de {atajaderos.length} atajaderos · tocá una fila
            para verla en el mapa
          </p>
          <TablaAtajaderos
            atajaderos={filtrados}
            seleccionado={seleccionado}
            onSeleccionar={verEnMapa}
          />
        </main>
      ) : (
        // Móvil: mapa arriba con altura fija y paneles apilados debajo (RF-FE-07).
        // Escritorio: mapa como lienzo completo y paneles flotando encima.
        <main className="flex flex-col lg:relative lg:min-h-0 lg:flex-1">
          <div className="relative h-[380px] sm:h-[460px] lg:absolute lg:inset-0 lg:h-auto">
            <MapaAtajaderos
              atajaderos={filtrados}
              seleccionado={seleccionado}
              onSeleccionar={setSeleccionado}
              onVerFicha={verFicha}
              riachosGeoJson={RIACHOS}
              className="absolute inset-0"
            />
            {cargando && (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/60 text-sm font-medium text-slate-700">
                Cargando inventario…
              </div>
            )}
          </div>

          {actual && (
            <div className="px-4 pt-4 lg:absolute lg:right-4 lg:top-16 lg:z-10 lg:max-h-[calc(100%-9rem)] lg:w-[340px] lg:overflow-y-auto lg:p-0">
              <FichaResumen
                atajadero={actual}
                onCerrar={() => setSeleccionado(null)}
                onVerFicha={verFicha}
              />
            </div>
          )}

          <aside
            aria-label="Triage de la mesa"
            className="space-y-4 p-4 lg:absolute lg:bottom-4 lg:left-4 lg:top-4 lg:z-10 lg:w-[380px] lg:overflow-y-auto lg:rounded-xl lg:border lg:border-slate-200 lg:bg-white lg:shadow-lg"
          >
            {panelTriage}
          </aside>
        </main>
      )}

      {modales}
    </div>
  );
}
