import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle, Clock, Inbox, MessageSquareText, Star, X } from 'lucide-react';
import { listarArriendos, crearResena } from '../services/rentalsAndReviews.service.js';
import { showSuccessConfirm, showErrorAlert } from '@helpers/sweetAlert';
import { useAuth } from '../context/AuthContext.jsx';
import './historiArriendos.css';

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

  const colores = {
    principal: '#008080',
    secundario: '#e6dfd3',
    textoOscuro: '#2c3e50',
    blanco: '#ffffff',
    oro: '#ffd21f',
  };

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
      contratanteAvatar: Number(user?.id) === r.arrendadorId ? r.estudiante?.avatar : r.arrendador?.avatar || null,
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

    const payload = {
      rentalId: arriendoSeleccionado.id,
      targetUserId,
      rating,
      comment,
    };

    try {
      setSendingReview(true);
      const [, err] = await crearResena(payload);

      if (err) {
        showErrorAlert('No se pudo enviar la calificación', err);
        return;
      }

      await showSuccessConfirm(
        'Calificación enviada',
        'La otra persona recibirá una notificación dentro del sistema.',
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
        <div>
          <h2 className="hero-title">Arriendos concretados</h2>
          <p className="hero-subtitle">Revisa tus arriendos, dale a confirmar y deja una calificación.</p>
        </div>
      </section>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      <table border="0" cellPadding="15" className="historial-table">
        <thead>
          <tr style={{ backgroundColor: colores.secundario, color: colores.textoOscuro }}>
            <th>Nombre del contratante</th>
            <th>Estado de confirmación</th>
            <th>Fecha de confirmación</th>
            <th>Evaluación mutua</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan="4" className="empty-cell">
                <div className="empty-state">
                  <div className="empty-icon">
                    <Inbox size={28} />
                  </div>
                  <strong>No hay arriendos todavía</strong>
                  <span className="empty-text">
                    Cuando concretes tu primer arriendo, aparecerá aquí con sus confirmaciones y opciones para calificar.
                  </span>
                </div>
              </td>
            </tr>
          ) : arriendos.map((item) => {
            const yaConfirme = Number(user?.id) === item.arrendadorId
              ? item.confirmedByArrendador
              : item.confirmedByEstudiante;

            return (
              <tr key={item.id} style={{ borderBottom: '1px solid #eee' }}>
                <td>
                  {item.contratanteId ? (
                    <Link to={`/perfil/${item.contratanteId}`} className="person-link">
                      <div className="avatar">
                        {item.contratanteAvatar ? (
                          <img src={item.contratanteAvatar} alt="avatar" className="avatar-img" />
                        ) : (
                          (item.contratanteNombre || '—').charAt(0)
                        )}
                      </div>
                      <span>{item.contratanteNombre || '—'}</span>
                    </Link>
                  ) : (
                    <span style={{ fontWeight: '600', color: colores.textoOscuro }}>{item.contratanteNombre || '—'}</span>
                  )}
                </td>
                <td>
                  {item.status === 'COMPLETED' ? (
                    <span className="reviewed-chip">
                      <CheckCircle size={16} /> Arriendo concretado
                    </span>
                  ) : yaConfirme ? (
                    <span className="waiting-chip">
                      <Clock size={16} /> Esperando la confirmación de la otra persona...
                    </span>
                  ) : (
                    <span className="waiting-chip">
                      <MessageSquareText size={16} /> Confirma desde la conversación
                    </span>
                  )}
                </td>
                <td>
                  {item.completedAt ? (
                    <span style={{ color: colores.textoOscuro, fontWeight: 600 }}>
                      {new Date(item.completedAt).toLocaleDateString('es-CL', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </span>
                  ) : '—'}
                </td>
                <td>
                  {item.status === 'COMPLETED' && item.puedeCalificar ? (
                    <button
                      onClick={() => abrirModalCalificar(item)}
                      className="calificar-button"
                    >
                      <span className="calificar-icon"><Star size={16} fill="#fff" /></span>
                      <span>
                        <strong className="calificar-title">Comparte tu opinión sobre esta persona</strong>
                      </span>
                      <ArrowRight size={16} />
                    </button>
                  ) : item.status === 'COMPLETED' && item.miResena ? (
                    <span className="reviewed-chip">
                      <CheckCircle size={16} /> Ya calificaste
                    </span>
                  ) : item.status === 'COMPLETED' ? (
                    <span className="reviewed-chip">
                      <CheckCircle size={16} /> Arriendo concretado
                    </span>
                  ) : (
                    <span style={{ color: '#aaa', fontSize: '13px', fontStyle: 'italic' }}>Faltan confirmaciones</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {modalAbierto && (
        <div className="modal-overlay" onClick={cerrarModalCalificacion}>
          <div className="modal-card" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3 className="modal-title">Comparte tu experiencia</h3>
                <p className="modal-subtitle">Tu calificación ayuda a que otras personas tomen una decisión</p>
              </div>
              <button type="button" onClick={cerrarModalCalificacion} className="close-button" aria-label="Cerrar modal">
                <X size={18} />
              </button>
            </div>

            <div className="review-context">
              <div className="review-context-icon">
                <MessageSquareText size={18} />
              </div>
              <div>
                <p className="review-context-title">{arriendoSeleccionado?.contratanteNombre}</p>
              </div>
            </div>

            <form onSubmit={handleEnviarCalificacion} className="modal-form">
              <div>
                <label className="modal-label">Tu puntuación</label>
                <div className="star-row">
                  {[1, 2, 3, 4, 5].map((value) => {
                    const active = value <= rating;

                    return (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setRating(value)}
                        // Usamos template literals para asignar la clase "active" de forma dinámica
                        className={`star-button ${active ? 'active' : ''}`}
                        aria-label={`${value} estrellas`}
                      >
                        <Star size={18} fill={active ? '#f59e0b' : 'transparent'} />
                      </button>
                    );
                  })}
                </div>
                <p className="rating-hint">{rating} estrella{rating === 1 ? '' : 's'} seleccionada{rating === 1 ? '' : 's'}</p>
              </div>

              <label className="field">
                <span className="modal-label">Comentario opcional</span>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  maxLength={1000}
                  rows="4"
                  placeholder="Escribe una reseña honesta y concreta..."
                  className="textarea-input"
                />
              </label>

              <div className="footer-actions">
                <button type="button" onClick={cerrarModalCalificacion} className="secondary-button" disabled={sendingReview}>
                  Cancelar
                </button>
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