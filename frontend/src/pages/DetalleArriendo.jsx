import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, CalendarCheck, CheckCircle, Archive, XCircle, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { obtenerArriendoPorId } from '../services/rentalsAndReviews.service.js';
import { useAuth } from '../context/AuthContext.jsx';
import { resolveFileUrl } from '../helpers/resolveFileUrl.js';
import AvatarCirculo from '../components/AvatarCirculo.jsx';
import '@styles/detalleArriendo.css';

const carouselArrowStyle = {
  position: 'absolute',
  top: '50%',
  transform: 'translateY(-50%)',
  zIndex: 10,
  background: 'rgba(255, 255, 255, 0.9)',
  border: 'none',
  borderRadius: '50%',
  width: '40px',
  height: '40px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
  color: '#0f172a',
};

const SERVICIOS_LABELS = {
  agua: 'Agua',
  luz: 'Luz',
  gas: 'Gas',
  internet: 'Internet',
  tv_cable: 'TV Cable',
  calefaccion: 'Calefacción',
  estacionamiento: 'Estacionamiento',
  lavadora: 'Lavadora',
};

function formatearServicio(servicio) {
  return SERVICIOS_LABELS[servicio] || servicio;
}

const ESTADO_META = {
  COMPLETED: { label: 'Arriendo concretado', className: 'detalle-arriendo-chip--concretado', Icon: CheckCircle },
  FINISHED: { label: 'Arriendo finalizado', className: 'detalle-arriendo-chip--finalizado', Icon: Archive },
  CANCELLED: { label: 'Arriendo cancelado', className: 'detalle-arriendo-chip--cancelado', Icon: XCircle },
};

export default function DetalleArriendo() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [arriendo, setArriendo] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [fotoActivaIndex, setFotoActivaIndex] = useState(0);
  const [lightboxAbierto, setLightboxAbierto] = useState(false);

  useEffect(() => {
    const cargarArriendo = async () => {
      setCargando(true);
      const [data, errorRespuesta] = await obtenerArriendoPorId(id);

      if (errorRespuesta) {
        setError(errorRespuesta);
      } else {
        setArriendo(data);
      }
      setCargando(false);
    };

    if (id) {
      cargarArriendo();
    } else {
      setError('No se encontró este arriendo.');
      setCargando(false);
    }
  }, [id]);

  useEffect(() => {
    if (!lightboxAbierto) return undefined;

    const totalFotosLightbox = arriendo?.publicacion?.fotos?.length || 0;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setLightboxAbierto(false);
      if (e.key === 'ArrowRight' && totalFotosLightbox > 1) {
        setFotoActivaIndex((prev) => (prev + 1) % totalFotosLightbox);
      }
      if (e.key === 'ArrowLeft' && totalFotosLightbox > 1) {
        setFotoActivaIndex((prev) => (prev - 1 + totalFotosLightbox) % totalFotosLightbox);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxAbierto, arriendo]);

  if (cargando) {
    return <div className="detalle-arriendo-estado">Cargando arriendo...</div>;
  }

  if (error || !arriendo) {
    return (
      <div className="detalle-arriendo-page">
        <button onClick={() => navigate(-1)} className="back-pill-button">
          <ArrowLeft size={18} /> Volver
        </button>
        <div className="detalle-arriendo-estado detalle-arriendo-estado--error">
          {error || 'Arriendo no encontrado.'}
        </div>
      </div>
    );
  }

  const publicacion = arriendo.publicacion || {};
  const fotos = publicacion.fotos || [];
  const fotosResueltas = fotos.length > 0 ? fotos.map(resolveFileUrl) : [];
  const imagenActiva = fotosResueltas[fotoActivaIndex] || fotosResueltas[0] || 'https://via.placeholder.com/800x400?text=Sin+Imagen';
  const esArrendador = Number(user?.id) === Number(arriendo.arrendadorId);
  const otraPersona = esArrendador ? arriendo.estudiante : arriendo.arrendador;
  const estadoMeta = ESTADO_META[arriendo.status] || ESTADO_META.COMPLETED;
  const EstadoIcon = estadoMeta.Icon;
  const fechaConfirmacion = arriendo.completedAt
    ? new Date(arriendo.completedAt).toLocaleDateString('es-CL', { day: '2-digit', month: 'long', year: 'numeric' })
    : 'Fecha no disponible';

  const irFotoSiguiente = (e) => {
    if (e) e.stopPropagation();
    setFotoActivaIndex((prev) => (prev + 1) % fotosResueltas.length);
  };

  const irFotoAnterior = (e) => {
    if (e) e.stopPropagation();
    setFotoActivaIndex((prev) => (prev - 1 + fotosResueltas.length) % fotosResueltas.length);
  };

  return (
    <div className="detalle-arriendo-page">
      <button onClick={() => navigate(-1)} className="back-pill-button">
        <ArrowLeft size={18} /> Volver
      </button>

      <div className="detalle-arriendo-card">
        <div className="detalle-arriendo-header">
          <div>
            <span className={`detalle-arriendo-chip ${estadoMeta.className}`}>
              <EstadoIcon size={16} /> {estadoMeta.label}
            </span>
            <h1 className="detalle-arriendo-titulo">{publicacion.titulo || 'Publicación'}</h1>
          </div>
          <div className="detalle-arriendo-precio">
            <strong>${Number(publicacion.precioMensual || 0).toLocaleString('es-CL')}</strong>
            <span>/ mes</span>
          </div>
        </div>

        <div style={{ position: 'relative' }}>
          <img
            src={imagenActiva}
            alt={publicacion.titulo || 'Arriendo'}
            className="detalle-arriendo-imagen"
            onClick={() => fotosResueltas.length > 0 && setLightboxAbierto(true)}
            style={{ cursor: fotosResueltas.length > 0 ? 'zoom-in' : 'default' }}
          />

          {fotosResueltas.length > 1 && (
            <>
              <button type="button" onClick={irFotoAnterior} style={{ ...carouselArrowStyle, left: '16px' }} title="Foto anterior">
                <ChevronLeft size={22} />
              </button>
              <button type="button" onClick={irFotoSiguiente} style={{ ...carouselArrowStyle, right: '16px' }} title="Foto siguiente">
                <ChevronRight size={22} />
              </button>
              <span style={{ position: 'absolute', bottom: '46px', right: '16px', backgroundColor: 'rgba(0,0,0,0.55)', color: '#fff', padding: '4px 10px', borderRadius: '999px', fontSize: '12px', fontWeight: 'bold' }}>
                {fotoActivaIndex + 1} / {fotosResueltas.length}
              </span>
            </>
          )}
        </div>

        {fotosResueltas.length > 1 && (
          <div className="detalle-arriendo-galeria">
            {fotosResueltas.map((foto, index) => (
              <img
                key={foto}
                src={foto}
                alt={`Foto ${index + 1}`}
                onClick={() => setFotoActivaIndex(index)}
                className="detalle-arriendo-galeria-img"
                style={{
                  cursor: 'pointer',
                  border: index === fotoActivaIndex ? '3px solid #008080' : '3px solid transparent',
                  opacity: index === fotoActivaIndex ? 1 : 0.7,
                  transition: 'opacity 0.15s ease, border-color 0.15s ease',
                }}
              />
            ))}
          </div>
        )}

        <div className="detalle-arriendo-grid">
          <div>
            <h3>Ubicación</h3>
            <p className="detalle-arriendo-ubicacion">
              <MapPin size={16} color="#008080" /> {publicacion.ubicacion || 'Ubicación no especificada'}
            </p>

            <h3>Servicios incluidos</h3>
            <ul className="detalle-arriendo-servicios">
              {publicacion.serviciosIncluidos && publicacion.serviciosIncluidos.length > 0 ? (
                publicacion.serviciosIncluidos.map((servicio) => (
                  <li key={servicio}>✓ {formatearServicio(servicio)}</li>
                ))
              ) : (
                <li>No se especificaron servicios</li>
              )}
            </ul>

            <h3>Reglas de convivencia</h3>
            <p className="detalle-arriendo-reglas">
              {publicacion.reglasConvivencia || 'No se especificaron reglas de convivencia.'}
            </p>
          </div>

          <div className="detalle-arriendo-sidebar">
            <div className="detalle-arriendo-info-card">
              <h3>{esArrendador ? 'Estudiante' : 'Arrendador'}</h3>
              <div className="detalle-arriendo-persona">
                <AvatarCirculo nombre={otraPersona?.nombreCompleto} foto={otraPersona?.fotoPerfil} size={48} />
                <span>{otraPersona?.nombreCompleto || 'Sin nombre'}</span>
              </div>
            </div>

            <div className="detalle-arriendo-info-card">
              <h3>Fecha de confirmación</h3>
              <p className="detalle-arriendo-fecha">
                <CalendarCheck size={16} color="#008080" /> {fechaConfirmacion}
              </p>
            </div>
          </div>
        </div>
      </div>

      {lightboxAbierto && fotosResueltas.length > 0 && (
        <div
          onClick={() => setLightboxAbierto(false)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.92)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '40px',
          }}
        >
          <button
            type="button"
            onClick={() => setLightboxAbierto(false)}
            title="Cerrar"
            style={{
              position: 'absolute',
              top: '20px',
              right: '20px',
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              border: 'none',
              background: 'rgba(255,255,255,0.15)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <X size={22} />
          </button>

          {fotosResueltas.length > 1 && (
            <button
              type="button"
              onClick={irFotoAnterior}
              title="Foto anterior"
              style={{ ...carouselArrowStyle, left: '24px', background: 'rgba(255,255,255,0.15)', color: '#fff' }}
            >
              <ChevronLeft size={28} />
            </button>
          )}

          <img
            src={imagenActiva}
            alt={publicacion.titulo || 'Arriendo'}
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '90vw', maxHeight: '85vh', objectFit: 'contain', borderRadius: '8px' }}
          />

          {fotosResueltas.length > 1 && (
            <button
              type="button"
              onClick={irFotoSiguiente}
              title="Foto siguiente"
              style={{ ...carouselArrowStyle, right: '24px', background: 'rgba(255,255,255,0.15)', color: '#fff' }}
            >
              <ChevronRight size={28} />
            </button>
          )}

          {fotosResueltas.length > 1 && (
            <span style={{ position: 'absolute', bottom: '24px', left: '50%', transform: 'translateX(-50%)', color: '#fff', fontSize: '14px', fontWeight: 'bold' }}>
              {fotoActivaIndex + 1} / {fotosResueltas.length}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
