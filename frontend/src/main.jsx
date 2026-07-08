import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider, Navigate } from "react-router-dom";
import Login from '@pages/Login';
import ForgotPassword from '@pages/ForgotPassword';
import ResetPassword from '@pages/ResetPassword';
import ConfirmEmail from '@pages/ConfirmEmail';
import Home from '@pages/Home';
import AdminUsers from '@pages/AdminUsers';
import Register from '@pages/Register';
import RegisterPending from '@pages/RegisterPending';
import Error404 from '@pages/Error404';
import Root from '@pages/Root';
import ProtectedRoute from '@components/ProtectedRoute';
import { AuthProvider } from '@context/AuthContext';
import Profile from '@pages/Profile';
import AdminPanel from '@pages/AdminPanel';
import PageTransition from '@components/PageTransition';
import '@styles/styles.css';
import HistorialArriendos from './pages/HistorialArriendos.jsx';
import PerfilUsuario from './pages/PerfilUsuario.jsx';
import Notificaciones from '@pages/Notificaciones';
import BuscarArriendos from '@pages/BuscarArriendo.jsx';
import DetallePublicacion from '@pages/DetallePublicacion.jsx';
import DetalleArriendo from '@pages/DetalleArriendo.jsx';
import MisPublicaciones from '@pages/MisPublicaciones';
import CalificacionesRecibidas from './pages/CalificacionesRecibidas.jsx';
import MisFavoritos from '@pages/MisFavoritos';
import AdminAuditoria from '@pages/AdminAuditoria';
import Mensajes from '@pages/Mensajes.jsx';
import MisReportes from '@pages/MisReportes.jsx';
import AdminReportes from '@pages/AdminReportes.jsx';
import AdminReportesUsuarios from '@pages/AdminReportesUsuarios.jsx';
import PasarelaPagos from '@pages/PasarelaPagos.jsx';

const APP_NAME = 'ArriendU';

const withPageTransition = (page) => (
  <PageTransition>
    {page}
  </PageTransition>
);

function getTitleFromPath(pathname) {
  const titleRules = [
    { pattern: /^\/$/, title: APP_NAME },
    { pattern: /^\/home\/?$/, title: APP_NAME },
    { pattern: /^\/auth\/?$/, title: `Iniciar sesión - ${APP_NAME}` },
    { pattern: /^\/register\/?$/, title: `Crear una cuenta - ${APP_NAME}` },
    { pattern: /^\/register\/pending\/?$/, title: `Registro pendiente - ${APP_NAME}` },
    { pattern: /^\/forgot-password\/?$/, title: `Recuperar contraseña - ${APP_NAME}` },
    { pattern: /^\/reset-password\/[^/]+\/?$/, title: `Restablecer contraseña - ${APP_NAME}` },
    { pattern: /^\/auth\/confirm-email\/[^/]+\/?$/, title: `Registro confirmado - ${APP_NAME}` },
    
    // Perfiles y Usuarios
    { pattern: /^\/profile\/?$/, title: `Mi perfil - ${APP_NAME}` },
    { pattern: /^\/profile\/reportes\/?$/, title: `Mis reportes - ${APP_NAME}` },
    { pattern: /^\/profile\/calificaciones\/?$/, title: `Calificaciones recibidas - ${APP_NAME}` },
    { pattern: /^\/perfil\/[^/]+\/?$/, title: `Perfil de usuario - ${APP_NAME}` },
    
    // Estudiante
    { pattern: /^\/buscar\/?$/, title: `Buscar arriendos - ${APP_NAME}` }, 
    { pattern: /^\/favoritos\/?$/, title: `Mis favoritos - ${APP_NAME}` },
    { pattern: /^\/historial\/?$/, title: `Historial de arriendos - ${APP_NAME}` },
    {pattern: /^\/arriendo\/[^/]+\/?$/, title: `Detalle de arriendo - ${APP_NAME}` },
    
    // Arrendador
    { pattern: /^\/mis-publicaciones\/?$/, title: `Mis publicaciones - ${APP_NAME}` },
    { pattern: /^\/pasarela-pagos\/?$/, title: `Pasarela de pagos - ${APP_NAME}` },
    
    // Compartidos (Estudiante y Arrendador)
    { pattern: /^\/notificaciones\/?$/, title: `Notificaciones - ${APP_NAME}` }, 
    { pattern: /^\/mensajes\/?$/, title: `Mensajes - ${APP_NAME}` },
    { pattern: /^\/publicacion\/[^/]+\/?$/, title: `Detalle de publicación - ${APP_NAME}` }, 

    // Administrador
    { pattern: /^\/admin\/?$/, title: `Panel administrador - ${APP_NAME}` },
    { pattern: /^\/admin\/reportes\/?$/, title: `Publicaciones reportadas - ${APP_NAME}` },
    { pattern: /^\/admin\/reportes-usuarios\/?$/, title: `Usuarios reportados - ${APP_NAME}` },
    { pattern: /^\/admin\/users\/?$/, title: `Gestión de usuarios - ${APP_NAME}` },
    { pattern: /^\/admin\/auditoria\/?$/, title: `Auditoría - ${APP_NAME}` },
  ];

  const matchedRule = titleRules.find((rule) => rule.pattern.test(pathname));
  return matchedRule ? matchedRule.title : APP_NAME;
}


const router = createBrowserRouter([
  {
    path: '/',
    element: <Root/>,
    errorElement: withPageTransition(<Error404/>),
    children: [
      {
        // Esto soluciona el 404: si entran a "/" los manda al "/home" que ya estaban conf
        index: true,
        element: <Navigate to="/home" replace />
      },
      {
        path: '/home',
        element: <Home/>
      },
      {
        path: 'users',
        element: <Navigate to="/admin/users" replace />,
      },
      {
        path: 'admin/users',
        element: (
        <ProtectedRoute allowedRoles={['admin', 'administrador']}>
          <AdminUsers />
        </ProtectedRoute>
        ),
      },
      {
        path: 'admin/reportes',
        element: (
        <ProtectedRoute allowedRoles={['admin', 'administrador']}>
          <AdminReportes />
        </ProtectedRoute>
        ),
      },
      {
        path: 'admin/reportes-usuarios',
        element: (
        <ProtectedRoute allowedRoles={['admin', 'administrador']}>
          <AdminReportesUsuarios />
        </ProtectedRoute>
        ),
      },
      {
        path: 'admin/auditoria',
        element: (
          <ProtectedRoute allowedRoles={['admin', 'administrador']}>
            <AdminAuditoria />
          </ProtectedRoute>
        ),
      },
      {
        path: '/profile',
        element: (
          <ProtectedRoute allowedRoles={['estudiante', 'arrendador']}>
            <Profile />
          </ProtectedRoute>
        ),
      },
      {
        path: 'profile/reportes',
        element: (
          <ProtectedRoute allowedRoles={['estudiante', 'arrendador']}>
            <MisReportes />
          </ProtectedRoute>
        ),
      },
      {
        path: 'profile/calificaciones',
        element: (
          <ProtectedRoute allowedRoles={['estudiante', 'arrendador']}>
            <CalificacionesRecibidas />
          </ProtectedRoute>
        ),
      },
      {
        path: 'admin',
        element: (
          <ProtectedRoute allowedRoles={['admin', 'administrador']}>
            <AdminPanel />
          </ProtectedRoute>
        ),
      },
      {
        path: 'historial',
        element: (
          <ProtectedRoute allowedRoles={['estudiante', 'arrendador']}>
            <HistorialArriendos />
          </ProtectedRoute>
        )
      },
      {
        path: 'notificaciones',
        element: (
          <ProtectedRoute>
            <Notificaciones />
          </ProtectedRoute>
        ),
      },
      {
        path: 'mensajes',
        element: (
          <ProtectedRoute allowedRoles={['estudiante', 'arrendador']}>
            <Mensajes />
          </ProtectedRoute>
        ),
      },
      {
        path: 'perfil/:id',
        element: <PerfilUsuario />
      },
      {
        path: 'buscar',
        element: (
          <ProtectedRoute allowedRoles={['estudiante']}>
            <BuscarArriendos />
          </ProtectedRoute>
        )
      },
      {
        path: 'publicacion/:id',
        element: (
          <ProtectedRoute allowedRoles={['estudiante', 'arrendador', 'admin']}>
            <DetallePublicacion />
          </ProtectedRoute>
        )
      },
      {
        path: 'arriendo/:id',
        element: (
          <ProtectedRoute allowedRoles={['estudiante', 'arrendador']}>
            <DetalleArriendo />
          </ProtectedRoute>
        )
      },
      {
        path: 'favoritos',
        element: (
          <ProtectedRoute allowedRoles={['estudiante']}>
            <MisFavoritos />
          </ProtectedRoute>
        )
      },
      {
      path: '/mis-publicaciones',
      element: (
        <ProtectedRoute allowedRoles={['arrendador']}>
          <MisPublicaciones />
        </ProtectedRoute>
      ),
    },
    ]
  },
  {
    path: '/auth',
    element: withPageTransition(<Login/>)
  },
  {
    path: '/forgot-password',
    element: withPageTransition(<ForgotPassword/>)
  },
  {
    path: '/reset-password/:token',
    element: withPageTransition(<ResetPassword/>)
  },
  {
    path: '/auth/confirm-email/:token',
    element: withPageTransition(<ConfirmEmail/>)
  },
  {
    path: '/register',
    element: withPageTransition(<Register/>)
  },
  {
    path: '/register/pending',
    element: withPageTransition(<RegisterPending/>)
  },
  {
    path: '/pasarela-pagos',
    element: withPageTransition(
      <AuthProvider>
        <ProtectedRoute allowedRoles={['arrendador']}>
          <PasarelaPagos />
        </ProtectedRoute>
      </AuthProvider>
    )
  }
])

document.title = getTitleFromPath(router.state.location.pathname);
router.subscribe((state) => {
  document.title = getTitleFromPath(state.location.pathname);
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <RouterProvider router={router}/>
)
