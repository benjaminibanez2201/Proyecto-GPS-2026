import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, CalendarCheck, CheckCircle, Archive, XCircle } from 'lucide-react';
import { obtenerArriendoPorId } from '../services/rentalsAndReviews.service.js';
import { useAuth } from '../context/AuthContext.jsx';
import AvatarCirculo from '../components/AvatarCirculo.jsx';
import '@styles/detalleArriendo.css';

const backButtonStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '8px',
  width: 'fit-content',
  color: '#0f766e',
  fontWeight: 600,
  padding: '10px 14px',
  borderRadius: '999px',
  backgroundColor: '#ffffff',
  border: '1px solid rgba(15, 118, 110, 0.25)',
  boxShadow: '0 2px 8px rgba(15, 23, 42, 0.05)',
  cursor: 'pointer',
  marginBottom: '20px',
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

    if (id) cargarArriendo();
  }, [id]);

  if (cargando) {
    return <div className="detalle-arriendo-estado">Cargando arriendo...</div>;
  }

  if (error || !arriendo) {
    return (
      <div className="detalle-arriendo-page">
        <button onClick={() => navigate(-1)} style={backButtonStyle}>
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
  const imagenPrincipal = fotos[0] || 'https://via.placeholder.com/800x400?text=Sin+Imagen';
  const esArrendador = Number(user?.id) === Number(arriendo.arrendadorId);
  const otraPersona = esArrendador ? arriendo.estudiante : arriendo.arrendador;
  const estadoMeta = ESTADO_META[arriendo.status] || ESTADO_META.COMPLETED;
  const EstadoIcon = estadoMeta.Icon;
  const fechaConfirmacion = arriendo.completedAt
    ? new Date(arriendo.completedAt).toLocaleDateString('es-CL', { day: '2-digit', month: 'long', year: 'numeric' })
    : 'Fecha no disponible';

  return (
    <div className="detalle-arriendo-page">
      <button onClick={() => navigate(-1)} style={backButtonStyle}>
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

        <img src={imagenPrincipal} alt={publicacion.titulo || 'Arriendo'} className="detalle-arriendo-imagen" />

        {fotos.length > 1 && (
          <div className="detalle-arriendo-galeria">
            {fotos.slice(1).map((foto, index) => (
              <img key={foto} src={foto} alt={`Foto ${index + 2}`} className="detalle-arriendo-galeria-img" />
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
    </div>
  );
}
