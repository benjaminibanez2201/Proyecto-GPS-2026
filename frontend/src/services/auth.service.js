import axios from './root.service.js';
import cookies from 'js-cookie';
import { jwtDecode } from 'jwt-decode';

function getFileMetadata(fileList) {
    const file = fileList?.[0];

    if (!file) return null;

    return {
        name: file.name,
        type: file.type,
        size: file.size,
    };
}

export async function login(dataUser) {
    try {
        const response = await axios.post('/auth/login', {
            email: dataUser.email, 
            password: dataUser.password
        });
        const { status, data } = response;
        if (status === 200) {
            const { nombreCompleto, email, rut, rol } = jwtDecode(data.data.token);
            const userData = { nombreCompleto, email, rut, rol };
            sessionStorage.setItem('usuario', JSON.stringify(userData));
            axios.defaults.headers.common['Authorization'] = `Bearer ${data.data.token}`;
            cookies.set('jwt-auth', data.data.token, {path:'/'});
            return response.data
        }
    } catch (error) {
        return error.response.data;
    }
}

export async function register(data) {
    try {
        const rol = data.rol || 'estudiante';
        const basePayload = {
            nombreCompleto: data.nombreCompleto.trim(),
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
                fotoPerfil: getFileMetadata(data.fotoPerfil),
                documentoVerificacion: getFileMetadata(data.documentoVerificacion),
            };

        const response = await axios.post('/auth/register', {
            ...basePayload,
            ...rolePayload,
        });
        return response.data;
    } catch (error) {
        return error.response.data;
    }
}

export async function logout() {
    try {
        await axios.post('/auth/logout');
        sessionStorage.removeItem('usuario');
        cookies.remove('jwt');
        cookies.remove('jwt-auth');
    } catch (error) {
        console.error('Error al cerrar sesión:', error);
    }
}
