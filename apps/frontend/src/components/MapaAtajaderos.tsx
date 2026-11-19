import {
  AtajaderoSummary,
  EstadoAtajadero,
  InterrupcionEscurrimiento,
} from '@/types';
import {
  CENTRO_FORMOSA,
  crearCapaIgn,
  crearCapaSatelital,
} from '@/lib/capasMapa';
import type { FeatureCollection } from 'geojson';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect, useRef, useState } from 'react';

const NOMBRE_CAPA_RIACHOS = 'Corredores fluviales · REFERENCIA';

// Centro y zoom fijados por RF-FE-02.
const ZOOM_INICIAL = 7;

// Relleno = dato prioritario El Niño (RF-FE-02: si rojo, a_verificar ámbar, no verde).
export const COLOR_ESCURRIMIENTO: Record<InterrupcionEscurrimiento, string> = {
  si: '#dc2626',
  a_verificar: '#f59e0b',
  no: '#16a34a',
};

// Borde = estado, para no depender solo del color.
const TRAZO_ESTADO: Record<EstadoAtajadero, string | undefined> = {
  operativo: undefined,
  con_deterioro: undefined,
  sin_validar: '4 3',
  fuera_de_servicio: '1 4',
};

function escaparHtml(texto: string): string {
  return texto.replace(
    /[&<>"']/g,
    (c) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[
        c
      ] ?? c,
  );
}

interface MapaAtajaderosProps {
  atajaderos: AtajaderoSummary[];
  seleccionado?: string | null;
  onSeleccionar?: (codigo: string) => void;
  onVerFicha?: (codigo: string) => void;
  // Trazas REFERENCIA de los 4 corredores (las provee Facundo en src/data/).
  // Mientras sea null, la capa existe en el selector y avisa que está pendiente.
  riachosGeoJson?: FeatureCollection | null;
  className?: string;
}

export default function MapaAtajaderos({
  atajaderos,
  seleccionado = null,
  onSeleccionar,
  onVerFicha,
  riachosGeoJson = null,
  className = 'relative',
}: MapaAtajaderosProps) {
  const contenedorRef = useRef<HTMLDivElement>(null);
  const mapaRef = useRef<L.Map | null>(null);
  const marcadoresRef = useRef<L.LayerGroup | null>(null);
  const riachosRef = useRef<L.LayerGroup | null>(null);
  const [capaRiachosVisible, setCapaRiachosVisible] = useState(true);
  const porCodigoRef = useRef(new Map<string, L.CircleMarker>());

  // Callbacks en refs: el efecto de marcadores no depende de su identidad.
  const onSeleccionarRef = useRef(onSeleccionar);
  const onVerFichaRef = useRef(onVerFicha);
  onSeleccionarRef.current = onSeleccionar;
  onVerFichaRef.current = onVerFicha;

  // 1) Crear el mapa una sola vez.
  useEffect(() => {
    if (!contenedorRef.current) return;

    const mapa = L.map(contenedorRef.current, {
      center: CENTRO_FORMOSA,
      zoom: ZOOM_INICIAL,
      zoomControl: false,
    });
    L.control.zoom({ position: 'bottomright' }).addTo(mapa);

    const capaIgn = crearCapaIgn().addTo(mapa);
    const capaSatelital = crearCapaSatelital();

    // Panel propio debajo de los marcadores (overlayPane = 400): las líneas de
    // los riachos nunca tapan un atajadero, aunque se carguen después.
    mapa.createPane('riachos').style.zIndex = '350';
    const capaRiachos = L.layerGroup().addTo(mapa);
    riachosRef.current = capaRiachos;

    L.control
      .layers(
        {
          'Mapa vial IGN · REFERENCIA': capaIgn,
          'Satelital Esri · OBSERVADO': capaSatelital,
        },
        { [NOMBRE_CAPA_RIACHOS]: capaRiachos },
        { position: 'topright' },
      )
      .addTo(mapa);

    // Por separado: así cada evento llega con su tipo (LayersControlEvent).
    mapa.on('overlayadd', (e) => {
      if (e.name === NOMBRE_CAPA_RIACHOS) setCapaRiachosVisible(true);
    });
    mapa.on('overlayremove', (e) => {
      if (e.name === NOMBRE_CAPA_RIACHOS) setCapaRiachosVisible(false);
    });

    marcadoresRef.current = L.layerGroup().addTo(mapa);

    // Delegación: el botón del popup es HTML plano, no un componente React.
    mapa.on('popupopen', (evento) => {
      const boton = evento.popup
        .getElement()
        ?.querySelector<HTMLButtonElement>('[data-ver-ficha]');
      boton?.addEventListener('click', () => {
        const codigo = boton.dataset.verFicha;
        if (codigo) onVerFichaRef.current?.(codigo);
      });
    });

    mapaRef.current = mapa;

    return () => {
      mapa.remove();
      mapaRef.current = null;
      marcadoresRef.current = null;
      riachosRef.current = null;
    };
  }, []);

  // Trazas de los corredores fluviales (REFERENCIA).
  useEffect(() => {
    const capa = riachosRef.current;
    if (!capa) return;
    capa.clearLayers();
    if (!riachosGeoJson?.features.length) return;
    L.geoJSON(riachosGeoJson, {
      pane: 'riachos',
      style: { color: '#2563eb', weight: 3, opacity: 0.8 },
      onEachFeature: (feature, capaFeature) => {
        const p = (feature.properties ?? {}) as Record<string, unknown>;
        const nombre = p.nombre ?? p.name;
        if (typeof nombre === 'string') {
          capaFeature.bindTooltip(`${nombre} · REFERENCIA`, { sticky: true });
        }
      },
    }).addTo(capa);
  }, [riachosGeoJson]);

  const riachosPendientes = !riachosGeoJson?.features.length;

  // 2) Recrear marcadores solo cuando cambian los datos (filtros).
  //    La selección NO los recrea: eso cerraría el popup recién abierto.
  useEffect(() => {
    const grupo = marcadoresRef.current;
    if (!grupo) return;
    grupo.clearLayers();
    porCodigoRef.current.clear();

    atajaderos.forEach((a) => {
      // Bloqueo activo (misma regla que la cola de decisiones): pulso lento
      // debajo del marcador, sin interacción, para que la mesa lo vea primero.
      if (a.interrumpe_escurrimiento === 'si' && a.estado !== 'fuera_de_servicio') {
        L.circleMarker([a.latitud, a.longitud], {
          radius: 9,
          stroke: false,
          fillColor: COLOR_ESCURRIMIENTO.si,
          fillOpacity: 0.5,
          interactive: false,
          className: 'marcador-pulso',
        }).addTo(grupo);
      }

      const marcador = L.circleMarker([a.latitud, a.longitud], {
        radius: 8,
        color: '#0f172a',
        weight: 2,
        dashArray: TRAZO_ESTADO[a.estado],
        fillColor: COLOR_ESCURRIMIENTO[a.interrumpe_escurrimiento],
        fillOpacity: 0.95,
      });

      marcador.bindTooltip(a.codigo_unico, { direction: 'top', offset: [0, -8] });
      marcador.bindPopup(
        `<div class="min-w-[190px] text-sm">
          <p class="font-mono text-xs font-semibold text-tinta">${escaparHtml(a.codigo_unico)}</p>
          <p class="mt-1 text-[15px] font-bold leading-snug text-tinta">${escaparHtml(a.nombre_referencia)}</p>
          <p class="mt-0.5 text-xs text-slate-600"><span class="rotulo-agua font-semibold">${escaparHtml(a.cuenca_riacho)}</span>, Dpto. ${escaparHtml(a.departamento)}</p>
          ${
            onVerFichaRef.current
              ? `<button type="button" data-ver-ficha="${escaparHtml(a.codigo_unico)}"
            class="presionable mt-3 min-h-[38px] w-full rounded-lg bg-teal-700 px-3 text-xs font-semibold text-white hover:bg-teal-800">
            Ver ficha e historial
          </button>`
              : ''
          }
        </div>`,
      );
      marcador.on('click', () => onSeleccionarRef.current?.(a.codigo_unico));
      marcador.addTo(grupo);
      porCodigoRef.current.set(a.codigo_unico, marcador);
    });
  }, [atajaderos]);

  // 3) Resaltar el seleccionado cambiando solo el estilo.
  useEffect(() => {
    porCodigoRef.current.forEach((marcador, codigo) => {
      const activo = codigo === seleccionado;
      marcador.setRadius(activo ? 11 : 8);
      marcador.setStyle({ weight: activo ? 3 : 2 });
      if (activo) marcador.bringToFront();
    });
  }, [seleccionado, atajaderos]);

  return (
    <div className={`isolate h-full w-full ${className}`}>
      <div
        ref={contenedorRef}
        className="h-full w-full"
        role="region"
        aria-label="Mapa de atajaderos de Formosa"
      />
      {riachosPendientes && capaRiachosVisible && (
        <p
          role="status"
          className="pointer-events-none absolute left-1/2 top-2 z-[1000] -translate-x-1/2 whitespace-nowrap rounded-full border border-slate-200 bg-white/90 px-3 py-1 text-xs text-slate-600 shadow-sm"
        >
          Capa vectorial IGN/riachos pendiente de carga
        </p>
      )}
    </div>
  );
}
