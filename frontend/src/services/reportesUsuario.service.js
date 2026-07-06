import axios from './root.service.js';

export async function crearReporteUsuario(data) {
  try {
    const response = await axios.post('/reportes-usuarios', data);
    return [response.data.data ?? response.data.message ?? null, null];
  } catch (error) {
    return [null, error.response?.data?.message || 'Error al crear el reporte'];
  }
}

export async function obtenerMisReportesUsuario() {
  try {
    const response = await axios.get('/reportes-usuarios/mios');
    return [response.data.data ?? response.data.message ?? [], null];
  } catch (error) {
    return [null, error.response?.data?.message || 'Error al obtener tus reportes'];
  }
}

export async function obtenerUsuariosReportados() {
  try {
    const response = await axios.get('/reportes-usuarios');
    return [response.data.data ?? [], null];
  } catch (error) {
    return [null, error.response?.data?.message || 'Error al obtener usuarios reportados'];
  }
}

export async function resolverUsuarioReportado(idUsuario, data) {
  try {
    const response = await axios.patch(`/reportes-usuarios/${idUsuario}/review`, data);
    return [response.data.data ?? response.data.message ?? null, null];
  } catch (error) {
    return [null, error.response?.data?.message || 'Error al resolver reporte'];
  }
}
