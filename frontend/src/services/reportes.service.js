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

export async function obtenerPublicacionesReportadas() {
  try {
    const response = await axios.get('/reportes');
    return [response.data.data ?? [], null];
  } catch (error) {
    return [null, error.response?.data?.message || 'Error al obtener publicaciones reportadas'];
  }
}

export async function obtenerPublicacionesInactivas() {
  try {
    const response = await axios.get('/reportes/inactivas');
    return [response.data.data ?? [], null];
  } catch (error) {
    return [null, error.response?.data?.message || 'Error al obtener publicaciones inactivas'];
  }
}

export async function resolverPublicacionReportada(idPublicacion, data) {
  try {
    const response = await axios.patch(`/reportes/${idPublicacion}/review`, data);
    return [response.data.data ?? response.data.message ?? null, null];
  } catch (error) {
    return [null, error.response?.data?.message || 'Error al resolver reporte'];
  }
}
