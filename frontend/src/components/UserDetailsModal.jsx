import '@styles/popup.css';

const fieldLabels = {
    id: 'ID',
    nombreCompleto: 'Nombre completo',
    rut: 'RUT',
    email: 'Correo electrónico',
    rol: 'Rol',
    estadoVerificacion: 'Estado de verificación',
    telefono: 'Teléfono',
    universidad: 'Universidad',
    carrera: 'Carrera',
    createdAt: 'Creado',
    updatedAt: 'Actualizado',
    ultimoLogin: 'Último acceso',
    fotoPerfil: 'Foto de perfil',
    documentoVerificacion: 'Documento de verificación',
};

const statusColors = {
    aprobado: '#0f766e',
    pendiente: '#b45309',
    rechazado: '#b91c1c',
};

function formatValue(value) {
    if (value === null || value === undefined || value === '') {
        return 'No registrado';
    }

    return value;
}

export default function UserDetailsModal({ show, setShow, user }) {
    if (!show) return null;

    const normalizedStatus = (user?.estadoVerificacion || 'pendiente').toString().toLowerCase();
    const initials = (user?.nombreCompleto || 'Usuario')
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part.charAt(0).toUpperCase())
        .join('');

    const detailFields = [
        'id',
        'rut',
        'email',
        'rol',
        'estadoVerificacion',
        'telefono',
        'universidad',
        'carrera',
        'createdAt',
        'updatedAt',
        'ultimoLogin',
        'documentoVerificacion',
        'fotoPerfil',
    ];

    return (
        <div
            className="bg"
            style={{ position: 'fixed', inset: 0, zIndex: 1200, alignItems: 'center', justifyContent: 'center', padding: '16px' }}
            onClick={() => setShow(false)}
        >
            <div
                className="popup"
                style={{
                    width: 'min(760px, calc(100vw - 32px))',
                    height: 'auto',
                    maxHeight: 'calc(100vh - 32px)',
                    overflow: 'auto',
                    padding: '0',
                    borderRadius: '22px',
                    backgroundColor: '#ffffff',
                    boxShadow: '0 24px 70px rgba(15, 23, 42, 0.22)',
                }}
                onClick={(event) => event.stopPropagation()}
            >
                <div style={{ position: 'relative' }}>
                    <button
                        className="close"
                        onClick={() => setShow(false)}
                        aria-label="Cerrar"
                        style={{ zIndex: 2 }}
                    >
                        ×
                    </button>

                    <div style={{ padding: '0' }}>
                        <section style={{ background: 'linear-gradient(135deg, #008080 0%, #0b6b7a 45%, #163d4f 100%)', color: '#ffffff', padding: '28px 32px 26px', borderTopLeftRadius: '22px', borderTopRightRadius: '22px' }}>
                            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px' }}>
                                <div style={{ maxWidth: 'calc(100% - 90px)' }}>
                                    <p style={{ margin: '0 0 8px', fontSize: '12px', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', opacity: 0.9 }}>
                                        Vista detallada
                                    </p>
                                    <h2 style={{ margin: 0, fontSize: '26px', lineHeight: 1.1 }}>
                                        {user?.nombreCompleto || 'Usuario sin nombre'}
                                    </h2>
                                    <p style={{ margin: '8px 0 0', color: 'rgba(255,255,255,0.88)', lineHeight: 1.55, maxWidth: '60ch' }}>
                                        Información completa del usuario para revisar su perfil antes de editar o eliminar.
                                    </p>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
                                    <div
                                        style={{
                                            width: '56px',
                                            height: '56px',
                                            borderRadius: '18px',
                                            backgroundColor: 'rgba(255,255,255,0.14)',
                                            color: '#ffffff',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontWeight: 800,
                                            fontSize: '18px',
                                            border: '1px solid rgba(255,255,255,0.16)',
                                        }}
                                    >
                                        {initials || 'U'}
                                    </div>

                                    <span
                                        style={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            padding: '6px 12px',
                                            borderRadius: '999px',
                                            backgroundColor: 'rgba(255,255,255,0.14)',
                                            color: '#ffffff',
                                            fontWeight: 700,
                                            fontSize: '12px',
                                            textTransform: 'capitalize',
                                            border: '1px solid rgba(255,255,255,0.16)',
                                        }}
                                    >
                                        {formatValue(user?.estadoVerificacion)}
                                    </span>
                                </div>
                            </div>
                        </section>

                        <section style={{ padding: '24px 32px 32px', backgroundColor: '#ffffff', borderBottomLeftRadius: '22px', borderBottomRightRadius: '22px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {detailFields.map((field, index) => (
                                    <div
                                        key={field}
                                        style={{
                                            display: 'grid',
                                            gridTemplateColumns: '170px 1fr',
                                            gap: '14px',
                                            paddingBottom: '12px',
                                            borderBottom: index === detailFields.length - 1 ? 'none' : '1px solid #e2e8f0',
                                        }}
                                    >
                                        <span style={{ fontSize: '13px', fontWeight: 700, color: '#0f766e' }}>
                                            {fieldLabels[field] || field}
                                        </span>
                                        <span style={{ fontSize: '14px', lineHeight: 1.5, color: '#0f172a', wordBreak: 'break-word' }}>
                                            {formatValue(user?.[field])}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </section>
                    </div>
                </div>
            </div>
        </div>
    );
}