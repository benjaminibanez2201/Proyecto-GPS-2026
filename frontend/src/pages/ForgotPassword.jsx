import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Info } from 'lucide-react';
import useForgotPassword from "../hooks/auth/useForgotPassword";
import Form from "@components/Form.jsx";
import '@styles/form.css';
import { useRef } from 'react';

const ForgotPassword = () => { // declaramos el componente ForgotPassword
    const { // y extraemos lo que nesesitamos del hook useForgotPassword
        email,
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

    const toggleTooltip = () => {
        setIsTooltipOpen((prev) => !prev);
    };

    useEffect(() => {
        const handleOutsideClick = (e) => {
            if (isTooltipOpen && helpRef.current && !helpRef.current.contains(e.target)) {
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
                onClick={toggleTooltip}
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
    <main className="container">
        <Form
            title="Recuperar contraseña"
            description={
                <>
                    <span>Ingresa tu correo y te enviaremos un</span>
                    <br />
                    <span>enlace para restablecer tu contraseña</span>
                </>
            }
            fields={[
                {
                    label: "Correo electrónico",
                    name: "email",
                    placeholder: "example@gmail.cl",
                    fieldType: 'input',
                    type: "email",
                    required: true,
                    minLength: 5,
                    maxLength: 100,
                    errorMessageData: errorEmail,
                    onChange: (e) => handleInputChange(e.target.value),
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
    </main>
);
};
export default ForgotPassword;
