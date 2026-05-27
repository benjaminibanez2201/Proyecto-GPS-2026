import useForgotPassword from "../hooks/auth/useForgotPassword";
import Form from "@components/Form.jsx";
import { Link } from 'react-router-dom';
import '@styles/form.css';

const ForgotPassword = () => { // declaramos el componente ForgotPassword
    const { // y extraemos lo que nesesitamos del hook useForgotPassword
        email,
        errorEmail,
        responseMessage,
        loading,
        cooldownSeconds,
        handleInputChange,
        handleSubmit,
    } = useForgotPassword();

    const isCooldown = cooldownSeconds > 0;
    const buttonLabel = isCooldown
        ? `Enviar correo en ${cooldownSeconds}s`
        : 'Enviar correo de recuperación';
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
                <p>¿Recordaste tu contraseña? <Link to="/auth">Inicia sesión</Link></p>
            }
            inlineMessage={responseMessage}
        />
    </main>
);
};
export default ForgotPassword;
