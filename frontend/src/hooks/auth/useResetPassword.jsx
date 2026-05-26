import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { resetPassword } from '@services/auth.service.js';

// token can be provided to the hook (for flexibility) or read from route params
const useResetPassword = (providedToken) => {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [errorPassword, setErrorPassword] = useState('');
    const [errorConfirmPassword, setErrorConfirmPassword] = useState('');
    const [responseMessage, setResponseMessage] = useState('');
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();
    const params = useParams();
    const token = providedToken || params.token || null;

    const handleSubmit = async (e) => {
        if (e && e.preventDefault) e.preventDefault();
        setLoading(true);
        setErrorPassword('');
        setErrorConfirmPassword('');
        setResponseMessage('');

        if (!password || password.length < 8) {
            setErrorPassword('La contraseña debe tener al menos 8 caracteres');
            setLoading(false);
            return;
        }

        if (password !== confirmPassword) {
            setErrorConfirmPassword('Las contraseñas no coinciden');
            setLoading(false);
            return;
        }

        if (!token) {
            setErrorPassword('Token de restablecimiento inválido');
            setLoading(false);
            return;
        }

        try {
            const payload = await resetPassword(token, password);
            if (payload?.status === 'Success') {
                setResponseMessage(payload.message || 'Contraseña restablecida correctamente');
                // limpiar URL / navegar al login para no dejar token expuesto
                navigate('/auth', { replace: true });
            } else {
                const msg = payload?.details || payload?.message || 'No se pudo restablecer la contraseña';
                setErrorPassword(msg);
            }
        } catch (error) {
            console.error('Error en resetPassword hook:', error);
            setErrorPassword('Error al restablecer la contraseña');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (password) setErrorPassword('');
        if (confirmPassword) setErrorConfirmPassword('');
    }, [password, confirmPassword]);

    return {
        password,
        setPassword,
        confirmPassword,
        setConfirmPassword,
        errorPassword,
        errorConfirmPassword,
        responseMessage,
        loading,
        handleSubmit,
    };
};

export default useResetPassword;
