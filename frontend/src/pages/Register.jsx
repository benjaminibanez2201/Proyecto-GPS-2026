import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { register } from '@services/auth.service.js';
import Form from '@components/Form';
import useRegister from '@hooks/auth/useRegister.jsx';
import { showErrorAlert, showSuccessAlert } from '@helpers/sweetAlert.js';
import '@styles/form.css';

const patternRut = /^(?:(?:[1-9]\d{0}|[1-2]\d{1})(\.\d{3}){2}|[1-9]\d{6}|[1-2]\d{7}|29\.999\.999|29999999)-[\dkK]$/;
const patternPassword = /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&._-])[A-Za-z\d@$!%*?&._-]+$/;
const patternNombre = /^[a-zA-Z\u00C0-\u017F\s]+$/;
const patternTelefono = /^[0-9+\-\s()]+$/;

const Register = () => {
    const navigate = useNavigate();
    const [role, setRole] = useState('estudiante');
    const {
        errorEmail,
        errorRut,
        errorData,
        handleInputChange,
    } = useRegister();

    const registerSubmit = async (data) => {
        try {
            const response = await register(data);

            if (response.status === 'Success') {
                showSuccessAlert('¡Registrado!', 'Usuario registrado exitosamente.');
                setTimeout(() => {
                    navigate('/auth');
                }, 3000);
            } else if (response.status === 'Client error') {
                errorData(response.details);
            }
        } catch (error) {
            console.error('Error al registrar un usuario: ', error);
            showErrorAlert('Cancelado', 'Ocurrió un error al registrarse.');
        }
    };

    const handleRoleChange = (event) => {
        setRole(event.target.value);
    };

    return (
        <main className="container register-container">
            <Form
                title="Crea tu cuenta"
                fields={[
                    {
                        label: 'Nombre completo',
                        name: 'nombreCompleto',
                        placeholder: 'Diego Alexis Salazar Jara',
                        fieldType: 'input',
                        type: 'text',
                        required: true,
                        minLength: 15,
                        maxLength: 50,
                        pattern: patternNombre,
                        patternMessage: 'Debe contener solo letras y espacios',
                    },
                    {
                        label: 'Correo electrónico',
                        name: 'email',
                        placeholder: 'example@gmail.cl',
                        fieldType: 'input',
                        type: 'email',
                        required: true,
                        minLength: 5,
                        maxLength: 100,
                        errorMessageData: errorEmail,
                        onChange: (e) => handleInputChange('email', e.target.value),
                    },
                    {
                        label: 'Rut',
                        name: 'rut',
                        placeholder: '23.770.330-1',
                        fieldType: 'input',
                        type: 'text',
                        minLength: 9,
                        maxLength: 12,
                        pattern: patternRut,
                        patternMessage: 'Debe ser xx.xxx.xxx-x o xxxxxxxx-x',
                        required: true,
                        errorMessageData: errorRut,
                        onChange: (e) => handleInputChange('rut', e.target.value),
                    },
                    {
                        label: 'Contraseña',
                        name: 'password',
                        placeholder: '**********',
                        fieldType: 'input',
                        type: 'password',
                        required: true,
                        minLength: 8,
                        maxLength: 50,
                        pattern: patternPassword,
                        patternMessage: 'Debe contener al menos una mayúscula, un número y un carácter especial.',
                    },
                    {
                        label: 'Tipo de cuenta',
                        name: 'rol',
                        fieldType: 'select',
                        required: true,
                        defaultValue: 'estudiante',
                        options: [
                            { label: 'Estudiante', value: 'estudiante' },
                            { label: 'Arrendador', value: 'arrendador' },
                        ],
                        onChange: handleRoleChange,
                    },
                    ...(role === 'estudiante'
                        ? [
                            {
                                label: 'Universidad',
                                name: 'universidad',
                                placeholder: 'Universidad de Concepción',
                                fieldType: 'input',
                                type: 'text',
                                required: true,
                                minLength: 2,
                                maxLength: 255,
                            },
                            {
                                label: 'Carrera',
                                name: 'carrera',
                                placeholder: 'Ingeniería Civil Informática',
                                fieldType: 'input',
                                type: 'text',
                                required: true,
                                minLength: 2,
                                maxLength: 255,
                            },
                        ]
                        : [
                            {
                                label: 'Teléfono',
                                name: 'telefono',
                                placeholder: '+56 9 1234 5678',
                                fieldType: 'input',
                                type: 'tel',
                                required: true,
                                minLength: 8,
                                maxLength: 20,
                                pattern: patternTelefono,
                                patternMessage: 'Debe ingresar un teléfono válido',
                            },
                        ]),
                    {
                        name: 'terminosAceptados',
                        fieldType: 'checkbox',
                        required: true,
                        requiredMessage: 'Debes aceptar los términos y condiciones',
                        checkboxLabel: 'Acepto los términos y condiciones',
                    },
                ]}
                buttonText="Registrarse"
                onSubmit={registerSubmit}
                footerContent={
                    <p>
                        ¿Ya tienes cuenta?, <a href="/auth">¡Inicia sesión aquí!</a>
                    </p>
                }
            />
        </main>
    );
};

export default Register;
