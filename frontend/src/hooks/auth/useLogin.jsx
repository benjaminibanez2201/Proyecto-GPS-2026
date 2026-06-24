import { useState } from 'react';
import { showErrorAlert } from '@helpers/sweetAlert.js';

const useLogin = () => {
    const [inputData, setInputData] = useState({ email: '', password: '' });

    const normalizeError = (dataMessage) => {
        if (typeof dataMessage === 'string') {
            return {
                dataInfo: 'auth',
                message: dataMessage,
            };
        }

        if (dataMessage && typeof dataMessage === 'object') {
            return {
                dataInfo: dataMessage.dataInfo || 'auth',
                message: dataMessage.message || 'Credenciales incorrectas',
            };
        }

        return {
            dataInfo: 'auth',
            message: 'Credenciales incorrectas',
        };
    };

    const errorData = (dataMessage) => {
        const normalizedError = normalizeError(dataMessage);

        if (normalizedError.dataInfo === 'auth' || normalizedError.dataInfo === 'email' || normalizedError.dataInfo === 'password') {
            showErrorAlert('Credenciales incorrectas', normalizedError.message);
        } else if (normalizedError.dataInfo === 'estadoCuenta') {
            showErrorAlert('Cuenta suspendida\n', normalizedError.message);
        } else if (normalizedError.dataInfo === 'estadoVerificacion') {
            showErrorAlert('Cuenta no disponible', normalizedError.message);
        } else {
            showErrorAlert('Credenciales incorrectas', normalizedError.message);
        }
    };

    const handleInputChange = (field, value) => {
        setInputData(prevState => ({
            ...prevState,
            [field]: value
        }));
    };

    return {
        inputData,
        errorData,
        handleInputChange,
    };
};

export default useLogin;
