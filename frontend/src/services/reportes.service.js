import axios from './root.service.js';

export async function crearReportePublicacion(data) {
  try {
    const response = await axios.post('/reportes/publicacion', data);
    return [response.data.data ?? response.data.message ?? null, null];
  } catch (error) {
    return [null, error.response?.data?.message || 'Error al crear el reporte'];
  }
}

export async function obtenerMisReportes() {
  try {
    const response = await axios.get('/reportes/mios');
    return [response.data.data ?? response.data.message ?? [], null];
  } catch (error) {
    return [null, error.response?.data?.message || 'Error al obtener tus reportes'];
  }
}