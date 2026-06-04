import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { updateProfile, getProfile } from '@services/user.service.js';
import { useAuth } from '@context/AuthContext';
import { UserCircle2, Save, Pencil, X } from 'lucide-react';
import Swal from 'sweetalert2';

const accent = '#0f766e';

const Profile = () => {
  const { user } = useAuth();
  const [profileData, setProfileData] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const { register, handleSubmit, setValue } = useForm();

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
    }
  };

  const onSubmit = async (data) => {
    const filteredData = Object.fromEntries(
      Object.entries(data).filter(([, value]) => value !== '')
    );
    const response = await updateProfile(filteredData);
    if (response) {
      Swal.fire({
        icon: 'success',
        title: '¡Perfil actualizado!',
        text: 'Tus datos han sido guardados correctamente.',
        confirmButtonColor: accent,
      });
      setEditMode(false);
      fetchProfile(); // refresca los datos sin recargar la página
    }
  };

  const fields = [
    { label: 'Nombre completo', field: 'nombreCompleto', placeholder: 'Tu nombre completo' },
    { label: 'Universidad', field: 'universidad', placeholder: 'Tu universidad' },
    { label: 'Carrera', field: 'carrera', placeholder: 'Tu carrera' },
    { label: 'Teléfono', field: 'telefono', placeholder: '+56 9 1234 5678' },
    { label: 'Foto de perfil (URL)', field: 'fotoPerfil', placeholder: 'https://...' },
  ];

  const dataItems = [
    { label: 'Nombre completo', value: profileData?.nombreCompleto },
    { label: 'Correo', value: profileData?.email },
    { label: 'Universidad', value: profileData?.universidad || 'No especificada' },
    { label: 'Carrera', value: profileData?.carrera || 'No especificada' },
    { label: 'Teléfono', value: profileData?.telefono || 'No especificado' },
  ];

  return (
    <div style={styles.page}>
      {/* Hero */}
      <section style={styles.hero}>
        <div style={styles.heroContent}>
          <div style={styles.avatarWrap}>
            {profileData?.fotoPerfil
              ? <img src={profileData.fotoPerfil} alt="avatar" style={styles.avatar} />
              : <UserCircle2 size={32} strokeWidth={1.8} />
            }
          </div>
          <div>
            <h1 style={styles.heroTitle}>{profileData?.nombreCompleto || user?.nombreCompleto}</h1>
            <p style={styles.heroSubtitle}>{profileData?.email || user?.email}</p>
          </div>
        </div>
        <span style={styles.rolBadge}>{profileData?.rol || user?.rol}</span>
      </section>

      {/* Card */}
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
              {fields.map(({ label, field, placeholder }) => (
                <div key={field} style={styles.fieldGroup}>
                  <label style={styles.label}>{label}</label>
                  <input
                    {...register(field)}
                    placeholder={placeholder}
                    style={styles.input}
                  />
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
            {dataItems.map(({ label, value }) => (
              <div key={label} style={styles.dataItem}>
                <p style={styles.dataLabel}>{label}</p>
                <p style={styles.dataValue}>{value}</p>
              </div>
            ))}
          </div>
        )}
      </section>
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
  avatarWrap: {
    width: '56px', height: '56px', borderRadius: '50%',
    backgroundColor: 'rgba(255,255,255,0.15)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden', flexShrink: 0,
  },
  avatar: { width: '100%', height: '100%', objectFit: 'cover' },
  heroTitle: { margin: '0 0 4px', fontSize: 'clamp(20px, 3vw, 28px)', lineHeight: 1.1 },
  heroSubtitle: { margin: 0, fontSize: '14px', color: 'rgba(255,255,255,0.8)' },
  rolBadge: {
    display: 'inline-flex', alignItems: 'center', padding: '8px 14px',
    borderRadius: '999px', backgroundColor: 'rgba(255,255,255,0.12)',
    border: '1px solid rgba(255,255,255,0.14)', fontSize: '13px',
    fontWeight: '600', textTransform: 'capitalize',
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
  form: { display: 'flex', flexDirection: 'column', gap: '24px' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' },
  fieldGroup: { display: 'flex', flexDirection: 'column', gap: '6px' },
  label: { fontSize: '13px', fontWeight: '600', color: '#374151' },
  input: {
    padding: '10px 14px', borderRadius: '12px', border: '1px solid #e2e8f0',
    fontSize: '14px', outline: 'none', backgroundImage: 'none',
    backgroundColor: '#f8fafc', color: '#0f172a',
  },
  button: {
    alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: '8px',
    padding: '12px 24px', borderRadius: '12px', backgroundColor: accent,
    color: '#fff', fontWeight: '700', fontSize: '14px', border: 'none', cursor: 'pointer',
  },
};

export default Profile;
