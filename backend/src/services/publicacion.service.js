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