import { useState, useEffect } from 'react';
import { forgotPassword } from '@services/auth.service.js';

const useForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [errorEmail, setErrorEmail] = useState('');
    const [responseMessage, setResponseMessage] = useState('');
    const [loading, setLoading] = useState(false);

    const handleInputChange = (value) => setEmail(value);

    const handleSubmit = async () => {
        setLoading(true);
        setErrorEmail('');
        setResponseMessage('');
        try {
            const payload = await forgotPassword(email);
            // backend returns { status, message, data }
            if (payload?.status === 'Success') {
                setResponseMessage(payload.message);
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

    return {
        email,
        errorEmail,
        responseMessage,
        loading,
        handleInputChange,
        handleSubmit,
        setEmail,
    };
};

export default useForgotPassword;