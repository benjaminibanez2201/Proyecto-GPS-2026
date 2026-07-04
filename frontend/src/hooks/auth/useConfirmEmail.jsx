import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { confirmEmail } from '@services/auth.service.js';

const MIN_LOADING_MS = 900;

function wait(ms) {
    return new Promise((resolve) => {
        window.setTimeout(resolve, ms);
    });
}

function getPayloadMessage(payload) {
    if (typeof payload?.details === 'string') return payload.details;
    if (typeof payload?.details?.message === 'string') return payload.details.message;
    if (typeof payload?.data?.message === 'string') return payload.data.message;
    if (typeof payload?.message === 'string') return payload.message;
    return 'No pudimos confirmar el correo con este enlace.';
}

const useConfirmEmail = () => {
    const { token } = useParams();
    const [status, setStatus] = useState('loading');
    const [message, setMessage] = useState('Estamos confirmando tu correo...');
    const [email, setEmail] = useState('');

    const runConfirmation = useCallback(async () => {
        const normalizedToken = token?.trim();

        if (!normalizedToken) {
            setStatus('error');
            setMessage('El enlace de confirmación no es válido.');
            setEmail('');
            return;
        }

        const startedAt = Date.now();
        setStatus('loading');
        setMessage('Estamos confirmando tu correo...');
        setEmail('');

        try {
            const payload = await confirmEmail(normalizedToken);
            const elapsed = Date.now() - startedAt;

            if (elapsed < MIN_LOADING_MS) {
                await wait(MIN_LOADING_MS - elapsed);
            }

            if (payload?.status === 'Success') {
                setStatus('success');
                setMessage(payload?.data?.message || 'Correo confirmado correctamente. Ya puedes iniciar sesión.');
                setEmail(payload?.data?.email || '');
                return;
            }

            setStatus('error');
            setMessage(getPayloadMessage(payload));
        } catch (error) {
            console.error('Error confirmando correo:', error);
            setStatus('error');
            setMessage('No pudimos confirmar el correo. Inténtalo nuevamente.');
        }
    }, [token]);

    useEffect(() => {
        runConfirmation();
    }, [runConfirmation]);

    return {
        email,
        message,
        retry: runConfirmation,
        status,
    };
};

export default useConfirmEmail;
