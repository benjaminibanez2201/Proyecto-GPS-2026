import axios from './root.service.js';

export async function obtenerNotificacionesPorUsuario(options = {}) {
  try {
    const params = {};
    if (options.limit !== undefined) params.limit = options.limit;
    if (options.offset !== undefined) params.offset = options.offset;

    const response = await axios.get('/notificaciones', { params });
    return [response.data.data, null];
  } catch (error) {
    return [null, error.response?.data?.message || 'Error al cargar notificaciones'];
  }
}

export async function obtenerCantidadNotificacionesNoLeidas() {
  try {
    const response = await axios.get('/notificaciones/count');
    
    const count = response.data?.data?.count ?? response.data?.data ?? response.data;
    return [count, null];
  } catch (error) {
    return [null, error.response?.data?.message || 'Error al obtener conteo de notificaciones'];
  }
}

export async function marcarNotificacionComoLeida(notificacionId) {
  try {
    const response = await axios.patch(`/notificaciones/${notificacionId}/leer`);
    return [response.data.data, null];
  } catch (error) {
    return [null, error.response?.data?.message || 'Error al marcar la notificación como leída'];
  }
}

export async function marcarTodasNotificacionesComoLeidas() {
  try {
    const response = await axios.patch('/notificaciones/leer-todas');
    return [response.data.data, null];
  } catch (error) {
    return [null, error.response?.data?.message || 'Error al marcar todas las notificaciones como leídas'];
  }
}

export async function eliminarNotificacion(notificacionId) {
  try {
    const response = await axios.delete(`/notificaciones/${notificacionId}`);
    return [response.data.data, null];
  } catch (error) {
    return [null, error.response?.data?.message || 'Error al eliminar la notificación'];
  }
}