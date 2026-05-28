import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  Home,
  User,
  History,
  LogOut,
  Heart,
  MessageCircle,
  Bell,
  ShieldCheck,
  Users,
  FlagTriangleRight,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useAuth, AuthProvider } from '@context/AuthContext';
import slidebaar from '../assets/slidebaar.png';
import miLogo from '../assets/miLogo.png';

function Root() {
  return (
    <AuthProvider>
      <PageRoot />
    </AuthProvider>
  );
}

function PageRoot() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const userRole = (user?.rol || '').toString().toLowerCase();
  const userId = user?.id;
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [hoveredItem, setHoveredItem] = useState(null);

  const colores = {
    principal: '#008080',
    secundario: '#e6dfd3',
    textoOscuro: '#2c3e50',
    blanco: '#ffffff',
    grisSuave: '#f4f6f6',
  };

  const menus = {
    estudiante: {
      title: 'Menú',
      subtitle: 'Buscar, conversar y gestionar tus arriendos.',
      items: [
        { label: 'Buscar Arriendos', icon: Home, to: '/home' },
        { label: 'Mis Favoritos', icon: Heart, disabled: true },
        { label: 'Mensajes', icon: MessageCircle, disabled: true },
        { label: 'Historial de Arriendos', icon: History, to: '/historial' },
        { label: 'Mi Perfil', icon: User, to: '/profile' },
      ],
    },
    arrendador: {
      title: 'Menú',
      subtitle: 'Gestiona tus propiedades y responde interesados.',
      items: [
        { label: 'Mis Publicaciones', icon: Home, disabled: true },
        { label: 'Mensajes', icon: MessageCircle, disabled: true },
        { label: 'Historial de Arriendos', icon: History, to: '/historial' },
        { label: 'Mi Perfil', icon: User, to: userId ? `/perfil/${userId}` : '/perfil/0' },
      ],
    },
    administrador: {
      title: 'Menú',
      subtitle: 'Control y gestión de la plataforma.',
      items: [
        { label: 'Verificaciones Pendientes', icon: ShieldCheck, disabled: true },
        { label: 'Gestión de Usuarios', icon: Users, to: '/users' },
        { label: 'Publicaciones Reportadas', icon: FlagTriangleRight, disabled: true },
      ],
    },
  };

  const menu = menus[userRole] || menus.estudiante;

  const getSidebarItemStyle = ({ active = false, hovered = false, disabled = false }) => {
    const highlight = active || hovered;

    return {
      ...styles.linkMenu,
      backgroundColor: highlight ? 'rgba(255,255,255,0.16)' : disabled ? 'rgba(255,255,255,0.08)' : 'transparent',
      border: highlight ? '1px solid rgba(255,255,255,0.18)' : '1px solid transparent',
      boxShadow: highlight ? '0 10px 24px rgba(0,0,0,0.18)' : 'none',
      transform: highlight ? 'translateY(-1px)' : 'translateY(0)',
      transition: 'background-color 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease',
      opacity: disabled ? 0.6 : 1,
      cursor: disabled ? 'not-allowed' : 'pointer',
      justifyContent: isSidebarCollapsed ? 'center' : 'flex-start',
      padding: isSidebarCollapsed ? '12px 10px' : '12px',
    };
  };

  const renderMenuItem = (item) => {
    const Icon = item.icon;
    const hoverKey = item.label;

    if (item.disabled) {
      return (
        <button
          type="button"
          key={item.label}
          title="Próximamente"
          onClick={() => {}}
          onMouseEnter={() => setHoveredItem(hoverKey)}
          onMouseLeave={() => setHoveredItem(null)}
          style={getSidebarItemStyle({ hovered: hoveredItem === hoverKey, disabled: true })}
        >
          <Icon size={20} strokeWidth={2} />
          {!isSidebarCollapsed && <span>{item.label}</span>}
          {!isSidebarCollapsed && <span style={{ marginLeft: 'auto', fontSize: '11px', opacity: 0.8 }}>Próximamente</span>}
        </button>
      );
    }

    return (
      <NavLink
        key={item.label}
        to={item.to}
        onMouseEnter={() => setHoveredItem(hoverKey)}
        onMouseLeave={() => setHoveredItem(null)}
        style={({ isActive }) => getSidebarItemStyle({ active: isActive, hovered: hoveredItem === hoverKey })}
        end
      >
        <Icon size={20} strokeWidth={2} />
        {!isSidebarCollapsed && <span>{item.label}</span>}
      </NavLink>
    );
  };

  const handleLogout = () => {
    sessionStorage.removeItem('usuario');
    navigate('/auth');
  };

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', fontFamily: 'sans-serif' }}>
      <aside
        style={{
          width: isSidebarCollapsed ? '92px' : '280px',
          backgroundColor: colores.principal,
          color: colores.blanco,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '20px',
          boxShadow: '2px 0 16px rgba(0,0,0,0.08)',
          transition: 'transform 0.28s ease, width 0.28s ease',
          position: 'relative',
          zIndex: 30,
          overflow: 'hidden',
        }}
      >
        <div>
          <button
            type="button"
            onClick={() => setIsSidebarCollapsed((prev) => !prev)}
            aria-label={isSidebarCollapsed ? 'Expandir menú lateral' : 'Colapsar menú lateral'}
            style={{
              position: 'absolute',
              top: '12px',
              right: '12px',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '34px',
              height: '34px',
              borderRadius: '10px',
              border: 'none',
              backgroundColor: 'rgba(255,255,255,0.12)',
              color: colores.blanco,
              cursor: 'pointer',
            }}
          >
            {isSidebarCollapsed ? <ChevronRight size={18} strokeWidth={2.5} /> : <ChevronLeft size={18} strokeWidth={2.5} />}
          </button>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              marginBottom: '22px',
              padding: '10px 5px',
              justifyContent: isSidebarCollapsed ? 'center' : 'flex-start',
            }}
          >
            <img
              src={isSidebarCollapsed ? miLogo : slidebaar}
              alt="ArriendU Logo"
              style={{
                height: isSidebarCollapsed ? '44px' : '40px',
                width: 'auto',
                maxWidth: isSidebarCollapsed ? '44px' : '100%',
                objectFit: 'contain',
                display: 'block',
              }}
            />
          </div>

          <div style={{ marginBottom: '18px', padding: '0 5px', textAlign: 'center' }}>
            {!isSidebarCollapsed && (
              <>
                <h2 style={{ margin: '0 0 6px 0', fontSize: '18px', lineHeight: 1.2 }}>{menu.title}</h2>
                <p style={{ margin: 0, fontSize: '12px', lineHeight: 1.5, opacity: 0.85 }}>{menu.subtitle}</p>
              </>
            )}
          </div>

          <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {menu.items.map(renderMenuItem)}
          </nav>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <button
            type="button"
            title="Centro de notificaciones próximamente"
            onMouseEnter={() => setHoveredItem('notificaciones')}
            onMouseLeave={() => setHoveredItem(null)}
            style={getSidebarItemStyle({ hovered: hoveredItem === 'notificaciones', disabled: true })}
          >
            <Bell size={20} strokeWidth={2} />
            {!isSidebarCollapsed && <span>Centro de Notificaciones</span>}
          </button>

          <button
            onClick={handleLogout}
            onMouseEnter={() => setHoveredItem('logout')}
            onMouseLeave={() => setHoveredItem(null)}
            style={{
              ...styles.linkMenu,
              backgroundColor: hoveredItem === 'logout' ? 'rgba(255,138,138,0.14)' : 'transparent',
              border: hoveredItem === 'logout' ? '1px solid rgba(255,138,138,0.25)' : '1px solid transparent',
              boxShadow: hoveredItem === 'logout' ? '0 10px 24px rgba(0,0,0,0.14)' : 'none',
              transform: hoveredItem === 'logout' ? 'translateY(-1px)' : 'translateY(0)',
              transition: 'background-color 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease',
              color: '#ff8a8a',
              justifyContent: isSidebarCollapsed ? 'center' : 'flex-start',
            }}
          >
            <LogOut size={20} strokeWidth={2} />
            {!isSidebarCollapsed && <span>Cerrar Sesión</span>}
          </button>
        </div>
      </aside>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: colores.grisSuave }}>
        <header
          style={{
            height: '60px',
            backgroundColor: colores.blanco,
            borderBottom: '1px solid #e0e0e0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            padding: '0 30px 0 80px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                backgroundColor: colores.secundario,
                color: colores.textoOscuro,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 'bold',
                fontSize: '14px',
              }}
            >
              {(() => {
                const name = user?.nombreCompleto || '';
                return name.trim() ? name.trim().charAt(0).toUpperCase() : 'U';
              })()}
            </div>
            <span style={{ fontSize: '14px', fontWeight: '500', color: colores.textoOscuro }}>{user?.nombreCompleto || 'Usuario'}</span>
          </div>
        </header>

        <main style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}

const styles = {
  linkMenu: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    color: '#ffffff',
    textDecoration: 'none',
    padding: '12px',
    borderRadius: '8px',
    fontSize: '15px',
    fontWeight: '500',
    cursor: 'pointer',
  },
};

export default Root;
