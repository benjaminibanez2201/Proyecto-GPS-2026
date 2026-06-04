import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { register } from '@services/auth.service.js';
import Form from '@components/Form';
import useRegister from '@hooks/auth/useRegister.jsx';
import { showErrorAlert, showSuccessAlert } from '@helpers/sweetAlert.js';
import '@styles/form.css';

const patternRut = /^(?:(?:[1-9]\d{0}|[1-2]\d{1})(\.\d{3}){2}|[1-9]\d{6}|[1-2]\d{7}|29\.999\.999|29999999)-[\dkK]$/;
const patternPassword = /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&._-])[A-Za-z\d@$!%*?&._-]+$/;
const patternNombre = /^[a-zA-Z\u00C0-\u017F\s]+$/;
const patternTelefono = /^[0-9+\-\s()]+$/;
const MAX_PROFILE_PHOTO_SIZE = 8 * 1024 * 1024;
const MAX_VERIFICATION_DOCUMENT_SIZE = 8 * 1024 * 1024;
const PROFILE_PHOTO_TYPES = ['image/jpeg', 'image/png'];
const VERIFICATION_DOCUMENT_TYPES = ['image/jpeg', 'image/png', 'application/pdf'];

const validateFile = (allowedTypes, maxSize, formatMessage) => (value) => {
    const file = value?.[0];

    if (!file) return 'Este campo es obligatorio';
    if (!allowedTypes.includes(file.type)) return formatMessage;
    if (file.size > maxSize) return `El archivo debe pesar maximo ${maxSize / 1024 / 1024} MB`;

    return true;
};

const Register = () => {
    const navigate = useNavigate();
    const [role, setRole] = useState('estudiante');
    const [termsAccepted, setTermsAccepted] = useState(false);
    const [termsModalOpen, setTermsModalOpen] = useState(false);
    const [termsCanAccept, setTermsCanAccept] = useState(false);
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
                showSuccessAlert('Registrado', 'Usuario registrado exitosamente.');
                setTimeout(() => {
                    navigate('/auth');
                }, 3000);
            } else if (response.status === 'Client error') {
                errorData(response.details);
            }
        } catch (error) {
            console.error('Error al registrar un usuario: ', error);
            showErrorAlert('Cancelado', 'Ocurrio un error al registrarse.');
        }
    };

    const handleRoleChange = (event) => {
        setRole(event.target.value);
    };

    const openTermsModal = (event) => {
        event?.preventDefault();
        setTermsModalOpen(true);
        setTermsCanAccept(false);
    };

    const closeTermsModal = () => {
        setTermsModalOpen(false);
    };

    const handleTermsScroll = (event) => {
        const { clientHeight, scrollHeight, scrollTop } = event.currentTarget;
        const reachedBottom = scrollTop + clientHeight >= scrollHeight - 8;

        if (reachedBottom) {
            setTermsCanAccept(true);
        }
    };

    const acceptTerms = () => {
        if (!termsCanAccept) return;

        setTermsAccepted(true);
        setTermsModalOpen(false);
    };

    return (
        <main className="container register-container">
            <Form
                title="Crea tu cuenta"
                fields={[
                    {
                        label: 'Nombre completo',
                        name: 'nombreCompleto',
                        placeholder: 'Ingresa tu nombre completo',
                        fieldType: 'input',
                        type: 'text',
                        required: true,
                        minLength: 15,
                        maxLength: 50,
                        pattern: patternNombre,
                        patternMessage: 'Debe contener solo letras y espacios',
                    },
                    {
                        label: 'Correo electronico',
                        name: 'email',
                        placeholder: 'correo@ejemplo.cl',
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
                        placeholder: '12.345.678-9',
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
                        label: 'Contrasena',
                        name: 'password',
                        placeholder: '**********',
                        fieldType: 'input',
                        type: 'password',
                        required: true,
                        minLength: 8,
                        maxLength: 50,
                        pattern: patternPassword,
                        patternMessage: 'Debe contener al menos una mayuscula, un numero y un caracter especial.',
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
                                placeholder: 'Ingresa tu universidad',
                                fieldType: 'input',
                                type: 'text',
                                required: true,
                                minLength: 2,
                                maxLength: 255,
                            },
                            {
                                label: 'Carrera',
                                name: 'carrera',
                                placeholder: 'Ingresa tu carrera',
                                fieldType: 'input',
                                type: 'text',
                                required: true,
                                minLength: 2,
                                maxLength: 255,
                            },
                        ]
                        : [
                            {
                                label: 'Telefono',
                                name: 'telefono',
                                placeholder: 'Ingresa tu telefono',
                                fieldType: 'input',
                                type: 'tel',
                                required: true,
                                minLength: 8,
                                maxLength: 20,
                                pattern: patternTelefono,
                                patternMessage: 'Debe ingresar un telefono valido',
                            },
                            {
                                label: 'Foto de perfil',
                                name: 'fotoPerfil',
                                fieldType: 'input',
                                type: 'file',
                                accept: '.jpg,.jpeg,.png,image/jpeg,image/png',
                                required: true,
                                validate: {
                                    validFile: validateFile(
                                        PROFILE_PHOTO_TYPES,
                                        MAX_PROFILE_PHOTO_SIZE,
                                        'La foto de perfil debe ser JPG o PNG',
                                    ),
                                },
                            },
                            {
                                label: 'Foto de carnet de identidad',
                                name: 'documentoVerificacion',
                                fieldType: 'input',
                                type: 'file',
                                accept: '.jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf',
                                required: true,
                                validate: {
                                    validFile: validateFile(
                                        VERIFICATION_DOCUMENT_TYPES,
                                        MAX_VERIFICATION_DOCUMENT_SIZE,
                                        'El documento debe ser JPG, PNG o PDF',
                                    ),
                                },
                            },
                        ]),
                    {
                        name: 'terminosAceptados',
                        fieldType: 'checkbox',
                        required: true,
                        requiredMessage: 'Debes aceptar los terminos y condiciones',
                        checkboxLabel: 'Acepto los terminos y condiciones',
                        checked: termsAccepted,
                        readOnly: true,
                        onClick: openTermsModal,
                        onLabelClick: openTermsModal,
                    },
                ]}
                buttonText="Registrarse"
                onSubmit={registerSubmit}
                footerContent={
                    <p>
                        Ya tienes cuenta?, <Link to="/auth">Inicia sesion aqui</Link>
                    </p>
                }
            />
            {termsModalOpen && (
                <div className="terms-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="terms-modal-title">
                    <section className="terms-modal">
                        <div className="terms-modal-header">
                            <h2 id="terms-modal-title">Terminos y condiciones</h2>
                            <button className="terms-modal-close" type="button" onClick={closeTermsModal}>
                                Cerrar
                            </button>
                        </div>
                        <div className="terms-modal-body" onScroll={handleTermsScroll}>
                            <p>
                                Bienvenido a ArriendU. Al crear una cuenta aceptas utilizar la plataforma para fines
                                relacionados con la busqueda, publicacion y gestion responsable de arriendos.
                            </p>
                            <p>
                                La informacion ingresada durante el registro debe ser veridica, actualizada y pertenecer
                                al usuario que solicita la cuenta. La plataforma puede usar esos datos para verificar
                                identidad, rol y antecedentes asociados al servicio.
                            </p>
                            <p>
                                Los estudiantes deben entregar datos academicos reales, como universidad y carrera. Los
                                arrendadores deben entregar informacion de contacto valida para facilitar la comunicacion
                                con la administracion y con otros usuarios autorizados.
                            </p>
                            <p>
                                El usuario se compromete a mantener una conducta respetuosa, no entregar informacion
                                falsa, no suplantar identidades y no utilizar la plataforma para actividades ajenas al
                                proposito del sistema.
                            </p>
                            <p>
                                ArriendU puede revisar solicitudes de cuenta, aprobarlas, rechazarlas o solicitar
                                antecedentes adicionales cuando sea necesario para resguardar la seguridad y el buen uso
                                del servicio.
                            </p>
                            <p>
                                Los datos personales seran tratados unicamente para operar el sistema, gestionar cuentas,
                                permitir la comunicacion entre usuarios y cumplir procesos de verificacion internos del
                                proyecto.
                            </p>
                            <p>
                                Al aceptar estos terminos confirmas que leiste el contenido completo y autorizas el uso
                                de la informacion necesaria para el funcionamiento de ArriendU.
                            </p>
                        </div>
                        <div className="terms-modal-actions">
                            <button className="terms-modal-secondary" type="button" onClick={closeTermsModal}>
                                Cancelar
                            </button>
                            <button
                                className="terms-modal-primary"
                                type="button"
                                disabled={!termsCanAccept}
                                onClick={acceptTerms}
                            >
                                Aceptar terminos
                            </button>
                        </div>
                    </section>
                </div>
            )}
        </main>
    );
};

export default Register;
