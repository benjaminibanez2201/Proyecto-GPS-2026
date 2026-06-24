"use strict";
import { AppDataSource } from "../config/configDb.js";
import PublicacionSchema from "../entity/publicacion.entity.js";

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

export async function getPublicacionesService(filtros) {
  try {
    const publicacionRepository = AppDataSource.getRepository(PublicacionSchema);
    
    const { titulo, precioMin, precioMax, tipoInmueble, ordenarPor, direccionOrden, pagina } = filtros;

    const query = publicacionRepository.createQueryBuilder("publicacion")
      .where("publicacion.estado = :estado", { estado: "activa" });
    
    if (titulo) {
      query.andWhere("LOWER(publicacion.titulo) LIKE LOWER(:titulo)", { titulo: `%${titulo}%` });
    }

    if (precioMin) {
      query.andWhere("publicacion.precioMensual >= :precioMin", { precioMin: parseInt(precioMin) });
    }

    if (precioMax) {
      query.andWhere("publicacion.precioMensual <= :precioMax", { precioMax: parseInt(precioMax) });
    }

    if (tipoInmueble) {
      query.andWhere("publicacion.tipoInmueble = :tipoInmueble", { tipoInmueble });
    }

    const opcionesOrdenValidas = ["precioMensual"];
    const campoOrden = opcionesOrdenValidas.includes(ordenarPor) ? ordenarPor : "precioMensual";
    const direccion = direccionOrden?.toUpperCase() === "DESC" ? "DESC" : "ASC";

    query.orderBy(`publicacion.${campoOrden}`, direccion);

    query.select([
      "publicacion.id",
      "publicacion.titulo",
      "publicacion.precioMensual",
      "publicacion.tipoInmueble",
      "publicacion.ubicacion",
      "publicacion.fotos",
    ]);

    const limite = 20; 
    const paginaActual = pagina ? parseInt(pagina) : 1;
    const salto = (paginaActual - 1) * limite;

    query.skip(salto);
    query.take(limite);

    const [publicaciones, total] = await query.getManyAndCount();

    return [{
      data: publicaciones,
      total: total,
      paginaActual: paginaActual,
      totalPaginas: Math.ceil(total / limite)
    }, null];

  } catch (error) {
    console.error("Error al buscar publicaciones:", error);
    return [null, "Error interno del servidor al buscar publicaciones"];
  }
}

export async function getPublicacionDetalleService(id) {
  try {
    const publicacionRepository = AppDataSource.getRepository(PublicacionSchema);
    
    const publicacion = await publicacionRepository.createQueryBuilder("publicacion")
      .leftJoin("publicacion.arrendador", "arrendador")
      .addSelect([
        "arrendador.id",
        "arrendador.nombreCompleto", 
        "arrendador.email",
        "arrendador.fotoPerfil",
        "arrendador.telefono",
        "arrendador.avgRating",
        "arrendador.reviewsCount",
      ])
      .where("publicacion.id = :id", { id: parseInt(id) })
      .andWhere("publicacion.estado = :estado", { estado: "activa" })
      .getOne();

    if (!publicacion) {
      return [null, "La publicación no existe o no está disponible"];
    }

    return [publicacion, null];
  } catch (error) {
    console.error("Error al obtener detalle de publicación:", error);
    return [null, "Error interno del servidor al obtener el detalle"];
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
