import { useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';

const accent = '#0f766e';

function getPublicacionId(publicacion) {
  return publicacion?.id_publicacion || publicacion?.id || publicacion?._id;
}

function formatPrice(value) {
  return new Intl.NumberFormat('es-CL', {
    currency: 'CLP',
    style: 'currency',
  }).format(Number(value || 0));
}

function formatServices(servicios) {
  if (!Array.isArray(servicios) || servicios.length === 0) {
    return 'No especificados';
  }

  return servicios.join(', ');
}

function formatRating(arrendador) {
  const rating = Number(arrendador?.avgRating || 0);
  const count = Number(arrendador?.reviewsCount || 0);

  if (!count) return 'Sin calificaciones';

  return `${rating.toFixed(1)} / 5 (${count})`;
}

export default function ComparadorPublicaciones({ publicaciones, onClose }) {
  const navigate = useNavigate();

  if (!Array.isArray(publicaciones) || publicaciones.length === 0) {
    return null;
  }

  const rows = [
    {
      label: 'Precio mensual',
      render: (publicacion) => formatPrice(publicacion.precioMensual),
    },
    {
      label: 'Tipo de inmueble',
      render: (publicacion) => publicacion.tipoInmueble || 'No especificado',
    },
    {
      label: 'Distancia al campus',
      render: () => 'No disponible',
    },
    {
      label: 'Servicios incluidos',
      render: (publicacion) => formatServices(publicacion.serviciosIncluidos),
    },
    {
      label: 'Calificacion arrendador',
      render: (publicacion) => formatRating(publicacion.arrendador),
    },
  ];

  const goToDetail = (publicacion) => {
    const id = getPublicacionId(publicacion);
    if (id) navigate(`/publicacion/${id}`);
  };

  return (
    <section style={styles.panel} aria-label="Comparacion de publicaciones">
      <header style={styles.header}>
        <div>
          <p style={styles.eyebrow}>Comparacion</p>
          <h2 style={styles.title}>Publicaciones seleccionadas</h2>
        </div>
        <button type="button" onClick={onClose} style={styles.iconButton} aria-label="Cerrar comparacion">
          <X size={18} strokeWidth={2.2} />
        </button>
      </header>

      <div style={styles.tableWrap}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.rowHeader}>Atributo</th>
              {publicaciones.map((publicacion) => (
                <th key={getPublicacionId(publicacion)} style={styles.columnHeader}>
                  <span style={styles.publicationTitle}>{publicacion.titulo || 'Sin titulo'}</span>
                  <button type="button" onClick={() => goToDetail(publicacion)} style={styles.detailButton}>
                    Ver detalle
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.label}>
                <th style={styles.rowHeader}>{row.label}</th>
                {publicaciones.map((publicacion) => (
                  <td key={`${row.label}-${getPublicacionId(publicacion)}`} style={styles.cell}>
                    {row.render(publicacion)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

const styles = {
  panel: {
    backgroundColor: '#ffffff',
    border: '1px solid #dbe7e5',
    borderRadius: '18px',
    boxShadow: '0 18px 36px rgba(15, 23, 42, 0.12)',
    marginBottom: '22px',
    overflow: 'hidden',
  },
  header: {
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderBottom: '1px solid #e2e8f0',
    display: 'flex',
    justifyContent: 'space-between',
    padding: '18px 20px',
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
    fontSize: '20px',
    margin: 0,
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
  tableWrap: {
    overflowX: 'auto',
  },
  table: {
    borderCollapse: 'collapse',
    minWidth: '760px',
    width: '100%',
  },
  rowHeader: {
    backgroundColor: '#f8fafc',
    borderBottom: '1px solid #e2e8f0',
    color: '#334155',
    fontSize: '13px',
    fontWeight: 700,
    padding: '14px 16px',
    textAlign: 'left',
    verticalAlign: 'top',
    width: '190px',
  },
  columnHeader: {
    borderBottom: '1px solid #e2e8f0',
    color: '#0f172a',
    fontSize: '14px',
    padding: '14px 16px',
    textAlign: 'left',
    verticalAlign: 'top',
  },
  publicationTitle: {
    display: 'block',
    fontWeight: 700,
    marginBottom: '8px',
  },
  detailButton: {
    backgroundColor: accent,
    border: 'none',
    borderRadius: '10px',
    color: '#ffffff',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: 700,
    padding: '8px 10px',
  },
  cell: {
    borderBottom: '1px solid #e2e8f0',
    color: '#475569',
    fontSize: '14px',
    lineHeight: 1.45,
    padding: '14px 16px',
    verticalAlign: 'top',
  },
};
