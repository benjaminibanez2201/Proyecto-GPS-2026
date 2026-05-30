"use strict";
import Joi from "joi";

const namePattern = /^[a-zA-Z\u00C0-\u017F\s]+$/;
const passwordPattern = /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&._-])[A-Za-z\d@$!%*?&._-]+$/;
const rutPattern = /^(?:(?:[1-9]\d{0}|[1-2]\d{1})(\.\d{3}){2}|[1-9]\d{6}|[1-2]\d{7}|29\.999\.999|29999999)-[\dkK]$/;

const emailSchema = Joi.string()
  .min(5)
  .max(100)
  .email()
  .required()
  .messages({
    "string.empty": "El correo electronico no puede estar vacio.",
    "any.required": "El correo electronico es obligatorio.",
    "string.base": "El correo electronico debe ser de tipo texto.",
    "string.email": "El correo electronico debe tener un formato valido.",
    "string.min": "El correo electronico debe tener al menos 5 caracteres.",
    "string.max": "El correo electronico debe tener como maximo 100 caracteres.",
  });

const passwordSchema = Joi.string()
  .min(8)
  .max(50)
  .pattern(passwordPattern)
  .required()
  .messages({
    "string.empty": "La contrasena no puede estar vacia.",
    "any.required": "La contrasena es obligatoria.",
    "string.base": "La contrasena debe ser de tipo texto.",
    "string.min": "La contrasena debe tener al menos 8 caracteres.",
    "string.max": "La contrasena debe tener como maximo 50 caracteres.",
    "string.pattern.base": "La contrasena debe contener al menos una mayuscula, un numero y un caracter especial.",
  });

const nombreCompletoSchema = Joi.string()
  .min(15)
  .max(50)
  .pattern(namePattern)
  .required()
  .messages({
    "string.empty": "El nombre completo no puede estar vacio.",
    "any.required": "El nombre completo es obligatorio.",
    "string.base": "El nombre completo debe ser de tipo texto.",
    "string.min": "El nombre completo debe tener al menos 15 caracteres.",
    "string.max": "El nombre completo debe tener como maximo 50 caracteres.",
    "string.pattern.base": "El nombre completo solo puede contener letras y espacios.",
  });

const rutSchema = Joi.string()
  .min(9)
  .max(12)
  .required()
  .pattern(rutPattern)
  .messages({
    "string.empty": "El rut no puede estar vacio.",
    "string.base": "El rut debe ser de tipo string.",
    "string.min": "El rut debe tener como minimo 9 caracteres.",
    "string.max": "El rut debe tener como maximo 12 caracteres.",
    "string.pattern.base": "Formato rut invalido, debe ser xx.xxx.xxx-x o xxxxxxxx-x.",
  });

const baseRegisterFields = {
  email: emailSchema,
  nombreCompleto: nombreCompletoSchema,
  password: passwordSchema,
  rut: rutSchema,
};

const strictMessages = {
  "object.unknown": "No se permiten propiedades adicionales.",
};

export const authValidation = Joi.object({
  email: emailSchema,
  password: passwordSchema,
}).unknown(false).messages(strictMessages);

export const registerValidation = Joi.object(baseRegisterFields)
  .unknown(false)
  .messages(strictMessages);

export const registerEstudianteValidation = Joi.object({
  ...baseRegisterFields,
  carrera: Joi.string().min(2).max(255).required().messages({
    "any.required": "La carrera es obligatoria.",
    "string.empty": "La carrera no puede estar vacia.",
  }),
  rol: Joi.string().valid("estudiante").required(),
  terminosAceptados: Joi.boolean().valid(true).required().messages({
    "any.only": "Debes aceptar los terminos y condiciones",
    "any.required": "Debes aceptar los terminos y condiciones",
  }),
  universidad: Joi.string().min(2).max(255).required().messages({
    "any.required": "La universidad es obligatoria.",
    "string.empty": "La universidad no puede estar vacia.",
  }),
})
  .unknown(false)
  .messages(strictMessages);

export const registerArrendadorValidation = Joi.object({
  ...baseRegisterFields,
  rol: Joi.string().valid("arrendador").required(),
  telefono: Joi.string().min(8).max(20).required().messages({
    "any.required": "El telefono es obligatorio.",
    "string.empty": "El telefono no puede estar vacio.",
  }),
  terminosAceptados: Joi.boolean().valid(true).required().messages({
    "any.only": "Debes aceptar los terminos y condiciones",
    "any.required": "Debes aceptar los terminos y condiciones",
  }),
})
  .unknown(false)
  .messages(strictMessages);
