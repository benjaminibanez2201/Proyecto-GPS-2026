import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, BadgeCheck, CalendarDays, ChevronRight, MessageSquareQuote, Star, UserRound } from 'lucide-react';
import { useAuth } from '@context/AuthContext';
import { obtenerPerfilUsuario, obtenerResenasRecibidas } from '../services/rentalsAndReviews.service.js';

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

  if (loading) return <div style={styles.stateBox}>Cargando calificaciones recibidas...</div>;
  if (error) return <div style={styles.stateBoxError}>{error}</div>;

  return (
    <div style={styles.page}>
      <section style={styles.hero}>
        <div style={styles.topRow}>
          <Link to="/profile" style={styles.backLink}>
            <ArrowLeft size={16} strokeWidth={2.4} />
            Volver a mi perfil
          </Link>
          <span style={styles.roleBadge}>
            <BadgeCheck size={14} strokeWidth={2.4} />
            {perfil?.rol || user?.rol || 'usuario'}
          </span>
        </div>

        <div style={styles.heroContent}>
          <div style={styles.avatar}>{getInitial(perfil?.nombreCompleto || user?.nombreCompleto)}</div>
          <div>
            <h1 style={styles.title}>Calificaciones recibidas</h1>
          </div>
        </div>

        <div style={styles.statsRow}>
          <article style={styles.statCard}>
            <p style={styles.statLabel}>Promedio</p>
            <div style={styles.ratingLine}>
              {renderStars(avgRating)}
              <strong style={styles.statValue}>{avgRating.toFixed(1)}</strong>
            </div>
          </article>
          <article style={styles.statCard}>
            <p style={styles.statLabel}>Total</p>
            <strong style={styles.bigValue}>{perfil?.reviewsCount ?? resenas.length}</strong>
          </article>
        </div>
      </section>

      <section style={styles.section}>
        <header style={styles.sectionHeader}>
          <div>
            <h2 style={styles.sectionTitle}>Todas tus valoraciones</h2>
          </div>
          <span style={styles.sectionCount}>{resenas.length} comentarios</span>
        </header>

        {resenas.length === 0 ? (
          <div style={styles.emptyState}>
            <MessageSquareQuote size={38} strokeWidth={1.9} />
            <h3 style={styles.emptyTitle}>Aún no tienes calificaciones visibles</h3>
            <p style={styles.emptyText}>Cuando recibas una, aparecerán aquí con el detalle completo.</p>
          </div>
        ) : (
          <div style={styles.list}>
            {resenas.map((resena) => (
              <article key={resena.id} style={styles.card}>
                <div style={styles.cardTop}>
                  <div style={styles.authorBlock}>
                    <div style={styles.authorAvatar}>{getInitial(resena.author?.nombreCompleto)}</div>
                    <div>
                      <div style={styles.authorLine}>
                        <UserRound size={14} strokeWidth={2.1} />
                        <Link to={`/perfil/${resena.author?.id}`} style={styles.authorLink}>
                          {resena.author?.nombreCompleto || 'Usuario anónimo'}
                        </Link>
                      </div>
                      <div style={styles.metaLine}>
                        <CalendarDays size={13} strokeWidth={2} />
                        <span>{formatDate(resena.createdAt)}</span>
                      </div>
                    </div>
                  </div>

                  <div style={styles.starsWrap}>{renderStars(resena.rating)}</div>
                </div>

                <div style={styles.commentBox}>
                  <p style={styles.commentText}>{resena.comment || 'Sin comentarios de texto.'}</p>
                </div>

                <div style={styles.cardFooter}>
                  <Link to={`/perfil/${resena.author?.id}`} style={styles.profileLink}>
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

const styles = {
  page: {
    display: 'flex',
    flexDirection: 'column',
    gap: '18px',
    padding: '4px 0 18px',
  },
  hero: {
    display: 'flex',
    flexDirection: 'column',
    gap: '18px',
    padding: '26px',
    borderRadius: '24px',
    background: 'linear-gradient(135deg, #0f766e 0%, #164e63 50%, #0f172a 100%)',
    color: '#ffffff',
    boxShadow: '0 18px 38px rgba(15, 118, 110, 0.18)',
  },
  topRow: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '12px',
    flexWrap: 'wrap',
  },
  backLink: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    textDecoration: 'none',
    color: '#ffffff',
    padding: '10px 14px',
    borderRadius: '999px',
    backgroundColor: 'rgba(255,255,255,0.12)',
    border: '1px solid rgba(255,255,255,0.14)',
  },
  roleBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '10px 14px',
    borderRadius: '999px',
    backgroundColor: 'rgba(255,255,255,0.12)',
    border: '1px solid rgba(255,255,255,0.14)',
    textTransform: 'capitalize',
  },
  heroContent: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    flexWrap: 'wrap',
  },
  avatar: {
    width: '72px',
    height: '72px',
    borderRadius: '22px',
    display: 'grid',
    placeItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.16)',
    border: '1px solid rgba(255,255,255,0.18)',
    fontSize: '30px',
    fontWeight: 800,
    flexShrink: 0,
  },
  eyebrow: {
    display: 'inline-flex',
    marginBottom: '8px',
    padding: '6px 12px',
    borderRadius: '999px',
    backgroundColor: 'rgba(255,255,255,0.12)',
    fontSize: '12px',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  title: {
    margin: '0 0 8px',
    fontSize: 'clamp(28px, 4vw, 42px)',
    lineHeight: 1.05,
  },
  subtitle: {
    margin: 0,
    maxWidth: '70ch',
    fontSize: '15px',
    lineHeight: 1.6,
    color: 'rgba(255,255,255,0.88)',
  },
  statsRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '12px',
  },
  statCard: {
    padding: '16px 18px',
    borderRadius: '18px',
    backgroundColor: 'rgba(255,255,255,0.12)',
    border: '1px solid rgba(255,255,255,0.14)',
  },
  statLabel: {
    margin: '0 0 6px',
    fontSize: '13px',
    opacity: 0.84,
  },
  ratingLine: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    flexWrap: 'wrap',
  },
  statValue: {
    fontSize: '20px',
  },
  bigValue: {
    fontSize: '30px',
    fontWeight: 800,
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
  },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    gap: '12px',
    flexWrap: 'wrap',
  },
  sectionEyebrow: {
    margin: '0 0 4px',
    fontSize: '12px',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    color: '#0f766e',
  },
  sectionTitle: {
    margin: 0,
    fontSize: '24px',
    color: '#0f172a',
  },
  sectionCount: {
    padding: '8px 12px',
    borderRadius: '999px',
    backgroundColor: '#e6f4f1',
    color: '#0f766e',
    fontWeight: 700,
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
  },
  card: {
    padding: '18px',
    borderRadius: '22px',
    backgroundColor: '#ffffff',
    border: '1px solid rgba(15, 23, 42, 0.06)',
    boxShadow: '0 10px 26px rgba(15, 23, 42, 0.06)',
  },
  cardTop: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '12px',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
  },
  authorBlock: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  authorAvatar: {
    width: '46px',
    height: '46px',
    borderRadius: '14px',
    display: 'grid',
    placeItems: 'center',
    backgroundColor: '#0f766e',
    color: '#ffffff',
    fontWeight: 800,
    flexShrink: 0,
  },
  authorLine: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontWeight: 700,
    color: '#0f172a',
  },
  authorLink: {
    color: '#0f172a',
    textDecoration: 'none',
  },
  metaLine: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    marginTop: '4px',
    color: '#64748b',
    fontSize: '13px',
  },
  starsWrap: {
    display: 'flex',
    gap: '3px',
    paddingTop: '4px',
  },
  commentBox: {
    marginTop: '14px',
    padding: '14px 16px',
    borderRadius: '16px',
    backgroundColor: '#f8fafc',
    border: '1px solid rgba(15, 23, 42, 0.05)',
  },
  commentText: {
    margin: 0,
    color: '#334155',
    lineHeight: 1.65,
  },
  cardFooter: {
    display: 'flex',
    justifyContent: 'flex-end',
    marginTop: '14px',
  },
  profileLink: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '10px 14px',
    borderRadius: '12px',
    backgroundColor: '#e6f4f1',
    color: '#0f766e',
    textDecoration: 'none',
    fontWeight: 700,
  },
  emptyState: {
    display: 'grid',
    placeItems: 'center',
    gap: '8px',
    padding: '40px 20px',
    borderRadius: '22px',
    backgroundColor: '#ffffff',
    border: '1px dashed rgba(15, 23, 42, 0.12)',
    textAlign: 'center',
    color: '#475569',
  },
  emptyTitle: {
    margin: 0,
    color: '#0f172a',
  },
  emptyText: {
    margin: 0,
    maxWidth: '58ch',
    lineHeight: 1.6,
  },
  stateBox: {
    padding: '20px',
    borderRadius: '18px',
    backgroundColor: '#ffffff',
    border: '1px solid rgba(15, 23, 42, 0.06)',
    textAlign: 'center',
  },
  stateBoxError: {
    padding: '18px 20px',
    borderRadius: '18px',
    backgroundColor: '#fff1f2',
    color: '#9f1239',
    border: '1px solid #fecdd3',
  },
};