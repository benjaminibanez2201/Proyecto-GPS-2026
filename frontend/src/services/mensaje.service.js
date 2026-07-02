import axios from './root.service.js';

export async function obtenerConversaciones() {
  try {
    const response = await axios.get('/mensajes/conversaciones');
    return [response.data?.data || [], null];
  } catch (error) {
    return [null, error.response?.data?.message || 'Error al obtener las conversaciones'];
  }
}

export async function obtenerDetalleConversacion(conversacionId) {
  try {
    const response = await axios.get(`/mensajes/conversaciones/${conversacionId}`);
    return [response.data?.data || null, null];
  } catch (error) {
    return [null, error.response?.data?.message || 'Error al obtener el detalle de la conversación'];
  }
}

export async function enviarMensajeAPublicacion(id_publicacion, contenido) {
  try {
    const response = await axios.post('/mensajes/contacto', { id_publicacion, contenido });
    return [response.data?.data || null, null];
  } catch (error) {
    return [null, error.response?.data?.message || 'Error al enviar el mensaje'];
  }
}

export async function responderConversacion(conversacionId, contenido) {
  try {
    const response = await axios.post(`/mensajes/conversaciones/${conversacionId}/mensajes`, { contenido });
    return [response.data?.data || null, null];
  } catch (error) {
    return [null, error.response?.data?.message || 'Error al responder la conversación'];
  }
}

export async function marcarConversacionLeida(conversacionId) {
  try {
    const response = await axios.post(`/mensajes/conversaciones/${conversacionId}/leido`);
    return [response.data?.data || null, null];
  } catch (error) {
    return [null, error.response?.data?.message || 'Error al marcar la conversación como leída'];
  }
}

export async function eliminarConversacion(conversacionId) {
  try {
    const response = await axios.delete(`/mensajes/conversaciones/${conversacionId}`);
    return [response.data?.data || null, null];
  } catch (error) {
    return [null, error.response?.data?.message || 'Error al ocultar la conversación'];
  }
}
