"use strict";
import { AppDataSource } from "../config/configDb.js";
import PublicacionSchema from "../entity/publicacion.entity.js";
import FavoritoPublicacionSchema from "../entity/favorito_publicacion.entity.js";
import {
  crearFavoritoRepositorio,
  eliminarFavoritoRepositorio,
  obtenerFavoritoRepositorio,
  obtenerPublicacionBloqueadaRepositorio,
} from "../repositories/publicacion.repository.js";
import { incrementarFavoritosPublicacionServicio } from "./publicacion.estadisticas.service.js";

// ==========================================
// SERVICIOS DE PUBLICACIÓN
// ==========================================
export async function createPublicacionService(arrendadorId, body) {
  try {
    const publicacionRepository = AppDataSource.getRepository(PublicacionSchema);

    const newPublicacion = publicacionRepository.create({
      titulo: body.titulo,
      tipoInmueble: body.tipoInmueble,
      precioMensual: body.precioMensual,
      ubicacion: body.ubicacion,
      fotos: body.fotos,
      serviciosIncluidos: body.serviciosIncluidos || [],
      reglasConvivencia: body.reglasConvivencia || null,
      arrendador: { id: arrendadorId },
    });

    await publicacionRepository.save(newPublicacion);

    return [newPublicacion, null];
  } catch (error) {
    console.error("Error al crear publicación:", error);
    return [null, "Error interno del servidor"];
  }
}

export async function obtenerPublicacionesArrendadorService(arrendadorId) {
  try {
    const publicacionRepository = AppDataSource.getRepository(PublicacionSchema);
    const publicaciones = await publicacionRepository.find({
      where: { arrendador: { id: arrendadorId } },
      order: { createdAt: "DESC" },
    });
    return [publicaciones, null];
  } catch (error) {
    return [null, "Error al buscar publicaciones en la base de datos"];
  }
}

export async function updatePublicacionService(publicacionId, arrendadorId, body) {
  try {
    const publicacionRepository = AppDataSource.getRepository(PublicacionSchema);
    
    const publicacion = await publicacionRepository.findOne({
      where: { id: publicacionId, arrendador: { id: arrendadorId } }
    });

    if (!publicacion) return [null, "La publicación no existe o no tienes permisos"];

    // Mezclamos los datos nuevos
    publicacionRepository.merge(publicacion, body);
    await publicacionRepository.save(publicacion);

    return [publicacion, null];
  } catch (error) {
    return [null, "Error interno del servidor al actualizar"];
  }
}

export async function deletePublicacionService(publicacionId, arrendadorId) {
  try {
    const publicacionRepository = AppDataSource.getRepository(PublicacionSchema);

    const publicacion = await publicacionRepository.findOne({
      where: { id: publicacionId, arrendador: { id: arrendadorId } }
    });

    if (!publicacion) return [null, "La publicación no existe o no tienes permisos"];

    await publicacionRepository.remove(publicacion);
    return [true, null];
  } catch (error) {
    return [null, "Error interno del servidor al eliminar"];
  }
}

// ==========================================
// SERVICIOS DE FAVORITOS
// ==========================================

export async function getFavoritosUsuarioService(usuarioId) {
  try {
    const favoritoRepository = AppDataSource.getRepository(FavoritoPublicacionSchema);

    const favoritos = await favoritoRepository.find({
      where: { usuario: { id: usuarioId } },
      relations: ["publicacion"],
      order: { createdAt: "DESC" },
    });

    return [favoritos, null];
  } catch (error) {
    console.error("Error al obtener favoritos del usuario:", error);
    return [null, "Error interno del servidor"];
  }
}

export async function addFavoritoService(publicacionId, usuarioId) {
  try {
    const [publicacion, publicacionError] = await obtenerPublicacionBloqueadaRepositorio(null, publicacionId);

    if (publicacionError) return [null, publicacionError];
    if (!publicacion) return [null, "La publicación no existe"];

    const [favoritoExistente, favoritoError] = await obtenerFavoritoRepositorio(null, publicacionId, usuarioId);
    if (favoritoError) return [null, favoritoError];

    if (favoritoExistente) {
      return [favoritoExistente, null];
    }

    const [favorito, crearError] = await crearFavoritoRepositorio(null, publicacion, usuarioId);
    if (crearError) return [null, crearError];

    await incrementarFavoritosPublicacionServicio(publicacionId, 1);

    return [favorito, null];
  } catch (error) {
    console.error("Error al agregar favorito:", error);
    return [null, "Error interno del servidor"];
  }
}

export async function removeFavoritoService(publicacionId, usuarioId) {
  try {
    const [favorito, favoritoError] = await obtenerFavoritoRepositorio(null, publicacionId, usuarioId);

    if (favoritoError) return [null, favoritoError];
    if (!favorito) return [null, "El favorito no existe"];

    const [eliminado, eliminarError] = await eliminarFavoritoRepositorio(null, favorito);
    if (eliminarError) return [null, eliminarError];

    if (eliminado) {
      await incrementarFavoritosPublicacionServicio(publicacionId, -1);
    }

    return [true, null];
  } catch (error) {
    console.error("Error al eliminar favorito:", error);
    return [null, "Error interno del servidor"];
  }
}

