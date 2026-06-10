import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider, Navigate } from "react-router-dom";
import Login from '@pages/Login';
import ForgotPassword from '@pages/ForgotPassword';
import ResetPassword from '@pages/ResetPassword';
import Home from '@pages/Home';
import AdminUsers from '@pages/AdminUsers';
import Register from '@pages/Register';
import Error404 from '@pages/Error404';
import Root from '@pages/Root';
import ProtectedRoute from '@components/ProtectedRoute';
import Profile from '@pages/Profile';
import AdminPanel from '@pages/AdminPanel';
import '@styles/styles.css';
import HistorialArriendos from './pages/HistorialArriendos.jsx';
import PerfilUsuario from './pages/PerfilUsuario.jsx';
import Notificaciones from '@pages/Notificaciones';
import BuscarArriendos from '@pages/BuscarArriendo.jsx';
import DetallePublicacion from '@pages/DetallePublicacion.jsx';
import Favoritos from '@pages/Favoritos.jsx';
import MisPublicaciones from '@pages/MisPublicaciones.jsx';

const APP_NAME = 'ArriendU';

function getTitleFromPath(pathname) {
  const titleRules = [
    { pattern: /^\/$/, title: APP_NAME },
    { pattern: /^\/home\/?$/, title: APP_NAME },
    { pattern: /^\/auth\/?$/, title: `Iniciar sesión - ${APP_NAME}` },
    { pattern: /^\/register\/?$/, title: `Crear una cuenta - ${APP_NAME}` },
    { pattern: /^\/forgot-password\/?$/, title: `Recuperar contraseña - ${APP_NAME}` },
    { pattern: /^\/reset-password\/[^/]+\/?$/, title: `Restablecer contraseña - ${APP_NAME}` },
    { pattern: /^\/admin\/?$/, title: `Panel administrador - ${APP_NAME}` },
    { pattern: /^\/users\/?$/, title: `Gestión de usuarios - ${APP_NAME}` },
    { pattern: /^\/profile\/?$/, title: `Mi perfil - ${APP_NAME}` },
    { pattern: /^\/historial\/?$/, title: `Historial de arriendos - ${APP_NAME}` },
    { pattern: /^\/perfil\/[^/]+\/?$/, title: `Perfil de usuario - ${APP_NAME}` },
    { pattern: /^\/publicacion\/?$/, title: `Buscar arriendos - ${APP_NAME}` },
  ];

  const matchedRule = titleRules.find((rule) => rule.pattern.test(pathname));
  return matchedRule ? matchedRule.title : APP_NAME;
}

const router = createBrowserRouter([
  {
    path: '/',
    element: <Root/>,
    errorElement: <Error404/>,
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
        path: '/profile',
        element: (
          <ProtectedRoute allowedRoles={['estudiante']}>
            <Profile />
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
        element: <HistorialArriendos />
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
          <ProtectedRoute allowedRoles={['estudiante', 'arrendador']}>
            <DetallePublicacion />
          </ProtectedRoute>
        )
      },
      {
        path: 'favoritos',
        element: (
          <ProtectedRoute allowedRoles={['estudiante']}>
            <Favoritos />
          </ProtectedRoute>
        )
      },
      {
        path: 'mis-publicaciones',
        element: (
          <ProtectedRoute allowedRoles={['arrendador']}>
            <MisPublicaciones />
          </ProtectedRoute>
        )
      }
    ]
  },
  {
    path: '/auth',
    element: <Login/>
  },
  {
    path: '/forgot-password',
    element: <ForgotPassword/>
  },
  {
    path: '/reset-password/:token',
    element: <ResetPassword/>
  },
  {
    path: '/register',
    element: <Register/>
  }
])

document.title = getTitleFromPath(router.state.location.pathname);
router.subscribe((state) => {
  document.title = getTitleFromPath(state.location.pathname);
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <RouterProvider router={router}/>
)