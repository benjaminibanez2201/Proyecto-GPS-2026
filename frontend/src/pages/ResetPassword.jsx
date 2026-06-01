import useResetPassword from '@hooks/auth/useResetPassword';
import Form from '@components/Form';
import { useNavigate } from 'react-router-dom';
import { showSuccessConfirm } from '@helpers/sweetAlert';
import '@styles/form.css';

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
        <main className="container">
            <Form
                title="Cambiar contraseña"
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
                                            "Contrasena actualizada",
                                            "La contrasena fue actualizada exitosamente."
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
        </main>
    );
};

export default ResetPassword;