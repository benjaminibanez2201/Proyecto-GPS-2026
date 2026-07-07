import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import '@styles/ubicacionPicker.css';
import { getComunaCenter } from './publicacionesMapa.helper.js';

const PIN_STYLE = [
  'width:22px', 'height:22px', 'border-radius:50% 50% 50% 0', 'transform:rotate(-45deg)',
  'background:#0f766e', 'border:2px solid #ffffff', 'box-shadow:0 2px 6px rgba(15,23,42,0.35)',
].join(';');

function crearIconoMarcador() {
  return L.divIcon({
    className: 'ubicacion-picker-icon',
    html: `<div style="${PIN_STYLE}"></div>`,
    iconSize: [22, 22],
    iconAnchor: [11, 22],
  });
}

const HINT_AUTOMATICO = 'Ubicación estimada según la dirección escrita. Arrastra el marcador o haz clic en el mapa si no cae en el lugar correcto.';
const HINT_MANUAL = '✓ Ubicación ajustada manualmente.';
const HINT_BUSCANDO = 'Buscando la dirección en el mapa...';

export function crearSelectorUbicacion({
  contenedorId,
  comunaSelectId,
  hintId,
  resetButtonId,
  posicionInicial,
  esManualInicial = false,
}) {
  const contenedor = document.getElementById(contenedorId);
  if (!contenedor) return null;

  const comunaSelect = comunaSelectId ? document.getElementById(comunaSelectId) : null;
  const hintEl = hintId ? document.getElementById(hintId) : null;
  const resetButton = resetButtonId ? document.getElementById(resetButtonId) : null;

  let esManual = Boolean(esManualInicial && posicionInicial);
  const centroInicial = posicionInicial || getComunaCenter(comunaSelect?.value);

  const map = L.map(contenedorId, {
    center: [centroInicial.lat, centroInicial.lng],
    zoom: 15,
    scrollWheelZoom: true,
  });

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  }).addTo(map);

  const marker = L.marker([centroInicial.lat, centroInicial.lng], {
    draggable: true,
    icon: crearIconoMarcador(),
  }).addTo(map);

  const actualizarHint = () => {
    if (hintEl) hintEl.textContent = esManual ? HINT_MANUAL : HINT_AUTOMATICO;
    if (resetButton) resetButton.style.display = esManual ? 'inline' : 'none';
  };

  const moverMarcador = (lat, lng) => {
    marker.setLatLng([lat, lng]);
    map.panTo([lat, lng]);
  };

  marker.on('dragend', () => {
    esManual = true;
    actualizarHint();
  });

  map.on('click', (event) => {
    esManual = true;
    moverMarcador(event.latlng.lat, event.latlng.lng);
    actualizarHint();
  });

  actualizarHint();
  setTimeout(() => map.invalidateSize(), 100);

  return {
    getPosicion: () => marker.getLatLng(),
    isManual: () => esManual,
    setPosicionAutomatica: (lat, lng) => {
      if (esManual) return;
      moverMarcador(lat, lng);
    },
    forzarPosicionAutomatica: (lat, lng) => {
      esManual = false;
      moverMarcador(lat, lng);
      actualizarHint();
    },
    setBuscando: (buscando) => {
      if (!hintEl) return;
      hintEl.textContent = buscando ? HINT_BUSCANDO : (esManual ? HINT_MANUAL : HINT_AUTOMATICO);
    },
    destroy: () => map.remove(),
  };
}

function debounce(fn, waitMs) {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), waitMs);
  };
}

export function conectarAutogeocoding({
  ubicacionInputId,
  comunaSelectId,
  resetButtonId,
  selector,
  geocodeFn,
}) {
  const ubicacionInput = document.getElementById(ubicacionInputId);
  const comunaSelect = document.getElementById(comunaSelectId);
  const resetButton = resetButtonId ? document.getElementById(resetButtonId) : null;
  if (!ubicacionInput || !comunaSelect || !selector) return;

  let ultimaSolicitud = 0;

  const intentarGeocodificar = async (forzar) => {
    const ubicacionValue = ubicacionInput.value.trim();
    const comunaValue = comunaSelect.value;
    if (ubicacionValue.length < 5 || !comunaValue) return;
    if (!forzar && selector.isManual()) return;

    const solicitudId = ++ultimaSolicitud;
    selector.setBuscando(true);

    const [coordenadas] = await geocodeFn(ubicacionValue, comunaValue);

    if (solicitudId !== ultimaSolicitud) return;
    selector.setBuscando(false);

    const destino = (coordenadas && Number.isFinite(coordenadas.latitud) && Number.isFinite(coordenadas.longitud))
      ? { lat: coordenadas.latitud, lng: coordenadas.longitud }
      : getComunaCenter(comunaValue);

    if (forzar) selector.forzarPosicionAutomatica(destino.lat, destino.lng);
    else selector.setPosicionAutomatica(destino.lat, destino.lng);
  };

  const disparar = debounce(() => intentarGeocodificar(false), 500);

  ubicacionInput.addEventListener('blur', disparar);
  comunaSelect.addEventListener('change', disparar);

  if (resetButton) {
    resetButton.addEventListener('click', (event) => {
      event.preventDefault();
      intentarGeocodificar(true);
    });
  }
}
