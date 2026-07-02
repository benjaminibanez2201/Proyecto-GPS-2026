import { useEffect, useState } from 'react';
import { getMisPublicaciones, eliminarPublicacion, editarPublicacion, crearPublicacion } from '@services/user.service.js';
import axios from '@services/root.service.js';
import { Building2, BarChart3, Pencil, Trash2, Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import EstadisticasPublicacionModal from '@components/EstadisticasPublicacionModal.jsx';

const accent = '#0f766e';

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

const MisPublicaciones = () => {
  const [publicaciones, setPublicaciones] = useState([]);
  const [publicacionSeleccionada, setPublicacionSeleccionada] = useState(null);
  const [mostrarEstadisticas, setMostrarEstadisticas] = useState(false);
  const navigate = useNavigate();
  const [galeriaFotos, setGaleriaFotos] = useState(null); 

  useEffect(() => {
    fetchPublicaciones();
  }, []);

  const resolvePhotoUrl = (url) => {
    if (!url) return '';
    if (typeof url !== 'string') return '';
    if (url.startsWith('http')) return url;
    return `http://localhost:3000${url}`;
  };

  const fetchPublicaciones = async () => {
    const data = await getMisPublicaciones();
    console.log("PUBLICACIONES:", data);
    if (Array.isArray(data)) setPublicaciones(data);
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
      if (!response?.message) {
        Swal.fire({ icon: 'success', title: 'Publicación eliminada', confirmButtonColor: accent });
        fetchPublicaciones();
      }
    }
  };

  const handleEditar = async (pub) => {
    const initialPreviewUrl = (pub.fotos && pub.fotos[0]) ? resolvePhotoUrl(pub.fotos[0]) : '';

    await Swal.fire({
      title: 'Editar Publicación',
      html: `
        <div style="display: grid; grid-template-columns: 1fr 1.3fr; gap: 28px; text-align: left; padding: 10px 5px; font-family: 'Segoe UI', Roboto, sans-serif; max-width: 850px;">
          
          <div style="display: flex; flex-direction: column; gap: 12px;">
            <p style="font-weight: 700; font-size: 11px; color: #475569; text-transform: uppercase; letter-spacing: 0.04em; margin: 0;">Vista previa de la imagen</p>
            <div style="width: 100%; height: 230px; border-radius: 16px; overflow: hidden; background-color: #f1f5f9; border: 1px solid #e2e8f0; display: flex; align-items: center; justify-content: center; position: relative;">
              <img id="swal-edit-preview" src="${initialPreviewUrl}" style="width: 100%; height: 100%; object-fit: cover; display: ${initialPreviewUrl ? 'block' : 'none'};" />
              <div id="swal-edit-preview-placeholder" style="display: ${initialPreviewUrl ? 'none' : 'flex'}; color: #94a3b8; align-items: center; justify-content: center; text-align: center; padding: 16px; flex-direction: column;">
                <span style="display: block; font-size: 14px; font-weight: 600;">Selecciona fotos para ver la primera como portada</span>
                <span style="display: block; margin-top: 6px; font-size: 12px; color: #64748b;">La primera imagen será la portada de la publicación.</span>
              </div>
            </div>
            
            <div style="display: flex; flex-direction: column; gap: 5px; margin-top: 4px;">
              <label style="font-weight: 700; font-size: 11px; color: #475569; text-transform: uppercase; letter-spacing: 0.04em; margin: 0;">Imágenes de la publicación <span style='color:#dc2626'>*</span></label>
              <button id="swal-edit-file-button" type="button" style="display: inline-flex; align-items: center; justify-content: center; padding: 8px 12px; border-radius: 10px; border: none; background-color: #0f766e; color: #fff; font-size: 12px; font-weight: 600; cursor: pointer; text-align: center; width: fit-content; max-width: 140px; white-space: nowrap; align-self: flex-start; line-height: 1.2;">
                Seleccionar fotos
              </button>
              <input id="swal-edit-foto" type="file" accept="image/*" multiple style="display:none;" />
              <div id="swal-edit-foto-name" style="font-size: 12px; color: #64748b; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 10px 12px;">
                Ningún archivo seleccionado
              </div>
            </div>
          </div>

          <div style="display: flex; flex-direction: column; gap: 14px;">
            
            <div style="display: flex; flex-direction: column; gap: 4px;">
              <label style="font-weight: 700; font-size: 11px; color: #475569; text-transform: uppercase; letter-spacing: 0.04em; margin: 0;">Título del inmueble <span style='color:#dc2626'>*</span></label>
              <input id="swal-edit-titulo" value="${pub.titulo}" placeholder="Ej: Departamento céntrico"
                style="padding: 11px 14px; border-radius: 12px; border: 1px solid #cbd5e1; font-size: 14px; background-color: #f8fafc; color: #0f172a; outline: none; box-sizing: border-box; width: 100%;">
            </div>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px;">
              <div style="display: flex; flex-direction: column; gap: 4px;">
                <label style="font-weight: 700; font-size: 11px; color: #475569; text-transform: uppercase; letter-spacing: 0.04em; margin: 0;">Precio mensual ($) <span style='color:#dc2626'>*</span></label>
                <input id="swal-edit-precio" type="number" value="${pub.precioMensual}" 
                  style="padding: 11px 14px; border-radius: 12px; border: 1px solid #cbd5e1; font-size: 14px; background-color: #f8fafc; color: #0f172a; outline: none; box-sizing: border-box; width: 100%;">
              </div>
              <div style="display: flex; flex-direction: column; gap: 4px;">
                <label style="font-weight: 700; font-size: 11px; color: #475569; text-transform: uppercase; letter-spacing: 0.04em; margin: 0;">Ubicación <span style='color:#dc2626'>*</span></label>
                <input id="swal-edit-ubicacion" value="${pub.ubicacion}" 
                  style="padding: 11px 14px; border-radius: 12px; border: 1px solid #cbd5e1; font-size: 14px; background-color: #f8fafc; color: #0f172a; outline: none; box-sizing: border-box; width: 100%;">
              </div>
            </div>

            <div style="display: flex; flex-direction: column; gap: 10px;">
              <label style="font-weight: 700; font-size: 11px; color: #475569; text-transform: uppercase; letter-spacing: 0.04em; margin: 0;">Servicios incluidos</label>
              <div style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; padding: 12px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px;">
                ${servicioOptions.map((servicio) => `
                  <label style="display: flex; align-items: center; gap: 10px; font-size: 13px; color: #334155; cursor: pointer;">
                    <input
                      type="checkbox"
                      name="swal-edit-servicio"
                      value="${servicio.id}"
                      ${Array.isArray(pub.serviciosIncluidos) && pub.serviciosIncluidos.includes(servicio.id) ? 'checked' : ''}
                      style="width: 16px; height: 16px; accent: ${accent};"
                    />
                    <span>${servicio.label}</span>
                  </label>
                `).join('')}
              </div>
            </div>

            <div style="display: flex; flex-direction: column; gap: 4px;">
              <label style="font-weight: 700; font-size: 11px; color: #475569; text-transform: uppercase; letter-spacing: 0.04em; margin: 0;">Reglas de convivencia</label>
              <textarea id="swal-edit-reglas" placeholder="Reglas del hogar o ambiente de estudio..." rows="3" 
                style="padding: 11px 14px; border-radius: 12px; border: 1px solid #cbd5e1; font-size: 14px; background-color: #f8fafc; color: #0f172a; outline: none; resize: none; font-family: inherit; box-sizing: border-box; width: 100%; min-height: 75px;">${pub.rules || pub.reglasConvivencia || ''}</textarea>
            </div>

            <div style="display: flex; justify-content: flex-end; gap: 12px; margin-top: 8px;">
              <button id="btn-swal-cancel" type="button" 
                style="padding: 11px 22px; border-radius: 12px; background-color: #f1f5f9; color: #64748b; font-weight: 600; font-size: 14px; border: none; cursor: pointer;">
                Cancelar
              </button>
              <button id="btn-swal-submit" type="button" 
                style="padding: 11px 22px; border-radius: 12px; background-color: ${accent}; color: #fff; font-weight: 700; font-size: 14px; border: none; cursor: pointer; box-shadow: 0 4px 12px rgba(15, 118, 110, 0.25);">
                Guardar cambios
              </button>
            </div>

          </div>
        </div>
      `,
      width: '880px', 
      focusConfirm: false,
      showConfirmButton: false, 
      showCancelButton: false,
      didOpen: () => {
        const editFileButton = document.getElementById('swal-edit-file-button');
        const editFileInput = document.getElementById('swal-edit-foto');
        const editFileName = document.getElementById('swal-edit-foto-name');
        const editPreview = document.getElementById('swal-edit-preview');
        const editPreviewPlaceholder = document.getElementById('swal-edit-preview-placeholder');

        const updateEditPreview = (file) => {
          if (!editPreview || !editPreviewPlaceholder) return;
          if (file) {
            const url = URL.createObjectURL(file);
            editPreview.src = url;
            editPreview.style.display = 'block';
            editPreviewPlaceholder.style.display = 'none';
          }
        };

        if (editFileButton && editFileInput) {
          editFileButton.addEventListener('click', () => editFileInput.click());
          editFileInput.addEventListener('change', () => {
            const files = editFileInput.files;
            
            if (editFileName) {
              editFileName.textContent = files && files.length > 0
                ? `${files.length} archivo${files.length > 1 ? 's' : ''} seleccionado${files.length > 1 ? 's' : ''}`
                : 'Ningún archivo seleccionado';
            }

            if (files && files.length > 0) {
              updateEditPreview(files[0]);
            }
          });
        }

        document.getElementById('btn-swal-cancel').addEventListener('click', () => Swal.close());
        document.getElementById('btn-swal-submit').addEventListener('click', async () => {
          const titulo = document.getElementById('swal-edit-titulo').value.trim();
          const precioMensual = document.getElementById('swal-edit-precio').value;
          const ubicacion = document.getElementById('swal-edit-ubicacion').value.trim();
          const fotoInput = document.getElementById('swal-edit-foto');
          
          const existingPhotos = pub.fotos && pub.fotos.length > 0;

          if (!titulo || !precioMensual || !ubicacion || (!(fotoInput.files && fotoInput.files.length > 0) && !existingPhotos)) {
            Swal.showValidationMessage('Por favor completa todos los campos obligatorios (*)');
            return;
          }

          const serviciosIncluidos = Array.from(document.querySelectorAll('input[name="swal-edit-servicio"]:checked')).map((checkbox) => checkbox.value);
          const formData = new FormData();
          formData.append('titulo', titulo);
          formData.append('precioMensual', parseInt(precioMensual));
          formData.append('ubicacion', ubicacion);
          serviciosIncluidos.forEach((servicio) => {
            formData.append('serviciosIncluidos', servicio);
          });
          
          formData.append('reglasConvivencia', document.getElementById('swal-edit-reglas').value);
          
          Array.from(fotoInput.files || []).forEach((file) => {
            formData.append('fotosPublicacion', file);
          });

          Swal.showLoading();
          const response = await editarPublicacion(pub.id, formData);
          console.log("RESPUESTA EDITAR:", response);
          
          if (response?.id) {
            Swal.close();
            Swal.fire({ icon: 'success', title: 'Publicación actualizada', confirmButtonColor: accent });
            fetchPublicaciones();
          } else {
            Swal.showValidationMessage(response?.message || 'Error interno al intentar actualizar la publicación.');
          }
        });
      },
    });
  };

  const handleCrear = async () => {
    const { value: formValues } = await Swal.fire({
      title: 'Nueva Publicación',
      html: `
        <div style="display: grid; grid-template-columns: 1fr 1.2fr; gap: 24px; text-align: left; padding: 10px 5px; font-family: 'Segoe UI', Roboto, sans-serif; max-width: 850px;">
          
          <!-- Columna Izquierda: Vista previa limpia -->
          <div style="display: flex; flex-direction: column; gap: 12px;">
            <p style="font-weight: 700; font-size: 11px; color: #475569; text-transform: uppercase; letter-spacing: 0.04em; margin: 0;">Vista previa de la propiedad</p>
            <div style="width: 100%; height: 265px; border-radius: 16px; overflow: hidden; background-color: #f1f5f9; border: 1px solid #e2e8f0; display: flex; align-items: center; justify-content: center; box-sizing: border-box;">
              <img id="swal-create-preview" src="" style="width: 100%; height: 100%; object-fit: cover; display: none;" onError="this.style.display='none'; document.getElementById('swal-create-preview-placeholder').style.display='flex';" />
              <div id="swal-create-preview-placeholder" style="color: #94a3b8; display: flex; align-items: center; justify-content: center; flex-direction: column; gap: 8px;">
                <span style="font-size: 13px; font-weight: 600;">Selecciona hasta 10 fotos y la primera se usará como portada.</span>
              </div>
            </div>
          </div>

          <!-- Columna Derecha: Inputs principales ajustados en altura -->
          <div style="display: flex; flex-direction: column; gap: 14px; justify-content: space-between;">
            <div style="display: flex; flex-direction: column; gap: 4px;">
              <label style="font-weight: 700; font-size: 11px; color: #475569; text-transform: uppercase; letter-spacing: 0.04em; margin: 0;">Título de la publicación <span style='color:#dc2626'>*</span></label>
              <input id="swal-titulo" placeholder="Ej: Pieza Universitaria frente a la U" 
                style="padding: 11px 14px; border-radius: 12px; border: 1px solid #cbd5e1; font-size: 14px; background-color: #f8fafc; color: #0f172a; outline: none; box-sizing: border-box; width: 100%;">
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px;">
              <div style="display: flex; flex-direction: column; gap: 4px;">
                <label style="font-weight: 700; font-size: 11px; color: #475569; text-transform: uppercase; letter-spacing: 0.04em; margin: 0;">Tipo de inmueble <span style='color:#dc2626'>*</span></label>
                <select id="swal-tipo" 
                  style="padding: 11px 14px; border-radius: 12px; border: 1px solid #cbd5e1; font-size: 14px; background-color: #f8fafc; color: #0f172a; outline: none; width: 100%; height: 41.5px;">
                  <option value="" disabled selected>Selecciona tipo</option>
                  <option value="pieza">Pieza</option>
                  <option value="departamento">Departamento</option>
                  <option value="casa">Casa</option>
                  <option value="estudio">Estudio</option>
                </select>
              </div>

              <div style="display: flex; flex-direction: column; gap: 4px;">
                <label style="font-weight: 700; font-size: 11px; color: #475569; text-transform: uppercase; letter-spacing: 0.04em; margin: 0;">Precio mensual ($) <span style='color:#dc2626'>*</span></label>
                <input id="swal-precio" type="number" placeholder="Ej: 180000" 
                  style="padding: 11px 14px; border-radius: 12px; border: 1px solid #cbd5e1; font-size: 14px; background-color: #f8fafc; color: #0f172a; outline: none; box-sizing: border-box; width: 100%;">
              </div>
            </div>

            <div style="display: flex; flex-direction: column; gap: 4px;">
              <label style="font-weight: 700; font-size: 11px; color: #475569; text-transform: uppercase; letter-spacing: 0.04em; margin: 0;">Ubicación <span style='color:#dc2626'>*</span></label>
              <input id="swal-ubicacion" placeholder="Dirección exacta del inmueble" 
                style="padding: 11px 14px; border-radius: 12px; border: 1px solid #cbd5e1; font-size: 14px; background-color: #f8fafc; color: #0f172a; outline: none; box-sizing: border-box; width: 100%;">
            </div>

            <div style="display: flex; flex-direction: column; gap: 10px;">
              <label style="font-weight: 700; font-size: 11px; color: #475569; text-transform: uppercase; letter-spacing: 0.04em; margin: 0;">Servicios incluidos</label>
              <div style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; padding: 12px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px;">
                ${servicioOptions.map((servicio) => `
                  <label style="display: flex; align-items: center; gap: 10px; font-size: 13px; color: #334155; cursor: pointer;">
                    <input
                      type="checkbox"
                      name="swal-servicio"
                      value="${servicio.id}"
                      style="width: 16px; height: 16px; accent: ${accent};"
                    />
                    <span>${servicio.label}</span>
                  </label>
                `).join('')}
              </div>
            </div>
          </div>

          <!-- Fila Inferior Completa: URL y Reglas para balancear el diseño -->
          <div style="grid-column: 1 / -1; display: grid; grid-template-columns: 1fr 1.2fr; gap: 24px; margin-top: 4px;">
            <div style="display: flex; flex-direction: column; gap: 4px;">
              <label style="font-weight: 700; font-size: 11px; color: #475569; text-transform: uppercase; letter-spacing: 0.04em; margin: 0;">Imágenes de la publicación <span style='color:#dc2626'>*</span></label>
              <button id="swal-create-file-button" type="button" style="display: inline-flex; align-items: center; justify-content: center; padding: 8px 12px; border-radius: 10px; border: none; background-color: #0f766e; color: #fff; font-size: 12px; font-weight: 600; cursor: pointer; text-align: center; width: fit-content; max-width: 140px; white-space: nowrap; align-self: flex-start; line-height: 1.2;">
                Seleccionar fotos
              </button>
              <input id="swal-foto" type="file" accept="image/*" multiple style="display:none;" />
              <div id="swal-create-file-name" style="font-size: 12px; color: #64748b; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 10px 12px;">
                Ningún archivo seleccionado
              </div>
            </div>
            <div style="display: flex; flex-direction: column; gap: 4px;">
              <label style="font-weight: 700; font-size: 11px; color: #475569; text-transform: uppercase; letter-spacing: 0.04em; margin: 0;">Reglas de convivencia</label>
              <textarea id="swal-reglas" placeholder="Reglas del hogar o ambiente de estudio..." rows="2" 
                style="padding: 11px 14px; border-radius: 12px; border: 1px solid #cbd5e1; font-size: 14px; background-color: #f8fafc; color: #0f172a; outline: none; resize: none; font-family: inherit; box-sizing: border-box; width: 100%; min-height: 41.5px;"></textarea>
            </div>
          </div>

          <!-- Botonera Premium final -->
          <div style="grid-column: 1 / -1; display: flex; justify-content: flex-end; gap: 12px; margin-top: 8px;">
            <button id="btn-create-cancel" type="button" 
              style="padding: 11px 22px; border-radius: 12px; background-color: #f1f5f9; color: #64748b; font-weight: 600; font-size: 14px; border: none; cursor: pointer;">
              Cancelar
            </button>
            <button id="btn-create-submit" type="button" 
              style="padding: 11px 22px; border-radius: 12px; background-color: ${accent}; color: #fff; font-weight: 700; font-size: 14px; border: none; cursor: pointer; box-shadow: 0 4px 12px rgba(15, 118, 110, 0.25);">
              Publicar Inmueble
            </button>
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
        const createFileName = document.getElementById('swal-create-file-name');

        const createPreview = document.getElementById('swal-create-preview');
        const createPreviewPlaceholder = document.getElementById('swal-create-preview-placeholder');

        const updateCreatePreview = (file) => {
          if (!createPreview || !createPreviewPlaceholder) return;
          if (file) {
            const url = URL.createObjectURL(file);
            createPreview.src = url;
            createPreview.style.display = 'block';
            createPreviewPlaceholder.style.display = 'none';
          }
        };

        if (createFileButton && createFileInput) {
          createFileButton.addEventListener('click', () => createFileInput.click());
          createFileInput.addEventListener('change', () => {
            const files = createFileInput.files;
            createFileName.textContent = files && files.length > 0
              ? `${files.length} archivo${files.length > 1 ? 's' : ''} seleccionado${files.length > 1 ? 's' : ''}`
              : 'Ningún archivo seleccionado';
            if (files && files.length > 0) {
              updateCreatePreview(files[0]);
            }
          });
        }

        document.getElementById('btn-create-cancel').addEventListener('click', () => Swal.close());
        document.getElementById('btn-create-submit').addEventListener('click', () => {
          const titulo = document.getElementById('swal-titulo').value;
          const tipoInmueble = document.getElementById('swal-tipo').value;
          const precioMensual = document.getElementById('swal-precio').value;
          const ubicacion = document.getElementById('swal-ubicacion').value;
          const fotoInput = document.getElementById('swal-foto');

          if (!titulo || !tipoInmueble || !precioMensual || !ubicacion || !fotoInput.files || fotoInput.files.length === 0) {
            Swal.showValidationMessage('Por favor completa todos los campos obligatorios (*)');
            return;
          }

          Swal.clickConfirm();
        });
      },
      preConfirm: () => {
        const serviciosIncluidos = Array.from(document.querySelectorAll('input[name="swal-servicio"]:checked')).map((checkbox) => checkbox.value);

        const formData = new FormData();
        formData.append('titulo', document.getElementById('swal-titulo').value);
        formData.append('tipoInmueble', document.getElementById('swal-tipo').value);
        formData.append('precioMensual', document.getElementById('swal-precio').value);
        formData.append('ubicacion', document.getElementById('swal-ubicacion').value);
        serviciosIncluidos.forEach((servicio) => {
          formData.append('serviciosIncluidos', servicio);
        });
        formData.append('reglasConvivencia', document.getElementById('swal-reglas').value);
        Array.from(document.getElementById('swal-foto').files || []).forEach((file) => {
          formData.append('fotosPublicacion', file);
        });

        return formData;
      }
    });

    if (formValues) {
      const response = await crearPublicacion(formValues);
      if (response?.id) {
        Swal.fire({ icon: 'success', title: '¡Publicación creada!', confirmButtonColor: accent });
        fetchPublicaciones();
      } else {
        Swal.fire({ icon: 'error', title: 'Error', text: response?.message || 'No se pudo crear la publicación', confirmButtonColor: accent });
      }
    }
  };

  const abrirGaleria = (pub) => {
    if (!pub.fotos || pub.fotos.length === 0) return;
    Swal.fire({
      title: pub.titulo,
      html: `
        <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap:10px;">
          ${pub.fotos.map((foto) => `
            <img src="http://localhost:3000${foto}" style="width:100%; height:140px; object-fit:cover; border-radius:10px;" />
          `).join('')}
        </div>
      `,
      width: '700px',
      confirmButtonColor: accent,
      confirmButtonText: 'Cerrar',
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
    if (!pub?.id) return;
    navigate(`/publicacion/${pub.id}`);
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
        <button onClick={handleCrear} style={styles.button}>
          <span>Publicar Inmueble</span>
        </button>
      </section>

      <section style={styles.card}>
        <header style={styles.cardHeader}>
          <p style={{ ...styles.eyebrow, color: accent }}>Listado</p>
          <h2 style={styles.cardTitle}>Tus propiedades publicadas</h2>
          <p style={styles.cardSubtitle}>Aquí aparecen todas las publicaciones que has creado.</p>
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
                      src={`http://localhost:3000${pub.fotos[0]}`} 
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
                  </div>
                
                  <span style={{
                    ...styles.stateBadge,
                    backgroundColor: pub.estado === 'activa' ? '#dcfce7' : '#fee2e2',
                    color: pub.estado === 'activa' ? '#15803d' : '#dc2626',
                  }}>
                    {pub.estado}
                  </span>
                  <button onClick={() => abrirEstadisticas(pub)} style={styles.btnStats}>
                    <BarChart3 size={14} strokeWidth={2.2} />
                    Estadísticas
                  </button>
                </div>
                {pub.fotos && pub.fotos.length > 1 && (
                  <button onClick={() => abrirGaleria(pub)} style={{...styles.btnStats, right: '80px', position: 'absolute', top: '8px'}}>
                    Ver fotos ({pub.fotos.length})
                  </button>
                )}
                
                {/* Bloque de Textos */}
                <div style={styles.infoContainer}>
                  <span style={styles.typeBadge}>{pub.tipoInmueble}</span>
                  <h4 style={styles.pubTitulo}>{pub.titulo}</h4>
                  
                  <p style={styles.pubPrecio}>
                    <strong>${pub.precioMensual.toLocaleString('es-CL')}</strong> 
                    <span style={{ fontSize: '12px', fontWeight: 'normal', color: '#64748b', marginLeft: '4px' }}>/ mes</span>
                  </p>
                  
                  <p style={styles.pubUbicacion}>{pub.ubicacion}</p>
                </div>
                
                {/* Botones de acción abajo */}
                <div style={styles.rightSection}>
                  <button onClick={() => handleEditar(pub)} style={styles.btnEditar}>
                    <Pencil size={13} />
                    Editar
                  </button>
                  <button onClick={() => handleEliminar(pub.id)} style={styles.btnEliminar}>
                    <Trash2 size={13} />
                    Eliminar
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
    borderRadius: '24px', padding: '28px 36px',
    background: 'linear-gradient(135deg, #0f766e 0%, #115e59 100%)',
    color: '#fff', boxShadow: '0 20px 25px -5px rgba(15, 118, 110, 0.15)',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px'
  },
  heroContent: { display: 'flex', alignItems: 'center', gap: '16px' },
  heroIcon: {
    width: '52px', height: '52px', borderRadius: '16px',
    backgroundColor: 'rgba(255,255,255,0.18)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  heroTitle: { margin: '0 0 4px', fontSize: '28px', fontWeight: '800', letterSpacing: '-0.02em' },
  heroSubtitle: { margin: 0, fontSize: '14px', color: '#ccfbf1' },
  button: {
    display: 'flex', alignItems: 'center', gap: '8px',
    padding: '12px 24px', borderRadius: '14px', backgroundColor: '#ffffff',
    color: '#0f766e', fontWeight: '700', fontSize: '14px', border: 'none', cursor: 'pointer',
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', transition: 'all 0.2s',
  },
  card: {
    borderRadius: '24px', padding: '32px', backgroundColor: '#ffffff',
    border: '1px solid #f1f5f9', boxShadow: '0 4px 20px rgba(15, 23, 42, 0.03)',
  },
  cardHeader: { marginBottom: '28px' },
  eyebrow: { margin: '0 0 6px', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em' },
  cardTitle: { margin: '0 0 6px', fontSize: '24px', fontWeight: '800', color: '#0f172a', letterSpacing: '-0.02em' },
  cardSubtitle: { margin: 0, fontSize: '14px', color: '#64748b' },
  
  // ¡AQUÍ ESTÁ LA MAGIA! Transformamos la lista plana en un Grid de tarjetas tipo catálogo
  
  // Contenedor superior con fondo y badge flotante
  
  // Datos internos de la tarjeta
  
  // Sección de botones abajo pegados al borde de la tarjeta
  // Agrega o reemplaza estos campos exactos dentro de tu constante "styles"
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
    alignItems: 'center',
    justifyContent: 'center',
    color: '#94a3b8',
  },
  stateBadge: {
    position: 'absolute',
    top: '12px',
    right: '12px',
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
  rightSection: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    borderTop: '1px solid #f1f5f9',
    backgroundColor: '#f8fafc',
  },
  btnEditar: {
    border: 'none',
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
  btnEliminar: {
    border: 'none',
    background: 'none',
    padding: '14px',
    cursor: 'pointer',
    color: '#dc2626',
    fontSize: '13px',
    fontWeight: '700',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
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