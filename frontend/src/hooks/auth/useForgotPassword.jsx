import { useState, useEffect } from 'react';
import { showSuccessConfirm } from '@helpers/sweetAlert';
import { forgotPassword } from '@services/auth.service.js';

const useForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [errorEmail, setErrorEmail] = useState('');
    const [responseMessage, setResponseMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [cooldownSeconds, setCooldownSeconds] = useState(0);

    const handleInputChange = (value) => setEmail(value.trim().toLowerCase());

    const handleSubmit = async () => {
        if (cooldownSeconds > 0 || loading) return;
        setLoading(true);
        setErrorEmail('');
        setResponseMessage('');
        try {
            const payload = await forgotPassword(email);
            // backend returns { status, message, data }
            if (payload?.status === 'Success') {
                const message = 'Instrucciones enviadas si el correo existe';
                setResponseMessage(message);
                setCooldownSeconds(60);
                await showSuccessConfirm(
                    'Correo enviado',
                    message,
                    'Aceptar'
                );
            } else {
                const clientMsg = payload?.details || payload?.message || 'Error al enviar la solicitud';
                setErrorEmail(clientMsg);
            }
        } catch (error) {
            console.error('Error en forgotPassword:', error);
            setErrorEmail('Error al enviar la solicitud');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (email) setErrorEmail('');
    }, [email]);

    useEffect(() => {
        if (cooldownSeconds <= 0) return;
        const timer = setInterval(() => {
            setCooldownSeconds((prev) => (prev > 1 ? prev - 1 : 0));
        }, 1000);
        return () => clearInterval(timer);
    }, [cooldownSeconds]);

    return {
        email,
        errorEmail,
        responseMessage,
        loading,
        cooldownSeconds,
        handleInputChange,
        handleSubmit,
        setEmail,
    };
};

export default useForgotPassword;