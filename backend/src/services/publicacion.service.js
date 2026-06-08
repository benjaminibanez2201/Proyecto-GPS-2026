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


export async function getPublicacionesService(filtros) {
  try {
    const publicacionRepository = AppDataSource.getRepository(PublicacionSchema);
    
    const { precioMax, tipoInmueble, ordenarPor, direccionOrden, pagina } = filtros;

    const query = publicacionRepository.createQueryBuilder("publicacion")
      .where("publicacion.estado = :estado", { estado: "activa" });

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