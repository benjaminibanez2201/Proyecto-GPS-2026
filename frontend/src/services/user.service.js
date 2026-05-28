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
        const formattedData = data.data.map(formatUserData);
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