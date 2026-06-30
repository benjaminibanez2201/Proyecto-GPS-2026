const COMMUNES = [
  {
    name: 'Concepción',
    normalized: 'concepcion',
    center: { lat: -36.8277, lng: -73.0457 },
  },
  {
    name: 'Hualpén',
    normalized: 'hualpen',
    center: { lat: -36.7867, lng: -73.1114 },
  },
  {
    name: 'Coronel',
    normalized: 'coronel',
    center: { lat: -37.0333, lng: -73.1400 },
  },
  {
    name: 'Talcahuano',
    normalized: 'talcahuano',
    center: { lat: -36.7248, lng: -73.1168 },
  },
  {
    name: 'San Pedro de la Paz',
    normalized: 'san pedro de la paz',
    center: { lat: -36.8389, lng: -73.1049 },
  },
];

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

  const commune = getPublicacionComuna(publicacion) || COMMUNES[0];

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

