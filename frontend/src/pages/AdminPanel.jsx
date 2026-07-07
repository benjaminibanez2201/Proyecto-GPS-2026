import { useEffect, useMemo, useState } from 'react';
import { BadgeCheck, ClipboardList, FlagTriangleRight, ShieldCheck, Users as UsersIcon } from 'lucide-react';
import { useAuth } from '@context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { obtenerPublicacionesReportadas, obtenerPublicacionesInactivas } from '@services/reportes.service.js';
import { obtenerUsuarios } from '@services/user.service.js';

const normalizeText = (value) => String(value || '').trim().toLowerCase();

const formatDate = (value) => {
    if (!value) return 'Sin fecha registrada';

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'Sin fecha registrada';

    return new Intl.DateTimeFormat('es-CL', { dateStyle: 'medium' }).format(date);
};

const buildRecentUsers = (users) => users
    .filter((item) => normalizeText(item.rol) !== 'admin')
    .sort((a, b) => new Date(b.createdAtRaw || b.createdAt || 0) - new Date(a.createdAtRaw || a.createdAt || 0))
    .slice(0, 2)
    .map((item) => ({
        title: item.nombreCompleto || item.email || 'Usuario sin nombre',
        detail: `${item.rol || 'Usuario'} - Registro: ${formatDate(item.createdAtRaw || item.createdAt)}`,
        badge: item.estadoVerificacion || 'Pendiente'
    }));

const buildPendingDocuments = (users) => users
    .filter((item) => normalizeText(item.estadoVerificacion || 'pendiente') === 'pendiente')
    .slice(0, 2)
    .map((item) => ({
        title: item.nombreCompleto || item.email || 'Usuario sin nombre',
        detail: `${item.rol || 'Usuario'} pendiente de verificacion`,
        badge: 'Pendiente'
    }));

const buildReportedPosts = (reportes) => reportes
    .slice(0, 2)
    .map((item) => ({
        title: item.publicacion?.titulo || 'Publicacion sin titulo',
        detail: `${item.cantidadReportes || 0} reporte(s) - ${item.publicacion?.estado || 'sin estado'}`,
        badge: item.cantidadReportes > 1 ? 'Alerta' : 'Revision'
    }));

const fallbackItems = (message) => [{ title: message, detail: 'No hay datos para mostrar', badge: 'OK' }];

const pluralize = (count, singular, plural = `${singular}s`) => `${count} ${count === 1 ? singular : plural}`;

const AdminPanel = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [users, setUsers] = useState([]);
    const [reportes, setReportes] = useState([]);
    const [publicacionesInactivas, setPublicacionesInactivas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const colores = {
        principal: '#008080',
        secundario: '#e6dfd3',
        textoOscuro: '#2c3e50',
        blanco: '#ffffff',
        grisSuave: '#f4f6f6'
    };

    useEffect(() => {
        const cargarDatos = async () => {
            setLoading(true);
            setError('');

            const [[usuariosData, usuariosError], [reportesData, reportesError], [inactivasData, inactivasError]] = await Promise.all([
                obtenerUsuarios(),
                obtenerPublicacionesReportadas(),
                obtenerPublicacionesInactivas()
            ]);

            setUsers(Array.isArray(usuariosData) ? usuariosData : []);
            setReportes(Array.isArray(reportesData) ? reportesData : []);
            setPublicacionesInactivas(Array.isArray(inactivasData) ? inactivasData : []);

            const errors = [usuariosError, reportesError, inactivasError].filter(Boolean);
            setError(errors.length ? errors.join(' ') : '');
            setLoading(false);
        };

        cargarDatos();
    }, []);

    const dashboard = useMemo(() => {
        const registeredUsers = users;
        const adminUsers = registeredUsers.filter((item) => normalizeText(item.rol) === 'admin');
        const verifiableUsers = registeredUsers.filter((item) => ['estudiante', 'arrendador'].includes(normalizeText(item.rol)));
        const pendingUsers = verifiableUsers.filter((item) => normalizeText(item.estadoVerificacion || 'pendiente') === 'pendiente');
        const approvedUsers = verifiableUsers.filter((item) => normalizeText(item.estadoVerificacion) === 'aprobado');
        const rejectedUsers = verifiableUsers.filter((item) => normalizeText(item.estadoVerificacion) === 'rechazado');
        const suspendedUsers = registeredUsers.filter((item) => normalizeText(item.estadoCuenta) === 'suspendido');
        const totalPendingReports = reportes.reduce((sum, item) => sum + Number(item.cantidadReportes || 0), 0);
        const reportedPublications = reportes.length;
        const inactiveReportedPublications = publicacionesInactivas.length;

        const usersList = buildRecentUsers(users);
        const docsList = buildPendingDocuments(verifiableUsers);
        const reportsList = buildReportedPosts(reportes);

        return {
            stats: [
                {
                    label: 'Usuarios por revisar',
                    value: pendingUsers.length,
                    detail: `${pluralize(approvedUsers.length, 'aprobado')} - ${pluralize(rejectedUsers.length, 'rechazado')}`,
                    icon: UsersIcon
                },
                {
                    label: 'Usuarios registrados',
                    value: registeredUsers.length,
                    detail: `${pluralize(verifiableUsers.length, 'verificable')} - ${pluralize(adminUsers.length, 'admin')}`,
                    icon: ShieldCheck
                },
                {
                    label: 'Reportes activos',
                    value: totalPendingReports,
                    detail: `${pluralize(reportedPublications, 'publicacion', 'publicaciones')} - ${inactiveReportedPublications} inactiva(s)`,
                    icon: FlagTriangleRight
                }
            ],
            cards: [
                {
                    title: 'Gestion de usuarios',
                    subtitle: `${registeredUsers.length} usuario(s) registrados. ${suspendedUsers.length} cuenta(s) suspendida(s).`,
                    items: usersList.length ? usersList : fallbackItems('Sin usuarios registrados')
                },
                {
                    title: 'Documentos de verificacion',
                    subtitle: `${pendingUsers.length} cuenta(s) esperan revision administrativa.`,
                    items: docsList.length ? docsList : fallbackItems('Sin verificaciones pendientes')
                },
                {
                    title: 'Publicaciones reportadas',
                    subtitle: `${reportes.length} publicacion(es) con reportes pendientes.`,
                    items: reportsList.length ? reportsList : fallbackItems('Sin reportes pendientes')
                }
            ]
        };
    }, [reportes, users, publicacionesInactivas]);

    const goToUsers = () => navigate('/admin/users');
    const goToReportes = () => navigate('/admin/reportes');

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

            {loading && <p style={styles.notice}>Cargando datos reales del panel...</p>}
            {!loading && error && <p style={{ ...styles.notice, ...styles.error }}>{error}</p>}

            <section style={styles.gridStats}>
                {dashboard.stats.map((stat) => {
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
                {dashboard.cards.map((card) => (
                    <article key={card.title} style={styles.card}>
                        <header style={styles.cardHeader}>
                            <div>
                                <p style={{ ...styles.cardEyebrow, color: colores.principal }}>Resumen</p>
                                <h3 style={styles.cardTitle}>{card.title}</h3>
                                <p style={styles.cardSubtitle}>{card.subtitle}</p>
                                {card.title === 'Gestion de usuarios' && (
                                    <div style={styles.cardActionBlock}>
                                        <p style={styles.cardActionLabel}>Opciones</p>
                                        <button
                                            type="button"
                                            onClick={goToUsers}
                                            style={styles.listUsersButton}
                                        >
                                            Listar usuarios
                                        </button>
                                    </div>
                                )}
                                {card.title === 'Publicaciones reportadas' && (
                                    <div style={styles.cardActionBlock}>
                                        <p style={styles.cardActionLabel}>Opciones</p>
                                        <button
                                            type="button"
                                            onClick={goToReportes}
                                            style={styles.listUsersButton}
                                        >
                                            Revisar reportes
                                        </button>
                                    </div>
                                )}
                            </div>
                            <div style={{ ...styles.cardIcon, backgroundColor: '#e6f4f1', color: colores.principal }}>
                                <ClipboardList size={18} strokeWidth={2.1} />
                            </div>
                        </header>

                        <div style={styles.cardList}>
                            {card.items.map((item) => (
                                <div key={`${card.title}-${item.title}-${item.badge}`} style={styles.listItem}>
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
    notice: {
        margin: 0,
        padding: '12px 14px',
        borderRadius: '12px',
        backgroundColor: '#f8fafc',
        border: '1px solid #e2e8f0',
        color: '#475569',
        fontSize: '14px',
        fontWeight: '700'
    },
    error: {
        color: '#b91c1c',
        backgroundColor: '#fef2f2',
        borderColor: '#fecaca'
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
    cardActionBlock: {
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        marginTop: '14px'
    },
    cardActionLabel: {
        margin: 0,
        fontSize: '12px',
        fontWeight: '700',
        letterSpacing: '0.04em',
        textTransform: 'uppercase',
        color: '#64748b'
    },
    listUsersButton: {
        alignSelf: 'flex-start',
        padding: '10px 14px',
        border: 'none',
        borderRadius: '10px',
        backgroundColor: '#008080',
        color: '#ffffff',
        fontSize: '14px',
        fontWeight: '700',
        cursor: 'pointer',
        boxShadow: '0 10px 18px rgba(0, 128, 128, 0.18)'
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
