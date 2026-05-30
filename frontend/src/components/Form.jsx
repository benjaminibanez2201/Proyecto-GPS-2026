import { useForm } from 'react-hook-form';
import { useEffect, useState } from 'react';
import '@styles/form.css';
import HideIcon from '../assets/HideIcon.svg';
import ViewIcon from '../assets/ViewIcon.svg';

const Form = ({ title, fields, buttonText, onSubmit, footerContent, backgroundColor }) => {
    const { register, handleSubmit, formState: { errors }, setValue } = useForm({
        shouldUnregister: true,
    });
    const [showPassword, setShowPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    const toggleNewPasswordVisibility = () => {
        setShowNewPassword(!showNewPassword);
    };

    const onFormSubmit = (data) => {
        onSubmit(data);
    };

    useEffect(() => {
        fields.forEach((field) => {
            if (field.fieldType === 'checkbox' && typeof field.checked === 'boolean') {
                setValue(field.name, field.checked, { shouldValidate: true });
            }
        });
    }, [fields, setValue]);

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
            {fields.map((field, index) => (
                <div className="container_inputs" key={index}>
                    {field.label && <label htmlFor={field.name}>{field.label}</label>}
                    {field.fieldType === 'input' && (
                        <input
                            {...register(field.name, {
                                required: field.required ? 'Este campo es obligatorio' : false,
                                minLength: field.minLength ? { value: field.minLength, message: `Debe tener al menos ${field.minLength} caracteres` } : false,
                                maxLength: field.maxLength ? { value: field.maxLength, message: `Debe tener máximo ${field.maxLength} caracteres` } : false,
                                pattern: field.pattern ? { value: field.pattern, message: field.patternMessage || 'Formato no válido' } : false,
                                validate: field.validate || {},
                            })}
                            name={field.name}
                            placeholder={field.placeholder}
                            type={field.type === 'password' && field.name === 'password' ? (showPassword ? 'text' : 'password') :
                                field.type === 'password' && field.name === 'newPassword' ? (showNewPassword ? 'text' : 'password') :
                                field.type}
                            defaultValue={field.defaultValue || ''}
                            disabled={field.disabled}
                            onChange={field.onChange}
                        />
                    )}
                    {field.fieldType === 'textarea' && (
                        <textarea
                            {...register(field.name, {
                                required: field.required ? 'Este campo es obligatorio' : false,
                                minLength: field.minLength ? { value: field.minLength, message: `Debe tener al menos ${field.minLength} caracteres` } : false,
                                maxLength: field.maxLength ? { value: field.maxLength, message: `Debe tener máximo ${field.maxLength} caracteres` } : false,
                                pattern: field.pattern ? { value: field.pattern, message: field.patternMessage || 'Formato no válido' } : false,
                                validate: field.validate || {},
                            })}
                            name={field.name}
                            placeholder={field.placeholder}
                            defaultValue={field.defaultValue || ''}
                            disabled={field.disabled}
                            onChange={field.onChange}
                        />
                    )}
                    {field.fieldType === 'select' && (
                        <select
                            {...register(field.name, {
                                required: field.required ? 'Este campo es obligatorio' : false,
                                validate: field.validate || {},
                            })}
                            name={field.name}
                            defaultValue={field.defaultValue || ''}
                            disabled={field.disabled}
                            onChange={field.onChange}
                        >
                            <option value="">Seleccionar opción</option>
                            {field.options && field.options.map((option, optIndex) => (
                                <option className="options-class" key={optIndex} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    )}
                    {field.fieldType === 'checkbox' && renderCheckbox(field)}
                    {field.extraContent && <div className="field-extra-content">{field.extraContent}</div>}
                    {field.type === 'password' && field.name === 'password' && (
                        <span className="toggle-password-icon" onClick={togglePasswordVisibility}>
                            <img src={showPassword ? ViewIcon : HideIcon} />
                        </span>
                    )}
                    {field.type === 'password' && field.name === 'newPassword' && (
                        <span className="toggle-password-icon" onClick={toggleNewPasswordVisibility}>
                            <img src={showNewPassword ? ViewIcon : HideIcon} />
                        </span>
                    )}
                    <div className={`error-message ${errors[field.name] || field.errorMessageData ? 'visible' : ''}`}>
                        {errors[field.name]?.message || field.errorMessageData || ''}
                    </div>
                </div>
            ))}
            {buttonText && <button type="submit">{buttonText}</button>}
            {footerContent && <div className="footerContent">{footerContent}</div>}
        </form>
    );
};

export default Form;
