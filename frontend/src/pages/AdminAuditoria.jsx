import { useCallback, useEffect, useMemo, useState } from 'react';
import { ClipboardList, History, Search as SearchIcon, ShieldCheck } from 'lucide-react';
import { getAuditoria } from '@services/auditoria.service.js';
import { showErrorAlert } from '@helpers/sweetAlert.js';

const ACCION_LABELS = {
  BLOQUEAR: 'Suspendió la cuenta',
  DESBLOQUEAR: 'Reactivó la cuenta',
  ELIMINAR: 'Eliminó al usuario',
   EDITAR_USUARIO: 'Editó los datos del usuario',
  APROBAR_DOCUMENTOS: 'Aprobó los documentos',
  RECHAZAR_DOCUMENTOS: 'Rechazó los documentos',
  SOLICITAR_ANTECEDENTES: 'Solicitó antecedentes adicionales',
  REVISAR_VERIFICACION: 'Revisó la verificación',
};

const ACCION_COLORES = {
  BLOQUEAR: { bg: '#fef2f2', color: '#dc2626' },
  DESBLOQUEAR: { bg: '#f0fdf4', color: '#16a34a' },
  ELIMINAR: { bg: '#fef2f2', color: '#b91c1c' },
  EDITAR_USUARIO: { bg: '#eff6ff', color: '#1d4ed8' },
  APROBAR_DOCUMENTOS: { bg: '#f0fdf4', color: '#0f766e' },
  RECHAZAR_DOCUMENTOS: { bg: '#fef2f2', color: '#b91c1c' },
  SOLICITAR_ANTECEDENTES: { bg: '#fffbeb', color: '#b45309' },
  REVISAR_VERIFICACION: { bg: '#f1f5f9', color: '#334155' },
};

function formatearAccion(accion) {
  return ACCION_LABELS[accion] || accion;
}

function coloresAccion(accion) {
  return ACCION_COLORES[accion] || { bg: '#f1f5f9', color: '#334155' };
}

function formatearFecha(fechaIso) {
  if (!fechaIso) return '—';
  return new Date(fechaIso).toLocaleString('es-CL', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const AdminAuditoria = () => {
  const [registros, setRegistros] = useState([]);
  const [total, setTotal] = useState(0);
  const [pagina, setPagina] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [cargando, setCargando] = useState(false);

  const [filtrosAplicados, setFiltrosAplicados] = useState({});
  const [filtros, setFiltros] = useState({
  adminNombre: '',
  accion: '',
  fechaDesde: '',
  fechaHasta: '',
});

  const limite = 15;

  const cargarAuditoria = useCallback(async (paginaConsulta, filtrosConsulta) => {
    setCargando(true);
    const [data, error] = await getAuditoria({
      ...filtrosConsulta,
      pagina: paginaConsulta,
      limite,
    });

    if (error) {
      showErrorAlert('Error al cargar la auditoría', error);
      setRegistros([]);
      setTotal(0);
      setTotalPaginas(1);
    } else {
      setRegistros(data?.registros || []);
      setTotal(data?.total || 0);
      setTotalPaginas(data?.totalPaginas || 1);
    }
    setCargando(false);
  }, []);

  useEffect(() => {
    cargarAuditoria(1, {});
  }, [cargarAuditoria]);

  const handleFiltroChange = (campo) => (e) => {
    setFiltros((prev) => ({ ...prev, [campo]: e.target.value }));
  };

  const aplicarFiltros = () => {
    setPagina(1);
    setFiltrosAplicados(filtros);
    cargarAuditoria(1, filtros);
  };

  const limpiarFiltros = () => {
  const vacios = { adminNombre: '', accion: '', fechaDesde: '', fechaHasta: '' };
  setFiltros(vacios);
  setFiltrosAplicados({});
  setPagina(1);
  cargarAuditoria(1, {});
};

  const irAPagina = (nuevaPagina) => {
    if (nuevaPagina < 1 || nuevaPagina > totalPaginas) return;
    setPagina(nuevaPagina);
    cargarAuditoria(nuevaPagina, filtrosAplicados);
  };

  const stats = useMemo(() => ([
    { label: 'Registros totales', value: total, icon: History },
    { label: 'Página actual', value: `${pagina} / ${totalPaginas}`, icon: ClipboardList },
    { label: 'Filtro activo', value: Object.keys(filtrosAplicados).length > 0 ? 'Sí' : 'No', icon: SearchIcon },
  ]), [total, pagina, totalPaginas, filtrosAplicados]);

  return (
    <div style={styles.page}>
      <section style={{ ...styles.hero, background: 'linear-gradient(135deg, #008080 0%, #0b6b7a 45%, #163d4f 100%)' }}>
        <div style={styles.heroContent}>
          <h1 style={styles.title}>Historial de Auditoría</h1>
          <p style={styles.subtitle}>
            Revisa las acciones realizadas por los administradores: suspensiones, eliminaciones y revisiones de verificación.
          </p>
        </div>
        <div style={styles.heroBadge}>
          <ShieldCheck size={18} strokeWidth={2.2} />
          <span>admin</span>
        </div>
      </section>

      <section style={styles.gridStats}>
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <article key={stat.label} style={styles.statCard}>
              <div style={styles.statIconWrap}>
                <Icon size={20} strokeWidth={2.1} />
              </div>
              <div>
                <p style={styles.statLabel}>{stat.label}</p>
                <h2 style={styles.statValue}>{stat.value}</h2>
              </div>
            </article>
          );
        })}
      </section>

      <section style={styles.contentCard}>
        <header style={styles.cardHeader}>
          <div>
            <h3 style={styles.cardTitle}>Registros de auditoría</h3>
            <p style={styles.cardSubtitle}>
              Filtra por administrador responsable, tipo de acción o rango de fechas.
            </p>
          </div>
          <div style={styles.cardIcon}>
            <ClipboardList size={18} strokeWidth={2.1} />
          </div>
        </header>

        <section style={styles.advancedFiltersPanel}>
            <div style={styles.advancedFiltersHeader}>
                <div>
                <p style={styles.cardEyebrow}>Filtros</p>
                <p style={styles.cardSubtitle}>Todos los campos son opcionales.</p>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                <button type="button" onClick={aplicarFiltros} style={styles.actionButton}>
                    Buscar
                </button>
                <button type="button" onClick={limpiarFiltros} style={styles.clearFiltersButton}>
                    Limpiar filtros
                </button>
                </div>
            </div>

            <div style={styles.advancedFiltersGrid}>
                <label style={styles.filterField}>
                <span style={styles.filterLabel}>Nombre del administrador</span>
                <input
                    type="text"
                    value={filtros.adminNombre}
                    onChange={handleFiltroChange('adminNombre')}
                    placeholder="Ej. Juan Pérez"
                    style={styles.filterInput}
                />
                </label>

                <label style={styles.filterField}>
                <span style={styles.filterLabel}>Tipo de acción</span>
                <select
                    value={filtros.accion}
                    onChange={handleFiltroChange('accion')}
                    style={styles.filterInput}
                >
                    <option value="">Todas</option>
                    {Object.entries(ACCION_LABELS).map(([valor, etiqueta]) => (
                    <option key={valor} value={valor}>{etiqueta}</option>
                    ))}
                </select>
                </label>

                <label style={styles.filterField}>
                <span style={styles.filterLabel}>Fecha desde</span>
                <input
                    type="date"
                    value={filtros.fechaDesde}
                    onChange={handleFiltroChange('fechaDesde')}
                    style={styles.filterInput}
                />
                </label>

                <label style={styles.filterField}>
                <span style={styles.filterLabel}>Fecha hasta</span>
                <input
                    type="date"
                    value={filtros.fechaHasta}
                    onChange={handleFiltroChange('fechaHasta')}
                    style={styles.filterInput}
                />
                </label>
            </div>
            </section>

        <div style={styles.tableWrap}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Acción</th>
                <th style={styles.th}>Administrador</th>
                <th style={styles.th}>Usuario afectado</th>
                <th style={styles.th}>Fecha</th>
              </tr>
            </thead>
            <tbody>
              {cargando ? (
                <tr>
                  <td style={styles.tdEmpty} colSpan={4}>Cargando registros...</td>
                </tr>
              ) : registros.length === 0 ? (
                <tr>
                  <td style={styles.tdEmpty} colSpan={4}>No se encontraron registros de auditoría.</td>
                </tr>
              ) : (
                registros.map((registro) => {
                  const { bg, color } = coloresAccion(registro.accion);
                  return (
                    <tr key={registro.id}>
                      <td style={styles.td}>
                        <span style={{ ...styles.badge, backgroundColor: bg, color }}>
                          {formatearAccion(registro.accion)}
                        </span>
                      </td>
                      <td style={styles.td}>
                        {registro.adminResponsable?.nombreCompleto || `Admin #${registro.adminResponsable?.id ?? '—'}`}
                      </td>
                      <td style={styles.td}>
                        {registro.usuarioAfectadoEmail || `Usuario #${registro.usuarioAfectadoId}`}
                      </td>
                      <td style={styles.td}>{formatearFecha(registro.fechaAccion)}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div style={styles.pagination}>
          <button
            type="button"
            onClick={() => irAPagina(pagina - 1)}
            disabled={pagina <= 1 || cargando}
            style={{ ...styles.actionButton, ...(pagina <= 1 ? styles.actionButtonDisabled : {}) }}
          >
            Anterior
          </button>
          <span style={styles.paginationLabel}>
            Página {pagina} de {totalPaginas} ({total} registros)
          </span>
          <button
            type="button"
            onClick={() => irAPagina(pagina + 1)}
            disabled={pagina >= totalPaginas || cargando}
            style={{ ...styles.actionButton, ...(pagina >= totalPaginas ? styles.actionButtonDisabled : {}) }}
          >
            Siguiente
          </button>
        </div>
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
    width: '100%',
    minWidth: 0,
  },
  hero: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: '16px',
    borderRadius: '24px',
    padding: '28px',
    color: '#ffffff',
    boxShadow: '0 20px 40px rgba(11, 34, 45, 0.18)',
    overflow: 'hidden',
  },
  heroContent: {
    maxWidth: '720px',
  },
  title: {
    margin: '0 0 10px',
    fontSize: 'clamp(28px, 4vw, 42px)',
    lineHeight: 1.05,
  },
  subtitle: {
    margin: 0,
    maxWidth: '62ch',
    fontSize: '15px',
    lineHeight: 1.6,
    color: 'rgba(255,255,255,0.88)',
  },
  heroBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    borderRadius: '999px',
    padding: '10px 14px',
    backgroundColor: 'rgba(255,255,255,0.12)',
    border: '1px solid rgba(255,255,255,0.14)',
    whiteSpace: 'nowrap',
    marginTop: '4px',
    textTransform: 'capitalize',
  },
  gridStats: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '16px',
  },
  statCard: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '14px',
    borderRadius: '20px',
    padding: '18px',
    backgroundColor: '#ffffff',
    boxShadow: '0 10px 26px rgba(15, 23, 42, 0.08)',
    border: '1px solid rgba(15, 23, 42, 0.06)',
  },
  statIconWrap: {
    width: '42px',
    height: '42px',
    borderRadius: '14px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#0f766e',
    backgroundColor: '#e6f4f1',
    flexShrink: 0,
  },
  statLabel: {
    margin: '0 0 4px',
    fontSize: '13px',
    color: '#64748b',
  },
  statValue: {
    margin: 0,
    fontSize: '28px',
    lineHeight: 1.1,
    color: '#0f172a',
  },
  contentCard: {
    borderRadius: '22px',
    padding: '22px',
    backgroundColor: '#ffffff',
    border: '1px solid rgba(15, 23, 42, 0.06)',
    boxShadow: '0 12px 30px rgba(15, 23, 42, 0.07)',
    width: 'calc(100% - 12px)',
    minWidth: 0,
    boxSizing: 'border-box',
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: '12px',
    marginBottom: '16px',
  },
  cardEyebrow: {
    margin: '0 0 6px',
    fontSize: '12px',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
  },
  cardTitle: {
    margin: '0 0 6px',
    fontSize: '20px',
    lineHeight: 1.2,
    color: '#0f172a',
  },
  cardSubtitle: {
    margin: 0,
    fontSize: '14px',
    lineHeight: 1.55,
    color: '#64748b',
  },
  cardIcon: {
    width: '42px',
    height: '42px',
    borderRadius: '14px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    backgroundColor: '#e6f4f1',
    color: '#008080',
  },
  advancedFiltersPanel: {
    marginBottom: '18px',
    padding: '18px',
    borderRadius: '18px',
    backgroundColor: '#f8fafc',
    border: '1px solid #e2e8f0',
  },
  advancedFiltersHeader: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: '12px',
    marginBottom: '14px',
    flexWrap: 'wrap',
  },
  advancedFiltersGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '12px',
  },
  filterField: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  filterLabel: {
    fontSize: '12px',
    fontWeight: '700',
    color: '#334155',
  },
  filterInput: {
    width: '100%',
    boxSizing: 'border-box',
    borderRadius: '12px',
    border: '1px solid #cbd5e1',
    padding: '10px 12px',
    backgroundColor: '#ffffff',
    color: '#0f172a',
    outline: 'none',
  },
  clearFiltersButton: {
    border: '1px solid #cbd5e1',
    borderRadius: '10px',
    padding: '10px 14px',
    backgroundColor: '#ffffff',
    color: '#0f172a',
    fontWeight: '700',
    cursor: 'pointer',
  },
  actionButton: {
    border: 'none',
    borderRadius: '10px',
    padding: '10px 14px',
    backgroundColor: '#008080',
    color: '#ffffff',
    fontWeight: '700',
    cursor: 'pointer',
    boxShadow: '0 10px 18px rgba(0, 128, 128, 0.18)',
  },
  actionButtonDisabled: {
    backgroundColor: '#94a3b8',
    boxShadow: 'none',
    cursor: 'not-allowed',
  },
  tableWrap: {
    overflowX: 'auto',
    overflowY: 'hidden',
    borderRadius: '18px',
    border: '1px solid #e2e8f0',
    backgroundColor: '#ffffff',
    width: '100%',
    minWidth: 0,
    boxSizing: 'border-box',
    marginBottom: '16px',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  th: {
    textAlign: 'left',
    padding: '12px 16px',
    fontSize: '13px',
    fontWeight: 700,
    color: '#334155',
    backgroundColor: '#f8fafc',
    borderBottom: '1px solid #e2e8f0',
  },
  td: {
    padding: '12px 16px',
    fontSize: '14px',
    color: '#334155',
    borderBottom: '1px solid #f1f5f9',
  },
  tdEmpty: {
    padding: '24px 16px',
    textAlign: 'center',
    color: '#94a3b8',
    fontSize: '14px',
  },
  badge: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '4px 10px',
    borderRadius: '999px',
    fontWeight: 700,
    fontSize: '12px',
  },
  pagination: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '16px',
    flexWrap: 'wrap',
  },
  paginationLabel: {
    fontSize: '13px',
    color: '#64748b',
    fontWeight: 600,
  },
};

export default AdminAuditoria;