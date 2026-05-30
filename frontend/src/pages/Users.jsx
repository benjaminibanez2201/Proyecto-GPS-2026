import Table from '@components/Table';
import useUsers from '@hooks/users/useGetUsers.jsx';
import Popup from '../components/Popup';
import UserDetailsModal from '@components/UserDetailsModal';
import DeleteIcon from '../assets/deleteIcon.svg';
import UpdateIcon from '../assets/updateIcon.svg';
import UpdateIconDisable from '../assets/updateIconDisabled.svg';
import DeleteIconDisable from '../assets/deleteIconDisabled.svg';
import { useCallback, useMemo, useState } from 'react';
import '@styles/users.css';
import useEditUser from '@hooks/users/useEditUser';
import useDeleteUser from '@hooks/users/useDeleteUser';

const Users = () => {
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
    setDataUser
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

  const columns = [
    { title: "Nombre", field: "nombreCompleto", minWidth: 240, widthGrow: 3, responsive: 0 },
    { title: "Correo electrónico", field: "email", minWidth: 240, widthGrow: 3, responsive: 3 },
    { title: "Rut", field: "rut", minWidth: 130, widthGrow: 1.2, responsive: 2 },
    { title: "Rol", field: "rol", minWidth: 130, widthGrow: 1, responsive: 2 },
    {
      title: "Estado",
      field: "estadoVerificacion",
      minWidth: 150,
      widthGrow: 1.2,
      responsive: 1,
      formatter: (cell) => {
        const value = cell.getValue();
        const normalized = (value || '').toString().toLowerCase();
        const colors = {
          aprobado: '#0f766e',
          pendiente: '#b45309',
          rechazado: '#b91c1c'
        };

        return `<span style="display:inline-flex;align-items:center;gap:6px;padding:4px 10px;border-radius:999px;background:${colors[normalized] || '#334155'}1a;color:${colors[normalized] || '#334155'};font-weight:700;font-size:12px;">${value || 'Pendiente'}</span>`;
      },
    },
    { title: "Creado", field: "createdAt", minWidth: 120, widthGrow: 1, responsive: 2 },
    {
      title: "Ver",
      headerSort: false,
      hozAlign: "center",
      width: 80,
      minWidth: 80,
      maxWidth: 80,
      responsive: 0,
      formatter: () => '<button type="button" class="table-view-button">Ver</button>',
      cellClick: (e, cell) => handleViewUser(cell.getRow().getData()),
    },
  ];

  return (
    <div className='main-container'>
      <div className='table-container'>
        <div className='top-table'>
          <h1 className='title-table'>Usuarios</h1>
          <div className='filter-actions'>
            <button type="button" onClick={() => setAdvancedFiltersEnabled((current) => !current)}>
              {advancedFiltersEnabled ? 'Ocultar filtros avanzados' : 'Mostrar filtros avanzados'}
            </button>
            <button onClick={handleClickUpdate} disabled={dataUser.length === 0}>
              {dataUser.length === 0 ? (
                <img src={UpdateIconDisable} alt="edit-disabled" />
              ) : (
                <img src={UpdateIcon} alt="edit" />
              )}
            </button>
            <button className='delete-user-button' disabled={dataUser.length === 0} onClick={() => handleDelete(dataUser)}>
              {dataUser.length === 0 ? (
                <img src={DeleteIconDisable} alt="delete-disabled" />
              ) : (
                <img src={DeleteIcon} alt="delete" />
              )}
            </button>
          </div>
        </div>

        {advancedFiltersEnabled && (
          <section style={advancedFiltersPanelStyle}>
            <div style={advancedFiltersHeaderStyle}>
              <div>
                <p style={advancedFiltersEyebrowStyle}>Filtros avanzados</p>
                <p style={advancedFiltersSubtitleStyle}>Todos los campos comienzan vacíos y solo filtran cuando los completas.</p>
              </div>
              <button type="button" onClick={clearAdvancedFilters} style={clearFiltersButtonStyle}>
                Limpiar filtros
              </button>
            </div>

            <div style={advancedFiltersGridStyle}>
              <label style={filterFieldStyle}>
                <span style={filterLabelStyle}>Nombre</span>
                <input type="text" value={advancedFilters.nombreCompleto} onChange={handleAdvancedFilterChange('nombreCompleto')} placeholder="Buscar por nombre" style={filterInputStyle} />
              </label>

              <label style={filterFieldStyle}>
                <span style={filterLabelStyle}>RUT</span>
                <input type="text" value={advancedFilters.rut} onChange={handleAdvancedFilterChange('rut')} placeholder="Buscar por RUT" style={filterInputStyle} />
              </label>

              <label style={filterFieldStyle}>
                <span style={filterLabelStyle}>Rol</span>
                <select value={advancedFilters.rol} onChange={handleAdvancedFilterChange('rol')} style={filterInputStyle}>
                  <option value="">Todos</option>
                  <option value="admin">Admin</option>
                  <option value="estudiante">Estudiante</option>
                  <option value="arrendador">Arrendador</option>
                </select>
              </label>

              <label style={filterFieldStyle}>
                <span style={filterLabelStyle}>Estado</span>
                <select value={advancedFilters.estadoVerificacion} onChange={handleAdvancedFilterChange('estadoVerificacion')} style={filterInputStyle}>
                  <option value="">Todos</option>
                  <option value="aprobado">Aprobado</option>
                  <option value="pendiente">Pendiente</option>
                  <option value="rechazado">Rechazado</option>
                </select>
              </label>

              <label style={filterFieldStyle}>
                <span style={filterLabelStyle}>Fecha desde</span>
                <input type="date" value={advancedFilters.fechaDesde} onChange={handleAdvancedFilterChange('fechaDesde')} style={filterInputStyle} />
              </label>

              <label style={filterFieldStyle}>
                <span style={filterLabelStyle}>Fecha hasta</span>
                <input type="date" value={advancedFilters.fechaHasta} onChange={handleAdvancedFilterChange('fechaHasta')} style={filterInputStyle} />
              </label>
            </div>
          </section>
        )}

        <Table
          data={users}
          columns={columns}
          filters={tableFilters}
          initialSortName={'nombreCompleto'}
          onSelectionChange={handleSelectionChange}
        />
      </div>
      <Popup show={isPopupOpen} setShow={setIsPopupOpen} data={dataUser} action={handleUpdate} />
      <UserDetailsModal show={isDetailsOpen} setShow={setIsDetailsOpen} user={selectedUser} />
    </div>
  );
};

const advancedFiltersPanelStyle = {
  marginBottom: '16px',
  padding: '18px',
  borderRadius: '18px',
  backgroundColor: '#f8fafc',
  border: '1px solid #e2e8f0',
};

const advancedFiltersHeaderStyle = {
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  gap: '12px',
  marginBottom: '14px',
};

const advancedFiltersEyebrowStyle = {
  margin: '0 0 6px',
  fontSize: '12px',
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
  color: '#008080',
};

const advancedFiltersSubtitleStyle = {
  margin: 0,
  color: '#64748b',
  fontSize: '14px',
  lineHeight: 1.5,
};

const advancedFiltersGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
  gap: '12px',
};

const filterFieldStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '6px',
};

const filterLabelStyle = {
  fontSize: '12px',
  fontWeight: 700,
  color: '#334155',
};

const filterInputStyle = {
  width: '100%',
  boxSizing: 'border-box',
  borderRadius: '12px',
  border: '1px solid #cbd5e1',
  padding: '10px 12px',
  backgroundColor: '#ffffff',
  color: '#0f172a',
  outline: 'none',
};

const clearFiltersButtonStyle = {
  border: '1px solid #cbd5e1',
  borderRadius: '10px',
  padding: '10px 14px',
  backgroundColor: '#ffffff',
  color: '#0f172a',
  fontWeight: 700,
};

export default Users;