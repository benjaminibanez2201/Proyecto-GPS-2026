import { useState, useEffect } from 'react';
import { Heart } from 'lucide-react';
import '../styles/publicacionCard.css';
import { useNavigate} from 'react-router-dom';

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
        
        <button 
          onClick={toggleFavorito}
          disabled={procesando}
          title={esFavorito ? 'Eliminar de favoritos' : 'Guardar en favoritos'}
          style={{ 
            position: 'absolute', 
            top: '12px', 
            right: '12px',
            zIndex: 10,
            background: 'rgba(255, 255, 255, 0.9)', 
            border: 'none', 
            borderRadius: '50%',
            width: '36px',
            height: '36px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: procesando ? 'wait' : 'pointer',
            boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
            transition: 'all 0.2s ease',
            transform: esFavorito ? 'scale(1.05)' : 'scale(1)',
            opacity: procesando ? 0.7 : 1
          }}
        >
          <Heart 
            size={20} 
            fill={esFavorito ? "#dc2626" : "none"} 
            color={esFavorito ? "#dc2626" : "#64748b"} 
            strokeWidth={2}
          />
        </button>
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