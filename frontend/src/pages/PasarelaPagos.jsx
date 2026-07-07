import { useMemo, useState } from 'react';
import { ArrowLeft, CheckCircle2, CreditCard, LockKeyhole, ShieldCheck } from 'lucide-react';
import { patrocinarPublicacion } from '@services/user.service.js';

const PAYMENT_APPROVED_MESSAGE = 'ARRENDU_PAYMENT_APPROVED';

const formatAmount = (value) => {
  const amount = Number(value || 0);
  return amount > 0 ? `$${amount.toLocaleString('es-CL')}` : '$0';
};

const PasarelaPagos = () => {
  const searchParams = useMemo(() => new URLSearchParams(window.location.search), []);
  const token = searchParams.get('token') || '';
  const storedContext = useMemo(() => {
    if (!token) return {};

    try {
      return JSON.parse(window.localStorage.getItem(`arriendu:payment-gateway:${token}`) || '{}');
    } catch (_) {
      return {};
    }
  }, [token]);
  const plan = searchParams.get('plan') || storedContext.plan || 'Plan promocional';
  const planId = searchParams.get('planId') || storedContext.planId || '';
  const amount = searchParams.get('amount') || storedContext.amount || '0';
  const days = searchParams.get('days') || storedContext.days || '';
  const title = searchParams.get('title') || storedContext.title || 'Publicacion';
  const publicacionId = searchParams.get('publicacionId') || storedContext.publicacionId || '';
  const returnTo = searchParams.get('returnTo') || storedContext.returnTo || (publicacionId ? `/publicacion/${publicacionId}` : '/mis-publicaciones');
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');

  const hasPreviousPage = () => Boolean(window.opener && !window.opener.closed);

  const notifyPreviousPage = () => {
    if (!hasPreviousPage()) return false;

    window.opener.postMessage({
      type: PAYMENT_APPROVED_MESSAGE,
      token,
      approved: true,
      publicacionId,
      returnTo,
    }, window.location.origin);
    return true;
  };

  const clearPendingContext = () => {
    if (!token) return;

    try {
      window.localStorage.removeItem(`arriendu:payment-gateway:${token}`);
    } catch (_) {
      // No requiere accion si el navegador no permite modificar storage.
    }
  };

  const fallbackActivatePlan = async () => {
    if (!publicacionId) {
      throw new Error('Esta orden no tiene una publicacion asociada. Vuelve a Mis Publicaciones e inicia el pago nuevamente.');
    }

    return patrocinarPublicacion(publicacionId, {
      metodoPago: 'tarjeta',
      monto: Number(amount || 0),
      plan: planId || `pasarela_${days || '7'}_dias`,
      vigenciaDias: Number(days || 7),
    });
  };

  const approvePayment = () => {
    const digits = cardNumber.replace(/\D/g, '');
    const expiryMatch = expiry.match(/^(\d{2})\/(\d{2})$/);
    const month = expiryMatch ? Number(expiryMatch[1]) : 0;
    const securityCode = cvv.replace(/\D/g, '');

    if (!token) {
      setError('No se encontro la orden de pago.');
      return;
    }

    if (digits.length < 15 || digits.length > 16) {
      setError('Ingresa un numero de tarjeta valido.');
      return;
    }

    if (!expiryMatch || month < 1 || month > 12) {
      setError('Ingresa un vencimiento valido con formato MM/AA.');
      return;
    }

    if (securityCode.length < 3 || securityCode.length > 4) {
      setError('Ingresa un CVV valido.');
      return;
    }

    setError('');
    setStatus('authorizing');

    window.setTimeout(async () => {
      try {
        if (notifyPreviousPage()) {
          clearPendingContext();
          setStatus('approved');
          return;
        }

        const response = await fallbackActivatePlan();
        if (response?.status !== 'Success') {
          throw new Error(response?.details || response?.message || 'No se pudo activar el patrocinio.');
        }

        clearPendingContext();
        setStatus('approved');
      } catch (paymentError) {
        setStatus('idle');
        setError(paymentError.message || 'No se pudo autorizar el pago.');
      }
    }, 1100);
  };

  const handleCardNumberChange = (event) => {
    const digits = event.target.value.replace(/\D/g, '').slice(0, 16);
    setCardNumber(digits.replace(/(\d{4})(?=\d)/g, '$1 '));
  };

  const handleExpiryChange = (event) => {
    const digits = event.target.value.replace(/\D/g, '').slice(0, 4);
    setExpiry(digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits);
  };

  const returnToArriendU = () => {
    if (notifyPreviousPage()) {
      window.opener.focus();
      window.setTimeout(() => window.close(), 120);
      return;
    }

    window.location.assign(returnTo);
  };

  const isAuthorizing = status === 'authorizing';
  const isApproved = status === 'approved';

  return (
    <main style={styles.page}>
      <section style={styles.shell}>
        <div style={styles.brandPanel}>
          <div style={styles.logoRow}>
            <div style={styles.logoMark}>P</div>
            <div>
              <p style={styles.kicker}>Pasarela de pagos</p>
              <h1 style={styles.title}>Pago protegido</h1>
            </div>
          </div>

          <div style={styles.previewCard}>
            <div style={styles.cardTop}>
              <span>ArriendU</span>
              <CreditCard size={22} />
            </div>
            <p style={styles.cardNumber}>{cardNumber || 'Numero de tarjeta'}</p>
            <div style={styles.cardBottom}>
              <span>Vence {expiry || 'MM/AA'}</span>
              <span>CLP</span>
            </div>
          </div>

          <div style={styles.trustList}>
            <span style={styles.trustItem}><ShieldCheck size={16} /> Comercio verificado</span>
            <span style={styles.trustItem}><LockKeyhole size={16} /> Datos protegidos</span>
          </div>
        </div>

        <div style={styles.checkoutPanel}>
          <header style={styles.header}>
            <div>
              <span style={styles.secureBadge}>Autorizacion segura</span>
              <h2 style={styles.checkoutTitle}>{isApproved ? 'Pago autorizado' : 'Confirma tu tarjeta'}</h2>
            </div>
          </header>

          {isApproved ? (
            <section style={styles.approvedBox}>
              <div style={styles.checkCircle}><CheckCircle2 size={42} /></div>
              <h3 style={styles.approvedTitle}>Listo, pago autorizado</h3>
              <p style={styles.approvedText}>Sigue el proceso desde la pagina anterior.</p>
              <p style={styles.approvedHint}>El plan se activara en ArriendU. Si esta ventana quedo sola, volveras a la aplicacion.</p>
              <button type="button" style={styles.primaryButton} onClick={returnToArriendU}>
                <ArrowLeft size={18} />
                Volver a ArriendU
              </button>
            </section>
          ) : (
            <>
              <section style={styles.summaryBox}>
                <div style={styles.summaryRow}>
                  <span>Comercio</span>
                  <strong>ArriendU</strong>
                </div>
                <div style={styles.summaryRow}>
                  <span>Publicacion</span>
                  <strong>{title}</strong>
                </div>
                <div style={styles.summaryRow}>
                  <span>Plan</span>
                  <strong>{plan}{days ? ` (${days} dias)` : ''}</strong>
                </div>
                <div style={styles.totalRow}>
                  <span>Total</span>
                  <strong>{formatAmount(amount)}</strong>
                </div>
              </section>

              <section style={styles.formBox}>
                <label style={styles.field}>
                  <span style={styles.label}>Numero de tarjeta</span>
                  <input
                    style={styles.input}
                    inputMode="numeric"
                    maxLength={19}
                    placeholder="Ingresa tu tarjeta"
                    value={cardNumber}
                    onChange={handleCardNumberChange}
                    disabled={isAuthorizing}
                  />
                </label>

                <div style={styles.fieldGrid}>
                  <label style={styles.field}>
                    <span style={styles.label}>Vencimiento</span>
                    <input
                      style={styles.input}
                      inputMode="numeric"
                      maxLength={5}
                      placeholder="MM/AA"
                      value={expiry}
                      onChange={handleExpiryChange}
                      disabled={isAuthorizing}
                    />
                  </label>
                  <label style={styles.field}>
                    <span style={styles.label}>CVV</span>
                    <input
                      style={styles.input}
                      inputMode="numeric"
                      maxLength={4}
                      placeholder="CVV"
                      value={cvv}
                      onChange={(event) => setCvv(event.target.value.replace(/\D/g, '').slice(0, 4))}
                      disabled={isAuthorizing}
                    />
                  </label>
                </div>

                {error && <p style={styles.error}>{error}</p>}

                <button
                  type="button"
                  style={{
                    ...styles.primaryButton,
                    ...(isAuthorizing ? styles.primaryButtonDisabled : {}),
                  }}
                  onClick={approvePayment}
                  disabled={isAuthorizing}
                >
                  <LockKeyhole size={17} />
                  {isAuthorizing ? 'Autorizando pago' : `Pagar ${formatAmount(amount)}`}
                </button>
              </section>
            </>
          )}
        </div>
      </section>
    </main>
  );
};

const styles = {
  page: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #f7faf9 0%, #eef7f5 48%, #f8fbff 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '28px',
    fontFamily: "'Inter', 'Aptos', 'Segoe UI', system-ui, -apple-system, sans-serif",
    color: '#172033',
  },
  shell: {
    width: 'min(980px, 100%)',
    minHeight: '620px',
    display: 'grid',
    gridTemplateColumns: '0.95fr 1.05fr',
    background: 'rgba(255,255,255,0.98)',
    border: '1px solid #dbe7ea',
    borderRadius: '24px',
    boxShadow: '0 28px 70px rgba(29, 45, 57, 0.14)',
    overflow: 'hidden',
  },
  brandPanel: {
    position: 'relative',
    padding: '34px',
    color: '#ffffff',
    background: 'linear-gradient(145deg, #123c46 0%, #0f766e 54%, #172554 100%)',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    gap: '28px',
  },
  logoRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
  },
  logoMark: {
    width: '48px',
    height: '48px',
    borderRadius: '15px',
    background: '#ffffff',
    color: '#b91c1c',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '25px',
    fontWeight: 800,
    boxShadow: '0 12px 26px rgba(7, 20, 26, 0.18)',
  },
  kicker: {
    margin: '0 0 4px',
    color: '#b7f4e8',
    fontSize: '12px',
    fontWeight: 800,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
  },
  title: {
    margin: 0,
    fontSize: '30px',
    fontWeight: 800,
    lineHeight: 1.08,
  },
  previewCard: {
    position: 'relative',
    overflow: 'hidden',
    borderRadius: '22px',
    padding: '24px',
    minHeight: '210px',
    background: 'linear-gradient(135deg, rgba(255,255,255,0.2), rgba(5, 45, 52, 0.22))',
    border: '1px solid rgba(255,255,255,0.28)',
    boxShadow: '0 24px 46px rgba(7, 29, 37, 0.24)',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  cardTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontWeight: 800,
    fontSize: '17px',
  },
  cardNumber: {
    margin: 0,
    fontSize: '22px',
    fontWeight: 800,
    letterSpacing: '0.06em',
  },
  cardBottom: {
    display: 'flex',
    justifyContent: 'space-between',
    color: '#d7fbf4',
    fontSize: '12px',
    fontWeight: 700,
    textTransform: 'uppercase',
  },
  trustList: {
    display: 'grid',
    gap: '10px',
  },
  trustItem: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    color: '#d7fbf4',
    fontSize: '13px',
    fontWeight: 700,
  },
  checkoutPanel: {
    padding: '34px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    gap: '20px',
  },
  header: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: '16px',
  },
  secureBadge: {
    display: 'inline-flex',
    width: 'fit-content',
    border: '1px solid #bdeee4',
    background: '#eefdf8',
    borderRadius: '999px',
    padding: '7px 10px',
    color: '#0f766e',
    fontSize: '11px',
    fontWeight: 800,
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    whiteSpace: 'nowrap',
  },
  checkoutTitle: {
    margin: '12px 0 0',
    color: '#172033',
    fontSize: '30px',
    fontWeight: 800,
    lineHeight: 1.12,
  },
  summaryBox: {
    border: '1px solid #dde8eb',
    borderRadius: '18px',
    padding: '8px 18px',
    background: '#f8fbfc',
  },
  summaryRow: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '14px',
    padding: '12px 0',
    borderBottom: '1px solid #e3ebee',
    color: '#566477',
    fontSize: '14px',
  },
  totalRow: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '14px',
    padding: '15px 0 10px',
    color: '#172033',
    fontSize: '15px',
    fontWeight: 800,
  },
  formBox: {
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
  },
  fieldGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '12px',
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  label: {
    color: '#566477',
    fontSize: '11px',
    fontWeight: 800,
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
  },
  input: {
    width: '100%',
    boxSizing: 'border-box',
    border: '1.5px solid #d8e3e7',
    borderRadius: '13px',
    background: '#ffffff',
    color: '#172033',
    fontSize: '15px',
    padding: '13px 14px',
    outline: 'none',
  },
  error: {
    margin: 0,
    color: '#dc2626',
    fontSize: '13px',
    fontWeight: 800,
  },
  primaryButton: {
    border: 'none',
    borderRadius: '14px',
    padding: '14px 18px',
    background: 'linear-gradient(135deg, #0f766e 0%, #0b625d 100%)',
    color: '#ffffff',
    fontSize: '15px',
    fontWeight: 800,
    cursor: 'pointer',
    boxShadow: '0 14px 28px rgba(15,118,110,0.22)',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '9px',
  },
  primaryButtonDisabled: {
    opacity: 0.72,
    cursor: 'wait',
  },
  approvedBox: {
    padding: '34px 12px 10px',
    textAlign: 'center',
  },
  checkCircle: {
    width: '84px',
    height: '84px',
    borderRadius: '50%',
    margin: '0 auto 20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#ddf8ee',
    color: '#15803d',
  },
  approvedTitle: {
    margin: '0 0 8px',
    fontSize: '28px',
    fontWeight: 800,
  },
  approvedText: {
    margin: '0 0 6px',
    color: '#172033',
    fontSize: '16px',
    fontWeight: 700,
  },
  approvedHint: {
    maxWidth: '420px',
    margin: '0 auto 24px',
    color: '#64748b',
    fontSize: '13px',
    lineHeight: 1.45,
  },
};

export default PasarelaPagos;
