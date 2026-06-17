import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getPublicacionPorId } from '../services/publicacion.service.js';
import { useFavoritos } from '../hooks/favoritos/useFavoritos';
import { useAuth } from '../context/AuthContext';
import '@styles/basePublicaciones.css';

export default function DetallePublicacion() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [publicacion, setPublicacion] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const { favoritos, handleAgregarFavorito, handleEliminarFavorito } = useFavoritos();

  const [esFavorito, setEsFavorito] = useState(false);
  const [procesando, setProcesando] = useState(false);
  const { user } = useAuth(); 
  const esArrendador = user?.rol === 'arrendador' || user?.rol === 'Arrendador';

  const idPublicacion = publicacion?.id || publicacion?._id;

  useEffect(() => {
    const traerDetalles = async () => {
      setCargando(true);
      const [data, errorRespuesta] = await getPublicacionPorId(id);
      
      if (errorRespuesta) {
        setError(errorRespuesta);
      } else {
        setPublicacion(data);
      }
      setCargando(false);
    };

    traerDetalles();
  }, [id]);

  useEffect(() => {
    if (favoritos.length > 0 && idPublicacion) {
      const isFav = favoritos.some(fav => 
        String(fav.publicacionId) === String(idPublicacion) || 
        String(fav?.publicacion?.id) === String(idPublicacion) || 
        String(fav?.publicacion?._id) === String(idPublicacion) ||
        String(fav.id) === String(idPublicacion)
      );
      setEsFavorito(isFav);
    } else {
      setEsFavorito(false);
    }
  }, [favoritos, idPublicacion]);

  const toggleFavorito = async (e) => {
    if (e && e.stopPropagation) e.stopPropagation(); 
    
    if (procesando || !idPublicacion) return;

    setProcesando(true);
    const estadoAnterior = esFavorito;
    setEsFavorito(!estadoAnterior);

    try {
      if (estadoAnterior) {
        const exito = await handleEliminarFavorito(idPublicacion);
        if (!exito) setEsFavorito(estadoAnterior);
      } else {
        const exito = await handleAgregarFavorito(idPublicacion);
        if (!exito) setEsFavorito(estadoAnterior);
      }
    } finally {
      setProcesando(false);
    }
  };

  if (cargando) {
    return (
      <div className="home-container">
        <p className="loading-text">Cargando detalles del arriendo...</p>
      </div>
    );
  }
  
  if (error || !publicacion) {
    return (
      <div className="home-container">
        <button className="confirm-btn" onClick={() => navigate(-1)} style={{ width: 'fit-content', marginBottom: '20px', backgroundColor: '#64748b' }}>
          ⬅ Volver
        </button>
        <p className="error-text"> {error || 'No se encontró esta publicación.'}</p>
      </div>
    );
  }

  const fotos = publicacion.fotos;
  const imagenPrincipal = fotos && fotos.length > 0 
    ? fotos[0] 
    : 'https://via.placeholder.com/800x400?text=Sin+Imagen';

  const fechaPublicacion = publicacion.createdAt 
    ? new Date(publicacion.createdAt).toLocaleDateString('es-CL', { year: 'numeric', month: 'long', day: 'numeric' }) 
    : 'Fecha no disponible';

  return (
    <div className="home-container">
      <button 
        className="confirm-btn" 
        onClick={() => navigate(-1)} 
        style={{ width: 'fit-content', marginBottom: '20px', backgroundColor: '#64748b' }}
      >
        ⬅ Volver 
      </button>

      <div style={{ backgroundColor: '#fff', padding: '40px', borderRadius: '16px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <span style={{ backgroundColor: '#008080', color: 'white', padding: '6px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold' }}>
                {publicacion.tipoInmueble ? publicacion.tipoInmueble.toUpperCase() : 'ALOJAMIENTO'}
              </span>
              {publicacion.estado === 'inactiva' && (
                <span style={{ backgroundColor: '#ef4444', color: 'white', padding: '6px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold' }}>
                  INACTIVA
                </span>
              )}
            </div>
            <h1 style={{ marginTop: '15px', color: '#2c3e50', fontSize: '32px' }}>
              {publicacion.titulo || 'Sin título'}
            </h1>
            <p style={{ color: '#64748b', fontSize: '14px', marginTop: '5px' }}>
              Publicado el: {fechaPublicacion}
            </p>
          </div>
          
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: '28px', color: '#008080', fontWeight: 'bold', margin: '0' }}>
              ${publicacion.precioMensual || 0}
            </p>
            <span style={{ color: '#64748b', fontSize: '14px' }}>por mes</span>
          </div>
        </div>

        <hr style={{ margin: '30px 0', borderColor: '#e2e8f0', opacity: 0.5 }}/>
        
        <img 
          src={imagenPrincipal} 
          alt={publicacion.titulo || 'Imagen del arriendo'} 
          style={{ width: '100%', height: '400px', objectFit: 'cover', borderRadius: '12px', marginBottom: '30px', transform: 'none', transition: 'none'}}
        />

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '40px' }}>
          <div>
            <h3 style={{ color: '#2c3e50', marginBottom: '15px' }}>Ubicación</h3>
            <p style={{ color: '#475569', lineHeight: '1.6' }}>
               {publicacion.ubicacion || 'Ubicación no especificada'}
            </p>

            <h3 style={{ color: '#2c3e50', marginTop: '30px', marginBottom: '15px' }}>Reglas de Convivencia</h3>
            <p style={{ color: '#475569', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
              {publicacion.reglasConvivencia || 'El dueño no ha especificado reglas de convivencia.'}
            </p>
          </div>

          <div style={{ backgroundColor: '#f8fafc', padding: '24px', borderRadius: '12px', height: 'fit-content' }}>
            <h3 style={{ margin: '0 0 20px 0', color: '#2c3e50', fontSize: '18px' }}>Servicios Incluidos</h3>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, color: '#475569', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {publicacion.serviciosIncluidos && publicacion.serviciosIncluidos.length > 0 ? (
                publicacion.serviciosIncluidos.map((servicio, index) => (
                  <li key={index} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ color: '#008080' }}>✓</span> {servicio}
                  </li>
                ))
              ) : (
                <li>No se han especificado servicios</li>
              )}
            </ul>
            {!esArrendador && (
              <>
                <button className="confirm-btn" style={{ width: '100%', marginTop: '30px' }}>
                  Contactar al Propietario
                </button>

                <button 
                  onClick={toggleFavorito}
                  disabled={procesando}
                  style={{ 
                    width: '100%', 
                    marginTop: '10px', 
                    padding: '10px', 
                    background: esFavorito ? '#ef4444' : 'white', 
                    border: esFavorito ? '1px solid #ef4444' : '1px solid #008080', 
                    color: esFavorito ? 'white' : '#008080', 
                    borderRadius: '8px', 
                    cursor: procesando ? 'wait' : 'pointer',
                    opacity: procesando ? 0.7 : 1,
                    transition: 'all 0.2s ease'
                  }}
                >
                  {esFavorito ? '❤️ Quitar de Favoritos' : '🤍 Guardar en Favoritos'}
                </button>
              </>
            )}

          </div>
          
        </div>
      </div>
    </div>
  );
}