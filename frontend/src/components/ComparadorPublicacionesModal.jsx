import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, Home, MapPin, Star, Wallet, Wifi, X } from 'lucide-react';
import { getPublicacionPorId } from '@services/publicacion.service.js';
import { resolveFileUrl } from '@helpers/resolveFileUrl.js';

const accent = '#0f766e';

const serviceLabels = {
  agua: 'Agua',
  luz: 'Luz',
  gas: 'Gas',
  internet: 'Internet',
  tv_cable: 'TV Cable',
  calefaccion: 'Calefaccion',
  estacionamiento: 'Estacionamiento',
  lavadora: 'Lavadora',
};

function getPublicacionId(publicacion) {
  return publicacion?.id_publicacion || publicacion?.id || publicacion?._id;
}

function formatPrice(value) {
  return new Intl.NumberFormat('es-CL', {
    currency: 'CLP',
    style: 'currency',
  }).format(Number(value || 0));
}

function getServices(servicios) {
  if (!Array.isArray(servicios) || servicios.length === 0) return [];
  return servicios.filter(Boolean);
}

function formatService(servicio) {
  if (!servicio) return 'Servicio';
  if (serviceLabels[servicio]) return serviceLabels[servicio];

  return servicio
    .toString()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatRating(arrendador) {
  const rating = Number(arrendador?.avgRating || 0);
  const count = Number(arrendador?.reviewsCount || 0);

  if (!count) return 'Sin calificaciones';

  return `${rating.toFixed(1)} / 5 (${count})`;
}

function getPrimaryImage(publicacion) {
  const fotos = Array.isArray(publicacion?.fotos) ? publicacion.fotos : [];
  return fotos.length > 0
    ? resolveFileUrl(fotos[0])
    : 'https://via.placeholder.com/480x260?text=Sin+Imagen';
}

export default function ComparadorPublicacionesModal({ publicaciones, onClose }) {
  const navigate = useNavigate();
  const [detalles, setDetalles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const comparisonColumnWidth = detalles.length > 0
    ? `calc((100% - ${styles.rowHeader.width}) / ${detalles.length})`
    : 'auto';

  useEffect(() => {
    let isMounted = true;

    async function cargarDetalles() {
      setLoading(true);
      setError('');

      const responses = await Promise.all(
        publicaciones.map((publicacion) => getPublicacionPorId(publicacion.publicId)),
      );

      if (!isMounted) return;

      const errores = responses.filter(([, err]) => err);
      if (errores.length > 0) {
        setError('No se pudieron cargar todos los detalles para comparar.');
      }

      setDetalles(responses.map(([data]) => data).filter(Boolean));
      setLoading(false);
    }

    cargarDetalles();

    return () => {
      isMounted = false;
    };
  }, [publicaciones]);

  const rows = [
    {
      label: 'Precio mensual',
      Icon: Wallet,
      highlight: true,
      render: (publicacion) => <span style={styles.priceValue}>{formatPrice(publicacion.precioMensual)}</span>,
    },
    {
      label: 'Tipo de inmueble',
      Icon: Home,
      render: (publicacion) => publicacion.tipoInmueble || 'No especificado',
    },
    {
      label: 'Ubicacion',
      Icon: MapPin,
      render: (publicacion) => publicacion.ubicacion || 'No especificada',
    },
    {
      label: 'Servicios incluidos',
      Icon: Wifi,
      render: (publicacion) => {
        const servicios = getServices(publicacion.serviciosIncluidos);
        if (!servicios.length) return 'No especificados';

        return (
          <div style={styles.chipList}>
            {servicios.map((servicio) => (
              <span key={servicio} style={styles.serviceChip}>
                {formatService(servicio)}
              </span>
            ))}
          </div>
        );
      },
    },
    {
      label: 'Calificacion arrendador',
      Icon: Star,
      render: (publicacion) => formatRating(publicacion.arrendador),
    },
  ];

  return (
    <div style={styles.overlay} role="dialog" aria-modal="true" aria-label="Comparar publicaciones">
      <style>
        {`
          @keyframes comparador-overlay-in {
            from {
              opacity: 0;
            }

            to {
              opacity: 1;
            }
          }

          @keyframes comparador-modal-in {
            from {
              opacity: 0;
              transform: translateY(16px) scale(0.98);
            }

            to {
              opacity: 1;
              transform: translateY(0) scale(1);
            }
          }
        `}
      </style>
      <section style={styles.modal}>
        <header style={styles.header}>
          <div>
            <p style={styles.eyebrow}>Comparación</p>
            <h2 style={styles.title}>Publicaciones seleccionadas</h2>
            <p style={styles.subtitle}>Compara precio, ubicacion, servicios y reputacion antes de abrir el detalle.</p>
          </div>
          <button type="button" onClick={onClose} style={styles.iconButton} aria-label="Cerrar comparacion" title="Cerrar">
            <X size={18} strokeWidth={2.2} />
          </button>
        </header>

        {loading ? (
          <p style={styles.message}>Cargando detalles...</p>
        ) : error ? (
          <p style={{ ...styles.message, color: '#b91c1c' }}>{error}</p>
        ) : (
          <div style={styles.tableWrap}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.rowHeader}>
                    <span style={styles.rowHeaderContent}>
                      <Home size={16} strokeWidth={2.2} />
                      Publicacion
                    </span>
                  </th>
                  {detalles.map((publicacion) => (
                    <th
                      key={getPublicacionId(publicacion)}
                      style={{
                        ...styles.columnHeader,
                        width: comparisonColumnWidth,
                      }}
                    >
                      <div style={styles.publicationHeaderCard}>
                        <img
                          src={getPrimaryImage(publicacion)}
                          alt={publicacion.titulo || 'Publicacion'}
                          style={styles.publicationImage}
                        />
                        <span style={styles.publicationTitle}>{publicacion.titulo || 'Sin titulo'}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => navigate(`/publicacion/${publicacion.publicId}`)}
                        style={styles.detailButton}
                      >
                        <Eye size={14} strokeWidth={2.3} /> Ver detalle
                      </button>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.label}>
                    <th style={styles.rowHeader}>
                      <span style={styles.rowHeaderContent}>
                        <row.Icon size={16} strokeWidth={2.2} />
                        {row.label}
                      </span>
                    </th>
                    {detalles.map((publicacion) => (
                      <td
                        key={`${row.label}-${getPublicacionId(publicacion)}`}
                        style={{
                          ...styles.cell,
                          width: comparisonColumnWidth,
                          ...(row.highlight ? styles.highlightCell : {}),
                        }}
                      >
                        {row.render(publicacion)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

const styles = {
  overlay: {
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.58)',
    display: 'flex',
    inset: 0,
    justifyContent: 'center',
    padding: '24px',
    position: 'fixed',
    zIndex: 1000,
    animation: 'comparador-overlay-in 160ms ease-out both',
  },
  modal: {
    backgroundColor: '#ffffff',
    border: '1px solid rgba(226, 232, 240, 0.95)',
    borderRadius: '20px',
    boxShadow: '0 28px 80px rgba(15, 23, 42, 0.32)',
    maxHeight: '90vh',
    maxWidth: '1060px',
    overflow: 'hidden',
    width: '100%',
    animation: 'comparador-modal-in 220ms cubic-bezier(0.16, 1, 0.3, 1) both',
    transformOrigin: 'center top',
  },
  header: {
    alignItems: 'flex-start',
    background: 'linear-gradient(135deg, #f8fafc 0%, #ecfdf5 100%)',
    borderBottom: '1px solid #e2e8f0',
    display: 'flex',
    gap: '18px',
    justifyContent: 'space-between',
    padding: '22px 24px',
  },
  eyebrow: {
    color: accent,
    fontSize: '12px',
    fontWeight: 700,
    margin: '0 0 4px',
    textTransform: 'uppercase',
  },
  title: {
    color: '#0f172a',
    fontSize: '24px',
    lineHeight: 1.15,
    margin: 0,
  },
  subtitle: {
    color: '#64748b',
    fontSize: '14px',
    lineHeight: 1.5,
    margin: '8px 0 0',
    maxWidth: '58ch',
  },
  iconButton: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    border: '1px solid #cbd5e1',
    borderRadius: '10px',
    color: '#334155',
    cursor: 'pointer',
    display: 'inline-flex',
    height: '36px',
    justifyContent: 'center',
    width: '36px',
  },
  message: {
    color: '#475569',
    fontSize: '14px',
    margin: 0,
    padding: '22px',
  },
  tableWrap: {
    backgroundColor: '#ffffff',
    maxHeight: '72vh',
    overflow: 'auto',
  },
  table: {
    borderCollapse: 'separate',
    borderSpacing: 0,
    minWidth: '760px',
    tableLayout: 'fixed',
    width: '100%',
  },
  rowHeader: {
    backgroundColor: '#f8fafc',
    borderBottom: '1px solid #e2e8f0',
    color: '#334155',
    fontSize: '13px',
    fontWeight: 700,
    padding: '16px 18px',
    position: 'sticky',
    left: 0,
    zIndex: 2,
    textAlign: 'left',
    verticalAlign: 'middle',
    width: '190px',
  },
  rowHeaderContent: {
    alignItems: 'center',
    color: '#0f766e',
    display: 'inline-flex',
    gap: '9px',
    whiteSpace: 'nowrap',
  },
  columnHeader: {
    backgroundColor: '#ffffff',
    borderBottom: '1px solid #e2e8f0',
    color: '#0f172a',
    fontSize: '14px',
    minWidth: '230px',
    padding: '16px',
    textAlign: 'left',
    verticalAlign: 'top',
  },
  publicationHeaderCard: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    minHeight: '170px',
  },
  publicationImage: {
    aspectRatio: '16 / 9',
    backgroundColor: '#f1f5f9',
    border: '1px solid #e2e8f0',
    borderRadius: '12px',
    display: 'block',
    objectFit: 'cover',
    width: '100%',
  },
  publicationTitle: {
    display: 'block',
    color: '#0f172a',
    fontSize: '15px',
    fontWeight: 700,
    lineHeight: 1.25,
  },
  detailButton: {
    alignItems: 'center',
    backgroundColor: accent,
    border: 'none',
    borderRadius: '10px',
    color: '#ffffff',
    cursor: 'pointer',
    display: 'inline-flex',
    fontSize: '12px',
    fontWeight: 700,
    gap: '6px',
    justifyContent: 'center',
    marginTop: '12px',
    padding: '8px 10px',
  },
  cell: {
    borderBottom: '1px solid #e2e8f0',
    color: '#475569',
    fontSize: '14px',
    lineHeight: 1.45,
    padding: '16px',
    verticalAlign: 'middle',
  },
  highlightCell: {
    backgroundColor: '#f0fdfa',
  },
  priceValue: {
    color: '#0f766e',
    fontSize: '17px',
    fontWeight: 800,
  },
  chipList: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
  },
  serviceChip: {
    backgroundColor: '#f1f5f9',
    border: '1px solid #e2e8f0',
    borderRadius: '999px',
    color: '#334155',
    display: 'inline-flex',
    fontSize: '12px',
    fontWeight: 700,
    padding: '5px 9px',
  },
};
