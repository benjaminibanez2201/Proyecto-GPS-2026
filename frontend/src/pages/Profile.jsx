import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { updateProfile } from '@services/user.service.js';
import { useAuth } from '@context/AuthContext';

const Profile = () => {
  const { user } = useAuth();
  const { register, handleSubmit, setValue, formState: { errors } } = useForm();

  useEffect(() => {
    if (user) {
      setValue('nombreCompleto', user.nombreCompleto || '');
      setValue('universidad', user.universidad || '');
      setValue('carrera', user.carrera || '');
      setValue('telefono', user.telefono || '');
      setValue('fotoPerfil', user.fotoPerfil || '');
    }
  }, [user]);

  const onSubmit = async (data) => {
    const filteredData = Object.fromEntries(
      Object.entries(data).filter(([_, v]) => v !== '')
    );
    const response = await updateProfile(filteredData);
    if (response) alert('Perfil actualizado correctamente');
  };

  return (
    <div style={{ maxWidth: '480px', margin: '40px auto', padding: '32px', borderRadius: '12px', boxShadow: '0 2px 12px rgba(0,0,0,0.1)', backgroundColor: '#fff' }}>
      <h2 style={{ marginBottom: '24px', fontSize: '22px', color: '#1a1a2e' }}>Editar perfil</h2>
      <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {[
          { label: 'Nombre completo', field: 'nombreCompleto', placeholder: 'Tu nombre completo' },
          { label: 'Universidad', field: 'universidad', placeholder: 'Tu universidad' },
          { label: 'Carrera', field: 'carrera', placeholder: 'Tu carrera' },
          { label: 'Teléfono', field: 'telefono', placeholder: '+56 9 1234 5678' },
          { label: 'Foto de perfil (URL)', field: 'fotoPerfil', placeholder: 'https://...' },
        ].map(({ label, field, placeholder }) => (
          <div key={field} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '14px', fontWeight: '600', color: '#444' }}>{label}</label>
            <input
              {...register(field)}
              placeholder={placeholder}
              style={{ padding: '10px 12px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '14px', outline: 'none', backgroundImage: 'none' }}
            />
          </div>
        ))}
        <button
          type="submit"
          style={{ marginTop: '8px', padding: '12px', borderRadius: '8px', backgroundColor: '#1a1a2e', color: '#fff', fontWeight: '600', fontSize: '15px', border: 'none', cursor: 'pointer' }}
        >
          Guardar cambios
        </button>
      </form>
    </div>
  );
};

export default Profile;