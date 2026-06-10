import axios from './root.service.js';

export async function getPublicaciones(filtros = {}) {
  try {
    const paramsLimpios = {};
    for (const clave in filtros) {
      if (filtros[clave] !== "" && filtros[clave] !== null && filtros[clave] !== undefined) {
        paramsLimpios[clave] = filtros[clave];
      }
    }

    const response = await axios.get('/publicacion', { params: paramsLimpios });
    return [response.data.data, null];
    
  } catch (error) {
    return [null, error.response?.data?.message || 'Error al obtener las publicaciones'];
  }
}

export async function getPublicacionPorId(id) {
  try {
    const response = await axios.get(`/publicacion/${id}`);
    const datos = response.data?.data || response.data;
    return [datos, null];
    
  } catch (error) {
    return [null, error.response?.data?.message || 'Error al obtener los detalles de la publicación'];
  }
}

export async function crearPublicacion(publicacionData) {
  try {
    const response = await axios.post('/publicacion', publicacionData);
    return [response.data.data, null];
  } catch (error) {
    return [null, error.response?.data?.message || 'Error al crear la publicación'];
  }
}