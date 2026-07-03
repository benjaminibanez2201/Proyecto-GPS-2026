import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Info, MailCheck, ShieldCheck } from 'lucide-react';
import useForgotPassword from '../hooks/auth/useForgotPassword';
import Form from '@components/Form.jsx';
import slidebaar from '@assets/slidebaar.png';
import '@styles/form.css';
import '@styles/forgotPassword.css';

const ForgotPassword = () => {
    const {
        errorEmail,
        showHelp,
        loading,
        cooldownSeconds,
        handleInputChange,
        handleSubmit,
    } = useForgotPassword();
    const [isTooltipOpen, setIsTooltipOpen] = useState(false);
    const helpRef = useRef(null);

    const isCooldown = cooldownSeconds > 0;
    const buttonLabel = isCooldown
        ? `Enviar correo en ${cooldownSeconds}s`
        : 'Enviar correo de recuperación';

    useEffect(() => {
        if (!showHelp) {
            setIsTooltipOpen(false);
        }
    }, [showHelp]);

    useEffect(() => {
        const handleOutsideClick = (event) => {
            if (isTooltipOpen && helpRef.current && !helpRef.current.contains(event.target)) {
                setIsTooltipOpen(false);
            }
        };

        document.addEventListener('mousedown', handleOutsideClick);
        return () => document.removeEventListener('mousedown', handleOutsideClick);
    }, [isTooltipOpen]);

    const inlineHelp = showHelp ? (
        <div className="forgot-password-help" ref={helpRef}>
            <button
                type="button"
                className="forgot-password-trigger"
                onClick={() => setIsTooltipOpen((prev) => !prev)}
                aria-expanded={isTooltipOpen}
            >
                <span className="forgot-password-trigger-text">¿No recibiste el correo?</span>
                <Info className="forgot-password-trigger-icon" size={16} strokeWidth={2} />
            </button>
            <span className={`forgot-password-tooltip-text${isTooltipOpen ? ' is-open' : ''}`}>
                Si no recibes el correo en los próximos minutos, verifica que la dirección ingresada sea correcta y que
                tengas una cuenta registrada en ArriendU. Si el problema persiste, contáctanos en{' '}
                <a href="https://mail.google.com/mail/?view=cm&fs=1&to=soporte.arriendu@gmail.com" target="_blank" rel="noopener noreferrer">soporte.arriendu@gmail.com</a>.
            </span>
        </div>
    ) : '';

    return (
        <main className="container forgot-password-page">
            <div className="forgot-password-shell">
                <section className="forgot-password-side" aria-label="Información de recuperación">
                    <img className="forgot-password-brand" src={slidebaar} alt="Banner ArriendU" />
                    <div className="forgot-password-side-copy">
                        <h2>Recupera tu cuenta sin perder el ritmo</h2>
                        <p>
                            Te enviaremos un enlace privado para crear una nueva contraseña y volver a gestionar tus
                            arriendos en ArriendU.
                        </p>
                    </div>
                    <div className="forgot-password-note">
                        <ShieldCheck size={20} strokeWidth={2.2} />
                        <span>El enlace caduca por seguridad. Revisa también tu bandeja de spam.</span>
                    </div>
                </section>

                <section className="forgot-password-card" aria-label="Formulario de recuperación">
                    <div className="forgot-password-card-header" aria-hidden="true">
                        <span className="forgot-password-icon">
                            <MailCheck size={24} strokeWidth={2.2} />
                        </span>
                    </div>
                    <Form
                        title="Recuperar contraseña"
                        backgroundColor="#ffffff"
                        description="Ingresa tu correo y te enviaremos un enlace para restablecer tu contraseña."
                        fields={[
                            {
                                label: 'Correo electrónico',
                                name: 'email',
                                placeholder: 'ejemplo@gmail.cl',
                                fieldType: 'input',
                                type: 'email',
                                required: true,
                                minLength: 5,
                                maxLength: 100,
                                errorMessageData: errorEmail,
                                onChange: (event) => handleInputChange(event.target.value),
                            },
                        ]}
                        buttonText={buttonLabel}
                        buttonDisabled={loading || isCooldown}
                        onSubmit={handleSubmit}
                        footerContent={
                            <p className="forgot-password-footer">
                                ¿Recordaste tu contraseña? <Link to="/auth">Inicia sesión</Link>
                            </p>
                        }
                        inlineMessage={inlineHelp}
                    />
                </section>
            </div>
        </main>
    );
};

export default ForgotPassword;
