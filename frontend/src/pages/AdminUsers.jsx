import { useCallback, useMemo, useState } from 'react';
import { BadgeCheck, ClipboardList, Search as SearchIcon, ShieldCheck, Users as UsersIcon } from 'lucide-react';
import Table from '@components/Table';
import Search from '@components/Search';
import Popup from '@components/Popup';
import useUsers from '@hooks/users/useGetUsers.jsx';
import useEditUser from '@hooks/users/useEditUser';
import useDeleteUser from '@hooks/users/useDeleteUser';
import { useAuth } from '@context/AuthContext';
import '@styles/users.css';

const AdminUsers = () => {
    const { user } = useAuth();
    const { users, fetchUsers, setUsers } = useUsers();
    const [filterRut, setFilterRut] = useState('');

    const {
        handleClickUpdate,
        handleUpdate,
        isPopupOpen,
        setIsPopupOpen,
        dataUser,
        setDataUser,
    } = useEditUser(setUsers);

    const { handleDelete } = useDeleteUser(fetchUsers, setDataUser);

    const handleRutFilterChange = (e) => {
        setFilterRut(e.target.value);
    };

    const handleSelectionChange = useCallback((selectedUsers) => {
        setDataUser(selectedUsers);
    }, [setDataUser]);

    const columns = useMemo(() => ([
        { title: 'Nombre', field: 'nombreCompleto', width: 350, responsive: 0 },
        { title: 'Correo electrónico', field: 'email', width: 300, responsive: 3 },
        { title: 'Rut', field: 'rut', width: 150, responsive: 2 },
        { title: 'Rol', field: 'rol', width: 200, responsive: 2 },
        { title: 'Creado', field: 'createdAt', width: 200, responsive: 2 },
    ]), []);

    const colores = {
        principal: '#008080',
        secundario: '#e6dfd3',
        textoOscuro: '#2c3e50',
        blanco: '#ffffff',
        grisSuave: '#f4f6f6',
    };

    const stats = [
        { label: 'Usuarios cargados', value: users.length, icon: UsersIcon },
        { label: 'Seleccionados', value: dataUser.length, icon: ShieldCheck },
        { label: 'Filtro activo', value: filterRut ? 'Sí' : 'No', icon: SearchIcon },
    ];

    return (
        <div style={styles.page}>
            <section style={{ ...styles.hero, background: 'linear-gradient(135deg, #008080 0%, #0b6b7a 45%, #163d4f 100%)' }}>
                <div style={styles.heroContent}>
                    <h1 style={styles.title}>Gestión de Usuarios</h1>
                    <p style={styles.subtitle}>
                        Lista, filtra, selecciona y administra usuarios desde un panel visual coherente con el resto del proyecto.
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
                            </div>
                        </article>
                    );
                })}
            </section>

            <section style={styles.contentCard}>
                <header style={styles.cardHeader}>
                    <div>
                        <p style={{ ...styles.cardEyebrow, color: colores.principal }}>Administración</p>
                        <h3 style={styles.cardTitle}>Listado de usuarios</h3>
                        <p style={styles.cardSubtitle}>
                            Usa el filtro por RUT para buscar usuarios y selecciona filas para editar o eliminar.
                        </p>
                    </div>

                    <div style={styles.cardIcon}>
                        <ClipboardList size={18} strokeWidth={2.1} />
                    </div>
                </header>

                <div style={styles.toolbar}>
                    <Search value={filterRut} onChange={handleRutFilterChange} placeholder={'Filtrar por rut'} />
                    <div style={styles.actionButtons}>
                        <button type="button" onClick={handleClickUpdate} disabled={dataUser.length === 0} style={styles.actionButton}>
                            Editar selección
                        </button>
                        <button
                            type="button"
                            onClick={() => handleDelete(dataUser)}
                            disabled={dataUser.length === 0}
                            style={{ ...styles.actionButton, ...styles.deleteButton }}
                        >
                            Eliminar selección
                        </button>
                    </div>
                </div>

                <div style={styles.tableWrap}>
                    <Table
                        data={users}
                        columns={columns}
                        filter={filterRut}
                        dataToFilter={'rut'}
                        initialSortName={'nombreCompleto'}
                        onSelectionChange={handleSelectionChange}
                    />
                </div>
            </section>

            <Popup show={isPopupOpen} setShow={setIsPopupOpen} data={dataUser} action={handleUpdate} />
        </div>
    );
};

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
    toolbar: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px',
        flexWrap: 'wrap',
        marginBottom: '18px',
        padding: '14px',
        borderRadius: '18px',
        backgroundColor: '#f8fafc',
        border: '1px solid #e2e8f0',
    },
    actionButtons: {
        display: 'flex',
        gap: '10px',
        flexWrap: 'wrap',
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
    deleteButton: {
        backgroundColor: '#0f766e',
    },
    tableWrap: {
        overflow: 'hidden',
        borderRadius: '18px',
        border: '1px solid #e2e8f0',
        backgroundColor: '#ffffff',
    },
};

export default AdminUsers;