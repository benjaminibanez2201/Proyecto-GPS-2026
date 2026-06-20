import { useState, useEffect } from 'react';
import '../styles/publicacionCard.css';
import { useNavigate, useLocation } from 'react-router-dom';

export default function PublicacionCard({ 
  publicacion, 
  favoritos = [], 
  handleAgregarFavorito, 
  handleEliminarFavorito,
  selectedForCompare = false,
  onToggleCompare,
  compareDisabled = false,
}) {
  const navigate = useNavigate();
  const location = useLocation();
  
  const esPaginaFavoritos = location.pathname.includes('/favoritos');
  const idPublicacion = publicacion?.id || publicacion?._id;

  const [esFavorito, setEsFavorito] = useState(false);
  const [procesando, setProcesando] = useState(false);

  useEffect(() => {
    if (!idPublicacion) return;
    
    const isFav = favoritos.some(fav => 
      String(fav.publicacionId) === String(idPublicacion) || 
      String(fav?.publicacion?.id) === String(idPublicacion) || 
      String(fav?.publicacion?._id) === String(idPublicacion) ||
      String(fav.id) === String(idPublicacion)
    );
    
    setEsFavorito(isFav);
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

  if (!publicacion) return null;

  const { titulo, tipoInmueble, precioMensual, ubicacion, fotos } = publicacion;

  const imagenPrincipal = fotos && fotos.length > 0 
    ? fotos[0] 
    : 'https://via.placeholder.com/400x250?text=Sin+Imagen';

  const precioFormateado = new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
  }).format(precioMensual || 0);

  const handleVerDetalles = () => {
    if (idPublicacion) {
      navigate(`/publicacion/${idPublicacion}`);
    }
  };

  return (
    <div className="publicacion-card">
      <div className="publicacion-image-container" style={{ position: 'relative' }}>
        <img src={imagenPrincipal} alt={titulo} className="publicacion-image" />
        
        {esPaginaFavoritos && (
          <button 
            onClick={toggleFavorito}
            disabled={procesando}
            style={{ 
              cursor: procesando ? 'wait' : 'pointer',
              fontSize: '20px', 
              background: 'none', 
              border: 'none', 
              position: 'absolute', 
              top: '10px', 
              right: '10px',
              zIndex: 10,
              transition: 'transform 0.2s ease',
              transform: esFavorito ? 'scale(1.1)' : 'scale(1)',
              opacity: procesando ? 0.7 : 1
            }}
          >
            {esFavorito ? '❤️' : '🤍'}
          </button>
        )}
      </div>

      <div className="publicacion-info">
        <span className="publicacion-badge">
          {tipoInmueble ? tipoInmueble.toUpperCase() : 'ALOJAMIENTO'}
        </span>
        <h3 className="publicacion-title">{titulo || 'Sin título'}</h3>
        <p className="publicacion-location">{ubicacion || 'Ubicación no disponible'}</p>
        
        {onToggleCompare && (
          <label
            style={{
              alignItems: 'center',
              color: compareDisabled ? '#94a3b8' : '#334155',
              cursor: compareDisabled ? 'not-allowed' : 'pointer',
              display: 'inline-flex',
              fontSize: '13px',
              fontWeight: 700,
              gap: '8px',
              marginBottom: '12px',
            }}
          >
            <input
              type="checkbox"
              checked={selectedForCompare}
              disabled={compareDisabled}
              onChange={() => onToggleCompare(publicacion)}
            />
            Comparar
          </label>
        )}

        <div className="publicacion-footer">
          <span className="publicacion-price">{precioFormateado} <small>/mes</small></span>
          <button 
            className="confirm-btn" 
            onClick={handleVerDetalles}
          >
            Ver Detalles
          </button>
        </div>
      </div>
    </div>
  );
}
