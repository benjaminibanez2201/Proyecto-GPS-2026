import { useForm } from 'react-hook-form';
import { isValidElement, useEffect, useMemo, useRef, useState } from 'react';
import '@styles/form.css';
import HideIcon from '../assets/HideIcon.svg';
import IdentityCardIcon from '../assets/IdentityCardIcon.svg';
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
    const [selectedFiles, setSelectedFiles] = useState({});
    const [fileUploadProgress, setFileUploadProgress] = useState({});
    const [fileUploadStatus, setFileUploadStatus] = useState({});
    const [dragActiveFiles, setDragActiveFiles] = useState({});
    const fileInputRefs = useRef({});
    const uploadTimerRefs = useRef({});
    const flatFields = useMemo(() => {
        const flattenFields = (fieldList) => fieldList.flatMap((field) => (
            field.fieldType === 'fieldGroup' && Array.isArray(field.fields)
                ? flattenFields(field.fields)
                : field
        ));

        return flattenFields(fields);
    }, [fields]);
    const hasPendingFileUploads = useMemo(() => (
        Object.values(fileUploadStatus).some((status) => status === 'uploading')
    ), [fileUploadStatus]);

    useEffect(() => {
        flatFields.forEach((field) => {
            if (field.fieldType === 'checkbox' && typeof field.checked === 'boolean') {
                setValue(field.name, field.checked, { shouldValidate: true });
            }
        });
    }, [flatFields, setValue]);

    useEffect(() => {
        const activeFileNames = new Set(
            flatFields
                .filter((field) => field.type === 'file')
                .map((field) => field.name),
        );

        Object.keys(uploadTimerRefs.current).forEach((fieldName) => {
            if (!activeFileNames.has(fieldName)) {
                clearInterval(uploadTimerRefs.current[fieldName]);
                delete uploadTimerRefs.current[fieldName];
            }
        });

        const keepActiveFiles = (current) => {
            const next = Object.fromEntries(
                Object.entries(current).filter(([fieldName]) => activeFileNames.has(fieldName)),
            );

            return Object.keys(next).length === Object.keys(current).length ? current : next;
        };

        setSelectedFiles(keepActiveFiles);
        setFileUploadProgress(keepActiveFiles);
        setFileUploadStatus(keepActiveFiles);
        setDragActiveFiles(keepActiveFiles);
    }, [flatFields]);

    useEffect(() => () => {
        Object.values(uploadTimerRefs.current).forEach((timerId) => clearInterval(timerId));
    }, []);

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
        if (hasPendingFileUploads) return;
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
        maxLength: field.maxLength ? { value: field.maxLength, message: `Debe tener máximo ${field.maxLength} caracteres` } : false,
        pattern: field.pattern ? { value: field.pattern, message: field.patternMessage || 'Formato no válido' } : false,
        validate: field.validate || {},
    });

    const getIconSrc = (icon) => {
        if (icon === 'identity-card') return IdentityCardIcon;
        return icon;
    };

    const clearFileUploadTimer = (fieldName) => {
        if (uploadTimerRefs.current[fieldName]) {
            clearInterval(uploadTimerRefs.current[fieldName]);
            delete uploadTimerRefs.current[fieldName];
        }
    };

    const queueSelectedFile = (fieldName, file) => {
        clearFileUploadTimer(fieldName);
        setSelectedFiles((current) => ({
            ...current,
            [fieldName]: file || null,
        }));

        if (!file) {
            setFileUploadProgress((current) => {
                const next = { ...current };
                delete next[fieldName];
                return next;
            });
            setFileUploadStatus((current) => {
                const next = { ...current };
                delete next[fieldName];
                return next;
            });
            return;
        }

        let progress = 0;
        setFileUploadProgress((current) => ({ ...current, [fieldName]: progress }));
        setFileUploadStatus((current) => ({ ...current, [fieldName]: 'uploading' }));

        uploadTimerRefs.current[fieldName] = setInterval(() => {
            progress = Math.min(100, progress + 18);
            setFileUploadProgress((current) => ({ ...current, [fieldName]: progress }));

            if (progress >= 100) {
                clearFileUploadTimer(fieldName);
                setFileUploadStatus((current) => ({ ...current, [fieldName]: 'ready' }));
            }
        }, 90);
    };

    const handleFileInputChange = (field, event, registerProps) => {
        registerProps.onChange(event);
        field.onChange?.(event);
        queueSelectedFile(field.name, event.target.files?.[0] || null);
    };

    const handleFileDrop = (field, event, registerProps) => {
        event.preventDefault();
        event.stopPropagation();
        setDragActiveFiles((current) => ({ ...current, [field.name]: false }));

        const files = event.dataTransfer?.files;
        const file = files?.[0] || null;

        if (!file) return;

        if (fileInputRefs.current[field.name]) {
            try {
                fileInputRefs.current[field.name].files = files;
            } catch {
                // Some browsers do not allow assigning FileList to the native input.
            }
        }

        const droppedFileEvent = {
            target: {
                name: field.name,
                type: 'file',
                files,
            },
            currentTarget: {
                name: field.name,
                type: 'file',
                files,
            },
        };

        registerProps.onChange(droppedFileEvent);
        field.onChange?.(droppedFileEvent);
        setValue(field.name, files, {
            shouldDirty: true,
            shouldTouch: true,
            shouldValidate: true,
        });
        queueSelectedFile(field.name, file);
    };

    const renderInput = (field) => {
        const registerProps = register(field.name, getRegisterOptions(field));

        if (field.type === 'file') {
            const selectedFile = selectedFiles[field.name];
            const fileIcon = field.fileVariant === 'identity-card' ? null : getIconSrc(field.fileIcon);
            const uploadProgress = fileUploadProgress[field.name] || 0;
            const uploadStatus = fileUploadStatus[field.name];
            const isUploading = uploadStatus === 'uploading';
            const isDragging = Boolean(dragActiveFiles[field.name]);
            const fileControlClassName = [
                'file-upload-control',
                fileIcon ? 'has-file-icon' : '',
                selectedFile ? 'has-selected-file' : '',
                isUploading ? 'is-uploading' : '',
                isDragging ? 'is-dragging' : '',
                field.fileVariant ? `file-upload-${field.fileVariant}` : '',
            ].filter(Boolean).join(' ');

            return (
                <div className="file-upload-field">
                    <input
                        {...registerProps}
                        id={field.name}
                        className="file-input-native"
                        name={field.name}
                        type="file"
                        accept={field.accept}
                        capture={field.capture}
                        disabled={field.disabled}
                        ref={(element) => {
                            registerProps.ref(element);
                            fileInputRefs.current[field.name] = element;
                        }}
                        onChange={(event) => handleFileInputChange(field, event, registerProps)}
                    />
                    <label
                        className={fileControlClassName}
                        htmlFor={field.name}
                        onDragEnter={(event) => {
                            event.preventDefault();
                            setDragActiveFiles((current) => ({ ...current, [field.name]: true }));
                        }}
                        onDragOver={(event) => {
                            event.preventDefault();
                            setDragActiveFiles((current) => ({ ...current, [field.name]: true }));
                        }}
                        onDragLeave={(event) => {
                            event.preventDefault();
                            setDragActiveFiles((current) => ({ ...current, [field.name]: false }));
                        }}
                        onDrop={(event) => handleFileDrop(field, event, registerProps)}
                    >
                        {fileIcon && (
                            <span className="file-upload-icon-wrap" aria-hidden="true">
                                <img className="file-upload-icon" src={fileIcon} alt="" />
                            </span>
                        )}
                        <span className="file-upload-copy">
                            <span className="file-upload-action">
                                {field.fileActionLabel || 'Adjuntar archivo'}
                            </span>
                            <span className={`file-upload-name ${selectedFile ? 'has-file' : ''}`}>
                                {selectedFile?.name || field.filePlaceholder || 'PDF, JPG o PNG'}
                            </span>
                            {selectedFile && (
                                <span className="file-upload-progress" aria-hidden="true">
                                    <span style={{ width: `${uploadProgress}%` }} />
                                </span>
                            )}
                        </span>
                    </label>
                </div>
            );
        }

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
                <option value="">Seleccionar opción</option>
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
        const isControlledCheckbox = typeof field.checked === 'boolean';

        return (
            <div className="checkbox-field">
                <input
                    {...checkboxRegister}
                    id={field.name}
                    name={field.name}
                    type="checkbox"
                    checked={isControlledCheckbox ? field.checked : undefined}
                    defaultChecked={isControlledCheckbox ? undefined : field.defaultChecked || false}
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

    const renderField = (field, index) => {
        if (field.fieldType === 'fieldGroup') {
            const groupIcon = getIconSrc(field.icon);
            const groupClassName = [
                'form-field-group',
                field.groupClassName || '',
            ].filter(Boolean).join(' ');

            return (
                <div className={groupClassName} key={field.name || index}>
                    {(field.label || groupIcon) && (
                        <div className="form-field-group-header">
                            {groupIcon && (
                                <span className="form-field-group-icon" aria-hidden="true">
                                    <img src={groupIcon} alt="" />
                                </span>
                            )}
                            {field.label && <span className="form-field-group-title">{field.label}</span>}
                        </div>
                    )}
                    <div className="form-field-group-items">
                        {field.fields?.map((groupField, groupIndex) => renderField(
                            groupField,
                            `${field.name || index}-${groupField.name || groupIndex}`,
                        ))}
                    </div>
                </div>
            );
        }

        return (
            <div className="container_inputs" key={field.name || index}>
                {field.label && !field.hideLabel && <label htmlFor={field.name}>{field.label}</label>}
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
            {fields.map((field, index) => renderField(field, index))}
            {buttonText && (
                <button type="submit" disabled={buttonDisabled || hasPendingFileUploads}>
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
