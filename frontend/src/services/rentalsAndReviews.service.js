import axios from './root.service.js'; 

// Listar arriendos
export const listarArriendos = async () => {
  try {
    const response = await axios.get('/rentals');
    return [response.data.data, null];
  } catch (error) {
    return [null, error.response?.data?.message || "Error al cargar arriendos"];
  }
};

// Confirmar arriendo
export const confirmarArriendo = async (id) => {
  try {
    const response = await axios.post(`/rentals/${id}/confirm`);
    return [response.data.data, null];
  } catch (error) {
    return [null, error.response?.data?.message || "Error al confirmar arriendo"];
  }
};

// Crear reseña
export const crearResena = async (resenaData) => {
  try {
    const response = await axios.post('/reviews', resenaData);
    return [response.data.data, null];
  } catch (error) {
    return [null, error.response?.data?.message || "Error al enviar la reseña"];
  }
};

// Obtener reseñas por usuario
export const obtenerResenasUsuario = async (userId) => {
  try {
    const response = await axios.get(`/reviews/user/${userId}`);
    return [response.data.data, null];
  } catch (error) {
    return [null, error.response?.data?.message || "Error al cargar las reseñas"];
  }
};