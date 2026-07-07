import { useEffect, useMemo, useState } from 'react';
import { BadgeCheck, Eye, ShieldAlert, ShieldCheck, ShieldOff, RotateCcw } from 'lucide-react';
import Swal from 'sweetalert2';
import { useAuth } from '@context/AuthContext';
import { obtenerUsuariosReportados, resolverUsuarioReportado } from '@services/reportesUsuario.service.js';

const accent = '#008080';

const motivoLabels = {
  acoso_o_amenazas: 'Acoso o amenazas',
  lenguaje_inapropiado: 'Lenguaje inapropiado',
  intento_de_fraude: 'Intento de fraude o estafa',
  suplantacion_identidad: 'Suplantación de identidad',
  spam: 'Spam',
  otro: 'Otro',
};

const accionLabels = {
  mantener: 'Mantener cuenta',
  suspender: 'Suspender cuenta',
  reactivar: 'Reactivar cuenta',
  mantenida: 'Mantenida',
  suspendida: 'Suspendida',
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

const AdminReportesUsuarios = () => {
  const { user } = useAuth();
  const [reportes, setReportes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const cargarReportes = async () => {
    setLoading(true);
    const [data, err] = await obtenerUsuariosReportados();
    setReportes(Array.isArray(data) ? data : []);
    setError(err || '');
    setLoading(false);
  };

  useEffect(() => {
    cargarReportes();
  }, []);

  const resumen = useMemo(() => {
    const totalReportes = reportes.reduce((sum, item) => sum + Number(item.cantidadReportes || 0), 0);
    const suspendidas = reportes.filter((item) => item.reportado?.estadoCuenta === 'suspendido').length;
    return [
      { label: 'Usuarios reportados', value: reportes.length, icon: ShieldAlert },
      { label: 'Reportes pendientes', value: totalReportes, icon: Eye },
      { label: 'Cuentas suspendidas', value: suspendidas, icon: ShieldOff },
    ];
  }, [reportes]);

  const reportesActivos = useMemo(
    () => reportes.filter((item) => item.reportado?.estadoCuenta !== 'suspendido'),
    [reportes],
  );
  const reportesSuspendidos = useMemo(
    () => reportes.filter((item) => item.reportado?.estadoCuenta === 'suspendido'),
    [reportes],
  );

  const resolver = async (item, accion) => {
    const textos = {
      mantener: 'mantener activa',
      suspender: 'suspender',
      reactivar: 'reactivar',
    };

    const { value: observacion, isConfirmed } = await Swal.fire({
      title: `¿Quieres ${textos[accion]} esta cuenta?`,
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

    const [, err] = await resolverUsuarioReportado(item.reportado.id, { accion, observacion });
    if (err) {
      Swal.fire({ icon: 'error', title: 'No se pudo resolver', text: err, confirmButtonColor: accent });
      return;
    }

    Swal.fire({ icon: 'success', title: 'Reporte resuelto', confirmButtonColor: accent });
    cargarReportes();
  };

  const renderCard = (item, { suspendido }) => {
    const reportado = item.reportado || {};
    const reportesDetalle = Array.isArray(item.reportes) ? item.reportes : [];
    return (
      <article key={reportado.id} style={styles.reportCard}>
        <div style={styles.reportHeader}>
          <div>
            <div style={styles.badgeRow}>
              <span style={styles.reportCountBadge}>{item.cantidadReportes}</span>
              <p style={styles.eyebrow}>{reportado.rol || 'Usuario'}</p>
            </div>
            <h3 style={styles.cardTitle}>{reportado.nombreCompleto || 'Sin nombre'}</h3>
            <p style={styles.cardSubtitle}>{reportado.email || 'Sin correo'}</p>
          </div>
          <span style={{
            ...styles.statusBadge,
            backgroundColor: reportado.estadoCuenta === 'activo' ? '#dcfce7' : '#fee2e2',
            color: reportado.estadoCuenta === 'activo' ? '#15803d' : '#dc2626',
          }}>
            {reportado.estadoCuenta || 'sin estado'}
          </span>
        </div>

        <div style={styles.reportMeta}>
          <strong>{item.cantidadReportes} reporte(s)</strong>
          <span>Último: {formatDate(reportesDetalle[0]?.createdAt)}</span>
        </div>

        <div style={styles.reportesDetalleList}>
          {reportesDetalle.map((reporte, index) => (
            <article key={`${reportado.id}-${reporte.id || index}`} style={styles.reporteDetalleCard}>
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
          {suspendido ? (
            <>
              <button type="button" onClick={() => resolver(item, 'mantener')} style={styles.actionButton}>
                <ShieldCheck size={16} /> Mantener suspendida
              </button>
              <button type="button" onClick={() => resolver(item, 'reactivar')} style={styles.secondaryButton}>
                <RotateCcw size={16} /> Reactivar
              </button>
            </>
          ) : (
            <>
              <button type="button" onClick={() => resolver(item, 'mantener')} style={styles.actionButton}>
                <ShieldCheck size={16} /> Mantener
              </button>
              <button type="button" onClick={() => resolver(item, 'suspender')} style={{ ...styles.actionButton, ...styles.dangerButton }}>
                <ShieldOff size={16} /> Suspender
              </button>
            </>
          )}
        </div>
      </article>
    );
  };

  return (
    <div style={styles.page}>
      <section style={styles.hero}>
        <div>
          <h1 style={styles.title}>Usuarios Reportados</h1>
          <p style={styles.subtitle}>Revisa cuentas con reportes pendientes desde el chat y registra una acción administrativa.</p>
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
        {loading && <p style={styles.muted}>Cargando usuarios reportados...</p>}
        {!loading && error && <p style={styles.error}>{error}</p>}
        {!loading && !error && reportes.length === 0 && (
          <p style={styles.muted}>No hay usuarios reportados pendientes.</p>
        )}

        {!loading && !error && reportesActivos.length > 0 && (
          <>
            <h3 style={styles.sectionTitle}>Pendientes de revisión</h3>
            <div style={styles.list}>
              {reportesActivos.map((item) => renderCard(item, { suspendido: false }))}
            </div>
          </>
        )}

        {!loading && !error && reportesSuspendidos.length > 0 && (
          <>
            <h3 style={{ ...styles.sectionTitle, marginTop: reportesActivos.length > 0 ? '24px' : 0 }}>
              Cuentas suspendidas
            </h3>
            <div style={styles.list}>
              {reportesSuspendidos.map((item) => renderCard(item, { suspendido: true }))}
            </div>
          </>
        )}
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
  sectionTitle: { margin: '0 0 14px', fontSize: '15px', fontWeight: 800, color: '#0f172a' },
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

export default AdminReportesUsuarios;
