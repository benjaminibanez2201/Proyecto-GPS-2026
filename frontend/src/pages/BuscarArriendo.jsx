import { useCallback, useMemo, useState, useEffect, useLayoutEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { usePublicaciones } from '../hooks/publicaciones/usePublicacion';
import { useFavoritos } from '../hooks/favoritos/useFavoritos';
import ComparadorPublicacionesModal from '../components/ComparadorPublicacionesModal';
import PublicacionCard from '../components/PublicacionCard';
import { Search, ChevronDown, SlidersHorizontal, MapPin } from 'lucide-react';
import PublicationMap from '@components/PublicationMap';
import Swal from 'sweetalert2';
import '@styles/buscarArriendos.css';
import '@styles/basePublicaciones.css';

function getPublicacionId(publicacion) {
  return publicacion?.id_publicacion || publicacion?.id || publicacion?._id;
}

function FiltroDropdown({ open, anchorRef, align = 'left', className = '', children }) {
  const [position, setPosition] = useState(null);

  useLayoutEffect(() => {
    if (!open || !anchorRef.current) {
      setPosition(null);
      return undefined;
    }

    const updatePosition = () => {
      const rect = anchorRef.current.getBoundingClientRect();
      setPosition({
        top: rect.bottom + 10,
        left: align === 'right' ? undefined : rect.left,
        right: align === 'right' ? window.innerWidth - rect.right : undefined,
      });
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);

    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [open, anchorRef, align]);

  if (!open || !position) return null;

  return createPortal(
    <div
      className={`ba-dropdown ${className}`}
      style={{ position: 'fixed', top: position.top, left: position.left, right: position.right }}
      onClick={(e) => e.stopPropagation()}
    >
      {children}
    </div>,
    document.body,
  );
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

const PRECIO_MIN_RANGO = 0;
const PRECIO_MAX_RANGO = 1500000;
const PRECIO_PASO = 10000;

export default function BuscarArriendos() {
  const { publicaciones, cargando, error, paginacion, cargarPublicaciones } = usePublicaciones();
  const { favoritos, handleAgregarFavorito, handleEliminarFavorito } = useFavoritos();
  const [comparacion, setComparacion] = useState([]);
  const [comparadorAbierto, setComparadorAbierto] = useState(false);
  const [mostrarMapa, setMostrarMapa] = useState(false);
  const [filtrosAplicados, setFiltrosAplicados] = useState({});
  const [dropdownAbierto, setDropdownAbierto] = useState(null);
  const tipoBtnRef = useRef(null);
  const precioBtnRef = useRef(null);
  const serviciosBtnRef = useRef(null);
  const ordenBtnRef = useRef(null);

  const [filtros, setFiltros] = useState({
    titulo: "",
    tipoInmueble: [],
    precioMin: "",
    precioMax: "",
    direccionOrden: "",
    servicios: []
  });

  const publicacionesVisibles = useMemo(() => publicaciones, [publicaciones]);

  const toggleDropdown = (nombre) => {
    setDropdownAbierto((actual) => (actual === nombre ? null : nombre));
  };

  const cerrarDropdowns = useCallback(() => setDropdownAbierto(null), []);

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
    setFiltros((prev) => ({ ...prev, precioMin: value }));
  };

  const handlePrecioMaxTextoChange = (e) => {
    const value = e.target.value;
    setFiltros((prev) => ({ ...prev, precioMax: value }));
  };

  const handleRangoMinChange = (e) => {
    const nextValue = Number(e.target.value);
    setFiltros((prev) => {
      const maxActual = Number(prev.precioMax || PRECIO_MAX_RANGO);
      return { ...prev, precioMin: String(Math.min(nextValue, maxActual)) };
    });
  };

  const handleRangoMaxChange = (e) => {
    const nextValue = Number(e.target.value);
    setFiltros((prev) => {
      const minActual = Number(prev.precioMin || PRECIO_MIN_RANGO);
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
    cerrarDropdowns();
    cargarPublicaciones({});
  }, [cargarPublicaciones, cerrarDropdowns]);

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

  const aplicarFiltros = async () => {
    cerrarDropdowns();

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
      if (filtros.precioMin) parametrosConsulta.precioMin = filtros.precioMin;
      if (filtros.precioMax) parametrosConsulta.precioMax = filtros.precioMax;
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

  const contarActivos = (grupo) => {
    if (grupo === 'tipo') return filtros.tipoInmueble?.length || 0;
    if (grupo === 'precio') return (filtros.precioMin ? 1 : 0) + (filtros.precioMax ? 1 : 0);
    if (grupo === 'servicios') return filtros.servicios?.length || 0;
    if (grupo === 'orden') return filtros.direccionOrden ? 1 : 0;
    return 0;
  };

  const tipoLabel = filtros.tipoInmueble?.length === 1
    ? TIPOS_INMUEBLE.find((t) => t.id === filtros.tipoInmueble[0])?.label
    : 'Tipo de inmueble';

  const precioLabel = (() => {
    if (filtros.precioMin && filtros.precioMax) return `$${Number(filtros.precioMin).toLocaleString('es-CL')} - $${Number(filtros.precioMax).toLocaleString('es-CL')}`;
    if (filtros.precioMin) return `Desde $${Number(filtros.precioMin).toLocaleString('es-CL')}`;
    if (filtros.precioMax) return `Hasta $${Number(filtros.precioMax).toLocaleString('es-CL')}`;
    return 'Precio';
  })();

  const precioMinPorcentaje = ((Number(filtros.precioMin || PRECIO_MIN_RANGO) - PRECIO_MIN_RANGO) / (PRECIO_MAX_RANGO - PRECIO_MIN_RANGO)) * 100;
  const precioMaxPorcentaje = ((Number(filtros.precioMax || PRECIO_MAX_RANGO) - PRECIO_MIN_RANGO) / (PRECIO_MAX_RANGO - PRECIO_MIN_RANGO)) * 100;

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

      {dropdownAbierto && (
        <div className="ba-overlay" onClick={cerrarDropdowns} />
      )}

      <div className="ba-filter-bar">
        <div className="ba-pill">
          <Search size={16} color="#94a3b8" className="ba-pill-icon" />
          <input
            type="text"
            name="titulo"
            placeholder="Busca por título"
            value={filtros.titulo}
            onChange={handleInputChange}
            className="ba-pill-input"
          />
        </div>
        <div className="ba-dropdown-wrap">
          <button
            ref={tipoBtnRef}
            type="button"
            onClick={() => toggleDropdown('tipo')}
            className={`ba-pill-button ${filtros.tipoInmueble?.length > 0 ? 'ba-pill-button--active' : ''}`}
          >
            <span className="ba-pill-button-text">{tipoLabel}</span>
            <span className="ba-pill-button-right">
              {contarActivos('tipo') > 0 && <span className="ba-badge-count">{contarActivos('tipo')}</span>}
              <ChevronDown size={16} className={`ba-chevron ${dropdownAbierto === 'tipo' ? 'ba-chevron--open' : ''}`} />
            </span>
          </button>

          <FiltroDropdown open={dropdownAbierto === 'tipo'} anchorRef={tipoBtnRef} className="ba-dropdown--w230">
              <div className="ba-dropdown-list">
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
              <div className="ba-dropdown-footer">
                <button
                  type="button"
                  onClick={() => setFiltros((prev) => ({ ...prev, tipoInmueble: [] }))}
                  className="ba-link-button"
                >
                  Limpiar
                </button>
                <button type="button" onClick={cerrarDropdowns} className="ba-apply-button">
                  Aplicar
                </button>
              </div>
          </FiltroDropdown>
        </div>
        <div className="ba-dropdown-wrap">
          <button
            ref={precioBtnRef}
            type="button"
            onClick={() => toggleDropdown('precio')}
            className={`ba-pill-button ${(filtros.precioMin || filtros.precioMax) ? 'ba-pill-button--active' : ''}`}
          >
            <span className="ba-pill-button-text">{precioLabel}</span>
            <span className="ba-pill-button-right">
              <ChevronDown size={16} className={`ba-chevron ${dropdownAbierto === 'precio' ? 'ba-chevron--open' : ''}`} />
            </span>
          </button>

          <FiltroDropdown open={dropdownAbierto === 'precio'} anchorRef={precioBtnRef} className="ba-dropdown--w320">
              <div className="ba-dropdown-body">
                <div className="ba-price-inputs">
                  <div className="ba-field-group">
                    <span className="ba-dropdown-label">Mínimo</span>
                    <div className="ba-price-input-wrap">
                      <span className="ba-price-currency">$</span>
                      <input
                        type="number"
                        min={0}
                        step={PRECIO_PASO}
                        value={filtros.precioMin}
                        onChange={handlePrecioMinTextoChange}
                        placeholder="0"
                        className="ba-dropdown-input ba-price-input"
                      />
                    </div>
                  </div>
                  <span className="ba-price-separator">—</span>
                  <div className="ba-field-group">
                    <span className="ba-dropdown-label">Máximo</span>
                    <div className="ba-price-input-wrap">
                      <span className="ba-price-currency">$</span>
                      <input
                        type="number"
                        min={0}
                        step={PRECIO_PASO}
                        value={filtros.precioMax}
                        onChange={handlePrecioMaxTextoChange}
                        placeholder="Sin límite"
                        className="ba-dropdown-input ba-price-input"
                      />
                    </div>
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
                    min={PRECIO_MIN_RANGO}
                    max={PRECIO_MAX_RANGO}
                    step={PRECIO_PASO}
                    value={filtros.precioMin || PRECIO_MIN_RANGO}
                    onChange={handleRangoMinChange}
                    className="ba-range-input"
                  />
                  <input
                    type="range"
                    min={PRECIO_MIN_RANGO}
                    max={PRECIO_MAX_RANGO}
                    step={PRECIO_PASO}
                    value={filtros.precioMax || PRECIO_MAX_RANGO}
                    onChange={handleRangoMaxChange}
                    className="ba-range-input"
                  />
                </div>
              </div>
              <div className="ba-dropdown-footer">
                <button
                  type="button"
                  onClick={() => setFiltros((prev) => ({ ...prev, precioMin: '', precioMax: '' }))}
                  className="ba-link-button"
                >
                  Limpiar
                </button>
                <button type="button" onClick={cerrarDropdowns} className="ba-apply-button">
                  Aplicar
                </button>
              </div>
          </FiltroDropdown>
        </div>
        <div className="ba-dropdown-wrap">
          <button
            ref={serviciosBtnRef}
            type="button"
            onClick={() => toggleDropdown('servicios')}
            className={`ba-pill-button ${filtros.servicios?.length > 0 ? 'ba-pill-button--active' : ''}`}
          >
            <span className="ba-pill-button-text">Servicios</span>
            <span className="ba-pill-button-right">
              {contarActivos('servicios') > 0 && <span className="ba-badge-count">{contarActivos('servicios')}</span>}
              <ChevronDown size={16} className={`ba-chevron ${dropdownAbierto === 'servicios' ? 'ba-chevron--open' : ''}`} />
            </span>
          </button>

          <FiltroDropdown open={dropdownAbierto === 'servicios'} anchorRef={serviciosBtnRef} className="ba-dropdown--w280">
              <div className="ba-dropdown-list ba-dropdown-list--scroll">
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
              <div className="ba-dropdown-footer">
                <button
                  type="button"
                  onClick={() => setFiltros((prev) => ({ ...prev, servicios: [] }))}
                  className="ba-link-button"
                >
                  Limpiar
                </button>
                <button type="button" onClick={cerrarDropdowns} className="ba-apply-button">
                  Aplicar
                </button>
              </div>
          </FiltroDropdown>
        </div>
        <div className="ba-dropdown-wrap">
          <button
            ref={ordenBtnRef}
            type="button"
            onClick={() => toggleDropdown('orden')}
            className={`ba-pill-button ${contarActivos('orden') > 0 ? 'ba-pill-button--active' : ''}`}
          >
            <SlidersHorizontal size={15} className="ba-pill-icon" />
            <span className="ba-pill-button-text">Ordenar por</span>
            <span className="ba-pill-button-right">
              {contarActivos('orden') > 0 && <span className="ba-badge-count">{contarActivos('orden')}</span>}
              <ChevronDown size={16} className={`ba-chevron ${dropdownAbierto === 'orden' ? 'ba-chevron--open' : ''}`} />
            </span>
          </button>

          <FiltroDropdown open={dropdownAbierto === 'orden'} anchorRef={ordenBtnRef} align="right" className="ba-dropdown--w260">
              <div className="ba-dropdown-body">
                <div className="ba-field-group">
                  <span className="ba-dropdown-label">Ordenar por</span>
                  <select
                    name="direccionOrden"
                    value={filtros.direccionOrden}
                    onChange={handleInputChange}
                    className="ba-dropdown-input"
                  >
                    <option value="">Sin ordenar</option>
                    <option value="ASC">Precio: Menor a Mayor</option>
                    <option value="DESC">Precio: Mayor a Menor</option>
                  </select>
                </div>
              </div>
              <div className="ba-dropdown-footer">
                <button
                  type="button"
                  onClick={() => setFiltros((prev) => ({ ...prev, direccionOrden: '' }))}
                  className="ba-link-button"
                >
                  Limpiar
                </button>
                <button type="button" onClick={cerrarDropdowns} className="ba-apply-button">
                  Aplicar
                </button>
              </div>
          </FiltroDropdown>
        </div>

        <button type="button" onClick={limpiarFiltros} className="ba-clear-all-button">
          Limpiar filtros
        </button>

        <button type="button" onClick={aplicarFiltros} className="ba-search-button">
          Buscar
        </button>
      </div>

      <div className="ba-toolbar">
        <button
          type="button"
          onClick={() => setMostrarMapa((prev) => !prev)}
          className={`map-toggle-button${mostrarMapa ? ' map-toggle-button--active' : ''}`}
        >
          <MapPin size={16} />
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
