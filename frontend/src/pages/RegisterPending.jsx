import { Link, useLocation } from 'react-router-dom';
import { Clock3, LogIn, MailCheck, ShieldCheck } from 'lucide-react';
import miLogo from '@assets/miLogo.png';
import slidebaar from '@assets/slidebaar.png';
import { ConfirmationAnimation } from '@pages/ConfirmEmail';
import '@styles/emailConfirmation.css';

const RegisterPending = () => {
    const location = useLocation();
    const email = location.state?.email || '';
    const role = location.state?.role || '';
    const roleLabel = role === 'arrendador' ? 'arrendador' : 'estudiante';

    return (
        <main className="email-confirmation-page">
            <section className="email-confirmation-shell" aria-label="Registro pendiente de verificación">
                <aside className="email-confirmation-side">
                    <img className="email-confirmation-brand" src={slidebaar} alt="ArriendU" />
                    <div className="email-confirmation-side-copy">
                        <strong>Recibimos tu registro en ArriendU.</strong>
                        <p>
                            Nuestro equipo revisará tus antecedentes antes de habilitar el acceso a la plataforma.
                        </p>
                    </div>
                    <div className="email-confirmation-side-note">
                        <ShieldCheck size={20} strokeWidth={2.2} />
                        <span>Te avisaremos por correo cuando la revisión termine.</span>
                    </div>
                </aside>

                <section className="email-confirmation-card">
                    <img className="email-confirmation-logo" src={miLogo} alt="" aria-hidden="true" />
                    <ConfirmationAnimation status="pending" />

                    <div className="email-confirmation-copy">
                        <span className="email-confirmation-eyebrow">Solicitud recibida</span>
                        <h1>Tu cuenta está pendiente de verificación</h1>
                        <p>
                            Ya guardamos tu solicitud como {roleLabel}. Cuando un administrador apruebe tus datos,
                            recibirás un correo para confirmar tu email y activar la cuenta.
                        </p>
                        {email && (
                            <span className="email-confirmation-email">
                                <MailCheck size={16} strokeWidth={2.2} />
                                {email}
                            </span>
                        )}
                    </div>

                    <div className="email-confirmation-actions">
                        <span className="email-confirmation-loading-text">
                            <Clock3 size={16} strokeWidth={2.2} />
                            Revisión en curso
                        </span>
                        <Link className="email-confirmation-secondary" to="/auth">
                            <LogIn size={18} strokeWidth={2.4} />
                            Volver a iniciar sesión
                        </Link>
                    </div>
                </section>
            </section>
        </main>
    );
};

export default RegisterPending;
