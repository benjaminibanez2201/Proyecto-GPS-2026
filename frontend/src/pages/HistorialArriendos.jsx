import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle, Clock, Inbox, MessageSquareText, Star, X, Landmark} from 'lucide-react';
import { listarArriendos, crearResena } from '../services/rentalsAndReviews.service.js';
import { showSuccessConfirm, showErrorAlert } from '@helpers/sweetAlert';
import { useAuth } from '../context/AuthContext.jsx';
import AvatarCirculo from '@components/AvatarCirculo.jsx';
import '@styles/historialArriendos.css';

export default function HistorialArriendos() {
  const [arriendos, setArriendos] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [arriendoSeleccionado, setArriendoSeleccionado] = useState(null);
  const [sendingReview, setSendingReview] = useState(false);

  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');

  const { user } = useAuth();

  const cargarDatos = async () => {
    setLoading(true);
    const [data, err] = await listarArriendos();
    if (err) {
      setError(err);
      setLoading(false);
      return;
    }
    setError('');

    const enriched = (Array.isArray(data) ? data : []).map((r) => ({
      ...r,
      contratanteNombre: Number(user?.id) === r.arrendadorId ? r.estudiante?.nombreCompleto : r.arrendador?.nombreCompleto || '—',
      contratanteId: Number(user?.id) === r.arrendadorId ? r.estudiante?.id : r.arrendador?.id || null,
      contratanteAvatar: (Number(user?.id) === r.arrendadorId ? r.estudiante?.fotoPerfil : r.arrendador?.fotoPerfil) || null,
    }));

    setArriendos(enriched);
    setLoading(false);
  };

  useEffect(() => {
    cargarDatos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const abrirModalCalificar = (arriendo) => {
    setArriendoSeleccionado(arriendo);
    setModalAbierto(true);
  };

  const cerrarModalCalificacion = () => {
    setModalAbierto(false);
    setArriendoSeleccionado(null);
    setComment('');
    setRating(5);
    setSendingReview(false);
  };

  const handleEnviarCalificacion = async (e) => {
    e.preventDefault();
    if (!arriendoSeleccionado) return;

    const targetUserId = Number(user?.id) === arriendoSeleccionado.arrendadorId
      ? arriendoSeleccionado.estudianteId
      : arriendoSeleccionado.arrendadorId;

    const payload = { rentalId: arriendoSeleccionado.id, targetUserId, rating, comment };

    try {
      setSendingReview(true);
      const [, err] = await crearResena(payload);

      if (err) {
        showErrorAlert('No se pudo enviar la calificación', err);
        return;
      }

      await showSuccessConfirm(
        'Calificación enviada',
        'La otra persona recibirá una notificación.',
        'Entendido'
      );

      cerrarModalCalificacion();
      cargarDatos();
    } finally {
      setSendingReview(false);
    }
  };

  return (
    <div className="historial-page">
      <section className="historial-hero">
        <div className= "heroIcon">
          <Landmark size={28} strokeWidth={2} />
            </div>
        <div>
          <h2 className="hero-title">Arriendos concretados</h2>
          <p className="hero-subtitle">Revisa tus arriendos, dale a confirmar y deja una calificación.</p>
        </div>
      </section>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      <table className="historial-table">
        <thead>
          <tr>
            <th>Nombre del contratante</th>
            <th>Estado de confirmación</th>
            <th>Fecha de confirmación</th>
            <th>Evaluación mutua</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan="4" style={{ textAlign: 'center', padding: '40px' }}>
                Cargando historial de arriendos...
              </td>
            </tr>
          ) : arriendos.length === 0 ? (
            <tr>
              <td colSpan="4" style={{ padding: 0 }}>
                <div className="empty-state">
                  <div className="empty-icon"><Inbox size={28} /></div>
                  <strong>No hay arriendos todavía</strong>
                  <span className="empty-text">Cuando concretes tu primer arriendo, aparecerá aquí con sus opciones para calificar.</span>
                </div>
              </td>
            </tr>
          ) : arriendos.map((item) => {
            const yaConfirme = Number(user?.id) === item.arrendadorId
              ? item.confirmedByArrendador
              : item.confirmedByEstudiante;

            return (
              <tr key={item.id}>
                <td>
                  {item.contratanteId ? (
                    <Link to={`/perfil/${item.contratanteId}`} className="person-link">
                      <AvatarCirculo nombre={item.contratanteNombre} foto={item.contratanteAvatar} />
                      <span>{item.contratanteNombre || '—'}</span>
                    </Link>
                  ) : (
                    <span className="person-link person-link--static">
                      <AvatarCirculo nombre={item.contratanteNombre} foto={item.contratanteAvatar} />
                      <span>{item.contratanteNombre || '—'}</span>
                    </span>
                  )}
                </td>
                <td>
                  {item.status === 'COMPLETED' ? (
                    <span className="reviewed-chip"><CheckCircle size={16} /> Arriendo concretado</span>
                  ) : yaConfirme ? (
                    <span className="waiting-chip"><Clock size={16} /> Esperando confirmación...</span>
                  ) : (
                    <span className="waiting-chip"><MessageSquareText size={16} /> Confirma en conversación</span>
                  )}
                </td>
                <td>
                  {item.completedAt ? (
                    <span className="fecha-confirmacion">
                      {new Date(item.completedAt).toLocaleDateString('es-CL', { day: '2-digit', month: 'long', year: 'numeric' })}
                    </span>
                  ) : '—'}
                </td>
                <td>
                  {item.status === 'COMPLETED' && item.puedeCalificar ? (
                    <button onClick={() => abrirModalCalificar(item)} className="calificar-button">
                      <span><Star size={16} /></span>
                      <span className="calificar-title">Comparte tu opinión</span>
                      <ArrowRight size={16} />
                    </button>
                  ) : item.status === 'COMPLETED' && item.miResena ? (
                    <span className="reviewed-chip"><CheckCircle size={16} /> Ya calificaste</span>
                  ) : item.status === 'COMPLETED' ? (
                    <span className="reviewed-chip"><CheckCircle size={16} /> Arriendo concretado</span>
                  ) : (
                    <span style={{ color: '#aaa', fontSize: '13px', fontStyle: 'italic' }}>Faltan confirmaciones</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* MODAL DE CALIFICACIÓN */}
      {modalAbierto && (
        <div className="modal-overlay" onClick={cerrarModalCalificacion}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3 className="modal-title">Comparte tu experiencia</h3>
                <p className="modal-subtitle">Tu calificación ayuda a que otras personas tomen una decisión</p>
              </div>
              <button type="button" onClick={cerrarModalCalificacion} className="close-button">
                <X size={18} />
              </button>
            </div>
            <div className="review-context">
              <div className="review-context-icon"><MessageSquareText size={18} /></div>
              <p className="review-context-title">{arriendoSeleccionado?.contratanteNombre}</p>
            </div>
            <form onSubmit={handleEnviarCalificacion} className="modal-form">
              <div>
                <label className="modal-label">Tu puntuación</label>
                <div className="star-row">
                  {[1, 2, 3, 4, 5].map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setRating(value)}
                      className={`star-button ${value <= rating ? 'active' : ''}`}
                    >
                      <Star size={18} fill={value <= rating ? '#f59e0b' : 'transparent'} color={value <= rating ? '#f59e0b' : '#94a3b8'} />
                    </button>
                  ))}
                </div>
              </div>
              <label>
                <span className="modal-label">Comentario opcional</span>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  maxLength={1000}
                  className="textarea-input"
                  placeholder="Escribe una reseña honesta y concreta..."
                />
              </label>
              <div className="footer-actions">
                <button type="button" onClick={cerrarModalCalificacion} className="secondary-button" disabled={sendingReview}>Cancelar</button>
                <button type="submit" className="primary-button" disabled={sendingReview}>
                  {sendingReview ? 'Enviando...' : 'Enviar calificación'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}