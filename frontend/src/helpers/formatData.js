import { startCase } from 'lodash';
import { format as formatRut } from 'rut.js';
import { format as formatTempo } from "@formkit/tempo";

export function formatUserData(user) {
    return {
        ...user,
        nombreCompleto: startCase(user.nombreCompleto),
        rol: startCase(user.rol),
        estadoVerificacion: startCase(user.estadoVerificacion || 'pendiente'),
        rut: formatRut(user.rut),
        createdAtRaw: user.createdAt,
        createdAt: formatTempo(user.createdAt, "DD-MM-YYYY")
    };
}

export function convertirMinusculas(obj) {
    for (let key in obj) {
        if (typeof obj[key] === 'string') {
            obj[key] = obj[key].toLowerCase();
        }
    }
    return obj;
}

export function formatPostUpdate(user) {
    return {
        ...user,
        nombreCompleto: startCase(user.nombreCompleto),
        rol: startCase(user.rol),
        estadoVerificacion: startCase(user.estadoVerificacion || 'pendiente'),
        rut: formatRut(user.rut),
        email: user.email,
        createdAtRaw: user.createdAt,
        createdAt: formatTempo(user.createdAt, "DD-MM-YYYY")
    };
}