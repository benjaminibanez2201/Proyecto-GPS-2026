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
import { forgotPassword, logout } from '@services/auth.service.js';
import { useAuth } from '@context/AuthContext';
import { resolveFileUrl } from '@helpers/resolveFileUrl.js';
import { UserCircle2, Save, Pencil, X, Home, Star, ChevronRight, FlagTriangleRight, GraduationCap, BookOpen, Mail, Phone, Check, ShieldCheck, Camera, KeyRound } from 'lucide-react';
import Swal from 'sweetalert2';

const accent = '#0f766e';

const Profile = () => {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate(); 
  const [profileData, setProfileData] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [editingEmail, setEditingEmail] = useState(false);
  const { register, handleSubmit, setValue, watch, trigger, formState: { errors } } = useForm({ mode: 'onChange' });
  const emailValue = watch('email');
  const [cantidadPublicaciones, setCantidadPublicaciones] = useState(0); 
  const [fotoSeleccionada, setFotoSeleccionada] = useState(null);
  const [fotoPreview, setFotoPreview] = useState(null);
  const [isSendingPasswordResetEmail, setIsSendingPasswordResetEmail] = useState(false);


  useEffect(() => {
    fetchProfile();
  }, []);

  useEffect(() => {
    trigger('confirmEmail');
  }, [emailValue, trigger]);

  useEffect(() => {
    if (!fotoSeleccionada) {
      setFotoPreview(null);
      return;
    }

    const previewUrl = URL.createObjectURL(fotoSeleccionada);
    setFotoPreview(previewUrl);

    return () => {
      URL.revokeObjectURL(previewUrl);
    };
  }, [fotoSeleccionada]);

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
      setValue('confirmEmail', '');

      if (data.rol === 'arrendador') {
        const pubs = await getMisPublicaciones();
        if (Array.isArray(pubs)) {
          setCantidadPublicaciones(pubs.length);
        }
      }
    }
  };

  const onSubmit = async (data) => {
    const filteredData = Object.fromEntries(
      Object.entries(data).filter(([key, value]) => value !== '' && key !== 'confirmEmail')
    );

    const cambiaEmail = filteredData.email && filteredData.email !== profileData?.email;

    if (cambiaEmail) {
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

      filteredData.passwordActual = passwordActual;
    }

    const formData = new FormData();

    Object.entries(filteredData).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formData.append(key, value);
      }
    });

    if (fotoSeleccionada) {
      formData.append('fotoPerfil', fotoSeleccionada);
    }

    try {
      const response = profileData?.rol === 'arrendador'
        ? await updateArrendadorProfile(formData)
        : await updateProfile(formData);
      if (response && !response?.message && response?.status !== 'Error') {
        if (cambiaEmail) {
          await Swal.fire({
            icon: 'success',
            title: '¡Credenciales actualizadas!',
            text: 'Tus datos fueron cambiados. Debes iniciar sesión nuevamente.',
            confirmButtonColor: accent,
          });
          await logout();
          navigate('/auth');
        } else {
          await Swal.fire({
            icon: 'success',
            title: '¡Perfil actualizado!',
            text: 'Tus datos han sido guardados correctamente.',
            confirmButtonColor: accent,
          });
          updateUser(response);
          setFotoSeleccionada(null);
          setEditMode(false);
          fetchProfile();
        }
      } else {
        Swal.fire({ 
          icon: 'error', 
          title: 'Error al actualizar', 
          text: response?.message || response?.details || 'El servidor rechazó los datos proporcionados.', 
          confirmButtonColor: accent 
        });
      }
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Error de Red', text: 'No se pudo conectar con el servidor.', confirmButtonColor: accent });
    };
  };

  const handleSendPasswordResetLink = async () => {
    if (!profileData?.email) {
      Swal.fire({ icon: 'error', title: 'Error', text: 'No se encontró un correo electrónico válido en tu perfil.', confirmButtonColor: accent });
      return;
    }

    if (editMode && emailValue && profileData?.email && emailValue !== profileData.email) {
      Swal.fire({
        icon: 'warning',
        title: 'Correo electrónico pendiente',
        text: 'Has cambiado tu correo electrónico en el formulario. Guarda los cambios antes de enviar el enlace de restablecimiento.',
        confirmButtonColor: accent,
      });
      return;
    }

    const confirmacion = await Swal.fire({
      title: '¿Seguro que quieres cambiar tu contraseña?',
      text: 'Te enviaremos un enlace de recuperación seguro a tu correo electrónico registrado.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: accent,
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Sí, enviar enlace',
      cancelButtonText: 'Cancelar'
    });

    if (!confirmacion.isConfirmed) return;

    setIsSendingPasswordResetEmail(true);
      try {
        const payload = await forgotPassword(profileData.email);
        if (payload?.status === 'Success') {
          Swal.fire({ icon: 'success', title: 'Enlace enviado', text: 'Revisa tu correo electrónico para restablecer la contraseña.', confirmButtonColor: accent });
        } else {
          Swal.fire({ icon: 'error', title: 'Error', text: payload?.details || payload?.message || 'No se pudo enviar el enlace de restablecimiento.', confirmButtonColor: accent });
        }
      } catch (error) {
        Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo enviar el enlace de restablecimiento.', confirmButtonColor: accent });
      } finally {
        setIsSendingPasswordResetEmail(false);
      }
    }

  const handleStartEditEmail = () => setEditingEmail(true);

  const handleCancelEditEmail = () => {
    setEditingEmail(false);
    setValue('email', profileData?.email || '');
    setValue('confirmEmail', '');
  };

  const personalFields = [
    { label: 'Nombre completo', field: 'nombreCompleto', placeholder: 'Tu nombre completo', icon: UserCircle2 },
    ...(profileData?.rol === 'estudiante' ? [
      { label: 'Universidad', field: 'universidad', placeholder: 'Tu universidad', icon: GraduationCap },
      { label: 'Carrera', field: 'carrera', placeholder: 'Tu carrera', icon: BookOpen },
    ] : []),
    ...(profileData?.rol === 'arrendador' ? [
      { label: 'Teléfono', field: 'telefono', placeholder: '+56 9 1234 5678', icon: Phone },
    ] : []),
  ];

  const securityFields = [
    { label: 'Correo electrónico', field: 'email', placeholder: 'ejemplo@gmail.com', icon: Mail },
    { label: 'Confirmar correo electrónico', field: 'confirmEmail', placeholder: 'Repite tu correo electrónico', type: 'email', icon: Mail },
  ];

  const getFieldRules = (field) => {
    if (field === 'nombreCompleto') {
      return {
        required: 'El nombre completo es obligatorio',
        minLength: { value: 15, message: 'El nombre completo debe tener al menos 15 caracteres' },
        maxLength: { value: 50, message: 'El nombre completo debe tener máximo 50 caracteres' },
        pattern: { value: /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, message: 'Solo puede contener letras y espacios' },
      };
    }
    if (field === 'universidad' || field === 'carrera') {
      return {
        required: `${field === 'universidad' ? 'La universidad' : 'La carrera'} es obligatoria`,
        minLength: { value: 3, message: 'Debe tener al menos 3 caracteres' },
        maxLength: { value: 255, message: 'Debe tener máximo 255 caracteres' },
      };
    }
    if (field === 'telefono') {
      return {
        required: 'El teléfono es obligatorio',
        pattern: { value: /^\+?[\d\s\-]{7,20}$/, message: 'Formato de teléfono inválido' },
      };
    }
    if (field === 'email') {
      return {
        required: 'El correo electrónico es obligatorio',
        pattern: {
          value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
          message: 'Ingresa un correo electrónico válido',
        },
      };
    }
    if (field === 'confirmEmail') {
      return {
        required: emailValue !== profileData?.email ? 'Debes confirmar el correo electrónico' : false,
        validate: (value) => {
          if (emailValue !== profileData?.email) {
            return value === emailValue || 'Los correos electrónicos no coinciden';
          }
          return true;
        },
      };
    }
    return undefined;
  };

  const renderField = ({ label, field, placeholder, type, icon: Icon }) => (
    <div key={field} style={styles.fieldGroup}>
      <label style={styles.label}>{label}</label>
      <div style={styles.inputWrap}>
        {Icon && <Icon size={16} strokeWidth={2} style={styles.inputIcon} />}
        <input
          {...register(field, getFieldRules(field))}
          placeholder={placeholder}
          type={type || 'text'}
          style={styles.inputWithIcon}
        />
      </div>
      {errors[field] && (
        <span style={{ color: '#dc2626', fontSize: '12px', marginTop: '6px' }}>
          {errors[field].message}
        </span>
      )}
    </div>
  );

  const dataGroups = [
    {
      title: 'Cuenta',
      items: [
        { label: 'Nombre completo', value: profileData?.nombreCompleto, icon: UserCircle2 },
        { label: 'Correo electrónico', value: profileData?.email, icon: Mail },
        { label: 'Teléfono', value: profileData?.telefono || 'No especificado', icon: Phone },
      ],
    },
    ...(profileData?.rol === 'estudiante' ? [{
      title: 'Información académica',
      items: [
        { label: 'Universidad', value: profileData?.universidad || 'No especificada', icon: GraduationCap },
        { label: 'Carrera', value: profileData?.carrera || 'No especificada', icon: BookOpen },
      ],
    }] : []),
    ...(profileData?.rol === 'arrendador' ? [{
      title: 'Verificación',
      items: [
        { label: 'Estado de verificación', value: (profileData?.estadoVerificacion || 'pendiente').toUpperCase(), icon: ShieldCheck },
      ],
    }] : []),
  ];

  const camposPerfil = profileData?.rol === 'estudiante'
    ? [
        { label: 'Nombre', valor: profileData?.nombreCompleto },
        { label: 'Correo electrónico', valor: profileData?.email },
        { label: 'Universidad', valor: profileData?.universidad },
        { label: 'Carrera', valor: profileData?.carrera },
        { label: 'Foto', valor: profileData?.fotoPerfil },
      ]
    : [
        { label: 'Nombre', valor: profileData?.nombreCompleto },
        { label: 'Correo electrónico', valor: profileData?.email },
        { label: 'Teléfono', valor: profileData?.telefono },
        { label: 'Foto', valor: profileData?.fotoPerfil },
      ];
  const camposCompletados = camposPerfil.filter((campo) => campo.valor).length;
  const porcentajeCompletitud = camposPerfil.length
    ? Math.round((camposCompletados / camposPerfil.length) * 100)
    : 0;
  const ringRadius = 28;
  const ringCircumference = 2 * Math.PI * ringRadius;

  return (
    <div style={styles.page}>
      <section style={styles.hero}>
        <div style={styles.heroContent}>
          <label
            htmlFor={editMode ? 'perfil-file' : undefined}
            style={{ ...styles.avatarWrap, cursor: editMode ? 'pointer' : 'default' }}
          >
            {(fotoPreview || profileData?.fotoPerfil)
              ? <img src={fotoPreview || resolveFileUrl(profileData.fotoPerfil)} alt="avatar" style={styles.avatar} />
              : <div style={styles.avatarPlaceholder}>
                  {profileData?.nombreCompleto?.charAt(0).toUpperCase() || '?'}
                </div>
            }
            {editMode && (
              <div style={styles.avatarOverlay}>
                <Camera size={18} color="#fff" />
                <span style={{ fontSize: '11px', color: '#fff', fontWeight: '600' }}>Cambiar foto</span>
              </div>
            )}
            {editMode && (
              <input
                id="perfil-file"
                type="file"
                accept="image/*"
                onChange={(e) => setFotoSeleccionada(e.target.files?.[0] || null)}
                style={styles.hiddenInput}
              />
            )}
          </label>
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
      {/* Resumen: completitud + reportes + calificaciones */}
        {!editMode && (
          <section style={styles.card}>
            <div style={{
              ...styles.summaryGrid,
              gridTemplateColumns: profileData?.rol === 'arrendador'
                ? 'minmax(220px, 1.1fr) 1fr 1fr 1fr'
                : 'minmax(220px, 1.3fr) 1fr 1fr',
            }}>
              <div style={styles.summaryColumn}>
                <div style={styles.completionHeader}>
                  <div style={styles.completionRingWrap}>
                    <svg width="60" height="60" viewBox="0 0 72 72" style={{ transform: 'rotate(-90deg)' }}>
                      <circle cx="36" cy="36" r={ringRadius} fill="none" stroke="#e2e8f0" strokeWidth="7" />
                      <circle
                        cx="36" cy="36" r={ringRadius} fill="none" stroke={accent} strokeWidth="7"
                        strokeLinecap="round"
                        strokeDasharray={ringCircumference}
                        strokeDashoffset={ringCircumference * (1 - porcentajeCompletitud / 100)}
                        style={{ transition: 'stroke-dashoffset 0.6s ease' }}
                      />
                    </svg>
                    <span style={styles.completionRingLabel}>{porcentajeCompletitud}%</span>
                  </div>
                  <div>
                    <p style={{ ...styles.eyebrow, color: accent }}>Completitud</p>
                    <h3 style={styles.summaryTitle}>{camposCompletados} de {camposPerfil.length} campos</h3>
                  </div>
                </div>
                <div style={styles.completionChips}>
                  {camposPerfil.map(({ label, valor }) => (
                    <span key={label} style={{
                      ...styles.completionChip,
                      backgroundColor: valor ? `${accent}15` : '#fee2e2',
                      color: valor ? accent : '#dc2626',
                    }}>
                      {valor ? <Check size={13} strokeWidth={3} /> : <X size={13} strokeWidth={3} />}
                      {label}
                    </span>
                  ))}
                </div>
              </div>

              {profileData?.rol === 'arrendador' && (
                <div style={{ ...styles.summaryColumn, ...styles.summaryColumnDivider }}>
                  <div style={styles.summaryIconWrap}>
                    <Home size={20} strokeWidth={2.1} />
                  </div>
                  <h3 style={styles.summaryTitle}>Mis propiedades</h3>
                  <p style={styles.summaryText}>
                    {cantidadPublicaciones} {cantidadPublicaciones === 1 ? 'publicación activa' : 'publicaciones activas'}.
                  </p>
                  <button type="button" onClick={() => navigate('/mis-publicaciones')} style={styles.summaryLink}>
                    Gestionar publicaciones <ChevronRight size={14} strokeWidth={2.4} />
                  </button>
                </div>
              )}

              <div style={{ ...styles.summaryColumn, ...styles.summaryColumnDivider }}>
                <div style={styles.summaryIconWrap}>
                  <FlagTriangleRight size={20} strokeWidth={2.1} />
                </div>
                <h3 style={styles.summaryTitle}>Mis reportes</h3>
                <p style={styles.summaryText}>Sigue el estado de tus denuncias.</p>
                <button type="button" onClick={() => navigate('/profile/reportes')} style={styles.summaryLink}>
                  Ver mis reportes <ChevronRight size={14} strokeWidth={2.4} />
                </button>
              </div>

              <div style={{ ...styles.summaryColumn, ...styles.summaryColumnDivider }}>
                <div style={styles.summaryIconWrap}>
                  <Star size={20} strokeWidth={2.1} />
                </div>
                <h3 style={styles.summaryTitle}>Calificaciones recibidas</h3>
                <p style={styles.summaryText}>Revisa tu reputación y comentarios.</p>
                <button type="button" onClick={() => navigate('/profile/calificaciones')} style={styles.summaryLink}>
                  Ver calificaciones <ChevronRight size={14} strokeWidth={2.4} />
                </button>
              </div>
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
            onClick={() => {
              setEditMode(!editMode);
              handleCancelEditEmail();
            }}
            style={{ ...styles.iconButton, backgroundColor: editMode ? '#fee2e2' : `${accent}15`, color: editMode ? '#dc2626' : accent }}
          >
            {editMode ? <X size={18} /> : <Pencil size={18} />}
          </button>
        </header>

        {editMode ? (
          <form onSubmit={handleSubmit(onSubmit)} style={styles.form}>
            <p style={styles.formHint}>
              Toca tu foto en la parte superior para cambiarla.
            </p>

            <div style={styles.formSection}>
              <p style={styles.formSectionTitle}>Información personal</p>
              <div style={styles.grid}>
                {personalFields.map(renderField)}
              </div>
            </div>

            <div style={styles.formSection}>
              <p style={styles.formSectionTitle}>Correo y seguridad</p>
              <div style={styles.securityLayout}>
                <div style={styles.securityMain}>
                  {editingEmail ? (
                    <>
                      <div style={styles.grid}>
                        {securityFields.map(renderField)}
                      </div>
                      <button type="button" onClick={handleCancelEditEmail} style={styles.linkButton}>
                        Cancelar cambio de correo electrónico
                      </button>
                    </>
                  ) : (
                    <div style={styles.fieldGroup}>
                      <label style={styles.label}>Correo electrónico</label>
                      <p style={styles.emailStaticValue}>{profileData?.email}</p>
                    </div>
                  )}
                </div>

                <div style={styles.securitySide}>
                  <p style={styles.securitySideTitle}>Seguridad de la cuenta</p>
                  <p style={styles.securitySideText}>Cambia tu correo electrónico o contraseña cuando lo necesites.</p>
                  <div style={styles.securitySideButtons}>
                    {!editingEmail && (
                      <button type="button" onClick={handleStartEditEmail} style={styles.credentialButton}>
                        <Mail size={15} strokeWidth={2.2} />
                        Cambiar correo electrónico
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={handleSendPasswordResetLink}
                      disabled={isSendingPasswordResetEmail}
                      style={styles.credentialButton}
                    >
                      <KeyRound size={15} strokeWidth={2.2} />
                      {isSendingPasswordResetEmail ? 'Enviando...' : 'Cambiar contraseña'}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <button type="submit" style={styles.button}>
              <Save size={16} strokeWidth={2.2} />
              Guardar cambios
            </button>
          </form>
        ) : (
          <div style={styles.dataGroups}>
            {dataGroups.map((group) => (
              <div key={group.title}>
                <p style={styles.dataGroupTitle}>{group.title}</p>
                <div style={styles.dataGrid}>
                  {group.items.map(({ label, value, icon: Icon }) => (
                    <div key={label} style={styles.dataItem}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                        {Icon && (
                          <div style={styles.dataItemIconWrap}>
                            <Icon size={17} strokeWidth={2} />
                          </div>
                        )}
                        <p style={styles.dataLabel}>{label}</p>
                      </div>
                      <p style={styles.dataValue}>{value}</p>
                    </div>
                  ))}
                </div>
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
    position: 'absolute', inset: 0,
    backgroundColor: 'rgba(0,0,0,0.45)',
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '2px',
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
  hiddenInput: {
    display: 'none',
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
  completionHeader: { display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '18px' },
  completionRingWrap: { position: 'relative', width: '72px', height: '72px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  completionRingLabel: { position: 'absolute', fontSize: '15px', fontWeight: '800', color: accent },
  completionChips: { display: 'flex', gap: '8px', flexWrap: 'wrap' },
  completionChip: {
    display: 'inline-flex', alignItems: 'center', gap: '5px',
    padding: '5px 12px', borderRadius: '999px', fontSize: '12px', fontWeight: '600',
  },
  dataGroups: { display: 'flex', flexDirection: 'column', gap: '20px' },
  dataGroupTitle: { margin: '0 0 10px', fontSize: '12px', fontWeight: '700', color: accent, textTransform: 'uppercase', letterSpacing: '0.06em' },
  dataItemIconWrap: {
    padding: '9px', borderRadius: '12px',
    backgroundColor: `${accent}15`, color: accent,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  dataGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' },
  dataItem: { padding: '16px', borderRadius: '16px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' },
  dataLabel: { margin: '0 0 4px', fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' },
  dataValue: { margin: 0, fontSize: '15px', fontWeight: '600', color: '#0f172a' },
  form: { display: 'flex', flexDirection: 'column', gap: '20px' },
  formHint: { margin: '-8px 0 0', fontSize: '13px', color: '#64748b' },
  formSection: {
    display: 'flex', flexDirection: 'column', gap: '16px',
    padding: '20px', borderRadius: '18px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0',
  },
  formSectionTitle: { margin: 0, fontSize: '12px', fontWeight: '700', color: accent, textTransform: 'uppercase', letterSpacing: '0.06em' },
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
  credentialButton: {
    alignSelf: 'flex-start', display: 'inline-flex', alignItems: 'center', gap: '7px', justifyContent: 'center',
    padding: '10px 16px', borderRadius: '12px', border: `1px solid ${accent}35`,
    backgroundColor: `${accent}0d`, color: accent, fontWeight: '700', fontSize: '13px', cursor: 'pointer',
  },
  linkButton: {
    alignSelf: 'flex-start', border: 'none', background: 'none',
    color: '#64748b', fontWeight: '600', fontSize: '13px', cursor: 'pointer', padding: 0,
    textDecoration: 'underline',
  },
  emailStaticValue: { margin: '4px 0 0', fontSize: '14px', fontWeight: '600', color: '#0f172a' },
  securityLayout: { display: 'flex', gap: '24px', flexWrap: 'wrap' },
  securityMain: { flex: '1 1 240px', minWidth: '200px', display: 'flex', flexDirection: 'column', gap: '12px' },
  securitySide: {
    flex: '1 1 220px', minWidth: '200px',
    paddingLeft: '24px', borderLeft: '1px solid #e2e8f0',
    display: 'flex', flexDirection: 'column', gap: '10px',
  },
  securitySideTitle: { margin: 0, fontSize: '13px', fontWeight: '700', color: '#0f172a' },
  securitySideText: { margin: 0, fontSize: '12px', color: '#64748b', lineHeight: 1.4 },
  securitySideButtons: { display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' },
  summaryGrid: {
    display: 'grid',
    gridTemplateColumns: 'minmax(220px, 1.3fr) 1fr 1fr',
    gap: '24px',
  },
  summaryColumn: { display: 'flex', flexDirection: 'column', gap: '10px' },
  summaryColumnDivider: { borderLeft: '1px solid #e2e8f0', paddingLeft: '24px' },
  summaryIconWrap: {
    width: '40px', height: '40px', borderRadius: '12px',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#fff4d6', color: '#b08900', flexShrink: 0,
  },
  summaryTitle: { margin: 0, fontSize: '15px', fontWeight: '700', color: '#0f172a' },
  summaryText: { margin: 0, fontSize: '13px', color: '#64748b', lineHeight: 1.45 },
  summaryLink: {
    alignSelf: 'flex-start', display: 'inline-flex', alignItems: 'center', gap: '4px',
    border: 'none', background: 'none', padding: 0, marginTop: '2px',
    color: accent, fontWeight: '700', fontSize: '13px', cursor: 'pointer',
  },
};

export default Profile;
