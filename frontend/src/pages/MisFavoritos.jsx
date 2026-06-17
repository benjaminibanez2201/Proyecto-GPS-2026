import { useEffect, useState } from 'react';
import { Heart, House, MapPin, Trash2 } from 'lucide-react';
import Swal from 'sweetalert2';
import { eliminarFavorito, getMisFavoritos } from '@services/user.service.js';

const accent = '#0f766e';

function formatPrice(value) {
  return Number(value || 0).toLocaleString('es-CL');
}

const MisFavoritos = () => {
  const [favoritos, setFavoritos] = useState([]);
  const [loading, setLoading] = useState(true);

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
      title: '¿Quitar de favoritos?',
      text: 'La publicación seguirá disponible para buscarla nuevamente.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: accent,
      confirmButtonText: 'Sí, quitar',
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

    fetchFavoritos();
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
          <p style={{ ...styles.eyebrow, color: accent }}>Guardadas</p>
          <h2 style={styles.cardTitle}>Tus publicaciones favoritas</h2>
          <p style={styles.cardSubtitle}>Desde aquí puedes revisar o quitar publicaciones de tu lista.</p>
        </header>

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
              const publicacionId = publicacion.id_publicacion || publicacion.id;

              return (
                <article key={item.id || publicacionId} style={styles.favoriteCard}>
                  <div style={styles.favoriteHeader}>
                    <div style={styles.favoriteIcon}>
                      <House size={20} strokeWidth={2.1} />
                    </div>
                    <span style={styles.badge}>{publicacion.estado || 'activa'}</span>
                  </div>

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

                  <button
                    type="button"
                    onClick={() => handleEliminarFavorito(publicacionId)}
                    style={styles.removeButton}
                  >
                    <Trash2 size={16} strokeWidth={2.1} />
                    Quitar de favoritos
                  </button>
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
    gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
    gap: '16px',
  },
  favoriteCard: {
    padding: '18px',
    borderRadius: '18px',
    backgroundColor: '#f8fafc',
    border: '1px solid #e2e8f0',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  favoriteHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '12px',
  },
  favoriteIcon: {
    width: '40px',
    height: '40px',
    borderRadius: '14px',
    backgroundColor: '#e6f4f1',
    color: accent,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    display: 'inline-flex',
    alignItems: 'center',
    borderRadius: '999px',
    padding: '6px 10px',
    fontSize: '12px',
    fontWeight: '700',
    color: '#0f766e',
    backgroundColor: '#dff3ef',
    textTransform: 'capitalize',
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
    flexDirection: 'column',
    gap: '2px',
    padding: '12px 14px',
    borderRadius: '14px',
    backgroundColor: '#ffffff',
    border: '1px solid #e2e8f0',
  },
  priceLabel: {
    fontSize: '12px',
    color: '#64748b',
  },
  priceValue: {
    fontSize: '15px',
    color: '#0f172a',
  },
  removeButton: {
    border: 'none',
    borderRadius: '12px',
    padding: '10px 12px',
    backgroundColor: '#fee2e2',
    color: '#b91c1c',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    fontWeight: '700',
  },
};

export default MisFavoritos;