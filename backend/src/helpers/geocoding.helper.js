"use strict";

const URL_NOMINATIM = "https://nominatim.openstreetmap.org/search";

export async function obtenerCoordenadasArriendo(textoUbicacion) {
  if (!textoUbicacion || typeof textoUbicacion !== "string") {
    return { latitud: null, longitud: null };
  }

  const direccionProcesada = textoUbicacion.trim();
  if (!direccionProcesada) {
    return { latitud: null, longitud: null };
  }

  try {
    const consultaMapa = encodeURIComponent(
      `${direccionProcesada}, Región del Biobío, Chile`
    );

    const urlMapa = `${URL_NOMINATIM}?format=json&q=${consultaMapa}&limit=1`;

    const respuestaMapa = await fetch(urlMapa, {
      method: "GET",
      headers: {
        "Accept-Language": "es",
        "User-Agent": "ArriendU-Backend/1.0",
      },
    });

    if (!respuestaMapa.ok) {
      return { latitud: null, longitud: null };
    }

    const datosGeograficos = await respuestaMapa.json();

    if (!Array.isArray(datosGeograficos) || datosGeograficos.length === 0) {
      return { latitud: null, longitud: null };
    }

    const resultadoMapa = datosGeograficos[0];

    if (!resultadoMapa?.lat || !resultadoMapa?.lon) {
      return { latitud: null, longitud: null };
    }

    return {
      latitud: Number.parseFloat(resultadoMapa.lat),
      longitud: Number.parseFloat(resultadoMapa.lon),
    };
  } catch (error) {
    console.error("No fue posible resolver la ubicación:", error.message);
    return { latitud: null, longitud: null };
  }
}
