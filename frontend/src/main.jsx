import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider, Navigate } from "react-router-dom";
import Login from '@pages/Login';
import ForgotPassword from '@pages/ForgotPassword';
import ResetPassword from '@pages/ResetPassword';
import Home from '@pages/Home';
import Users from '@pages/Users';
import Register from '@pages/Register';
import Error404 from '@pages/Error404';
import Root from '@pages/Root';
import ProtectedRoute from '@components/ProtectedRoute';
import Profile from '@pages/Profile';
import AdminPanel from '@pages/AdminPanel';
import '@styles/styles.css';
import HistorialArriendos from './pages/HistorialArriendos.jsx';
import PerfilUsuario from './pages/PerfilUsuario.jsx';

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
        element: (
        <ProtectedRoute allowedRoles={['administrador']}>
          <Users />
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
        path: '/admin',
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
        path: 'perfil/:id',
        element: <PerfilUsuario />
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

ReactDOM.createRoot(document.getElementById('root')).render(
  <RouterProvider router={router}/>
)