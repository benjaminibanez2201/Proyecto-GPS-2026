import { useAuth } from '@context/AuthContext';

const AdminPanel = () => {
    const { user } = useAuth();

    const colores = {
        principal: '#008080',
        secundario: '#e6dfd3',
        textoOscuro: '#2c3e50',
        blanco: '#ffffff',
        grisSuave: '#f4f6f6'
    };

    const actions = [
        {
            title: 'Gestion de usuarios',
            description: 'Listar usuarios, revisar estados y bloquear cuentas.'
        },
        {
            title: 'Documentos de verificacion',
            description: 'Revisar documentos subidos por los usuarios.'
        },
        {
            title: 'Publicaciones reportadas',
            description: 'Desactivar publicaciones con reportes activos.'
        },
        {
            title: 'Bloqueo de cuentas',
            description: 'Suspender cuentas que incumplen condiciones.'
        }
    ];

    return (
        <div style={{
            backgroundColor: colores.grisSuave,
            minHeight: '100vh',
            padding: '40px 20px',
            fontFamily: 'sans-serif',
            color: colores.textoOscuro
        }}>
            <div style={{
                maxWidth: '980px',
                margin: '0 auto',
                backgroundColor: colores.blanco,
                borderRadius: '16px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
                overflow: 'hidden'
            }}>
                <div style={{
                    backgroundColor: colores.secundario,
                    padding: '30px 40px',
                    display: 'flex',
                    flexWrap: 'wrap',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '20px'
                }}>
                    <div>
                        <h2 style={{ margin: 0, fontSize: '26px' }}>Panel de Administracion</h2>
                        <p style={{ margin: '6px 0 0', color: '#546e7a' }}>
                            Supervisa usuarios, revisa documentos y controla publicaciones.
                        </p>
                    </div>
                    <div style={{
                        backgroundColor: colores.principal,
                        color: colores.blanco,
                        padding: '10px 16px',
                        borderRadius: '999px',
                        fontWeight: 'bold'
                    }}>
                        {user?.nombreCompleto || 'Administrador'}
                    </div>
                </div>

                <div style={{ padding: '30px 40px' }}>
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                        gap: '18px'
                    }}>
                        {actions.map((action) => (
                            <div key={action.title} style={{
                                border: '1px solid #e2e8f0',
                                borderRadius: '12px',
                                padding: '18px',
                                backgroundColor: '#fdfefe',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '10px'
                            }}>
                                <h3 style={{ margin: 0, fontSize: '16px', color: colores.textoOscuro }}>
                                    {action.title}
                                </h3>
                                <p style={{ margin: 0, fontSize: '13px', color: '#607d8b' }}>
                                    {action.description}
                                </p>
                                <button
                                    type="button"
                                    style={{
                                        marginTop: '6px',
                                        backgroundColor: colores.principal,
                                        color: colores.blanco,
                                        border: 'none',
                                        borderRadius: '8px',
                                        padding: '10px',
                                        cursor: 'pointer',
                                        fontWeight: 'bold'
                                    }}
                                >
                                    Ver detalle
                                </button>
                            </div>
                        ))}
                    </div>

                    <div style={{ marginTop: '28px' }}>
                        <h3 style={{ margin: '0 0 12px 0', fontSize: '18px' }}>Registro de acciones</h3>
                        <div style={{
                            border: '1px solid #e2e8f0',
                            borderRadius: '12px',
                            padding: '16px',
                            backgroundColor: '#fdfefe',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '12px'
                        }}>
                            {[
                                'Revicion de documentos pendiente',
                                'Usuario bloqueado por incumplimiento',
                                'Publicacion reportada desactivada'
                            ].map((item) => (
                                <div key={item} style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    fontSize: '13px'
                                }}>
                                    <span>{item}</span>
                                    <span style={{ color: '#90a4ae' }}>hace 2h</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminPanel;
