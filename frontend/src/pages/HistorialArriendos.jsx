import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle, Clock, Inbox, MessageSquareText, Star, X } from 'lucide-react';
import { listarArriendos, confirmarArriendo, crearResena } from '../services/rentalsAndReviews.service.js';
import { showSuccessConfirm, showErrorAlert } from '@helpers/sweetAlert';
import { useAuth } from '../context/AuthContext.jsx';

export default function HistorialArriendos() {
  const [arriendos, setArriendos] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [arriendoSeleccionado, setArriendoSeleccionado] = useState(null);
  const [loadingConfirmId, setLoadingConfirmId] = useState(null);
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

  const handleConfirmar = async (id) => {
    try {
      setLoadingConfirmId(id);
      const [, err] = await confirmarArriendo(id);
      if (err) {
        showErrorAlert('Error', err);
      } else {
        await showSuccessConfirm('¡Felicitaciones!', 'Se ha confirmado el arriendo.', 'OK');
        cargarDatos();
      }
    } catch {
      showErrorAlert('Error', 'Ocurrió un error al confirmar el arriendo');
    } finally {
      setLoadingConfirmId(null);
    }
  };

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

    const [, err] = await crearResena(payload);
    if (err) alert(err);
    else {
      alert('Calificacion enviada exitosamente');
      setModalAbierto(false);
      setComment('');
      setRating(5);
    try {
      setSendingReview(true);
      const [, err] = await crearResena(payload);

      if (err) {
        showErrorAlert('No se pudo enviar la calificación', err);
        return;
      }

      await showSuccessConfirm(
        'Calificación enviada',
        'La contraparte recibirá una notificación dentro del sistema.',
        'Entendido',
      );

      cerrarModalCalificacion();
      cargarDatos();
    } finally {
      setSendingReview(false);
    }
  };

  return (
    <div style={styles.page}>
      <section style={styles.hero}>
        <div>
          <p style={styles.eyebrow}>Historial</p>
          <h2 style={styles.title}>Arriendos concretados</h2>
          <p style={styles.subtitle}>Revisa tus arriendos, dale a confirmar y deja una calificación.</p>
        </div>
      </section>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      <table border="0" cellPadding="15" style={styles.table}>
        <thead>
          <tr style={{ backgroundColor: colores.secundario, color: colores.textoOscuro }}>
            <th>Nombre del contratante</th>
            <th>Acciones de Confirmación</th>
            <th>Evaluación mutua</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan="3" style={styles.loadingCell}>
                Cargando historial de arriendos...
              </td>
            </tr>
          ) : arriendos.length === 0 ? (
            <tr>
              <td colSpan="3" style={styles.emptyCell}>
                <div style={styles.emptyState}>
                  <div style={styles.emptyIcon}>
                    <Inbox size={28} />
                  </div>
                  <strong>No hay arriendos todavía</strong>
                  <span style={styles.emptyText}>
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
                    <Link to={`/perfil/${item.contratanteId}`} style={styles.personLink}>
                      <div style={styles.avatar}>
                        {item.contratanteAvatar ? (
                          <img src={item.contratanteAvatar} alt="avatar" style={styles.avatarImg} />
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
                    <span style={styles.reviewedChip}>
                      <CheckCircle size={16} /> Arriendo concretado
                    </span>
                  ) : yaConfirme ? (
                    <span style={styles.waitingChip}>
                      <Clock size={16} /> Esperando otra parte
                    </span>
                  ) : (
                    <button
                      onClick={() => handleConfirmar(item.id)}
                      className="confirm-btn"
                      disabled={loadingConfirmId === item.id}
                    >
                      {loadingConfirmId === item.id ? 'Confirmando...' : 'Confirmar arriendo'}
                    </button>
                  )}
                </td>
                <td>
                  {item.status === 'COMPLETED' && item.puedeCalificar ? (
                    <button
                      onClick={() => abrirModalCalificar(item)}
                      style={styles.calificarButton}
                    >
                      <span style={styles.calificarIcon}><Star size={16} fill="#fff" /></span>
                      <span>
                        <strong style={styles.calificarTitle}>Calificar contraparte</strong>
                        <small style={styles.calificarSubtext}>Deja una opinión sobre el arriendo</small>
                      </span>
                      <ArrowRight size={16} />
                    </button>
                  ) : item.status === 'COMPLETED' && item.miResena ? (
                    <span style={styles.reviewedChip}>
                      <CheckCircle size={16} /> Ya calificaste
                    </span>
                  ) : item.status === 'COMPLETED' ? (
                    <span style={styles.reviewedChip}>
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
        <div style={styles.modalOverlay} onClick={cerrarModalCalificacion}>
          <div style={styles.modalCard} onClick={(event) => event.stopPropagation()}>
            <div style={styles.modalHeader}>
              <div>
                <p style={styles.modalEyebrow}>Calificación</p>
                <h3 style={styles.modalTitle}>Comparte tu experiencia</h3>
                <p style={styles.modalSubtitle}>Tu calificación ayuda a que otras personas tomen una decisión</p>
              </div>
              <button type="button" onClick={cerrarModalCalificacion} style={styles.closeButton} aria-label="Cerrar modal">
                <X size={18} />
              </button>
            </div>

            <div style={styles.reviewContext}>
              <div style={styles.reviewContextIcon}>
                <MessageSquareText size={18} />
              </div>
              <div>
                <p style={styles.reviewContextTitle}>{arriendoSeleccionado?.contratanteNombre || 'Contraparte'}</p>
              </div>
            </div>

            <form onSubmit={handleEnviarCalificacion} style={styles.modalForm}>
              <div>
                <label style={styles.label}>Tu puntuación</label>
                <div style={styles.starRow}>
                  {[1, 2, 3, 4, 5].map((value) => {
                    const active = value <= rating;

                    return (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setRating(value)}
                        style={{
                          ...styles.starButton,
                          backgroundColor: active ? '#fff7d1' : '#f8fafc',
                          borderColor: active ? '#fbbf24' : '#e2e8f0',
                          color: active ? '#f59e0b' : '#94a3b8',
                        }}
                        aria-label={`${value} estrellas`}
                      >
                        <Star size={18} fill={active ? '#f59e0b' : 'transparent'} />
                      </button>
                    );
                  })}
                </div>
                <p style={styles.ratingHint}>{rating} estrella{rating === 1 ? '' : 's'} seleccionada{rating === 1 ? '' : 's'}</p>
              </div>

              <label style={styles.field}>
                <span style={styles.label}>Comentario opcional</span>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  maxLength={1000}
                  rows="4"
                  placeholder="Escribe una reseña honesta y concreta..."
                  style={styles.textarea}
                />
              </label>

              <div style={styles.footerActions}>
                <button type="button" onClick={cerrarModalCalificacion} style={styles.secondaryButton} disabled={sendingReview}>
                  Cancelar
                </button>
                <button type="submit" style={styles.primaryButton} disabled={sendingReview}>
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

const styles = {
  page: {
    padding: '20px 0 12px',
    backgroundColor: '#f9f8f6',
    minHeight: '100vh',
    fontFamily: 'sans-serif',
  },
  hero: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '16px',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    padding: '20px 24px',
    borderRadius: '24px',
    color: '#ffffff',
    background: 'linear-gradient(135deg, #008080 0%, #0b6b7a 45%, #163d4f 100%)',
    boxShadow: '0 20px 40px rgba(11, 34, 45, 0.18)',
    marginBottom: '18px',
  },
  eyebrow: {
    margin: '0 0 6px',
    fontSize: '12px',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    color: 'rgba(255,255,255,0.8)',
  },
  title: {
    margin: '0 0 8px',
    fontSize: '28px',
    lineHeight: 1.05,
  },
  subtitle: {
    margin: 0,
    maxWidth: '68ch',
    fontSize: '14px',
    lineHeight: 1.6,
    color: 'rgba(255,255,255,0.88)',
  },
  heroBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 14px',
    borderRadius: '999px',
    backgroundColor: 'rgba(255,255,255,0.12)',
    border: '1px solid rgba(255,255,255,0.14)',
    whiteSpace: 'nowrap',
    fontWeight: 700,
  },
  table: {
    width: '100%',
    textAlign: 'left',
    borderCollapse: 'collapse',
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
    overflow: 'hidden',
  },
  loadingCell: {
    padding: '28px 18px',
    textAlign: 'center',
    color: '#6c757d',
  },
  emptyCell: {
    padding: '36px 18px',
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '10px',
    textAlign: 'center',
    color: '#2c3e50',
  },
  emptyIcon: {
    width: 56,
    height: 56,
    borderRadius: '50%',
    backgroundColor: '#f3f5f7',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#008080',
  },
  emptyText: {
    maxWidth: '460px',
    color: '#6c757d',
    lineHeight: 1.5,
  },
  personLink: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    textDecoration: 'none',
    color: '#2c3e50',
    fontWeight: 600,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: '50%',
    backgroundColor: '#f0f0f0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    fontWeight: 700,
    color: '#555',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  completedChip: {
    color: '#28a745',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '5px',
    fontWeight: 700,
  },
  waitingChip: {
    color: '#ffc107',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '5px',
    fontWeight: 700,
  },
  reviewedChip: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 14px',
    borderRadius: '999px',
    backgroundColor: '#e6f4f1',
    color: '#0f766e',
    fontWeight: 700,
    fontSize: '13px',
  },
  calificarButton: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '12px',
    padding: '14px 16px',
    borderRadius: '18px',
    border: '1px solid rgba(15, 118, 110, 0.18)',
    background: 'linear-gradient(135deg, #0f766e 0%, #0b6b7a 100%)',
    color: '#ffffff',
    boxShadow: '0 12px 26px rgba(15, 118, 110, 0.22)',
    textAlign: 'left',
  },
  calificarIcon: {
    width: '36px',
    height: '36px',
    borderRadius: '12px',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.14)',
    flexShrink: 0,
  },
  calificarTitle: {
    display: 'block',
    fontSize: '14px',
  },
  calificarSubtext: {
    fontSize: '12px',
    opacity: 0.82,
    fontWeight: 500,
  },
  modalOverlay: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
    zIndex: 50,
    backdropFilter: 'blur(8px)',
  },
  modalCard: {
    width: 'min(560px, 100%)',
    borderRadius: '28px',
    background: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)',
    border: '1px solid rgba(15, 23, 42, 0.08)',
    boxShadow: '0 24px 80px rgba(15, 23, 42, 0.25)',
    padding: '24px',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '16px',
    alignItems: 'flex-start',
  },
  modalEyebrow: {
    margin: '0 0 6px',
    fontSize: '12px',
    fontWeight: 800,
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    color: '#008080',
  },
  modalTitle: {
    margin: '0 0 6px',
    fontSize: '22px',
    color: '#0f172a',
  },
  modalSubtitle: {
    margin: 0,
    color: '#64748b',
    fontSize: '14px',
    lineHeight: 1.5,
  },
  closeButton: {
    width: '40px',
    height: '40px',
    borderRadius: '12px',
    border: '1px solid #e2e8f0',
    backgroundColor: '#ffffff',
    color: '#0f172a',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  reviewContext: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginTop: '18px',
    padding: '14px',
    borderRadius: '18px',
    backgroundColor: '#eef6f5',
    border: '1px solid rgba(15, 118, 110, 0.12)',
  },
  reviewContextIcon: {
    width: '42px',
    height: '42px',
    borderRadius: '14px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#008080',
    backgroundColor: '#ffffff',
    flexShrink: 0,
  },
  reviewContextTitle: {
    margin: '0 0 4px',
    fontSize: '15px',
    fontWeight: 700,
    color: '#0f172a',
  },
  reviewContextText: {
    margin: 0,
    fontSize: '13px',
    color: '#475569',
  },
  modalForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: '18px',
    marginTop: '20px',
  },
  label: {
    display: 'block',
    marginBottom: '8px',
    fontSize: '13px',
    fontWeight: 700,
    color: '#334155',
  },
  starRow: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap',
  },
  starButton: {
    width: '48px',
    height: '48px',
    borderRadius: '14px',
    border: '1px solid #e2e8f0',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 0,
  },
  ratingHint: {
    margin: '8px 0 0',
    fontSize: '13px',
    color: '#64748b',
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
  },
  textarea: {
    width: '100%',
    padding: '14px 16px',
    borderRadius: '16px',
    border: '1px solid #e2e8f0',
    backgroundColor: '#ffffff',
    color: '#0f172a',
    fontSize: '14px',
    resize: 'vertical',
    minHeight: '120px',
    outline: 'none',
    boxSizing: 'border-box',
  },
  footerActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    flexWrap: 'wrap',
  },
  secondaryButton: {
    padding: '12px 18px',
    borderRadius: '14px',
    border: '1px solid #e2e8f0',
    backgroundColor: '#ffffff',
    color: '#0f172a',
    fontWeight: 700,
  },
  primaryButton: {
    padding: '12px 18px',
    borderRadius: '14px',
    border: 'none',
    background: 'linear-gradient(135deg, #0f766e 0%, #0b6b7a 100%)',
    color: '#ffffff',
    fontWeight: 700,
    boxShadow: '0 14px 28px rgba(15, 118, 110, 0.22)',
  },
}};
