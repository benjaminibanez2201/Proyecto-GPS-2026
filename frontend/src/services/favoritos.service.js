import axios from './root.service.js';

export async function agregarFavorito(publicacionId) {
  try {
    const response = await axios.post('/favoritos', { publicacionId });
    return [response.data.data, null];
  } catch (error) {
    return [null, error.response?.data?.message || 'Error al agregar a favoritos'];
  }
}

export async function obtenerMisFavoritos() {
  try {
    const response = await axios.get('/favoritos');
    return [response.data.data, null];
  } catch (error) {
    return [null, error.response?.data?.message || 'Error al obtener tus favoritos'];
  }
}

export async function eliminarFavorito(favoritoId) {
  try {
    const response = await axios.delete(`/favoritos/${favoritoId}`);
    return [response.data.data, null];
  } catch (error) {
    return [null, error.response?.data?.message || 'Error al eliminar de favoritos'];
  }
}