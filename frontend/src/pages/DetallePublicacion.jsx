import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { Heart, ArrowLeft, MapPin, Star, Mail, Phone, FlagTriangleRight } from 'lucide-react';
import { getPublicacionPorId } from '../services/publicacion.service.js';
import { useFavoritos } from '../hooks/favoritos/useFavoritos';
import { useAuth } from '../context/AuthContext';
import ModalReportar from '../components/ModalReportar.jsx';
import '@styles/basePublicaciones.css';

const SERVICIOS_LABELS = {
  agua: 'Agua',
  luz: 'Luz',
  gas: 'Gas',
  internet: 'Internet',
  tv_cable: 'TV Cable',
  calefaccion: 'Calefacción',
  estacionamiento: 'Estacionamiento',
  lavadora: 'Lavadora',
};

function formatearServicio(servicio) {
  return SERVICIOS_LABELS[servicio] || servicio;
}

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
  const [mostrarModalReporte, setMostrarModalReporte] = useState(false);
  const esArrendador = user?.rol === 'arrendador' || user?.rol === 'Arrendador';
  const esAutorPublicacion = String(publicacion?.arrendador?.id) === String(user?.id);

  const idPublicacion = publicacion?.id || publicacion?._id;
  const arrendador = publicacion?.arrendador;

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

    const estadoAnterior = esFavorito;

    if (estadoAnterior) {
      const confirmacion = await Swal.fire({
        title: '¿Seguro que quieres eliminarlo de tus favoritos?',
        text: 'La publicación seguirá disponible para volver a guardarla más adelante.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#dc2626',
        cancelButtonColor: '#008080',
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar',
      });

      if (!confirmacion.isConfirmed) return;
    }

    setProcesando(true);
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
        <button 
          className="confirm-btn" 
          onClick={() => navigate(-1)} 
          style={{ width: 'fit-content', marginBottom: '20px', backgroundColor: '#64748b', display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <ArrowLeft size={18} /> Volver
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
        style={{ width: 'fit-content', marginBottom: '20px', backgroundColor: '#64748b', display: 'flex', alignItems: 'center', gap: '8px' }}
      >
        <ArrowLeft size={18} /> Volver 
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
        
        <div style={{ position: 'relative', marginBottom: '30px' }}>
          <img 
            src={imagenPrincipal} 
            alt={publicacion.titulo || 'Imagen del arriendo'} 
            style={{ width: '100%', height: '400px', objectFit: 'cover', borderRadius: '12px', display: 'block' }}
          />
          
          {!esArrendador && (
            <button 
              type="button"
              onClick={toggleFavorito}
              disabled={procesando}
              title={esFavorito ? 'Eliminar de favoritos' : 'Guardar en favoritos'}
              style={{ 
                position: 'absolute',
                top: '20px',
                right: '20px',
                zIndex: 10,
                background: 'rgba(255, 255, 255, 0.9)', 
                border: 'none', 
                borderRadius: '50%',
                width: '52px',
                height: '52px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: procesando ? 'wait' : 'pointer',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                transition: 'all 0.2s ease',
                transform: esFavorito ? 'scale(1.05)' : 'scale(1)',
                opacity: procesando ? 0.7 : 1
              }}
            >
              <Heart 
                size={28} 
                fill={esFavorito ? "#dc2626" : "none"} 
                color={esFavorito ? "#dc2626" : "#64748b"} 
                strokeWidth={2}
              />
            </button>
          )}
        </div>

        {fotos && fotos.length > 1 && (
          <div style={{ display: 'flex', gap: '12px', marginBottom: '30px', overflowX: 'auto' }}>
            {fotos.slice(1).map((foto, index) => (
              <img
                key={index}
                src={foto}
                alt={`${publicacion.titulo || 'Arriendo'} - foto ${index + 2}`}
                style={{ width: '140px', height: '100px', objectFit: 'cover', borderRadius: '8px', flexShrink: 0 }}
              />
            ))}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '40px' }}>
          <div>
            <h3 style={{ color: '#2c3e50', marginBottom: '15px' }}>Ubicación</h3>
            <p style={{ color: '#475569', lineHeight: '1.6', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <MapPin size={16} color="#008080" />
              {publicacion.ubicacion || 'Ubicación no especificada'}
            </p>

            {publicacion.distanciaCampus != null && (
              <p style={{ color: '#475569', lineHeight: '1.6', marginTop: '6px' }}>
                A <strong>{publicacion.distanciaCampus} km</strong> del campus
              </p>
            )}

            <h3 style={{ color: '#2c3e50', marginTop: '30px', marginBottom: '15px' }}>Reglas de Convivencia</h3>
            <p style={{ color: '#475569', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
              {publicacion.reglasConvivencia || 'El dueño no ha especificado reglas de convivencia.'}
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

            {arrendador && (
              <div style={{ backgroundColor: '#f8fafc', padding: '24px', borderRadius: '12px' }}>
                <h3 style={{ margin: '0 0 16px 0', color: '#2c3e50', fontSize: '18px' }}>Propietario</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
                  <img
                    src={arrendador.fotoPerfil || 'https://via.placeholder.com/100?text=?'}
                    alt={arrendador.nombreCompleto || 'Propietario'}
                    style={{ width: '52px', height: '52px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
                  />
                  <div>
                    <p style={{ margin: 0, fontWeight: 'bold', color: '#2c3e50', fontSize: '15px' }}>
                      {arrendador.nombreCompleto || 'Propietario'}
                    </p>
                    {arrendador.avgRating != null && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                        <Star size={14} fill="#f59e0b" color="#f59e0b" />
                        <span style={{ fontSize: '13px', color: '#475569' }}>
                          {Number(arrendador.avgRating).toFixed(1)}
                          {arrendador.reviewsCount != null && (
                            <span style={{ color: '#94a3b8' }}> ({arrendador.reviewsCount} reseñas)</span>
                          )}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {!esArrendador && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {arrendador.email && (
                      <p style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#475569', margin: 0 }}>
                        <Mail size={14} color="#008080" /> {arrendador.email}
                      </p>
                    )}
                    {arrendador.telefono && (
                      <p style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#475569', margin: 0 }}>
                        <Phone size={14} color="#008080" /> {arrendador.telefono}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            <div style={{ backgroundColor: '#f8fafc', padding: '24px', borderRadius: '12px', height: 'fit-content' }}>
              <h3 style={{ margin: '0 0 20px 0', color: '#2c3e50', fontSize: '18px' }}>Servicios Incluidos</h3>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, color: '#475569', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {publicacion.serviciosIncluidos && publicacion.serviciosIncluidos.length > 0 ? (
                  publicacion.serviciosIncluidos.map((servicio, index) => (
                    <li key={index} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ color: '#008080' }}>✓</span> {formatearServicio(servicio)}
                    </li>
                  ))
                ) : (
                  <li>No se han especificado servicios</li>
                )}
              </ul>

              {!esArrendador && (
                <button
                  type="button"
                  className="confirm-btn"
                  onClick={() => navigate(`/mensajes?publicacion=${id}`)}
                  style={{ width: '100%', marginTop: '30px' }}
                >
                  Contactar al Propietario
                </button>
              )}

              {!esAutorPublicacion && (
                <button
                  type="button"
                  onClick={() => setMostrarModalReporte(true)}
                  style={{
                    width: '100%',
                    marginTop: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    padding: '12px 18px',
                    borderRadius: '12px',
                    border: '1px solid #f2c94c',
                    backgroundColor: '#fff7db',
                    color: '#8b6b00',
                    fontWeight: 800,
                    cursor: 'pointer',
                  }}
                >
                  <FlagTriangleRight size={16} strokeWidth={2.2} />
                  Reportar publicación
                </button>
              )}
            </div>

          </div>
        </div>
      </div>

      <ModalReportar
        open={mostrarModalReporte}
        publicacion={publicacion}
        onClose={() => setMostrarModalReporte(false)}
        onSuccess={() => setMostrarModalReporte(false)}
      />
    </div>
  );
}