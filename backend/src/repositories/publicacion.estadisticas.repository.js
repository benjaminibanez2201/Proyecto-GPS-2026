"use strict";
import Publicacion from "../entity/publicacion.entity.js";
import { AppDataSource } from "../config/configDb.js";

const CONTADOR_PERMITIDO = {
  contadorViews: "contadorViews",
  contadorFavoritos: "contadorFavoritos",
  contadorConversaciones: "contadorConversaciones",
};

export async function obtenerEstadisticasPublicacionRepositorio(publicacionUuid) {
  try {
    const repositorioPublicacion = AppDataSource.getRepository(Publicacion);

    const estadisticas = await repositorioPublicacion
      .createQueryBuilder("publicacion")
      .leftJoin("publicacion.arrendador", "arrendador")
      .select("publicacion.id", "id_publicacion")
      .addSelect("publicacion.uuid", "uuid")
      .addSelect("publicacion.titulo", "titulo")
      .addSelect("publicacion.contadorViews", "contador_views")
      .addSelect("publicacion.contadorFavoritos", "contador_favoritos")
      .addSelect("publicacion.contadorConversaciones", "contador_conversaciones")
      .addSelect("publicacion.createdAt", "createdAt")
      .addSelect("publicacion.estado", "estado")
      .addSelect("arrendador.id", "arrendador_id")
      .where("publicacion.uuid = :uuid", { uuid: publicacionUuid })
      .getRawOne();

    return [estadisticas, null];
  } catch (error) {
    console.error("Error obtenerEstadisticasPublicacionRepositorio:", error);
    return [null, "Error interno del servidor"];
  }
}

export async function incrementarContadorPublicacionRepositorio(id_publicacion, nombreContador, cantidad = 1) {
  try {
    const contador = CONTADOR_PERMITIDO[nombreContador];

    if (!contador) return [null, "Contador no permitido"];

    const repositorioPublicacion = AppDataSource.getRepository(Publicacion);
  const resultado = await repositorioPublicacion.increment({ id: id_publicacion }, contador, cantidad);

    if (!resultado.affected) return [null, "Publicación no encontrada"];

    return [true, null];
  } catch (error) {
    console.error("Error incrementarContadorPublicacionRepositorio:", error);
    return [null, "Error interno del servidor"];
  }
}

export default {
  obtenerEstadisticasPublicacionRepositorio,
  incrementarContadorPublicacionRepositorio,
};