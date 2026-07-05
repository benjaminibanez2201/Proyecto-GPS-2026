export const COMMUNES = [
  {
    value: 'concepcion',
    name: 'Concepción',
    normalized: 'concepcion',
    center: { lat: -36.8277, lng: -73.0457 },
  },
  {
    value: 'san_pedro_de_la_paz',
    name: 'San Pedro de la Paz',
    normalized: 'san pedro de la paz',
    center: { lat: -36.8389, lng: -73.1049 },
  },
  {
    value: 'talcahuano',
    name: 'Talcahuano',
    normalized: 'talcahuano',
    center: { lat: -36.7248, lng: -73.1168 },
  },
  {
    value: 'chiguayante',
    name: 'Chiguayante',
    normalized: 'chiguayante',
    center: { lat: -36.9186, lng: -73.0233 },
  },
  {
    value: 'hualpen',
    name: 'Hualpén',
    normalized: 'hualpen',
    center: { lat: -36.7867, lng: -73.1114 },
  },
  {
    value: 'penco',
    name: 'Penco',
    normalized: 'penco',
    center: { lat: -36.7397, lng: -72.9975 },
  },
];

export const COMUNAS_PERMITIDAS = COMMUNES.map(({ value, name }) => ({ value, name }));

export function getComunaCenter(comunaValue) {
  const commune = COMMUNES.find((item) => item.value === comunaValue);
  return commune ? commune.center : COMMUNES[0].center;
}

export function normalizeText(value = '') {
  return String(value)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

export function getComunaPermitida(ubicacion = '') {
  const normalizedLocation = normalizeText(ubicacion);
  return COMMUNES.find((commune) => normalizedLocation.includes(commune.normalized)) || null;
}

export function getPublicacionComuna(publicacion) {
  const comunaExplicita = COMMUNES.find((commune) => commune.value === publicacion?.comuna);
  if (comunaExplicita) return comunaExplicita;

  return getComunaPermitida(publicacion?.ubicacion || '');
}

export function isPublicacionEnComunaPermitida(publicacion) {
  return Boolean(getPublicacionComuna(publicacion));
}

export function filtrarPublicacionesPermitidas(publicaciones = []) {
  return publicaciones.filter(isPublicacionEnComunaPermitida);
}

export function getMarkerPosition(commune, index = 0) {
  const base = commune.center;
  const ring = Math.floor(index / 5);
  const slot = index % 5;
  const latOffset = (ring * 0.0022) + ((slot - 2) * 0.0011);
  const lngOffset = (ring * 0.0022) + (((slot % 3) - 1) * 0.0011);

  return [base.lat + latOffset, base.lng + lngOffset];
}

export function formatMoneyCLP(value = 0) {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);
}

function hashText(value = '') {
  return normalizeText(value).split('').reduce((accumulator, character) => {
    return (accumulator * 31 + character.charCodeAt(0)) % 1000003;
  }, 7);
}

function getStableOffset(seed, range) {
  return ((seed % (range * 2)) - range) / 1000;
}

export async function resolvePublicationLocation(publicacion) {
  const ubicacion = publicacion?.ubicacion || '';
  if (!ubicacion) {
    return null;
  }

  const commune = getPublicacionComuna(publicacion);
  if (!commune) {
    return null;
  }

  const latitud = Number(publicacion?.latitud);
  const longitud = Number(publicacion?.longitud);

  if (Number.isFinite(latitud) && Number.isFinite(longitud)) {
    return {
      commune,
      lat: latitud,
      lng: longitud,
    };
  }

  const seed = hashText(ubicacion);
  const latOffset = getStableOffset(seed, 12);
  const lngOffset = getStableOffset(Math.floor(seed / 13), 12);

  return {
    commune,
    lat: commune.center.lat + latOffset,
    lng: commune.center.lng + lngOffset,
  };
}

