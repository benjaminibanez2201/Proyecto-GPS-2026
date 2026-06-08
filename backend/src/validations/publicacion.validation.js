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
  reglasConvivencia: Joi.string()
    .max(1000)
    .optional()
    .messages({
      "string.max": "Las reglas de convivencia no pueden superar los 1000 caracteres.",
    }),
}).unknown(false).messages({
  "object.unknown": "No se permiten propiedades adicionales.",
});
