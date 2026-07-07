"use strict";
import { AppDataSource } from "../config/configDb.js";
import PublicacionSchema from "../entity/publicacion.entity.js";
import { obtenerCoordenadasArriendo } from "../helpers/geocoding.helper.js";
import { commitPublicacionUploads } from "../helpers/upload.helper.js";

// ==========================================
// SERVICIOS DE PUBLICACIÓN
// ==========================================
export async function createPublicacionService(arrendadorId, body, files) {
  try {
    const publicacionRepository = AppDataSource.getRepository(PublicacionSchema);

    const coordenadas = body.latitud != null && body.longitud != null
      ? { latitud: body.latitud, longitud: body.longitud }
      : await obtenerCoordenadasArriendo(body.ubicacion, body.comuna);

    const newPublicacion = publicacionRepository.create({
      titulo: body.titulo,
      tipoInmueble: body.tipoInmueble,
      precioMensual: body.precioMensual,
      ubicacion: body.ubicacion,
      comuna: body.comuna,
      latitud: coordenadas?.latitud ?? null,
      longitud: coordenadas?.longitud ?? null,
      fotos: [],
      serviciosIncluidos: body.serviciosIncluidos || [],
      distanciaCampus: body.distanciaCampus ?? null,
      reglasConvivencia: body.reglasConvivencia ?? body.rules ?? null,
      arrendador: { id: arrendadorId },
    });

    await publicacionRepository.save(newPublicacion);

    if (files?.fotosPublicacion?.length) {
      const urls = await commitPublicacionUploads(newPublicacion.id, files.fotosPublicacion);
      await publicacionRepository.update({ id: newPublicacion.id }, { fotos: urls });
      newPublicacion.fotos = urls;
    }

    return [newPublicacion, null];
  } catch (error) {
    console.error("Error al crear publicación:", error);
    return [null, "Error interno del servidor"];
  }
}

export async function getPublicacionesService(filtros) {
  try {
    const publicacionRepository = AppDataSource.getRepository(PublicacionSchema);
    const { 
      titulo, 
      precioMin, 
      precioMax, 
      tipoInmueble, 
      ordenarPor, 
      direccionOrden, 
      pagina,
      distanciaCampus,
      servicios 
    } = filtros;

    const query = publicacionRepository.createQueryBuilder("publicacion")
      .where("publicacion.estado IN (:...estados)", { estados: ["activa", "disponible"] });
    
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
      const tiposArray = Array.isArray(tipoInmueble) ? tipoInmueble : tipoInmueble.split(",");
      query.andWhere("publicacion.tipoInmueble IN (:...tiposArray)", { tiposArray });
    }

    if (distanciaCampus) {
      query.andWhere("publicacion.distanciaCampus <= :distanciaCampus", { distanciaCampus: parseInt(distanciaCampus) });
    }

    if (servicios) {
      const serviciosArray = Array.isArray(servicios) ? servicios : servicios.split(",");
      serviciosArray.forEach((servicio, index) => {
        query.andWhere(`:servicio${index} = ANY(publicacion.serviciosIncluidos)`, {
          [`servicio${index}`]: servicio
        });
      });
    }

    const opcionesOrdenValidas = ["precioMensual", "distanciaCampus"];
    const campoOrden = opcionesOrdenValidas.includes(ordenarPor) ? ordenarPor : "precioMensual";
    const direccion = direccionOrden?.toUpperCase() === "DESC" ? "DESC" : "ASC";

    query.orderBy("publicacion.patrocinada", "DESC");
    query.addOrderBy("publicacion.patrocinadaHasta", "DESC", "NULLS LAST");
    query.addOrderBy(`publicacion.${campoOrden}`, direccion);
    query.select([
      "publicacion.id",
      "publicacion.uuid",
      "publicacion.titulo",
      "publicacion.precioMensual",
      "publicacion.tipoInmueble",
      "publicacion.ubicacion",
      "publicacion.comuna",
      "publicacion.latitud",
      "publicacion.longitud",
      "publicacion.fotos",
      "publicacion.serviciosIncluidos",
      "publicacion.distanciaCampus",
      "publicacion.patrocinada",
      "publicacion.patrocinadaHasta",
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

export async function patrocinarPublicacionService(publicacionUuid, arrendadorId, datosPatrocinio) {
  try {
    const publicacionRepository = AppDataSource.getRepository(PublicacionSchema);

    const publicacion = await publicacionRepository.findOne({
      where: { uuid: publicacionUuid, arrendador: { id: arrendadorId } },
    });

    if (!publicacion) return [null, "La publicacion no existe o no tienes permisos"];

    if (publicacion.estado === "inactiva") {
      return [null, "Esta publicacion fue dada de baja y no se puede patrocinar."];
    }

    if (publicacion.estado === "arrendada") {
      return [null, "No puedes patrocinar una publicacion que ya esta arrendada."];
    }

    const vigenciaDias = Number(datosPatrocinio?.vigenciaDias || 7);
    const patrocinadaHasta = new Date(Date.now() + vigenciaDias * 24 * 60 * 60 * 1000);

    publicacion.patrocinada = true;
    publicacion.patrocinadaHasta = patrocinadaHasta;
    publicacion.patrocinioMetodo = datosPatrocinio.metodoPago;
    publicacion.patrocinioMonto = datosPatrocinio.monto;

    await publicacionRepository.save(publicacion);

    return [publicacion, null];
  } catch (error) {
    console.error("Error al patrocinar publicacion:", error);
    return [null, "Error interno del servidor al patrocinar la publicacion"];
  }
}

export async function cancelarPatrocinioPublicacionService(publicacionUuid, arrendadorId) {
  try {
    const publicacionRepository = AppDataSource.getRepository(PublicacionSchema);

    const publicacion = await publicacionRepository.findOne({
      where: { uuid: publicacionUuid, arrendador: { id: arrendadorId } },
    });

    if (!publicacion) return [null, "La publicacion no existe o no tienes permisos"];

    if (!publicacion.patrocinada) {
      return [null, "La publicacion no tiene un patrocinio activo."];
    }

    publicacion.patrocinada = false;
    publicacion.patrocinadaHasta = null;
    publicacion.patrocinioMetodo = null;
    publicacion.patrocinioMonto = null;

    await publicacionRepository.save(publicacion);

    return [publicacion, null];
  } catch (error) {
    console.error("Error al cancelar patrocinio:", error);
    return [null, "Error interno del servidor al cancelar el patrocinio"];
  }
}

export async function getPublicacionDetalleService(uuid) {
  try {
    const publicacionRepository = AppDataSource.getRepository(PublicacionSchema);

    const publicacion = await publicacionRepository.createQueryBuilder("publicacion")
      .leftJoin("publicacion.arrendador", "arrendador")
      .select([
        "publicacion.id",
        "publicacion.uuid",
        "publicacion.titulo",
        "publicacion.precioMensual",
        "publicacion.tipoInmueble",
        "publicacion.ubicacion",
        "publicacion.comuna",
        "publicacion.fotos",
        "publicacion.serviciosIncluidos", 
        "publicacion.distanciaCampus",  
        "publicacion.reglasConvivencia", 
        "publicacion.estado",
        "publicacion.patrocinada",
        "publicacion.patrocinadaHasta",
        "publicacion.createdAt",          
        "publicacion.updatedAt"
      ])
      .addSelect([
        "arrendador.id",
        "arrendador.uuid",
        "arrendador.nombreCompleto",
        "arrendador.email",
        "arrendador.fotoPerfil",
        "arrendador.telefono",
        "arrendador.avgRating",
        "arrendador.reviewsCount",
      ])
      .where("publicacion.uuid = :uuid", { uuid })
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

export async function updatePublicacionService(publicacionUuid, arrendadorId, body, files) {
  try {
    const publicacionRepository = AppDataSource.getRepository(PublicacionSchema);

    const publicacion = await publicacionRepository.findOne({
      where: { uuid: publicacionUuid, arrendador: { id: arrendadorId } }
    });

    if (!publicacion) return [null, "La publicación no existe o no tienes permisos"];

    if (publicacion.estado === "inactiva") {
      return [null, "Esta publicación fue dada de baja por incumplir las normas y no se puede editar. Solo puedes eliminarla."];
    }

    const comunaCambio = body.comuna && body.comuna !== publicacion.comuna;
    const faltanCoordenadas = body.latitud == null || body.longitud == null;
    const ubicacionEnBody = body.ubicacion && (body.ubicacion !== publicacion.ubicacion || faltanCoordenadas);

    if (ubicacionEnBody || comunaCambio) {
      const direccion = body.ubicacion ?? publicacion.ubicacion;
      const comuna = body.comuna ?? publicacion.comuna;

      const coordenadas = body.latitud != null && body.longitud != null
        ? { latitud: body.latitud, longitud: body.longitud }
        : await obtenerCoordenadasArriendo(direccion, comuna);

      publicacion.latitud = coordenadas?.latitud ?? null;
      publicacion.longitud = coordenadas?.longitud ?? null;
    }

    const updateData = { ...body };

    if (files?.fotosPublicacion?.length) {
      const nuevasUrls = await commitPublicacionUploads(publicacion.id, files.fotosPublicacion);
      const fotosExistentesConservadas = Array.isArray(body.fotos) ? body.fotos : [];
      updateData.fotos = [...fotosExistentesConservadas, ...nuevasUrls];
    }

    publicacionRepository.merge(publicacion, updateData);
    await publicacionRepository.save(publicacion);

    return [publicacion, null];
  } catch (error) {
    console.error("========== ERROR UPDATE PUBLICACION ==========");
    console.error(error);
    console.error(error.stack);
    console.error("BODY:", body);
    console.error("FILES:", files);
    return [null, error.message];
  }
}

export async function deletePublicacionService(publicacionUuid, arrendadorId) {
  try {
    const publicacionRepository = AppDataSource.getRepository(PublicacionSchema);

    const publicacion = await publicacionRepository.findOne({
      where: { uuid: publicacionUuid, arrendador: { id: arrendadorId } }
    });

    if (!publicacion) return [null, "La publicación no existe o no tienes permisos"];

    await publicacionRepository.remove(publicacion);
    return [true, null];
  } catch (error) {
    return [null, "Error interno del servidor al eliminar"];
  }
}
