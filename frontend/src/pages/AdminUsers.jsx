import { useCallback, useEffect, useMemo, useState } from 'react';
import {
    CalendarDays,
    ClipboardList,
    Eye,
    Mail,
    Pencil,
    ShieldCheck,
    SlidersHorizontal,
    Trash2,
    UserRound,
} from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import Popup from '@components/Popup';
import UserDetailsModal from '@components/UserDetailsModal';
import useUsers from '@hooks/users/useGetUsers.jsx';
import useEditUser from '@hooks/users/useEditUser';
import useDeleteUser from '@hooks/users/useDeleteUser';
import { updateUserVerificationStatus } from '@services/user.service.js';
import { formatPostUpdate } from '@helpers/formatData.js';
import { showErrorAlert, showSuccessAlert } from '@helpers/sweetAlert.js';
import '@styles/users.css';

const verificationStatusOptions = ['todos', 'pendiente', 'aprobado', 'rechazado'];
const verifiableRoles = ['estudiante', 'arrendador'];
const usersPerPage = 6;

const normalize = (value) => (value ?? '').toString().trim().toLowerCase();
const titleCase = (value) => {
    const text = String(value || '').trim();
    return text ? text.charAt(0).toUpperCase() + text.slice(1).toLowerCase() : 'Pendiente';
};

const getStatusTone = (status) => {
    const normalized = normalize(status || 'pendiente');
    const tones = {
        aprobado: {
            backgroundColor: '#e7f6f2',
            borderColor: '#b7d9d6',
            color: '#0f766e',
        },
        pendiente: {
            backgroundColor: '#fff4e8',
            borderColor: '#f6d5ac',
            color: '#b45309',
        },
        rechazado: {
            backgroundColor: '#fdecec',
            borderColor: '#f7c7c7',
            color: '#b91c1c',
        },
    };

    return tones[normalized] || {
        backgroundColor: '#eef2f6',
        borderColor: '#d8e4e7',
        color: '#475569',
    };
};

const AdminUsers = () => {
    const { users, fetchUsers, setUsers } = useUsers();
    const [searchParams, setSearchParams] = useSearchParams();
    const [verificationFilter, setVerificationFilter] = useState(() => {
        const statusFromUrl = normalize(searchParams.get('estado'));
        return verificationStatusOptions.includes(statusFromUrl) ? statusFromUrl : 'pendiente';
    });
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
    const [currentPage, setCurrentPage] = useState(1);

    const {
        handleClickUpdate,
        handleUpdate,
        isPopupOpen,
        setIsPopupOpen,
        dataUser,
        setDataUser,
    } = useEditUser(setUsers);

    const { handleDelete } = useDeleteUser(fetchUsers, setDataUser);

    const handleViewUser = useCallback((userData) => {
        setSelectedUser(userData);
        setIsDetailsOpen(true);
    }, []);

    useEffect(() => {
        const statusFromUrl = normalize(searchParams.get('estado'));

        if (verificationStatusOptions.includes(statusFromUrl)) {
            setVerificationFilter(statusFromUrl);
        }
    }, [searchParams]);

    const handleVerificationFilterChange = useCallback((status) => {
        setVerificationFilter(status);
        setSearchParams({ estado: status });
        setDataUser([]);
        setCurrentPage(1);
    }, [setDataUser, setSearchParams]);

    const handleVerificationAction = useCallback(async (targetUser, payload) => {
        const updatedUser = await updateUserVerificationStatus(targetUser.rut, payload);

        if (!updatedUser?.id) {
            const errorMessage = updatedUser?.details || updatedUser?.message || 'No se pudo actualizar la revision';
            showErrorAlert('Revision no actualizada', errorMessage);
            throw new Error(errorMessage);
        }

        const formattedUser = formatPostUpdate(updatedUser);
        setUsers((prevUsers) => prevUsers.map((currentUser) => (
            currentUser.id === formattedUser.id ? formattedUser : currentUser
        )));
        setSelectedUser(formattedUser);

        const requiresEmail = payload.estadoVerificacion !== 'pendiente' || Boolean(payload.solicitudAntecedentes);
        let actionMessage = 'La revision fue guardada correctamente.';

        if (requiresEmail && updatedUser.avisoCorreoEnviado === false) {
            actionMessage = 'La revision se guardo, pero no se pudo enviar el correo automaticamente.';
        } else if (payload.estadoVerificacion === 'aprobado') {
            actionMessage = 'La cuenta fue aprobada y se aviso al usuario.';
        } else if (payload.estadoVerificacion === 'rechazado') {
            actionMessage = 'La cuenta fue rechazada con comentario y se aviso al usuario.';
        } else if (payload.solicitudAntecedentes) {
            actionMessage = 'Se solicito antecedentes adicionales por correo.';
        }

        showSuccessAlert('Revision actualizada', actionMessage);
        return formattedUser;
    }, [setUsers]);

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

    const verificationCounts = useMemo(() => {
        const initialCounts = {
            todos: users.length,
            pendiente: 0,
            aprobado: 0,
            rechazado: 0,
        };

        return users.reduce((counts, currentUser) => {
            const role = normalize(currentUser.rol);
            const status = normalize(currentUser.estadoVerificacion || 'pendiente');

            if (verifiableRoles.includes(role) && counts[status] !== undefined) {
                counts[status] += 1;
            }

            return counts;
        }, initialCounts);
    }, [users]);

    const visibleUsers = useMemo(() => {
        if (verificationFilter === 'todos') return users;

        return users.filter((currentUser) => (
            verifiableRoles.includes(normalize(currentUser.rol))
            && normalize(currentUser.estadoVerificacion || 'pendiente') === verificationFilter
        ));
    }, [users, verificationFilter]);

    const filteredUsers = useMemo(() => {
        if (!advancedFiltersEnabled || activeFiltersCount === 0) return visibleUsers;

        const matchesText = (value, query) => !normalize(query) || normalize(value).includes(normalize(query));
        const matchesSelect = (value, expected) => !normalize(expected) || normalize(value) === normalize(expected);
        const parseDate = (value) => {
            if (!value) return null;
            const parsed = new Date(value);
            if (!Number.isNaN(parsed.getTime())) return parsed;

            const parts = String(value).split('-');
            if (parts.length === 3) {
                const fallback = new Date(`${parts[2]}-${parts[1]}-${parts[0]}T00:00:00`);
                return Number.isNaN(fallback.getTime()) ? null : fallback;
            }

            return null;
        };

        const createdFrom = advancedFilters.fechaDesde ? new Date(`${advancedFilters.fechaDesde}T00:00:00`) : null;
        const createdTo = advancedFilters.fechaHasta ? new Date(`${advancedFilters.fechaHasta}T23:59:59.999`) : null;

        return visibleUsers.filter((currentUser) => {
            const rowDate = parseDate(currentUser.createdAtRaw || currentUser.createdAt);
            const matchesFrom = !createdFrom || (rowDate ? rowDate >= createdFrom : false);
            const matchesTo = !createdTo || (rowDate ? rowDate <= createdTo : false);

            return (
                matchesText(currentUser.nombreCompleto, advancedFilters.nombreCompleto)
                && matchesText(currentUser.rut, advancedFilters.rut)
                && matchesSelect(currentUser.rol, advancedFilters.rol)
                && matchesSelect(currentUser.estadoVerificacion, advancedFilters.estadoVerificacion)
                && matchesFrom
                && matchesTo
            );
        });
    }, [activeFiltersCount, advancedFilters, advancedFiltersEnabled, visibleUsers]);

    const sortedUsers = useMemo(() => {
        const parseTime = (value) => {
            const parsed = new Date(value);
            return Number.isNaN(parsed.getTime()) ? 0 : parsed.getTime();
        };

        return [...filteredUsers].sort((firstUser, secondUser) => {
            const dateDiff = parseTime(secondUser.createdAtRaw) - parseTime(firstUser.createdAtRaw);
            if (dateDiff !== 0) return dateDiff;

            return String(firstUser.nombreCompleto || '').localeCompare(String(secondUser.nombreCompleto || ''), 'es');
        });
    }, [filteredUsers]);

    const pageCount = Math.max(1, Math.ceil(sortedUsers.length / usersPerPage));
    const paginatedUsers = useMemo(() => {
        const start = (currentPage - 1) * usersPerPage;
        return sortedUsers.slice(start, start + usersPerPage);
    }, [currentPage, sortedUsers]);

    const selectedUserIds = useMemo(() => new Set(dataUser.map((currentUser) => currentUser.id)), [dataUser]);
    const areAllPageUsersSelected = paginatedUsers.length > 0 && paginatedUsers.every((currentUser) => selectedUserIds.has(currentUser.id));

    useEffect(() => {
        setCurrentPage(1);
    }, [advancedFilters, advancedFiltersEnabled, verificationFilter]);

    useEffect(() => {
        setCurrentPage((page) => Math.min(page, pageCount));
    }, [pageCount]);

    const handleToggleUserSelection = useCallback((userData) => {
        setDataUser((currentSelection) => {
            const isSelected = currentSelection.some((currentUser) => currentUser.id === userData.id);
            if (isSelected) {
                return currentSelection.filter((currentUser) => currentUser.id !== userData.id);
            }

            return [...currentSelection, userData];
        });
    }, [setDataUser]);

    const handleTogglePageSelection = useCallback((event) => {
        const shouldSelect = event.target.checked;
        const pageUserIds = new Set(paginatedUsers.map((currentUser) => currentUser.id));

        setDataUser((currentSelection) => {
            if (!shouldSelect) {
                return currentSelection.filter((currentUser) => !pageUserIds.has(currentUser.id));
            }

            const existingIds = new Set(currentSelection.map((currentUser) => currentUser.id));
            const usersToAdd = paginatedUsers.filter((currentUser) => !existingIds.has(currentUser.id));

            return [...currentSelection, ...usersToAdd];
        });
    }, [paginatedUsers, setDataUser]);

    const paginationPages = useMemo(() => (
        Array.from({ length: pageCount }, (_, index) => index + 1)
    ), [pageCount]);

    const colores = {
        principal: '#008080',
        secundario: '#e6dfd3',
        textoOscuro: '#2c3e50',
        blanco: '#ffffff',
        grisSuave: '#f4f6f6',
    };

    return (
        <div style={styles.page}>
            <section style={styles.contentCard}>
                <header style={styles.cardHeader}>
                    <div>
                        <p style={{ ...styles.cardEyebrow, color: colores.principal }}>Administración</p>
                        <h3 style={styles.cardTitle}>Listado de usuarios</h3>
                        <p style={styles.cardSubtitle}>
                            Revisa verificaciones, selecciona usuarios y aplica acciones cuando sea necesario.
                        </p>
                    </div>

                    <div style={styles.cardIcon} aria-hidden="true">
                        <ClipboardList size={18} strokeWidth={2.1} />
                    </div>
                </header>

                <div style={styles.verificationTabs}>
                    {verificationStatusOptions.map((status) => {
                        const isActive = verificationFilter === status;
                        const label = status === 'todos' ? 'Todos' : status.charAt(0).toUpperCase() + status.slice(1);
                        const count = verificationCounts[status] ?? 0;

                        return (
                            <button
                                key={status}
                                type="button"
                                onClick={() => handleVerificationFilterChange(status)}
                                style={{
                                    ...styles.verificationTab,
                                    ...(isActive ? styles.verificationTabActive : {}),
                                }}
                            >
                                <span>{label}</span>
                                <strong
                                    style={{
                                        ...styles.verificationCount,
                                        ...(isActive ? styles.verificationCountActive : {}),
                                    }}
                                >
                                    {count}
                                </strong>
                            </button>
                        );
                    })}
                </div>

                <div style={styles.toolbar}>
                    <div style={styles.toolbarStatus}>
                        <span style={styles.toolbarDot} />
                        <span>{filteredUsers.length} visibles</span>
                        <span style={styles.toolbarDivider} />
                        <span>{dataUser.length} seleccionados</span>
                    </div>

                    <div style={styles.actionButtons}>
                        <button type="button" onClick={() => setAdvancedFiltersEnabled((current) => !current)} style={styles.actionButton}>
                            <SlidersHorizontal size={15} strokeWidth={2.2} />
                            <span>{advancedFiltersEnabled ? 'Ocultar filtros' : 'Filtros avanzados'}</span>
                            {activeFiltersCount > 0 && <strong style={styles.actionBadge}>{activeFiltersCount}</strong>}
                        </button>
                        <button
                            type="button"
                            onClick={handleClickUpdate}
                            disabled={dataUser.length === 0}
                            style={{
                                ...styles.actionButton,
                                ...(dataUser.length === 0 ? styles.actionButtonDisabled : {}),
                            }}
                        >
                            <Pencil size={15} strokeWidth={2.2} />
                            <span>Editar</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => handleDelete(dataUser)}
                            disabled={dataUser.length === 0}
                            style={{
                                ...styles.actionButton,
                                ...styles.deleteButton,
                                ...(dataUser.length === 0 ? styles.actionButtonDisabled : {}),
                            }}
                        >
                            <Trash2 size={15} strokeWidth={2.2} />
                            <span>Eliminar</span>
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

                <section style={styles.userListShell}>
                    <header style={styles.userListHeader}>
                        <label style={styles.selectPageControl}>
                            <input
                                type="checkbox"
                                checked={areAllPageUsersSelected}
                                disabled={paginatedUsers.length === 0}
                                onChange={handleTogglePageSelection}
                                style={styles.checkboxInput}
                            />
                            <span>Seleccionar página</span>
                        </label>
                        <span style={styles.listRange}>
                            {filteredUsers.length === 0
                                ? 'Sin usuarios'
                                : `${((currentPage - 1) * usersPerPage) + 1}-${Math.min(currentPage * usersPerPage, filteredUsers.length)} de ${filteredUsers.length}`}
                        </span>
                    </header>

                    <div style={styles.userList}>
                        {paginatedUsers.length === 0 ? (
                            <div style={styles.emptyList}>
                                <ShieldCheck size={22} strokeWidth={2} />
                                <span>No hay usuarios que coincidan con este filtro.</span>
                            </div>
                        ) : paginatedUsers.map((currentUser) => {
                            const isSelected = selectedUserIds.has(currentUser.id);
                            const statusTone = getStatusTone(currentUser.estadoVerificacion);
                            const initials = String(currentUser.nombreCompleto || 'U')
                                .trim()
                                .split(/\s+/)
                                .slice(0, 2)
                                .map((part) => part.charAt(0).toUpperCase())
                                .join('') || 'U';

                            return (
                                <article
                                    key={currentUser.id}
                                    style={{
                                        ...styles.userListRow,
                                        ...(isSelected ? styles.userListRowSelected : {}),
                                    }}
                                >
                                    <label style={styles.rowSelection}>
                                        <input
                                            type="checkbox"
                                            checked={isSelected}
                                            onChange={() => handleToggleUserSelection(currentUser)}
                                            style={styles.checkboxInput}
                                            aria-label={`Seleccionar ${currentUser.nombreCompleto}`}
                                        />
                                    </label>

                                    <div style={styles.userAvatar} aria-hidden="true">{initials}</div>

                                    <div style={styles.userMain}>
                                        <strong style={styles.userName}>{currentUser.nombreCompleto || 'Sin nombre'}</strong>
                                        <span style={styles.userEmail}>
                                            <Mail size={14} strokeWidth={2} />
                                            {currentUser.email || 'Sin correo registrado'}
                                        </span>
                                    </div>

                                    <div style={styles.userMeta}>
                                        <span style={styles.metaChip}>
                                            <UserRound size={13} strokeWidth={2} />
                                            {currentUser.rol || 'Sin rol'}
                                        </span>
                                        <span style={styles.metaChip}>{currentUser.rut || 'Sin RUT'}</span>
                                        <span style={styles.metaChip}>
                                            <CalendarDays size={13} strokeWidth={2} />
                                            {currentUser.createdAt || 'Sin fecha'}
                                        </span>
                                    </div>

                                    <span style={{ ...styles.statusPill, ...statusTone }}>
                                        {titleCase(currentUser.estadoVerificacion)}
                                    </span>

                                    <button
                                        type="button"
                                        onClick={() => handleViewUser(currentUser)}
                                        style={styles.reviewButton}
                                    >
                                        <Eye size={15} strokeWidth={2.2} />
                                        <span>Ver</span>
                                    </button>
                                </article>
                            );
                        })}
                    </div>

                    {filteredUsers.length > usersPerPage && (
                        <footer style={styles.paginationBar}>
                            <button
                                type="button"
                                onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                                disabled={currentPage === 1}
                                style={{
                                    ...styles.paginationButton,
                                    ...(currentPage === 1 ? styles.paginationButtonDisabled : {}),
                                }}
                            >
                                Anterior
                            </button>

                            <div style={styles.paginationPages}>
                                {paginationPages.map((page) => (
                                    <button
                                        key={page}
                                        type="button"
                                        onClick={() => setCurrentPage(page)}
                                        style={{
                                            ...styles.paginationNumber,
                                            ...(currentPage === page ? styles.paginationNumberActive : {}),
                                        }}
                                    >
                                        {page}
                                    </button>
                                ))}
                            </div>

                            <button
                                type="button"
                                onClick={() => setCurrentPage((page) => Math.min(pageCount, page + 1))}
                                disabled={currentPage === pageCount}
                                style={{
                                    ...styles.paginationButton,
                                    ...(currentPage === pageCount ? styles.paginationButtonDisabled : {}),
                                }}
                            >
                                Siguiente
                            </button>
                        </footer>
                    )}
                </section>
            </section>

            <Popup show={isPopupOpen} setShow={setIsPopupOpen} data={dataUser} action={handleUpdate} />
            <UserDetailsModal
                show={isDetailsOpen}
                setShow={setIsDetailsOpen}
                user={selectedUser}
                onVerificationAction={handleVerificationAction}
            />
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
    contentCard: {
        borderRadius: '16px',
        padding: '20px',
        backgroundColor: '#fbfdfd',
        border: '1px solid #d8e4e7',
        boxShadow: 'none',
        width: '100%',
        minWidth: 0,
        boxSizing: 'border-box',
    },
    cardHeader: {
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: '12px',
        marginBottom: '14px',
    },
    cardEyebrow: {
        margin: '0 0 6px',
        fontSize: '12px',
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0,
    },
    cardTitle: {
        margin: '0 0 5px',
        fontSize: '20px',
        lineHeight: 1.2,
        color: '#0f172a',
    },
    cardSubtitle: {
        margin: 0,
        fontSize: '14px',
        lineHeight: 1.5,
        color: '#64748b',
        maxWidth: '58ch',
    },
    cardIcon: {
        width: '38px',
        height: '38px',
        borderRadius: '12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        backgroundColor: '#eef7f5',
        color: '#008080',
    },
    toolbar: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
        flexWrap: 'wrap',
        marginBottom: '16px',
        padding: '2px 0 0',
    },
    toolbarStatus: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: '9px',
        color: '#64748b',
        fontSize: '13px',
        fontWeight: '600',
        minHeight: '36px',
    },
    toolbarDot: {
        width: '7px',
        height: '7px',
        borderRadius: '999px',
        backgroundColor: '#0f766e',
    },
    toolbarDivider: {
        width: '1px',
        height: '16px',
        backgroundColor: '#d8e4e7',
    },
    verificationTabs: {
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: '8px',
        paddingBottom: '12px',
        marginBottom: '12px',
        borderBottom: '1px solid #e4ecef',
    },
    verificationTab: {
        minHeight: '34px',
        border: '1px solid transparent',
        borderRadius: '999px',
        padding: '7px 10px 7px 12px',
        backgroundColor: 'transparent',
        color: '#475569',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        cursor: 'pointer',
        fontWeight: '700',
        lineHeight: 1,
    },
    verificationTabActive: {
        borderColor: '#b7d9d6',
        backgroundColor: '#eef8f6',
        color: '#0f766e',
        boxShadow: 'none',
    },
    verificationCount: {
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: '22px',
        height: '20px',
        borderRadius: '999px',
        padding: '0 6px',
        backgroundColor: '#eef2f6',
        color: '#475569',
        fontSize: '12px',
        fontWeight: '800',
        lineHeight: 1,
    },
    verificationCountActive: {
        backgroundColor: '#ffffff',
        color: '#0f766e',
    },
    actionButtons: {
        display: 'flex',
        gap: '8px',
        flexWrap: 'wrap',
        marginLeft: 'auto',
    },
    advancedFiltersPanel: {
        marginBottom: '16px',
        padding: '16px',
        borderRadius: '14px',
        backgroundColor: '#ffffff',
        border: '1px solid #d8e4e7',
    },
    advancedFiltersHeader: {
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: '12px',
        marginBottom: '12px',
    },
    advancedFiltersGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '10px',
    },
    filterField: {
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
    },
    filterLabel: {
        fontSize: '12px',
        fontWeight: '700',
        color: '#475569',
    },
    filterInput: {
        width: '100%',
        boxSizing: 'border-box',
        borderRadius: '10px',
        border: '1px solid #d1dde1',
        padding: '9px 11px',
        backgroundColor: '#ffffff',
        color: '#0f172a',
        outline: 'none',
    },
    clearFiltersButton: {
        border: '1px solid #d1dde1',
        borderRadius: '999px',
        padding: '8px 12px',
        backgroundColor: '#ffffff',
        color: '#0f766e',
        fontWeight: '700',
    },
    actionButton: {
        minHeight: '36px',
        border: '1px solid #c8d9dd',
        borderRadius: '999px',
        padding: '8px 12px',
        backgroundColor: '#ffffff',
        color: '#0f766e',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '7px',
        fontWeight: '700',
        cursor: 'pointer',
        lineHeight: 1,
        boxShadow: 'none',
    },
    actionBadge: {
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: '19px',
        height: '19px',
        borderRadius: '999px',
        padding: '0 5px',
        backgroundColor: '#0f766e',
        color: '#ffffff',
        fontSize: '11px',
        lineHeight: 1,
    },
    actionButtonDisabled: {
        opacity: 0.46,
        cursor: 'not-allowed',
        filter: 'grayscale(0.15)',
    },
    deleteButton: {
        borderColor: '#f2c8c8',
        backgroundColor: '#fffafa',
        color: '#b42323',
    },
    userListShell: {
        borderRadius: '14px',
        border: '1px solid #d8e4e7',
        backgroundColor: '#ffffff',
        overflow: 'hidden',
    },
    userListHeader: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
        padding: '12px 14px',
        borderBottom: '1px solid #e5edf0',
        backgroundColor: '#f8fbfb',
    },
    selectPageControl: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: '9px',
        color: '#334155',
        fontSize: '13px',
        fontWeight: '700',
        cursor: 'pointer',
    },
    checkboxInput: {
        width: '15px',
        height: '15px',
        accentColor: '#0f766e',
        cursor: 'pointer',
    },
    listRange: {
        color: '#64748b',
        fontSize: '12px',
        fontWeight: '700',
    },
    userList: {
        display: 'flex',
        flexDirection: 'column',
    },
    emptyList: {
        minHeight: '150px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '10px',
        color: '#64748b',
        fontSize: '14px',
        fontWeight: '700',
        textAlign: 'center',
        padding: '24px',
    },
    userListRow: {
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: '12px',
        padding: '13px 14px',
        borderBottom: '1px solid #e8eff2',
        backgroundColor: '#ffffff',
    },
    userListRowSelected: {
        backgroundColor: '#f1faf8',
    },
    rowSelection: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
    userAvatar: {
        width: '36px',
        height: '36px',
        borderRadius: '999px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#eef7f5',
        color: '#0f766e',
        fontSize: '12px',
        fontWeight: '800',
        border: '1px solid #d8e4e7',
    },
    userMain: {
        minWidth: 0,
        flex: '1 1 210px',
        display: 'flex',
        flexDirection: 'column',
        gap: '5px',
    },
    userName: {
        minWidth: 0,
        color: '#0f172a',
        fontSize: '14px',
        lineHeight: 1.25,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
    },
    userEmail: {
        minWidth: 0,
        display: 'inline-flex',
        alignItems: 'center',
        gap: '5px',
        color: '#64748b',
        fontSize: '12px',
        lineHeight: 1.25,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
    },
    userMeta: {
        minWidth: 0,
        flex: '1 1 220px',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        flexWrap: 'wrap',
    },
    metaChip: {
        minHeight: '24px',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '5px',
        borderRadius: '999px',
        padding: '4px 8px',
        backgroundColor: '#f4f7f8',
        color: '#475569',
        fontSize: '12px',
        fontWeight: '700',
        lineHeight: 1,
    },
    statusPill: {
        minHeight: '26px',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: '1px solid',
        borderRadius: '999px',
        padding: '5px 10px',
        fontSize: '12px',
        fontWeight: '800',
        lineHeight: 1,
        whiteSpace: 'nowrap',
    },
    reviewButton: {
        minHeight: '34px',
        marginLeft: 'auto',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '6px',
        border: '1px solid #b7d9d6',
        borderRadius: '999px',
        padding: '7px 11px',
        backgroundColor: '#eef8f6',
        color: '#0f766e',
        fontSize: '13px',
        fontWeight: '800',
        cursor: 'pointer',
    },
    paginationBar: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        flexWrap: 'wrap',
        padding: '12px 14px',
        borderTop: '1px solid #e5edf0',
        backgroundColor: '#ffffff',
    },
    paginationPages: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: '5px',
    },
    paginationButton: {
        minHeight: '32px',
        border: '1px solid #d8e4e7',
        borderRadius: '999px',
        padding: '7px 12px',
        backgroundColor: '#ffffff',
        color: '#475569',
        fontWeight: '700',
        cursor: 'pointer',
    },
    paginationButtonDisabled: {
        opacity: 0.42,
        cursor: 'not-allowed',
    },
    paginationNumber: {
        width: '32px',
        height: '32px',
        border: '1px solid #d8e4e7',
        borderRadius: '999px',
        backgroundColor: '#ffffff',
        color: '#475569',
        fontWeight: '800',
        cursor: 'pointer',
    },
    paginationNumberActive: {
        backgroundColor: '#0f766e',
        borderColor: '#0f766e',
        color: '#ffffff',
    },
    tableWrap: {
        overflowX: 'auto',
        overflowY: 'hidden',
        borderRadius: '14px',
        border: 'none',
        backgroundColor: 'transparent',
        width: '100%',
        minWidth: 0,
        boxSizing: 'border-box',
    },
};

export default AdminUsers;
