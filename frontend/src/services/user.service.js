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
        return error.response?.data || { message: 'Error al actualizar estado de verificacion' };
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
