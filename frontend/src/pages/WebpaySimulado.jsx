import { useMemo, useState } from 'react';

const WEBPAY_APPROVED_MESSAGE = 'ARRENDU_WEBPAY_APPROVED';

const formatAmount = (value) => {
  const amount = Number(value || 0);
  return amount > 0 ? `$${amount.toLocaleString('es-CL')}` : '$0';
};

const WebpaySimulado = () => {
  const searchParams = useMemo(() => new URLSearchParams(window.location.search), []);
  const token = searchParams.get('token') || '';
  const plan = searchParams.get('plan') || 'Plan promocional';
  const amount = searchParams.get('amount') || '0';
  const days = searchParams.get('days') || '';
  const title = searchParams.get('title') || 'Publicacion';
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');

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

    window.setTimeout(() => {
      window.opener?.postMessage({
        type: WEBPAY_APPROVED_MESSAGE,
        token,
        approved: true,
      }, window.location.origin);
      setStatus('approved');
    }, 1200);
  };

  const handleCardNumberChange = (event) => {
    const digits = event.target.value.replace(/\D/g, '').slice(0, 16);
    setCardNumber(digits.replace(/(\d{4})(?=\d)/g, '$1 '));
  };

  const handleExpiryChange = (event) => {
    const digits = event.target.value.replace(/\D/g, '').slice(0, 4);
    setExpiry(digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits);
  };

  const focusPreviousPage = () => {
    window.opener?.focus();
  };

  return (
    <main style={styles.page}>
      <section style={styles.shell}>
        <header style={styles.header}>
          <div>
            <p style={styles.kicker}>WebPay Plus</p>
            <h1 style={styles.title}>Pago con tarjeta</h1>
          </div>
          <span style={styles.secureBadge}>Entorno de prueba</span>
        </header>

        {status === 'approved' ? (
          <section style={styles.approvedBox}>
            <div style={styles.checkCircle}>OK</div>
            <h2 style={styles.approvedTitle}>Pago autorizado</h2>
            <p style={styles.approvedText}>Sigue el proceso desde la pagina anterior.</p>
            <p style={styles.approvedHint}>El plan se activara en ArriendU y podras cerrar esta ventana.</p>
            <button type="button" style={styles.primaryButton} onClick={focusPreviousPage}>
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
              <div style={styles.summaryRow}>
                <span>Total</span>
                <strong style={styles.amount}>{formatAmount(amount)}</strong>
              </div>
            </section>

            <section style={styles.formBox}>
              <label style={styles.field}>
                <span style={styles.label}>Numero de tarjeta</span>
                <input
                  style={styles.input}
                  inputMode="numeric"
                  maxLength={19}
                  placeholder="4242 4242 4242 4242"
                  value={cardNumber}
                  onChange={handleCardNumberChange}
                  disabled={status === 'authorizing'}
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
                    disabled={status === 'authorizing'}
                  />
                </label>
                <label style={styles.field}>
                  <span style={styles.label}>CVV</span>
                  <input
                    style={styles.input}
                    inputMode="numeric"
                    maxLength={4}
                    placeholder="123"
                    value={cvv}
                    onChange={(event) => setCvv(event.target.value.replace(/\D/g, '').slice(0, 4))}
                    disabled={status === 'authorizing'}
                  />
                </label>
              </div>

              {error && <p style={styles.error}>{error}</p>}

              <button
                type="button"
                style={{
                  ...styles.primaryButton,
                  ...(status === 'authorizing' ? styles.primaryButtonDisabled : {}),
                }}
                onClick={approvePayment}
                disabled={status === 'authorizing'}
              >
                {status === 'authorizing' ? 'Autorizando pago' : 'Pagar'}
              </button>
            </section>
          </>
        )}
      </section>
    </main>
  );
};

const styles = {
  page: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #f8fafc 0%, #fee2e2 42%, #f0fdfa 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '28px',
    fontFamily: "'Segoe UI', Roboto, sans-serif",
    color: '#0f172a',
  },
  shell: {
    width: 'min(480px, 100%)',
    background: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: '18px',
    boxShadow: '0 24px 60px rgba(15, 23, 42, 0.18)',
    overflow: 'hidden',
  },
  header: {
    background: 'linear-gradient(135deg, #c1121f 0%, #8f1119 72%, #24110f 100%)',
    color: '#ffffff',
    padding: '24px',
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: '16px',
  },
  kicker: {
    margin: '0 0 4px',
    color: '#fecaca',
    fontSize: '12px',
    fontWeight: 900,
    textTransform: 'uppercase',
    letterSpacing: '0.12em',
  },
  title: {
    margin: 0,
    fontSize: '28px',
    fontWeight: 900,
  },
  secureBadge: {
    border: '1px solid rgba(255,255,255,0.38)',
    borderRadius: '999px',
    padding: '7px 10px',
    color: '#fff',
    fontSize: '11px',
    fontWeight: 800,
    whiteSpace: 'nowrap',
  },
  summaryBox: {
    padding: '18px 24px 8px',
  },
  summaryRow: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '14px',
    padding: '11px 0',
    borderBottom: '1px solid #edf2f7',
    color: '#475569',
    fontSize: '14px',
  },
  amount: {
    color: '#c1121f',
    fontSize: '18px',
  },
  formBox: {
    padding: '18px 24px 24px',
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
    color: '#475569',
    fontSize: '11px',
    fontWeight: 900,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
  },
  input: {
    width: '100%',
    boxSizing: 'border-box',
    border: '1.5px solid #dbe4ee',
    borderRadius: '12px',
    background: '#f8fafc',
    color: '#0f172a',
    fontSize: '15px',
    padding: '12px 13px',
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
    borderRadius: '12px',
    padding: '13px 18px',
    background: '#0f766e',
    color: '#ffffff',
    fontSize: '15px',
    fontWeight: 900,
    cursor: 'pointer',
    boxShadow: '0 10px 22px rgba(15,118,110,0.22)',
  },
  primaryButtonDisabled: {
    opacity: 0.72,
    cursor: 'wait',
  },
  approvedBox: {
    padding: '42px 28px',
    textAlign: 'center',
  },
  checkCircle: {
    width: '72px',
    height: '72px',
    borderRadius: '50%',
    margin: '0 auto 18px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#dcfce7',
    color: '#15803d',
    fontSize: '40px',
    fontWeight: 900,
  },
  approvedTitle: {
    margin: '0 0 8px',
    fontSize: '26px',
    fontWeight: 900,
  },
  approvedText: {
    margin: '0 0 6px',
    color: '#0f172a',
    fontSize: '16px',
    fontWeight: 800,
  },
  approvedHint: {
    margin: '0 0 22px',
    color: '#64748b',
    fontSize: '13px',
  },
};

export default WebpaySimulado;
