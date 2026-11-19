import ColaDecisiones from '@/components/ColaDecisiones';
import CopilotoIaPanel from '@/components/CopilotoIaPanel';
import DetalleAtajaderoModal from '@/components/DetalleAtajaderoModal';
import FichaResumen from '@/components/FichaResumen';
import FormularioAtajaderoModal from '@/components/FormularioAtajaderoModal';
import FormularioInspeccionModal from '@/components/FormularioInspeccionModal';
import ImportarKoboModal from '@/components/ImportarKoboModal';
import Marca from '@/components/Marca';
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
import { RIACHOS_FORMOSA_GEOJSON } from '@/data/riachosFormosaGeoJson';
import { useTema } from '@/lib/useTema';
import { AtajaderoSummary } from '@/types';
import type { FeatureCollection } from 'geojson';
import {
  ArrowDownTrayIcon,
  ArrowPathIcon,
  ArrowRightOnRectangleIcon,
  ArrowUpTrayIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  MapIcon,
  MoonIcon,
  PlusIcon,
  SunIcon,
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

// Trazas REFERENCIA de los 4 corredores de Formosa (módulo 03).
const RIACHOS: FeatureCollection | null = RIACHOS_FORMOSA_GEOJSON;

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
  const { tema, alternar } = useTema();

  // Panel de triage plegable (solo escritorio) para ver el mapa libre.
  const [panelOculto, setPanelOculto] = useState(() => {
    try {
      return localStorage.getItem('atajaderos_panel_oculto') === '1';
    } catch {
      return false;
    }
  });
  const alternarPanel = () =>
    setPanelOculto((oculto) => {
      try {
        localStorage.setItem('atajaderos_panel_oculto', oculto ? '0' : '1');
      } catch {
        // sin persistencia: no es crítico
      }
      return !oculto;
    });

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
      className={`presionable inline-flex min-h-[40px] items-center gap-1.5 rounded-lg px-3 text-sm font-semibold ${
        vista === valor
          ? 'bg-white text-tinta shadow-sm'
          : 'text-slate-600 hover:text-tinta'
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
        <div className="mb-2.5 flex items-center justify-between">
          <h2 className="titulo-ancho text-base font-extrabold text-tinta">Requiere decisión</h2>
          <span className="numero-ancho rounded-full bg-tinta px-2.5 py-0.5 text-xs font-bold text-white">
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
    <div
      className={`flex min-h-screen flex-col overflow-x-hidden bg-papel text-tinta lg:h-screen ${
        tema === 'oscuro' ? 'oscuro' : ''
      }`}
    >
      <PrototypeBanner />

      <header className="relative z-20 border-b border-tinta/10 bg-white">
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-2.5">
          <div className="flex items-center gap-4">
            <Marca a="/dashboard" subtitulo={false} />
            <span className="hidden border-l border-tinta/10 pl-4 text-sm text-slate-500 md:inline">
              Tablero territorial
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex rounded-xl bg-slate-100 p-1">
              {botonVista('mapa', 'Mapa', MapIcon)}
              {botonVista('tabla', 'Tabla', TableCellsIcon)}
            </div>
            <button
              type="button"
              onClick={() => setModal({ tipo: 'alta' })}
              className="presionable inline-flex min-h-[44px] items-center gap-1.5 rounded-xl bg-teal-700 px-3.5 text-sm font-semibold text-white shadow-sm shadow-teal-900/20 hover:bg-teal-800"
            >
              <PlusIcon className="h-4 w-4" aria-hidden="true" />
              Nuevo atajadero
            </button>
            <button
              type="button"
              onClick={() => setModal({ tipo: 'kobo' })}
              className="presionable inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border border-tinta/15 bg-white px-3 text-sm font-semibold text-tinta hover:border-tinta/30"
              title="Importar relevamiento KoboToolbox / QField"
            >
              <ArrowUpTrayIcon className="h-4 w-4" aria-hidden="true" />
              Kobo
            </button>
            <button
              type="button"
              onClick={() => void descargarGeojson()}
              className="presionable inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border border-tinta/15 bg-white px-3 text-sm font-semibold text-tinta hover:border-tinta/30"
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
              onClick={alternar}
              aria-pressed={tema === 'oscuro'}
              aria-label={tema === 'oscuro' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
              title={tema === 'oscuro' ? 'Modo claro' : 'Modo oscuro'}
              className="presionable flex h-11 w-11 items-center justify-center rounded-xl text-slate-600 hover:bg-slate-100 hover:text-tinta"
            >
              {tema === 'oscuro' ? (
                <SunIcon className="h-5 w-5" aria-hidden="true" />
              ) : (
                <MoonIcon className="h-5 w-5" aria-hidden="true" />
              )}
            </button>
            <button
              type="button"
              onClick={logout}
              className="presionable inline-flex min-h-[44px] items-center gap-1 rounded-xl px-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100"
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
            <div className="px-4 pt-4 lg:absolute lg:right-4 lg:top-16 lg:z-10 lg:max-h-[calc(100%-9rem)] lg:w-[348px] lg:overflow-y-auto lg:rounded-2xl lg:p-0">
              <FichaResumen
                key={actual.codigo_unico}
                atajadero={actual}
                onCerrar={() => setSeleccionado(null)}
                onVerFicha={verFicha}
              />
            </div>
          )}

          {/* Contenedor sin overflow: la pestaña de plegado sobresale del panel
              sin recortarse. En móvil es flujo normal (no se pliega). */}
          <div
            data-oculto={panelOculto}
            className="panel-plegable lg:absolute lg:bottom-4 lg:left-4 lg:top-4 lg:z-10 lg:w-[388px]"
          >
            <aside
              id="panel-triage"
              aria-label="Triage de la mesa"
              className="space-y-4 p-4 lg:h-full lg:overflow-y-auto lg:rounded-2xl lg:panel-flotante"
            >
              {panelTriage}
            </aside>
            <button
              type="button"
              onClick={alternarPanel}
              aria-expanded={!panelOculto}
              aria-controls="panel-triage"
              aria-label="Ocultar panel"
              title="Ocultar panel"
              className="presionable panel-flotante absolute -right-4 top-5 hidden h-11 w-8 items-center justify-center rounded-r-xl rounded-l-none border-l-0 text-slate-600 hover:text-tinta lg:flex"
            >
              <ChevronLeftIcon className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>

          {panelOculto && (
            <button
              type="button"
              onClick={alternarPanel}
              aria-expanded={false}
              aria-controls="panel-triage"
              className="presionable entrada-suave panel-flotante absolute left-4 top-4 z-10 hidden min-h-[44px] items-center gap-2 rounded-xl px-3.5 text-sm font-semibold text-tinta lg:inline-flex"
            >
              Requiere decisión
              <span className="numero-ancho rounded-full bg-tinta px-2 py-0.5 text-xs font-bold text-white">
                {cola.length}
              </span>
              <ChevronRightIcon className="h-4 w-4 text-slate-500" aria-hidden="true" />
            </button>
          )}
        </main>
      )}

      {modales}
    </div>
  );
}
