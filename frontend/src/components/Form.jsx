import { useForm } from 'react-hook-form';
import { useState } from 'react';
import { isValidElement } from 'react';
import '@styles/form.css';
import HideIcon from '../assets/HideIcon.svg';
import ViewIcon from '../assets/ViewIcon.svg';

const Form = ({ title, description, fields, buttonText, buttonDisabled, onSubmit, footerContent, backgroundColor, inlineMessage }) => {
    const { register, handleSubmit, formState: { errors } } = useForm();
    const [visiblePasswords, setVisiblePasswords] = useState({});

    const renderInlineMessage = () => {
        if (!inlineMessage) return null;
        if (typeof inlineMessage === 'string') return <p>{inlineMessage}</p>;
        if (isValidElement(inlineMessage)) return inlineMessage;
        return null;
    };

    const togglePasswordVisibility = (fieldName) => {
        setVisiblePasswords((current) => ({
            ...current,
            [fieldName]: !current[fieldName]
        }));
    };

    const onFormSubmit = (data) => {
        onSubmit(data);
    };

    return (
        <form
            className="form"
            style={{ backgroundColor: backgroundColor }}
            onSubmit={handleSubmit(onFormSubmit)}
            autoComplete="off"
        >
            <h1>{title}</h1>
            {description && <p className="form-description">{description}</p>}
            {fields.map((field, index) => (
                <div className="container_inputs" key={index}>
                    {field.label && <label htmlFor={field.name}>{field.label}</label>}
                    {field.fieldType === 'input' && (
                        (() => {
                            const registerProps = register(field.name, {
                                required: field.required ? 'Este campo es obligatorio' : false,
                                minLength: field.minLength ? { value: field.minLength, message: `Debe tener al menos ${field.minLength} caracteres` } : false,
                                maxLength: field.maxLength ? { value: field.maxLength, message: `Debe tener máximo ${field.maxLength} caracteres` } : false,
                                pattern: field.pattern ? { value: field.pattern, message: field.patternMessage || 'Formato no válido' } : false,
                                validate: field.validate || {},
                            });

                            return (
                        <input
                            {...registerProps}
                            name={field.name}
                            placeholder={field.placeholder}
                            type={field.type === 'password' ? (visiblePasswords[field.name] ? 'text' : 'password') : field.type}
                            defaultValue={field.defaultValue || ''}
                            disabled={field.disabled}
                            onChange={(e) => {
                                registerProps.onChange(e);
                                field.onChange?.(e);
                            }}
                        />
                            );
                        })()
                    )}
                    {field.fieldType === 'textarea' && (
                        (() => {
                            const registerProps = register(field.name, {
                                required: field.required ? 'Este campo es obligatorio' : false,
                                minLength: field.minLength ? { value: field.minLength, message: `Debe tener al menos ${field.minLength} caracteres` } : false,
                                maxLength: field.maxLength ? { value: field.maxLength, message: `Debe tener máximo ${field.maxLength} caracteres` } : false,
                                pattern: field.pattern ? { value: field.pattern, message: field.patternMessage || 'Formato no válido' } : false,
                                validate: field.validate || {},
                            });

                            return (
                        <textarea
                            {...registerProps}
                            name={field.name}
                            placeholder={field.placeholder}
                            defaultValue={field.defaultValue || ''}
                            disabled={field.disabled}
                            onChange={(e) => {
                                registerProps.onChange(e);
                                field.onChange?.(e);
                            }}
                        />
                            );
                        })()
                    )}
                    {field.fieldType === 'select' && (
                        (() => {
                            const registerProps = register(field.name, {
                                required: field.required ? 'Este campo es obligatorio' : false,
                                validate: field.validate || {},
                            });

                            return (
                        <select
                            {...registerProps}
                            name={field.name}
                            defaultValue={field.defaultValue || ''}
                            disabled={field.disabled}
                            onChange={(e) => {
                                registerProps.onChange(e);
                                field.onChange?.(e);
                            }}
                        >
                            <option value="">Seleccionar opción</option>
                            {field.options && field.options.map((option, optIndex) => (
                                <option className="options-class" key={optIndex} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                            );
                        })()
                    )}
                    {field.type === 'password' && field.showVisibilityToggle !== false && (
                        <button
                            type="button"
                            className="toggle-password-icon"
                            onClick={() => togglePasswordVisibility(field.name)}
                            aria-label={visiblePasswords[field.name] ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                        >
                            <img src={visiblePasswords[field.name] ? ViewIcon : HideIcon} alt="" />
                        </button>
                    )}
                    <div className={`error-message ${errors[field.name] || field.errorMessageData ? 'visible' : ''}`}>
                        {typeof errors[field.name]?.message === 'string'
                            ? errors[field.name]?.message
                            : typeof field.errorMessageData === 'string'
                                ? field.errorMessageData
                                : ''}
                    </div>
                </div>
            ))}
            {buttonText && (
                <button type="submit" disabled={buttonDisabled}>
                    {buttonText}
                </button>
            )}
            {footerContent && <div className="footerContent">{footerContent}</div>}
            {inlineMessage && (
                <div className="form-inline-message">
                    {renderInlineMessage()}
                </div>
            )}
        </form>
    );
};

export default Form;