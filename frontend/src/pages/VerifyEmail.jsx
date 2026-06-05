import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Form from '@components/Form';
import { resendEmailVerification, verifyEmail } from '@services/auth.service.js';
import '@styles/form.css';

const getResponseText = (response, fallback) => {
    if (typeof response?.details === 'string') return response.details;
    if (typeof response?.details?.message === 'string') return response.details.message;
    if (typeof response?.message === 'string') return response.message;
    return fallback;
};

const VerifyEmail = () => {
    const { token } = useParams();
    const [status, setStatus] = useState('loading');
    const [message, setMessage] = useState('Estamos verificando tu correo...');
    const [errorEmail, setErrorEmail] = useState('');
    const [resendMessage, setResendMessage] = useState('');

    useEffect(() => {
        let active = true;

        const confirmEmail = async () => {
            if (!token) {
                setStatus('error');
                setMessage('El enlace de verificacion no es valido.');
                return;
            }

            const response = await verifyEmail(token);

            if (!active) return;

            if (response.status === 'Success') {
                setStatus('success');
                setMessage(response.message || 'Correo verificado correctamente.');
            } else {
                setStatus('error');
                setMessage(getResponseText(response, 'No pudimos verificar este correo.'));
            }
        };

        confirmEmail();

        return () => {
            active = false;
        };
    }, [token]);

    const handleResend = async (data) => {
        setErrorEmail('');
        setResendMessage('');

        const response = await resendEmailVerification(String(data.email || '').trim().toLowerCase());

        if (response.status === 'Success') {
            setResendMessage(response.message || 'Enviamos un nuevo correo de verificacion.');
            return;
        }

        const errorText = getResponseText(response, 'No pudimos reenviar el correo de verificacion.');
        setErrorEmail(errorText);
    };

    const isError = status === 'error';
    const title = status === 'success'
        ? 'Correo verificado'
        : isError
            ? 'Verificacion pendiente'
            : 'Verificar correo';

    return (
        <main className="container">
            <Form
                title={title}
                description={message}
                fields={isError ? [
                    {
                        label: 'Correo electronico',
                        name: 'email',
                        placeholder: 'correo@ejemplo.cl',
                        fieldType: 'input',
                        type: 'email',
                        required: true,
                        minLength: 5,
                        maxLength: 100,
                        errorMessageData: errorEmail,
                    },
                ] : []}
                buttonText={isError ? 'Reenviar correo' : null}
                onSubmit={handleResend}
                inlineMessage={resendMessage}
                footerContent={
                    <p>
                        <Link to="/auth">Volver al login</Link>
                    </p>
                }
            />
        </main>
    );
};

export default VerifyEmail;
