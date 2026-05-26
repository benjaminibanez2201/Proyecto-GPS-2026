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
        handleInputChange,
        handleSubmit,
    } = useForgotPassword();
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
            buttonText="Enviar correo de recuperación"
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
