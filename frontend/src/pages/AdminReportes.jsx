import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BadgeCheck, Eye, FlagTriangleRight, RotateCcw, ShieldCheck, ShieldOff } from 'lucide-react';
import Swal from 'sweetalert2';
import { useAuth } from '@context/AuthContext';
import { obtenerPublicacionesReportadas, resolverPublicacionReportada } from '@services/reportes.service.js';

const accent = '#008080';

const motivoLabels = {
  informacion_incorrecta: 'Información incorrecta',
  contenido_engañoso: 'Contenido engañoso',
  fraude_sospechoso: 'Sospecha de fraude',
  spam: 'Spam o contenido repetido',
  otro: 'Otro motivo',
};

const accionLabels = {
  mantener: 'Mantener activa',
  desactivar: 'Desactivar',
  reactivar: 'Reactivar',
  mantenida: 'Mantener activa',
  desactivada: 'Desactivada',
  reactivada: 'Reactivada',
  sin_accion: 'Sin acción',
};

const estadoLabels = {
  pendiente: 'Pendiente',
  revisado: 'Revisado',
};

const formatLabel = (value, mapping) => {
  if (!value) return 'Sin dato';
  return mapping[value] || value
    .toString()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

const formatDate = (value) => {
  if (!value) return 'Sin fecha';
  return new Intl.DateTimeFormat('es-CL', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
};

const AdminReportes = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [reportes, setReportes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const cargarReportes = async () => {
    setLoading(true);
    const [data, err] = await obtenerPublicacionesReportadas();
    setReportes(Array.isArray(data) ? data : []);
    setError(err || '');
    setLoading(false);
  };

  useEffect(() => {
    cargarReportes();
  }, []);

  const resumen = useMemo(() => {
    const totalReportes = reportes.reduce((sum, item) => sum + Number(item.cantidadReportes || 0), 0);
    const inactivas = reportes.filter((item) => item.publicacion?.estado === 'inactiva').length;
    return [
      { label: 'Publicaciones reportadas', value: reportes.length, icon: FlagTriangleRight },
      { label: 'Reportes pendientes', value: totalReportes, icon: Eye },
      { label: 'Inactivas', value: inactivas, icon: ShieldOff },
    ];
  }, [reportes]);

  const resolver = async (item, accion) => {
    const textos = {
      mantener: 'mantener activa',
      desactivar: 'desactivar',
      reactivar: 'reactivar',
    };

    const { value: observacion, isConfirmed } = await Swal.fire({
      title: `¿Quieres ${textos[accion]} esta publicación?`,
      input: 'textarea',
      inputLabel: 'Observación',
      inputPlaceholder: 'Motivo de la decisión...',
      showCancelButton: true,
      confirmButtonText: 'Confirmar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: accent,
      cancelButtonColor: '#64748b',
    });

    if (!isConfirmed) return;

    const [_, err] = await resolverPublicacionReportada(item.publicacion.publicId, { accion, observacion });
    if (err) {
      Swal.fire({ icon: 'error', title: 'No se pudo resolver', text: err, confirmButtonColor: accent });
      return;
    }

    Swal.fire({ icon: 'success', title: 'Reporte resuelto', confirmButtonColor: accent });
    cargarReportes();
  };

  return (
    <div style={styles.page}>
      <section style={styles.hero}>
        <div>
          <h1 style={styles.title}>Publicaciones Reportadas</h1>
          <p style={styles.subtitle}>Revisa publicaciones con reportes pendientes y registra una acción administrativa.</p>
        </div>
        <div style={styles.heroBadge}>
          <BadgeCheck size={18} />
          <span>{user?.rol || 'admin'}</span>
        </div>
      </section>

      <section style={styles.gridStats}>
        {resumen.map((stat) => {
          const Icon = stat.icon;
          return (
            <article key={stat.label} style={styles.statCard}>
              <div style={styles.statIconWrap}><Icon size={20} /></div>
              <div>
                <p style={styles.statLabel}>{stat.label}</p>
                <h2 style={styles.statValue}>{stat.value}</h2>
              </div>
            </article>
          );
        })}
      </section>

      <section style={styles.contentCard}>
        {loading && <p style={styles.muted}>Cargando publicaciones reportadas...</p>}
        {!loading && error && <p style={styles.error}>{error}</p>}
        {!loading && !error && reportes.length === 0 && (
          <p style={styles.muted}>No hay publicaciones reportadas pendientes.</p>
        )}

        <div style={styles.list}>
          {reportes.map((item) => {
            const publicacion = item.publicacion || {};
            const reportesDetalle = Array.isArray(item.reportes) ? item.reportes : [];
            return (
              <article key={publicacion.publicId} style={styles.reportCard}>
                <div style={styles.reportHeader}>
                  <div>
                    <div style={styles.badgeRow}>
                      <span style={styles.reportCountBadge}>{item.cantidadReportes}</span>
                      <p style={styles.eyebrow}>{publicacion.tipoInmueble || 'Publicación'}</p>
                    </div>
                    <h3 style={styles.cardTitle}>{publicacion.titulo || 'Sin título'}</h3>
                    <p style={styles.cardSubtitle}>{publicacion.ubicacion || 'Sin ubicación'}</p>
                    <p style={styles.cardSubtitle}>
                      Arrendador: {publicacion.arrendador?.nombreCompleto || publicacion.arrendador?.email || 'Sin datos'}
                    </p>
                  </div>
                  <span style={{
                    ...styles.statusBadge,
                    backgroundColor: publicacion.estado === 'activa' ? '#dcfce7' : '#fee2e2',
                    color: publicacion.estado === 'activa' ? '#15803d' : '#dc2626',
                  }}>
                    {publicacion.estado || 'sin estado'}
                  </span>
                </div>

                <div style={styles.reportMeta}>
                  <strong>{item.cantidadReportes} reporte(s)</strong>
                  <span>Último: {formatDate(reportesDetalle[0]?.createdAt)}</span>
                </div>

                <div style={styles.reportesDetalleList}>
                  {reportesDetalle.map((reporte, index) => (
                    <article key={`${publicacion.publicId}-${reporte.id || index}`} style={styles.reporteDetalleCard}>
                      <div style={styles.reporteDetalleHeader}>
                        <strong>Reporte {index + 1}</strong>
                        <span style={styles.reporteDetalleDate}>{formatDate(reporte.createdAt)}</span>
                      </div>
                      <p style={styles.reporteDetalleText}>
                        <strong>Motivo:</strong> {formatLabel(reporte.motivo, motivoLabels)}
                      </p>
                      <p style={styles.reporteDetalleText}>
                        <strong>Acción:</strong> {formatLabel(reporte.accion, accionLabels)}
                      </p>
                      <p style={styles.reporteDetalleText}>
                        <strong>Estado:</strong> {formatLabel(reporte.estado, estadoLabels)}
                      </p>
                      <p style={styles.reporteDetalleText}>
                        <strong>Reportado por:</strong> {reporte.reporter?.nombreCompleto || reporte.reporter?.email || 'Sin dato'}
                      </p>
                    </article>
                  ))}
                </div>

                <div style={styles.actions}>
                  <button
                    type="button"
                    onClick={() => navigate(`/publicacion/${publicacion.publicId}`)}
                    style={styles.secondaryButton}
                  >
                    <Eye size={16} /> Ver publicación
                  </button>
                  <button type="button" onClick={() => resolver(item, 'mantener')} style={styles.actionButton}>
                    <ShieldCheck size={16} /> Mantener
                  </button>
                  <button type="button" onClick={() => resolver(item, 'desactivar')} style={{ ...styles.actionButton, ...styles.dangerButton }}>
                    <ShieldOff size={16} /> Desactivar
                  </button>
                  <button type="button" onClick={() => resolver(item, 'reactivar')} style={styles.secondaryButton}>
                    <RotateCcw size={16} /> Reactivar
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
};

const styles = {
  page: { display: 'flex', flexDirection: 'column', gap: '20px', padding: '4px 0 12px' },
  hero: {
    display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px',
    borderRadius: '24px', padding: '28px', color: '#fff',
    background: 'linear-gradient(135deg, #008080 0%, #0b6b7a 45%, #163d4f 100%)',
    boxShadow: '0 20px 40px rgba(11, 34, 45, 0.18)',
  },
  title: { margin: '0 0 10px', fontSize: 'clamp(28px, 4vw, 42px)', lineHeight: 1.05 },
  subtitle: { margin: 0, maxWidth: '62ch', fontSize: '15px', lineHeight: 1.6, color: 'rgba(255,255,255,0.88)' },
  heroBadge: { display: 'inline-flex', alignItems: 'center', gap: '8px', borderRadius: '999px', padding: '10px 14px', backgroundColor: 'rgba(255,255,255,0.12)' },
  gridStats: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' },
  statCard: { display: 'flex', gap: '14px', borderRadius: '20px', padding: '18px', backgroundColor: '#fff', boxShadow: '0 10px 26px rgba(15, 23, 42, 0.08)', border: '1px solid rgba(15, 23, 42, 0.06)' },
  statIconWrap: { width: '42px', height: '42px', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0f766e', backgroundColor: '#e6f4f1' },
  statLabel: { margin: '0 0 4px', fontSize: '13px', color: '#64748b' },
  statValue: { margin: 0, fontSize: '28px', lineHeight: 1.1, color: '#0f172a' },
  contentCard: { borderRadius: '22px', padding: '22px', backgroundColor: '#fff', border: '1px solid rgba(15, 23, 42, 0.06)', boxShadow: '0 12px 30px rgba(15, 23, 42, 0.07)' },
  list: { display: 'grid', gap: '14px' },
  reportCard: { border: '1px solid #e2e8f0', borderRadius: '18px', padding: '18px', backgroundColor: '#f8fafc' },
  reportHeader: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px' },
  badgeRow: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' },
  reportCountBadge: { minWidth: '32px', height: '32px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: '999px', backgroundColor: accent, color: '#fff', fontSize: '13px', fontWeight: 800 },
  eyebrow: { margin: '0 0 6px', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', color: accent },
  cardTitle: { margin: '0 0 6px', fontSize: '20px', color: '#0f172a' },
  cardSubtitle: { margin: '0 0 4px', fontSize: '14px', color: '#64748b' },
  statusBadge: { borderRadius: '999px', padding: '6px 10px', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', whiteSpace: 'nowrap' },
  reportMeta: { display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '12px', color: '#334155', fontSize: '13px' },
  reportesDetalleList: { display: 'grid', gap: '10px', marginTop: '12px' },
  reporteDetalleCard: { borderRadius: '14px', padding: '12px 14px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0' },
  reporteDetalleHeader: { display: 'flex', justifyContent: 'space-between', gap: '10px', alignItems: 'center', marginBottom: '8px' },
  reporteDetalleDate: { fontSize: '12px', color: '#64748b', fontWeight: 600 },
  reporteDetalleText: { margin: '0 0 6px', color: '#334155', fontSize: '13px', lineHeight: 1.5 },
  actions: { display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '14px' },
  actionButton: { display: 'inline-flex', alignItems: 'center', gap: '6px', border: 'none', borderRadius: '10px', padding: '10px 14px', backgroundColor: accent, color: '#fff', fontWeight: 700, cursor: 'pointer' },
  dangerButton: { backgroundColor: '#dc2626' },
  secondaryButton: { display: 'inline-flex', alignItems: 'center', gap: '6px', border: '1px solid #cbd5e1', borderRadius: '10px', padding: '10px 14px', backgroundColor: '#fff', color: '#0f172a', fontWeight: 700, cursor: 'pointer' },
  muted: { margin: 0, color: '#64748b' },
  error: { margin: 0, color: '#dc2626', fontWeight: 700 },
};

export default AdminReportes;
