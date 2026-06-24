import { useState } from 'react';
import { usePublicaciones } from '../hooks/publicaciones/usePublicacion';
import { useFavoritos } from '../hooks/favoritos/useFavoritos';
import ComparadorPublicacionesModal from '../components/ComparadorPublicacionesModal';
import PublicacionCard from '../components/PublicacionCard';
import { Search } from 'lucide-react'; 
import Swal from 'sweetalert2';
import '@styles/basePublicaciones.css';

function getPublicacionId(publicacion) {
  return publicacion?.id_publicacion || publicacion?.id || publicacion?._id;
}

export default function BuscarArriendos() {
  const { publicaciones, cargando, error, cargarPublicaciones } = usePublicaciones();
  const { favoritos, handleAgregarFavorito, handleEliminarFavorito } = useFavoritos();
  const [comparacion, setComparacion] = useState([]);
  const [comparadorAbierto, setComparadorAbierto] = useState(false);
  
  const [filtros, setFiltros] = useState({
    titulo: "",
    tipoInmueble: "",
    precioMin: "",
    precioMax: "",
    direccionOrden: ""
  });

  const precioMinimoBase = 100000;
  const precioMaximoBase = 1000000;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFiltros(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleRangeMinChange = (e) => {
    const nextValue = Number(e.target.value);

    setFiltros((prev) => {
      const min = Math.min(nextValue, Number(prev.precioMax || precioMaximoBase));
      return {
        ...prev,
        precioMin: String(min),
        precioMax: String(Math.max(Number(prev.precioMax || precioMaximoBase), min)),
      };
    });
  };

  const handleRangeMaxChange = (e) => {
    const nextValue = Number(e.target.value);

    setFiltros((prev) => {
      const max = Math.max(nextValue, Number(prev.precioMin || precioMinimoBase));
      return {
        ...prev,
        precioMin: String(Math.min(Number(prev.precioMin || precioMinimoBase), max)),
        precioMax: String(max),
      };
    });
  };

  const aplicarFiltros = () => {
    const parametrosConsulta = {};

    if (filtros.titulo) parametrosConsulta.titulo = filtros.titulo;
    if (filtros.tipoInmueble) parametrosConsulta.tipoInmueble = filtros.tipoInmueble;
    if (filtros.precioMin) parametrosConsulta.precioMin = filtros.precioMin;
    if (filtros.precioMax) parametrosConsulta.precioMax = filtros.precioMax;
    
    if (filtros.direccionOrden) {
      parametrosConsulta.ordenarPor = "precioMensual";
      parametrosConsulta.direccionOrden = filtros.direccionOrden;
    }

    cargarPublicaciones(parametrosConsulta);
  };

  const limpiarFiltros = () => {
    setFiltros({ titulo: "", tipoInmueble: "", precioMin: "", precioMax: "", direccionOrden: "" });
    cargarPublicaciones({}); 
  };

  const toggleComparacion = (publicacion) => {
    const publicacionId = getPublicacionId(publicacion);
    const yaSeleccionada = comparacion.some((item) => getPublicacionId(item) === publicacionId);

    if (yaSeleccionada) {
      setComparacion((prev) => prev.filter((item) => getPublicacionId(item) !== publicacionId));
      return;
    }

    if (comparacion.length >= 3) {
      Swal.fire({
        icon: 'info',
        title: 'Límite alcanzado',
        text: 'Puedes comparar hasta tres publicaciones a la vez.',
        confirmButtonColor: '#008080',
      });
      return;
    }

    setComparacion((prev) => [...prev, publicacion]);
  };

  const abrirComparador = () => {
    if (comparacion.length < 2) {
      Swal.fire({
        icon: 'info',
        title: 'Selección insuficiente',
        text: 'Selecciona al menos dos publicaciones para comparar.',
        confirmButtonColor: '#008080',
      });
      return;
    }

    setComparadorAbierto(true);
  };

  return (
    <div style={styles.page}>
      <section style={styles.hero}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
          <div style={styles.heroContent}>
            <div style={styles.heroIcon}>
              <Search size={28} strokeWidth={2} />
            </div>
            <div>
              <h1 style={styles.heroTitle}>Encuentra tu próximo arriendo</h1>
              <p style={styles.heroSubtitle}>Busca, filtra y compara las mejores opciones disponibles.</p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button
              onClick={aplicarFiltros}
              style={{ padding: '10px 18px', borderRadius: '8px', backgroundColor: '#ffffff', color: '#0f766e', border: 'none', cursor: 'pointer', fontWeight: 'bold', transition: '0.2s' }}
            >
              Buscar
            </button>

            <button
              onClick={limpiarFiltros}
              style={{ padding: '10px 18px', borderRadius: '8px', backgroundColor: 'rgba(255, 255, 255, 0.15)', color: 'white', border: '1px solid rgba(255, 255, 255, 0.3)', cursor: 'pointer', fontWeight: 'bold', transition: '0.2s' }}
            >
              Limpiar
            </button>
          </div>
        </div>
      </section>
      <div style={{
        marginBottom: '30px',
        backgroundColor: '#f8fafc',
        padding: '20px',
        borderRadius: '12px',
        border: '1px solid #e2e8f0'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', marginBottom: '14px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>Filtros</span>
          <span style={{ fontSize: '12px', color: '#64748b' }}>Encuentra exactamente lo que buscas</span>
        </div>
        <div style={{ display: 'grid', gap: '16px', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', alignItems: 'start' }}>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', gridColumn: '1 / -1' }}>
            <label style={{ fontSize: '13px', fontWeight: 600, color: '#334155' }}>Buscar por título</label>
            <input
              type="text"
              name="titulo"
              placeholder="Ej. Departamento céntrico"
              value={filtros.titulo}
              onChange={handleInputChange}
              style={{ padding: '12px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', width: '100%', boxSizing: 'border-box', fontSize: '15px' }}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '13px', fontWeight: 600, color: '#334155' }}>Tipo de inmueble</label>
              <select
                name="tipoInmueble"
                value={filtros.tipoInmueble}
                onChange={handleInputChange}
                style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', width: '100%', boxSizing: 'border-box' }}
              >
                <option value="">Todos los tipos</option>
                <option value="departamento">Departamento</option>
                <option value="casa">Casa</option>
                <option value="pieza">Pieza</option>
                <option value="estudio">Estudio</option>
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '13px', fontWeight: 600, color: '#334155' }}>Ordenar por</label>
              <select
                name="direccionOrden"
                value={filtros.direccionOrden}
                onChange={handleInputChange}
                style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', width: '100%', boxSizing: 'border-box' }}
              >
                <option value="">Sin ordenar</option>
                <option value="ASC">Precio: Menor a Mayor</option>
                <option value="DESC">Precio: Mayor a Menor</option>
              </select>
            </div>
          </div>
          <div style={{ gridColumn: 'span 2', minWidth: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '13px', fontWeight: 600, color: '#334155' }}>
              Rango de precio
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '14px 16px', borderRadius: '10px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', height: '100%', boxSizing: 'border-box', justifyContent: 'center' }}>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#64748b' }}>Precio Mínimo</span>
                  <span style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>
                    ${Number(filtros.precioMin || precioMinimoBase).toLocaleString('es-CL')}
                  </span>
                </div>
                <input
                  type="range"
                  min={precioMinimoBase}
                  max={precioMaximoBase}
                  step={50000}
                  value={filtros.precioMin || precioMinimoBase}
                  onChange={handleRangeMinChange}
                  style={{ 
                    accentColor: '#008080', 
                    width: '100%', 
                    padding: 0, 
                    margin: 0, 
                    background: 'transparent',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#64748b' }}>Precio Máximo</span>
                  <span style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>
                    ${Number(filtros.precioMax || precioMaximoBase).toLocaleString('es-CL')}
                  </span>
                </div>
                <input
                  type="range"
                  min={precioMinimoBase}
                  max={precioMaximoBase}
                  step={50000}
                  value={filtros.precioMax || precioMaximoBase}
                  onChange={handleRangeMaxChange}
                  style={{ 
                    accentColor: '#0f766e', 
                    width: '100%', 
                    padding: 0, 
                    margin: 0, 
                    background: 'transparent',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

            </div>
          </div>
        </div>
      </div>
      
      <div style={{
        alignItems: 'center',
        display: 'flex',
        flexWrap: 'wrap',
        gap: '12px',
        justifyContent: 'center',
        marginBottom: '20px',
      }}>
        <span style={{ color: '#475569', fontSize: '14px', fontWeight: 600 }}>
          Seleccionadas: {comparacion.length}/3
        </span>
        <button
          type="button"
          onClick={abrirComparador}
          style={{ padding: '10px 18px', borderRadius: '8px', backgroundColor: '#0f766e', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}
        >
          Comparar seleccionadas
        </button>
      </div>

      {comparadorAbierto && (
        <ComparadorPublicacionesModal
          publicaciones={comparacion}
          onClose={() => setComparadorAbierto(false)}
        />
      )}

      {cargando && <p className="loading-text" style={{ textAlign: 'center' }}>Cargando alojamientos...</p>}
      {error && <p className="error-text" style={{ textAlign: 'center' }}> Error: {error}</p>}

      {!cargando && !error && (
        <div className="publicaciones-grid">
          {publicaciones.length > 0 ? (
            publicaciones.map((pub) => (
              <PublicacionCard 
                key={pub.id} 
                publicacion={pub}
                favoritos={favoritos}
                handleAgregarFavorito={handleAgregarFavorito}
                handleEliminarFavorito={handleEliminarFavorito}
                selectedForCompare={comparacion.some((item) => getPublicacionId(item) === getPublicacionId(pub))}
                onToggleCompare={toggleComparacion}
                compareDisabled={comparacion.length >= 3 && !comparacion.some((item) => getPublicacionId(item) === getPublicacionId(pub))}
              />
            ))
          ) : (
            <p className="empty-text" style={{ textAlign: 'center', width: '100%', gridColumn: '1 / -1', marginTop: '20px', color: '#64748b' }}>
              No encontramos arriendos con esos filtros.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

const styles = {
  page: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    padding: '4px 0 12px',
  },
  hero: {
    borderRadius: '24px',
    padding: '24px 28px',
    background: 'linear-gradient(135deg, #0f766e 0%, #0b6b7a 45%, #163d4f 100%)',
    color: '#fff',
    boxShadow: '0 20px 40px rgba(11, 34, 45, 0.18)',
  },
  heroContent: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  heroIcon: {
    width: '52px',
    height: '52px',
    borderRadius: '16px',
    backgroundColor: 'rgba(255,255,255,0.15)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  heroTitle: {
    margin: '0 0 6px',
    fontSize: '28px',
    lineHeight: 1.1,
  },
  heroSubtitle: {
    margin: 0,
    fontSize: '14px',
    color: 'rgba(255,255,255,0.85)',
  },
};