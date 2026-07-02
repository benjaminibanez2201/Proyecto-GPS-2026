import { useEffect, useState } from 'react';
import { getMisPublicaciones, eliminarPublicacion, editarPublicacion, crearPublicacion } from '@services/user.service.js';
import { Building2, BarChart3, Pencil, Trash2, Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import EstadisticasPublicacionModal from '@components/EstadisticasPublicacionModal.jsx';

const accent = '#0f766e';

const SERVICIOS_VALIDOS = [
  { id: 'agua', label: 'Agua' },
  { id: 'luz', label: 'Luz' },
  { id: 'gas', label: 'Gas' },
  { id: 'internet', label: 'Internet' },
  { id: 'tv_cable', label: 'TV Cable' },
  { id: 'calefaccion', label: 'Calefacción' },
  { id: 'estacionamiento', label: 'Estacionamiento' },
  { id: 'lavadora', label: 'Lavadora' },
];

function renderServiciosCheckboxes(serviciosSeleccionados = []) {
  const normalizados = serviciosSeleccionados.map((s) => String(s).trim().toLowerCase());

  return SERVICIOS_VALIDOS.map((servicio) => `
    <label style="display: flex; align-items: center; gap: 6px; font-size: 13px; color: #334155; cursor: pointer;">
      <input
        type="checkbox"
        id="swal-servicio-${servicio.id}"
        ${normalizados.includes(servicio.id) ? 'checked' : ''}
        style="accent-color: ${accent}; width: 15px; height: 15px; cursor: pointer;"
      >
      ${servicio.label}
    </label>
  `).join('');
}

function leerServiciosSeleccionados() {
  return SERVICIOS_VALIDOS
    .filter((servicio) => document.getElementById(`swal-servicio-${servicio.id}`)?.checked)
    .map((servicio) => servicio.id);
}

const MisPublicaciones = () => {
  const [publicaciones, setPublicaciones] = useState([]);
  const [publicacionSeleccionada, setPublicacionSeleccionada] = useState(null);
  const [mostrarEstadisticas, setMostrarEstadisticas] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchPublicaciones();
  }, []);

  const fetchPublicaciones = async () => {
    const data = await getMisPublicaciones();
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
      if (response) {
        Swal.fire({ icon: 'success', title: 'Publicación eliminada', confirmButtonColor: accent });
        fetchPublicaciones();
      }
    }
  };

  const handleEditar = async (pub) => {
    const serviciosActuales = Array.isArray(pub.serviciosIncluidos) ? pub.serviciosIncluidos : [];

    const { value: formValues } = await Swal.fire({
      title: 'Editar Publicación',
      html: `
        <div style="display: grid; grid-template-columns: 1fr 1.3fr; gap: 28px; text-align: left; padding: 10px 5px; font-family: 'Segoe UI', Roboto, sans-serif; max-width: 850px;">
          
          <div style="display: flex; flex-direction: column; gap: 12px;">
            <p style="font-weight: 700; font-size: 11px; color: #475569; text-transform: uppercase; letter-spacing: 0.04em; margin: 0;">Vista previa de la imagen</p>
            <div style="width: 100%; height: 230px; border-radius: 16px; overflow: hidden; background-color: #f1f5f9; border: 1px solid #e2e8f0; display: flex; align-items: center; justify-content: center;">
              ${pub.fotos && pub.fotos[0] && pub.fotos[0].startsWith('http') 
                ? `<img id="swal-edit-preview" src="${pub.fotos[0]}" style="width: 100%; height: 100%; object-fit: cover;" onError="this.style.display='none'; this.nextSibling.style.display='flex';" />`
                : ''
              }
              <div style="display: ${pub.fotos && pub.fotos[0] && pub.fotos[0].startsWith('http') ? 'none' : 'flex'}; color: #94a3b8; align-items: center; justify-content: center;">
                🏠 No hay imagen válida
              </div>
            </div>
            
            <div style="display: flex; flex-direction: column; gap: 5px; margin-top: 4px;">
              <label style="font-weight: 700; font-size: 11px; color: #475569; text-transform: uppercase; letter-spacing: 0.04em; margin: 0;">URL de la foto principal *</label>
              <input id="swal-edit-foto" value="${pub.fotos && pub.fotos[0] ? pub.fotos[0] : ''}" placeholder="Pega el enlace aquí" 
                style="padding: 12px 14px; border-radius: 12px; border: 1px solid #cbd5e1; font-size: 13px; background-color: #f8fafc; color: #0f172a; outline: none; box-sizing: border-box; width: 100%;"
                onInput="const img = document.getElementById('swal-edit-preview'); if(img) { img.src = this.value; img.style.display='block'; }"
              >
            </div>
          </div>

          <div style="display: flex; flex-direction: column; gap: 14px;">
            
            <div style="display: flex; flex-direction: column; gap: 4px;">
              <label style="font-weight: 700; font-size: 11px; color: #475569; text-transform: uppercase; letter-spacing: 0.04em; margin: 0;">Título del inmueble *</label>
              <input id="swal-edit-titulo" value="${pub.titulo}" placeholder="Ej: Departamento céntrico"
                style="padding: 11px 14px; border-radius: 12px; border: 1px solid #cbd5e1; font-size: 14px; background-color: #f8fafc; color: #0f172a; outline: none; box-sizing: border-box; width: 100%;">
            </div>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px;">
              <div style="display: flex; flex-direction: column; gap: 4px;">
                <label style="font-weight: 700; font-size: 11px; color: #475569; text-transform: uppercase; letter-spacing: 0.04em; margin: 0;">Precio mensual ($) *</label>
                <input id="swal-edit-precio" type="number" value="${pub.precioMensual}" 
                  style="padding: 11px 14px; border-radius: 12px; border: 1px solid #cbd5e1; font-size: 14px; background-color: #f8fafc; color: #0f172a; outline: none; box-sizing: border-box; width: 100%;">
              </div>
              <div style="display: flex; flex-direction: column; gap: 4px;">
                <label style="font-weight: 700; font-size: 11px; color: #475569; text-transform: uppercase; letter-spacing: 0.04em; margin: 0;">Ubicación *</label>
                <input id="swal-edit-ubicacion" value="${pub.ubicacion}" 
                  style="padding: 11px 14px; border-radius: 12px; border: 1px solid #cbd5e1; font-size: 14px; background-color: #f8fafc; color: #0f172a; outline: none; box-sizing: border-box; width: 100%;">
              </div>
            </div>

            <div style="display: flex; flex-direction: column; gap: 4px;">
              <label style="font-weight: 700; font-size: 11px; color: #475569; text-transform: uppercase; letter-spacing: 0.04em; margin: 0;">Servicios incluidos</label>
              <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; padding: 10px 12px; border-radius: 12px; border: 1px solid #cbd5e1; background-color: #f8fafc;">
                ${renderServiciosCheckboxes(serviciosActuales)}
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
        document.getElementById('btn-swal-cancel').addEventListener('click', () => Swal.close());
        document.getElementById('btn-swal-submit').addEventListener('click', () => {
          const titulo = document.getElementById('swal-edit-titulo').value;
          const precioMensual = document.getElementById('swal-edit-precio').value;
          const ubicacion = document.getElementById('swal-edit-ubicacion').value;
          const foto = document.getElementById('swal-edit-foto').value;

          if (!titulo || !precioMensual || !ubicacion || !foto) {
            Swal.showValidationMessage('Por favor completa todos los campos obligatorios (*)');
            return;
          }

          Swal.clickConfirm();
        });
      },
      preConfirm: () => {
        return {
          titulo: document.getElementById('swal-edit-titulo').value,
          precioMensual: parseInt(document.getElementById('swal-edit-precio').value),
          ubicacion: document.getElementById('swal-edit-ubicacion').value,
          fotos: [document.getElementById('swal-edit-foto').value],
          serviciosIncluidos: leerServiciosSeleccionados(),
          reglasConvivencia: document.getElementById('swal-edit-reglas').value
        };
      },
    });

    if (formValues) {
      const [publicacionActualizada, errorEdicion] = await editarPublicacion(pub.id, formValues);
      if (errorEdicion) {
        Swal.fire({ icon: 'error', title: 'No se pudo editar', text: errorEdicion, confirmButtonColor: accent });
        return;
      }
      Swal.fire({ icon: 'success', title: 'Publicación actualizada', confirmButtonColor: accent });
      fetchPublicaciones();
}
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
              <img id="swal-create-preview" src="" style="width: 100%; height: 100%; object-fit: cover; display: none;" onError="this.style.display='none'; this.nextSibling.style.display='flex';" />
              <div style="color: #94a3b8; display: flex; align-items: center; justify-content: center; flex-direction: column; gap: 8px;">
                <span style="font-size: 13px; font-weight: 600;">Pega una URL abajo para previsualizar</span>
              </div>
            </div>
          </div>

          <!-- Columna Derecha: Inputs principales ajustados en altura -->
          <div style="display: flex; flex-direction: column; gap: 14px; justify-content: space-between;">
            <div style="display: flex; flex-direction: column; gap: 4px;">
              <label style="font-weight: 700; font-size: 11px; color: #475569; text-transform: uppercase; letter-spacing: 0.04em; margin: 0;">Título de la publicación *</label>
              <input id="swal-titulo" placeholder="Ej: Pieza Universitaria frente a la U" 
                style="padding: 11px 14px; border-radius: 12px; border: 1px solid #cbd5e1; font-size: 14px; background-color: #f8fafc; color: #0f172a; outline: none; box-sizing: border-box; width: 100%;">
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px;">
              <div style="display: flex; flex-direction: column; gap: 4px;">
                <label style="font-weight: 700; font-size: 11px; color: #475569; text-transform: uppercase; letter-spacing: 0.04em; margin: 0;">Tipo de inmueble *</label>
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
                <label style="font-weight: 700; font-size: 11px; color: #475569; text-transform: uppercase; letter-spacing: 0.04em; margin: 0;">Precio mensual ($) *</label>
                <input id="swal-precio" type="number" placeholder="Ej: 180000" 
                  style="padding: 11px 14px; border-radius: 12px; border: 1px solid #cbd5e1; font-size: 14px; background-color: #f8fafc; color: #0f172a; outline: none; box-sizing: border-box; width: 100%;">
              </div>
            </div>

            <div style="display: flex; flex-direction: column; gap: 4px;">
              <label style="font-weight: 700; font-size: 11px; color: #475569; text-transform: uppercase; letter-spacing: 0.04em; margin: 0;">Ubicación *</label>
              <input id="swal-ubicacion" placeholder="Dirección exacta del inmueble" 
                style="padding: 11px 14px; border-radius: 12px; border: 1px solid #cbd5e1; font-size: 14px; background-color: #f8fafc; color: #0f172a; outline: none; box-sizing: border-box; width: 100%;">
            </div>

            <div style="display: flex; flex-direction: column; gap: 4px;">
              <label style="font-weight: 700; font-size: 11px; color: #475569; text-transform: uppercase; letter-spacing: 0.04em; margin: 0;">Servicios incluidos</label>
              <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; padding: 10px 12px; border-radius: 12px; border: 1px solid #cbd5e1; background-color: #f8fafc;">
                ${renderServiciosCheckboxes()}
              </div>
            </div>
          </div>

          <!-- Fila Inferior Completa: URL y Reglas para balancear el diseño -->
          <div style="grid-column: 1 / -1; display: grid; grid-template-columns: 1fr 1.2fr; gap: 24px; margin-top: 4px;">
            <div style="display: flex; flex-direction: column; gap: 4px;">
              <label style="font-weight: 700; font-size: 11px; color: #475569; text-transform: uppercase; letter-spacing: 0.04em; margin: 0;">URL de la foto principal *</label>
              <input id="swal-foto" placeholder="https://ejemplo.com/imagen.jpg" 
                style="padding: 12px 14px; border-radius: 12px; border: 1px solid #cbd5e1; font-size: 13px; background-color: #f8fafc; color: #0f172a; outline: none; box-sizing: border-box; width: 100%;"
                onInput="const img = document.getElementById('swal-create-preview'); const placeholder = img.nextSibling; if(this.value.trim() !== '') { img.src = this.value; img.style.display='block'; placeholder.style.display='none'; } else { img.style.display='none'; placeholder.style.display='flex'; }"
              >
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
        document.getElementById('btn-create-cancel').addEventListener('click', () => Swal.close());
        document.getElementById('btn-create-submit').addEventListener('click', () => {
          const titulo = document.getElementById('swal-titulo').value;
          const tipoInmueble = document.getElementById('swal-tipo').value;
          const precioMensual = document.getElementById('swal-precio').value;
          const ubicacion = document.getElementById('swal-ubicacion').value;
          const fotos = document.getElementById('swal-foto').value;

          if (!titulo || !tipoInmueble || !precioMensual || !ubicacion || !fotos) {
            Swal.showValidationMessage('Por favor completa todos los campos obligatorios (*)');
            return;
          }

          Swal.clickConfirm();
        });
      },
      preConfirm: () => {
        return { 
          titulo: document.getElementById('swal-titulo').value, 
          tipoInmueble: document.getElementById('swal-tipo').value, 
          precioMensual: parseInt(document.getElementById('swal-precio').value), 
          ubicacion: document.getElementById('swal-ubicacion').value, 
          fotos: [document.getElementById('swal-foto').value], 
          serviciosIncluidos: leerServiciosSeleccionados(), 
          reglasConvivencia: document.getElementById('swal-reglas').value 
        };
      }
    });

    if (formValues) {
      const [publicacionCreada, errorCreacion] = await crearPublicacion(formValues);
      if (errorCreacion) {
        Swal.fire({ icon: 'error', title: 'No se pudo crear', text: errorCreacion, confirmButtonColor: accent });
        return;
      }
      Swal.fire({ icon: 'success', title: '¡Publicación creada!', confirmButtonColor: accent });
      fetchPublicaciones();
    }
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
                  {pub.fotos && pub.fotos[0] && pub.fotos[0].startsWith('http') ? (
                    <img 
                      src={pub.fotos[0]} 
                      alt={pub.titulo} 
                      style={styles.pubImage} 
                      onError={(e) => { 
                        e.target.style.display = 'none'; 
                        e.target.nextSibling.style.display = 'flex'; 
                      }}
                    />
                  ) : null}
                  
                  <div style={{
                    ...styles.imagePlaceholder, 
                    display: pub.fotos && pub.fotos[0] && pub.fotos[0].startsWith('http') ? 'none' : 'flex'
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