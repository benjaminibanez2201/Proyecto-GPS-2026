"use strict";
import { AppDataSource } from "../config/configDb.js";
import PublicacionSchema from "../entity/publicacion.entity.js";

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