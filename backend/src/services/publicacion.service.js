"use strict";
import { AppDataSource } from "../config/configDb.js";
import {
  obtenerPublicacionBloqueadaRepositorio,
  obtenerFavoritoRepositorio,
  crearFavoritoRepositorio,
  eliminarFavoritoRepositorio,
  guardarPublicacionRepositorio,
} from "../repositories/publicacion.repository.js";

function mapPublicacionDetalleDTO(publicacion, esFavorito = false) {
  return {
    id_publicacion: Number(publicacion.id_publicacion),
    titulo: publicacion.titulo,
    descripcion: publicacion.descripcion,
    contador_views: Number(publicacion.contadorViews || 0),
    contador_favoritos: Number(publicacion.contadorFavoritos || 0),
    contador_conversaciones: Number(publicacion.contadorConversaciones || 0),
    createdAt: publicacion.createdAt,
    estado: publicacion.activo ? "activa" : "inactiva",
    es_favorito: Boolean(esFavorito),
    owner: publicacion.owner
      ? {
          id: publicacion.owner.id,
          nombreCompleto: publicacion.owner.nombreCompleto,
          email: publicacion.owner.email,
        }
      : null,
  };
}

export async function obtenerDetallePublicacionServicio(id_publicacion, usuarioAutenticado) {
  try {
    if (!usuarioAutenticado || usuarioAutenticado.rol !== "estudiante") {
      return [null, "Solo un estudiante puede visualizar este detalle"];
    }

    const [detalle, error] = await AppDataSource.transaction(async (manager) => {
      const [publicacion, errorPublicacion] = await obtenerPublicacionBloqueadaRepositorio(manager, id_publicacion);
      if (errorPublicacion) return [null, errorPublicacion];
      if (!publicacion) return [null, "Publicación no encontrada"];

      publicacion.contadorViews = Number(publicacion.contadorViews || 0) + 1;
      const [publicacionActualizada, errorGuardado] = await guardarPublicacionRepositorio(manager, publicacion);
      if (errorGuardado) return [null, errorGuardado];

      const [favorito] = await obtenerFavoritoRepositorio(manager, id_publicacion, usuarioAutenticado.id);

      return [mapPublicacionDetalleDTO(publicacionActualizada, Boolean(favorito)), null];
    });

    if (error) return [null, error];

    return [detalle, null];
  } catch (error) {
    console.error("Error obtenerDetallePublicacionServicio:", error);
    return [null, "Error interno del servidor"];
  }
}

export async function agregarFavoritoServicio(id_publicacion, usuarioAutenticado) {
  try {
    if (!usuarioAutenticado || usuarioAutenticado.rol !== "estudiante") {
      return [null, "Solo un estudiante puede marcar favoritos"];
    }

    const [resultado, error] = await AppDataSource.transaction(async (manager) => {
      const [publicacion, errorPublicacion] = await obtenerPublicacionBloqueadaRepositorio(manager, id_publicacion);
      if (errorPublicacion) return [null, errorPublicacion];
      if (!publicacion) return [null, "Publicación no encontrada"];

      const [favoritoExistente] = await obtenerFavoritoRepositorio(manager, id_publicacion, usuarioAutenticado.id);
      if (favoritoExistente) {
        return [mapPublicacionDetalleDTO(publicacion, true), null];
      }

      const [favoritoCreado, errorFavorito] = await crearFavoritoRepositorio(
        manager,
        publicacion,
        usuarioAutenticado.id,
      );

      if (errorFavorito) return [null, errorFavorito];

      publicacion.contadorFavoritos = Number(publicacion.contadorFavoritos || 0) + 1;
      const [publicacionActualizada, errorGuardado] = await guardarPublicacionRepositorio(manager, publicacion);
      if (errorGuardado) return [null, errorGuardado];

      return [
        {
          ...mapPublicacionDetalleDTO(publicacionActualizada, true),
          favoritoId: favoritoCreado.id,
        },
        null,
      ];
    });

    if (error) return [null, error];

    return [resultado, null];
  } catch (error) {
    console.error("Error agregarFavoritoServicio:", error);
    return [null, "Error interno del servidor"];
  }
}

export async function eliminarFavoritoServicio(id_publicacion, usuarioAutenticado) {
  try {
    if (!usuarioAutenticado || usuarioAutenticado.rol !== "estudiante") {
      return [null, "Solo un estudiante puede eliminar favoritos"];
    }

    const [resultado, error] = await AppDataSource.transaction(async (manager) => {
      const [publicacion, errorPublicacion] = await obtenerPublicacionBloqueadaRepositorio(manager, id_publicacion);
      if (errorPublicacion) return [null, errorPublicacion];
      if (!publicacion) return [null, "Publicación no encontrada"];

      const [favoritoExistente] = await obtenerFavoritoRepositorio(manager, id_publicacion, usuarioAutenticado.id);
      if (!favoritoExistente) {
        return [mapPublicacionDetalleDTO(publicacion, false), null];
      }

      const [favoritoEliminado, errorFavorito] = await eliminarFavoritoRepositorio(manager, favoritoExistente);
      if (errorFavorito) return [null, errorFavorito];

      if (favoritoEliminado) {
        publicacion.contadorFavoritos = Math.max(0, Number(publicacion.contadorFavoritos || 0) - 1);
        const [publicacionActualizada, errorGuardado] = await guardarPublicacionRepositorio(manager, publicacion);
        if (errorGuardado) return [null, errorGuardado];

        return [mapPublicacionDetalleDTO(publicacionActualizada, false), null];
      }

      return [mapPublicacionDetalleDTO(publicacion, false), null];
    });

    if (error) return [null, error];

    return [resultado, null];
  } catch (error) {
    console.error("Error eliminarFavoritoServicio:", error);
    return [null, "Error interno del servidor"];
  }
}

export default {
  obtenerDetallePublicacionServicio,
  agregarFavoritoServicio,
  eliminarFavoritoServicio,
};