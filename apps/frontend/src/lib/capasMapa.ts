import L from 'leaflet';

export const CENTRO_FORMOSA: L.LatLngTuple = [-24.85, -60.05];

// IGN Argenmap: servicio TMS (filas contadas desde abajo), por eso tms: true.
// La clase capa-base-gris la pasa a escala de grises (ver index.css).
export function crearCapaIgn(): L.TileLayer {
  return L.tileLayer(
    'https://wms.ign.gob.ar/geoserver/gwc/service/tms/1.0.0/capabaseargenmap@EPSG%3A3857@png/{z}/{x}/{y}.png',
    {
      tms: true,
      maxZoom: 18,
      className: 'capa-base-gris',
      attribution:
        '<a href="https://www.ign.gob.ar/AreaServicios/Argenmap/Introduccion" target="_blank" rel="noreferrer">Instituto Geográfico Nacional</a> · REFERENCIA',
    },
  );
}

export function crearCapaSatelital(): L.TileLayer {
  return L.tileLayer(
    'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    {
      maxZoom: 18,
      attribution: 'Imágenes © Esri · OBSERVADO / REFERENCIA',
    },
  );
}
