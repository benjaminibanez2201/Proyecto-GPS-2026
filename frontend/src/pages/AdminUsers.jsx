import { useCallback, useMemo, useState } from 'react';
import { BadgeCheck, ClipboardList, Search as SearchIcon, ShieldCheck, Users as UsersIcon } from 'lucide-react';
import Table from '@components/Table';
import Popup from '@components/Popup';
import UserDetailsModal from '@components/UserDetailsModal';
import useUsers from '@hooks/users/useGetUsers.jsx';
import useEditUser from '@hooks/users/useEditUser';
import useDeleteUser from '@hooks/users/useDeleteUser';
import { useAuth } from '@context/AuthContext';
import '@styles/users.css';

const AdminUsers = () => {
    const { user } = useAuth();
    const { users, fetchUsers, setUsers } = useUsers();
    const [advancedFiltersEnabled, setAdvancedFiltersEnabled] = useState(false);
    const [advancedFilters, setAdvancedFilters] = useState({
        nombreCompleto: '',
        rut: '',
        rol: '',
        estadoVerificacion: '',
        fechaDesde: '',
        fechaHasta: '',
    });
    const [selectedUser, setSelectedUser] = useState(null);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);

    const {
        handleClickUpdate,
        handleUpdate,
        isPopupOpen,
        setIsPopupOpen,
        dataUser,
        setDataUser,
    } = useEditUser(setUsers);

    const { handleDelete } = useDeleteUser(fetchUsers, setDataUser);

    const handleSelectionChange = useCallback((selectedUsers) => {
        setDataUser(selectedUsers);
    }, [setDataUser]);

    const handleViewUser = useCallback((userData) => {
        setSelectedUser(userData);
        setIsDetailsOpen(true);
    }, []);

    const handleAdvancedFilterChange = useCallback((field) => (event) => {
        const { value } = event.target;
        setAdvancedFilters((current) => ({
            ...current,
            [field]: value,
        }));
    }, []);

    const clearAdvancedFilters = useCallback(() => {
        setAdvancedFilters({
            nombreCompleto: '',
            rut: '',
            rol: '',
            estadoVerificacion: '',
            fechaDesde: '',
            fechaHasta: '',
        });
    }, []);

    const activeFiltersCount = useMemo(() => (
        Object.values(advancedFilters).filter((value) => String(value || '').trim() !== '').length
    ), [advancedFilters]);

    const tableFilters = useMemo(() => ({
        enabled: advancedFiltersEnabled,
        ...advancedFilters,
    }), [advancedFiltersEnabled, advancedFilters]);

    const columns = useMemo(() => ([
        { title: 'Nombre', field: 'nombreCompleto', minWidth: 240, widthGrow: 3, responsive: 0 },
        { title: 'Correo electrónico', field: 'email', minWidth: 240, widthGrow: 3, responsive: 3 },
        { title: 'Rut', field: 'rut', minWidth: 130, widthGrow: 1.2, responsive: 2 },
        { title: 'Rol', field: 'rol', minWidth: 130, widthGrow: 1, responsive: 2 },
        {
            title: 'Estado',
            field: 'estadoVerificacion',
            minWidth: 150,
            widthGrow: 1.2,
            responsive: 1,
            formatter: (cell) => {
                const value = cell.getValue();
                const normalized = (value || '').toString().toLowerCase();
                const colors = {
                    aprobado: '#0f766e',
                    pendiente: '#b45309',
                    rechazado: '#b91c1c',
                };

                return `<span style="display:inline-flex;align-items:center;gap:6px;padding:4px 10px;border-radius:999px;background:${colors[normalized] || '#334155'}1a;color:${colors[normalized] || '#334155'};font-weight:700;font-size:12px;">${value || 'Pendiente'}</span>`;
            },
        },
        { title: 'Creado', field: 'createdAt', minWidth: 120, widthGrow: 1, responsive: 2 },
        {
            title: 'Ver',
            headerSort: false,
            hozAlign: 'center',
            width: 80,
            minWidth: 80,
            maxWidth: 80,
            responsive: 0,
            formatter: () => '<button type="button" class="table-view-button">Ver</button>',
            cellClick: (e, cell) => handleViewUser(cell.getRow().getData()),
        },
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
        { label: 'Filtro activo', value: activeFiltersCount > 0 ? 'Sí' : 'No', icon: SearchIcon },
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
                    <div style={styles.actionButtons}>
                        <button type="button" onClick={() => setAdvancedFiltersEnabled((current) => !current)} style={styles.actionButton}>
                            {advancedFiltersEnabled ? 'Ocultar filtros avanzados' : 'Mostrar filtros avanzados'}
                        </button>
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

                {advancedFiltersEnabled && (
                    <section style={styles.advancedFiltersPanel}>
                        <div style={styles.advancedFiltersHeader}>
                            <div>
                                <p style={styles.cardEyebrow}>Filtros avanzados</p>
                                <p style={styles.cardSubtitle}>Todos los campos arrancan vacíos y solo filtran cuando los completas.</p>
                            </div>
                            <button type="button" onClick={clearAdvancedFilters} style={styles.clearFiltersButton}>
                                Limpiar filtros
                            </button>
                        </div>

                        <div style={styles.advancedFiltersGrid}>
                            <label style={styles.filterField}>
                                <span style={styles.filterLabel}>Nombre</span>
                                <input
                                    type="text"
                                    value={advancedFilters.nombreCompleto}
                                    onChange={handleAdvancedFilterChange('nombreCompleto')}
                                    placeholder="Buscar por nombre"
                                    style={styles.filterInput}
                                />
                            </label>

                            <label style={styles.filterField}>
                                <span style={styles.filterLabel}>RUT</span>
                                <input
                                    type="text"
                                    value={advancedFilters.rut}
                                    onChange={handleAdvancedFilterChange('rut')}
                                    placeholder="Buscar por RUT"
                                    style={styles.filterInput}
                                />
                            </label>

                            <label style={styles.filterField}>
                                <span style={styles.filterLabel}>Rol</span>
                                <select
                                    value={advancedFilters.rol}
                                    onChange={handleAdvancedFilterChange('rol')}
                                    style={styles.filterInput}
                                >
                                    <option value="">Todos</option>
                                    <option value="admin">Admin</option>
                                    <option value="estudiante">Estudiante</option>
                                    <option value="arrendador">Arrendador</option>
                                </select>
                            </label>

                            <label style={styles.filterField}>
                                <span style={styles.filterLabel}>Estado</span>
                                <select
                                    value={advancedFilters.estadoVerificacion}
                                    onChange={handleAdvancedFilterChange('estadoVerificacion')}
                                    style={styles.filterInput}
                                >
                                    <option value="">Todos</option>
                                    <option value="aprobado">Aprobado</option>
                                    <option value="pendiente">Pendiente</option>
                                    <option value="rechazado">Rechazado</option>
                                </select>
                            </label>

                            <label style={styles.filterField}>
                                <span style={styles.filterLabel}>Fecha desde</span>
                                <input
                                    type="date"
                                    value={advancedFilters.fechaDesde}
                                    onChange={handleAdvancedFilterChange('fechaDesde')}
                                    style={styles.filterInput}
                                />
                            </label>

                            <label style={styles.filterField}>
                                <span style={styles.filterLabel}>Fecha hasta</span>
                                <input
                                    type="date"
                                    value={advancedFilters.fechaHasta}
                                    onChange={handleAdvancedFilterChange('fechaHasta')}
                                    style={styles.filterInput}
                                />
                            </label>
                        </div>
                    </section>
                )}

                <div style={styles.tableWrap}>
                    <Table
                        data={users}
                        columns={columns}
                        filters={tableFilters}
                        initialSortName={'nombreCompleto'}
                        onSelectionChange={handleSelectionChange}
                    />
                </div>
            </section>

            <Popup show={isPopupOpen} setShow={setIsPopupOpen} data={dataUser} action={handleUpdate} />
            <UserDetailsModal show={isDetailsOpen} setShow={setIsDetailsOpen} user={selectedUser} />
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
        overflowX: 'auto',
        overflowY: 'hidden',
        borderRadius: '18px',
        border: '1px solid #e2e8f0',
        backgroundColor: '#ffffff',
        width: '100%',
        minWidth: 0,
        boxSizing: 'border-box',
    },
};

export default AdminUsers;