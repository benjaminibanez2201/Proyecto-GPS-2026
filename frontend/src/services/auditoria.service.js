import axios from './root.service.js'; 

export async function getAuditoria(filtros = {}) {
  try {
    const paramsLimpios = {};
    for (const clave in filtros) {
      if (filtros[clave] !== "" && filtros[clave] !== null && filtros[clave] !== undefined) {
        paramsLimpios[clave] = filtros[clave];
      }
    }

    const response = await axios.get('/auditoria', { params: paramsLimpios });
    return [response.data.data, null];

  } catch (error) {
    console.log(error.response?.data?.message || 'Error al obtener la auditoría');
    return [null, error.response?.data?.message || 'Error al obtener la auditoría'];
  }
}