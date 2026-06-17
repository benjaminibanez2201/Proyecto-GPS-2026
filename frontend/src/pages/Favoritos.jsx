import React from 'react';
import { useFavoritos } from '../hooks/favoritos/useFavoritos';
import PublicacionCard from '../components/PublicacionCard';

export default function Favoritos() {
  const { 
    favoritos, 
    cargando, 
    error, 
    handleAgregarFavorito, 
    handleEliminarFavorito 
  } = useFavoritos();

  if (cargando) {
    return (
      <div className="contenedor-favoritos">
        <p>Cargando tus favoritos...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="contenedor-favoritos">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="contenedor-favoritos">
      <h1 style={{ marginBottom: '30px', color: '#2c3e50', fontSize: '32px' }}>
        Mis Favoritos
      </h1>

      {!favoritos || favoritos.length === 0 ? (
        <p style={{ color: '#64748b', fontSize: '18px' }}>
          Aún no tienes publicaciones guardadas en favoritos.
        </p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
          {favoritos.map((fav) => {
            if (!fav.publicacion) return null;

            return (
              <PublicacionCard 
                key={fav.id || fav.publicacion.id} 
                publicacion={fav.publicacion} 
                favoritos={favoritos}
                handleAgregarFavorito={handleAgregarFavorito}
                handleEliminarFavorito={handleEliminarFavorito}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}