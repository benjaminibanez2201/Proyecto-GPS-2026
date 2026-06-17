"use strict";
import Publicacion from "../entity/publicacion.entity.js";
import FavoritoPublicacion from "../entity/favorito_publicacion.entity.js";
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

export async function obtenerFavoritoRepositorio(manager, id_publicacion, usuarioId) {
  try {
    const contexto = obtenerManagerRepositorio(manager);
    const repositorioFavorito = contexto.getRepository(FavoritoPublicacion);

    const favorito = await repositorioFavorito.findOne({
      where: {
        publicacion: { id_publicacion },
        usuario: { id: usuarioId },
      },
      relations: ["publicacion", "usuario"],
    });

    return [favorito, null];
  } catch (error) {
    console.error("Error obtenerFavoritoRepositorio:", error);
    return [null, "Error interno del servidor"];
  }
}

export async function crearFavoritoRepositorio(manager, publicacion, usuarioId) {
  try {
    const contexto = obtenerManagerRepositorio(manager);
    const repositorioFavorito = contexto.getRepository(FavoritoPublicacion);

    const favorito = repositorioFavorito.create({
      publicacion,
      usuario: { id: usuarioId },
    });

    const guardado = await repositorioFavorito.save(favorito);
    return [guardado, null];
  } catch (error) {
    console.error("Error crearFavoritoRepositorio:", error);
    return [null, "Error interno del servidor"];
  }
}

export async function eliminarFavoritoRepositorio(manager, favorito) {
  try {
    const contexto = obtenerManagerRepositorio(manager);
    const repositorioFavorito = contexto.getRepository(FavoritoPublicacion);

    await repositorioFavorito.remove(favorito);
    return [true, null];
  } catch (error) {
    console.error("Error eliminarFavoritoRepositorio:", error);
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
  obtenerFavoritoRepositorio,
  crearFavoritoRepositorio,
  eliminarFavoritoRepositorio,
  guardarPublicacionRepositorio,
};