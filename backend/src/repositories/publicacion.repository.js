"use strict";
import Publicacion from "../entity/publicacion.entity.js";
import { AppDataSource } from "../config/configDb.js";

function obtenerManagerRepositorio(manager) {
  return manager || AppDataSource;
}

export async function obtenerPublicacionBloqueadaRepositorio(manager, id_publicacion) {
  try {
    const contexto = obtenerManagerRepositorio(manager);
    const repositorioPublicacion = contexto.getRepository(Publicacion);

    const publicacion = await repositorioPublicacion.findOne({
      where: { id_publicacion },
      relations: ["owner"],
      lock: { mode: "pessimistic_write" },
    });

    return [publicacion, null];
  } catch (error) {
    console.error("Error obtenerPublicacionBloqueadaRepositorio:", error);
    return [null, "Error interno del servidor"];
  }
}

export async function guardarPublicacionRepositorio(manager, publicacion) {
  try {
    const contexto = obtenerManagerRepositorio(manager);
    const repositorioPublicacion = contexto.getRepository(Publicacion);

    const guardada = await repositorioPublicacion.save(publicacion);
    return [guardada, null];
  } catch (error) {
    console.error("Error guardarPublicacionRepositorio:", error);
    return [null, "Error interno del servidor"];
  }
}

export default {
  obtenerPublicacionBloqueadaRepositorio,
  guardarPublicacionRepositorio,
};