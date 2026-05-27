import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { resetPassword } from '@services/auth.service.js';

// token can be provided to the hook (for flexibility) or read from route params
const useResetPassword = (providedToken) => {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [errorPassword, setErrorPassword] = useState('');
    const [errorConfirmPassword, setErrorConfirmPassword] = useState('');
    const [responseMessage, setResponseMessage] = useState('');
    const [loading, setLoading] = useState(false);

    const params = useParams();
    const token = providedToken || params.token || null;

    const handleSubmit = async (formData) => {
        if (responseMessage) return false;
        const nextPassword = formData?.password ?? password;
        const nextConfirmPassword = formData?.confirmPassword ?? confirmPassword;
        setLoading(true);
        setErrorPassword('');
        setErrorConfirmPassword('');
        setResponseMessage('');

        if (!nextPassword || nextPassword.length < 8) {
            setErrorPassword('La contraseña debe tener al menos 8 caracteres');
            setLoading(false);
            return false;
        }

        if (nextPassword !== nextConfirmPassword) {
            setErrorConfirmPassword('Las contraseñas no coinciden');
            setLoading(false);
            return false;
        }

        if (!token) {
            setErrorPassword('Token de restablecimiento inválido');
            setLoading(false);
            return false;
        }

        try {
            const payload = await resetPassword(token, nextPassword);
            if (payload?.status === 'Success') {
                setResponseMessage('La contraseña fue actualizada exitosamente');
                setPassword('');
                setConfirmPassword('');
                return true;
            } else {
                const msg = payload?.details || payload?.message || 'No se pudo restablecer la contraseña';
                setErrorPassword(msg);
                return false;
            }
        } catch (error) {
            console.error('Error en resetPassword hook:', error);
            setErrorPassword('Error al restablecer la contraseña');
            return false;
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
