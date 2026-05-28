import { useNavigate, Link } from 'react-router-dom';
import { login } from '@services/auth.service.js';
import Form from '@components/Form';
import useLogin from '@hooks/auth/useLogin.jsx';
import '@styles/form.css';
import '@styles/login.css';

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
        <main
            className="container login-page"
            style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center'
            }}
        >
            <div
                style={{
                    width: '100%',
                    maxWidth: '1040px',
                    minHeight: '560px',
                    borderRadius: '16px',
                    boxShadow: '0 12px 30px rgba(0,0,0,0.15)',
                    display: 'flex',
                    overflow: 'hidden',
                    backgroundColor: '#07bcbc'
                }}
            >
                <section
                    style={{
                        flex: 1,
                        backgroundColor: '#008080',
                        color: '#ffffff',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '40px 32px',
                        textAlign: 'center',
                        gap: '16px'
                    }}
                >
                    <img
                        src="/BannerArriendU.png"
                        alt="Banner ArriendU"
                        style={{ width: '100%', maxWidth: '330px', height: 'auto' }}
                    />
                    <p
                        style={{
                            margin: 0,
                            fontSize: '15px',
                            opacity: 0.95,
                            textAlign: 'left',
                            maxWidth: '360px',
                            lineHeight: 1.7
                        }}
                    >
                        ArriendU es una plataforma especializada para estudiantes universitarios de Concepción. Encuentra piezas, departamentos y pensiones verificadas cerca de tu campus, con arrendadores confiables y sin intermediarios.
                    </p>
                </section>
                <section
                    style={{
                        flex: 1,
                        backgroundColor: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '32px 28px'
                    }}
                >
                    <div style={{ width: '100%', maxWidth: '420px' }}>
                        <Form
                            title="Iniciar sesión"
                            backgroundColor="#ffffff"
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
                    </div>
                </section>
            </div>
        </main>
    );
};

export default Login;