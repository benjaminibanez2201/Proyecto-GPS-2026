import { Link } from 'react-router-dom';
import { LogIn, MailCheck, RefreshCw, ShieldCheck } from 'lucide-react';
import useConfirmEmail from '@hooks/auth/useConfirmEmail.jsx';
import miLogo from '@assets/miLogo.png';
import slidebaar from '@assets/slidebaar.png';
import '@styles/emailConfirmation.css';

export function ConfirmationAnimation({ status }) {
    return (
        <div className={`email-confirmation-visual email-confirmation-visual--${status}`} aria-hidden="true">
            <svg viewBox="0 0 180 180" role="img">
                <circle className="email-confirmation-visual__halo" cx="90" cy="90" r="72" />
                <g className="email-confirmation-visual__hourglass">
                    <path className="email-confirmation-visual__frame" d="M62 44H118M62 136H118M72 44V58C72 72 84 79 90 90C96 79 108 72 108 58V44M72 136V122C72 108 84 101 90 90C96 101 108 108 108 122V136" />
                    <path className="email-confirmation-visual__sand-top" d="M79 62H101C98 72 94 78 90 84C86 78 82 72 79 62Z" />
                    <path className="email-confirmation-visual__sand-bottom" d="M90 96C97 105 101 112 103 124H77C79 112 83 105 90 96Z" />
                    <path className="email-confirmation-visual__sand-stream" d="M90 85V101" />
                </g>
                <g className="email-confirmation-visual__check">
                    <circle className="email-confirmation-visual__check-circle" cx="90" cy="90" r="45" />
                    <path className="email-confirmation-visual__check-path" d="M69 91.5L82.5 105L112 75" />
                </g>
                <g className="email-confirmation-visual__error">
                    <circle className="email-confirmation-visual__error-circle" cx="90" cy="90" r="45" />
                    <path className="email-confirmation-visual__error-line" d="M90 62V98" />
                    <path className="email-confirmation-visual__error-dot" d="M90 118H90.1" />
                </g>
            </svg>
        </div>
    );
}

const ConfirmEmail = () => {
    const { email, message, retry, status } = useConfirmEmail();
    const isLoading = status === 'loading';
    const isSuccess = status === 'success';
    const isError = status === 'error';

    const title = isSuccess
        ? 'Registro confirmado'
        : isError
            ? 'No pudimos confirmar el correo'
            : 'Confirmando correo';

    const eyebrow = isSuccess
        ? 'Cuenta lista'
        : isError
            ? 'Revisa el enlace'
            : 'Un momento';

    return (
        <main className="email-confirmation-page">
            <section className="email-confirmation-shell" aria-label="Confirmación de correo">
                <aside className="email-confirmation-side">
                    <img className="email-confirmation-brand" src={slidebaar} alt="ArriendU" />
                    <div className="email-confirmation-side-copy">
                        <strong>Tu acceso a ArriendU está a un paso.</strong>
                        <p>
                            Confirmamos la propiedad del correo para mantener la comunidad segura y activar el acceso de usuarios aprobados.
                        </p>
                    </div>
                    <div className="email-confirmation-side-note">
                        <ShieldCheck size={20} strokeWidth={2.2} />
                        <span>La sesión se inicia solo desde el formulario oficial de ArriendU.</span>
                    </div>
                </aside>

                <section className="email-confirmation-card">
                    <img className="email-confirmation-logo" src={miLogo} alt="" aria-hidden="true" />
                    <ConfirmationAnimation status={status} />

                    <div className="email-confirmation-copy">
                        <span className="email-confirmation-eyebrow">{eyebrow}</span>
                        <h1>{title}</h1>
                        <p>{message}</p>
                        {email && (
                            <span className="email-confirmation-email">
                                <MailCheck size={16} strokeWidth={2.2} />
                                {email}
                            </span>
                        )}
                    </div>

                    <div className="email-confirmation-actions">
                        {isSuccess && (
                            <Link className="email-confirmation-primary" to="/auth">
                                <LogIn size={18} strokeWidth={2.4} />
                                Iniciar sesión
                            </Link>
                        )}
                        {isError && (
                            <>
                                <button type="button" className="email-confirmation-secondary" onClick={retry}>
                                    <RefreshCw size={18} strokeWidth={2.4} />
                                    Reintentar
                                </button>
                                <Link className="email-confirmation-primary" to="/auth">
                                    <LogIn size={18} strokeWidth={2.4} />
                                    Ir a iniciar sesión
                                </Link>
                            </>
                        )}
                        {isLoading && (
                            <span className="email-confirmation-loading-text">Validando enlace seguro</span>
                        )}
                    </div>
                </section>
            </section>
        </main>
    );
};

export default ConfirmEmail;
