import { Outlet, Link, useNavigate } from 'react-router-dom';
import { Home, User, History, LogOut } from 'lucide-react';
import { AuthProvider } from '@context/AuthContext';
import logoSlideBar from '../assets/logoSlideBar.svg';

function Root() {
  return (
    <AuthProvider>
      <PageRoot />
    </AuthProvider>
  );
}

function PageRoot() {
  const navigate = useNavigate();

  // Tu paleta de colores corporativa
  const colores = {
    principal: '#008080',    // Verde azulado
    secundario: '#e6dfd3',   // Arena / Beige
    textoOscuro: '#2c3e50',
    blanco: '#ffffff',
    grisSuave: '#f4f6f6'
  };

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', fontFamily: 'sans-serif' }}>
      
      {/* 1. BARRA LATERAL IZQUIERDA (SIDEBAR) */}
      <aside style={{
        width: '260px',
        backgroundColor: colores.principal,
        color: colores.blanco,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '20px'
      }}>
        <div>
          {/* Contenedor del Logo de ArriendU */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '10px', 
            marginBottom: '35px',
            padding: '10px 5px'
          }}>
            <img 
              src={logoSlideBar} 
              alt="ArriendU Logo" 
              style={{ height: '40px', width: 'auto', filter: 'brightness(0) invert(1)' }} 
            />
          </div>

          {/* Opciones del Menú de Navegación */}
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <Link to="/" style={styles.linkMenu}>
              <Home size={20} strokeWidth={2} />
              <span>Inicio</span>
            </Link>

            <Link to="/perfil/2" style={styles.linkMenu}>
              <User size={20} strokeWidth={2} />
              <span>Mi Perfil</span>
            </Link>

            <Link to="/historial" style={styles.linkMenu}>
              <History size={20} strokeWidth={2} />
              <span>Historial de Arriendos</span>
            </Link>
          </nav>
        </div>

        {/* Botón de Cerrar Sesión */}
        <button 
          onClick={() => navigate('/auth')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            backgroundColor: 'transparent',
            border: 'none',
            color: '#ff8a8a', 
            padding: '12px',
            cursor: 'pointer',
            textAlign: 'left',
            fontSize: '15px',
            fontWeight: 'bold',
            borderRadius: '8px'
          }}
        >
          <LogOut size={20} strokeWidth={2} />
          <span>Cerrar Sesión</span>
        </button>
      </aside>

      {/* 2. CONTENIDO DERECHO */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: colores.grisSuave }}>
        
        {/* BARRA SUPERIOR (HEADER) */}
        <header style={{
          height: '60px',
          backgroundColor: colores.blanco,
          borderBottom: '1px solid #e0e0e0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          padding: '0 30px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              backgroundColor: colores.secundario,
              color: colores.textoOscuro,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 'bold',
              fontSize: '14px'
            }}>
              C
            </div>
            <span style={{ fontSize: '14px', fontWeight: '500', color: colores.textoOscuro }}>Cata Muñoz</span>
          </div>
        </header>

        {/* CUERPO PRINCIPAL DINÁMICO */}
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
    cursor: 'pointer'
  }
};

export default Root;