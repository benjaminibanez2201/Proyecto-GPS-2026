import { useAuth } from '@context/AuthContext';
import { Navigate, useLocation } from 'react-router-dom';

const ProtectedRoute = ({ children, allowedRoles }) => {
    const { isAuthenticated, user } = useAuth();
    const location = useLocation();

    if (!isAuthenticated) {
        return <Navigate to="/auth" state={{ from: location }} replace />;
    }

    if (allowedRoles && !allowedRoles.includes(user?.rol)) {
        return <Navigate to="/home" replace />;
    }

    return children;
};

export default ProtectedRoute;
