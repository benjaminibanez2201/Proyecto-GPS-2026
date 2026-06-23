import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { 
  updateProfile, 
  getProfile, 
  getMisPublicaciones, 
  updateArrendadorProfile, 
  verifyPassword,
} from '@services/user.service.js';
import { useAuth } from '@context/AuthContext';
import { UserCircle2, Save, Pencil, X, Home, Mail, Lock, Phone, GraduationCap, BookOpen, Image } from 'lucide-react'; 
import Swal from 'sweetalert2';

const accent = '#0f766e';

const Profile = () => {
  const { user } = useAuth();
  const navigate = useNavigate(); 
  const [profileData, setProfileData] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const { register, handleSubmit, setValue } = useForm();
  const [cantidadPublicaciones, setCantidadPublicaciones] = useState(0); 

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    const data = await getProfile();
    if (data) {
      setProfileData(data);
      setValue('nombreCompleto', data.nombreCompleto || '');
      setValue('universidad', data.universidad || '');
      setValue('carrera', data.carrera || '');
      setValue('telefono', data.telefono || '');
      setValue('fotoPerfil', data.fotoPerfil || '');
      setValue('email', data.email || '');
      setValue('newPassword', '');

      if (data.rol === 'arrendador') {
        const pubs = await getMisPublicaciones();
        if (Array.isArray(pubs)) {
          setCantidadPublicaciones(pubs.length);
        }
      }
    }
  };

  const onSubmit = async (data) => {
    const camposEstudiante = ['nombreCompleto', 'fotoPerfil', 'universidad', 'carrera', 'newPassword', 'email'];
    const camposArrendador = ['nombreCompleto', 'fotoPerfil', 'telefono', 'email', 'newPassword'];
    
    const camposPermitidos = profileData?.rol === 'estudiante' ? camposEstudiante : camposArrendador;
    
    const filteredData = Object.fromEntries(
      Object.entries(data)
        .filter(([key, v]) => v !== '' && camposPermitidos.includes(key))
    );

    const cambiaEmail = filteredData.email && filteredData.email !== profileData?.email;
    const cambiaPassword = filteredData.newPassword && filteredData.newPassword.trim() !== '';

    console.log("cambiaPassword:", cambiaPassword);
    console.log("filteredData:", filteredData);

    if (cambiaEmail || cambiaPassword) {
      const { value: passwordActual } = await Swal.fire({
        title: 'Confirmación de Seguridad',
        text: 'Por seguridad, ingresa tu contraseña actual para confirmar los cambios.',
        input: 'password',
        inputPlaceholder: 'Tu contraseña actual',
        showCancelButton: true,
        confirmButtonColor: accent,
        cancelButtonText: 'Cancelar',
        confirmButtonText: 'Confirmar',
        inputValidator: (value) => {
          if (!value) return 'Debes ingresar tu contraseña para continuar';
        }
      });

      if (!passwordActual) return;

      const verification = await verifyPassword(passwordActual);
      if (verification?.status !== 'Success') {
        Swal.fire({
          icon: 'error',
          title: 'Contraseña incorrecta',
          text: 'No se pudo verificar tu identidad.',
          confirmButtonColor: accent
        });
        return;
      }

      if (cambiaEmail || (cambiaPassword && profileData?.rol === 'arrendador')) {
        filteredData.passwordActual = passwordActual;
      }
}

    const response = profileData?.rol === 'arrendador'
      ? await updateArrendadorProfile(filteredData)
      : await updateProfile(filteredData);

    if (response) {
      if (cambiaEmail || cambiaPassword) {
        await Swal.fire({
          icon: 'success',
          title: '¡Credenciales actualizadas!',
          text: 'Tus datos fueron cambiados. Debes iniciar sesión nuevamente.',
          confirmButtonColor: accent,
        });
        sessionStorage.removeItem('usuario');
        navigate('/auth');
      } else {
        Swal.fire({
          icon: 'success',
          title: '¡Perfil actualizado!',
          text: 'Tus datos han sido guardados correctamente.',
          confirmButtonColor: accent,
        });
        setEditMode(false);
        fetchProfile();
      }
    }
  };

  const fields = [
    { label: 'Nombre completo', field: 'nombreCompleto', placeholder: 'Tu nombre completo', icon: UserCircle2 },
    { label: 'Foto de perfil (URL)', field: 'fotoPerfil', placeholder: 'https://...', icon: Image },
    ...(profileData?.rol === 'estudiante' ? [
      { label: 'Universidad', field: 'universidad', placeholder: 'Tu universidad', icon: GraduationCap },
      { label: 'Carrera', field: 'carrera', placeholder: 'Tu carrera', icon: BookOpen },
      { label: 'Correo', field: 'email', placeholder: 'tucorreo@gmail.com', icon: Mail },
      { label: 'Nueva contraseña', field: 'newPassword', placeholder: 'Mínimo 8 caracteres', type: 'password', icon: Lock },
    ] : []),
    ...(profileData?.rol === 'arrendador' ? [
      { label: 'Teléfono', field: 'telefono', placeholder: '+56 9 1234 5678', icon: Phone },
      { label: 'Correo', field: 'email', placeholder: 'tucorreo@gmail.com', icon: Mail },
      { label: 'Nueva contraseña', field: 'newPassword', placeholder: 'Mínimo 8 caracteres', type: 'password', icon: Lock },
    ] : [])
  ];

  const dataItems = [
    { label: 'Nombre completo', value: profileData?.nombreCompleto, icon: UserCircle2 },
    { label: 'Correo', value: profileData?.email, icon: Mail },
    ...(profileData?.rol === 'estudiante' ? [
      { label: 'Universidad', value: profileData?.universidad || 'No especificada', icon: GraduationCap },
      { label: 'Carrera', value: profileData?.carrera || 'No especificada', icon: BookOpen }
    ] : []),
    ...(profileData?.rol === 'arrendador' ? [
      { label: 'Teléfono', value: profileData?.telefono || 'No especificado', icon: Phone },
      { label: 'Estado de Verificación', value: (profileData?.estadoVerificacion || 'pendiente').toUpperCase(), icon: null }
    ] : [])
  ];

  return (
    <div style={styles.page}>
      <section style={styles.hero}>
        <div style={styles.heroContent}>
          <div style={{ ...styles.avatarWrap, cursor: editMode ? 'pointer' : 'default' }}>
            {profileData?.fotoPerfil
              ? <img src={profileData.fotoPerfil} alt="avatar" style={styles.avatar} />
              : <div style={styles.avatarPlaceholder}>
                  {profileData?.nombreCompleto?.charAt(0).toUpperCase() || '?'}
                </div>
            }
            {editMode && (
              <div style={styles.avatarOverlay}>
                <span style={{ fontSize: '12px', color: '#fff', fontWeight: '600' }}>Cambiar foto</span>
              </div>
            )}
          </div>
          <div>
            <p style={styles.heroEyebrow}>{profileData?.rol || user?.rol}</p>
            <h1 style={styles.heroTitle}>{profileData?.nombreCompleto || user?.nombreCompleto}</h1>
            <p style={styles.heroSubtitle}>{profileData?.email || user?.email}</p>
            <div style={styles.heroBadge}>
              <span style={{ 
                width: '8px', height: '8px', borderRadius: '50%', 
                backgroundColor: profileData?.estadoVerificacion === 'aprobado' ? '#4ade80' : '#fbbf24',
                display: 'inline-block', marginRight: '6px'
              }}></span>
              {(profileData?.estadoVerificacion || 'pendiente').charAt(0).toUpperCase() + 
               (profileData?.estadoVerificacion || 'pendiente').slice(1)}
            </div>
          </div>
        </div>
      </section>
      {/* Barra de progreso */}
        {!editMode && (
          <section style={styles.card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div>
                <p style={{ ...styles.eyebrow, color: accent }}>Completitud del perfil</p>
                <h3 style={{ margin: 0, fontSize: '16px', color: '#0f172a' }}>
                  {(() => {
                    const campos = profileData?.rol === 'estudiante'
                      ? [profileData?.nombreCompleto, profileData?.email, profileData?.universidad, profileData?.carrera, profileData?.fotoPerfil]
                      : [profileData?.nombreCompleto, profileData?.email, profileData?.telefono, profileData?.fotoPerfil];
                    const completos = campos.filter(Boolean).length;
                    const porcentaje = Math.round((completos / campos.length) * 100);
                    return `${porcentaje}% completado`;
                  })()}
                </h3>
              </div>
              <span style={{ fontSize: '28px', fontWeight: '800', color: accent }}>
                {(() => {
                  const campos = profileData?.rol === 'estudiante'
                    ? [profileData?.nombreCompleto, profileData?.email, profileData?.universidad, profileData?.carrera, profileData?.fotoPerfil]
                    : [profileData?.nombreCompleto, profileData?.email, profileData?.telefono, profileData?.fotoPerfil];
                  return `${campos.filter(Boolean).length}/${campos.length}`;
                })()}
              </span>
            </div>
            <div style={{ height: '8px', borderRadius: '999px', backgroundColor: '#e2e8f0', overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                borderRadius: '999px',
                backgroundColor: accent,
                width: (() => {
                  const campos = profileData?.rol === 'estudiante'
                    ? [profileData?.nombreCompleto, profileData?.email, profileData?.universidad, profileData?.carrera, profileData?.fotoPerfil]
                    : [profileData?.nombreCompleto, profileData?.email, profileData?.telefono, profileData?.fotoPerfil];
                  return `${Math.round((campos.filter(Boolean).length / campos.length) * 100)}%`;
                })(),
                transition: 'width 0.5s ease',
              }} />
            </div>
            <div style={{ display: 'flex', gap: '8px', marginTop: '12px', flexWrap: 'wrap' }}>
              {(profileData?.rol === 'estudiante'
                ? [
                    { label: 'Nombre', valor: profileData?.nombreCompleto },
                    { label: 'Correo', valor: profileData?.email },
                    { label: 'Universidad', valor: profileData?.universidad },
                    { label: 'Carrera', valor: profileData?.carrera },
                    { label: 'Foto', valor: profileData?.fotoPerfil },
                  ]
                : [
                    { label: 'Nombre', valor: profileData?.nombreCompleto },
                    { label: 'Correo', valor: profileData?.email },
                    { label: 'Teléfono', valor: profileData?.telefono },
                    { label: 'Foto', valor: profileData?.fotoPerfil },
                  ]
              ).map(({ label, valor }) => (
                <span key={label} style={{
                  padding: '4px 10px', borderRadius: '999px', fontSize: '12px', fontWeight: '600',
                  backgroundColor: valor ? `${accent}15` : '#fee2e2',
                  color: valor ? accent : '#dc2626',
                }}>
                  {valor ? `✓ ${label}` : `✗ ${label}`}
                </span>
              ))}
            </div>
          </section>
        )}

      <section style={styles.card}>
        <header style={styles.cardHeader}>
          <div>
            <p style={{ ...styles.eyebrow, color: accent }}>
              {editMode ? 'Edición' : 'Información'}
            </p>
            <h2 style={styles.cardTitle}>
              {editMode ? 'Editar datos personales' : 'Datos personales'}
            </h2>
            <p style={styles.cardSubtitle}>
              {editMode ? 'Modifica solo los campos que deseas actualizar.' : 'Información visible en tu perfil público.'}
            </p>
          </div>
          <button
            onClick={() => setEditMode(!editMode)}
            style={{ ...styles.iconButton, backgroundColor: editMode ? '#fee2e2' : `${accent}15`, color: editMode ? '#dc2626' : accent }}
          >
            {editMode ? <X size={18} /> : <Pencil size={18} />}
          </button>
        </header>

        {editMode ? (
          <form onSubmit={handleSubmit(onSubmit)} style={styles.form}>
            <div style={styles.grid}>
              {fields.map(({ label, field, placeholder, type, icon: Icon }) => (
                <div key={field} style={styles.fieldGroup}>
                  <label style={styles.label}>{label}</label>
                  <div style={styles.inputWrap}>
                    {Icon && <Icon size={16} strokeWidth={2} style={styles.inputIcon} />}
                    <input
                      {...register(field)}
                      placeholder={placeholder}
                      type={type || 'text'}
                      style={styles.inputWithIcon}
                    />
                  </div>
                </div>
              ))}
            </div>
            <button type="submit" style={styles.button}>
              <Save size={16} strokeWidth={2.2} />
              Guardar cambios
            </button>
          </form>
        ) : (
          <div style={styles.dataGrid}>
            {dataItems.map(({ label, value, icon: Icon }) => (
              <div key={label} style={styles.dataItem}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                  {Icon && (
                    <div style={{ 
                      padding: '8px', borderRadius: '10px', 
                      backgroundColor: `${accent}15`, color: accent,
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                      <Icon size={16} strokeWidth={2} />
                    </div>
                  )}
                  <p style={styles.dataLabel}>{label}</p>
                </div>
                <p style={styles.dataValue}>{value}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      {profileData?.rol === 'arrendador' && !editMode && (
        <section style={styles.card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ padding: '12px', borderRadius: '14px', backgroundColor: `${accent}15`, color: accent }}>
                <Home size={24} />
              </div>
              <div>
                <h3 style={{ margin: '0 0 4px', fontSize: '18px', fontWeight: '700', color: '#0f172a' }}>Mis Propiedades</h3>
                <p style={{ margin: 0, fontSize: '14px', color: '#64748b' }}>
                  Tienes <strong>{cantidadPublicaciones}</strong> {cantidadPublicaciones === 1 ? 'publicación activa' : 'publicaciones activas'} en la plataforma.
                </p>
              </div>
            </div>
            <button 
              onClick={() => navigate('/mis-publicaciones')} 
              style={{ ...styles.button, padding: '12px 20px' }}
            >
              Gestionar mis publicaciones
            </button>
          </div>
        </section>
      )}
    </div>
  );
};

const styles = {
  page: { display: 'flex', flexDirection: 'column', gap: '20px', padding: '4px 0 12px' },
  hero: {
    borderRadius: '24px',
    padding: '32px',
    background: 'linear-gradient(135deg, #008080 0%, #0b6b7a 45%, #163d4f 100%)',
    color: '#fff',
    boxShadow: '0 20px 40px rgba(11, 34, 45, 0.18)',
  },
  heroContent: { display: 'flex', alignItems: 'center', gap: '24px' },
  avatarWrap: {
    width: '72px', 
    height: '72px', 
    borderRadius: '50%',
    border: '3px solid rgba(255,255,255,0.4)',
    overflow: 'hidden', 
    flexShrink: 0, 
    position: 'relative',
  },
  avatarPlaceholder: {
    width: '100%', height: '100%',
    backgroundColor: 'rgba(255,255,255,0.2)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '36px', fontWeight: '700', color: '#fff',
  },
  avatarOverlay: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '6px',
  },
  avatar: { width: '100%', height: '100%', objectFit: 'cover' },
    heroEyebrow: {
      margin: '0 0 4px', fontSize: '12px', fontWeight: '700',
      textTransform: 'uppercase', letterSpacing: '0.08em',
      color: 'rgba(255,255,255,0.7)',
    },
    heroTitle: { margin: '0 0 4px', fontSize: 'clamp(22px, 3vw, 32px)', lineHeight: 1.1 },
    heroSubtitle: { margin: '0 0 10px', fontSize: '14px', color: 'rgba(255,255,255,0.75)' },
    heroBadge: {
      display: 'inline-flex', alignItems: 'center',
      padding: '4px 12px', borderRadius: '999px',
      backgroundColor: 'rgba(255,255,255,0.12)',
      border: '1px solid rgba(255,255,255,0.2)',
      fontSize: '12px', fontWeight: '600',
    },
    inputWrap: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  inputIcon: {
    position: 'absolute',
    left: '14px',
    color: '#94a3b8',
    pointerEvents: 'none',
  },
  inputWithIcon: {
    padding: '12px 16px 12px 40px',
    borderRadius: '12px',
    border: '1px solid #e2e8f0',
    fontSize: '14px',
    outline: 'none',
    backgroundImage: 'none',
    backgroundColor: '#f8fafc',
    color: '#0f172a',
    width: '100%',
    boxSizing: 'border-box',
  },
  card: {
    borderRadius: '22px', padding: '28px', backgroundColor: '#ffffff',
    border: '1px solid rgba(15, 23, 42, 0.06)', boxShadow: '0 12px 30px rgba(15, 23, 42, 0.07)',
  },
  cardHeader: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px' },
  eyebrow: { margin: '0 0 6px', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em' },
  cardTitle: { margin: '0 0 6px', fontSize: '20px', color: '#0f172a' },
  cardSubtitle: { margin: 0, fontSize: '14px', color: '#64748b' },
  iconButton: {
    width: '42px', height: '42px', borderRadius: '14px',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    border: 'none', cursor: 'pointer', flexShrink: 0,
  },
  dataGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' },
  dataItem: { padding: '16px', borderRadius: '16px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' },
  dataLabel: { margin: '0 0 4px', fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' },
  dataValue: { margin: 0, fontSize: '15px', fontWeight: '600', color: '#0f172a' },
  form: { display: 'flex', flexDirection: 'column', gap: '28px' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px' },
  fieldGroup: { display: 'flex', flexDirection: 'column', gap: '6px' },
  label: { fontSize: '13px', fontWeight: '600', color: '#374151' },
  input: {
    padding: '12px 16px', borderRadius: '12px', border: '1px solid #e2e8f0',
    fontSize: '14px', outline: 'none', backgroundImage: 'none',
    backgroundColor: '#f8fafc', color: '#0f172a',
    width: '100%', boxSizing: 'border-box',
  },
  button: {
    alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: '8px',
    padding: '12px 24px', borderRadius: '12px', backgroundColor: accent,
    color: '#fff', fontWeight: '700', fontSize: '14px', border: 'none', cursor: 'pointer',
  },
};

export default Profile;