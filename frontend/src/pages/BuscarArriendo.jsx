import React, { useState } from 'react';
import { usePublicaciones } from '../hooks/publicaciones/usePublicacion';
import PublicacionCard from '../components/PublicacionCard';
import '@styles/basePublicaciones.css';

export default function BuscarArriendos() {
  const { publicaciones, cargando, error, cargarPublicaciones } = usePublicaciones();
  const [filtroTipo, setFiltroTipo] = useState("");
  const handleSelectChange = (e) => {
    const nuevoTipo = e.target.value;
    setFiltroTipo(nuevoTipo); 
    cargarPublicaciones({ tipoInmueble: nuevoTipo }); 
  };

  return (
    <div className="home-container">
      <h1 className="home-title">Encuentra tu próximo arriendo</h1>
      <div style={{ marginBottom: '20px', display: 'flex', gap: '10px', justifyContent: 'center' }}>
        <select 
          value={filtroTipo} 
          onChange={handleSelectChange}
          style={{ padding: '8px', borderRadius: '6px' }}
        >
          <option value="">Todos los tipos</option>
          <option value="departamento">Departamento</option>
          <option value="casa">Casa</option>
          <option value="pieza">Pieza</option>
          <option value="estudio">Estudio</option>
        </select>
      </div>

      {cargando && <p className="loading-text">Cargando alojamientos...</p>}
      {error && <p className="error-text"> Error: {error}</p>}

      {!cargando && !error && (
        <div className="publicaciones-grid">
          {publicaciones.length > 0 ? (
            publicaciones.map((pub) => (
              <PublicacionCard 
                key={pub.id} 
                publicacion={pub} 
              />
            ))
          ) : (
            <p className="empty-text">No encontramos arriendos con esos filtros.</p>
          )}
        </div>
      )}
    </div>
  );
}