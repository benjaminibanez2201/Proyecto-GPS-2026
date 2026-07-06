import { useEffect, useState } from 'react';
import { X, ShieldAlert } from 'lucide-react';
import Swal from 'sweetalert2';
import { crearReporteUsuario } from '@services/reportesUsuario.service.js';

const motivos = [
  { value: 'acoso_o_amenazas', label: 'Acoso o amenazas' },
  { value: 'lenguaje_inapropiado', label: 'Lenguaje inapropiado' },
  { value: 'intento_de_fraude', label: 'Intento de fraude o estafa' },
  { value: 'suplantacion_identidad', label: 'Suplantación de identidad' },
  { value: 'spam', label: 'Spam o mensajes repetidos' },
  { value: 'otro', label: 'Otro motivo' },
];

export default function ModalReportarUsuario({ conversacionId, usuarioReportado, open, onClose, onSuccess }) {
  const [motivo, setMotivo] = useState(motivos[0].value);
  const [detalle, setDetalle] = useState('');
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    if (open) {
      setMotivo(motivos[0].value);
      setDetalle('');
    }
  }, [open, conversacionId]);

  if (!open || !conversacionId) return null;

  const nombreUsuario = usuarioReportado?.nombreCompleto || 'este usuario';

  const handleSubmit = async (event) => {
    event.preventDefault();

    const motivoFinal = detalle.trim()
      ? `${motivo}: ${detalle.trim()}`
      : motivo;

    setCargando(true);
    const [, error] = await crearReporteUsuario({
      conversacionId,
      motivo: motivoFinal,
    });
    setCargando(false);

    if (error) {
      Swal.fire({
        icon: 'error',
        title: 'No se pudo enviar el reporte',
        text: error,
        confirmButtonColor: '#0f766e',
      });
      return;
    }

    Swal.fire({
      icon: 'success',
      title: 'Reporte enviado',
      text: 'Tu denuncia quedó registrada y será revisada por el equipo correspondiente.',
      confirmButtonColor: '#0f766e',
    });

    if (onSuccess) onSuccess();
    onClose();
  };

  return (
    <div style={styles.backdrop} onClick={onClose}>
      <div style={styles.modal} onClick={(event) => event.stopPropagation()}>
        <div style={styles.header}>
          <div style={styles.titleWrap}>
            <div style={styles.iconWrap}>
              <ShieldAlert size={22} strokeWidth={2.2} />
            </div>
            <div>
              <p style={styles.eyebrow}>Reportar usuario</p>
              <h2 style={styles.title}>Ayúdanos a revisar a {nombreUsuario}</h2>
            </div>
          </div>

          <button type="button" onClick={onClose} style={styles.closeButton} aria-label="Cerrar">
            <X size={18} />
          </button>
        </div>

        <p style={styles.description}>
          Indica el motivo principal del reporte. Si quieres, agrega un detalle breve para facilitar la revisión.
        </p>

        <form onSubmit={handleSubmit} style={styles.form}>
          <label style={styles.field}>
            <span style={styles.label}>Motivo principal</span>
            <select value={motivo} onChange={(event) => setMotivo(event.target.value)} style={styles.select}>
              {motivos.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>

          <label style={styles.field}>
            <span style={styles.label}>Detalle opcional</span>
            <textarea
              value={detalle}
              onChange={(event) => setDetalle(event.target.value)}
              placeholder="Describe brevemente por qué consideras que esta cuenta debe revisarse"
              rows="4"
              style={styles.textarea}
            />
          </label>

          <div style={styles.actions}>
            <button type="button" onClick={onClose} style={styles.secondaryButton} disabled={cargando}>
              Cancelar
            </button>
            <button type="submit" style={styles.primaryButton} disabled={cargando}>
              {cargando ? 'Enviando...' : 'Enviar reporte'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const styles = {
  backdrop: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.62)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
    zIndex: 80,
  },
  modal: {
    width: 'min(100%, 560px)',
    borderRadius: '24px',
    backgroundColor: '#ffffff',
    boxShadow: '0 28px 70px rgba(15, 23, 42, 0.28)',
    padding: '24px',
  },
  header: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: '16px',
  },
  titleWrap: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
  },
  iconWrap: {
    width: '52px',
    height: '52px',
    borderRadius: '16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fee2e2',
    color: '#dc2626',
    flexShrink: 0,
  },
  eyebrow: {
    margin: '0 0 4px',
    fontSize: '12px',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    color: '#64748b',
  },
  title: {
    margin: 0,
    fontSize: '22px',
    color: '#0f172a',
    lineHeight: 1.2,
  },
  closeButton: {
    width: '38px',
    height: '38px',
    borderRadius: '12px',
    border: 'none',
    backgroundColor: '#f8fafc',
    color: '#334155',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    flexShrink: 0,
  },
  description: {
    margin: '16px 0 0',
    fontSize: '14px',
    lineHeight: 1.6,
    color: '#475569',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '18px',
    marginTop: '20px',
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  label: {
    fontSize: '13px',
    fontWeight: 700,
    color: '#334155',
  },
  select: {
    borderRadius: '14px',
    border: '1px solid #dbe4ee',
    padding: '12px 14px',
    fontSize: '14px',
    color: '#0f172a',
    outline: 'none',
    backgroundColor: '#f8fafc',
  },
  textarea: {
    borderRadius: '14px',
    border: '1px solid #dbe4ee',
    padding: '12px 14px',
    fontSize: '14px',
    color: '#0f172a',
    outline: 'none',
    resize: 'vertical',
    backgroundColor: '#f8fafc',
    minHeight: '112px',
    fontFamily: 'inherit',
  },
  actions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    flexWrap: 'wrap',
  },
  secondaryButton: {
    border: '1px solid #dbe4ee',
    backgroundColor: '#ffffff',
    color: '#334155',
    borderRadius: '12px',
    padding: '12px 18px',
    fontWeight: 700,
    cursor: 'pointer',
  },
  primaryButton: {
    border: 'none',
    backgroundColor: '#dc2626',
    color: '#ffffff',
    borderRadius: '12px',
    padding: '12px 18px',
    fontWeight: 700,
    cursor: 'pointer',
  },
};
