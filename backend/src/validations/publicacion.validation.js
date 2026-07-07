"use strict";
import Joi from "joi";

export const publicacionBodyValidation = Joi.object({
  titulo: Joi.string()
    .min(5)
    .max(255)
    .required()
    .messages({
      "string.empty": "El título no puede estar vacío.",
      "any.required": "El título es obligatorio.",
      "string.min": "El título debe tener como mínimo 5 caracteres.",
      "string.max": "El título debe tener como máximo 255 caracteres.",
    }),
  tipoInmueble: Joi.string()
    .valid("departamento", "casa", "pieza", "estudio")
    .required()
    .messages({
      "any.required": "El tipo de inmueble es obligatorio.",
      "any.only": "El tipo de inmueble debe ser: departamento, casa, pieza o estudio.",
    }),
  precioMensual: Joi.number()
    .integer()
    .positive()
    .required()
    .messages({
      "any.required": "El precio mensual es obligatorio.",
      "number.base": "El precio mensual debe ser un número.",
      "number.positive": "El precio mensual debe ser positivo.",
    }),
  ubicacion: Joi.string()
    .min(5)
    .max(255)
    .required()
    .messages({
      "string.empty": "La ubicación no puede estar vacía.",
      "any.required": "La ubicación es obligatoria.",
      "string.min": "La ubicación debe tener como mínimo 5 caracteres.",
      "string.max": "La ubicación debe tener como máximo 255 caracteres.",
    }),
  comuna: Joi.string()
    .valid("concepcion", "san_pedro_de_la_paz", "talcahuano", "chiguayante", "hualpen", "penco")
    .required()
    .messages({
      "any.required": "La comuna es obligatoria.",
      "any.only": "La comuna debe ser una de las comunas del Gran Concepción.",
    }),
  latitud: Joi.number()
    .min(-90)
    .max(90)
    .optional()
    .messages({
      "number.base": "La latitud debe ser un número.",
      "number.min": "La latitud debe estar entre -90 y 90.",
      "number.max": "La latitud debe estar entre -90 y 90.",
    }),
  longitud: Joi.number()
    .min(-180)
    .max(180)
    .optional()
    .messages({
      "number.base": "La longitud debe ser un número.",
      "number.min": "La longitud debe estar entre -180 y 180.",
      "number.max": "La longitud debe estar entre -180 y 180.",
    }),
  fotos: Joi.array()
    .items(Joi.string().uri({ allowRelative: true }))
    .optional(),
  serviciosIncluidos: Joi.array()
    .items(
      Joi.string().valid("agua", "luz", "gas", "internet", "tv_cable", "calefaccion", "estacionamiento", "lavadora")
    )
    .optional(),
  distanciaCampus: Joi.number()
    .integer()
    .positive()
    .allow(null)
    .optional()
    .messages({
      "number.base": "La distancia al campus debe ser un número.",
      "number.positive": "La distancia al campus debe ser positiva.",
    }),
  reglasConvivencia: Joi.string()
    .allow("")
    .max(1000)
    .allow("")
    .optional()
    .messages({
      "string.max": "Las reglas de convivencia no pueden superar los 1000 caracteres.",
    }),
  rules: Joi.string()
    .allow("")
    .max(1000)
    .optional()
    .allow("")
    .messages({
      "string.max": "Las reglas de convivencia no pueden superar los 1000 caracteres.",
    }),
  estado: Joi.string()
    .valid("activa", "arrendada", "disponible", "inactiva")
    .optional()
    .messages({
      "any.only": "El estado debe ser activa, arrendada, disponible o inactiva.",
    }),
}).unknown(false).messages({
  "object.unknown": "No se permiten propiedades adicionales.",
});


export const publicacionQueryValidation = Joi.object({
  titulo: Joi.string()
    .max(255)
    .optional()
    .messages({
      "string.max": "El título de búsqueda debe tener como máximo 255 caracteres."
    }),
  precioMin: Joi.number()
    .integer()
    .positive()
    .optional()
    .messages({
      "number.base": "El precio mínimo debe ser un número.",
      "number.positive": "El precio mínimo debe ser positivo."
    }),
  precioMax: Joi.number()
    .integer()
    .positive()
    .min(Joi.ref("precioMin"))
    .optional()
    .messages({
      "number.base": "El precio máximo debe ser un número.",
      "number.positive": "El precio máximo debe ser positivo."
    }),
  tipoInmueble: Joi.alternatives()
    .try(
      Joi.array().items(
        Joi.string().valid("departamento", "casa", "pieza", "estudio")
      ),
      Joi.string()
    )
    .optional()
    .messages({
      "alternatives.match": "El tipo de inmueble a buscar debe ser: departamento, casa, pieza o estudio."
    }),
  distanciaCampus: Joi.number()
    .integer()
    .positive()
    .optional()
    .messages({
      "number.base": "La distancia al campus debe ser un número.",
      "number.positive": "La distancia al campus debe ser positiva."
    }),
  servicios: Joi.alternatives()
    .try(
      Joi.array().items(
        Joi.string().valid("agua", "luz", "gas", "internet", "tv_cable", "calefaccion", "estacionamiento", "lavadora")
      ),
      Joi.string()
    )
    .optional()
    .messages({
      "alternatives.match": "Los servicios deben ser válidos."
    }),
  ordenarPor: Joi.string()
    .valid("precioMensual")
    .optional()
    .messages({
      "any.only": "Solo puedes ordenar por 'precioMensual'."
    }),
  direccionOrden: Joi.string()
    .valid("ASC", "DESC", "asc", "desc")
    .optional()
    .messages({
      "any.only": "La dirección de ordenamiento debe ser ASC o DESC."
    }),
  pagina: Joi.number()
    .integer()
    .min(1)
    .optional()
    .messages({
      "number.base": "La página debe ser un número.",
      "number.min": "La página debe ser mayor o igual a 1."
    })
}).unknown(false).messages({
  "object.unknown": "No se permiten parámetros de búsqueda adicionales."
});

export const publicacionPatrocinioValidation = Joi.object({
  metodoPago: Joi.string()
    .valid("tarjeta", "transferencia")
    .required()
    .messages({
      "any.required": "El metodo de pago es obligatorio.",
      "any.only": "El metodo de pago debe ser tarjeta o transferencia.",
    }),
  monto: Joi.number()
    .integer()
    .positive()
    .required()
    .messages({
      "any.required": "El monto del patrocinio es obligatorio.",
      "number.base": "El monto debe ser un numero.",
      "number.positive": "El monto debe ser positivo.",
    }),
  plan: Joi.string()
    .max(80)
    .optional(),
  vigenciaDias: Joi.number()
    .integer()
    .min(1)
    .max(30)
    .optional(),
}).unknown(false).messages({
  "object.unknown": "No se permiten propiedades adicionales.",
});

export const publicacionIdValidation = Joi.object({
  id: Joi.number()
    .integer()
    .positive()
    .required()
    .messages({
      "any.required": "El ID de la publicación es obligatorio.",
      "number.base": "El ID debe ser un número válido.",
      "number.positive": "El ID no puede ser negativo."
    })
}).unknown(false).messages({
  "object.unknown": "No se permiten parámetros adicionales en la URL."
});

export const publicacionUpdateValidation = Joi.object({
  titulo: Joi.string()
    .min(5)
    .max(255)
    .messages({
    "string.min": "El título debe tener como mínimo 5 caracteres.",
    "string.max": "El título debe tener como máximo 255 caracteres.",
  }),
  tipoInmueble: Joi.string()
    .valid("departamento", "casa", "pieza", "estudio")
    .messages({
      "any.only": "El tipo de inmueble debe ser: departamento, casa, pieza o estudio.",
    }),
  precioMensual: Joi.number()
    .integer()
    .positive()
    .messages({
    "number.base": "El precio mensual debe ser un número.",
    "number.positive": "El precio mensual debe ser positivo.",
  }),
  ubicacion: Joi.string()
    .min(5)
    .max(255)
    .messages({
    "string.min": "La ubicación debe tener como mínimo 5 caracteres.",
    "string.max": "La ubicación debe tener como máximo 255 caracteres.",
  }),
  comuna: Joi.string()
    .valid("concepcion", "san_pedro_de_la_paz", "talcahuano", "chiguayante", "hualpen", "penco")
    .messages({
      "any.only": "La comuna debe ser una de las comunas del Gran Concepción.",
    }),
  latitud: Joi.number()
    .min(-90)
    .max(90)
    .messages({
    "number.base": "La latitud debe ser un número.",
    "number.min": "La latitud debe estar entre -90 y 90.",
    "number.max": "La latitud debe estar entre -90 y 90.",
  }),
  longitud: Joi.number()
    .min(-180)
    .max(180).messages({
    "number.base": "La longitud debe ser un número.",
    "number.min": "La longitud debe estar entre -180 y 180.",
    "number.max": "La longitud debe estar entre -180 y 180.",
  }),
  fotos: Joi.array()
    .items(Joi.string().uri({ allowRelative: true }))
    .optional(),
  serviciosIncluidos: Joi.array()
    .items(
    Joi.string() 
    .valid("agua", "luz", "gas", "internet", "tv_cable", "calefaccion", "estacionamiento", "lavadora")
  ),
  distanciaCampus: Joi.number()
    .integer()
    .positive()
    .allow(null)
    .messages({
    "number.base": "La distancia al campus debe ser un número.",
    "number.positive": "La distancia al campus debe ser positiva.",
  }),
  reglasConvivencia: Joi.string()
    .max(1000)
    .allow("")
    .optional()
    .messages({
    "string.max": "Las reglas no pueden superar los 1000 caracteres.",
  }),
  estado: Joi.string()
    .valid("activa", "arrendada"),
})
  .or(
    "titulo",
    "tipoInmueble",
     "precioMensual",
     "ubicacion",
     "comuna",
     "fotos",
     "serviciosIncluidos",
      "distanciaCampus",
      "reglasConvivencia",
      "estado"
    )
  .unknown(false)
  .messages({
    "object.unknown": "No se permiten propiedades adicionales.",
    "object.missing": "Debes proporcionar al menos un campo para actualizar.",
  });
