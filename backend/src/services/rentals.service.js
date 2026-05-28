"use strict";
import Rental from "../entity/rental.entity.js";
import { AppDataSource } from "../config/configDb.js";

export async function crearArriendoServicio(body) {
  try {
    const repositorioArriendo = AppDataSource.getRepository(Rental);

    const nuevoArriendo = repositorioArriendo.create({
      arrendadorId: body.arrendadorId,
      estudianteId: body.estudianteId,
      status: "PENDING",
    });

    const guardado = await repositorioArriendo.save(nuevoArriendo);

    return [guardado, null];
  } catch (error) {
    console.error("Error crearArriendoServicio:", error);
    return [null, "Error interno del servidor"];
  }
}

export async function obtenerArriendoPorIdServicio(id) {
  try {
    const repositorioArriendo = AppDataSource.getRepository(Rental);

    const arriendo = await repositorioArriendo.findOne({
      where: { id },
      relations: {
        arrendador: true,
        estudiante: true,
      },
    });

    if (!arriendo) return [null, "Arriendo no encontrado"];

    return [arriendo, null];
  } catch (error) {
    console.error("Error obtenerArriendoPorIdServicio:", error);
    return [null, "Error interno del servidor"];
  }
}

export async function confirmarArriendoServicio(arriendoId, userId) {
  try {
    const repositorioArriendo = AppDataSource.getRepository(Rental);

    const arriendo = await repositorioArriendo.findOne({ where: { id: arriendoId } });
    if (!arriendo) return [null, "Arriendo no encontrado"];

    const esArrendador = arriendo.arrendadorId === Number(userId);
    const esEstudiante = arriendo.estudianteId === Number(userId);

    if (!esArrendador && !esEstudiante) return [null, "No eres parte de este arriendo"];

    const actualizacion = {};
    if (esArrendador) actualizacion.confirmedByArrendador = true;
    if (esEstudiante) actualizacion.confirmedByEstudiante = true;

    await repositorioArriendo.update({ id: arriendo.id }, actualizacion);

    const actualizado = await repositorioArriendo.findOne({ where: { id: arriendoId } });

    if (actualizado.confirmedByArrendador && actualizado.confirmedByEstudiante) {
      await repositorioArriendo.update({ id: arriendo.id }, { status: "COMPLETED", completedAt: new Date() });
      const final = await repositorioArriendo.findOne({ where: { id: arriendoId } });
      return [final, null];
    }

    return [actualizado, null];
  } catch (error) {
    console.error("Error confirmarArriendoServicio:", error);
    return [null, "Error interno del servidor"];
  }
}

export async function listarArriendosServicio() {
  try {
    const repositorioArriendo = AppDataSource.getRepository(Rental);
    const arriendos = await repositorioArriendo.find({
      relations: {
        arrendador: true,
        estudiante: true,
      },
    });
    return [arriendos, null];
  } catch (error) {
    console.error("Error listarArriendosServicio:", error);
    return [null, "Error interno del servidor"];
  }
}

export async function actualizarArriendoServicio(id, body) {
  try {
    const repositorioArriendo = AppDataSource.getRepository(Rental);
    const arriendo = await repositorioArriendo.findOne({ where: { id } });
    if (!arriendo) return [null, "Arriendo no encontrado"];

    await repositorioArriendo.update({ id }, body);
    const actualizado = await repositorioArriendo.findOne({ where: { id } });
    return [actualizado, null];
  } catch (error) {
    console.error("Error actualizarArriendoServicio:", error);
    return [null, "Error interno del servidor"];
  }
}

export async function eliminarArriendoServicio(id) {
  try {
    const repositorioArriendo = AppDataSource.getRepository(Rental);
    const arriendo = await repositorioArriendo.findOne({ where: { id } });
    if (!arriendo) return [null, "Arriendo no encontrado"];

    await repositorioArriendo.delete({ id });
    return [{ deletedId: id }, null];
  } catch (error) {
    console.error("Error eliminarArriendoServicio:", error);
    return [null, "Error interno del servidor"];
  }
}
