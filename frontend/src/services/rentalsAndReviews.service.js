import axios from './root.service.js';

// Listar arriendos
export async function listarArriendos() {
  try {
    const response = await axios.get('/rentals');
    return [response.data.data, null];
  } catch (error) {
    return [null, error.response?.data?.message || "Error al cargar arriendos"];
  }
}

// Crear arriendo
export async function createArriendo(data) {
  try {
    const response = await axios.post('/rentals', data);
    return [response.data.data, null];
  } catch (error) {
    return [null, error.response?.data?.message || "Error al crear arriendo"];
  }
}

// Confirmar arriendo
export async function confirmarArriendo(id) {
  try {
    const response = await axios.post(`/rentals/${id}/confirm`);
    return [response.data.data, null];
  } catch (error) {
    return [null, error.response?.data?.message || "Error al confirmar arriendo"];
  }
}

// Anular arriendo
export async function anularArriendo(id) {
  try {
    const response = await axios.post(`/rentals/${id}/cancel`);
    return [response.data.data, null];
  } catch (error) {
    return [null, error.response?.data?.message || "Error al anular arriendo"];
  }
}

// Obtener detalle de un arriendo (con la publicación incluida)
export async function obtenerArriendoPorId(id) {
  try {
    const response = await axios.get(`/rentals/${id}`);
    return [response.data.data, null];
  } catch (error) {
    return [null, error.response?.data?.message || "Error al cargar el arriendo"];
  }
}

// Marcar un arriendo como finalizado (libera la publicación)
export async function finalizarArriendoPorPublicacion(publicacionId) {
  try {
    const response = await axios.post(`/rentals/publicacion/${publicacionId}/finalizar`);
    return [response.data.data, null];
  } catch (error) {
    return [null, error.response?.data?.message || "Error al finalizar el arriendo"];
  }
}

// Crear reseña
export async function crearResena(resenaData) {
  try {
    const response = await axios.post('/reviews', resenaData);
    return [response.data.data, null];
  } catch (error) {
    return [null, error.response?.data?.message || "Error al enviar la reseña"];
  }
}

// Obtener reseñas por usuario
export async function obtenerResenasUsuario(userId) {
  try {
    const response = await axios.get(`/reviews/user/${userId}`);
    return [response.data.data, null];
  } catch (error) {
    return [null, error.response?.data?.message || "Error al cargar las reseñas"];
  }
}

export async function obtenerResenasRecibidas() {
  try {
    const response = await axios.get('/reviews/received');
    return [response.data.data, null];
  } catch (error) {
    return [null, error.response?.data?.message || "Error al cargar las reseñas recibidas"];
  }
}

//obtener los datos del usuario para su perfil
export async function obtenerPerfilUsuario(userId) {
  try {
    const response = await axios.get(`/profile/${userId}`);
    return [response.data.data, null];
  } catch (error) {
    return [null, error.response?.data?.message || "Error al cargar el perfil del usuario"];
  }
}
