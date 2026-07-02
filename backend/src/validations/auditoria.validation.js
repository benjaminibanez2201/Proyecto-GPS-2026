"use strict";
import Joi from "joi";

export const auditoriaQueryValidation = Joi.object({
  adminNombre: Joi.string()
    .max(255)
    .optional()
    .messages({
      "string.max": "El nombre del administrador no puede superar los 255 caracteres.",
    }),
  accion: Joi.string()
    .max(50)
    .optional()
    .messages({
      "string.max": "La acción no puede superar los 50 caracteres.",
    }),
  fechaDesde: Joi.date()
    .iso()
    .optional()
    .messages({
      "date.base": "La fecha desde debe ser una fecha válida.",
      "date.format": "La fecha desde debe tener formato ISO (YYYY-MM-DD).",
    }),
  fechaHasta: Joi.date()
    .iso()
    .min(Joi.ref('fechaDesde'))
    .optional()
    .messages({
      "date.base": "La fecha hasta debe ser una fecha válida.",
      "date.format": "La fecha hasta debe tener formato ISO (YYYY-MM-DD).",
      "date.min": "La fecha hasta no puede ser anterior a la fecha desde.",
    }),
  pagina: Joi.number()
    .integer()
    .min(1)
    .optional()
    .messages({
      "number.base": "La página debe ser un número.",
      "number.min": "La página debe ser mayor o igual a 1.",
    }),
  limite: Joi.number()
    .integer()
    .min(1)
    .max(100)
    .optional()
    .messages({
      "number.base": "El límite debe ser un número.",
      "number.min": "El límite debe ser mayor o igual a 1.",
      "number.max": "El límite no puede superar 100.",
    }),
}).unknown(false).messages({
  "object.unknown": "No se permiten parámetros de búsqueda adicionales.",
});