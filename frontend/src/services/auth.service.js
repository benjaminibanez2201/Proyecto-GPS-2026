import axios from './root.service.js';
import cookies from 'js-cookie';
import { jwtDecode } from 'jwt-decode';

export async function login(dataUser) {
    try {
        const response = await axios.post('/auth/login', {
            email: dataUser.email,
            password: dataUser.password,
        });
        const { status, data } = response;

        if (status === 200) {
            const {
                email,
                emailVerificado,
                estadoVerificacion,
                id,
                nombreCompleto,
                rol,
                rut,
            } = jwtDecode(data.data.token);
            const userData = { email, emailVerificado, estadoVerificacion, id, nombreCompleto, rol, rut };

            sessionStorage.setItem('usuario', JSON.stringify(userData));
            axios.defaults.headers.common['Authorization'] = `Bearer ${data.data.token}`;
            cookies.set('jwt-auth', data.data.token, { path: '/' });
            return response.data;
        }
    } catch (error) {
        if (error.response?.data) {
            return error.response.data;
        }

        return {
            status: 'Server error',
            message: 'Error al conectar con el servidor',
            details: null,
        };
    }
}

export async function register(data) {
    try {
        const rol = data.rol || 'estudiante';
        const nombreCompleto = [data.nombres, data.apellidos]
            .map((value) => String(value || '').trim())
            .filter(Boolean)
            .join(' ');

        const basePayload = {
            nombreCompleto,
            email: data.email.trim().toLowerCase(),
            rut: data.rut.trim(),
            password: data.password,
            rol,
            terminosAceptados: Boolean(data.terminosAceptados),
        };

        const rolePayload = rol === 'estudiante'
            ? {
                universidad: data.universidad.trim(),
                carrera: data.carrera.trim(),
            }
            : {
                telefono: data.telefono.trim(),
            };

        const filesToUpload = [];

        if (rol === 'arrendador') {
            filesToUpload.push(
                ['documentoResidencia', data.documentoResidencia?.[0]],
                ['documentoVerificacion', data.documentoVerificacion?.[0]],
                ['documentoVerificacionReverso', data.documentoVerificacionReverso?.[0]],
            );
        } else {
            filesToUpload.push(
                ['documentoVerificacion', data.documentoVerificacion?.[0]],
                ['carnetIdentidadFrontal', data.carnetIdentidadFrontal?.[0]],
                ['carnetIdentidadReverso', data.carnetIdentidadReverso?.[0]],
            );
        }

        if (filesToUpload.length > 0) {
            const formData = new FormData();
            const payload = {
                ...basePayload,
                ...rolePayload,
            };

            Object.entries(payload).forEach(([key, value]) => {
                formData.append(key, String(value));
            });
            filesToUpload.forEach(([key, file]) => {
                if (file) formData.append(key, file);
            });

            const response = await axios.post('/auth/register', formData);
            return response.data;
        }

        const response = await axios.post('/auth/register', {
            ...basePayload,
            ...rolePayload,
        });
        return response.data;
    } catch (error) {
        if (error.response?.data) {
            return error.response.data;
        }

        return {
            status: 'Server error',
            message: 'Error al conectar con el servidor',
            details: null,
        };
    }
}

export async function logout() {
    try {
        await axios.post('/auth/logout');
        sessionStorage.removeItem('usuario');
        cookies.remove('jwt');
        cookies.remove('jwt-auth');
    } catch (error) {
        console.error('Error al cerrar sesion:', error);
    }
}

export async function verifyEmail(token) {
    try {
        const response = await axios.post(`/auth/verify-email/${encodeURIComponent(token)}`);
        return response.data;
    } catch (error) {
        return error.response?.data || {
            status: 'Server error',
            message: 'Error al conectar con el servidor',
            details: null,
        };
    }
}

export async function resendEmailVerification(email) {
    try {
        const response = await axios.post('/auth/verify-email/resend', { email });
        return response.data;
    } catch (error) {
        return error.response?.data || {
            status: 'Server error',
            message: 'Error al conectar con el servidor',
            details: null,
        };
    }
}

export async function forgotPassword(email) {
    try {
        const response = await axios.post('/auth/forgot-password', { email });
        return response.data;
    } catch (error) {
        return error.response?.data || {
            status: 'Server error',
            message: 'Error al conectar con el servidor',
            details: null,
        };
    }
}

export async function resetPassword(token, newPassword) {
    try {
        const response = await axios.post(`/auth/reset-password/${token}`, { newPassword });
        return response.data;
    } catch (error) {
        return error.response?.data || {
            status: 'Server error',
            message: 'Error al conectar con el servidor',
            details: null,
        };
    }
}
