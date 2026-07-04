import { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { Star, ArrowLeft, UserRound, CalendarDays, MessageSquareText } from 'lucide-react';
import { obtenerResenasUsuario, obtenerPerfilUsuario } from '../services/rentalsAndReviews.service.js';
import AvatarCirculo from '../components/AvatarCirculo.jsx';
import '@styles/perfilUsuario.css';

function renderEstrellas(nota) {
  const max = 5;
  const llenas = Math.min(Math.max(Math.round(Number(nota) || 0), 0), max);

  return Array.from({ length: max }, (_, index) => (
    <Star
      key={index}
      size={18}
      strokeWidth={2}
      fill={index < llenas ? '#f4b400' : 'transparent'}
      color={index < llenas ? '#f4b400' : '#d1d5db'}
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

export default function PerfilUsuario() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [usuario, setUsuario] = useState(null);
  const [resenas, setResenas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const cargarPerfilYResenas = async () => {
      setLoading(true);
      try {
        const [dataResenas, errResenas] = await obtenerResenasUsuario(id);
        const [dataUsuario, errUsuario] = await obtenerPerfilUsuario(id);

        if (errResenas) setError(errResenas);
        if (errUsuario) setError(errUsuario);

        if (dataResenas) setResenas(dataResenas);

        if (dataUsuario) {
          setUsuario({
            nombre: dataUsuario.nombreCompleto || dataUsuario.nombre || 'Usuario no encontrado',
            rol: dataUsuario.rol || 'Usuario',
            avatar: dataUsuario.fotoPerfil || dataUsuario.avatar || null,
            avgRating: dataUsuario.avgRating || dataUsuario.avg_rating || 0,
            reviewsCount: dataUsuario.reviewsCount || dataResenas?.length || 0,
          });
        }
      } catch {
        setError('Error inesperado al cargar el perfil');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      cargarPerfilYResenas();
    } else {
      setError('No se encontró este perfil');
      setLoading(false);
    }
  }, [id]);

  if (loading) return <div className="pu-state-box">Cargando perfil...</div>;
  if (error) return <div className="pu-state-box pu-state-box-error">{error}</div>;

  return (
    <div className="pu-page">
      <button onClick={() => navigate(-1)} className="back-pill-button">
        <ArrowLeft size={16} strokeWidth={2.5} />
        Volver
      </button>

      <section className="pu-hero">
        <div className="pu-hero-identity">
          <AvatarCirculo nombre={usuario?.nombre} foto={usuario?.avatar} size={84} />
          <div>
            <h1 className="pu-name">{usuario?.nombre}</h1>
            <span className="pu-role-badge">{usuario?.rol}</span>
          </div>
        </div>

        <article className="pu-stat-card">
          <p className="pu-stat-label">Calificación promedio</p>
          <div className="pu-stat-row">
            {renderEstrellas(usuario?.avgRating)}
            <strong className="pu-stat-value">{Number(usuario?.avgRating || 0).toFixed(1)}</strong>
          </div>
        </article>
      </section>

      <section className="pu-section">
        <header className="pu-section-header">
          <h2 className="pu-section-title">Comentarios de otros usuarios</h2>
          <span className="pu-section-count">{resenas.length} comentarios</span>
        </header>

        {resenas.length === 0 ? (
          <div className="pu-empty-state">
            <MessageSquareText size={34} strokeWidth={1.9} />
            <h3 className="pu-empty-title">Este usuario aún no tiene comentarios</h3>
            <p className="pu-empty-text">Cuando reciba una calificación, aparecerá aquí.</p>
          </div>
        ) : (
          <div className="pu-list">
            {resenas.map((resena) => (
              <article key={resena.id} className="pu-card">
                <div className="pu-card-top">
                  <div className="pu-author-block">
                    <div>
                      <div className="pu-meta-line" style={{ marginTop: 0 }}>
                        <UserRound size={14} strokeWidth={2.1} />
                        {resena.author?.publicId ? (
                          <Link to={`/perfil/${resena.author.publicId}`} className="pu-author-name">
                            {resena.author?.nombreCompleto || 'Usuario anónimo'}
                          </Link>
                        ) : (
                          <span className="pu-author-name">Usuario anónimo</span>
                        )}
                      </div>
                      <div className="pu-meta-line">
                        <CalendarDays size={13} strokeWidth={2} />
                        <span>{formatDate(resena.createdAt)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="pu-stars-wrap">{renderEstrellas(resena.rating)}</div>
                </div>

                {resena.comment && (
                  <div className="pu-comment-box">
                    <p className="pu-comment-text">{resena.comment}</p>
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
