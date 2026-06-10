import React, { useState, useEffect } from 'react';
import { getMisPublicaciones } from '../services/publicacion.service.js';
import PublicacionCard from '../components/PublicacionCard.jsx';
import '@styles/basePublicaciones.css';

export default function MisPublicaciones() {
  const [publicaciones, setPublicaciones] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  

  useEffect(() => {
    const cargarMisPublicaciones = async () => {
      setCargando(true);
      const [data, errorRespuesta] = await getMisPublicaciones();
      
      if (errorRespuesta) {
        setError(errorRespuesta);
      } else {
        setPublicaciones(data || []);
      }
      setCargando(false);
    };

    cargarMisPublicaciones();
  }, []);

  if (cargando) {
    return (
      <div className="home-container">
        <p className="loading-text">Cargando mis publicaciones...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="home-container">
        <p className="error-text">{error}</p>
      </div>
    );
  }

  return (
    <div className="home-container">
      <h1 style={{ marginBottom: '30px', color: '#2c3e50', fontSize: '32px' }}>
        Mis Publicaciones
      </h1>
      
      {publicaciones.length === 0 ? (
        <p style={{ color: '#64748b', fontSize: '18px' }}>
          Aún no has creado ninguna publicación.
        </p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
          {publicaciones.map((pub) => (
            <PublicacionCard 
              key={pub.id || pub._id} 
              publicacion={pub} 
            />
          ))}
        </div>
      )}
    </div>
  );
}