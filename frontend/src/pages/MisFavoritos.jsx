import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GitCompareArrows, Heart, MapPin, Trash2 } from 'lucide-react';
import Swal from 'sweetalert2';
import ComparadorPublicacionesModal from '@components/ComparadorPublicacionesModal';
import { eliminarFavorito, getMisFavoritos } from '@services/user.service.js';
import { resolveFileUrl } from '@helpers/resolveFileUrl.js';

const accent = '#0f766e';

function formatPrice(value) {
  return Number(value || 0).toLocaleString('es-CL');
}

function getPublicacionId(publicacion) {
  return publicacion?.publicId;
}

const MisFavoritos = () => {
  const navigate = useNavigate();
  const [favoritos, setFavoritos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [comparacion, setComparacion] = useState([]);
  const [comparadorAbierto, setComparadorAbierto] = useState(false);

  useEffect(() => {
    fetchFavoritos();
  }, []);

  const fetchFavoritos = async () => {
    setLoading(true);
    const data = await getMisFavoritos();

    if (Array.isArray(data)) {
      setFavoritos(data);
    } else {
      setFavoritos([]);
    }

    setLoading(false);
  };

  const handleEliminarFavorito = async (publicacionId) => {
    const confirm = await Swal.fire({
      title: '¿Seguro que quieres eliminarlo de tus favoritos?',
      text: 'La publicación seguirá disponible para buscarla nuevamente.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: accent,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
    });

    if (!confirm.isConfirmed) return;

    const response = await eliminarFavorito(publicacionId);

    if (response?.status === 'Client error') {
      Swal.fire({
        icon: 'error',
        title: 'No se pudo quitar',
        text: response?.details || response?.message || 'Intenta nuevamente.',
        confirmButtonColor: accent,
      });
      return;
    }

    Swal.fire({
      icon: 'success',
      title: 'Favorito eliminado',
      confirmButtonColor: accent,
    });

    setComparacion((prev) => prev.filter((publicacion) => getPublicacionId(publicacion) !== publicacionId));
    fetchFavoritos();
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
        confirmButtonColor: accent,
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
        confirmButtonColor: accent,
      });
      return;
    }

    setComparadorAbierto(true);
  };

  const limpiarComparacion = () => {
    setComparacion([]);
    setComparadorAbierto(false);
  };

  return (
    <div style={styles.page}>
      <section style={styles.hero}>
        <div style={styles.heroContent}>
          <div style={styles.heroIcon}>
            <Heart size={28} strokeWidth={2} />
          </div>
          <div>
            <h1 style={styles.heroTitle}>Mis Favoritos</h1>
            <p style={styles.heroSubtitle}>Publicaciones que guardaste para revisarlas después.</p>
          </div>
        </div>
      </section>

      <section style={styles.card}>
        <header style={styles.cardHeader}>
          <h2 style={styles.cardTitle}>Tus publicaciones favoritas</h2>
          <p style={styles.cardSubtitle}>Desde aquí puedes revisar o quitar publicaciones de tu lista.</p>
        </header>

        {!loading && favoritos.length > 0 && comparacion.length > 0 && (
          <div style={styles.compareToolbar}>
            <span style={styles.compareCounter}>Seleccionadas: {comparacion.length}/3</span>
            <div style={styles.compareActions}>
              <button type="button" onClick={abrirComparador} style={styles.compareButton}>
                Comparar seleccionadas
              </button>
              <button type="button" onClick={limpiarComparacion} style={styles.compareClearButton}>
                Limpiar selecciÃ³n
              </button>
            </div>
          </div>
        )}

        {comparadorAbierto && (
          <ComparadorPublicacionesModal
            publicaciones={comparacion}
            onClose={() => setComparadorAbierto(false)}
          />
        )}

        {loading ? (
          <p style={styles.emptyText}>Cargando favoritos...</p>
        ) : favoritos.length === 0 ? (
          <div style={styles.emptyState}>
            <div style={styles.emptyIcon}>
              <Heart size={26} strokeWidth={2} />
            </div>
            <h3 style={styles.emptyTitle}>Aún no guardas publicaciones</h3>
            <p style={styles.emptyText}>Cuando marques una publicación como favorita, aparecerá aquí.</p>
          </div>
        ) : (
          <div style={styles.grid}>
            {favoritos.map((item) => {
              const publicacion = item.publicacion || item;
              const publicacionId = publicacion.publicId;
              const seleccionadaParaComparar = comparacion.some((item) => getPublicacionId(item) === publicacionId);
              const comparacionDeshabilitada = comparacion.length >= 3 && !seleccionadaParaComparar;
              
              const fallbackImage = 'https://via.placeholder.com/400x250?text=Imagen+no+disponible';
              const imagenPrincipal = publicacion.fotos && publicacion.fotos.length > 0
                ? resolveFileUrl(publicacion.fotos[0])
                : fallbackImage;

              return (
                <article key={item.id || publicacionId} style={styles.favoriteCard}>
                  {/* SECCIÓN DE IMAGEN CON BADGE ABSOLUTO */}
                  <div style={styles.cardImageSection}>
                    <img src={imagenPrincipal} alt={publicacion.titulo} style={styles.cardImage} />
                    <button
                      type="button"
                      onClick={() => toggleComparacion(publicacion)}
                      disabled={comparacionDeshabilitada}
                      style={{
                        ...styles.compareIconButton,
                        ...(seleccionadaParaComparar ? styles.compareIconButtonSelected : {}),
                        ...(comparacionDeshabilitada ? styles.compareIconButtonDisabled : {}),
                      }}
                      title={comparacionDeshabilitada ? 'Puedes comparar hasta tres publicaciones' : seleccionadaParaComparar ? 'Quitar de comparaciÃ³n' : 'Seleccionar para comparar'}
                      aria-label={seleccionadaParaComparar ? 'Quitar de comparaciÃ³n' : 'Seleccionar para comparar'}
                    >
                      <GitCompareArrows size={18} strokeWidth={2.4} />
                    </button>
                    <span style={styles.badge}>{publicacion.estado || 'activa'}</span>
                  </div>

                  {/* SECCIÓN DE DETALLES DE LA PUBLICACIÓN */}
                  <div style={styles.cardDetailsSection}>
                    <h3 style={styles.favoriteTitle}>{publicacion.titulo}</h3>
                    <p style={styles.favoriteMeta}>{publicacion.tipoInmueble}</p>

                    <div style={styles.detailRow}>
                      <MapPin size={16} strokeWidth={2} />
                      <span>{publicacion.ubicacion}</span>
                    </div>

                    <div style={styles.priceRow}>
                      <span style={styles.priceLabel}>Arriendo mensual</span>
                      <strong style={styles.priceValue}>${formatPrice(publicacion.precioMensual)} / mes</strong>
                    </div>

                    {/* SECCIÓN DE ACCIONES FINAL: COMPARAR, VER DETALLES Y ELIMINAR */}
                    <div style={styles.cardActionsSection}>
                      <div style={styles.actionButtonsGroup}>
                        <button
                          type="button"
                          onClick={() => navigate(`/publicacion/${publicacion.publicId}`)}
                          style={styles.verDetallesButton}
                        >
                          Ver Detalles
                        </button>

                        <button
                          type="button"
                          onClick={() => handleEliminarFavorito(publicacionId)}
                          style={styles.removeButton}
                          title='Eliminar de favoritos'
                        >
                          <Trash2 size={20} color="#dc2626" />
                          <span>Eliminar</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};

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
    border: '3px solid rgba(255,255,255,0.4)',
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
  card: {
    borderRadius: '22px',
    padding: '28px',
    backgroundColor: '#ffffff',
    border: '1px solid rgba(15, 23, 42, 0.06)',
    boxShadow: '0 12px 30px rgba(15, 23, 42, 0.07)',
  },
  cardHeader: {
    marginBottom: '20px',
  },
  eyebrow: {
    margin: '0 0 6px',
    fontSize: '12px',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
  },
  cardTitle: {
    margin: '0 0 6px',
    fontSize: '20px',
    color: '#0f172a',
  },
  cardSubtitle: {
    margin: 0,
    fontSize: '14px',
    color: '#64748b',
  },
  compareToolbar: {
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: '14px',
    display: 'flex',
    flexWrap: 'wrap',
    gap: '12px',
    justifyContent: 'space-between',
    marginBottom: '18px',
    padding: '12px 14px',
  },
  compareCounter: {
    color: '#475569',
    fontSize: '14px',
    fontWeight: 700,
  },
  compareButton: {
    backgroundColor: accent,
    border: 'none',
    borderRadius: '10px',
    color: '#ffffff',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: 700,
    padding: '10px 14px',
    transition: 'background-color 0.2s ease',
  },
  compareActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
  },
  compareClearButton: {
    backgroundColor: '#ffffff',
    border: '1px solid #dbe4ee',
    borderRadius: '10px',
    color: '#334155',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: 700,
    padding: '10px 14px',
    transition: 'background-color 0.2s ease',
  },
  emptyState: {
    padding: '36px 20px',
    borderRadius: '20px',
    border: '1px dashed #cbd5e1',
    backgroundColor: '#f8fafc',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    gap: '10px',
  },
  emptyIcon: {
    width: '56px',
    height: '56px',
    borderRadius: '18px',
    backgroundColor: '#e6f4f1',
    color: accent,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    margin: 0,
    color: '#0f172a',
    fontSize: '18px',
  },
  emptyText: {
    margin: 0,
    color: '#64748b',
    fontSize: '14px',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
    gap: '16px',
  },
  favoriteCard: {
    padding: '18px',
    borderRadius: '22px',
    backgroundColor: '#ffffff',
    border: '1px solid rgba(15, 23, 42, 0.06)',
    boxShadow: '0 8px 20px rgba(15, 23, 42, 0.05)',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    overflow: 'hidden',
    cursor: 'pointer',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
  },
  cardImageSection: {
    position: 'relative',
    width: '100%',
    height: '180px',
    overflow: 'hidden',
    borderRadius: '16px',
    marginBottom: '10px',
  },
  cardImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  compareIconButton: {
    position: 'absolute',
    top: '12px',
    left: '12px',
    zIndex: 2,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '36px',
    height: '36px',
    padding: 0,
    borderRadius: '50%',
    border: 'none',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    color: accent,
    boxShadow: '0 2px 6px rgba(0,0,0,0.14)',
    cursor: 'pointer',
    backdropFilter: 'blur(6px)',
    transition: 'background-color 160ms ease, color 160ms ease, transform 120ms ease',
  },
  compareIconButtonSelected: {
    backgroundColor: accent,
    color: '#ffffff',
  },
  compareIconButtonDisabled: {
    cursor: 'not-allowed',
    opacity: 0.72,
  },
  badge: {
    position: 'absolute',
    top: '12px',
    right: '12px',
    display: 'inline-flex',
    alignItems: 'center',
    borderRadius: '999px',
    padding: '6px 12px',
    fontSize: '12px',
    fontWeight: '700',
    color: '#0f766e',
    backgroundColor: '#dff3ef',
    textTransform: 'capitalize',
    zIndex: 1,
  },
  cardDetailsSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    flex: '1 1 auto',
  },
  favoriteTitle: {
    margin: 0,
    fontSize: '18px',
    lineHeight: 1.2,
    color: '#0f172a',
  },
  favoriteMeta: {
    margin: 0,
    fontSize: '13px',
    color: '#64748b',
    textTransform: 'capitalize',
  },
  detailRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    color: '#475569',
    fontSize: '13px',
  },
  priceRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '10px',
    padding: '12px 14px',
    borderRadius: '14px',
    backgroundColor: '#f1f5f9',
    border: '1px solid #e2e8f0',
  },
  priceLabel: {
    fontSize: '12px',
    color: '#64748b',
  },
  priceValue: {
    fontSize: '18px',
    color: '#0f172a',
  },
  verDetallesButton: {
    flex: '1 1 0',
    border: 'none',
    borderRadius: '10px',
    padding: '10px 14px',
    backgroundColor: accent,
    color: '#ffffff',
    cursor: 'pointer',
    fontWeight: 700,
    fontSize: '14px',
    whiteSpace: 'nowrap',
  },
  actionButtonsGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flexWrap: 'nowrap',
  },
  cardActionsSection: {
    marginTop: 'auto',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'stretch',
    gap: '10px',
    paddingTop: '10px',
    borderTop: '1px solid #e2e8f0',
  },
  removeButton: {
    flex: '1 1 0',
    border: 'none',
    borderRadius: '10px',
    padding: '10px 14px',
    backgroundColor: '#fee2e2',
    color: '#b91c1c',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    fontWeight: '700',
    whiteSpace: 'nowrap',
    transition: 'background-color 0.2s ease',
  },
};

export default MisFavoritos;
