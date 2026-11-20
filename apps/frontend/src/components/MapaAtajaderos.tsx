import {
  AtajaderoSummary,
  EstadoAtajadero,
  InterrupcionEscurrimiento,
} from '@/types';
import {
  DEPARTAMENTOS_FORMOSA_GEO,
  HIDROGRAFIA_FORMOSA,
  LIMITE_FORMOSA,
} from '@/geo/formosaIgn';
import {
  CENTRO_FORMOSA,
  crearCapaIgn,
  crearCapaSatelital,
} from '@/lib/capasMapa';
import type { Feature, FeatureCollection, MultiPolygon, Polygon } from 'geojson';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect, useRef, useState } from 'react';

const NOMBRE_CAPA_RIACHOS = 'Corredores esquemáticos · REFERENCIA';

// Centro y zoom fijados por RF-FE-02 (después se encuadra al límite real).
const ZOOM_INICIAL = 7;

function normalizar(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();
}

// Anillos exteriores de Formosa en [lat, lng] para recortar la máscara.
function anillosFormosa(): L.LatLngTuple[][] {
  return LIMITE_FORMOSA.features.flatMap((f) => {
    const g = (f as Feature<MultiPolygon | Polygon>).geometry;
    const poligonos = g.type === 'MultiPolygon' ? g.coordinates : [g.coordinates];
    return poligonos.map((p) => p[0].map(([lng, lat]) => [lat, lng] as L.LatLngTuple));
  });
}

const ESTILO_DEPTO: L.PathOptions = {
  color: '#64748b',
  weight: 1,
  opacity: 0.7,
  dashArray: '3 4',
  fillColor: '#0f766e',
  // Relleno invisible pero presente: así el polígono recibe el mouse.
  fillOpacity: 0,
};
const ESTILO_DEPTO_RESALTADO: L.PathOptions = {
  color: '#0f766e',
  weight: 2.5,
  opacity: 1,
  dashArray: undefined,
  fillOpacity: 0.14,
};

function estiloRio(feature?: Feature): L.PathOptions {
  const p = (feature?.properties ?? {}) as { destacado?: boolean; tipo?: string };
  if (p.destacado) return { color: '#2b6cb0', weight: 2.6, opacity: 0.95 };
  if (p.tipo === 'intermitente') return { color: '#5b9bd5', weight: 1, opacity: 0.55, dashArray: '3 4' };
  return { color: '#5b9bd5', weight: 1.3, opacity: 0.7 };
}

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
  // Espacio (px) que tapa un panel flotante a la izquierda: se descuenta al
  // encuadrar Formosa. Al cambiar, el mapa se recentra.
  margenIzquierdo?: number;
  className?: string;
}

export default function MapaAtajaderos({
  atajaderos,
  seleccionado = null,
  onSeleccionar,
  onVerFicha,
  riachosGeoJson = null,
  margenIzquierdo = 0,
  className = 'relative',
}: MapaAtajaderosProps) {
  const bordesRef = useRef<L.LatLngBounds | null>(null);
  const margenRef = useRef(margenIzquierdo);
  margenRef.current = margenIzquierdo;
  const contenedorRef = useRef<HTMLDivElement>(null);
  const mapaRef = useRef<L.Map | null>(null);
  const marcadoresRef = useRef<L.LayerGroup | null>(null);
  const riachosRef = useRef<L.LayerGroup | null>(null);
  // Los corredores esquemáticos arrancan apagados: la hidrografía IGN es la principal.
  const [capaRiachosVisible, setCapaRiachosVisible] = useState(false);
  const porCodigoRef = useRef(new Map<string, L.CircleMarker>());
  // Último inventario, para armar el dato del departamento al pasar el mouse.
  const atajaderosRef = useRef(atajaderos);
  atajaderosRef.current = atajaderos;

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
      // Zoom fraccionario: el encuadre ajusta Formosa sin redondear hacia afuera.
      zoomSnap: 0.25,
    });
    L.control.zoom({ position: 'bottomright' }).addTo(mapa);

    const capaIgn = crearCapaIgn().addTo(mapa);
    const capaSatelital = crearCapaSatelital();

    // Orden de abajo hacia arriba (tiles = 200, marcadores en overlayPane = 400):
    // máscara, departamentos, hidrografía y corredores nunca tapan un atajadero.
    mapa.createPane('mascara').style.zIndex = '250';
    mapa.createPane('departamentos').style.zIndex = '300';
    mapa.createPane('hidrografia').style.zIndex = '330';
    mapa.createPane('riachos').style.zIndex = '350';

    // Máscara: un polígono del tamaño del mundo con Formosa como agujero.
    // El color sale de CSS (.mascara-formosa) para seguir el modo oscuro.
    const anillos = anillosFormosa();
    L.polygon(
      [
        [
          [-89, -179],
          [-89, 179],
          [89, 179],
          [89, -179],
        ],
        ...anillos,
      ],
      { pane: 'mascara', stroke: false, interactive: false, className: 'mascara-formosa' },
    ).addTo(mapa);

    const limite = L.geoJSON(LIMITE_FORMOSA, {
      pane: 'departamentos',
      interactive: false,
      style: { color: '#0f2a2e', weight: 2, opacity: 0.85, fill: false, className: 'limite-formosa' },
    }).addTo(mapa);

    // Encuadre real de la provincia y movimiento limitado a ella.
    const bordes = limite.getBounds();
    bordesRef.current = bordes;
    mapa.setMaxBounds(bordes.pad(0.35));
    mapa.options.maxBoundsViscosity = 0.9;
    mapa.setMinZoom(Math.max(mapa.getBoundsZoom(bordes.pad(0.35)) - 0.5, 5));
    mapa.fitBounds(bordes, {
      paddingTopLeft: [margenRef.current + 16, 16],
      paddingBottomRight: [16, 16],
    });

    // Departamentos: resalte al pasar el mouse con un dato útil.
    const capaDeptos: L.GeoJSON = L.geoJSON(DEPARTAMENTOS_FORMOSA_GEO, {
      pane: 'departamentos',
      style: ESTILO_DEPTO,
      onEachFeature: (feature, capa) => {
        const nombre = String((feature.properties as { nombre?: string })?.nombre ?? '');
        capa.bindTooltip(() => {
          const delDepto = atajaderosRef.current.filter(
            (a) => normalizar(a.departamento) === normalizar(nombre),
          );
          const bloqueos = delDepto.filter(
            (a) => a.interrumpe_escurrimiento === 'si' && a.estado !== 'fuera_de_servicio',
          ).length;
          const n = delDepto.length;
          return `<strong>${escaparHtml(nombre)}</strong><br/>${n} ${n === 1 ? 'atajadero' : 'atajaderos'}${
            bloqueos ? `, ${bloqueos} ${bloqueos === 1 ? 'bloqueo activo' : 'bloqueos activos'}` : ''
          }`;
        }, { sticky: true, className: 'tooltip-depto', direction: 'top', offset: [0, -10] });
        capa.on('mouseover', () => (capa as L.Path).setStyle(ESTILO_DEPTO_RESALTADO));
        capa.on('mouseout', () => capaDeptos.resetStyle(capa));
      },
    }).addTo(mapa);

    // Hidrografía oficial del IGN: los riachos del proyecto resaltados y con nombre.
    const capaHidro = L.geoJSON(HIDROGRAFIA_FORMOSA, {
      pane: 'hidrografia',
      style: estiloRio,
      onEachFeature: (feature, capa) => {
        const p = feature.properties as { nombre?: string | null; tipo?: string; destacado?: boolean };
        if (p?.nombre) {
          capa.bindTooltip(
            `<span class="rotulo-agua">${escaparHtml(p.nombre)}</span>${
              p.tipo === 'intermitente' ? ' (intermitente)' : ''
            } · REFERENCIA IGN`,
            { sticky: true },
          );
        } else {
          (capa as L.Path).options.interactive = false;
        }
      },
    }).addTo(mapa);

    // Corredores esquemáticos (src/data, módulo 03): capa opcional, apagada.
    const capaRiachos = L.layerGroup();
    riachosRef.current = capaRiachos;

    L.control
      .layers(
        {
          'Mapa vial IGN · REFERENCIA': capaIgn,
          'Satelital Esri · OBSERVADO': capaSatelital,
        },
        {
          'Hidrografía IGN · REFERENCIA': capaHidro,
          'Departamentos · REFERENCIA': capaDeptos,
          [NOMBRE_CAPA_RIACHOS]: capaRiachos,
        },
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

    // Leaflet solo escucha el resize de la ventana; el contenedor también
    // cambia por layout (paso a móvil, rotación): se le avisa explícitamente.
    const observador = new ResizeObserver(() => mapa.invalidateSize({ pan: false }));
    observador.observe(contenedorRef.current);

    return () => {
      observador.disconnect();
      mapa.remove();
      mapaRef.current = null;
      marcadoresRef.current = null;
      riachosRef.current = null;
    };
  }, []);

  // Recentrar cuando cambia el espacio libre (la cortina se abre o se cierra).
  useEffect(() => {
    const mapa = mapaRef.current;
    const bordes = bordesRef.current;
    if (!mapa || !bordes) return;
    // El contenedor puede haber cambiado de tamaño en el mismo render.
    mapa.invalidateSize({ pan: false });
    mapa.fitBounds(bordes, {
      paddingTopLeft: [margenIzquierdo + 16, 16],
      paddingBottomRight: [16, 16],
      animate: true,
      duration: 0.35,
    });
  }, [margenIzquierdo]);

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
