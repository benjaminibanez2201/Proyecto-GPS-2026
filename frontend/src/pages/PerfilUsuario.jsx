import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Star, ArrowLeft } from 'lucide-react'; 
import { obtenerResenasUsuario, obtenerPerfilUsuario } from '../services/rentalsAndReviews.service.js';

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
      const [dataResenas, errResenas] = await obtenerResenasUsuario(id);
      const [dataUsuario, errUsuario] = await obtenerPerfilUsuario(id);
      
      if (errResenas) {
        setError(errResenas);
      } else {
        setResenas(dataResenas);
        setUsuario({
          nombre: dataUsuario.nombre || 'Usuario no encontrado',
          rol: dataUsuario.rol || "Usuario",
          avatar: dataUsuario.avatar || null,
          avgRating: dataUsuario.avgRating || 0, 
          reviewsCount: dataResenas?.length || 0 
        });
      }
      setLoading(false);
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
              // Si es llena, se pinta con tu color #ffd21f. Si es vacía, el fondo es transparente.
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
          backgroundColor: 'transparent',
          border: `2px solid ${colores.principal}`,
          color: colores.principal,
          padding: '8px 16px',
          borderRadius: '20px',
          cursor: 'pointer',
          fontWeight: 'bold',
          marginBottom: '20px',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px'
        }}
      >
        <ArrowLeft size={16} strokeWidth={2.5} />
        Volver a la vista anterior
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
          <div style={{
            width: '100px',
            height: '100px',
            borderRadius: '50%',
            backgroundColor: colores.principal,
            color: colores.blanco,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '32px',
            fontWeight: 'bold',
            margin: '0 auto 15px auto',
            border: `4px solid ${colores.blanco}`,
            boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
          }}>
            {usuario?.nombre.charAt(0)}
          </div>
          <h2 style={{ margin: '0 0 5px 0', fontSize: '24px' }}>{usuario?.nombre}</h2>
          <span style={{ 
            backgroundColor: colores.principal, 
            color: colores.blanco, 
            padding: '4px 12px', 
            borderRadius: '12px', 
            fontSize: '12px',
            fontWeight: 'bold' 
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
            <h4 style={{ margin: '0 0 5px 0', color: '#7f8c8d' }}>Calificación Promedio</h4>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '18px', fontWeight: 'bold' }}>
              {renderComponenteEstrellas(usuario?.avgRating)}
              <span>({usuario?.avgRating})</span>
            </div>
          </div>
          <div>
            <h4 style={{ margin: '0 0 5px 0', color: '#7f8c8d' }}>Reseñas Recibidas</h4>
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
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontWeight: 'bold', fontSize: '14px' }}>Usuario Anonimo (ID Autor: {resena.authorId})</span>
                    {renderComponenteEstrellas(resena.rating)}
                  </div>
                  <p style={{ margin: 0, fontSize: '14px', lineHeight: '1.5', color: '#555' }}>
                    {resena.comment || <span style={{ color: '#aaa', fontStyle: 'italic' }}>Sin comentarios de texto.</span>}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ padding: '0 30px 30px 30px', textAlign: 'center' }}>
          <button style={{
            backgroundColor: colores.principal,
            color: colores.blanco,
            border: 'none',
            padding: '12px 30px',
            borderRadius: '6px',
            fontSize: '16px',
            fontWeight: 'bold',
            cursor: 'pointer',
            boxShadow: '0 4px 10px rgba(0,128,128,0.2)',
            width: '100%'
          }}>
            Iniciar contacto interno
          </button>
        </div>

      </div>
    </div>
  );
}