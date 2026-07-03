import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, FlagTriangleRight, Clock3, BadgeCheck, TriangleAlert } from 'lucide-react';
import Swal from 'sweetalert2';
import { obtenerMisReportes } from '@services/reportes.service.js';

const accent = '#0f766e';

const formatDate = (value) => {
  if (!value) return 'Fecha no disponible';
  return new Date(value).toLocaleDateString('es-CL', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

export default function MisReportes() {
  const navigate = useNavigate();
  const [reportes, setReportes] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    cargarReportes();
  }, []);

  const cargarReportes = async () => {
    setCargando(true);
    const [data, error] = await obtenerMisReportes();
    setCargando(false);

    if (error) {
      Swal.fire({
        icon: 'error',
        title: 'No se pudieron cargar tus reportes',
        text: error,
        confirmButtonColor: accent,
      });
      return;
    }

    setReportes(Array.isArray(data) ? data : []);
  };

  const resumen = useMemo(() => ({
    total: reportes.length,
    pendientes: reportes.filter((reporte) => reporte.estado === 'pendiente').length,
    revisados: reportes.filter((reporte) => reporte.estado === 'revisado').length,
  }), [reportes]);

  return (
    <div style={styles.page}>
      <Link to="/profile" style={styles.backLink}>
        <ArrowLeft size={16} strokeWidth={2.4} />
        Volver a mi perfil
      </Link>

      <section style={styles.hero}>
        <div style={styles.heroContent}>
          <div style={styles.heroIcon}>
            <FlagTriangleRight size={28} strokeWidth={2.1} />
          </div>
          <div>
            <h1 style={styles.heroTitle}>Mis reportes</h1>
            <p style={styles.heroSubtitle}>
              Revisa las denuncias que has enviado y su estado de seguimiento.
            </p>
          </div>
        </div>
      </section>

      <section style={styles.summaryGrid}>
        <article style={styles.summaryCard}>
          <p style={styles.summaryLabel}>Total reportes</p>
          <p style={styles.summaryValue}>{resumen.total}</p>
        </article>
        <article style={styles.summaryCard}>
          <p style={styles.summaryLabel}>Pendientes</p>
          <p style={styles.summaryValue}>{resumen.pendientes}</p>
        </article>
        <article style={styles.summaryCard}>
          <p style={styles.summaryLabel}>Revisados</p>
          <p style={styles.summaryValue}>{resumen.revisados}</p>
        </article>
      </section>

      <section style={styles.card}>
        <header style={styles.cardHeader}>
          <div>
            <h2 style={styles.cardTitle}>Trazabilidad de tus reportes</h2>
            <p style={styles.cardSubtitle}>
              Aquí verás cada reporte, la publicación asociada y si ya fue revisado por el equipo.
            </p>
          </div>
          <button type="button" onClick={cargarReportes} style={styles.refreshButton}>
            Actualizar
          </button>
        </header>

        {cargando ? (
          <p style={styles.emptyState}>Cargando tus reportes...</p>
        ) : reportes.length === 0 ? (
          <div style={styles.emptyBox}>
            <TriangleAlert size={30} strokeWidth={1.9} />
            <h3 style={styles.emptyTitle}>Todavía no has enviado reportes</h3>
            <p style={styles.emptyText}>
              Cuando reportes una publicación desde su detalle, aparecerá aquí con su estado de seguimiento.
            </p>
          </div>
        ) : (
          <div style={styles.list}>
            {reportes.map((reporte) => {
              const estadoMeta = reporte.estado === 'revisado'
                ? { label: 'Revisado', color: '#15803d', backgroundColor: '#dcfce7', Icon: BadgeCheck }
                : { label: 'Pendiente', color: '#b45309', backgroundColor: '#fef3c7', Icon: Clock3 };

              const EstadoIcon = estadoMeta.Icon;

              return (
                <article key={reporte.id} style={styles.reportCard}>
                  <div style={styles.reportHeader}>
                    <div>
                      <p style={styles.reportTitle}>{reporte.publicacion?.titulo || 'Publicación eliminada o no disponible'}</p>
                      <p style={styles.reportMeta}>
                        Publicado: {formatDate(reporte.publicacion?.createdAt)} · Reportado: {formatDate(reporte.createdAt)}
                      </p>
                    </div>

                    <span
                      style={{
                        ...styles.statusBadge,
                        color: estadoMeta.color,
                        backgroundColor: estadoMeta.backgroundColor,
                      }}
                    >
                      <EstadoIcon size={14} strokeWidth={2.2} />
                      {estadoMeta.label}
                    </span>
                  </div>

                  <p style={styles.reportReason}>
                    <strong>Motivo:</strong> {reporte.motivo}
                  </p>

                  <div style={styles.reportFooter}>
                    <div style={styles.reportChipRow}>
                      <span style={styles.chip}>Acción: {reporte.accion || 'sin acción'}</span>
                      <span style={styles.chip}>ID reporte #{reporte.id}</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => navigate(`/publicacion/${reporte.publicacion?.id}`)}
                      style={styles.linkButton}
                    >
                      Ver publicación
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
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
  backLink: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    width: 'fit-content',
    textDecoration: 'none',
    color: '#0f766e',
    fontWeight: 600,
    padding: '10px 14px',
    borderRadius: '999px',
    backgroundColor: '#ffffff',
    border: '1px solid rgba(15, 118, 110, 0.25)',
    boxShadow: '0 2px 8px rgba(15, 23, 42, 0.05)',
  },
  hero: {
    borderRadius: '24px',
    padding: '24px 28px',
    background: 'linear-gradient(135deg, #0f766e 0%, #115e59 44%, #1f2937 100%)',
    color: '#ffffff',
    boxShadow: '0 20px 40px rgba(11, 34, 45, 0.18)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '18px',
    flexWrap: 'wrap',
  },
  heroContent: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  heroIcon: {
    width: '54px',
    height: '54px',
    borderRadius: '16px',
    backgroundColor: 'rgba(255,255,255,0.14)',
    border: '3px solid rgba(255,255,255,0.4)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  heroTitle: {
    margin: '0 0 6px',
    fontSize: 'clamp(22px, 3vw, 30px)',
    lineHeight: 1.1,
  },
  heroSubtitle: {
    margin: 0,
    fontSize: '14px',
    color: 'rgba(255,255,255,0.82)',
  },
  button: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '12px 18px',
    borderRadius: '12px',
    backgroundColor: 'rgba(255,255,255,0.15)',
    color: '#ffffff',
    fontWeight: 700,
    fontSize: '14px',
    border: '1px solid rgba(255,255,255,0.28)',
    cursor: 'pointer',
  },
  summaryGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: '14px',
  },
  summaryCard: {
    borderRadius: '20px',
    padding: '18px',
    backgroundColor: '#ffffff',
    border: '1px solid rgba(15, 23, 42, 0.06)',
    boxShadow: '0 12px 30px rgba(15, 23, 42, 0.07)',
  },
  summaryLabel: {
    margin: '0 0 8px',
    fontSize: '12px',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    color: '#64748b',
  },
  summaryValue: {
    margin: 0,
    fontSize: '30px',
    fontWeight: 800,
    color: '#0f172a',
  },
  card: {
    borderRadius: '22px',
    padding: '28px',
    backgroundColor: '#ffffff',
    border: '1px solid rgba(15, 23, 42, 0.06)',
    boxShadow: '0 12px 30px rgba(15, 23, 42, 0.07)',
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: '16px',
    marginBottom: '20px',
    flexWrap: 'wrap',
  },
  eyebrow: {
    margin: '0 0 6px',
    fontSize: '12px',
    fontWeight: 700,
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
  refreshButton: {
    border: '1px solid #dbe4ee',
    backgroundColor: '#f8fafc',
    color: '#334155',
    borderRadius: '12px',
    padding: '10px 16px',
    fontWeight: 700,
    cursor: 'pointer',
  },
  emptyState: {
    margin: 0,
    color: '#64748b',
    fontSize: '14px',
  },
  emptyBox: {
    borderRadius: '18px',
    padding: '28px',
    backgroundColor: '#f8fafc',
    border: '1px dashed #cbd5e1',
    color: '#334155',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    gap: '10px',
  },
  emptyTitle: {
    margin: 0,
    fontSize: '18px',
    color: '#0f172a',
  },
  emptyText: {
    margin: 0,
    maxWidth: '520px',
    fontSize: '14px',
    lineHeight: 1.6,
    color: '#64748b',
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
  },
  reportCard: {
    borderRadius: '18px',
    padding: '18px',
    backgroundColor: '#f8fafc',
    border: '1px solid #e2e8f0',
  },
  reportHeader: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: '12px',
    flexWrap: 'wrap',
  },
  reportTitle: {
    margin: '0 0 4px',
    fontSize: '16px',
    fontWeight: 800,
    color: '#0f172a',
  },
  reportMeta: {
    margin: 0,
    fontSize: '13px',
    color: '#64748b',
  },
  statusBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '7px 10px',
    borderRadius: '999px',
    fontSize: '12px',
    fontWeight: 800,
    flexShrink: 0,
  },
  reportReason: {
    margin: '14px 0 0',
    fontSize: '14px',
    color: '#334155',
    lineHeight: 1.6,
  },
  reportFooter: {
    marginTop: '14px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '12px',
    flexWrap: 'wrap',
  },
  reportChipRow: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap',
  },
  chip: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '6px 10px',
    borderRadius: '999px',
    backgroundColor: '#ffffff',
    border: '1px solid #dbe4ee',
    color: '#475569',
    fontSize: '12px',
    fontWeight: 700,
  },
  linkButton: {
    border: 'none',
    background: 'none',
    color: accent,
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 700,
    padding: 0,
  },
};