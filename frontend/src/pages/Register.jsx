import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { validate as validateRut } from 'rut.js';
import { register } from '@services/auth.service.js';
import Form from '@components/Form';
import useRegister from '@hooks/auth/useRegister.jsx';
import { showErrorAlert } from '@helpers/sweetAlert.js';
import '@styles/form.css';

const patternRut = /^(?:(?:[1-9]\d{0}|[1-2]\d{1})(\.\d{3}){2}|[1-9]\d{6}|[1-2]\d{7}|29\.999\.999|29999999)-[\dkK]$/;
const patternPassword = /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&._-])[A-Za-z\d@$!%*?&._-]+$/;
const patternNombre = /^[a-zA-Z\u00C0-\u017F\s]+$/;
const patternTelefono = /^[0-9+\-\s()]+$/;
const MAX_PROFILE_PHOTO_SIZE = 8 * 1024 * 1024;
const MAX_VERIFICATION_DOCUMENT_SIZE = 8 * 1024 * 1024;
const PROFILE_PHOTO_TYPES = ['image/jpeg', 'image/png'];
const VERIFICATION_DOCUMENT_TYPES = ['image/jpeg', 'image/png', 'application/pdf'];

const validateRutValue = (value) => (
    validateRut(String(value || '').trim()) || 'El RUT ingresado no es válido'
);

const validateFile = (allowedTypes, maxSize, formatMessage) => (value) => {
    const file = value?.[0];

    if (!file) return 'Este campo es obligatorio';
    if (!allowedTypes.includes(file.type)) return formatMessage;
    if (file.size > maxSize) return `El archivo debe pesar máximo ${maxSize / 1024 / 1024} MB`;

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
                navigate('/register/pending', {
                    replace: true,
                    state: {
                        email: data.email?.trim().toLowerCase(),
                        role: data.rol || 'estudiante',
                    },
                });
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
                validationMode="onChange"
                reValidationMode="onChange"
                showRequiredHints
                validateControlledCheckboxOnMount={false}
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
                        label: 'Correo electrónico',
                        name: 'email',
                        placeholder: 'ejemplo@gmail.cl',
                        fieldType: 'input',
                        type: 'email',
                        required: true,
                        minLength: 5,
                        maxLength: 100,
                        errorMessageData: errorEmail,
                        onChange: (e) => handleInputChange('email', e.target.value),
                    },
                    {
                        label: 'RUT',
                        name: 'rut',
                        placeholder: '12.345.678-9',
                        fieldType: 'input',
                        type: 'text',
                        minLength: 9,
                        maxLength: 12,
                        pattern: patternRut,
                        patternMessage: 'Debe ser xx.xxx.xxx-x o xxxxxxxx-x',
                        required: true,
                        validate: {
                            validRut: validateRutValue,
                        },
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
                        label: 'Confirmar contraseña',
                        name: 'confirmPassword',
                        placeholder: '**********',
                        fieldType: 'input',
                        type: 'password',
                        required: true,
                        minLength: 8,
                        maxLength: 50,
                        matchField: 'password',
                        matchMessage: 'Las contraseñas no coinciden',
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
                            {
                                label: 'Carnet de identidad',
                                name: 'carnetIdentidad',
                                fieldType: 'fieldGroup',
                                groupClassName: 'identity-document-group',
                                fields: [
                                    {
                                        label: 'Delantera',
                                        name: 'carnetIdentidadFrontal',
                                        fieldType: 'input',
                                        type: 'file',
                                        fileActionLabel: 'Delantera',
                                        filePlaceholder: 'JPG, PNG o PDF',
                                        fileVariant: 'identity-card',
                                        hideLabel: true,
                                        accept: '.jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf',
                                        required: true,
                                        validate: {
                                            validFile: validateFile(
                                                VERIFICATION_DOCUMENT_TYPES,
                                                MAX_VERIFICATION_DOCUMENT_SIZE,
                                                'La parte delantera del carnet debe ser JPG, PNG o PDF',
                                            ),
                                        },
                                    },
                                    {
                                        label: 'Trasera',
                                        name: 'carnetIdentidadReverso',
                                        fieldType: 'input',
                                        type: 'file',
                                        fileActionLabel: 'Trasera',
                                        filePlaceholder: 'JPG, PNG o PDF',
                                        fileVariant: 'identity-card',
                                        hideLabel: true,
                                        accept: '.jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf',
                                        required: true,
                                        validate: {
                                            validFile: validateFile(
                                                VERIFICATION_DOCUMENT_TYPES,
                                                MAX_VERIFICATION_DOCUMENT_SIZE,
                                                'La parte trasera del carnet debe ser JPG, PNG o PDF',
                                            ),
                                        },
                                    },
                                ],
                            },
                            {
                                label: 'Certificado de alumno regular',
                                name: 'documentoVerificacion',
                                fieldType: 'input',
                                type: 'file',
                                filePlaceholder: 'PDF, JPG o PNG',
                                accept: '.pdf,.jpg,.jpeg,.png,image/jpeg,image/png,application/pdf',
                                required: true,
                                validate: {
                                    validFile: validateFile(
                                        VERIFICATION_DOCUMENT_TYPES,
                                        MAX_VERIFICATION_DOCUMENT_SIZE,
                                        'El certificado debe ser PDF, JPG o PNG',
                                    ),
                                },
                            },
                        ]
                        : [
                            {
                                label: 'Teléfono',
                                name: 'telefono',
                                placeholder: 'Ingresa tu teléfono',
                                fieldType: 'input',
                                type: 'tel',
                                required: true,
                                minLength: 8,
                                maxLength: 20,
                                pattern: patternTelefono,
                                patternMessage: 'Debe ingresar un teléfono válido',
                            },
                            {
                                label: 'Foto de perfil',
                                name: 'fotoPerfil',
                                fieldType: 'input',
                                type: 'file',
                                filePlaceholder: 'JPG o PNG',
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
                                label: 'Carnet de identidad',
                                name: 'carnetIdentidadArrendador',
                                fieldType: 'fieldGroup',
                                groupClassName: 'identity-document-group',
                                fields: [
                                    {
                                        label: 'Delantera',
                                        name: 'documentoVerificacion',
                                        fieldType: 'input',
                                        type: 'file',
                                        fileActionLabel: 'Delantera',
                                        filePlaceholder: 'JPG, PNG o PDF',
                                        fileVariant: 'identity-card',
                                        hideLabel: true,
                                        accept: '.jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf',
                                        required: true,
                                        validate: {
                                            validFile: validateFile(
                                                VERIFICATION_DOCUMENT_TYPES,
                                                MAX_VERIFICATION_DOCUMENT_SIZE,
                                                'La parte delantera del carnet debe ser JPG, PNG o PDF',
                                            ),
                                        },
                                    },
                                    {
                                        label: 'Trasera',
                                        name: 'documentoVerificacionReverso',
                                        fieldType: 'input',
                                        type: 'file',
                                        fileActionLabel: 'Trasera',
                                        filePlaceholder: 'JPG, PNG o PDF',
                                        fileVariant: 'identity-card',
                                        hideLabel: true,
                                        accept: '.jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf',
                                        required: true,
                                        validate: {
                                            validFile: validateFile(
                                                VERIFICATION_DOCUMENT_TYPES,
                                                MAX_VERIFICATION_DOCUMENT_SIZE,
                                                'La parte trasera del carnet debe ser JPG, PNG o PDF',
                                            ),
                                        },
                                    },
                                ],
                            },
                            {
                                label: 'Comprobante de residencia',
                                name: 'documentoResidencia',
                                fieldType: 'input',
                                type: 'file',
                                filePlaceholder: 'JPG, PNG o PDF',
                                accept: '.jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf',
                                required: true,
                                validate: {
                                    validFile: validateFile(
                                        VERIFICATION_DOCUMENT_TYPES,
                                        MAX_VERIFICATION_DOCUMENT_SIZE,
                                        'El comprobante debe ser boleta, factura, certificado, contrato u otro respaldo en JPG, PNG o PDF',
                                    ),
                                },
                                extraContent: (
                                    <span style={{ color: '#64748b', fontSize: '12px' }}>
                                        Puedes subir una boleta o factura de servicio, certificado de residencia o contrato.
                                    </span>
                                ),
                            },
                        ]),
                    {
                        name: 'terminosAceptados',
                        fieldType: 'checkbox',
                        required: true,
                        requiredMessage: 'Debes aceptar los términos y condiciones',
                        checkboxLabel: 'Acepto los términos y condiciones',
                        checked: termsAccepted,
                        readOnly: true,
                        onClick: openTermsModal,
                        onLabelClick: openTermsModal,
                    },
                ]}
                buttonText="Registrarse"
                onSubmit={registerSubmit}
                footerContent={
                    <p className="forgot-password-footer">
                        ¿Ya tienes cuenta? <Link to="/auth">Inicia sesión aquí</Link>
                    </p>
                }
            />
            {termsModalOpen && (
                <div className="terms-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="terms-modal-title">
                    <section className="terms-modal">
                        <div className="terms-modal-header">
                            <h2 id="terms-modal-title">Términos y condiciones</h2>
                            <button className="terms-modal-close" type="button" onClick={closeTermsModal}>
                                Cerrar
                            </button>
                        </div>
                        <div className="terms-modal-body" onScroll={handleTermsScroll}>
                            <p>
                                Bienvenido a ArriendU. Al crear una cuenta aceptas utilizar la plataforma para fines
                                relacionados con la búsqueda, publicación y gestión responsable de arriendos.
                            </p>
                            <p>
                                La información ingresada durante el registro debe ser verídica, actualizada y pertenecer
                                al usuario que solicita la cuenta. La plataforma puede usar esos datos para verificar
                                identidad, rol y antecedentes asociados al servicio.
                            </p>
                            <p>
                                El tratamiento de datos personales se realizará conforme a la normativa chilena aplicable
                                sobre protección de la vida privada y datos personales, incluyendo la Ley N 19.628 y sus
                                modificaciones vigentes. ArriendU resguardará la confidencialidad, integridad y uso
                                proporcional de la información entregada.
                            </p>
                            <p>
                                Los estudiantes deben entregar datos académicos reales, como universidad y carrera, además
                                de certificado de alumno regular y carnet de identidad por ambos lados para validar su
                                identidad y rol académico. Los arrendadores deben entregar información de contacto válida
                                para facilitar la comunicación con la administración y con otros usuarios autorizados,
                                además de antecedentes de verificación como carnet de identidad y comprobante de
                                residencia cuando corresponda.
                            </p>
                            <p>
                                El usuario se compromete a mantener una conducta respetuosa, no entregar información
                                falsa, no suplantar identidades y no utilizar la plataforma para actividades ajenas al
                                propósito del sistema.
                            </p>
                            <p>
                                ArriendU puede revisar solicitudes de cuenta, aprobarlas, rechazarlas o solicitar
                                antecedentes adicionales cuando sea necesario para resguardar la seguridad y el buen uso
                                del servicio.
                            </p>
                            <p>
                                Los datos personales serán tratados únicamente para operar el sistema, gestionar cuentas,
                                permitir la comunicación entre usuarios y cumplir procesos de verificación internos del
                                proyecto.
                            </p>
                            <p>
                                Al aceptar estos términos confirmas que leíste el contenido completo y autorizas el uso
                                de la información necesaria para el funcionamiento de ArriendU.
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
                                Aceptar términos
                            </button>
                        </div>
                    </section>
                </div>
            )}
        </main>
    );
};

export default Register;
