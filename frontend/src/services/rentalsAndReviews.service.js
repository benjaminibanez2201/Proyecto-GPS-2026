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

// Confirmar arriendo
export async function confirmarArriendo(id) {
  try {
    const response = await axios.post(`/rentals/${id}/confirm`);
    return [response.data.data, null];
  } catch (error) {
    return [null, error.response?.data?.message || "Error al confirmar arriendo"];
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

//obtener los datos del usuario para su perfil
export async function obtenerPerfilUsuario(userId) {
  try {
    const response = await axios.get(`/profile/${userId}`);
    return [response.data.data, null];
  } catch (error) {
    return [null, error.response?.data?.message || "Error al cargar el perfil del usuario"];
  }
}