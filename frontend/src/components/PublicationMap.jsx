import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import '@styles/publicationMap.css';
import {
  formatMoneyCLP,
  resolvePublicationLocation,
} from '@helpers/publicacionesMapa.helper.js';

function getPublicacionId(publicacion) {
  return publicacion?.id_publicacion || publicacion?.id || publicacion?._id;
}

function crearIconoPrecio(precio) {
  return L.divIcon({
    className: 'publication-price-icon',
    html: `<div class="publication-price-icon__bubble">${formatMoneyCLP(precio).replace(/\sCLP$/, '')}<span>/mes</span></div>`,
    iconSize: [110, 44],
    iconAnchor: [55, 42],
    popupAnchor: [0, -36],
  });
}

export default function PublicationMap({ publicaciones = [] }) {
  const navigate = useNavigate();
  const [markers, setMarkers] = useState([]);
  const [cargandoMapa, setCargandoMapa] = useState(true);
  const [mapaError, setMapaError] = useState('');

  useEffect(() => {
    let isMounted = true;

    const prepararMarcadores = async () => {
      setCargandoMapa(true);
      setMapaError('');

      try {
        const resolved = await Promise.all(
          publicaciones.map(async (publicacion) => {
            const location = await resolvePublicationLocation(publicacion);

            if (!location) {
              return null;
            }

            return {
              publicacion,
              commune: location.commune,
              position: [location.lat, location.lng],
            };
          })
        );

        if (isMounted) {
          setMarkers(resolved.filter(Boolean));
        }
      } catch {
        if (isMounted) {
          setMapaError('No se pudo cargar el mapa, pero puedes revisar las publicaciones debajo.');
          setMarkers([]);
        }
      } finally {
        if (isMounted) {
          setCargandoMapa(false);
        }
      }
    };

    prepararMarcadores();

    return () => {
      isMounted = false;
    };
  }, [publicaciones]);

  if (cargandoMapa) {
    return (
      <section className="publication-map-card">
        <p className="publication-map-loading">Preparando mapa de resultados...</p>
      </section>
    );
  }

  if (mapaError) {
    return (
      <section className="publication-map-card">
        <p className="publication-map-loading">{mapaError}</p>
      </section>
    );
  }

  if (markers.length === 0) {
    return null;
  }

  return (
    <section className="publication-map-card">
      <div className="publication-map-header">
        <div>
          <h2 className="publication-map-title">Mapa con la ubicación aproximada de los resultados</h2>
        </div>
        <p className="publication-map-note">
          El mapa usa la dirección publicada para ubicar cada arriendo y puede mostrar una posición aproximada cuando no hay coordenadas exactas.
        </p>
      </div>

      <div className="publication-map-wrapper">
        <MapContainer
          center={[-36.82, -73.09]}
          zoom={11}
          minZoom={10}
          maxZoom={16}
          scrollWheelZoom
          className="publication-map"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {markers.map(({ publicacion, commune, position }) => {
            const idPublicacion = getPublicacionId(publicacion);

            return (
              <Marker
                key={idPublicacion}
                position={position}
                icon={crearIconoPrecio(publicacion?.precioMensual)}
                eventHandlers={{
                  click: () => {
                    if (idPublicacion) {
                      navigate(`/publicacion/${idPublicacion}`);
                    }
                  },
                }}
              >
                <Popup>
                  <div className="publication-map-popup">
                    <strong>{publicacion?.titulo || 'Sin título'}</strong>
                    <span>{commune?.name || 'Comuna no identificada'}</span>
                    <span>{formatMoneyCLP(publicacion?.precioMensual || 0)} / mes</span>
                    <button
                      type="button"
                      className="publication-map-popup__button"
                      onClick={() => navigate(`/publicacion/${idPublicacion}`)}
                    >
                      Ver detalle
                    </button>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>
    </section>
  );
}
