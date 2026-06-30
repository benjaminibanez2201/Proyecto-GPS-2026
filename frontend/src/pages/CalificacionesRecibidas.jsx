import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, CalendarDays, ChevronRight, MessageSquareQuote, Star, UserRound } from 'lucide-react';
import { useAuth } from '@context/AuthContext';
import { obtenerPerfilUsuario, obtenerResenasRecibidas } from '../services/rentalsAndReviews.service.js';
import '@styles/calificaciones.css';

function renderStars(rating) {
  const max = 5;
  const filled = Math.max(0, Math.min(max, Math.round(Number(rating || 0))));

  return Array.from({ length: max }, (_, index) => (
    <Star
      key={index}
      size={18}
      fill={index < filled ? '#f4b400' : 'transparent'}
      color={index < filled ? '#f4b400' : '#d1d5db'}
      strokeWidth={2}
    />
  ));
}

function formatDate(value) {
  if (!value) return 'Fecha no disponible';
  return new Date(value).toLocaleDateString('es-CL', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function getInitial(name) {
  return (name || 'U').trim().charAt(0).toUpperCase();
}

export default function CalificacionesRecibidas() {
  const { user } = useAuth();
  const [perfil, setPerfil] = useState(null);
  const [resenas, setResenas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const avgRating = useMemo(() => Number(perfil?.avgRating || user?.avgRating || 0), [perfil, user]);

  useEffect(() => {
    const cargarDatos = async () => {
      setLoading(true);
      const [dataResenas, errResenas] = await obtenerResenasRecibidas();
      const [dataPerfil, errPerfil] = await obtenerPerfilUsuario(user?.id);

      if (errResenas) setError(errResenas);
      if (errPerfil) setError(errPerfil);

      if (dataResenas) setResenas(dataResenas);
      if (dataPerfil) setPerfil(dataPerfil);
      setLoading(false);
    };

    if (user?.id) cargarDatos();
  }, [user?.id]);

  if (loading) return <div className="state-box">Cargando calificaciones recibidas...</div>;
  if (error) return <div className="state-box-error">{error}</div>;

  return (
    <div className="page">
      <section className="hero">
        <div className="top-row">
          <Link to="/profile" className="back-link">
            <ArrowLeft size={16} strokeWidth={2.4} />
            Volver a mi perfil
          </Link>
          
          <article className="stat-card">
            <p className="stat-label">Promedio de calificaciones</p>
            <div className="rating-line">
              {renderStars(avgRating)}
              <strong className="stat-value">{avgRating.toFixed(1)}</strong>
            </div>
          </article>
        </div>

        <div className="hero-content">
          <div className="avatar">{getInitial(perfil?.nombreCompleto || user?.nombreCompleto)}</div>
          <div>
            <h1 className="title">Calificaciones recibidas</h1>
          </div>
        </div>
      </section>

      <section className="section">
        <header className="section-header">
          <div>
            <h2 className="section-title">Todas tus valoraciones</h2>
          </div>
          <span className="section-count">{resenas.length} comentarios</span>
        </header>

        {resenas.length === 0 ? (
          <div className="empty-state">
            <MessageSquareQuote size={38} strokeWidth={1.9} />
            <h3 className="empty-title">Aún no tienes calificaciones visibles</h3>
            <p className="empty-text">Cuando recibas una, aparecerán aquí con el detalle completo.</p>
          </div>
        ) : (
          <div className="list">
            {resenas.map((resena) => (
              <article key={resena.id} className="card">
                <div className="card-top">
                  <div className="author-block">
                    <div className="author-avatar">{getInitial(resena.author?.nombreCompleto)}</div>
                    <div>
                      <div className="author-line">
                        <UserRound size={14} strokeWidth={2.1} />
                        <Link to={`/perfil/${resena.author?.id}`} className="author-link">
                          {resena.author?.nombreCompleto || 'Usuario anónimo'}
                        </Link>
                      </div>
                      <div className="meta-line">
                        <CalendarDays size={13} strokeWidth={2} />
                        <span>{formatDate(resena.createdAt)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="stars-wrap">{renderStars(resena.rating)}</div>
                </div>

                <div className="comment-box">
                  <p className="comment-text">{resena.comment || 'Sin comentarios de texto.'}</p>
                </div>

                <div className="card-footer">
                  <Link to={`/perfil/${resena.author?.id}`} className="profile-link">
                    Revisar perfil
                    <ChevronRight size={15} strokeWidth={2.4} />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}