import { useNavigate, Link, useLocation} from 'react-router-dom';
import { login } from '@services/auth.service.js';
import Form from '@components/Form';
import useLogin from '@hooks/auth/useLogin.jsx';
import slidebaar from '@assets/slidebaar.png';
import '@styles/form.css';
import '@styles/login.css';

const Login = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const {
        errorData,
        handleInputChange
    } = useLogin();

    const loginSubmit = async (data) => {
        try {
            const response = await login(data);
            if (response.status === 'Success') {
                    const storedUser = JSON.parse(sessionStorage.getItem('usuario')) || {};

                    // buscar si hay ruta guardada en state o en query param ?next=
                    const params = new URLSearchParams(location.search);
                    const nextParam = params.get('next');
                    const originUrl = nextParam || location.state?.from?.pathname;

                //para redirigir al usuario a la página de origen después del inicio de sesión
                if (storedUser.rol === 'admin' || storedUser.rol === 'administrador') {
                    // Los admins siempre van al panel, sin importar de dónde venían
                    navigate('/admin', { replace: true });
                } else if (originUrl) {
                    //si estudiante/arrendador venía de un enlace externo, lo mandamos ahí
                    navigate(originUrl, { replace: true });
                } else {
                    //si no, al home normal
                    navigate('/home', { replace: true });
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
                        src={slidebaar}
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
                                    onChange: (e) => handleInputChange('email', e.target.value),
                                },
                                {
                                    label: "Contraseña",
                                    name: "password",
                                    placeholder: "**********",
                                    fieldType: 'input',
                                    type: "password",
                                    required: true,
                                    onChange: (e) => handleInputChange('password', e.target.value)
                                },
                            ]}
                            buttonText="Iniciar sesión"
                            onSubmit={loginSubmit}
                            footerContent={
                                <div className="login-footer">
                                    <p>
                                        ¿No tienes cuenta?{' '}
                                        <Link to="/register">Regístrate aquí</Link>
                                    </p>
                                    <p>
                                        ¿Olvidaste tu contraseña?{' '}
                                        <Link to="/forgot-password">Recupérala aquí</Link>
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
