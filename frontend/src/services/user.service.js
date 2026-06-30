import axios from './root.service.js';
import { formatUserData } from '@helpers/formatData.js';

export async function getUsers() {
    const [formattedData, err] = await obtenerUsuarios();
    if (err) return [];
    return formattedData;
}

export async function obtenerUsuarios() {
    try {
        const { data } = await axios.get('/user/');
        const users = Array.isArray(data.data) ? data.data : [];
        const formattedData = users.map(formatUserData);
        return [formattedData, null];
    } catch (error) {
        return [null, error.response?.data?.message || 'Error al cargar usuarios'];
    }
}

export async function updateUser(data, rut) {
    try {
        const response = await axios.patch(`/user/detail/?rut=${rut}`, data);
        console.log(response);
        return response.data.data;
    } catch (error) {
        console.log(error);
        return error.response.data;
    }
}

function buildUserVerificationQuery(userSelector) {
    if (userSelector && typeof userSelector === 'object') {
        if (userSelector.id) return `id=${encodeURIComponent(userSelector.id)}`;
        if (userSelector.rut) return `rut=${encodeURIComponent(userSelector.rut)}`;
    }

    return `rut=${encodeURIComponent(userSelector)}`;
}

export async function updateUserVerificationStatus(userSelector, reviewPayload) {
    try {
        const payload = typeof reviewPayload === 'string'
            ? { estadoVerificacion: reviewPayload }
            : reviewPayload;
        const response = await axios.patch(`/user/detail/verification?${buildUserVerificationQuery(userSelector)}`, payload);
        return response.data.data;
    } catch (error) {
        return error.response?.data || { message: 'Error al actualizar estado de verificación' };
    }
}

export async function deleteUser(rut) {
    try {
        const response = await axios.delete(`/user/detail/?rut=${rut}`);
        return response.data;
    } catch (error) {
        return error.response.data;
    }
}

export async function updateProfile(data) {
    try {
        const response = await axios.patch('/profile/', data);
        return response.data.data;
    } catch (error) {
        return error.response.data;
    }
}

export async function getProfile() {
    try {
        const response = await axios.get('/profile/');
        return response.data.data;
    } catch (error) {
        return error.response.data;
    }
}

export async function getMisPublicaciones() {
    try {
        const response = await axios.get('/publicacion/mis-publicaciones');
        return response.data.data;
    } catch (error) {
        return error.response.data;
    }
}

export async function updateArrendadorProfile(data) {
    try {
        const response = await axios.patch('/profile/arrendador', data);
        return response.data.data;
    } catch (error) {
        return error.response.data;
    }
}

export async function eliminarPublicacion(id) {
    try {
        const response = await axios.delete(`/publicacion/${id}`);
        return response.data;
    } catch (error) {
        return error.response.data;
    }
}

export async function editarPublicacion(id, data) {
    try {
        const response = await axios.put(`/publicacion/${id}`, data);
        return response.data.data;
    } catch (error) {
        return error.response.data;
    }
}

export async function crearPublicacion(data) {
    try {
        const response = await axios.post('/publicacion/', data);
        return response.data.data;
    } catch (error) {
        return error.response.data;
    }
}

export async function getMisFavoritos() {
    try {
        const response = await axios.get('/favoritos');
        return response.data.data;
    } catch (error) {
        return error.response?.data || { message: 'Error al cargar favoritos' };
    }
}

export async function agregarFavorito(publicacionId) {
    try {
        const response = await axios.post('/favoritos', { publicacionId });
        return response.data.data;
    } catch (error) {
        return error.response?.data || { message: 'Error al guardar favorito' };
    }
}
 
export async function eliminarFavorito(publicacionId) {
    try {
        const response = await axios.delete(`/favoritos/${publicacionId}`);
        return response.data.data;
    } catch (error) {
        return error.response?.data || { message: 'Error al eliminar favorito' };
    }
}

export async function verifyPassword(password) {
    try {
        const response = await axios.post('/profile/verify-password', { password });
        return response.data;
    } catch (error) {
        return error.response.data;
    }
}

export async function toggleUserStatusRequest(id, estadoCuenta) {
    try {
        const response = await axios.patch('/user/detail/status', {
            id,
            estadoCuenta,
        }, {
            params: { id },
        });
        return response.data;
    } catch (error) {
        const payload = error.response?.data;
        console.log('--- DEBUG toggleUserStatusRequest ---');
        console.log('URL:', error.config?.url);
        console.log('Method:', error.config?.method?.toUpperCase());
        console.log('Params sent:', error.config?.params);
        console.log('Body sent:', error.config?.data);
        console.log('Status:', error.response?.status);
        console.log('Response data:', payload);
        console.log('Full error:', error);
        console.log('--- END DEBUG toggleUserStatusRequest ---');
        return payload || { message: 'Error al cambiar el estado del usuario' };
    }
}