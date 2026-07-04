
import { useCallback, useEffect, useState } from 'react';

import { NavLink, useLocation, useNavigate, useOutlet } from 'react-router-dom';
import {
  Home,
  User,
  History,
  LogOut,
  Heart,
  MessageCircle,
  Bell,
  Users,
  FlagTriangleRight,
  ChevronLeft,
  ChevronRight,
  HelpCircle,
  Compass,
  X,
  ShieldCog,
} from 'lucide-react';
import PageTransition from '@components/PageTransition';
import { useAuth, AuthProvider } from '@context/AuthContext';
import { obtenerCantidadNotificacionesNoLeidas } from '@services/notificacion.service.js';
import { obtenerConversaciones } from '@services/mensaje.service.js';
import AvatarCirculo from '@components/AvatarCirculo.jsx';
import SpotlightTour from '@components/SpotlightTour.jsx';
import FaqModal from '@components/FaqModal.jsx';
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
  const location = useLocation();
  const outlet = useOutlet();
  const { user } = useAuth();
  const userRole = (user?.rol || '').toString().toLowerCase();
  const normalizedRole = userRole === 'admin' ? 'administrador' : userRole;
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [hoveredItem, setHoveredItem] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
  const [tourActive, setTourActive] = useState(false);
  const [showHelpMenu, setShowHelpMenu] = useState(false);
  const [showFaq, setShowFaq] = useState(false);

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
        { label: 'Buscar Arriendos', icon: Home, to: '/buscar' },
        { label: 'Mis Favoritos', icon: Heart, to: '/favoritos' },
        { label: 'Mensajes', icon: MessageCircle, to: '/mensajes' },
        { label: 'Historial de Arriendos', icon: History, to: '/historial' },
        { label: 'Mi Perfil', icon: User, to: '/profile' }, 
      ],
    },
    arrendador: {
      title: 'Menú',
      subtitle: 'Gestiona tus propiedades y responde interesados.',
      items: [
        { label: 'Mis Publicaciones', icon: Home, to: '/mis-publicaciones' },
        { label: 'Mensajes', icon: MessageCircle, to: '/mensajes' },
        { label: 'Historial de Arriendos', icon: History, to: '/historial' },
        { label: 'Mi Perfil', icon: User, to: '/profile' },
      ],
    },
    administrador: {
      title: 'Menú',
      subtitle: 'Control y gestión de la plataforma.',
      items: [
        { label: 'Panel Administrador', icon: Home, to: '/admin' },
        { label: 'Gestión de Usuarios', icon: Users, to: '/admin/users?estado=todos' },
        { label: 'Publicaciones Reportadas', icon: FlagTriangleRight, to: '/admin/reportes' },
        { label: 'Auditoría', icon: ShieldCog, to: '/admin/auditoria' },
      ],
    },
  };

  const menu = menus[normalizedRole] || menus.estudiante;
  const unreadMessagesBadge = menu.items.some((item) => item.label === 'Mensajes') ? unreadMessagesCount : 0;
  const handleBannerClick = () => {
    const destination = normalizedRole === 'administrador' ? '/admin' : '/home';
    if (location.pathname === destination) return;
    navigate(destination);
  };

  const getSidebarItemStyle = ({ active = false, hovered = false, disabled = false, current = false }) => {
    const highlight = active || hovered;

    return {
      ...styles.linkMenu,
      backgroundColor: highlight ? 'rgba(255,255,255,0.16)' : disabled ? 'rgba(255,255,255,0.08)' : 'transparent',
      border: highlight ? '1px solid rgba(255,255,255,0.18)' : '1px solid transparent',
      boxShadow: highlight ? '0 10px 24px rgba(0,0,0,0.18)' : 'none',
      transform: highlight ? 'translateY(-1px)' : 'translateY(0)',
      transition: 'background-color 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease',
      opacity: disabled ? 0.6 : 1,
      cursor: disabled ? 'not-allowed' : current ? 'default' : 'pointer',
      justifyContent: isSidebarCollapsed ? 'center' : 'flex-start',
      padding: isSidebarCollapsed ? '12px 10px' : '12px',
    };
  };

  const getPathnameFromTo = (to) => {
    const [pathname] = String(to || '').split('?');
    return pathname.startsWith('/') ? pathname : `/${pathname}`;
  };

  const isSidebarItemCurrent = (item) => {
    if (!item?.to) return false;

    if (item.to.startsWith('/admin/users')) {
      return location.pathname === '/admin/users';
    }

    return location.pathname === getPathnameFromTo(item.to);
  };

  const preventCurrentSectionNavigation = (event, item) => {
    if (isSidebarItemCurrent(item)) {
      event.preventDefault();
    }
  };

  const isSidebarItemActive = (item, routerIsActive) => {
    if (item.to?.startsWith('/admin/users')) {
      return location.pathname === '/admin/users';
    }

    return routerIsActive;
  };

  const renderMenuItem = (item) => {
    const Icon = item.icon;
    const hoverKey = item.label;
    const messageBadgeCount = item.label === 'Mensajes' ? unreadMessagesBadge : 0;
    const current = isSidebarItemCurrent(item);

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
        onClick={(event) => preventCurrentSectionNavigation(event, item)}
        onMouseEnter={() => setHoveredItem(hoverKey)}
        onMouseLeave={() => setHoveredItem(null)}
        style={({ isActive }) => getSidebarItemStyle({
          active: isSidebarItemActive(item, isActive),
          hovered: hoveredItem === hoverKey,
          current,
        })}
        aria-disabled={current}
        end
      >
        <span style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={20} strokeWidth={2} />
          {messageBadgeCount > 0 && (
            <span
              style={{
                position: 'absolute',
                top: '-8px',
                right: '-10px',
                minWidth: '18px',
                height: '18px',
                padding: '0 5px',
                borderRadius: '999px',
                backgroundColor: '#ef4444',
                color: '#ffffff',
                fontSize: '11px',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '2px solid rgba(0, 128, 128, 0.95)',
                lineHeight: 1,
              }}
              aria-label={`Mensajes no leídos: ${messageBadgeCount}`}
            >
              {messageBadgeCount > 99 ? '99+' : messageBadgeCount}
            </span>
          )}
        </span>
        {!isSidebarCollapsed && <span>{item.label}</span>}
      </NavLink>
    );
  };

  const handleLogout = () => {
    sessionStorage.removeItem('usuario');
    navigate('/auth');
  };

  const refreshUnreadCount = useCallback(async () => {
    const [count, errorCount] = await obtenerCantidadNotificacionesNoLeidas();
    if (!errorCount) {
      setUnreadCount(Number(count) || 0);
    }
  }, []);

  const refreshUnreadMessagesCount = useCallback(async () => {
    const [conversations, errorConversations] = await obtenerConversaciones();
    if (errorConversations) return;

    const count = Array.isArray(conversations)
      ? conversations.filter((conversation) => {
        const unreadForRole = normalizedRole === 'arrendador'
          ? Number(conversation?.noLeidosArrendador || 0)
          : Number(conversation?.noLeidosEstudiante || 0);

        return unreadForRole > 0;
      }).length
      : 0;

    setUnreadMessagesCount(count);
  }, [normalizedRole]);

  useEffect(() => {
    refreshUnreadCount();
    refreshUnreadMessagesCount();
  }, [refreshUnreadCount, refreshUnreadMessagesCount, location.pathname]);

  useEffect(() => {
    if (!user?.id || normalizedRole !== 'estudiante') return;

    const seenKey = `tourVisto_estudiante_${user.id}`;
    if (!localStorage.getItem(seenKey)) {
      navigate('/buscar');
      setTourActive(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, normalizedRole]);

  const markTourAsSeen = () => {
    if (user?.id) {
      localStorage.setItem(`tourVisto_estudiante_${user.id}`, '1');
    }
  };

  const closeTour = () => {
    markTourAsSeen();
    setTourActive(false);
  };

  const finishTour = () => {
    markTourAsSeen();
    setTourActive(false);
  };

  const restartTour = () => {
    setShowHelpMenu(false);
    navigate('/buscar');
    setTourActive(true);
  };

  const notificationsItem = { to: '/notificaciones' };
  const isNotificationsCurrent = isSidebarItemCurrent(notificationsItem);

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
              marginTop: isSidebarCollapsed ? '18px' : '34px',
              marginBottom: '18px',
              padding: '10px 5px',
              justifyContent: isSidebarCollapsed ? 'center' : 'flex-start',
            }}
          >
            <img
              src={isSidebarCollapsed ? miLogo : slidebaar}
              alt="ArriendU Logo"
              role="button"
              aria-label={normalizedRole === 'administrador' ? 'Ir al panel administrador' : 'Ir al inicio'}
              onClick={handleBannerClick}
              style={{
                height: isSidebarCollapsed ? '44px' : '40px',
                width: 'auto',
                maxWidth: isSidebarCollapsed ? '44px' : '100%',
                objectFit: 'contain',
                display: 'block',
                cursor: 'pointer',
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
          <NavLink
            to="/notificaciones"
            onClick={(event) => preventCurrentSectionNavigation(event, notificationsItem)}
            onMouseEnter={() => setHoveredItem('notificaciones')}
            onMouseLeave={() => setHoveredItem(null)}
            style={({ isActive }) => getSidebarItemStyle({
              active: isActive,
              hovered: hoveredItem === 'notificaciones',
              current: isNotificationsCurrent,
            })}
            aria-disabled={isNotificationsCurrent}
            end
          >
            <span style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
              <Bell size={20} strokeWidth={2} />
              {unreadCount > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: '-9px',
                    right: '-12px',
                    minWidth: '18px',
                    height: '18px',
                    padding: '0 5px',
                    borderRadius: '999px',
                    backgroundColor: '#ef4444',
                    color: '#ffffff',
                    fontSize: '11px',
                    fontWeight: 700,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '2px solid rgba(0, 128, 128, 0.95)',
                    lineHeight: 1,
                  }}
                  aria-label={`Notificaciones no leídas: ${unreadCount}`}
                >
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </span>
            {!isSidebarCollapsed && <span>Centro de Notificaciones</span>}
          </NavLink>

          {normalizedRole === 'estudiante' && (
            <button
              type="button"
              onClick={restartTour}
              onMouseEnter={() => setHoveredItem('tutorial')}
              onMouseLeave={() => setHoveredItem(null)}
              style={getSidebarItemStyle({ hovered: hoveredItem === 'tutorial' })}
            >
              <Compass size={20} strokeWidth={2} />
              {!isSidebarCollapsed && <span>Ver tour de la página</span>}
            </button>
          )}

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

      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', backgroundColor: colores.grisSuave }}>
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
          <button
            type="button"
            onClick={() => navigate('/profile')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              background: 'none',
              border: 'none',
              padding: 0,
              cursor: 'pointer',
            }}
          >
            <AvatarCirculo nombre={user?.nombreCompleto || 'Usuario'} foto={user?.fotoPerfil} size={32} />
            <span style={{ fontSize: '14px', fontWeight: '500', color: colores.textoOscuro }}>{user?.nombreCompleto || 'Usuario'}</span>
          </button>
        </header>

        <main
          className="app-content"
          style={{ flex: 1, minWidth: 0, overflowY: 'auto', overflowX: 'hidden', padding: '20px' }}
        >
          <PageTransition>{outlet}</PageTransition>
        </main>
      </div>

      <SpotlightTour active={tourActive} onClose={closeTour} onFinish={finishTour} />

      {normalizedRole === 'estudiante' && (
        <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 1500 }}>
          {showHelpMenu && (
            <div style={styles.helpMenu}>
              <button type="button" style={styles.helpMenuItem} onClick={restartTour}>
                <Compass size={16} /> Ver tour de la página otra vez
              </button>
              <button
                type="button"
                style={styles.helpMenuItem}
                onClick={() => {
                  setShowHelpMenu(false);
                  setShowFaq(true);
                }}
              >
                <HelpCircle size={16} /> Preguntas frecuentes
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={() => setShowHelpMenu((prev) => !prev)}
            aria-label={showHelpMenu ? 'Cerrar ayuda' : 'Abrir ayuda'}
            style={styles.helpFab}
          >
            {showHelpMenu ? <X size={22} /> : <HelpCircle size={22} />}
          </button>
        </div>
      )}

      <FaqModal open={showFaq} onClose={() => setShowFaq(false)} />
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
  helpFab: {
    width: '52px',
    height: '52px',
    borderRadius: '999px',
    border: 'none',
    background: 'linear-gradient(135deg, #008080, #0f9d9d)',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    boxShadow: '0 14px 28px rgba(0, 128, 128, 0.32)',
    marginLeft: 'auto',
  },
  helpMenu: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    padding: '8px',
    marginBottom: '10px',
    boxShadow: '0 20px 45px rgba(15, 23, 42, 0.22)',
    minWidth: '240px',
  },
  helpMenuItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '10px 12px',
    border: 'none',
    background: 'transparent',
    borderRadius: '10px',
    fontSize: '13.5px',
    fontWeight: '600',
    color: '#0f172a',
    cursor: 'pointer',
    textAlign: 'left',
  },
};

export default Root;
