import { createContext, useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext();

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
    const navigate = useNavigate();
    const [user, setUser] = useState(() => JSON.parse(sessionStorage.getItem('usuario')) || '');
    const isAuthenticated = user ? true : false;

useEffect(() => {
    if (!isAuthenticated) {
        navigate('/auth');
    }
}, [isAuthenticated, navigate]);

const updateUser = (updatedFields) => {
    setUser((prev) => {
        const merged = { ...prev, ...updatedFields };
        sessionStorage.setItem('usuario', JSON.stringify(merged));
        return merged;
    });
};

return (
    <AuthContext.Provider value={{ isAuthenticated, user, updateUser }}>
        {children}
    </AuthContext.Provider>
);
}