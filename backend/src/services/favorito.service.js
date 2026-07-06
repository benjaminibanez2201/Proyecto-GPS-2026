"use strict";
import { AppDataSource } from "../config/configDb.js";
import FavoritoSchema from "../entity/favorito.entity.js";
import PublicacionSchema from "../entity/publicacion.entity.js";
import RentalSchema from "../entity/rental.entity.js";

export async function createFavoritoService(estudianteId, publicacionUuid) {
  try {
    const favoritoRepository = AppDataSource.getRepository(FavoritoSchema);
    const publicacionRepository = AppDataSource.getRepository(PublicacionSchema);

    const publicacion = await publicacionRepository.findOneBy({
      uuid: publicacionUuid,
    });

    if (!publicacion) {
      return [null, "La publicación no existe o no está disponible."];
    }

    const favoritoExistente = await favoritoRepository.findOne({
      where: {
        estudiante: { id: estudianteId },
        publicacion: { id: publicacion.id }
      }
    });

    if (favoritoExistente) {
      return [null, "Esta publicación ya está en tus favoritos."];
    }

    const nuevoFavorito = favoritoRepository.create({
      estudiante: { id: estudianteId },
      publicacion: { id: publicacion.id }
    });

    await favoritoRepository.save(nuevoFavorito);
    await publicacionRepository
      .createQueryBuilder()
      .update(PublicacionSchema)
      .set({ contadorFavoritos: () => '"contadorFavoritos" + 1' })
      .where('id = :id', { id: publicacion.id })
      .execute();

    return [nuevoFavorito, null];
  } catch (error) {
    console.error("Error al guardar favorito:", error);
    return [null, "Error interno del servidor al guardar favorito"];
  }
}

export async function deleteFavoritoService(estudianteId, publicacionUuid) {
  try {
    const favoritoRepository = AppDataSource.getRepository(FavoritoSchema);
    const publicacionRepository = AppDataSource.getRepository(PublicacionSchema);

    const publicacion = await publicacionRepository.findOneBy({ uuid: publicacionUuid });

    if (!publicacion) {
      return [null, "La publicación no existe o no está disponible."];
    }

    const resultado = await favoritoRepository.delete({
      estudiante: { id: estudianteId },
      publicacion: { id: publicacion.id }
    });

    if (resultado.affected === 0) {
      return [null, "La publicación no estaba en tus favoritos o ya fue eliminada."];
    }

    await publicacionRepository
      .createQueryBuilder()
      .update(PublicacionSchema)
      .set({ contadorFavoritos: () => 'GREATEST("contadorFavoritos" - 1, 0)' })
      .where('id = :id', { id: publicacion.id })
      .execute();

    return [true, null];
  } catch (error) {
    console.error("Error al eliminar favorito:", error);
    return [null, "Error interno del servidor al eliminar favorito"];
  }
}


export async function getFavoritosService(estudianteId) {
  try {
    const favoritoRepository = AppDataSource.getRepository(FavoritoSchema);

    const favoritos = await favoritoRepository.createQueryBuilder("favorito")
      .innerJoinAndSelect("favorito.publicacion", "publicacion")
      .leftJoin(
        RentalSchema,
        "arriendo",
        "arriendo.publicacionId = publicacion.id AND arriendo.estudianteId = :estudianteId AND arriendo.status = :statusArrendado",
        { estudianteId, statusArrendado: "COMPLETED" },
      )
      .where("favorito.estudiante_id = :estudianteId", { estudianteId })
      .andWhere("publicacion.estado != :estadoInactiva", { estadoInactiva: "inactiva" })
      .andWhere("(publicacion.estado != :estadoArrendada OR arriendo.id IS NOT NULL)", { estadoArrendada: "arrendada" })
      .orderBy("favorito.createdAt", "DESC")
      .select([
        "favorito.id",
        "favorito.createdAt",
        "publicacion.id",
        "publicacion.uuid",
        "publicacion.titulo",
        "publicacion.precioMensual",
        "publicacion.tipoInmueble",
        "publicacion.ubicacion",
        "publicacion.fotos",
        "publicacion.estado"
      ])
      .getMany();

    return [favoritos, null];
  } catch (error) {
    console.error("Error al obtener favoritos:", error);
    return [null, "Error interno del servidor al obtener tus favoritos"];
  }
}