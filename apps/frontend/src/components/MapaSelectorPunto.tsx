import { LIMITES_FORMOSA } from '@/lib/api';
import { CENTRO_FORMOSA, crearCapaIgn } from '@/lib/capasMapa';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect, useRef } from 'react';

export interface Punto {
  lat: number;
  lon: number;
}

interface MapaSelectorPuntoProps {
  punto: Punto | null;
  onElegir: (punto: Punto) => void;
}

// Mapa táctil para marcar dónde está el posible bloqueo (RF-FE-07).
export default function MapaSelectorPunto({ punto, onElegir }: MapaSelectorPuntoProps) {
  const contenedorRef = useRef<HTMLDivElement>(null);
  const mapaRef = useRef<L.Map | null>(null);
  const marcadorRef = useRef<L.CircleMarker | null>(null);
  const onElegirRef = useRef(onElegir);
  onElegirRef.current = onElegir;

  useEffect(() => {
    if (!contenedorRef.current) return;
    const { latMin, latMax, lonMin, lonMax } = LIMITES_FORMOSA;
    const mapa = L.map(contenedorRef.current, {
      center: CENTRO_FORMOSA,
      zoom: 6,
      // Margen alrededor de la provincia para no arrastrar el mapa a otro lado.
      maxBounds: L.latLngBounds([latMin - 1, lonMin - 1], [latMax + 1, lonMax + 1]),
      maxBoundsViscosity: 0.8,
    });
    crearCapaIgn().addTo(mapa);
    mapa.on('click', (e: L.LeafletMouseEvent) =>
      onElegirRef.current({ lat: e.latlng.lat, lon: e.latlng.lng }),
    );
    mapaRef.current = mapa;
    return () => {
      mapa.remove();
      mapaRef.current = null;
      marcadorRef.current = null;
    };
  }, []);

  // Mover el marcador cuando el punto cambia (toque en el mapa o GPS).
  useEffect(() => {
    const mapa = mapaRef.current;
    if (!mapa) return;
    if (!punto) {
      marcadorRef.current?.remove();
      marcadorRef.current = null;
      return;
    }
    const latlng = L.latLng(punto.lat, punto.lon);
    if (!marcadorRef.current) {
      marcadorRef.current = L.circleMarker(latlng, {
        radius: 10,
        color: '#0f172a',
        weight: 2,
        fillColor: '#0f766e',
        fillOpacity: 0.95,
      }).addTo(mapa);
    } else {
      marcadorRef.current.setLatLng(latlng);
    }
    if (!mapa.getBounds().pad(-0.2).contains(latlng)) {
      mapa.setView(latlng, Math.max(mapa.getZoom(), 10));
    }
  }, [punto]);

  return (
    <div
      ref={contenedorRef}
      className="isolate h-[260px] w-full rounded-lg border border-slate-300 sm:h-[320px]"
      role="region"
      aria-label="Mapa para marcar la ubicación del aviso"
    />
  );
}
