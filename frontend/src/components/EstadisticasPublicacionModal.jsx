import { useEffect, useState } from 'react';
import { BarChart3, Eye, Heart, MessageCircle, X, ArrowLeft, ExternalLink } from 'lucide-react';
import Swal from 'sweetalert2';
import { getEstadisticasPublicacion } from '@services/publicacion.service.js';

const accent = '#0f766e';

export default function EstadisticasPublicacionModal({ publicacion, open, onClose, onGoToDetalle }) {
  const [estadisticas, setEstadisticas] = useState(null);
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    if (!open || !publicacion?.publicId) return undefined;

    const cargar = async () => {
      setCargando(true);
      const [data, error] = await getEstadisticasPublicacion(publicacion.publicId);
      setCargando(false);

      if (error) {
        Swal.fire({
          icon: 'error',
          title: 'No se pudieron cargar las estadísticas',
          text: error,
          confirmButtonColor: accent,
        });
        onClose();
        return;
      }

      setEstadisticas(data);
    };

    cargar();
    return undefined;
  }, [open, publicacion, onClose]);

  useEffect(() => {
    if (!open) setEstadisticas(null);
  }, [open]);

  if (!open || !publicacion) return null;

  const metrics = [
    {
      label: 'Visualizaciones',
      value: estadisticas?.contador_views ?? 0,
      icon: Eye,
      description: 'Veces que la publicación fue vista',
    },
    {
      label: 'Favoritos',
      value: estadisticas?.contador_favoritos ?? 0,
      icon: Heart,
      description: 'Veces que fue guardada por estudiantes',
    },
    {
      label: 'Conversaciones',
      value: estadisticas?.contador_conversaciones ?? 0,
      icon: MessageCircle,
      description: 'Chats iniciados desde esta publicación',
    },
  ];

  return (
    <div style={styles.backdrop} onClick={onClose}>
      <div style={styles.modal} onClick={(event) => event.stopPropagation()}>
        <div style={styles.header}>
          <div style={styles.titleWrap}>
            <div style={styles.iconWrap}>
              <BarChart3 size={22} strokeWidth={2.2} />
            </div>
            <div>
              <p style={styles.eyebrow}>Estadísticas básicas</p>
              <h2 style={styles.title}>{publicacion.titulo || 'Publicación'}</h2>
            </div>
          </div>

          <button type="button" onClick={onClose} style={styles.closeButton} aria-label="Cerrar">
            <X size={18} />
          </button>
        </div>

        <p style={styles.description}>
          Estas métricas solo corresponden a tus publicaciones y ayudan a medir el interés generado por el anuncio.
        </p>

        {cargando ? (
          <div style={styles.loadingBox}>Cargando estadísticas...</div>
        ) : (
          <div style={styles.metricsGrid}>
            {metrics.map(({ label, value, icon: Icon, description }) => (
              <article key={label} style={styles.metricCard}>
                <div style={styles.metricHeader}>
                  <div style={styles.metricIconWrap}>
                    <Icon size={20} strokeWidth={2.2} />
                  </div>
                  <span style={styles.metricLabel}>{label}</span>
                </div>
                <p style={styles.metricValue}>{Number(value).toLocaleString('es-CL')}</p>
                <p style={styles.metricDescription}>{description}</p>
              </article>
            ))}
          </div>
        )}

        <div style={styles.infoStrip}>
          <span style={styles.infoItem}>Estado: {estadisticas?.estado || publicacion.estado || 'activa'}</span>
        </div>

        <div style={styles.actions}>
          <button type="button" onClick={onClose} style={styles.secondaryButton}>
            <ArrowLeft size={16} strokeWidth={2.2} />
            Volver a mis publicaciones
          </button>
          <button type="button" onClick={() => onGoToDetalle?.(publicacion)} style={styles.primaryButton}>
            <ExternalLink size={16} strokeWidth={2.2} />
            Ir al detalle
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  backdrop: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.62)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
    zIndex: 90,
  },
  modal: {
    width: 'min(100%, 820px)',
    borderRadius: '24px',
    backgroundColor: '#ffffff',
    boxShadow: '0 28px 70px rgba(15, 23, 42, 0.28)',
    padding: '24px',
  },
  header: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: '16px',
  },
  titleWrap: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
  },
  iconWrap: {
    width: '52px',
    height: '52px',
    borderRadius: '16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#dff6f4',
    color: accent,
    flexShrink: 0,
  },
  eyebrow: {
    margin: '0 0 4px',
    fontSize: '12px',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    color: '#64748b',
  },
  title: {
    margin: 0,
    fontSize: '22px',
    color: '#0f172a',
    lineHeight: 1.2,
  },
  closeButton: {
    width: '38px',
    height: '38px',
    borderRadius: '12px',
    border: 'none',
    backgroundColor: '#f8fafc',
    color: '#334155',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    flexShrink: 0,
  },
  description: {
    margin: '16px 0 0',
    fontSize: '14px',
    lineHeight: 1.6,
    color: '#475569',
  },
  loadingBox: {
    marginTop: '20px',
    padding: '18px',
    borderRadius: '16px',
    backgroundColor: '#f8fafc',
    color: '#334155',
    fontWeight: 700,
  },
  metricsGrid: {
    marginTop: '20px',
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '14px',
  },
  metricCard: {
    borderRadius: '18px',
    padding: '18px',
    backgroundColor: '#f8fafc',
    border: '1px solid #e2e8f0',
  },
  metricHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '12px',
  },
  metricIconWrap: {
    width: '38px',
    height: '38px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    color: accent,
    border: '1px solid #dbe4ee',
    flexShrink: 0,
  },
  metricLabel: {
    fontSize: '13px',
    fontWeight: 800,
    color: '#334155',
  },
  metricValue: {
    margin: '0 0 6px',
    fontSize: '34px',
    fontWeight: 800,
    color: '#0f172a',
    lineHeight: 1,
  },
  metricDescription: {
    margin: 0,
    fontSize: '13px',
    lineHeight: 1.5,
    color: '#64748b',
  },
  infoStrip: {
    marginTop: '16px',
    display: 'flex',
    gap: '10px',
    flexWrap: 'wrap',
  },
  infoItem: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '8px 12px',
    borderRadius: '999px',
    backgroundColor: '#eefaf8',
    color: '#0f766e',
    fontSize: '12px',
    fontWeight: 700,
  },
  actions: {
    marginTop: '20px',
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    flexWrap: 'wrap',
  },
  secondaryButton: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    border: '1px solid #dbe4ee',
    backgroundColor: '#ffffff',
    color: '#334155',
    borderRadius: '12px',
    padding: '12px 16px',
    fontWeight: 700,
    cursor: 'pointer',
  },
  primaryButton: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    border: 'none',
    backgroundColor: accent,
    color: '#ffffff',
    borderRadius: '12px',
    padding: '12px 16px',
    fontWeight: 700,
    cursor: 'pointer',
  },
};