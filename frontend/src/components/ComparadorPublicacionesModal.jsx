import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';
import { getPublicacionPorId } from '@services/publicacion.service.js';

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
  if (!Array.isArray(servicios) || servicios.length === 0) return 'No especificados';
  return servicios.join(', ');
}

function formatRating(arrendador) {
  const rating = Number(arrendador?.avgRating || 0);
  const count = Number(arrendador?.reviewsCount || 0);

  if (!count) return 'Sin calificaciones';

  return `${rating.toFixed(1)} / 5 (${count})`;
}

export default function ComparadorPublicacionesModal({ publicaciones, onClose }) {
  const navigate = useNavigate();
  const [detalles, setDetalles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;

    async function cargarDetalles() {
      setLoading(true);
      setError('');

      const responses = await Promise.all(
        publicaciones.map((publicacion) => getPublicacionPorId(getPublicacionId(publicacion))),
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
    { label: 'Precio mensual', render: (publicacion) => formatPrice(publicacion.precioMensual) },
    { label: 'Tipo de inmueble', render: (publicacion) => publicacion.tipoInmueble || 'No especificado' },
    { label: 'Distancia al campus', render: () => 'No disponible' },
    { label: 'Servicios incluidos', render: (publicacion) => formatServices(publicacion.serviciosIncluidos) },
    { label: 'Calificacion arrendador', render: (publicacion) => formatRating(publicacion.arrendador) },
  ];

  return (
    <div style={styles.overlay} role="dialog" aria-modal="true" aria-label="Comparar publicaciones">
      <section style={styles.modal}>
        <header style={styles.header}>
          <div>
            <p style={styles.eyebrow}>Comparación</p>
            <h2 style={styles.title}>Publicaciones seleccionadas</h2>
          </div>
          <button type="button" onClick={onClose} style={styles.iconButton} aria-label="Cerrar comparacion">
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
                  <th style={styles.rowHeader}>Atributo</th>
                  {detalles.map((publicacion) => (
                    <th key={getPublicacionId(publicacion)} style={styles.columnHeader}>
                      <span style={styles.publicationTitle}>{publicacion.titulo || 'Sin titulo'}</span>
                      <button
                        type="button"
                        onClick={() => navigate(`/publicacion/${publicacion.publicId}`)}
                        style={styles.detailButton}
                      >
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
                    {detalles.map((publicacion) => (
                      <td key={`${row.label}-${getPublicacionId(publicacion)}`} style={styles.cell}>
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
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    display: 'flex',
    inset: 0,
    justifyContent: 'center',
    padding: '24px',
    position: 'fixed',
    zIndex: 1000,
  },
  modal: {
    backgroundColor: '#ffffff',
    borderRadius: '18px',
    boxShadow: '0 24px 60px rgba(15, 23, 42, 0.28)',
    maxHeight: '88vh',
    maxWidth: '980px',
    overflow: 'hidden',
    width: '100%',
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
  message: {
    color: '#475569',
    fontSize: '14px',
    margin: 0,
    padding: '22px',
  },
  tableWrap: {
    maxHeight: '70vh',
    overflow: 'auto',
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
