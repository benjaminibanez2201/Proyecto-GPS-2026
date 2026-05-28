import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, BadgeCheck, Building2, Clock3, MessageSquareMore, Sparkles, TrendingUp, ClipboardList } from 'lucide-react';
import { useAuth } from '@context/AuthContext';

const roleConfig = {
  estudiante: {
    title: 'Tu actividad, tus oportunidades y lo que viene hoy.',
    subtitle: 'Resumen rápido para seguir tus arriendos, contactos y recomendaciones.',
    accent: '#008080',
    stats: [
      { label: 'Arriendos activos', value: '2', detail: '1 con pago próximo', icon: Building2 },
      { label: 'Postulaciones recientes', value: '4', detail: '2 sin respuesta aún', icon: ClipboardList },
      { label: 'Arriendos destacados', value: '6', detail: '3 con buena compatibilidad', icon: Sparkles },
    ],
    primary: {
      title: 'Estado de arriendos activos',
      subtitle: 'Revisa el avance de tus contratos y próximos hitos importantes.',
      items: [
        { title: 'Departamento Centro', detail: 'Pago en 3 días', badge: 'Activo' },
        { title: 'Casa Bellavista', detail: 'Renovación sugerida', badge: 'En seguimiento' },
      ],
    },
    secondary: {
      title: 'Últimas postulaciones o contactos recientes',
      subtitle: 'Interacciones recientes con arriendos que te interesan.',
      items: [
        { title: 'Contacto con arrendador en Ñuñoa', detail: 'Respondió hace 2 horas', badge: 'Nuevo' },
        { title: 'Postulación enviada a Providencia', detail: 'En revisión', badge: 'Pendiente' },
      ],
    },
    tertiary: {
      title: 'Recomendaciones o arriendos destacados',
      subtitle: 'Opciones sugeridas según tu historial y preferencias.',
      items: [
        { title: 'Depto 1D1B en metro cercano', detail: 'Alta compatibilidad', badge: 'Destacado' },
        { title: 'Estudio amoblado', detail: 'Buen precio mensual', badge: 'Recomendado' },
      ],
    },
    note: 'Mantén esta pantalla como centro de control: el slidebar se reserva para acciones y navegación.',
  },
  arrendador: {
    title: 'Controla tus publicaciones, solicitudes y alertas activas.',
    subtitle: 'Un resumen sobre tus propiedades y publicaciones que requieren atención.',
    accent: '#0f766e',
    stats: [
      { label: 'Propiedades activas', value: '5', detail: '4 con buena visibilidad', icon: Building2 },
      { label: 'Solicitudes por revisar', value: '8', detail: '3 requieren respuesta hoy', icon: ClipboardList },
      { label: 'Alertas pendientes', value: '2', detail: 'Publicaciones inactivas o incompletas', icon: AlertTriangle },
    ],
    primary: {
      title: 'Propiedades con mejor desempeño',
      subtitle: 'Publicaciones que están captando más interés o consultas.',
      items: [
        { title: 'Depto Italia', detail: 'Mayor cantidad de visitas', badge: 'Top' },
        { title: 'Casa Maipú', detail: 'Más mensajes recibidos', badge: 'Destacado' },
      ],
    },
    secondary: {
      title: 'Solicitudes nuevas por revisar',
      subtitle: 'Postulaciones y contactos que esperan tu respuesta.',
      items: [
        { title: 'Solicitud de Diego F.', detail: 'Llegó hace 1 hora', badge: 'Nueva' },
        { title: 'Consulta sobre Arriendo Sur', detail: 'Pendiente de aprobación', badge: 'Pendiente' },
      ],
    },
    tertiary: {
      title: 'Alertas sobre publicaciones inactivas o pendientes',
      subtitle: 'Revisa avisos para evitar que una publicación se enfríe o quede incompleta.',
      items: [
        { title: 'Publicación sin actividad', detail: 'Depto Las Condes lleva 7 días', badge: 'Alerta' },
        { title: 'Ficha incompleta', detail: 'Faltan fotos y descripción', badge: 'Pendiente' },
      ],
    },
    note: 'Este panel sirve para monitorear publicaciones y solicitudes; el slidebar sigue concentrando la navegación principal.',
  },
};

function PanelInicio() {
  const { user } = useAuth();
  const userRole = (user?.rol || '').toString().toLowerCase();

  const config = useMemo(() => roleConfig[userRole] || roleConfig.estudiante, [userRole]);

  return (
    <div style={styles.page}>
      <section style={{ ...styles.hero, background: `linear-gradient(135deg, ${config.accent} 0%, #0b6b7a 45%, #163d4f 100%)` }}>
        <div style={styles.heroContent}>
          <h1 style={styles.title}>Hola, {user?.nombreCompleto || 'Usuario'}</h1>
          <p style={styles.subtitle}>{config.subtitle}</p>
        </div>
        <div style={styles.heroBadge}>
          <BadgeCheck size={18} strokeWidth={2.2} />
          <span>{userRole || 'estudiante'}</span>
        </div>
      </section>

      <section style={styles.gridStats}>
        {config.stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <article key={stat.label} style={styles.statCard}>
              <div style={styles.statIconWrap}>
                <Icon size={20} strokeWidth={2.1} />
              </div>
              <div>
                <p style={styles.statLabel}>{stat.label}</p>
                <h2 style={styles.statValue}>{stat.value}</h2>
                <p style={styles.statDetail}>{stat.detail}</p>
              </div>
            </article>
          );
        })}
      </section>

      <section style={styles.contentGrid}>
        <PanelCard title={config.primary.title} subtitle={config.primary.subtitle} accent={config.accent} items={config.primary.items} />
        <PanelCard title={config.secondary.title} subtitle={config.secondary.subtitle} accent={config.accent} items={config.secondary.items} icon={MessageSquareMore} />
        <PanelCard title={config.tertiary.title} subtitle={config.tertiary.subtitle} accent={config.accent} items={config.tertiary.items} icon={TrendingUp} />

        <aside style={{ ...styles.noteCard, borderColor: `${config.accent}33` }}>
          <div style={styles.noteIcon}><Clock3 size={20} strokeWidth={2.1} /></div>
          <p style={styles.noteText}>{config.note}</p>
          <Link to="/historial" style={{ ...styles.noteLink, color: config.accent }}>
            Ver historial
          </Link>
        </aside>
      </section>
    </div>
  );
}

function PanelCard({ title, subtitle, items, accent, icon: Icon = Clock3 }) {
  return (
    <article style={styles.card}>
      <header style={styles.cardHeader}>
        <div>
          <p style={{ ...styles.cardEyebrow, color: accent }}>Resumen</p>
          <h3 style={styles.cardTitle}>{title}</h3>
          <p style={styles.cardSubtitle}>{subtitle}</p>
        </div>
        <div style={{ ...styles.cardIcon, backgroundColor: `${accent}15`, color: accent }}>
          <Icon size={18} strokeWidth={2.1} />
        </div>
      </header>

      <div style={styles.cardList}>
        {items.map((item) => (
          <div key={item.title} style={styles.listItem}>
            <div>
              <p style={styles.listTitle}>{item.title}</p>
              <p style={styles.listDetail}>{item.detail}</p>
            </div>
            <span style={{ ...styles.listBadge, color: accent, backgroundColor: `${accent}12` }}>{item.badge}</span>
          </div>
        ))}
      </div>
    </article>
  );
}

const styles = {
  page: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    padding: '4px 0 12px',
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
    margin: '0 0 4px',
    fontSize: '28px',
    lineHeight: 1.1,
    color: '#0f172a',
  },
  statDetail: {
    margin: 0,
    fontSize: '13px',
    color: '#475569',
  },
  contentGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '16px',
    alignItems: 'start',
  },
  card: {
    borderRadius: '22px',
    padding: '22px',
    backgroundColor: '#ffffff',
    border: '1px solid rgba(15, 23, 42, 0.06)',
    boxShadow: '0 12px 30px rgba(15, 23, 42, 0.07)',
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
  },
  cardList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  listItem: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '12px',
    padding: '14px',
    borderRadius: '16px',
    backgroundColor: '#f8fafc',
    border: '1px solid #e2e8f0',
  },
  listTitle: {
    margin: '0 0 4px',
    fontSize: '14px',
    fontWeight: '700',
    color: '#0f172a',
  },
  listDetail: {
    margin: 0,
    fontSize: '13px',
    color: '#64748b',
  },
  listBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '999px',
    padding: '6px 10px',
    fontSize: '12px',
    fontWeight: '700',
    whiteSpace: 'nowrap',
    flexShrink: 0,
  },
  noteCard: {
    borderRadius: '22px',
    padding: '22px',
    backgroundColor: '#ffffff',
    border: '1px solid rgba(15, 23, 42, 0.06)',
    boxShadow: '0 12px 30px rgba(15, 23, 42, 0.07)',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  noteIcon: {
    width: '42px',
    height: '42px',
    borderRadius: '14px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#0f766e',
    backgroundColor: '#e6f4f1',
  },
  noteText: {
    margin: 0,
    fontSize: '14px',
    lineHeight: 1.6,
    color: '#475569',
  },
  noteLink: {
    alignSelf: 'flex-start',
    fontSize: '14px',
    fontWeight: '700',
  },
};

export default PanelInicio;