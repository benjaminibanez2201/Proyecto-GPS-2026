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
  fotos: Joi.array()
    .items(Joi.string().uri())
    .min(1)
    .required()
    .messages({
      "any.required": "Debes agregar al menos una foto.",
      "array.min": "Debes agregar al menos una foto.",
    }),
  serviciosIncluidos: Joi.array()
    .items(Joi.string())
    .optional(),
  distanciaCampus: Joi.number()
    .min(0)
    .optional()
    .messages({
      "number.base": "La distancia al campus debe ser un número.",
      "number.min": "La distancia no puede ser negativa.",
    }),
  accesibilidad: Joi.array()
    .items(Joi.string())
    .optional()
    .messages({
      "array.base": "La accesibilidad debe ser un listado (arreglo) de características.",
    }),
  reglasConvivencia: Joi.string()
    .max(1000)
    .optional()
    .messages({
      "string.max": "Las reglas de convivencia no pueden superar los 1000 caracteres.",
    }),
}).unknown(false).messages({
  "object.unknown": "No se permiten propiedades adicionales.",
});

export const publicacionQueryValidation = Joi.object({
  precioMax: Joi.number()
    .integer()
    .positive()
    .optional()
    .messages({
      "number.base": "El precio máximo debe ser un número.",
      "number.positive": "El precio máximo debe ser positivo."
    }),
  tipoInmueble: Joi.string()
    .valid("departamento", "casa", "pieza", "estudio")
    .optional()
    .messages({
      "any.only": "El tipo de inmueble a buscar debe ser: departamento, casa, pieza o estudio."
    }),
  distanciaMax: Joi.number()
    .min(0)
    .optional()
    .messages({
      "number.base": "La distancia máxima debe ser un número.",
      "number.min": "La distancia máxima no puede ser negativa."
    }),
  accesibilidad: Joi.string()
    .optional()
    .messages({
      "string.base": "La accesibilidad debe ser texto."
    }),
  ordenarPor: Joi.string()
    .valid("precioMensual", "distanciaCampus")
    .optional()
    .messages({
      "any.only": "Solo puedes ordenar por 'precioMensual' o 'distanciaCampus'."
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
