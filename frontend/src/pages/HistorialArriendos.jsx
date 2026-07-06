import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Archive, CheckCircle, ChevronLeft, ChevronRight, Eye, Inbox, MessageSquareText, RotateCcw, Star, X, Landmark} from 'lucide-react';
import { listarArriendos, crearResena } from '../services/rentalsAndReviews.service.js';
import { showSuccessConfirm, showErrorAlert } from '@helpers/sweetAlert';
import { useAuth } from '../context/AuthContext.jsx';
import AvatarCirculo from '@components/AvatarCirculo.jsx';
import '@styles/historialArriendos.css';

export default function HistorialArriendos() {
  const navigate = useNavigate();
  const [arriendos, setArriendos] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [arriendoSeleccionado, setArriendoSeleccionado] = useState(null);
  const [sendingReview, setSendingReview] = useState(false);

  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [anonimo, setAnonimo] = useState(false);

  const [statusFilter, setStatusFilter] = useState('todos');
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const PAGE_SIZE = 20;

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

    const enriched = (Array.isArray(data) ? data : [])
      .filter((r) => r.status === 'COMPLETED' || r.status === 'FINISHED')
      .map((r) => ({
        ...r,
        contratanteNombre: Number(user?.id) === r.arrendadorId ? r.estudiante?.nombreCompleto : r.arrendador?.nombreCompleto || '—',
        contratanteId: Number(user?.id) === r.arrendadorId ? r.estudiante?.id : r.arrendador?.id || null,
        contratantePublicId: Number(user?.id) === r.arrendadorId ? r.estudiante?.publicId : r.arrendador?.publicId || null,
        contratanteAvatar: (Number(user?.id) === r.arrendadorId ? r.estudiante?.fotoPerfil : r.arrendador?.fotoPerfil) || null,
      }));

    setArriendos(enriched);
    setLoading(false);
  };

  useEffect(() => {
    cargarDatos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const hayFiltrosActivos = statusFilter !== 'todos' || Boolean(fechaDesde) || Boolean(fechaHasta);

  const limpiarFiltros = () => {
    setStatusFilter('todos');
    setFechaDesde('');
    setFechaHasta('');
  };

  const arriendosFiltrados = useMemo(() => {
    return arriendos.filter((item) => {
      if (statusFilter !== 'todos' && item.status !== statusFilter) return false;

      if (fechaDesde || fechaHasta) {
        if (!item.completedAt) return false;
        const fecha = new Date(item.completedAt);
        if (fechaDesde && fecha < new Date(`${fechaDesde}T00:00:00`)) return false;
        if (fechaHasta && fecha > new Date(`${fechaHasta}T23:59:59`)) return false;
      }

      return true;
    });
  }, [arriendos, statusFilter, fechaDesde, fechaHasta]);

  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, fechaDesde, fechaHasta]);

  const totalPages = Math.max(1, Math.ceil(arriendosFiltrados.length / PAGE_SIZE));

  useEffect(() => {
    setCurrentPage((page) => Math.min(page, totalPages));
  }, [totalPages]);

  const arriendosPaginados = useMemo(() => {
    const inicio = (currentPage - 1) * PAGE_SIZE;
    return arriendosFiltrados.slice(inicio, inicio + PAGE_SIZE);
  }, [arriendosFiltrados, currentPage]);

  const abrirModalCalificar = (arriendo) => {
    setArriendoSeleccionado(arriendo);
    setModalAbierto(true);
  };

  const cerrarModalCalificacion = () => {
    setModalAbierto(false);
    setArriendoSeleccionado(null);
    setComment('');
    setRating(5);
    setAnonimo(false);
    setSendingReview(false);
  };

  const handleEnviarCalificacion = async (e) => {
    e.preventDefault();
    if (!arriendoSeleccionado) return;

    const targetUserId = Number(user?.id) === arriendoSeleccionado.arrendadorId
      ? arriendoSeleccionado.estudianteId
      : arriendoSeleccionado.arrendadorId;

    const payload = { rentalId: arriendoSeleccionado.id, targetUserId, rating, comment, isAnonymous: anonimo };

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

      <div className="historial-filters">
        <div className="filter-group">
          <span className="filter-group-label">Estado</span>
          <div className="filter-pills" role="group" aria-label="Filtrar por estado del arriendo">
            <button
              type="button"
              className={`filter-pill ${statusFilter === 'todos' ? 'filter-pill--active' : ''}`}
              onClick={() => setStatusFilter('todos')}
            >
              Todos
            </button>
            <button
              type="button"
              className={`filter-pill ${statusFilter === 'COMPLETED' ? 'filter-pill--active' : ''}`}
              onClick={() => setStatusFilter('COMPLETED')}
            >
              <CheckCircle size={14} /> Concretados
            </button>
            <button
              type="button"
              className={`filter-pill ${statusFilter === 'FINISHED' ? 'filter-pill--active' : ''}`}
              onClick={() => setStatusFilter('FINISHED')}
            >
              <Archive size={14} /> Finalizados
            </button>
          </div>
        </div>

        <div className="filter-group filter-group--dates">
          <div className="filter-date-range">
            <label className="filter-date-field">
              <span className="filter-group-label">Desde</span>
              <input
                type="date"
                value={fechaDesde}
                max={fechaHasta || undefined}
                onChange={(e) => setFechaDesde(e.target.value)}
              />
            </label>
            <span className="filter-date-divider" aria-hidden="true" />
            <label className="filter-date-field">
              <span className="filter-group-label">Hasta</span>
              <input
                type="date"
                value={fechaHasta}
                min={fechaDesde || undefined}
                onChange={(e) => setFechaHasta(e.target.value)}
              />
            </label>
          </div>
          {hayFiltrosActivos && (
            <button type="button" className="filter-clear-button" onClick={limpiarFiltros}>
              <RotateCcw size={14} /> Limpiar filtros
            </button>
          )}
        </div>
      </div>

      <div className="historial-table-wrap">
      <table className="historial-table">
        <thead>
          <tr>
            <th>Nombre del contratante</th>
            <th>Estado de confirmación</th>
            <th>Fecha de confirmación</th>
            <th>Evaluación mutua</th>
            <th>Detalle</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan="5" style={{ textAlign: 'center', padding: '40px' }}>
                Cargando historial de arriendos...
              </td>
            </tr>
          ) : arriendos.length === 0 ? (
            <tr>
              <td colSpan="5" style={{ padding: 0 }}>
                <div className="historial-empty-state">
                  <div className="historial-empty-icon"><Inbox size={28} /></div>
                  <h3 className="historial-empty-title">No hay arriendos todavía</h3>
                  <p className="historial-empty-text">Cuando concretes tu primer arriendo, aparecerá aquí con sus opciones para calificar.</p>
                </div>
              </td>
            </tr>
          ) : arriendosFiltrados.length === 0 ? (
            <tr>
              <td colSpan="5" style={{ padding: 0 }}>
                <div className="historial-empty-state">
                  <div className="historial-empty-icon"><Inbox size={28} /></div>
                  <h3 className="historial-empty-title">Sin resultados para estos filtros</h3>
                  <p className="historial-empty-text">Prueba con otro estado o con otro rango de fechas.</p>
                  <button type="button" className="ver-detalle-button" onClick={limpiarFiltros}>Limpiar filtros</button>
                </div>
              </td>
            </tr>
          ) : arriendosPaginados.map((item) => (
            <tr key={item.id}>
              <td>
                {item.contratanteId ? (
                  <Link to={`/perfil/${item.contratantePublicId}`} className="person-link">
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
                {item.status === 'FINISHED' ? (
                  <span className="finished-chip"><Archive size={16} /> Arriendo finalizado</span>
                ) : (
                  <span className="reviewed-chip"><CheckCircle size={16} /> Arriendo concretado</span>
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
                {item.puedeCalificar ? (
                  <button onClick={() => abrirModalCalificar(item)} className="calificar-button">
                    <span><Star size={16} /></span>
                    <span className="calificar-title">Comparte tu opinión</span>
                    <ArrowRight size={16} />
                  </button>
                ) : (
                  <span className="reviewed-chip"><CheckCircle size={16} /> Ya calificaste</span>
                )}
              </td>
              <td>
                <button onClick={() => navigate(`/arriendo/${item.publicId}`)} className="ver-detalle-button">
                  <Eye size={14} /> Ver detalle
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>

      {arriendos.length > 0 && (
        <div className="historial-pagination">
          <button
            type="button"
            className="pagination-button"
            onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft size={16} /> Anterior
          </button>
          <span className="pagination-info">Página {currentPage} de {totalPages}</span>
          <button
            type="button"
            className="pagination-button"
            onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
            disabled={currentPage === totalPages}
          >
            Siguiente <ChevronRight size={16} />
          </button>
        </div>
      )}

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
              <label className="anonimo-label">
                <input
                  type="checkbox"
                  checked={anonimo}
                  onChange={(e) => setAnonimo(e.target.checked)}
                />
                <span>Enviar como anónimo</span>
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