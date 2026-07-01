import { useEffect, useState } from 'react';
import { getMisPublicaciones, eliminarPublicacion, editarPublicacion, crearPublicacion } from '@services/user.service.js';
import { Building2, BarChart3 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import EstadisticasPublicacionModal from '@components/EstadisticasPublicacionModal.jsx';

const accent = '#0f766e';

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
    const { value: formValues } = await Swal.fire({
      title: 'Editar publicación',
      html: `
        <input id="titulo" class="swal2-input" placeholder="Título" value="${pub.titulo}">
        <input id="precioMensual" class="swal2-input" placeholder="Precio mensual" value="${pub.precioMensual}" type="number">
        <input id="ubicacion" class="swal2-input" placeholder="Ubicación" value="${pub.ubicacion}">
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonColor: accent,
      cancelButtonText: 'Cancelar',
      confirmButtonText: 'Guardar',
      preConfirm: () => ({
        titulo: document.getElementById('titulo').value,
        precioMensual: parseInt(document.getElementById('precioMensual').value),
        ubicacion: document.getElementById('ubicacion').value,
      }),
    });

    if (formValues) {
      const response = await editarPublicacion(pub.id, formValues);
      if (response) {
        Swal.fire({ icon: 'success', title: 'Publicación actualizada', confirmButtonColor: accent });
        fetchPublicaciones();
      }
    }
  };

  const handleCrear = async () => {
    const { value: formValues } = await Swal.fire({
  title: 'Nueva publicación',
  html: `
    <div style="display: flex; flex-direction: column; gap: 14px; text-align: left; padding: 10px 20px; font-family: Arial, sans-serif;">
      
      <div style="display: flex; flex-direction: column; gap: 4px;">
        <label style="font-weight: 600; font-size: 13px; color: #374151;">Título de la publicación *</label>
        <input id="swal-titulo" placeholder="Ej: Pieza Universitaria" 
          style="padding: 10px 14px; border-radius: 10px; border: 1px solid #e2e8f0; font-size: 14px; background-color: #f8fafc; color: #0f172a; outline: none;">
      </div>

      <div style="display: flex; flex-direction: column; gap: 4px;">
        <label style="font-weight: 600; font-size: 13px; color: #374151;">Tipo de inmueble *</label>
        <select id="swal-tipo" 
          style="padding: 10px 14px; border-radius: 10px; border: 1px solid #e2e8f0; font-size: 14px; background-color: #f8fafc; color: #0f172a; outline: none; width: 100%;">
          <option value="" disabled selected>Selecciona tipo de inmueble</option>
          <option value="pieza">Pieza</option>
          <option value="departamento">Departamento</option>
          <option value="casa">Casa</option>
          <option value="estudio">Estudio</option>
        </select>
      </div>

      <div style="display: flex; flex-direction: column; gap: 4px;">
        <label style="font-weight: 600; font-size: 13px; color: #374151;">Precio mensual ($) *</label>
        <input id="swal-precio" type="number" placeholder="Ej: 180000" 
          style="padding: 10px 14px; border-radius: 10px; border: 1px solid #e2e8f0; font-size: 14px; background-color: #f8fafc; color: #0f172a; outline: none;">
      </div>

      <div style="display: flex; flex-direction: column; gap: 4px;">
        <label style="font-weight: 600; font-size: 13px; color: #374151;">Ubicación *</label>
        <input id="swal-ubicacion" placeholder="Dirección exacta del inmueble" 
          style="padding: 10px 14px; border-radius: 10px; border: 1px solid #e2e8f0; font-size: 14px; background-color: #f8fafc; color: #0f172a; outline: none;">
      </div>

      <div style="display: flex; flex-direction: column; gap: 4px;">
        <label style="font-weight: 600; font-size: 13px; color: #374151;">URL de foto principal *</label>
        <input id="swal-foto" placeholder="https://ejemplo.com/imagen.jpg" 
          style="padding: 10px 14px; border-radius: 10px; border: 1px solid #e2e8f0; font-size: 14px; background-color: #f8fafc; color: #0f172a; outline: none;">
      </div>

      <div style="display: flex; flex-direction: column; gap: 4px;">
        <label style="font-weight: 600; font-size: 13px; color: #374151;">Servicios incluidos (separados por coma)</label>
        <input id="swal-servicios" placeholder="Wifi, Luz, Agua, Lavandería" 
          style="padding: 10px 14px; border-radius: 10px; border: 1px solid #e2e8f0; font-size: 14px; background-color: #f8fafc; color: #0f172a; outline: none;">
      </div>

      <div style="display: flex; flex-direction: column; gap: 4px;">
        <label style="font-weight: 600; font-size: 13px; color: #374151;">Reglas de convivencia</label>
        <textarea id="swal-reglas" placeholder="Reglas del hogar o ambiente de estudio..." rows="3" 
          style="padding: 10px 14px; border-radius: 10px; border: 1px solid #e2e8f0; font-size: 14px; background-color: #f8fafc; color: #0f172a; outline: none; resize: vertical; font-family: Arial, sans-serif;"></textarea>
      </div>

    </div>
  `,
  focusConfirm: false,
  showCancelButton: true,
  confirmButtonColor: accent,
  cancelButtonColor: '#64748b',
  confirmButtonText: 'Publicar Inmueble',
  cancelButtonText: 'Cancelar',
  customClass: {
    popup: 'my-swal-popup-radius' 
  },
  preConfirm: () => {
    const titulo = document.getElementById('swal-titulo').value;
    const tipoInmueble = document.getElementById('swal-tipo').value;
    const precioMensual = document.getElementById('swal-precio').value;
    const ubicacion = document.getElementById('swal-ubicacion').value;
    const fotos = document.getElementById('swal-foto').value;
    const serviciosRaw = document.getElementById('swal-servicios').value;
    const reglasConvivencia = document.getElementById('swal-reglas').value;

    if (!titulo || !tipoInmueble || !precioMensual || !ubicacion || !fotos) {
      Swal.showValidationMessage('Por favor completa todos los campos obligatorios (*)');
      return false;
    }

    const serviciosIncluidos = serviciosRaw ? serviciosRaw.split(',').map(s => s.trim()) : [];

    return { 
      titulo, 
      tipoInmueble, 
      precioMensual: parseInt(precioMensual), 
      ubicacion, 
      fotos: [fotos], 
      serviciosIncluidos, 
      reglasConvivencia 
    };
  }
})

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
        ➕ Publicar Inmueble
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {publicaciones.map((pub) => (
              <div key={pub.id} style={styles.pubItem}>
                <div>
                  <h4 style={styles.pubTitulo}>{pub.titulo}</h4>
                  <p style={styles.pubDetalle}>
                    {pub.tipoInmueble} — ${pub.precioMensual.toLocaleString('es-CL')} / mes — {pub.ubicacion}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <span style={{
                    fontSize: '11px', fontWeight: '700', padding: '4px 8px', borderRadius: '999px',
                    backgroundColor: pub.estado === 'activa' ? '#e2f9df' : '#fee2e2',
                    color: pub.estado === 'activa' ? '#15803d' : '#dc2626'
                  }}>
                    {pub.estado.toUpperCase()}
                  </span>
                  <button onClick={() => abrirEstadisticas(pub)} style={styles.btnStats}>
                    <BarChart3 size={14} strokeWidth={2.2} />
                    Estadísticas
                  </button>
                  <button onClick={() => handleEditar(pub)} style={styles.btnEditar}>Editar</button>
                  <button onClick={() => handleEliminar(pub.id)} style={styles.btnEliminar}>Eliminar</button>
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
  page: { display: 'flex', flexDirection: 'column', gap: '20px', padding: '4px 0 12px' },
  hero: {
    borderRadius: '24px', padding: '24px 28px',
    background: 'linear-gradient(135deg, #008080 0%, #0b6b7a 45%, #163d4f 100%)',
    color: '#fff', boxShadow: '0 20px 40px rgba(11, 34, 45, 0.18)',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  },
  heroContent: { display: 'flex', alignItems: 'center', gap: '16px' },
  heroIcon: {
    width: '52px', height: '52px', borderRadius: '16px',
    backgroundColor: 'rgba(255,255,255,0.15)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  heroTitle: { margin: '0 0 6px', fontSize: '28px', lineHeight: 1.1 },
  heroSubtitle: { margin: 0, fontSize: '14px', color: 'rgba(255,255,255,0.85)' },
  button: {
    display: 'flex', alignItems: 'center', gap: '8px',
    padding: '12px 24px', borderRadius: '12px', backgroundColor: 'rgba(255,255,255,0.15)',
    color: '#fff', fontWeight: '700', fontSize: '14px', border: '1px solid rgba(255,255,255,0.3)', cursor: 'pointer',
  },
  card: {
    borderRadius: '22px', padding: '28px', backgroundColor: '#ffffff',
    border: '1px solid rgba(15, 23, 42, 0.06)', boxShadow: '0 12px 30px rgba(15, 23, 42, 0.07)',
  },
  cardHeader: { marginBottom: '20px' },
  eyebrow: { margin: '0 0 6px', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em' },
  cardTitle: { margin: '0 0 6px', fontSize: '20px', color: '#0f172a' },
  cardSubtitle: { margin: 0, fontSize: '14px', color: '#64748b' },
  pubItem: {
    padding: '16px', borderRadius: '16px', backgroundColor: '#f8fafc',
    border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  },
  pubTitulo: { margin: '0 0 4px', fontSize: '15px', fontWeight: '700', color: '#0f172a' },
  pubDetalle: { margin: 0, fontSize: '13px', color: '#64748b', textTransform: 'capitalize' },
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
  btnEditar: { border: 'none', background: 'none', cursor: 'pointer', color: accent, fontSize: '14px', fontWeight: '600' },
  btnEliminar: { border: 'none', background: 'none', cursor: 'pointer', color: '#dc2626', fontSize: '14px', fontWeight: '600' },
};

export default MisPublicaciones;
