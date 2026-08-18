import { useState, useEffect } from 'react';

/**
 * EcoCash Payment Component
 * 
 * Handles USSD-based EcoCash payments with platform-specific behavior:
 * - Android: Auto-dials the USSD code
 * - iPhone: Shows copy button + instructions (Apple blocks auto-dial)
 * - Universal: Manual code display as fallback
 */
export default function EcoCashPayment({
  totalPrice,
  ecocashType = 'agent',
  ecocashCode = '',
  ecocashPhone = '',
  buyerPhone = '',
  onPaymentConfirmed,
  onBack,
}) {
  const [phoneNumber, setPhoneNumber] = useState(buyerPhone || '');
  const [step, setStep] = useState('enter_phone');
  const [ussdCode, setUssdCode] = useState('');
  const [deviceType, setDeviceType] = useState('android');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const ua = navigator.userAgent.toLowerCase();
    setDeviceType(/iphone|ipad|ipod/.test(ua) ? 'iphone' : 'android');
  }, []);

  const buildUssdCode = () => {
    const amt = Number(totalPrice).toFixed(2);
    const code = (ecocashCode || '').replace(/[^0-9A-Za-z]/g, '').trim();
    if (ecocashType === 'agent') {
      return `*151*2*${code}*${amt}#`;
    }
    if (ecocashType === 'biller') {
      const ts = Date.now().toString(36).toUpperCase().slice(-4);
      const rand = Math.random().toString(36).toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4);
      return `*151*1*${code}*TF${ts}${rand}*${amt}#`;
    }
    if (ecocashType === 'number') {
      return `*151*2*2*${amt}*${ecocashPhone}#`;
    }
    return null;
  };

  const handlePayNow = () => {
    if (!phoneNumber || phoneNumber.length < 8) {
      alert('Please enter your EcoCash number');
      return;
    }
    const code = buildUssdCode();
    if (!code) { alert('EcoCash is not configured for this event'); return; }
    setUssdCode(code);
    if (deviceType === 'android') {
      window.location.href = `tel:${code.replace(/#/g, '%23')}`;
      setStep('processing');
    } else {
      setStep('iphone_instructions');
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(ussdCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = ussdCode;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const openDialer = () => {
    window.location.href = `tel:${ussdCode.replace(/#/g, '%23')}`;
  };

  const accent = '#10b981';
  const modeLabel = ecocashType === 'agent' ? 'Agent Code Payment'
    : ecocashType === 'biller' ? 'Biller Code Payment'
    : ecocashType === 'number' ? 'Send Money' : 'Mobile Payment';

  return (
    <div style={{
      background: 'var(--panel-bg, rgba(255,255,255,0.05))',
      borderRadius: '20px',
      padding: '24px',
      border: '1px solid var(--panel-border, rgba(255,255,255,0.1))',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
        <div style={{
          width: '40px', height: '40px', borderRadius: '12px',
          background: `linear-gradient(135deg, ${accent}, #06b6d4)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect>
            <line x1="12" y1="18" x2="12.01" y2="18"></line>
          </svg>
        </div>
        <div>
          <h3 style={{ fontFamily: "var(--font-display, 'Playfair Display', serif)", fontSize: '18px', fontWeight: 700, margin: 0 }}>
            Pay with EcoCash
          </h3>
          <p style={{ color: 'var(--text-muted, #ffffff80)', fontSize: '12px', margin: 0 }}>{modeLabel}</p>
        </div>
      </div>

      {/* STEP 1: Enter Phone Number */}
      {step === 'enter_phone' && (
        <div>
          <p style={{ color: 'var(--text-muted, #ffffff80)', fontSize: '14px', marginBottom: '16px', lineHeight: 1.6 }}>
            Enter the EcoCash number you want to pay from. A payment prompt will appear - just enter your PIN to complete.
          </p>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 600, color: 'var(--text, #fff)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Your EcoCash Number *
            </label>
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value.replace(/[^0-9]/g, ''))}
              placeholder="e.g., 0774401643"
              maxLength={10}
              style={{
                width: '100%', padding: '14px 16px',
                background: 'var(--input-bg, rgba(255,255,255,0.05))',
                border: '1px solid var(--panel-border, rgba(255,255,255,0.15))',
                borderRadius: '12px', color: 'var(--text, #fff)',
                fontSize: '15px', outline: 'none', boxSizing: 'border-box',
              }}
            />
            <p style={{ color: 'var(--text-dimmed, #ffffff40)', fontSize: '11px', marginTop: '8px' }}>
              Your PIN is never collected on this site - you enter it only on the EcoCash screen.
            </p>
          </div>

          <div style={{
            background: 'var(--input-bg, rgba(255,255,255,0.03))',
            borderRadius: '14px', padding: '16px', marginBottom: '20px',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <span style={{ color: 'var(--text-muted, #ffffff60)', fontSize: '14px' }}>Total Amount</span>
            <span style={{ fontSize: '24px', fontWeight: 800, color: accent, fontFamily: 'var(--font-display, inherit)' }}>
              ${Number(totalPrice).toFixed(2)}
            </span>
          </div>

          <button
            onClick={handlePayNow}
            disabled={!phoneNumber || phoneNumber.length < 8}
            style={{
              width: '100%',
              background: phoneNumber && phoneNumber.length >= 8 ? `linear-gradient(135deg, ${accent}, #06b6d4)` : 'var(--text-dimmed, #ffffff30)',
              color: 'white', border: 'none', padding: '16px', borderRadius: '14px',
              fontWeight: 700, fontSize: '16px',
              cursor: phoneNumber && phoneNumber.length >= 8 ? 'pointer' : 'not-allowed',
              transition: 'all 0.3s ease',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
            }}
          >
            Pay ${Number(totalPrice).toFixed(2)} - EcoCash
          </button>
        </div>
      )}

      {/* STEP 2: Android Processing */}
      {step === 'processing' && deviceType === 'android' && (
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <div style={{ marginBottom: '16px' }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect>
              <line x1="12" y1="18" x2="12.01" y2="18"></line>
            </svg>
          </div>
          <h4 style={{ fontSize: '18px', marginBottom: '12px', fontWeight: 700 }}>Check Your Phone</h4>
          <p style={{ color: 'var(--text-muted, #ffffff60)', fontSize: '14px', marginBottom: '20px', lineHeight: 1.6 }}>
            An EcoCash payment prompt should appear on your screen. Enter your PIN to complete the payment.
          </p>

          <div style={{ background: 'var(--input-bg, rgba(255,255,255,0.05))', borderRadius: '14px', padding: '16px', marginBottom: '20px' }}>
            <p style={{ color: 'var(--text-dimmed, #ffffff40)', fontSize: '12px', margin: '0 0 4px' }}>Amount to Pay</p>
            <p style={{ fontSize: '24px', fontWeight: 800, color: accent, margin: 0 }}>${Number(totalPrice).toFixed(2)}</p>
          </div>

          <button onClick={() => { setStep('confirm'); if (onPaymentConfirmed) onPaymentConfirmed(); }}
            style={{ width: '100%', background: `linear-gradient(135deg, ${accent}, #06b6d4)`, color: 'white', border: 'none', padding: '16px', borderRadius: '14px', fontWeight: 700, fontSize: '16px', cursor: 'pointer', marginBottom: '12px' }}>
            I Have Completed Payment
          </button>
          <button onClick={() => setStep('enter_phone')}
            style={{ width: '100%', background: 'transparent', color: 'var(--text-muted, #ffffff60)', border: '1px solid var(--panel-border, rgba(255,255,255,0.2))', padding: '14px', borderRadius: '14px', fontWeight: 600, fontSize: '14px', cursor: 'pointer' }}>
            Back
          </button>
        </div>
      )}

      {/* STEP 3: iPhone Instructions */}
      {step === 'iphone_instructions' && (
        <div style={{ padding: '10px 0' }}>
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <div style={{ marginBottom: '16px' }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect>
                <line x1="12" y1="18" x2="12.01" y2="18"></line>
              </svg>
            </div>
            <h4 style={{ fontSize: '18px', marginBottom: '8px', fontWeight: 700 }}>iPhone Payment</h4>
            <p style={{ color: 'var(--text-muted, #ffffff80)', fontSize: '14px', lineHeight: 1.6 }}>
              Follow these simple steps to complete your payment:
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
            <div style={{ background: 'var(--input-bg, rgba(255,255,255,0.05))', borderRadius: '14px', padding: '16px' }}>
              <p style={{ fontWeight: 700, marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ background: `linear-gradient(135deg, ${accent}, #06b6d4)`, color: 'white', width: '26px', height: '26px', borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 800 }}>1</span>
                Copy this payment code:
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <code style={{ background: 'var(--input-bg, rgba(0,0,0,0.3))', padding: '12px 14px', borderRadius: '10px', fontSize: '15px', color: accent, flex: 1, wordBreak: 'break-all', fontFamily: 'var(--font-mono, monospace)', fontWeight: 600 }}>
                  {ussdCode}
                </code>
                <button onClick={copyToClipboard}
                  style={{ background: copied ? `linear-gradient(135deg, ${accent}, #06b6d4)` : 'var(--input-bg, rgba(255,255,255,0.1))', color: 'white', border: 'none', padding: '12px 16px', borderRadius: '10px', cursor: 'pointer', fontWeight: 600, fontSize: '13px', whiteSpace: 'nowrap' }}>
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>

            <div style={{ background: 'var(--input-bg, rgba(255,255,255,0.05))', borderRadius: '14px', padding: '16px' }}>
              <p style={{ fontWeight: 700, marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ background: `linear-gradient(135deg, ${accent}, #06b6d4)`, color: 'white', width: '26px', height: '26px', borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 800 }}>2</span>
                Open your dialer:
              </p>
              <button onClick={openDialer}
                style={{ width: '100%', background: `linear-gradient(135deg, ${accent}, #06b6d4)`, color: 'white', border: 'none', padding: '14px', borderRadius: '12px', fontWeight: 700, fontSize: '15px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                Open Dialer with Code
              </button>
              <p style={{ color: 'var(--text-dimmed, #ffffff40)', fontSize: '12px', marginTop: '10px', lineHeight: 1.5 }}>
                Paste the code if it does not appear automatically, then tap Call. Enter your PIN when prompted.
              </p>
            </div>

            <div style={{ background: 'var(--input-bg, rgba(255,255,255,0.05))', borderRadius: '14px', padding: '16px' }}>
              <p style={{ fontWeight: 700, marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ background: `linear-gradient(135deg, ${accent}, #06b6d4)`, color: 'white', width: '26px', height: '26px', borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 800 }}>3</span>
                Complete the payment on your phone
              </p>
              <p style={{ color: 'var(--text-muted, #ffffff60)', fontSize: '13px', margin: 0, paddingLeft: '36px' }}>
                Enter your EcoCash PIN when prompted, then return here.
              </p>
            </div>
          </div>

          <button onClick={() => { setStep('confirm'); if (onPaymentConfirmed) onPaymentConfirmed(); }}
            style={{ width: '100%', background: `linear-gradient(135deg, ${accent}, #06b6d4)`, color: 'white', border: 'none', padding: '16px', borderRadius: '14px', fontWeight: 700, fontSize: '16px', cursor: 'pointer', marginBottom: '12px' }}>
            I Have Completed Payment
          </button>
          <button onClick={() => setStep('enter_phone')}
            style={{ width: '100%', background: 'transparent', color: 'var(--text-muted, #ffffff60)', border: '1px solid var(--panel-border, rgba(255,255,255,0.2))', padding: '14px', borderRadius: '14px', fontWeight: 600, fontSize: '14px', cursor: 'pointer' }}>
            Back
          </button>
        </div>
      )}

      {/* STEP 4: Confirmation */}
      {step === 'confirm' && (
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <div style={{
            width: '72px', height: '72px', borderRadius: '50%',
            background: `linear-gradient(135deg, ${accent}, #06b6d4)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 20px',
          }}>
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          </div>
          <h4 style={{ fontSize: '20px', marginBottom: '10px', fontWeight: 700 }}>Payment Confirmation</h4>
          <p style={{ color: 'var(--text-muted, #ffffff60)', fontSize: '14px', marginBottom: '20px', lineHeight: 1.6 }}>
            Please confirm that your payment was successful.
          </p>
          <div style={{ background: 'var(--input-bg, rgba(255,255,255,0.05))', borderRadius: '14px', padding: '16px', marginBottom: '20px' }}>
            <p style={{ color: 'var(--text-dimmed, #ffffff40)', fontSize: '12px', margin: '0 0 4px' }}>Amount Paid</p>
            <p style={{ fontSize: '24px', fontWeight: 800, color: accent, margin: 0 }}>${Number(totalPrice).toFixed(2)}</p>
          </div>
          <button onClick={() => { if (onPaymentConfirmed) onPaymentConfirmed(); }}
            style={{ width: '100%', background: `linear-gradient(135deg, ${accent}, #06b6d4)`, color: 'white', border: 'none', padding: '16px', borderRadius: '14px', fontWeight: 700, fontSize: '16px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            Confirm Payment &amp; Get Tickets
          </button>
        </div>
      )}

      {/* Manual Fallback */}
      {step !== 'confirm' && ussdCode && (
        <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px dashed var(--panel-border, rgba(255,255,255,0.1))' }}>
          <p style={{ fontSize: '12px', color: 'var(--text-dimmed, #ffffff40)', textAlign: 'center', margin: 0 }}>
            Having trouble? Manually dial this code: <strong style={{ color: 'var(--text, #fff)' }}>{ussdCode}</strong>
          </p>
        </div>
      )}
    </div>
  );
}
