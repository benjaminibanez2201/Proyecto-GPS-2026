"use strict";
import {
  incrementarContadorPublicacionRepositorio,
  obtenerEstadisticasPublicacionRepositorio,
} from "../repositories/publicacion.estadisticas.repository.js";

export async function obtenerEstadisticasPublicacionServicio(publicacionUuid, usuarioAutenticado) {
  try {
    if (!usuarioAutenticado || usuarioAutenticado.rol !== "arrendador") {
      return [null, "Solo un arrendador puede consultar estas estadísticas"];
    }

    const [estadisticas, errorEstadisticas] = await obtenerEstadisticasPublicacionRepositorio(publicacionUuid);
    if (errorEstadisticas) return [null, errorEstadisticas];
    if (!estadisticas) return [null, "Publicación no encontrada"];

    if (Number(estadisticas.arrendador_id) !== Number(usuarioAutenticado.id)) {
      return [null, "No autorizado para consultar las estadísticas de esta publicación"];
    }

    return [
      {
        id_publicacion: Number(estadisticas.id_publicacion),
        publicId: estadisticas.uuid,
        titulo: estadisticas.titulo,
        contador_views: Number(estadisticas.contador_views || 0),
        contador_favoritos: Number(estadisticas.contador_favoritos || 0),
        contador_conversaciones: Number(estadisticas.contador_conversaciones || 0),
        createdAt: estadisticas.createdAt,
        estado: estadisticas.estado || "activa",
      },
      null,
    ];
  } catch (error) {
    console.error("Error obtenerEstadisticasPublicacionServicio:", error);
    return [null, "Error interno del servidor"];
  }
}

export async function incrementarVisualizacionesPublicacionServicio(id_publicacion) {
  return incrementarContadorPublicacionRepositorio(id_publicacion, "contadorViews", 1);
}

export async function incrementarFavoritosPublicacionServicio(id_publicacion, cantidad = 1) {
  return incrementarContadorPublicacionRepositorio(id_publicacion, "contadorFavoritos", cantidad);
}

export async function incrementarConversacionesPublicacionServicio(id_publicacion) {
  return incrementarContadorPublicacionRepositorio(id_publicacion, "contadorConversaciones", 1);
}

export default {
  obtenerEstadisticasPublicacionServicio,
  incrementarVisualizacionesPublicacionServicio,
  incrementarFavoritosPublicacionServicio,
  incrementarConversacionesPublicacionServicio,
};