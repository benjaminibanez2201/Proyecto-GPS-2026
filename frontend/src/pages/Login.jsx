import { useNavigate, Link } from 'react-router-dom';
import { login } from '@services/auth.service.js';
import Form from '@components/Form';
import useLogin from '@hooks/auth/useLogin.jsx';
import '@styles/form.css';

const Login = () => {
    const navigate = useNavigate();
    const {
        errorEmail,
        errorPassword,
        errorData,
        handleInputChange
    } = useLogin();

    const loginSubmit = async (data) => {
        try {
            const response = await login(data);
            if (response.status === 'Success') {
                const storedUser = JSON.parse(sessionStorage.getItem('usuario')) || {};
                if (storedUser.rol === 'admin' || storedUser.rol === 'administrador') {
                    navigate('/admin');
                } else {
                    navigate('/home');
                }
            } else if (response.status === 'Client error') {
                errorData(response.details);
            }
        } catch (error) {
            console.log(error);
        }
    };

    return (
        <main className="container">
            <Form
                title="Iniciar sesión"
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
                        onChange: (e) => handleInputChange('email', e.target.value),
                    },
                    {
                        label: "Contraseña",
                        name: "password",
                        placeholder: "**********",
                        fieldType: 'input',
                        type: "password",
                        required: true,
                        minLength: 8,
                        maxLength: 50,
                        pattern: /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&._-])[A-Za-z\d@$!%*?&._-]+$/,
                        patternMessage: "Debe contener al menos una mayúscula, un número y un carácter especial.",
                        errorMessageData: errorPassword,
                        onChange: (e) => handleInputChange('password', e.target.value)
                    },
                ]}
                buttonText="Iniciar sesión"
                onSubmit={loginSubmit}
                footerContent={
                    <div>
                        <p>
                            ¿No tienes cuenta?, <Link to="/register">¡Regístrate aquí!</Link>
                        </p>
                        <p>
                            ¿Olvidaste tu contraseña?, <Link to="/forgot-password">Recupérala aquí</Link>
                        </p>
                    </div>
                }
            />
        </main>
    );
};

export default Login;