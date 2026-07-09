import { useCallback, useMemo, useState, useEffect } from 'react';
import { usePublicaciones } from '../hooks/publicaciones/usePublicacion';
import { useFavoritos } from '../hooks/favoritos/useFavoritos';
import ComparadorPublicacionesModal from '../components/ComparadorPublicacionesModal';
import PublicacionCard from '../components/PublicacionCard';
import { Search, SlidersHorizontal, Map, ChevronDown } from 'lucide-react';
import PublicationMap from '@components/PublicationMap';
import Swal from 'sweetalert2';
import '@styles/buscarArriendos.css';
import '@styles/basePublicaciones.css';
import { getPublicaciones } from '@services/publicacion.service.js';

function getPublicacionId(publicacion) {
  return publicacion?.id_publicacion || publicacion?.id || publicacion?._id;
}

const TIPOS_INMUEBLE = [
  { id: 'departamento', label: 'Departamento' },
  { id: 'casa', label: 'Casa' },
  { id: 'pieza', label: 'Pieza' },
  { id: 'estudio', label: 'Estudio' },
];

const SERVICIOS_VALIDOS = [
  { id: "agua", label: "Agua" },
  { id: "luz", label: "Luz" },
  { id: "gas", label: "Gas" },
  { id: "internet", label: "Internet" },
  { id: "tv_cable", label: "TV Cable" },
  { id: "calefaccion", label: "Calefacción" },
  { id: "estacionamiento", label: "Estacionamiento" },
  { id: "lavadora", label: "Lavadora" }
];

const PRECIO_MIN_RANGO_DEFAULT = 0;
const PRECIO_MAX_RANGO_DEFAULT = 1500000;
const PRECIO_PASO = 10000;
const COMPARACION_STORAGE_KEY = 'buscarArriendoComparacion';

function getStoredComparacion() {
  try {
    const stored = sessionStorage.getItem(COMPARACION_STORAGE_KEY);
    const parsed = stored ? JSON.parse(stored) : [];
    return Array.isArray(parsed) ? parsed.slice(0, 3) : [];
  } catch {
    return [];
  }
}

function buildComparablePublicacion(publicacion) {
  return {
    id: getPublicacionId(publicacion),
    publicId: publicacion?.publicId,
    titulo: publicacion?.titulo,
    tipoInmueble: publicacion?.tipoInmueble,
    precioMensual: publicacion?.precioMensual,
    ubicacion: publicacion?.ubicacion,
    fotos: publicacion?.fotos,
  };
}

export default function BuscarArriendos() {
  const { publicaciones, cargando, error, paginacion, cargarPublicaciones } = usePublicaciones();
  const { favoritos, handleAgregarFavorito, handleEliminarFavorito } = useFavoritos();
  const [comparacion, setComparacion] = useState(() => getStoredComparacion());
  const [comparadorAbierto, setComparadorAbierto] = useState(false);
  const [mostrarMapa, setMostrarMapa] = useState(false);
  const [filtrosAplicados, setFiltrosAplicados] = useState({});
  const [filtrosVisibles, setFiltrosVisibles] = useState(false);

  const [rangoPrecio, setRangoPrecio] = useState({
    min: PRECIO_MIN_RANGO_DEFAULT,
    max: PRECIO_MAX_RANGO_DEFAULT,
  });

  const [filtros, setFiltros] = useState({
    titulo: "",
    tipoInmueble: [],
    precioMin: "",
    precioMax: "",
    direccionOrden: "",
    servicios: []
  });

  useEffect(() => {
    const cargarPrecioMaximo = async () => {
      const [data, fetchError] = await getPublicaciones({
        ordenarPor: 'precioMensual',
        direccionOrden: 'DESC',
        pagina: 1,
      });

      if (fetchError) return;

      const lista = Array.isArray(data) 
        ? data 
        : (data?.data || data?.publicaciones || data?.registros || []);

      const maxReal = lista[0]?.precioMensual;

      if (maxReal && maxReal > 0) {
        setRangoPrecio({
          min: PRECIO_MIN_RANGO_DEFAULT,
          max: Math.ceil((maxReal * 1.1) / PRECIO_PASO) * PRECIO_PASO,
        });
      }
    };

    cargarPrecioMaximo();
  }, []);

  const publicacionesVisibles = useMemo(() => publicaciones, [publicaciones]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFiltros(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleTipoInmuebleClick = (tipoId) => {
    setFiltros((prev) => {
      const tiposActuales = prev.tipoInmueble || [];
      if (tiposActuales.includes(tipoId)) {
        return { ...prev, tipoInmueble: tiposActuales.filter((id) => id !== tipoId) };
      } else {
        return { ...prev, tipoInmueble: [...tiposActuales, tipoId] };
      }
    });
  };

  const handleServicioChange = (servicioId) => {
    setFiltros((prev) => {
      const serviciosActuales = prev.servicios || [];
      if (serviciosActuales.includes(servicioId)) {
        return { ...prev, servicios: serviciosActuales.filter(id => id !== servicioId) };
      } else {
        return { ...prev, servicios: [...serviciosActuales, servicioId] };
      }
    });
  };

  const handlePrecioMinTextoChange = (e) => {
    const value = e.target.value;
    if (value === '') {
      setFiltros((prev) => ({ ...prev, precioMin: value }));
      return;
    }
    const clamped = Math.min(Math.max(Number(value), rangoPrecio.min), rangoPrecio.max);
    setFiltros((prev) => ({ ...prev, precioMin: String(clamped) }));
  };

  const handlePrecioMaxTextoChange = (e) => {
    const value = e.target.value;
    if (value === '') {
      setFiltros((prev) => ({ ...prev, precioMax: value }));
      return;
    }
    const clamped = Math.min(Math.max(Number(value), rangoPrecio.min), rangoPrecio.max);
    setFiltros((prev) => ({ ...prev, precioMax: String(clamped) }));
  };

  const handleRangoMinChange = (e) => {
    const nextValue = Number(e.target.value);
    setFiltros((prev) => {
      const maxActual = Number(prev.precioMax || rangoPrecio.max);
      return { ...prev, precioMin: String(Math.min(nextValue, maxActual)) };
    });
  };

  const handleRangoMaxChange = (e) => {
    const nextValue = Number(e.target.value);
    setFiltros((prev) => {
      const minActual = Number(prev.precioMin || rangoPrecio.min);
      return { ...prev, precioMax: String(Math.max(nextValue, minActual)) };
    });
  };

  const limpiarFiltros = useCallback(() => {
    setFiltros({
      titulo: "",
      tipoInmueble: [],
      precioMin: "",
      precioMax: "",
      direccionOrden: "",
      servicios: []
    });
    setMostrarMapa(false);
    setFiltrosAplicados({});
    cargarPublicaciones({});
  }, [cargarPublicaciones]);

  useEffect(() => {
    if (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error al aplicar filtros',
        text: error.message || 'Ocurrió un problema al aplicar los filtros. Se restablecerán los valores por defecto.',
        confirmButtonColor: '#008080',
      });
      limpiarFiltros();
    }
  }, [error, limpiarFiltros]);

  useEffect(() => {
    try {
      sessionStorage.setItem(COMPARACION_STORAGE_KEY, JSON.stringify(comparacion));
    } catch {
      // ignore
    }
  }, [comparacion]);

  const aplicarFiltros = async () => {
    if (filtros.precioMin && filtros.precioMax) {
      const min = Number(filtros.precioMin);
      const max = Number(filtros.precioMax);

      if (min > max) {
        Swal.fire({
          icon: 'warning',
          title: 'Rango de precio inválido',
          text: 'El precio mínimo no puede ser mayor que el precio máximo.',
          confirmButtonColor: '#008080',
        });
        return;
      }
    }

    if (
      (filtros.precioMin && Number(filtros.precioMin) < 0) ||
      (filtros.precioMax && Number(filtros.precioMax) < 0)
    ) {
      Swal.fire({
        icon: 'warning',
        title: 'Rango de precio inválido',
        text: 'El precio no puede ser negativo.',
        confirmButtonColor: '#008080',
      });
      return;
    }

    try {
      const parametrosConsulta = {};

      if (filtros.titulo) parametrosConsulta.titulo = filtros.titulo;
      if (filtros.tipoInmueble && filtros.tipoInmueble.length > 0) {
        parametrosConsulta.tipoInmueble = filtros.tipoInmueble.join(',');
      }
      if (filtros.precioMin && Number(filtros.precioMin) > 0) {
        parametrosConsulta.precioMin = filtros.precioMin;
      }
      if (filtros.precioMax && Number(filtros.precioMax) > 0) {
        parametrosConsulta.precioMax = filtros.precioMax;
      }
      if (filtros.servicios && filtros.servicios.length > 0) {
        parametrosConsulta.servicios = filtros.servicios.join(',');
      }
      if (filtros.direccionOrden) {
        parametrosConsulta.ordenarPor = "precioMensual";
        parametrosConsulta.direccionOrden = filtros.direccionOrden;
      }

      setFiltrosAplicados(parametrosConsulta);
      await cargarPublicaciones({ ...parametrosConsulta, pagina: 1 });
    } catch {
      Swal.fire({
        icon: 'error',
        title: 'Error al aplicar filtros',
        text: 'Ocurrió un problema al aplicar los filtros. Se restablecerán los valores por defecto.',
        confirmButtonColor: '#008080',
      });
      limpiarFiltros();
    }
  };

  const irAPagina = (nuevaPagina) => {
    if (nuevaPagina < 1 || nuevaPagina > paginacion.totalPaginas || cargando) return;
    cargarPublicaciones({ ...filtrosAplicados, pagina: nuevaPagina });
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

    setComparacion((prev) => [...prev, buildComparablePublicacion(publicacion)]);
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

  const limpiarComparacion = () => {
    setComparacion([]);
    setComparadorAbierto(false);
  };

  const contarActivos = (grupo) => {
    if (grupo === 'tipo') return filtros.tipoInmueble?.length || 0;
    if (grupo === 'precio') return (filtros.precioMin ? 1 : 0) + (filtros.precioMax ? 1 : 0);
    if (grupo === 'servicios') return filtros.servicios?.length || 0;
    if (grupo === 'orden') return filtros.direccionOrden ? 1 : 0;
    return 0;
  };

  const precioMinPorcentaje = Math.min(100, Math.max(0, ((Number(filtros.precioMin || rangoPrecio.min) - rangoPrecio.min) / (rangoPrecio.max - rangoPrecio.min)) * 100));
  const precioMaxPorcentaje = Math.min(100, Math.max(0, ((Number(filtros.precioMax || rangoPrecio.max) - rangoPrecio.min) / (rangoPrecio.max - rangoPrecio.min)) * 100));

  return (
    <div className="ba-page">
      <section className="ba-hero">
        <div className="ba-hero-content">
          <div className="ba-hero-icon">
            <Search size={28} strokeWidth={2} />
          </div>
          <div>
            <h1 className="ba-hero-title">Encuentra tu próximo arriendo</h1>
            <p className="ba-hero-subtitle">Busca, filtra y compara las mejores opciones disponibles.</p>
          </div>
        </div>
      </section>

      <section className="ba-search-bar">
        <label className="ba-filter-field ba-filter-field--grow">
          <div className="ba-filter-input-icon-wrap">
            <Search size={16} color="#94a3b8" />
            <input
              type="text"
              name="titulo"
              placeholder="Busca por título"
              aria-label="Buscar por título"
              value={filtros.titulo}
              onChange={handleInputChange}
              onKeyDown={(e) => { if (e.key === 'Enter') aplicarFiltros(); }}
              className="ba-filter-input ba-filter-input--icon"
            />
          </div>
        </label>

        <label className="ba-filter-field ba-filter-field--fixed">
          <span className="ba-filter-label">
            <SlidersHorizontal size={13} />
            Ordenar por
          </span>
          <select
            name="direccionOrden"
            value={filtros.direccionOrden}
            onChange={handleInputChange}
            className="ba-filter-input"
          >
            <option value="">Sin ordenar</option>
            <option value="ASC">Precio: Menor a Mayor</option>
            <option value="DESC">Precio: Mayor a Menor</option>
          </select>
        </label>

        <button type="button" onClick={aplicarFiltros} className="ba-search-button">
          Buscar
        </button>
      </section>

      <section className="ba-filters-panel">
        <div className="ba-filters-header">
          <button
            type="button"
            onClick={() => setFiltrosVisibles((prev) => !prev)}
            className="ba-filters-toggle"
            aria-expanded={filtrosVisibles}
          >
            <span className="ba-filters-eyebrow">
              Más filtros
              <ChevronDown size={16} className={`ba-filters-chevron${filtrosVisibles ? ' ba-filters-chevron--open' : ''}`} />
            </span>
            <span className="ba-filters-subtitle">Filtra por tipo de inmueble, servicios y precio.</span>
          </button>
          <button type="button" onClick={limpiarFiltros} className="ba-filters-clear-button">
            Limpiar filtros
          </button>
        </div>

        {filtrosVisibles && (
          <>
            <div className="ba-filters-grid">
              <div className="ba-filter-field">
                <span className="ba-filter-label">
                  Tipo de inmueble
                  {contarActivos('tipo') > 0 && <span className="ba-badge-count">{contarActivos('tipo')}</span>}
                </span>
                <div className="ba-filter-chip-list">
                  {TIPOS_INMUEBLE.map((tipo) => (
                    <label key={tipo.id} className="ba-check-row">
                      <input
                        type="checkbox"
                        checked={filtros.tipoInmueble?.includes(tipo.id) || false}
                        onChange={() => handleTipoInmuebleClick(tipo.id)}
                        className="ba-checkbox"
                      />
                      {tipo.label}
                    </label>
                  ))}
                </div>
              </div>

              <div className="ba-filter-field">
                <span className="ba-filter-label">
                  Servicios
                  {contarActivos('servicios') > 0 && <span className="ba-badge-count">{contarActivos('servicios')}</span>}
                </span>
                <div className="ba-filter-chip-list">
                  {SERVICIOS_VALIDOS.map((servicio) => (
                    <label key={servicio.id} className="ba-check-row">
                      <input
                        type="checkbox"
                        checked={filtros.servicios?.includes(servicio.id)}
                        onChange={() => handleServicioChange(servicio.id)}
                        className="ba-checkbox"
                      />
                      {servicio.label}
                    </label>
                  ))}
                </div>
              </div>

              <div className="ba-filter-field">
                <span className="ba-filter-label">
                  Precio mensual
                  {contarActivos('precio') > 0 && <span className="ba-badge-count">{contarActivos('precio')}</span>}
                </span>
                <div className="ba-filter-price-box">
                    <div className="ba-price-inputs">
                      <div className="ba-price-input-wrap">
                        <span className="ba-price-currency">$</span>
                        <input
                          type="number"
                          min={rangoPrecio.min}
                          step={PRECIO_PASO}
                          value={filtros.precioMin}
                          onChange={handlePrecioMinTextoChange}
                          placeholder="Mínimo"
                          className="ba-price-input"
                        />
                      </div>
                      <span className="ba-price-separator">—</span>
                      <div className="ba-price-input-wrap">
                        <span className="ba-price-currency">$</span>
                        <input
                          type="number"
                          min={rangoPrecio.min}
                          step={PRECIO_PASO}
                          value={filtros.precioMax}
                          onChange={handlePrecioMaxTextoChange}
                          placeholder="Máximo"
                          className="ba-price-input"
                        />
                      </div>
                    </div>

                    <div className="ba-range-slider">
                      <div className="ba-range-track" />
                      <div
                        className="ba-range-fill"
                        style={{ left: `${precioMinPorcentaje}%`, right: `${100 - precioMaxPorcentaje}%` }}
                      />
                      <input
                        type="range"
                        min={rangoPrecio.min}
                        max={rangoPrecio.max}
                        step={PRECIO_PASO}
                        value={filtros.precioMin || rangoPrecio.min}
                        onChange={handleRangoMinChange}
                        className="ba-range-input"
                      />
                      <input
                        type="range"
                        min={rangoPrecio.min}
                        max={rangoPrecio.max}
                        step={PRECIO_PASO}
                        value={filtros.precioMax || rangoPrecio.max}
                        onChange={handleRangoMaxChange}
                        className="ba-range-input"
                      />
                    </div>
                  </div>
              </div>
            </div>
          </>
        )}
      </section>

      <div className="ba-toolbar">
        <button
          type="button"
          onClick={() => setMostrarMapa((prev) => !prev)}
          className={`map-toggle-button${mostrarMapa ? ' map-toggle-button--active' : ''}`}
        >
          <Map size={16} />
          {mostrarMapa ? 'Ocultar mapa' : 'Ver en el mapa'}
        </button>

        {comparacion.length > 0 && (
          <div className="ba-compare-bar">
            <span className="ba-compare-count">
              Seleccionadas: {comparacion.length}/3
            </span>
            <button
              type="button"
              onClick={abrirComparador}
              className="ba-compare-button"
            >
              Comparar seleccionadas
            </button>
            <button
              type="button"
              onClick={limpiarComparacion}
              className="ba-compare-clear-button"
            >
              Limpiar selección
            </button>
          </div>
        )}
      </div>

      {comparadorAbierto && (
        <ComparadorPublicacionesModal
          publicaciones={comparacion}
          onClose={() => setComparadorAbierto(false)}
        />
      )}

      {cargando && <p className="loading-text ba-center">Cargando alojamientos...</p>}
      {error && <p className="error-text ba-center"> Error: {error.message}</p>}

      {!cargando && !error && (
        <>
          {mostrarMapa && (
            <div className="ba-map-wrapper">
              <PublicationMap publicaciones={publicacionesVisibles} />
            </div>
          )}

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
              <p className="empty-text ba-center ba-empty-text">
                No encontramos arriendos con esos filtros.
              </p>
            )}
          </div>

          {publicacionesVisibles.length > 0 && paginacion.totalPaginas > 1 && (
            <div className="ba-pagination">
              <button
                type="button"
                onClick={() => irAPagina(paginacion.paginaActual - 1)}
                disabled={paginacion.paginaActual <= 1 || cargando}
                className="ba-pagination-button"
              >
                Anterior
              </button>
              <span className="ba-pagination-label">
                Página {paginacion.paginaActual} de {paginacion.totalPaginas} ({paginacion.total} resultados)
              </span>
              <button
                type="button"
                onClick={() => irAPagina(paginacion.paginaActual + 1)}
                disabled={paginacion.paginaActual >= paginacion.totalPaginas || cargando}
                className="ba-pagination-button"
              >
                Siguiente
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}