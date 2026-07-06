import { useEffect, useState } from 'react';
import { getMisPublicaciones, eliminarPublicacion, editarPublicacion, crearPublicacion } from '@services/user.service.js';
import { finalizarArriendoPorPublicacion } from '@services/rentalsAndReviews.service.js';
import { Building2, BarChart3, Pencil, Trash2, Home, Eye, Heart, MessageCircle, RotateCcw, TrendingUp, Image, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import EstadisticasPublicacionModal from '@components/EstadisticasPublicacionModal.jsx';
import { COMUNAS_PERMITIDAS } from '@helpers/publicacionesMapa.helper.js';
import { crearSelectorUbicacion, conectarAutogeocoding } from '@helpers/ubicacionPicker.helper.js';
import { geocodificarUbicacion } from '@services/publicacion.service.js';
import { resolveFileUrl } from '@helpers/resolveFileUrl.js';

const accent = '#0f766e';
const toCount = (value) => Number(value || 0);

const comunaOptionsHtml = (selectedValue) => COMUNAS_PERMITIDAS
  .map(({ value, name }) => `<option value="${value}" ${value === selectedValue ? 'selected' : ''}>${name}</option>`)
  .join('');

const servicioOptions = [
  { id: 'agua', label: 'Agua' },
  { id: 'luz', label: 'Luz' },
  { id: 'gas', label: 'Gas' },
  { id: 'internet', label: 'Internet' },
  { id: 'tv_cable', label: 'TV Cable' },
  { id: 'calefaccion', label: 'Calefacción' },
  { id: 'estacionamiento', label: 'Estacionamiento' },
  { id: 'lavadora', label: 'Lavadora' },
];

const MAX_FOTOS = 10;

const getRawDigits = (value) => (value || '').replace(/\D/g, '');

const attachPriceFormatting = (input) => {
  if (!input) return;
  input.addEventListener('input', () => {
    const raw = getRawDigits(input.value);
    input.value = raw ? Number(raw).toLocaleString('es-CL') : '';
  });
};

const setFieldError = (input, errorEl, message) => {
  if (input) input.classList.toggle('pub-input-error', Boolean(message));
  if (errorEl) errorEl.textContent = message || '';
};

const MisPublicaciones = () => {
  const [publicaciones, setPublicaciones] = useState([]);
  const [publicacionSeleccionada, setPublicacionSeleccionada] = useState(null);
  const [mostrarEstadisticas, setMostrarEstadisticas] = useState(false);
  const navigate = useNavigate();

  const resumen = publicaciones.reduce((acumulado, publicacion) => {
    const visualizaciones = toCount(publicacion.contadorViews);
    const favoritos = toCount(publicacion.contadorFavoritos);
    const conversaciones = toCount(publicacion.contadorConversaciones);
    const estaActiva = publicacion.estado === 'activa';

    acumulado.total += 1;
    acumulado.activas += estaActiva ? 1 : 0;
    acumulado.visualizaciones += visualizaciones;
    acumulado.favoritos += favoritos;
    acumulado.conversaciones += conversaciones;

    return acumulado;
  }, {
    total: 0,
    activas: 0,
    visualizaciones: 0,
    favoritos: 0,
    conversaciones: 0,
  });

  const tarjetasResumen = [
    { label: 'Publicaciones totales', value: resumen.total, icon: Building2, detail: 'Tus anuncios en la plataforma' },
    { label: 'Publicaciones activas', value: resumen.activas, icon: TrendingUp, detail: 'Publicaciones visibles hoy' },
    { label: 'Visualizaciones', value: resumen.visualizaciones, icon: Eye, detail: 'Visitas acumuladas' },
    { label: 'Favoritos y chats', value: resumen.favoritos + resumen.conversaciones, icon: Heart, detail: 'Interacciones recibidas' },
  ];

  useEffect(() => {
    fetchPublicaciones();
  }, []);


  const fetchPublicaciones = async () => {
    const data = await getMisPublicaciones();
    if (Array.isArray(data)) setPublicaciones(data);
  };

  const handleFinalizarArriendo = async (pub) => {
    const confirm = await Swal.fire({
      title: '¿Marcar esta publicación como disponible?',
      text: 'El arriendo actual quedará marcado como finalizado y la publicación volverá a aparecer en las búsquedas.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: accent,
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Sí, marcar disponible',
      cancelButtonText: 'Cancelar',
    });

    if (!confirm.isConfirmed) return;

    const [, err] = await finalizarArriendoPorPublicacion(pub.publicId);

    if (err) {
      Swal.fire({ icon: 'error', title: 'No se pudo finalizar el arriendo', text: err, confirmButtonColor: accent });
      return;
    }

    Swal.fire({ icon: 'success', title: 'Publicación disponible de nuevo', confirmButtonColor: accent });
    fetchPublicaciones();
  };

  const handleEliminar = async (id) => {
    const confirm = await Swal.fire({
      title: '¿Eliminar publicación?',
      text: 'Esta acción no se puede deshacer.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: accent,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
    });

    if (confirm.isConfirmed) {
      const response = await eliminarPublicacion(id);
      if (response?.status === 'Success') {
        Swal.fire({ icon: 'success', title: 'Publicación eliminada', confirmButtonColor: accent });
        fetchPublicaciones();
      } else {
        Swal.fire({ icon: 'error', title: 'Error', text: response?.details || response?.message || 'No se pudo eliminar la publicación', confirmButtonColor: accent });
      }
    }
  };

  const handleEditar = async (pub) => {
    const initialPreviewUrl = (pub.fotos && pub.fotos[0]) ? resolveFileUrl(pub.fotos[0]) : '';
    let selectorUbicacion = null;

    await Swal.fire({
      html: `
        <style>
          .pub-label { font-weight: 700; font-size: 11px; color: #475569; text-transform: uppercase; letter-spacing: 0.06em; margin: 0 0 6px; display: block; }
          .pub-required { color: #dc2626; }
          .pub-input { padding: 11px 14px; border-radius: 12px; border: 1.5px solid #e2e8f0; font-size: 14px; background-color: #f8fafc; color: #0f172a; outline: none; box-sizing: border-box; width: 100%; transition: border-color 0.2s; font-family: inherit; }
          .pub-input:focus { border-color: #0f766e; background-color: #fff; }
          .pub-col { display: flex; flex-direction: column; gap: 14px; }
          .pub-row2 { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
          .pub-section { display: flex; flex-direction: column; gap: 14px; padding-top: 18px; margin-top: 4px; border-top: 1px solid #eef2f6; }
          .pub-section:first-child { padding-top: 0; margin-top: 0; border-top: none; }
          .pub-section-title { margin: 0; font-size: 12px; font-weight: 800; color: #0f766e; text-transform: uppercase; letter-spacing: 0.06em; }
          .pub-full { grid-column: 1 / -1; display: flex; flex-direction: column; gap: 8px; margin-top: 4px; padding-top: 18px; border-top: 1px solid #eef2f6; }
          .pub-preview-box { width: 100%; height: 230px; border-radius: 16px; overflow: hidden; background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%); border: 2px dashed #cbd5e1; display: flex; align-items: center; justify-content: center; flex-direction: column; gap: 10px; position: relative; }
          .pub-preview-placeholder { color: #94a3b8; display: flex; flex-direction: column; align-items: center; gap: 8px; text-align: center; padding: 20px; }
          .pub-upload-btn { display: inline-flex; align-items: center; gap: 8px; padding: 10px 20px; border-radius: 999px; border: none; background: linear-gradient(135deg, #0f766e 0%, #0b5b54 100%); color: #fff; font-size: 13px; font-weight: 700; cursor: pointer; box-shadow: 0 4px 10px rgba(15,118,110,0.3); transition: transform 0.15s, box-shadow 0.15s; width: fit-content; align-self: flex-start; }
          .pub-upload-btn:hover { transform: translateY(-1px); box-shadow: 0 6px 14px rgba(15,118,110,0.4); }
          .pub-services { display: flex; flex-wrap: wrap; gap: 8px; }
          .pub-service-label { position: relative; display: inline-flex; align-items: center; gap: 6px; font-size: 13px; color: #334155; cursor: pointer; padding: 8px 14px; border-radius: 999px; border: 1.5px solid #e2e8f0; background: #fff; transition: all 0.15s ease; font-weight: 600; user-select: none; }
          .pub-service-label:hover { border-color: #0f766e; background: #f0fdfa; }
          .pub-service-label input { position: absolute; opacity: 0; width: 0; height: 0; pointer-events: none; }
          .pub-service-label .pub-service-check { display: none; font-weight: 800; }
          .pub-service-label:has(input:checked) { background: #0f766e; border-color: #0f766e; color: #fff; box-shadow: 0 3px 10px rgba(15,118,110,0.3); }
          .pub-service-label:has(input:checked) .pub-service-check { display: inline; }
          .pub-footer { grid-column: 1 / -1; display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-top: 8px; padding-top: 18px; border-top: 1.5px solid #e2e8f0; }
          .pub-footer-hint { font-size: 12px; color: #94a3b8; }
          .pub-actions { display: flex; gap: 12px; }
          .pub-btn-cancel { padding: 12px 22px; border-radius: 12px; background-color: transparent; color: #64748b; font-weight: 600; font-size: 14px; border: 1.5px solid #e2e8f0; cursor: pointer; transition: all 0.15s; }
          .pub-btn-cancel:hover { background: #f1f5f9; border-color: #cbd5e1; }
          .pub-btn-submit { padding: 12px 28px; border-radius: 12px; background: linear-gradient(135deg, #0f766e 0%, #0b5b54 100%); color: #fff; font-weight: 700; font-size: 14px; border: none; cursor: pointer; box-shadow: 0 4px 12px rgba(15,118,110,0.3); transition: transform 0.15s, box-shadow 0.15s; }
          .pub-btn-submit:hover { transform: translateY(-1px); box-shadow: 0 6px 16px rgba(15,118,110,0.4); }
          .pub-header { grid-column: 1 / -1; display: flex; align-items: center; gap: 14px; margin-bottom: 4px; }
          .pub-header-icon { width: 46px; height: 46px; border-radius: 14px; background: linear-gradient(135deg, #0f766e 0%, #0b5b54 100%); color: #fff; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
          .pub-header-title { margin: 0 0 2px; font-size: 20px; font-weight: 800; color: #0f172a; text-align: left; }
          .pub-header-subtitle { margin: 0; font-size: 13px; color: #64748b; text-align: left; }
          .pub-input-error { border-color: #dc2626 !important; background-color: #fef2f2 !important; }
          .pub-error-text { display: block; color: #dc2626; font-size: 11px; margin-top: 4px; font-weight: 600; }
          .pub-error-text:empty { display: none; margin-top: 0; }
          .pub-photo-counter { font-size: 11px; color: #94a3b8; font-weight: 700; }
          .pub-photo-counter.pub-counter-warn { color: #dc2626; }
        </style>

        <div style="display: grid; grid-template-columns: 1fr 1.3fr; gap: 28px; text-align: left; padding: 10px 5px; font-family: 'Segoe UI', Roboto, sans-serif; max-width: 850px;">

          <div class="pub-header">
            <div class="pub-header-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"></path></svg>
            </div>
            <div>
              <h2 class="pub-header-title">Editar publicación</h2>
              <p class="pub-header-subtitle">Actualiza los datos de tu propiedad.</p>
            </div>
          </div>

          <div style="display: flex; flex-direction: column; gap: 12px;">
            <div style="display: flex; align-items: center; justify-content: space-between;">
              <p class="pub-label" style="margin-bottom: 0;">Vista previa de la imagen</p>
              <span id="swal-edit-photo-counter" class="pub-photo-counter">0/${MAX_FOTOS} fotos</span>
            </div>
            <div class="pub-preview-box">
              <img id="swal-edit-preview" src="${initialPreviewUrl}" style="width: 100%; height: 100%; object-fit: cover; display: ${initialPreviewUrl ? 'block' : 'none'}; position: absolute; top: 0; left: 0;" />
              <div id="swal-edit-preview-placeholder" class="pub-preview-placeholder" style="display: ${initialPreviewUrl ? 'none' : 'flex'};">
                <svg xmlns="http://www.w3.org/2000/svg" width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                <span style="font-size: 13px; font-weight: 600; color: #94a3b8;">La primera imagen será la portada</span>
              </div>
            </div>

            ${pub.fotos && pub.fotos.length > 0 ? `
              <div style="display: flex; flex-direction: column; gap: 6px;">
                <label class="pub-label" style="margin-bottom: 0;">Fotos actuales</label>
                <div id="swal-edit-existing-thumbs" style="display: flex; gap: 8px; overflow-x: auto; padding-bottom: 4px;"></div>
                <span style="font-size: 11px; color: #64748b;">Haz clic en la "×" para quitar una foto. Las fotos nuevas que agregues abajo se sumarán a las que dejes aquí.</span>
              </div>
            ` : ''}

            <div style="display: flex; flex-direction: column; gap: 8px; margin-top: 4px;">
              <label class="pub-label" style="margin-bottom: 0;">Fotos nuevas ${pub.fotos && pub.fotos.length > 0 ? '' : "<span class='pub-required'>*</span>"}</label>
              <button id="swal-edit-file-button" type="button" class="pub-upload-btn">
                <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
                Seleccionar fotos
              </button>
              <input id="swal-edit-foto" type="file" accept="image/*" multiple style="display:none;" />
              <div id="swal-edit-thumbs" style="display: flex; gap: 8px; flex-wrap: wrap;"></div>
              <span class="pub-error-text" id="err-edit-fotos"></span>
            </div>
          </div>

          <div class="pub-col">
            <div class="pub-section">
              <p class="pub-section-title">Datos básicos</p>
              <div>
                <label class="pub-label">Título del inmueble <span class="pub-required">*</span></label>
                <input id="swal-edit-titulo" class="pub-input" value="${pub.titulo}" placeholder="Ej: Departamento céntrico">
                <span class="pub-error-text" id="err-edit-titulo"></span>
              </div>
              <div class="pub-row2">
                <div>
                  <label class="pub-label">Tipo de inmueble <span class="pub-required">*</span></label>
                  <select id="swal-edit-tipo" class="pub-input" style="height:44px;">
                    <option value="" disabled ${pub.tipoInmueble ? '' : 'selected'}>Selecciona tipo</option>
                    <option value="pieza" ${pub.tipoInmueble === 'pieza' ? 'selected' : ''}>Pieza</option>
                    <option value="departamento" ${pub.tipoInmueble === 'departamento' ? 'selected' : ''}>Departamento</option>
                    <option value="casa" ${pub.tipoInmueble === 'casa' ? 'selected' : ''}>Casa</option>
                    <option value="estudio" ${pub.tipoInmueble === 'estudio' ? 'selected' : ''}>Estudio</option>
                  </select>
                  <span class="pub-error-text" id="err-edit-tipo"></span>
                </div>
                <div>
                  <label class="pub-label">Precio mensual ($) <span class="pub-required">*</span></label>
                  <input id="swal-edit-precio" type="text" inputmode="numeric" class="pub-input" value="${Number(pub.precioMensual).toLocaleString('es-CL')}">
                  <span class="pub-error-text" id="err-edit-precio"></span>
                </div>
              </div>
            </div>

            <div class="pub-section">
              <p class="pub-section-title">Ubicación</p>
              <div class="pub-row2">
                <div>
                  <label class="pub-label">Ubicación <span class="pub-required">*</span></label>
                  <input id="swal-edit-ubicacion" class="pub-input" value="${pub.ubicacion}">
                  <span class="pub-error-text" id="err-edit-ubicacion"></span>
                </div>
                <div>
                  <label class="pub-label">Comuna <span class="pub-required">*</span></label>
                  <select id="swal-edit-comuna" class="pub-input" style="height:44px;">
                    <option value="" disabled ${pub.comuna ? '' : 'selected'}>Selecciona comuna</option>
                    ${comunaOptionsHtml(pub.comuna)}
                  </select>
                  <span class="pub-error-text" id="err-edit-comuna"></span>
                </div>
              </div>
              <div style="display:flex;flex-direction:column;gap:6px;">
                <label class="pub-label" style="margin-bottom:0;">Ubicación en el mapa</label>
                <div id="swal-edit-map" class="pub-map-container"></div>
                <div>
                  <span class="pub-map-hint" id="swal-edit-map-hint"></span>
                  <a href="#" class="pub-map-reset" id="swal-edit-map-reset">Restablecer ubicación automática</a>
                </div>
              </div>
            </div>

            <div class="pub-section">
              <p class="pub-section-title">Servicios</p>
              <div class="pub-services">
                ${servicioOptions.map((servicio) => `
                  <label class="pub-service-label">
                    <input
                      type="checkbox"
                      name="swal-edit-servicio"
                      value="${servicio.id}"
                      ${Array.isArray(pub.serviciosIncluidos) && pub.serviciosIncluidos.includes(servicio.id) ? 'checked' : ''}
                    />
                    <span class="pub-service-check">✓</span>
                    <span>${servicio.label}</span>
                  </label>
                `).join('')}
              </div>
            </div>
          </div>

          <div class="pub-full">
            <label class="pub-label">Reglas de convivencia</label>
            <textarea id="swal-edit-reglas" class="pub-input" rows="3" placeholder="Reglas del hogar o ambiente de estudio..." style="resize:none;min-height:75px;">${pub.rules || pub.reglasConvivencia || ''}</textarea>
          </div>

          <div class="pub-footer">
            <span class="pub-footer-hint"><span class="pub-required">*</span> Campos obligatorios</span>
            <div class="pub-actions">
              <button id="btn-swal-cancel" type="button" class="pub-btn-cancel">Cancelar</button>
              <button id="btn-swal-submit" type="button" class="pub-btn-submit">Guardar cambios</button>
            </div>
          </div>
        </div>
      `,
      width: '880px', 
      focusConfirm: false,
      showConfirmButton: false, 
      showCancelButton: false,
      didOpen: () => {
        let archivosSeleccionados = [];
        let fotosExistentes = Array.isArray(pub.fotos) ? [...pub.fotos] : [];

        const editFileButton = document.getElementById('swal-edit-file-button');
        const editFileInput = document.getElementById('swal-edit-foto');
        const editThumbsContainer = document.getElementById('swal-edit-thumbs');
        const editExistingThumbsContainer = document.getElementById('swal-edit-existing-thumbs');
        const editPreview = document.getElementById('swal-edit-preview');
        const editPreviewPlaceholder = document.getElementById('swal-edit-preview-placeholder');
        const editPhotoCounter = document.getElementById('swal-edit-photo-counter');

        const latitudExistente = Number(pub.latitud);
        const longitudExistente = Number(pub.longitud);
        const tieneCoordenadas = Number.isFinite(latitudExistente) && Number.isFinite(longitudExistente);

        selectorUbicacion = crearSelectorUbicacion({
          contenedorId: 'swal-edit-map',
          comunaSelectId: 'swal-edit-comuna',
          hintId: 'swal-edit-map-hint',
          resetButtonId: 'swal-edit-map-reset',
          posicionInicial: tieneCoordenadas ? { lat: latitudExistente, lng: longitudExistente } : undefined,
          esManualInicial: tieneCoordenadas,
        });

        conectarAutogeocoding({
          ubicacionInputId: 'swal-edit-ubicacion',
          comunaSelectId: 'swal-edit-comuna',
          resetButtonId: 'swal-edit-map-reset',
          selector: selectorUbicacion,
          geocodeFn: geocodificarUbicacion,
        });

        attachPriceFormatting(document.getElementById('swal-edit-precio'));

        const updatePhotoCounter = () => {
          if (!editPhotoCounter) return;
          const total = archivosSeleccionados.length + fotosExistentes.length;
          editPhotoCounter.textContent = `${total}/${MAX_FOTOS} fotos`;
          editPhotoCounter.classList.toggle('pub-counter-warn', total > MAX_FOTOS);
        };

        const updateEditPreview = () => {
          if (!editPreview || !editPreviewPlaceholder) return;

          if (archivosSeleccionados[0]) {
            editPreview.src = URL.createObjectURL(archivosSeleccionados[0]);
            editPreview.style.display = 'block';
            editPreviewPlaceholder.style.display = 'none';
          } else if (fotosExistentes[0]) {
            editPreview.src = resolveFileUrl(fotosExistentes[0]);
            editPreview.style.display = 'block';
            editPreviewPlaceholder.style.display = 'none';
          } else {
            editPreview.style.display = 'none';
            editPreviewPlaceholder.style.display = 'flex';
          }
        };

        const renderExistingThumbs = () => {
          if (!editExistingThumbsContainer) return;

          editExistingThumbsContainer.innerHTML = fotosExistentes.map((foto, index) => `
            <div style="position: relative; width: 60px; height: 60px; border-radius: 10px; overflow: hidden; border: 1px solid #e2e8f0; flex-shrink: 0;">
              <img src="${resolveFileUrl(foto)}" style="width: 100%; height: 100%; object-fit: cover;" />
              <button type="button" data-remove-existing-index="${index}" style="position: absolute; top: 2px; right: 2px; width: 18px; height: 18px; border-radius: 50%; border: none; background: rgba(0,0,0,0.6); color: #fff; font-size: 12px; line-height: 1; cursor: pointer;">&times;</button>
            </div>
          `).join('');

          editExistingThumbsContainer.querySelectorAll('button[data-remove-existing-index]').forEach((btn) => {
            btn.addEventListener('click', () => {
              fotosExistentes.splice(Number(btn.dataset.removeExistingIndex), 1);
              renderExistingThumbs();
              updateEditPreview();
              updatePhotoCounter();
            });
          });
        };

        const renderEditThumbs = () => {
          if (!editThumbsContainer) return;

          editThumbsContainer.innerHTML = archivosSeleccionados.map((_, index) => `
            <div style="position: relative; width: 60px; height: 60px; border-radius: 10px; overflow: hidden; border: 1px solid #e2e8f0; flex-shrink: 0;">
              <img data-thumb-index="${index}" style="width: 100%; height: 100%; object-fit: cover;" />
              <button type="button" data-remove-index="${index}" style="position: absolute; top: 2px; right: 2px; width: 18px; height: 18px; border-radius: 50%; border: none; background: rgba(0,0,0,0.6); color: #fff; font-size: 12px; line-height: 1; cursor: pointer;">&times;</button>
            </div>
          `).join('');

          editThumbsContainer.querySelectorAll('img[data-thumb-index]').forEach((img) => {
            img.src = URL.createObjectURL(archivosSeleccionados[Number(img.dataset.thumbIndex)]);
          });

          editThumbsContainer.querySelectorAll('button[data-remove-index]').forEach((btn) => {
            btn.addEventListener('click', () => {
              archivosSeleccionados.splice(Number(btn.dataset.removeIndex), 1);
              renderEditThumbs();
              updateEditPreview();
              updatePhotoCounter();
            });
          });
        };

        renderExistingThumbs();
        updatePhotoCounter();

        if (editFileButton && editFileInput) {
          editFileButton.addEventListener('click', () => editFileInput.click());
          editFileInput.addEventListener('change', () => {
            archivosSeleccionados = archivosSeleccionados.concat(Array.from(editFileInput.files || []));
            editFileInput.value = '';
            renderEditThumbs();
            updateEditPreview();
            updatePhotoCounter();
          });
        }

        document.getElementById('btn-swal-cancel').addEventListener('click', () => Swal.close());
        document.getElementById('btn-swal-submit').addEventListener('click', async () => {
          const tituloInput = document.getElementById('swal-edit-titulo');
          const tipoSelect = document.getElementById('swal-edit-tipo');
          const precioInput = document.getElementById('swal-edit-precio');
          const ubicacionInput = document.getElementById('swal-edit-ubicacion');
          const comunaSelect = document.getElementById('swal-edit-comuna');
          const fotosErr = document.getElementById('err-edit-fotos');

          const titulo = tituloInput.value.trim();
          const tipoInmueble = tipoSelect.value;
          const precioMensual = getRawDigits(precioInput.value);
          const ubicacion = ubicacionInput.value.trim();
          const comuna = comunaSelect.value;
          const totalFotos = archivosSeleccionados.length + fotosExistentes.length;

          let tituloError = '';
          if (!titulo) tituloError = 'El título es obligatorio.';
          else if (titulo.length < 5) tituloError = 'El título debe tener al menos 5 caracteres.';

          let ubicacionError = '';
          if (!ubicacion) ubicacionError = 'La ubicación es obligatoria.';
          else if (ubicacion.length < 5) ubicacionError = 'La ubicación debe tener al menos 5 caracteres.';

          setFieldError(tituloInput, document.getElementById('err-edit-titulo'), tituloError);
          setFieldError(tipoSelect, document.getElementById('err-edit-tipo'), tipoInmueble ? '' : 'Selecciona un tipo.');
          setFieldError(precioInput, document.getElementById('err-edit-precio'), precioMensual ? '' : 'El precio es obligatorio.');
          setFieldError(ubicacionInput, document.getElementById('err-edit-ubicacion'), ubicacionError);
          setFieldError(comunaSelect, document.getElementById('err-edit-comuna'), comuna ? '' : 'Selecciona una comuna.');
          if (fotosErr) {
            fotosErr.textContent = totalFotos === 0
              ? 'Agrega al menos una foto.'
              : (totalFotos > MAX_FOTOS ? `Máximo ${MAX_FOTOS} fotos permitidas.` : '');
          }

          const hayErrores = Boolean(tituloError) || !tipoInmueble || !precioMensual || Boolean(ubicacionError) || !comuna || totalFotos === 0 || totalFotos > MAX_FOTOS;
          if (hayErrores) return;

          const serviciosIncluidos = Array.from(document.querySelectorAll('input[name="swal-edit-servicio"]:checked')).map((checkbox) => checkbox.value);
          const formData = new FormData();
          formData.append('titulo', titulo);
          formData.append('tipoInmueble', tipoInmueble);
          formData.append('precioMensual', parseInt(precioMensual));
          formData.append('ubicacion', ubicacion);
          formData.append('comuna', comuna);
          serviciosIncluidos.forEach((servicio) => {
            formData.append('serviciosIncluidos', servicio);
          });

          formData.append('reglasConvivencia', document.getElementById('swal-edit-reglas').value);

          formData.append('fotos', JSON.stringify(fotosExistentes));
          archivosSeleccionados.forEach((file) => {
            formData.append('fotosPublicacion', file);
          });

          if (selectorUbicacion?.isManual()) {
            const posicion = selectorUbicacion.getPosicion();
            formData.append('latitud', posicion.lat);
            formData.append('longitud', posicion.lng);
          }

          Swal.showLoading();
          const response = await editarPublicacion(pub.publicId, formData);
          if (response?.id) {
            Swal.close();
            Swal.fire({ icon: 'success', title: 'Publicación actualizada', confirmButtonColor: accent });
            fetchPublicaciones();
          } else {
            Swal.showValidationMessage(response?.details || response?.message || 'Error interno al intentar actualizar la publicación.');
          }
        });
      },
      didClose: () => {
        selectorUbicacion?.destroy();
      },
    });
  };

  const handleCrear = async () => {
    let archivosSeleccionados = [];
    let selectorUbicacion = null;

    const { value: formValues } = await Swal.fire({
      html: `
        <style>
          .pub-grid { display: grid; grid-template-columns: 1fr 1.3fr; gap: 24px; text-align: left; padding: 8px 4px; font-family: 'Segoe UI', Roboto, sans-serif; }
          .pub-header { grid-column: 1 / -1; display: flex; align-items: center; gap: 14px; margin-bottom: 4px; }
          .pub-header-icon { width: 46px; height: 46px; border-radius: 14px; background: linear-gradient(135deg, #0f766e 0%, #0b5b54 100%); color: #fff; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
          .pub-header-title { margin: 0 0 2px; font-size: 20px; font-weight: 800; color: #0f172a; text-align: left; }
          .pub-header-subtitle { margin: 0; font-size: 13px; color: #64748b; text-align: left; }
          .pub-label { font-weight: 700; font-size: 11px; color: #475569; text-transform: uppercase; letter-spacing: 0.06em; margin: 0 0 6px; display: block; }
          .pub-required { color: #dc2626; }
          .pub-input { padding: 11px 14px; border-radius: 12px; border: 1.5px solid #e2e8f0; font-size: 14px; background-color: #f8fafc; color: #0f172a; outline: none; box-sizing: border-box; width: 100%; transition: border-color 0.2s; font-family: inherit; }
          .pub-input:focus { border-color: #0f766e; background-color: #fff; }
          .pub-col { display: flex; flex-direction: column; gap: 14px; }
          .pub-section { display: flex; flex-direction: column; gap: 14px; padding-top: 18px; margin-top: 4px; border-top: 1px solid #eef2f6; }
          .pub-section:first-child { padding-top: 0; margin-top: 0; border-top: none; }
          .pub-section-title { margin: 0; font-size: 12px; font-weight: 800; color: #0f766e; text-transform: uppercase; letter-spacing: 0.06em; }
          .pub-preview-box { width: 100%; height: 240px; border-radius: 16px; overflow: hidden; background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%); border: 2px dashed #cbd5e1; display: flex; align-items: center; justify-content: center; flex-direction: column; gap: 10px; position: relative; }
          .pub-preview-placeholder { color: #94a3b8; display: flex; flex-direction: column; align-items: center; gap: 10px; text-align: center; padding: 20px; }
          .pub-upload-btn { display: inline-flex; align-items: center; gap: 8px; padding: 10px 20px; border-radius: 999px; border: none; background: linear-gradient(135deg, #0f766e 0%, #0b5b54 100%); color: #fff; font-size: 13px; font-weight: 700; cursor: pointer; box-shadow: 0 4px 10px rgba(15,118,110,0.3); transition: transform 0.15s, box-shadow 0.15s; width: fit-content; }
          .pub-upload-btn:hover { transform: translateY(-1px); box-shadow: 0 6px 14px rgba(15,118,110,0.4); }
          .pub-row2 { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
          .pub-full { grid-column: 1 / -1; display: flex; flex-direction: column; gap: 8px; margin-top: 4px; padding-top: 18px; border-top: 1px solid #eef2f6; }
          .pub-services { display: flex; flex-wrap: wrap; gap: 8px; }
          .pub-service-label { position: relative; display: inline-flex; align-items: center; gap: 6px; font-size: 13px; color: #334155; cursor: pointer; padding: 8px 14px; border-radius: 999px; border: 1.5px solid #e2e8f0; background: #fff; transition: all 0.15s ease; font-weight: 600; user-select: none; }
          .pub-service-label:hover { border-color: #0f766e; background: #f0fdfa; }
          .pub-service-label input { position: absolute; opacity: 0; width: 0; height: 0; pointer-events: none; }
          .pub-service-label .pub-service-check { display: none; font-weight: 800; }
          .pub-service-label:has(input:checked) { background: #0f766e; border-color: #0f766e; color: #fff; box-shadow: 0 3px 10px rgba(15,118,110,0.3); }
          .pub-service-label:has(input:checked) .pub-service-check { display: inline; }
          .pub-footer { grid-column: 1 / -1; display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-top: 8px; padding-top: 18px; border-top: 1.5px solid #e2e8f0; }
          .pub-footer-hint { font-size: 12px; color: #94a3b8; }
          .pub-actions { display: flex; gap: 12px; }
          .pub-btn-cancel { padding: 12px 22px; border-radius: 12px; background-color: transparent; color: #64748b; font-weight: 600; font-size: 14px; border: 1.5px solid #e2e8f0; cursor: pointer; transition: all 0.15s; }
          .pub-btn-cancel:hover { background: #f1f5f9; border-color: #cbd5e1; }
          .pub-btn-submit { padding: 12px 28px; border-radius: 12px; background: linear-gradient(135deg, #0f766e 0%, #0b5b54 100%); color: #fff; font-weight: 700; font-size: 14px; border: none; cursor: pointer; box-shadow: 0 4px 12px rgba(15,118,110,0.3); transition: transform 0.15s, box-shadow 0.15s; }
          .pub-btn-submit:hover { transform: translateY(-1px); box-shadow: 0 6px 16px rgba(15,118,110,0.4); }
          .pub-input-error { border-color: #dc2626 !important; background-color: #fef2f2 !important; }
          .pub-error-text { display: block; color: #dc2626; font-size: 11px; margin-top: 4px; font-weight: 600; }
          .pub-error-text:empty { display: none; margin-top: 0; }
          .pub-photo-counter { font-size: 11px; color: #94a3b8; font-weight: 700; }
          .pub-photo-counter.pub-counter-warn { color: #dc2626; }
        </style>

        <div class="pub-grid">
          <div class="pub-header">
            <div class="pub-header-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21h18"></path><path d="M5 21V7l8-4v18"></path><path d="M19 21V11l-6-4"></path><path d="M9 9v.01"></path><path d="M9 12v.01"></path><path d="M9 15v.01"></path><path d="M9 18v.01"></path></svg>
            </div>
            <div>
              <h2 class="pub-header-title">Nueva publicación</h2>
              <p class="pub-header-subtitle">Completa los datos para publicar tu propiedad.</p>
            </div>
          </div>

          <div class="pub-col">
            <div>
              <div style="display: flex; align-items: center; justify-content: space-between;">
                <p class="pub-label" style="margin-bottom: 0;">Vista previa de la propiedad</p>
                <span id="swal-create-photo-counter" class="pub-photo-counter">0/${MAX_FOTOS} fotos</span>
              </div>
              <div class="pub-preview-box" style="margin-top: 8px;">
                <img id="swal-create-preview" src="" style="width:100%;height:100%;object-fit:cover;display:none;position:absolute;top:0;left:0;" />
                <div id="swal-create-preview-placeholder" class="pub-preview-placeholder">
                  <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                  <span style="font-size:13px;font-weight:600;color:#94a3b8;">La primera foto será la portada</span>
                  <span style="font-size:12px;color:#cbd5e1;">Puedes subir hasta ${MAX_FOTOS} imágenes</span>
                </div>
              </div>
            </div>
            <div style="display:flex;flex-direction:column;gap:8px;">
              <label class="pub-label">Imágenes <span class="pub-required">*</span></label>
              <button id="swal-create-file-button" type="button" class="pub-upload-btn">
                <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                Seleccionar fotos
              </button>
              <input id="swal-foto" type="file" accept="image/*" multiple style="display:none;" />
              <div id="swal-create-thumbs" style="display: flex; gap: 8px; flex-wrap: wrap;"></div>
              <span class="pub-error-text" id="err-fotos"></span>
            </div>
          </div>

          <div class="pub-col">
            <div class="pub-section">
              <p class="pub-section-title">Datos básicos</p>
              <div>
                <label class="pub-label">Título de la publicación <span class="pub-required">*</span></label>
                <input id="swal-titulo" class="pub-input" placeholder="Ej: Pieza Universitaria frente a la U">
                <span class="pub-error-text" id="err-titulo"></span>
              </div>
              <div class="pub-row2">
                <div>
                  <label class="pub-label">Tipo de inmueble <span class="pub-required">*</span></label>
                  <select id="swal-tipo" class="pub-input" style="height:44px;">
                    <option value="" disabled selected>Selecciona tipo</option>
                    <option value="pieza">Pieza</option>
                    <option value="departamento">Departamento</option>
                    <option value="casa">Casa</option>
                    <option value="estudio">Estudio</option>
                  </select>
                  <span class="pub-error-text" id="err-tipo"></span>
                </div>
                <div>
                  <label class="pub-label">Precio mensual ($) <span class="pub-required">*</span></label>
                  <input id="swal-precio" type="text" inputmode="numeric" class="pub-input" placeholder="Ej: 180.000">
                  <span class="pub-error-text" id="err-precio"></span>
                </div>
              </div>
            </div>

            <div class="pub-section">
              <p class="pub-section-title">Ubicación</p>
              <div class="pub-row2">
                <div>
                  <label class="pub-label">Ubicación <span class="pub-required">*</span></label>
                  <input id="swal-ubicacion" class="pub-input" placeholder="Dirección exacta del inmueble">
                  <span class="pub-error-text" id="err-ubicacion"></span>
                </div>

                <div>
                  <label class="pub-label">Comuna <span class="pub-required">*</span></label>
                  <select id="swal-comuna" class="pub-input" style="height:44px;">
                    <option value="" disabled selected>Selecciona comuna</option>
                    ${comunaOptionsHtml('')}
                  </select>
                  <span class="pub-error-text" id="err-comuna"></span>
                </div>
              </div>
              <div style="display:flex;flex-direction:column;gap:6px;">
                <label class="pub-label" style="margin-bottom:0;">Ubicación en el mapa</label>
                <div id="swal-create-map" class="pub-map-container"></div>
                <div>
                  <span class="pub-map-hint" id="swal-create-map-hint"></span>
                  <a href="#" class="pub-map-reset" id="swal-create-map-reset">Restablecer ubicación automática</a>
                </div>
              </div>
            </div>

            <div class="pub-section">
              <p class="pub-section-title">Servicios</p>
              <div class="pub-services">
                ${servicioOptions.map(s => `
                  <label class="pub-service-label">
                    <input type="checkbox" name="swal-servicio" value="${s.id}" />
                    <span class="pub-service-check">✓</span>
                    <span>${s.label}</span>
                  </label>
                `).join('')}
              </div>
            </div>
          </div>

          <div class="pub-full">
            <label class="pub-label">Reglas de convivencia</label>
            <textarea id="swal-reglas" class="pub-input" rows="3" placeholder="Ej: No se permite fumar, no mascotas, silencio después de las 22h..." style="resize:none;min-height:80px;"></textarea>
          </div>

          <div class="pub-footer">
            <span class="pub-footer-hint"><span class="pub-required">*</span> Campos obligatorios</span>
            <div class="pub-actions">
              <button id="btn-create-cancel" type="button" class="pub-btn-cancel">Cancelar</button>
              <button id="btn-create-submit" type="button" class="pub-btn-submit">Publicar Inmueble</button>
            </div>
          </div>
        </div>
      `,
      width: '880px',
      focusConfirm: false,
      showConfirmButton: false, 
      showCancelButton: false,
      didOpen: () => {
        const createFileButton = document.getElementById('swal-create-file-button');
        const createFileInput = document.getElementById('swal-foto');
        const createThumbsContainer = document.getElementById('swal-create-thumbs');

        const createPreview = document.getElementById('swal-create-preview');
        const createPreviewPlaceholder = document.getElementById('swal-create-preview-placeholder');
        const createPhotoCounter = document.getElementById('swal-create-photo-counter');

        selectorUbicacion = crearSelectorUbicacion({
          contenedorId: 'swal-create-map',
          comunaSelectId: 'swal-comuna',
          hintId: 'swal-create-map-hint',
          resetButtonId: 'swal-create-map-reset',
        });

        conectarAutogeocoding({
          ubicacionInputId: 'swal-ubicacion',
          comunaSelectId: 'swal-comuna',
          resetButtonId: 'swal-create-map-reset',
          selector: selectorUbicacion,
          geocodeFn: geocodificarUbicacion,
        });

        attachPriceFormatting(document.getElementById('swal-precio'));

        const updatePhotoCounter = () => {
          if (!createPhotoCounter) return;
          createPhotoCounter.textContent = `${archivosSeleccionados.length}/${MAX_FOTOS} fotos`;
          createPhotoCounter.classList.toggle('pub-counter-warn', archivosSeleccionados.length > MAX_FOTOS);
        };

        const updateCreatePreview = () => {
          if (!createPreview || !createPreviewPlaceholder) return;
          if (archivosSeleccionados[0]) {
            createPreview.src = URL.createObjectURL(archivosSeleccionados[0]);
            createPreview.style.display = 'block';
            createPreviewPlaceholder.style.display = 'none';
          } else {
            createPreview.style.display = 'none';
            createPreviewPlaceholder.style.display = 'flex';
          }
        };

        const renderCreateThumbs = () => {
          if (!createThumbsContainer) return;

          createThumbsContainer.innerHTML = archivosSeleccionados.map((_, index) => `
            <div style="position: relative; width: 60px; height: 60px; border-radius: 10px; overflow: hidden; border: 1px solid #e2e8f0; flex-shrink: 0;">
              <img data-thumb-index="${index}" style="width: 100%; height: 100%; object-fit: cover;" />
              <button type="button" data-remove-index="${index}" style="position: absolute; top: 2px; right: 2px; width: 18px; height: 18px; border-radius: 50%; border: none; background: rgba(0,0,0,0.6); color: #fff; font-size: 12px; line-height: 1; cursor: pointer;">&times;</button>
            </div>
          `).join('');

          createThumbsContainer.querySelectorAll('img[data-thumb-index]').forEach((img) => {
            img.src = URL.createObjectURL(archivosSeleccionados[Number(img.dataset.thumbIndex)]);
          });

          createThumbsContainer.querySelectorAll('button[data-remove-index]').forEach((btn) => {
            btn.addEventListener('click', () => {
              archivosSeleccionados.splice(Number(btn.dataset.removeIndex), 1);
              renderCreateThumbs();
              updateCreatePreview();
              updatePhotoCounter();
            });
          });
        };

        if (createFileButton && createFileInput) {
          createFileButton.addEventListener('click', () => createFileInput.click());
          createFileInput.addEventListener('change', () => {
            archivosSeleccionados = archivosSeleccionados.concat(Array.from(createFileInput.files || []));
            createFileInput.value = '';
            renderCreateThumbs();
            updateCreatePreview();
            updatePhotoCounter();
          });
        }

        document.getElementById('btn-create-cancel').addEventListener('click', () => Swal.close());
        document.getElementById('btn-create-submit').addEventListener('click', () => {
          const tituloInput = document.getElementById('swal-titulo');
          const tipoSelect = document.getElementById('swal-tipo');
          const precioInput = document.getElementById('swal-precio');
          const ubicacionInput = document.getElementById('swal-ubicacion');
          const comunaSelect = document.getElementById('swal-comuna');
          const fotosErr = document.getElementById('err-fotos');

          const titulo = tituloInput.value.trim();
          const tipoInmueble = tipoSelect.value;
          const precioMensual = getRawDigits(precioInput.value);
          const ubicacion = ubicacionInput.value.trim();
          const comuna = comunaSelect.value;

          let tituloError = '';
          if (!titulo) tituloError = 'El título es obligatorio.';
          else if (titulo.length < 5) tituloError = 'El título debe tener al menos 5 caracteres.';

          let ubicacionError = '';
          if (!ubicacion) ubicacionError = 'La ubicación es obligatoria.';
          else if (ubicacion.length < 5) ubicacionError = 'La ubicación debe tener al menos 5 caracteres.';

          setFieldError(tituloInput, document.getElementById('err-titulo'), tituloError);
          setFieldError(tipoSelect, document.getElementById('err-tipo'), tipoInmueble ? '' : 'Selecciona un tipo.');
          setFieldError(precioInput, document.getElementById('err-precio'), precioMensual ? '' : 'El precio es obligatorio.');
          setFieldError(ubicacionInput, document.getElementById('err-ubicacion'), ubicacionError);
          setFieldError(comunaSelect, document.getElementById('err-comuna'), comuna ? '' : 'Selecciona una comuna.');
          if (fotosErr) {
            fotosErr.textContent = archivosSeleccionados.length === 0
              ? 'Agrega al menos una foto.'
              : (archivosSeleccionados.length > MAX_FOTOS ? `Máximo ${MAX_FOTOS} fotos permitidas.` : '');
          }

          const hayErrores = Boolean(tituloError) || !tipoInmueble || !precioMensual || Boolean(ubicacionError) || !comuna || archivosSeleccionados.length === 0 || archivosSeleccionados.length > MAX_FOTOS;
          if (hayErrores) return;

          Swal.clickConfirm();
        });
      },
      preConfirm: () => {
        const serviciosIncluidos = Array.from(document.querySelectorAll('input[name="swal-servicio"]:checked')).map((checkbox) => checkbox.value);

        const formData = new FormData();
        formData.append('titulo', document.getElementById('swal-titulo').value);
        formData.append('tipoInmueble', document.getElementById('swal-tipo').value);
        formData.append('precioMensual', getRawDigits(document.getElementById('swal-precio').value));
        formData.append('ubicacion', document.getElementById('swal-ubicacion').value);
        formData.append('comuna', document.getElementById('swal-comuna').value);
        serviciosIncluidos.forEach((servicio) => {
          formData.append('serviciosIncluidos', servicio);
        });
        formData.append('reglasConvivencia', document.getElementById('swal-reglas').value);
        archivosSeleccionados.forEach((file) => {
          formData.append('fotosPublicacion', file);
        });

        if (selectorUbicacion?.isManual()) {
          const posicion = selectorUbicacion.getPosicion();
          formData.append('latitud', posicion.lat);
          formData.append('longitud', posicion.lng);
        }

        return formData;
      },
      didClose: () => {
        selectorUbicacion?.destroy();
      },
    });

    if (formValues) {
      const response = await crearPublicacion(formValues);
      if (response?.id) {
        Swal.fire({ icon: 'success', title: '¡Publicación creada!', confirmButtonColor: accent });
        fetchPublicaciones();
      } else {
        Swal.fire({ icon: 'error', title: 'Error', text: response?.details || response?.message || 'No se pudo crear la publicación', confirmButtonColor: accent });
      }
    }
  };

  const abrirGaleria = (pub) => {
    if (!pub.fotos || pub.fotos.length === 0) return;
    const fotos = pub.fotos;

    Swal.fire({
      html: `
        <style>
          .gal-header { display:flex; align-items:center; gap:14px; margin-bottom:16px; text-align:left; }
          .gal-header-icon { width:46px;height:46px;border-radius:14px;background:linear-gradient(135deg,#0f766e 0%,#0b5b54 100%);color:#fff;display:flex;align-items:center;justify-content:center;flex-shrink:0; }
          .gal-header-title { margin:0 0 2px;font-size:20px;font-weight:800;color:#0f172a;text-align:left; }
          .gal-header-subtitle { margin:0;font-size:13px;color:#64748b;text-align:left; }
          .gal-main { position:relative; width:100%; height:380px; border-radius:16px; overflow:hidden; background:#0f172a; display:flex; align-items:center; justify-content:center; }
          .gal-main img { width:100%; height:100%; object-fit:contain; }
          .gal-nav { position:absolute; top:50%; transform:translateY(-50%); width:38px;height:38px;border-radius:50%;background:rgba(255,255,255,0.9);border:none;display:flex;align-items:center;justify-content:center;cursor:pointer;color:#0f172a;box-shadow:0 4px 10px rgba(0,0,0,0.25); font-size:18px; font-weight:800; }
          .gal-nav:hover { background:#fff; }
          .gal-nav-prev { left:12px; }
          .gal-nav-next { right:12px; }
          .gal-counter { position:absolute; bottom:12px; right:12px; background:rgba(15,23,42,0.75); color:#fff; font-size:12px; font-weight:700; padding:4px 10px; border-radius:999px; }
          .gal-thumbs { display:flex; gap:8px; margin-top:12px; overflow-x:auto; padding-bottom:4px; }
          .gal-thumb { width:64px; height:64px; border-radius:10px; overflow:hidden; flex-shrink:0; cursor:pointer; border:2px solid transparent; opacity:0.6; transition:all 0.15s; padding:0; background:none; }
          .gal-thumb img { width:100%;height:100%;object-fit:cover; }
          .gal-thumb.active { border-color:#0f766e; opacity:1; }
          .gal-thumb:hover { opacity:1; }
        </style>
        <div style="text-align:left; font-family:'Segoe UI',Roboto,sans-serif;">
          <div class="gal-header">
            <div class="gal-header-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
            </div>
            <div>
              <h2 class="gal-header-title">${pub.titulo}</h2>
              <p class="gal-header-subtitle">${fotos.length} foto${fotos.length === 1 ? '' : 's'} publicada${fotos.length === 1 ? '' : 's'}</p>
            </div>
          </div>
          <div class="gal-main">
            <img id="gal-main-img" src="${resolveFileUrl(fotos[0])}" />
            ${fotos.length > 1 ? `
              <button id="gal-prev" type="button" class="gal-nav gal-nav-prev">‹</button>
              <button id="gal-next" type="button" class="gal-nav gal-nav-next">›</button>
            ` : ''}
            <span id="gal-counter" class="gal-counter">1 / ${fotos.length}</span>
          </div>
          ${fotos.length > 1 ? `
            <div class="gal-thumbs" id="gal-thumbs">
              ${fotos.map((foto, i) => `
                <button type="button" class="gal-thumb ${i === 0 ? 'active' : ''}" data-index="${i}">
                  <img src="${resolveFileUrl(foto)}" />
                </button>
              `).join('')}
            </div>
          ` : ''}
        </div>
      `,
      width: '760px',
      confirmButtonColor: accent,
      confirmButtonText: 'Cerrar',
      didOpen: () => {
        let currentIndex = 0;
        const mainImg = document.getElementById('gal-main-img');
        const counter = document.getElementById('gal-counter');
        const thumbs = document.querySelectorAll('.gal-thumb');

        const showIndex = (index) => {
          currentIndex = (index + fotos.length) % fotos.length;
          mainImg.src = resolveFileUrl(fotos[currentIndex]);
          counter.textContent = `${currentIndex + 1} / ${fotos.length}`;
          thumbs.forEach((t) => t.classList.toggle('active', Number(t.dataset.index) === currentIndex));
        };

        thumbs.forEach((t) => t.addEventListener('click', () => showIndex(Number(t.dataset.index))));
        document.getElementById('gal-prev')?.addEventListener('click', () => showIndex(currentIndex - 1));
        document.getElementById('gal-next')?.addEventListener('click', () => showIndex(currentIndex + 1));
      },
    });
  };

  const abrirEstadisticas = (pub) => {
    setPublicacionSeleccionada(pub);
    setMostrarEstadisticas(true);
  };

  const cerrarEstadisticas = () => {
    setMostrarEstadisticas(false);
    setPublicacionSeleccionada(null);
  };

  const irAlDetalle = (pub) => {
    if (!pub?.publicId) return;
    navigate(`/publicacion/${pub.publicId}`);
  };

  return (
    <div style={styles.page}>
      <section style={styles.hero}>
        <div style={styles.heroContent}>
          <div style={styles.heroIcon}>
            <Building2 size={28} strokeWidth={2} />
          </div>
          <div>
            <h1 style={styles.heroTitle}>Mis Publicaciones</h1>
            <p style={styles.heroSubtitle}>Gestiona los inmuebles que has subido a la plataforma.</p>
          </div>
        </div>
      </section>

      <section style={styles.statsBand}>
        <div style={styles.statsBandHeader}>
          <div>
            <h2 style={styles.statsTitle}>Estadísticas de tus publicaciones</h2>
          </div>
          <p style={styles.statsSubtitle}>
            Resumen rápido de alcance e interacción de tus anuncios activos.
          </p>
        </div>

        <div style={styles.statsGrid}>
          {tarjetasResumen.map(({ label, value, icon: Icon, detail }) => (
            <article key={label} style={styles.statsCard}>
              <div style={styles.statsCardTop}>
                <div style={styles.statsIconWrap}>
                  <Icon size={18} strokeWidth={2.2} />
                </div>
                <span style={styles.statsLabel}>{label}</span>
              </div>
              <p style={styles.statsValue}>{toCount(value).toLocaleString('es-CL')}</p>
              <p style={styles.statsDetail}>{detail}</p>
            </article>
          ))}
        </div>
      </section>

      <section style={styles.card}>
        <header style={styles.cardHeader}>
          <div>
            <h2 style={styles.cardTitle}>Tus propiedades publicadas</h2>
            <p style={styles.cardSubtitle}>Aquí aparecen todas las publicaciones que has creado.</p>
          </div>
          <button onClick={handleCrear} style={styles.button}>
            <span>Publicar Inmueble</span>
          </button>
        </header>

        {publicaciones.length === 0 ? (
          <p style={{ color: '#64748b', fontSize: '14px' }}>No tienes publicaciones aún.</p>
        ) : (
          <div style={styles.pubListContainer}>
            {publicaciones.map((pub) => (
              <div 
                key={pub.id} 
                style={styles.pubItem}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 12px 20px -3px rgba(15, 23, 42, 0.08)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(15, 23, 42, 0.04)';
                }}
              >
                
                {/* Contenedor de la Imagen */}
                <div style={styles.imageSection}>
                  {pub.fotos && pub.fotos[0] ? (
                    <img
                      src={resolveFileUrl(pub.fotos[0])}
                      alt={pub.titulo}
                      style={styles.pubImage} 
                      onError={(e) => { 
                        e.target.style.display = 'none'; 
                        if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex'; 
                      }}
                    />
                  ) : null}
                  
                  {/* Placeholder oculto por defecto, se activa si no hay imagen o falla la carga */}
                  <div style={{
                    ...styles.imagePlaceholder,
                    display: pub.fotos && pub.fotos[0] ? 'none' : 'flex'
                  }}>
                    <Home size={32} strokeWidth={1.5} />
                    <p style={styles.imagePlaceholderText}>Sin fotos</p>
                  </div>
                
                  <span style={{
                    ...styles.stateBadge,
                    backgroundColor: pub.estado === 'activa' ? '#dcfce7' : '#fee2e2',
                    color: pub.estado === 'activa' ? '#15803d' : '#dc2626',
                  }}>
                    {pub.estado}
                  </span>
                  <div style={{ position: 'absolute', top: '8px', right: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button onClick={() => abrirEstadisticas(pub)} style={styles.btnStats}>
                      <BarChart3 size={14} strokeWidth={2.2} />
                      Estadísticas
                    </button>
                  </div>
                </div>
                
                {/* Bloque de Textos */}
                <div style={styles.infoContainer}>
                  <span style={styles.typeBadge}>{pub.tipoInmueble}</span>
                  <h4 style={styles.pubTitulo}>{pub.titulo}</h4>
                  
                  <p style={styles.pubPrecio}>
                    <strong>${pub.precioMensual.toLocaleString('es-CL')}</strong> 
                    <span style={{ fontSize: '12px', fontWeight: 'normal', color: '#64748b', marginLeft: '4px' }}>/ mes</span>
                  </p>
                  
                  <p style={styles.pubUbicacion}>{pub.ubicacion}</p>

                  <div style={styles.metricStrip}>
                    <span style={styles.metricChip}>
                      <Eye size={12} strokeWidth={2.4} />
                      {toCount(pub.contadorViews).toLocaleString('es-CL')} vistas
                    </span>
                    <span style={styles.metricChip}>
                      <Heart size={12} strokeWidth={2.4} />
                      {toCount(pub.contadorFavoritos).toLocaleString('es-CL')} favoritos
                    </span>
                    <span style={styles.metricChip}>
                      <MessageCircle size={12} strokeWidth={2.4} />
                      {toCount(pub.contadorConversaciones).toLocaleString('es-CL')} chats
                    </span>
                  </div>
                </div>
                
                {/* Botones de acción abajo */}
                <div style={{
                  ...styles.rightSection,
                  gridTemplateColumns: pub.estado === 'arrendada' ? '1fr 1fr 1fr 1fr' : '1fr 1fr 1fr',
                }}>
                  {pub.estado === 'arrendada' && (
                    <button onClick={() => handleFinalizarArriendo(pub)} style={styles.btnDisponible}>
                      <RotateCcw size={13} />
                      Marcar disponible
                    </button>
                  )}
                  {pub.estado === 'inactiva' ? (
                    <span style={styles.btnBloqueado} title="Esta publicación fue dada de baja por incumplir las normas y no se puede editar">
                      <Lock size={13} />
                      No editable
                    </span>
                  ) : (
                    <button onClick={() => handleEditar(pub)} style={styles.btnEditar}>
                      <Pencil size={13} />
                    </button>
                  )}

                  <button
                    onClick={() => handleEliminar(pub.publicId)}
                    style={{ ...styles.iconBtnAction, color: '#dc2626', backgroundColor: '#fef2f2' }}
                    title="Eliminar"
                  >
                    <Trash2 size={16} />
                  </button>
                  <button
                    onClick={() => abrirGaleria(pub)}
                    disabled={!pub.fotos || pub.fotos.length === 0}
                    style={styles.iconBtnAction}
                    title={`Ver fotos (${pub.fotos?.length || 0})`}
                  >
                    <Image size={16} style={{ color: pub.fotos?.length > 0 ? '#0f766e' : '#94a3b8' }} />
                  </button>
                </div>

              </div>
            ))}
          </div>
        )}
      </section>

      <EstadisticasPublicacionModal
        open={mostrarEstadisticas}
        publicacion={publicacionSeleccionada}
        onClose={cerrarEstadisticas}
        onGoToDetalle={irAlDetalle}
      />
    </div>
  );
};

const styles = {
  page: { display: 'flex', flexDirection: 'column', gap: '24px', padding: '4px 0 24px' },
  hero: {
    borderRadius: '24px', padding: '32px',
    background: 'linear-gradient(135deg, #008080 0%, #0b6b7a 45%, #163d4f 100%)',
    color: '#fff', boxShadow: '0 20px 40px rgba(11, 34, 45, 0.18)',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px'
  },
  heroContent: { display: 'flex', alignItems: 'center', gap: '16px' },
  heroIcon: {
    width: '52px', height: '52px', borderRadius: '16px',
    backgroundColor: 'rgba(255,255,255,0.2)',
    border: '3px solid rgba(255,255,255,0.4)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  heroTitle: { margin: '0 0 4px', fontSize: '28px', fontWeight: '800', letterSpacing: '-0.02em' },
  heroSubtitle: { margin: 0, fontSize: '14px', color: '#ccfbf1' },
  button: {
    display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0,
    padding: '12px 24px', borderRadius: '14px', backgroundColor: '#0f766e',
    color: '#ffffff', fontWeight: '700', fontSize: '14px', border: 'none', cursor: 'pointer',
    boxShadow: '0 10px 15px -3px rgba(15, 118, 110, 0.25)', transition: 'all 0.2s',
  },
  statsBand: {
    borderRadius: '24px',
    padding: '28px',
    background: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)',
    border: '1px solid rgba(15, 23, 42, 0.06)',
    boxShadow: '0 10px 30px rgba(15, 23, 42, 0.05)',
  },
  statsBandHeader: {
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: '18px',
    flexWrap: 'wrap',
    marginBottom: '18px',
  },
  statsEyebrow: {
    margin: '0 0 6px',
    fontSize: '12px',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    color: accent,
  },
  statsTitle: {
    margin: 0,
    fontSize: '22px',
    color: '#0f172a',
    lineHeight: 1.2,
  },
  statsSubtitle: {
    margin: 0,
    maxWidth: '420px',
    color: '#64748b',
    fontSize: '14px',
    lineHeight: 1.5,
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: '14px',
  },
  statsCard: {
    borderRadius: '18px',
    padding: '18px',
    backgroundColor: '#ffffff',
    border: '1px solid #e2e8f0',
  },
  statsCardTop: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '12px',
  },
  statsIconWrap: {
    width: '34px',
    height: '34px',
    borderRadius: '12px',
    backgroundColor: '#dff6f4',
    color: accent,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  statsLabel: {
    fontSize: '13px',
    fontWeight: '800',
    color: '#334155',
  },
  statsValue: {
    margin: '0 0 6px',
    fontSize: '32px',
    fontWeight: '800',
    color: '#0f172a',
    lineHeight: 1,
  },
  statsDetail: {
    margin: 0,
    fontSize: '13px',
    lineHeight: 1.5,
    color: '#64748b',
  },
  card: {
    borderRadius: '24px', padding: '32px', backgroundColor: '#ffffff',
    border: '1px solid #f1f5f9', boxShadow: '0 4px 20px rgba(15, 23, 42, 0.03)',
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: '20px',
    flexWrap: 'wrap',
    marginBottom: '28px',
  },
  eyebrow: { margin: '0 0 6px', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em' },
  cardTitle: { margin: '0 0 6px', fontSize: '24px', fontWeight: '800', color: '#0f172a', letterSpacing: '-0.02em' },
  cardSubtitle: { margin: 0, fontSize: '14px', color: '#64748b' },
  pubListContainer: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '24px',
    marginTop: '10px',
  },
  pubItem: {
    display: 'flex',
    flexDirection: 'column',
    borderRadius: '20px',
    backgroundColor: '#ffffff',
    border: '1px solid #e2e8f0',
    overflow: 'hidden',
    boxShadow: '0 10px 15px -3px rgba(15, 23, 42, 0.04)',
  },
  imageSection: {
    position: 'relative',
    height: '180px',
    width: '100%',
    backgroundColor: '#f1f5f9',
    overflow: 'hidden',
  },
  pubImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    background: 'linear-gradient(135deg, rgba(0,128,128,0.14), rgba(0,128,128,0.04))',
    color: accent,
  },
  imagePlaceholderText: {
    margin: 0,
    fontSize: '12px',
    fontWeight: '700',
    color: accent,
    opacity: 0.7,
  },
  stateBadge: {
    position: 'absolute',
    top: '12px',
    left: '12px',
    fontSize: '11px',
    fontWeight: '700',
    padding: '4px 10px',
    borderRadius: '999px',
    textTransform: 'uppercase',
    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.08)',
  },
  infoContainer: {
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    flex: 1,
  },
  typeBadge: {
    alignSelf: 'flex-start',
    textTransform: 'uppercase',
    fontSize: '10px',
    fontWeight: '800',
    color: '#0f766e',
    backgroundColor: '#ccfbf1',
    padding: '3px 8px',
    borderRadius: '6px',
    letterSpacing: '0.04em',
  },
  pubTitulo: {
    margin: '4px 0 0 0',
    fontSize: '17px',
    fontWeight: '700',
    color: '#0f172a',
    lineHeight: '1.3',
  },
  pubPrecio: {
    margin: '4px 0 0 0',
    fontSize: '20px',
    color: '#0f766e',
  },
  pubUbicacion: {
    margin: '2px 0 0 0',
    fontSize: '13px',
    color: '#64748b',
  },
  metricStrip: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
    marginTop: '10px',
  },
  metricChip: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 10px',
    borderRadius: '999px',
    backgroundColor: '#f8fafc',
    border: '1px solid #e2e8f0',
    color: '#334155',
    fontSize: '12px',
    fontWeight: '700',
  },
  rightSection: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr',
    borderTop: '1px solid #f1f5f9',
    backgroundColor: '#f8fafc',
  },
  iconBtnAction: {
    border: 'none',
    outline: 'none',
    background: 'none',
    padding: '14px 0',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background-color 0.2s ease',
  },
  btnDisponible: {
    border: 'none',
    outline: 'none',
    background: 'none',
    padding: '14px',
    cursor: 'pointer',
    color: '#b45309',
    fontSize: '13px',
    fontWeight: '700',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    borderRight: '1px solid #f1f5f9',
  },
  btnEditar: {
    border: 'none',
    outline: 'none',
    background: 'none',
    padding: '14px',
    cursor: 'pointer',
    color: '#0f766e',
    fontSize: '13px',
    fontWeight: '700',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    borderRight: '1px solid #f1f5f9',
  },
  btnBloqueado: {
    padding: '14px',
    color: '#94a3b8',
    fontSize: '13px',
    fontWeight: '700',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    borderRight: '1px solid #f1f5f9',
    cursor: 'not-allowed',
  },
  btnStats: {
    border: '1px solid #dbe4ee',
    backgroundColor: '#f8fafc',
    color: '#0f766e',
    borderRadius: '10px',
    padding: '8px 12px',
    fontSize: '13px',
    fontWeight: '700',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
  },
};

export default MisPublicaciones;
