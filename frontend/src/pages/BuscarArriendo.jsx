import { useMemo, useState } from 'react';
import { usePublicaciones } from '../hooks/publicaciones/usePublicacion';
import { useFavoritos } from '../hooks/favoritos/useFavoritos';
import ComparadorPublicacionesModal from '../components/ComparadorPublicacionesModal';
import PublicacionCard from '../components/PublicacionCard';
import PublicationMap from '@components/PublicationMap';
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
  const [mostrarMapa, setMostrarMapa] = useState(false);
  
  const [filtros, setFiltros] = useState({
    tipoInmueble: "",
    precioMin: "",
    precioMax: "", 
    direccionOrden: ""
  });

  const publicacionesVisibles = useMemo(() => publicaciones, [publicaciones]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFiltros(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const aplicarFiltros = () => {
    const parametrosConsulta = {};

    if (filtros.tipoInmueble) parametrosConsulta.tipoInmueble = filtros.tipoInmueble;
    if (filtros.precioMin) parametrosConsulta.precioMin = filtros.precioMin;
    if (filtros.precioMax) parametrosConsulta.precioMax = filtros.precioMax;
    
    if (filtros.direccionOrden) {
      parametrosConsulta.ordenarPor = "precioMensual";
      parametrosConsulta.direccionOrden = filtros.direccionOrden;
    }

    setMostrarMapa(Object.keys(parametrosConsulta).length > 0);
    cargarPublicaciones(parametrosConsulta);
  };

  const limpiarFiltros = () => {
    setFiltros({ tipoInmueble: "", precioMin: "", precioMax: "", direccionOrden: "" });
    setMostrarMapa(false);
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
        title: 'Limite alcanzado',
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
        title: 'Seleccion insuficiente',
        text: 'Selecciona al menos dos publicaciones para comparar.',
        confirmButtonColor: '#008080',
      });
      return;
    }

    setComparadorAbierto(true);
  };

  return (
    <div className="home-container">
      <h1 className="home-title">Encuentra tu próximo arriendo</h1>
      
      <div style={{ 
        marginBottom: '30px', 
        display: 'flex', 
        gap: '15px', 
        justifyContent: 'center',
        flexWrap: 'wrap',
        backgroundColor: '#f8fafc',
        padding: '20px',
        borderRadius: '12px',
        border: '1px solid #e2e8f0'
      }}>
        
        <select 
          name="tipoInmueble"
          value={filtros.tipoInmueble} 
          onChange={handleInputChange}
          style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', minWidth: '150px' }}
        >
          <option value="">Todos los tipos</option>
          <option value="departamento">Departamento</option>
          <option value="casa">Casa</option>
          <option value="pieza">Pieza</option>
          <option value="estudio">Estudio</option>
        </select>
        <input 
          type="number" 
          name="precioMax"
          placeholder="Precio Máximo ($)" 
          value={filtros.precioMax}
          onChange={handleInputChange}
          onWheel={(e) => e.target.blur()}
          style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', minWidth: '30px', maxWidth: '150px' }}
        />

        <select 
          name="direccionOrden"
          value={filtros.direccionOrden} 
          onChange={handleInputChange}
          style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', minWidth: '150px' }}
        >
          <option value="">Ordenar por...</option>
          <option value="ASC">Precio: Menor a Mayor</option>
          <option value="DESC">Precio: Mayor a Menor</option>
        </select>

        <button 
          onClick={aplicarFiltros}
          style={{ padding: '10px 20px', borderRadius: '8px', backgroundColor: '#008080', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}
        >
          Buscar
        </button>

        <button 
          onClick={limpiarFiltros}
          style={{ padding: '10px 20px', borderRadius: '8px', backgroundColor: '#ef4444', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}
        >
          Limpiar
        </button>
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

      {cargando && <p className="loading-text">Cargando alojamientos...</p>}
      {error && <p className="error-text"> Error: {error}</p>}

      {!cargando && !error && (
        <>
          {mostrarMapa && <PublicationMap publicaciones={publicacionesVisibles} />}

          <div className="publicaciones-grid">
            {publicacionesVisibles.length > 0 ? (
              publicacionesVisibles.map((pub) => (
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
              <p className="empty-text" style={{ textAlign: 'center', width: '100%', gridColumn: '1 / -1', marginTop: '20px' }}>
                No encontramos arriendos con esos filtros.
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
