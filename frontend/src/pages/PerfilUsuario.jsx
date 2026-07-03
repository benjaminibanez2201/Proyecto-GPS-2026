import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Star, ArrowLeft } from 'lucide-react';
import { obtenerResenasUsuario, obtenerPerfilUsuario } from '../services/rentalsAndReviews.service.js';
import AvatarCirculo from '../components/AvatarCirculo.jsx';

export default function PerfilUsuario() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [usuario, setUsuario] = useState(null);
  const [resenas, setResenas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const colores = {
    principal: '#008080',
    secundario: '#e6dfd3',
    textoOscuro: '#2c3e50',
    blanco: '#ffffff',
    oro: '#ffd21f'
  };

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

    if (id) cargarPerfilYResenas();
  }, [id]);

  if (loading) return <div style={{ padding: '20px', textAlign: 'center' }}>Cargando perfil...</div>;
  if (error) return <div style={{ padding: '20px', color: 'red' }}>Error: {error}</div>;

  // Renderiza estrellas usando Lucide de forma limpia
  const renderComponenteEstrellas = (nota) => {
    const maxEstrellas = 5;
    const estrellasLlenas = Math.min(Math.max(Math.round(nota), 0), maxEstrellas);

    return (
      <div style={{ display: 'inline-flex', gap: '4px', alignItems: 'center' }}>
        {Array(maxEstrellas).fill().map((_, i) => {
          const esLlena = i < estrellasLlenas;
          return (
            <Star
              key={i}
              size={20}
              strokeWidth={2}
              // Si es llena, se pinta con color #ffd21f. Si es vacía, el fondo es transparente.
              fill={esLlena ? colores.oro : 'transparent'}
              // El borde de la estrella toma el color oro si está llena, o un gris suave si está vacía
              color={esLlena ? colores.oro : '#d9d9d9'}
            />
          );
        })}
      </div>
    );
  };

  return (
    <div style={{
      backgroundColor: '#f9f8f6',
      minHeight: '100vh',
      padding: '40px 20px',
      fontFamily: 'sans-serif',
      color: colores.textoOscuro
    }}>
      <button
        onClick={() => navigate(-1)}
        style={{
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
        }}
      >
        <ArrowLeft size={16} strokeWidth={2.5} />
        Volver
      </button>

      <div style={{
        maxWidth: '800px',
        margin: '0 auto',
        backgroundColor: colores.blanco,
        borderRadius: '12px',
        boxShadow: '0 4px 15px rgba(0,0,0,0.05)',
        overflow: 'hidden'
      }}>

        <div style={{ backgroundColor: colores.secundario, padding: '40px', textAlign: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '15px' }}>
            <AvatarCirculo nombre={usuario?.nombre} foto={usuario?.avatar} size={100} />
          </div>
          <h2 style={{ margin: '0 0 5px 0', fontSize: '24px' }}>{usuario?.nombre}</h2>
          <span style={{
            backgroundColor: colores.principal,
            color: colores.blanco,
            padding: '4px 12px',
            borderRadius: '12px',
            fontSize: '12px',
            fontWeight: 'bold',
            textTransform: 'uppercase'
          }}>{usuario?.rol}</span>
        </div>

        <div style={{
          display: 'flex',
          justifyContent: 'space-around',
          padding: '20px',
          borderBottom: '1px solid #eee',
          textAlign: 'center'
        }}>
          <div>
            <h4 style={{ margin: '0 0 5px 0', color: '#7f8c8d' }}>Calificación promedio</h4>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '18px', fontWeight: 'bold' }}>
              {renderComponenteEstrellas(usuario?.avgRating)}
              <span>({usuario?.avgRating})</span>
            </div>
          </div>
          <div>
            <h4 style={{ margin: '0 0 5px 0', color: '#7f8c8d' }}>Reseñas recibidas</h4>
            <div style={{ fontSize: '18px', fontWeight: 'bold' }}>{usuario?.reviewsCount} opiniones</div>
          </div>
        </div>

        <div style={{ padding: '30px' }}>
          <h3 style={{ margin: '0 0 20px 0', borderBottom: `2px solid ${colores.secundario}`, paddingBottom: '10px' }}>
            Comentarios de otros usuarios
          </h3>

          {resenas.length === 0 ? (
            <p style={{ color: '#7f8c8d', fontStyle: 'italic' }}>Este usuario no registra comentarios en la plataforma.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {resenas.map((resena) => (
                <div key={resena.id} style={{
                  padding: '15px',
                  borderRadius: '8px',
                  backgroundColor: '#fdfbf7',
                  borderLeft: `4px solid ${colores.principal}`,
                  boxShadow: '0 2px 5px rgba(0,0,0,0.02)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: resena.comment ? '8px' : '0' }}>
                    {renderComponenteEstrellas(resena.rating)}
                  </div>
                  {resena.comment && (
                    <p style={{ margin: 0, fontSize: '14px', lineHeight: '1.5', color: '#555' }}>
                      {resena.comment}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
