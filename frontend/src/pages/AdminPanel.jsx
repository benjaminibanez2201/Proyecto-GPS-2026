import { BadgeCheck, ClipboardList, FlagTriangleRight, ShieldCheck, Users } from 'lucide-react';
import { useAuth } from '@context/AuthContext';

const AdminPanel = () => {
    const { user } = useAuth();

    const colores = {
        principal: '#008080',
        secundario: '#e6dfd3',
        textoOscuro: '#2c3e50',
        blanco: '#ffffff',
        grisSuave: '#f4f6f6'
    };

    const stats = [
        {
            label: 'Usuarios por revisar',
            value: '7',
            detail: '3 con verificacion pendiente',
            icon: Users
        },
        {
            label: 'Documentos en cola',
            value: '5',
            detail: '2 requieren revision hoy',
            icon: ShieldCheck
        },
        {
            label: 'Reportes activos',
            value: '4',
            detail: '1 publicacion bloqueada',
            icon: FlagTriangleRight
        }
    ];

    const cards = [
        {
            title: 'Gestion de usuarios',
            subtitle: 'Listar usuarios, revisar estados y bloquear cuentas.',
            items: [
                { title: 'Usuario nuevo en revision', detail: 'Solicitud enviada hace 1 hora', badge: 'Nuevo' },
                { title: 'Cuenta reportada', detail: 'Bloqueo sugerido', badge: 'Alerta' }
            ]
        },
        {
            title: 'Documentos de verificacion',
            subtitle: 'Revisar documentos subidos por los usuarios.',
            items: [
                { title: 'Cedula pendiente', detail: 'Arrendador en espera', badge: 'Pendiente' },
                { title: 'Contrato adjunto', detail: 'Validacion necesaria', badge: 'Revision' }
            ]
        },
        {
            title: 'Publicaciones reportadas',
            subtitle: 'Desactivar publicaciones con reportes activos.',
            items: [
                { title: 'Depto con 3 reportes', detail: 'Requiere evaluacion', badge: 'Critico' },
                { title: 'Publicacion en disputa', detail: 'Revision de contenido', badge: 'En curso' }
            ]
        }
    ];

    return (
        <div style={styles.page}>
            <section style={{ ...styles.hero, background: 'linear-gradient(135deg, #008080 0%, #0b6b7a 45%, #163d4f 100%)' }}>
                <div style={styles.heroContent}>
                    <h1 style={styles.title}>Panel de Administracion</h1>
                    <p style={styles.subtitle}>
                        Supervisa usuarios, revisa documentos y controla publicaciones.
                    </p>
                </div>
                <div style={styles.heroBadge}>
                    <BadgeCheck size={18} strokeWidth={2.2} />
                    <span>{user?.rol || 'admin'}</span>
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
                                <p style={styles.statDetail}>{stat.detail}</p>
                            </div>
                        </article>
                    );
                })}
            </section>

            <section style={styles.contentGrid}>
                {cards.map((card) => (
                    <article key={card.title} style={styles.card}>
                        <header style={styles.cardHeader}>
                            <div>
                                <p style={{ ...styles.cardEyebrow, color: colores.principal }}>Resumen</p>
                                <h3 style={styles.cardTitle}>{card.title}</h3>
                                <p style={styles.cardSubtitle}>{card.subtitle}</p>
                            </div>
                            <div style={{ ...styles.cardIcon, backgroundColor: '#e6f4f1', color: colores.principal }}>
                                <ClipboardList size={18} strokeWidth={2.1} />
                            </div>
                        </header>

                        <div style={styles.cardList}>
                            {card.items.map((item) => (
                                <div key={item.title} style={styles.listItem}>
                                    <div>
                                        <p style={styles.listTitle}>{item.title}</p>
                                        <p style={styles.listDetail}>{item.detail}</p>
                                    </div>
                                    <span style={{ ...styles.listBadge, color: colores.principal, backgroundColor: '#e6f4f1' }}>
                                        {item.badge}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </article>
                ))}
            </section>
        </div>
    );
};

const styles = {
    page: {
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        padding: '4px 0 12px'
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
        overflow: 'hidden'
    },
    heroContent: {
        maxWidth: '720px'
    },
    title: {
        margin: '0 0 10px',
        fontSize: 'clamp(28px, 4vw, 42px)',
        lineHeight: 1.05
    },
    subtitle: {
        margin: 0,
        maxWidth: '62ch',
        fontSize: '15px',
        lineHeight: 1.6,
        color: 'rgba(255,255,255,0.88)'
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
        textTransform: 'capitalize'
    },
    gridStats: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '16px'
    },
    statCard: {
        display: 'flex',
        alignItems: 'flex-start',
        gap: '14px',
        borderRadius: '20px',
        padding: '18px',
        backgroundColor: '#ffffff',
        boxShadow: '0 10px 26px rgba(15, 23, 42, 0.08)',
        border: '1px solid rgba(15, 23, 42, 0.06)'
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
        flexShrink: 0
    },
    statLabel: {
        margin: '0 0 4px',
        fontSize: '13px',
        color: '#64748b'
    },
    statValue: {
        margin: '0 0 4px',
        fontSize: '28px',
        lineHeight: 1.1,
        color: '#0f172a'
    },
    statDetail: {
        margin: 0,
        fontSize: '13px',
        color: '#475569'
    },
    contentGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '16px',
        alignItems: 'start'
    },
    card: {
        borderRadius: '22px',
        padding: '22px',
        backgroundColor: '#ffffff',
        border: '1px solid rgba(15, 23, 42, 0.06)',
        boxShadow: '0 12px 30px rgba(15, 23, 42, 0.07)'
    },
    cardHeader: {
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: '12px',
        marginBottom: '16px'
    },
    cardEyebrow: {
        margin: '0 0 6px',
        fontSize: '12px',
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: '0.04em'
    },
    cardTitle: {
        margin: '0 0 6px',
        fontSize: '20px',
        lineHeight: 1.2,
        color: '#0f172a'
    },
    cardSubtitle: {
        margin: 0,
        fontSize: '14px',
        lineHeight: 1.55,
        color: '#64748b'
    },
    cardIcon: {
        width: '42px',
        height: '42px',
        borderRadius: '14px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0
    },
    cardList: {
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
    },
    listItem: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
        padding: '14px',
        borderRadius: '16px',
        backgroundColor: '#f8fafc',
        border: '1px solid #e2e8f0'
    },
    listTitle: {
        margin: '0 0 4px',
        fontSize: '14px',
        fontWeight: '700',
        color: '#0f172a'
    },
    listDetail: {
        margin: 0,
        fontSize: '13px',
        color: '#64748b'
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
        flexShrink: 0
    }
};

export default AdminPanel;
