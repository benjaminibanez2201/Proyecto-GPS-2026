import useResetPassword from '@hooks/auth/useResetPassword';
import Form from '@components/Form';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import { showSuccessConfirm } from '@helpers/sweetAlert';
import slidebaar from '@assets/slidebaar.png';
import '@styles/form.css';
import '@styles/resetPassword.css';

const ResetPassword = () => {
    const navigate = useNavigate();
    const {
        password,
        confirmPassword,
        setPassword,
        setConfirmPassword,
        errorPassword,
        errorConfirmPassword,
        responseMessage,
        handleSubmit
    } = useResetPassword();

    const isSuccess = Boolean(responseMessage);
    const handleUpdateClick = () => {
        return handleSubmit({ password, confirmPassword });
    };

    const goToLogin = () => {
        navigate('/auth');
    };

    return (
        <main className="container reset-password-page">
            <div className="reset-password-shell">
                <section className="reset-password-side" aria-label="Información de cambio de contraseña">
                    <img className="reset-password-brand" src={slidebaar} alt="Banner ArriendU" />
                    <div className="reset-password-side-copy">
                        <strong>Crea una contraseña nueva y segura</strong>
                        <p>
                            Actualiza tu acceso para volver a entrar a ArriendU y seguir gestionando tus arriendos.
                        </p>
                    </div>
                    <div className="reset-password-note">
                        <ShieldCheck size={20} strokeWidth={2.2} />
                        <span>Usa una contraseña que no compartas con otros servicios.</span>
                    </div>
                </section>

                <section className="reset-password-card" aria-label="Formulario de cambio de contraseña">
                    <Form
                        title="Cambiar contraseña"
                        backgroundColor="#ffffff"
                        fields={[
                            {
                                label: "Nueva contraseña",
                                name: "password",
                                placeholder: "**********",
                                fieldType: 'input',
                                type: "password",
                                required: true,
                                minLength: 8,
                                value: password,
                                onChange: (e) => setPassword(e.target.value),
                                disabled: isSuccess,
                                showVisibilityToggle: !isSuccess,
                                errorMessageData: errorPassword,
                            },
                            {
                                label: "Confirmar nueva contraseña",
                                name: "confirmPassword",
                                placeholder: "**********",
                                fieldType: 'input',
                                type: "password",
                                required: true,
                                minLength: 8,
                                value: confirmPassword,
                                onChange: (e) => setConfirmPassword(e.target.value),
                                disabled: isSuccess,
                                showVisibilityToggle: !isSuccess,
                                errorMessageData: errorConfirmPassword,
                            }
                        ]}
                        buttonText={null}
                        onSubmit={() => {}}
                        inlineMessage={responseMessage}
                        footerContent={
                            <>
                                {!isSuccess && (
                                    <button
                                        type="button"
                                        className="form-secondary-action"
                                        onClick={async () => {
                                            const ok = await handleUpdateClick();
                                            if (ok) {
                                                await showSuccessConfirm(
                                                    "Contraseña actualizada",
                                                    "La contraseña fue actualizada exitosamente."
                                                );
                                                goToLogin();
                                            }
                                        }}
                                    >
                                        Actualizar contraseña
                                    </button>
                                )}
                                {isSuccess && (
                                    <button type="button" className="form-secondary-action" onClick={goToLogin}>
                                        Volver al login
                                    </button>
                                )}
                            </>
                        }
                    />
                </section>
            </div>
        </main>
    );
};

export default ResetPassword;
