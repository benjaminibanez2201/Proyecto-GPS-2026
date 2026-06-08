import { useForm } from 'react-hook-form';
import { isValidElement, useEffect, useState } from 'react';
import '@styles/form.css';
import HideIcon from '../assets/HideIcon.svg';
import ViewIcon from '../assets/ViewIcon.svg';

const Form = ({
    backgroundColor,
    buttonDisabled,
    buttonText,
    description,
    fields,
    footerContent,
    inlineMessage,
    onSubmit,
    title,
}) => {
    const { register, handleSubmit, formState: { errors }, setValue } = useForm({
        shouldUnregister: true,
    });
    const [visiblePasswords, setVisiblePasswords] = useState({});

    useEffect(() => {
        fields.forEach((field) => {
            if (field.fieldType === 'checkbox' && typeof field.checked === 'boolean') {
                setValue(field.name, field.checked, { shouldValidate: true });
            }
        });
    }, [fields, setValue]);

    const renderInlineMessage = () => {
        if (!inlineMessage) return null;
        if (typeof inlineMessage === 'string') return <p>{inlineMessage}</p>;
        if (isValidElement(inlineMessage)) return inlineMessage;
        return null;
    };

    const togglePasswordVisibility = (fieldName) => {
        setVisiblePasswords((current) => ({
            ...current,
            [fieldName]: !current[fieldName],
        }));
    };

    const onFormSubmit = (data) => {
        onSubmit(data);
    };

    const getInputType = (field) => {
        if (field.type === 'password') {
            return visiblePasswords[field.name] ? 'text' : 'password';
        }

        return field.type;
    };

    const getRegisterOptions = (field) => ({
        required: field.required ? field.requiredMessage || 'Este campo es obligatorio' : false,
        minLength: field.minLength ? { value: field.minLength, message: `Debe tener al menos ${field.minLength} caracteres` } : false,
        maxLength: field.maxLength ? { value: field.maxLength, message: `Debe tener maximo ${field.maxLength} caracteres` } : false,
        pattern: field.pattern ? { value: field.pattern, message: field.patternMessage || 'Formato no valido' } : false,
        validate: field.validate || {},
    });

    const renderInput = (field) => {
        const registerProps = register(field.name, getRegisterOptions(field));

        return (
            <input
                {...registerProps}
                name={field.name}
                placeholder={field.placeholder}
                type={getInputType(field)}
                accept={field.accept}
                defaultValue={field.type === 'file' ? undefined : field.defaultValue || ''}
                disabled={field.disabled}
                onChange={(event) => {
                    registerProps.onChange(event);
                    field.onChange?.(event);
                }}
            />
        );
    };

    const renderTextarea = (field) => {
        const registerProps = register(field.name, getRegisterOptions(field));

        return (
            <textarea
                {...registerProps}
                name={field.name}
                placeholder={field.placeholder}
                defaultValue={field.defaultValue || ''}
                disabled={field.disabled}
                onChange={(event) => {
                    registerProps.onChange(event);
                    field.onChange?.(event);
                }}
            />
        );
    };

    const renderSelect = (field) => {
        const registerProps = register(field.name, {
            required: field.required ? field.requiredMessage || 'Este campo es obligatorio' : false,
            validate: field.validate || {},
        });

        return (
            <select
                {...registerProps}
                name={field.name}
                defaultValue={field.defaultValue || ''}
                disabled={field.disabled}
                onChange={(event) => {
                    registerProps.onChange(event);
                    field.onChange?.(event);
                }}
            >
                <option value="">Seleccionar opcion</option>
                {field.options && field.options.map((option, optIndex) => (
                    <option className="options-class" key={optIndex} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>
        );
    };

    const renderCheckbox = (field) => {
        const checkboxRegister = register(field.name, {
            required: field.required ? field.requiredMessage || 'Este campo es obligatorio' : false,
            validate: field.validate || {},
        });

        return (
            <div className="checkbox-field">
                <input
                    {...checkboxRegister}
                    id={field.name}
                    name={field.name}
                    type="checkbox"
                    checked={typeof field.checked === 'boolean' ? field.checked : undefined}
                    defaultChecked={field.defaultChecked || false}
                    disabled={field.disabled}
                    readOnly={field.readOnly}
                    onClick={field.onClick}
                    onChange={(event) => {
                        checkboxRegister.onChange(event);
                        field.onChange?.(event);
                    }}
                />
                <span className="checkbox-copy">
                    {field.onLabelClick ? (
                        <button
                            className="checkbox-label-button"
                            type="button"
                            onClick={field.onLabelClick}
                        >
                            {field.checkboxLabel}
                        </button>
                    ) : (
                        <label htmlFor={field.name}>{field.checkboxLabel}</label>
                    )}
                    {field.checkboxAction}
                </span>
            </div>
        );
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
                    {field.fieldType === 'input' && renderInput(field)}
                    {field.fieldType === 'textarea' && renderTextarea(field)}
                    {field.fieldType === 'select' && renderSelect(field)}
                    {field.fieldType === 'checkbox' && renderCheckbox(field)}
                    {field.extraContent && <div className="field-extra-content">{field.extraContent}</div>}
                    {field.type === 'password' && field.showVisibilityToggle !== false && (
                        <button
                            type="button"
                            className="toggle-password-icon"
                            onClick={() => togglePasswordVisibility(field.name)}
                            aria-label={visiblePasswords[field.name] ? 'Ocultar contrasena' : 'Mostrar contrasena'}
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
