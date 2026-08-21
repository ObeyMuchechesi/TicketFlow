import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * EcoCash Payment Component
 * 
 * Supports TWO payment flows:
 *   1. Paynow Push (NEW) — payment prompt sent directly to the phone, no dialing needed
 *   2. USSD Manual — customer dials the code themselves (Android/iPhone)
 *   3. Screenshot upload with AI OCR as fallback
 *   4. Manual reference entry as fallback
 */
export default function EcoCashPayment({
  totalPrice,
  ecocashType = 'agent',
  ecocashCode = '',
  ecocashPhone = '',
  buyerPhone = '',
  ticketToken = '',
  onPaymentConfirmed,
  onBack,
}) {
  const [phoneNumber, setPhoneNumber] = useState(buyerPhone || '');
  const [step, setStep] = useState('choose_method'); // choose_method | enter_phone | paynow_push | paynow_waiting | processing | iphone_instructions | verify_proof | confirmed
  const [paymentMethod, setPaymentMethod] = useState(''); // 'paynow' or 'ussd'
  const [ussdCode, setUssdCode] = useState('');
  const [deviceType, setDeviceType] = useState('android');
  const [copied, setCopied] = useState(false);

  // Screenshot & OCR state
  const [screenshot, setScreenshot] = useState(null);
  const [screenshotPreview, setScreenshotPreview] = useState(null);
  const [ocrProcessing, setOcrProcessing] = useState(false);
  const [ocrResult, setOcrResult] = useState('');
  const [ocrConfidence, setOcrConfidence] = useState(0);
  const [ocrError, setOcrError] = useState('');
  const [extractedRef, setExtractedRef] = useState('');
  const [extractedAmount, setExtractedAmount] = useState('');
  const [verifyMethod, setVerifyMethod] = useState('');
  const fileInputRef = useRef(null);
  const tesseractWorkerRef = useRef(null);

  // Manual reference state
  const [transactionRef, setTransactionRef] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState('');
  const [uploading, setUploading] = useState(false);

  // Paynow push state
  const [paynowLoading, setPaynowLoading] = useState(false);
  const [paynowError, setPaynowError] = useState('');
  const [paynowInstructions, setPaynowInstructions] = useState('');
  const [paynowReference, setPaynowReference] = useState('');
  const pollRef = useRef(null);

  useEffect(() => {
    const ua = navigator.userAgent.toLowerCase();
    setDeviceType(/iphone|ipad|ipod/.test(ua) ? 'iphone' : 'android');
  }, []);

  // Cleanup tesseract worker on unmount
  useEffect(() => {
    return () => {
      if (tesseractWorkerRef.current) {
        tesseractWorkerRef.current.terminate();
      }
      if (pollRef.current) {
        clearInterval(pollRef.current);
      }
    };
  }, []);

  const buildUssdCode = () => {
    const amt = Math.round(Number(totalPrice));
    const code = (ecocashCode || '').replace(/[^0-9A-Za-z]/g, '').trim();
    if (ecocashType === 'agent') {
      return `*153*2*2${code}*${amt}#`;
    }
    if (ecocashType === 'biller') {
      const ts = Date.now().toString(36).toUpperCase().slice(-4);
      const rand = Math.random().toString(36).toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4);
      return `*153*1*1*${code}*TF${ts}${rand}*${amt}#`;
    }
    if (ecocashType === 'number') {
      return `*153*1*1*${ecocashPhone}*${amt}#`;
    }
    return null;
  };

  // ─── Paynow Push: send payment prompt to phone ────────────────
  const handlePaynowPush = async () => {
    if (!phoneNumber || phoneNumber.length < 8) {
      setPaynowError('Please enter your EcoCash number');
      return;
    }
    setPaynowLoading(true);
    setPaynowError('');
    setStep('paynow_push');

    try {
      const res = await fetch('/api/tickets/paynow-init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticketToken, buyerPhone: phoneNumber }),
      });

      const data = await res.json();
      if (!res.ok) {
        setPaynowError(data.error || 'Failed to start payment');
        setPaynowLoading(false);
        setStep('enter_phone');
        return;
      }

      setPaynowInstructions(data.instructions || '');
      setPaynowReference(data.reference || '');
      setPaynowLoading(false);
      setStep('paynow_waiting');

      // Start polling for payment confirmation
      startPolling();
    } catch {
      setPaynowError('Network error. Please try again.');
      setPaynowLoading(false);
      setStep('enter_phone');
    }
  };

  // Poll the ticket status every 3 seconds
  const startPolling = useCallback(() => {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/tickets/paynow-status?token=${ticketToken}`);
        const data = await res.json();
        if (data.paid || data.status === 'active') {
          clearInterval(pollRef.current);
          pollRef.current = null;
          setStep('confirmed');
          if (onPaymentConfirmed) onPaymentConfirmed();
        }
      } catch {
        // Ignore polling errors — keep trying
      }
    }, 3000);
  }, [ticketToken, onPaymentConfirmed]);

  // ─── USSD Manual: dial the code yourself ──────────────────────
  const handlePayNowUSSD = () => {
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

  const handleScreenshotSelect = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setOcrError('Please select an image file (JPG, PNG, etc.)');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setOcrError('Image must be less than 10MB');
      return;
    }

    setOcrError('');
    setOcrResult('');
    setOcrConfidence(0);
    setExtractedRef('');
    setExtractedAmount('');

    const reader = new FileReader();
    reader.onload = (ev) => {
      setScreenshot(ev.target.result);
      setScreenshotPreview(ev.target.result);
      processOCR(ev.target.result);
    };
    reader.readAsDataURL(file);
  }, []);

  const processOCR = async (imageData) => {
    setOcrProcessing(true);
    setOcrError('');
    setOcrResult('');
    setExtractedRef('');
    setExtractedAmount('');

    try {
      const Tesseract = (await import('tesseract.js')).default;
      const { data } = await Tesseract.recognize(imageData, 'eng');
      const text = data.text || '';
      setOcrResult(text);
      setOcrConfidence(Math.round(data.confidence || 0));

      const parsed = parseEcoCashText(text);
      if (parsed.reference) setExtractedRef(parsed.reference);
      if (parsed.amount) setExtractedAmount(parsed.amount);

      if (!parsed.reference) {
        setOcrError('Could not auto-detect the transaction reference. Please enter it manually below, or try a clearer screenshot.');
      }
    } catch (err) {
      console.error('OCR error:', err);
      setOcrError('Failed to process the image. Please enter the reference manually.');
    }
    setOcrProcessing(false);
  };

  const parseEcoCashText = (text) => {
    const result = { reference: '', amount: '', phone: '' };
    const normalized = text.replace(/\s+/g, ' ').trim();

    const refPatterns = [
      /(?:ref(?:erence)?|txn|transaction|id)[:\s#]*([A-Z0-9]{4,20})/i,
      /\b(TF[A-Z0-9]{4,16})\b/i,
      /\b(TX[A-Z0-9]{4,16})\b/i,
      /\b([A-Z0-9]{8,20})\b/,
    ];
    for (const pattern of refPatterns) {
      const match = normalized.match(pattern);
      if (match) { result.reference = match[1]; break; }
    }

    const amountPatterns = [
      /(?:amount|total|paid)[:\s]*\$?([\d,]+\.?\d*)/i,
      /\$([\d,]+\.?\d*)/,
      /\b(USD?\s*[\d,]+\.?\d*)\b/i,
    ];
    for (const pattern of amountPatterns) {
      const match = normalized.match(pattern);
      if (match) { result.amount = match[1].replace(/,/g, ''); break; }
    }

    const phoneMatch = normalized.match(/\b(07[0-9]{8})\b/);
    if (phoneMatch) result.phone = phoneMatch[1];

    return result;
  };

  const verifyPayment = async () => {
    const ref = verifyMethod === 'screenshot' ? extractedRef : transactionRef.trim();

    if (!ref) {
      setVerifyError(verifyMethod === 'screenshot'
        ? 'Please upload a screenshot or enter the reference manually'
        : 'Please enter the transaction reference from your EcoCash SMS');
      return;
    }

    setVerifying(true);
    setVerifyError('');
    setUploading(true);

    try {
      const body = { token: ticketToken, extractedRef: ref, extractedAmount: extractedAmount || null };
      if (screenshot && verifyMethod === 'screenshot') body.screenshot = screenshot;

      const res = await fetch('/api/tickets/verify-screenshot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) {
        setVerifyError(data.error || 'Verification failed');
        setVerifying(false);
        setUploading(false);
        return;
      }

      setStep('confirmed');
      if (onPaymentConfirmed) onPaymentConfirmed();
    } catch {
      setVerifyError('Network error. Please try again.');
    }
    setVerifying(false);
    setUploading(false);
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

      {/* ═══════ STEP: Choose Payment Method ═══════ */}
      {step === 'choose_method' && (
        <div>
          <p style={{ color: 'var(--text-muted, #ffffff80)', fontSize: '14px', marginBottom: '16px', lineHeight: 1.6 }}>
            Choose how you'd like to pay with EcoCash:
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
            {/* Paynow Push Option — recommended */}
            <button
              onClick={() => { setPaymentMethod('paynow'); setStep('enter_phone'); }}
              style={{
                width: '100%', padding: '18px 16px', borderRadius: '16px',
                background: 'linear-gradient(135deg, rgba(16,185,129,0.12), rgba(6,182,212,0.12))',
                border: `2px solid ${accent}`,
                cursor: 'pointer', textAlign: 'left',
                display: 'flex', alignItems: 'center', gap: '14px',
                transition: 'all 0.2s',
              }}
            >
              <div style={{
                width: '48px', height: '48px', borderRadius: '14px',
                background: `linear-gradient(135deg, ${accent}, #06b6d4)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 2L11 13"></path>
                  <path d="M22 2L15 22L11 13L2 9L22 2Z"></path>
                </svg>
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '15px', color: 'var(--text, #fff)', marginBottom: '2px' }}>
                  ⚡ Pay Instantly (Recommended)
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted, #ffffff60)', lineHeight: 1.5 }}>
                  Payment prompt sent directly to your phone. Just enter your PIN — no dialing needed.
                </div>
              </div>
              <Badge variant="success" style={{ marginLeft: 'auto', fontSize: '10px' }}>FAST</Badge>
            </button>

            {/* USSD Manual Option */}
            <button
              onClick={() => { setPaymentMethod('ussd'); setStep('enter_phone'); }}
              style={{
                width: '100%', padding: '18px 16px', borderRadius: '16px',
                background: 'var(--panel-bg, rgba(255,255,255,0.03))',
                border: '1px solid var(--panel-border, rgba(255,255,255,0.15))',
                cursor: 'pointer', textAlign: 'left',
                display: 'flex', alignItems: 'center', gap: '14px',
                transition: 'all 0.2s',
              }}
            >
              <div style={{
                width: '48px', height: '48px', borderRadius: '14px',
                background: 'rgba(99,102,241,0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--text-muted, #fff)' }}>
                  <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path>
                  <polyline points="10 17 15 12 10 7"></polyline>
                  <line x1="15" y1="12" x2="3" y2="12"></line>
                </svg>
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '15px', color: 'var(--text, #fff)', marginBottom: '2px' }}>
                  📱 Dial USSD Code Manually
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted, #ffffff60)', lineHeight: 1.5 }}>
                  You dial the payment code yourself. Enter the transaction reference after paying.
                </div>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* ═══════ STEP: Enter Phone Number (shared) ═══════ */}
      {step === 'enter_phone' && (
        <div>
          <p style={{ color: 'var(--text-muted, #ffffff80)', fontSize: '14px', marginBottom: '16px', lineHeight: 1.6 }}>
            {paymentMethod === 'paynow'
              ? 'Enter your EcoCash number. We\'ll send a payment prompt directly to your phone.'
              : 'Enter the EcoCash number you want to pay from. A payment prompt will appear — just enter your PIN to complete.'}
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
              Your PIN is never collected on this site — you enter it only on the EcoCash screen.
            </p>
          </div>

          <div style={{
            background: 'var(--input-bg, rgba(255,255,255,0.03))',
            borderRadius: '14px', padding: '16px', marginBottom: '20px',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <span style={{ color: 'var(--text-muted, #ffffff60)', fontSize: '14px' }}>Total Amount</span>
            <span style={{ fontSize: '24px', fontWeight: 800, color: accent, fontFamily: 'var(--font-display, inherit)' }}>
              ${Math.round(Number(totalPrice))}
            </span>
          </div>

          {/* Paynow Push button */}
          {paymentMethod === 'paynow' && (
            <button
              onClick={handlePaynowPush}
              disabled={!phoneNumber || phoneNumber.length < 8 || paynowLoading}
              style={{
                width: '100%',
                background: phoneNumber && phoneNumber.length >= 8 ? `linear-gradient(135deg, ${accent}, #06b6d4)` : 'var(--text-dimmed, #ffffff30)',
                color: 'white', border: 'none', padding: '16px', borderRadius: '14px',
                fontWeight: 700, fontSize: '16px',
                cursor: phoneNumber && phoneNumber.length >= 8 ? 'pointer' : 'not-allowed',
                transition: 'all 0.3s ease',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                marginBottom: '10px',
              }}
            >
              {paynowLoading ? (
                <>
                  <div style={{ width: '18px', height: '18px', borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', animation: 'spin 1s linear infinite' }} />
                  Sending Payment Prompt...
                </>
              ) : (
                <>⚡ Pay ${Math.round(Number(totalPrice))} — Instant</>
              )}
            </button>
          )}

          {/* USSD Manual button */}
          {paymentMethod === 'ussd' && (
            <button
              onClick={handlePayNowUSSD}
              disabled={!phoneNumber || phoneNumber.length < 8}
              style={{
                width: '100%',
                background: phoneNumber && phoneNumber.length >= 8 ? `linear-gradient(135deg, ${accent}, #06b6d4)` : 'var(--text-dimmed, #ffffff30)',
                color: 'white', border: 'none', padding: '16px', borderRadius: '14px',
                fontWeight: 700, fontSize: '16px',
                cursor: phoneNumber && phoneNumber.length >= 8 ? 'pointer' : 'not-allowed',
                transition: 'all 0.3s ease',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                marginBottom: '10px',
              }}
            >
              Pay ${Math.round(Number(totalPrice))} — EcoCash
            </button>
          )}

          {/* Error display */}
          {paynowError && (
            <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#fca5a5', padding: '12px', borderRadius: '10px', fontSize: '13px', marginBottom: '12px' }}>
              {paynowError}
            </div>
          )}

          <button onClick={() => setStep('choose_method')}
            style={{ width: '100%', background: 'transparent', color: 'var(--text-muted, #ffffff60)', border: '1px solid var(--panel-border, rgba(255,255,255,0.2))', padding: '14px', borderRadius: '14px', fontWeight: 600, fontSize: '14px', cursor: 'pointer' }}>
            ← Back
          </button>
        </div>
      )}

      {/* ═══════ STEP: Paynow Push — Waiting for Payment ═══════ */}
      {step === 'paynow_push' && paynowLoading && (
        <div style={{ textAlign: 'center', padding: '30px 0' }}>
          <div style={{
            width: '64px', height: '64px', borderRadius: '50%',
            border: '4px solid rgba(16,185,129,0.2)',
            borderTopColor: accent,
            animation: 'spin 1s linear infinite',
            margin: '0 auto 20px',
          }} />
          <h4 style={{ fontSize: '18px', marginBottom: '10px', fontWeight: 700 }}>Sending Payment Prompt...</h4>
          <p style={{ color: 'var(--text-muted, #ffffff60)', fontSize: '14px' }}>
            Connecting to Paynow to send a payment prompt to your phone.
          </p>
        </div>
      )}

      {/* ═══════ STEP: Paynow Push — Waiting for user to confirm on phone ═══════ */}
      {step === 'paynow_waiting' && (
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <div style={{ marginBottom: '16px' }}>
            <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke={accent} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect>
              <line x1="12" y1="18" x2="12.01" y2="18"></line>
            </svg>
          </div>
          <h4 style={{ fontSize: '20px', marginBottom: '10px', fontWeight: 700 }}>Check Your Phone</h4>
          <p style={{ color: 'var(--text-muted, #ffffff80)', fontSize: '14px', marginBottom: '20px', lineHeight: 1.6 }}>
            An EcoCash payment prompt has been sent to <strong>{phoneNumber}</strong>.<br />
            Enter your PIN on your phone to complete the payment.
          </p>

          {paynowInstructions && (
            <div style={{
              background: 'rgba(16,185,129,0.08)', borderRadius: '14px',
              padding: '16px', marginBottom: '20px',
              border: '1px dashed rgba(16,185,129,0.35)',
            }}>
              <p style={{ fontSize: '11px', fontWeight: 700, color: '#059669', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>
                Payment Instructions
              </p>
              <p style={{ fontSize: '13px', color: 'var(--text, #fff)', lineHeight: 1.6, whiteSpace: 'pre-line' }}>
                {paynowInstructions}
              </p>
            </div>
          )}

          <div style={{
            background: 'var(--input-bg, rgba(255,255,255,0.05))', borderRadius: '14px', padding: '16px', marginBottom: '20px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ color: 'var(--text-muted, #ffffff60)', fontSize: '13px' }}>Amount</span>
              <span style={{ fontSize: '20px', fontWeight: 800, color: accent }}>${Math.round(Number(totalPrice))}</span>
            </div>
            {paynowReference && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-muted, #ffffff60)', fontSize: '13px' }}>Reference</span>
                <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text, #fff)', fontFamily: 'var(--font-mono, monospace)' }}>{paynowReference}</span>
              </div>
            )}
          </div>

          {/* Polling indicator */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            padding: '12px', borderRadius: '12px',
            background: 'rgba(16,185,129,0.06)', marginBottom: '16px',
          }}>
            <div style={{
              width: '8px', height: '8px', borderRadius: '50%',
              background: accent, animation: 'pulse 1.5s ease-in-out infinite',
            }} />
            <span style={{ fontSize: '13px', color: accent, fontWeight: 600 }}>Waiting for payment confirmation...</span>
          </div>

          <p style={{ color: 'var(--text-dimmed, #ffffff40)', fontSize: '11px', lineHeight: 1.5 }}>
            This page will update automatically once your payment is confirmed.<br />
            This usually takes less than 30 seconds.
          </p>

          <button onClick={() => { if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; } setStep('enter_phone'); }}
            style={{ width: '100%', marginTop: '16px', background: 'transparent', color: 'var(--text-muted, #ffffff60)', border: '1px solid var(--panel-border, rgba(255,255,255,0.2))', padding: '14px', borderRadius: '14px', fontWeight: 600, fontSize: '14px', cursor: 'pointer' }}>
            Cancel & Try Again
          </button>
        </div>
      )}

      {/* ═══════ STEP: Android Processing ═══════ */}
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
            <p style={{ fontSize: '24px', fontWeight: 800, color: accent, margin: 0 }}>${Math.round(Number(totalPrice))}</p>
          </div>

          <button onClick={() => setStep('verify_proof')}
            style={{ width: '100%', background: `linear-gradient(135deg, ${accent}, #06b6d4)`, color: 'white', border: 'none', padding: '16px', borderRadius: '14px', fontWeight: 700, fontSize: '16px', cursor: 'pointer', marginBottom: '12px' }}>
            I Have Completed Payment
          </button>
          <button onClick={() => setStep('enter_phone')}
            style={{ width: '100%', background: 'transparent', color: 'var(--text-muted, #ffffff60)', border: '1px solid var(--panel-border, rgba(255,255,255,0.2))', padding: '14px', borderRadius: '14px', fontWeight: 600, fontSize: '14px', cursor: 'pointer' }}>
            Back
          </button>
        </div>
      )}

      {/* ═══════ STEP: iPhone Instructions ═══════ */}
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

          <button onClick={() => setStep('verify_proof')}
            style={{ width: '100%', background: `linear-gradient(135deg, ${accent}, #06b6d4)`, color: 'white', border: 'none', padding: '16px', borderRadius: '14px', fontWeight: 700, fontSize: '16px', cursor: 'pointer', marginBottom: '12px' }}>
            I Have Completed Payment
          </button>
          <button onClick={() => setStep('enter_phone')}
            style={{ width: '100%', background: 'transparent', color: 'var(--text-muted, #ffffff60)', border: '1px solid var(--panel-border, rgba(255,255,255,0.2))', padding: '14px', borderRadius: '14px', fontWeight: 600, fontSize: '14px', cursor: 'pointer' }}>
            Back
          </button>
        </div>
      )}

      {/* ═══════ STEP: Verify Payment Proof ═══════ */}
      {step === 'verify_proof' && (
        <div style={{ padding: '10px 0' }}>
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <div style={{
              width: '72px', height: '72px', borderRadius: '50%',
              background: `linear-gradient(135deg, #f59e0b, #f97316)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 20px',
            }}>
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                <circle cx="12" cy="13" r="4"></circle>
              </svg>
            </div>
            <h4 style={{ fontSize: '20px', marginBottom: '8px', fontWeight: 700 }}>Verify Your Payment</h4>
            <p style={{ color: 'var(--text-muted, #ffffff80)', fontSize: '14px', lineHeight: 1.6 }}>
              Upload a screenshot of your EcoCash payment confirmation, or enter the transaction reference manually.
            </p>
          </div>

          {/* Method Toggle */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
            <button
              onClick={() => { setVerifyMethod('screenshot'); setVerifyError(''); }}
              style={{
                flex: 1, padding: '12px', borderRadius: '12px', border: '2px solid',
                borderColor: verifyMethod === 'screenshot' ? accent : 'var(--panel-border, rgba(255,255,255,0.15))',
                background: verifyMethod === 'screenshot' ? 'rgba(16,185,129,0.1)' : 'var(--input-bg, rgba(255,255,255,0.03))',
                color: 'var(--text, #fff)', fontWeight: 600, fontSize: '13px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                <circle cx="12" cy="13" r="4"></circle>
              </svg>
              Upload Screenshot
            </button>
            <button
              onClick={() => { setVerifyMethod('manual'); setVerifyError(''); }}
              style={{
                flex: 1, padding: '12px', borderRadius: '12px', border: '2px solid',
                borderColor: verifyMethod === 'manual' ? accent : 'var(--panel-border, rgba(255,255,255,0.15))',
                background: verifyMethod === 'manual' ? 'rgba(16,185,129,0.1)' : 'var(--input-bg, rgba(255,255,255,0.03))',
                color: 'var(--text, #fff)', fontWeight: 600, fontSize: '13px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="16" y1="13" x2="8" y2="13"></line>
                <line x1="16" y1="17" x2="8" y2="17"></line>
              </svg>
              Enter Manually
            </button>
          </div>

          {/* Screenshot Upload */}
          {verifyMethod === 'screenshot' && (
            <div style={{ marginBottom: '16px' }}>
              {!screenshotPreview ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    border: '2px dashed var(--panel-border, rgba(255,255,255,0.2))',
                    borderRadius: '14px', padding: '32px 20px', textAlign: 'center',
                    cursor: 'pointer', background: 'var(--input-bg, rgba(255,255,255,0.02))',
                    transition: 'all 0.3s ease',
                  }}
                >
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted, #ffffff60)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto 12px' }}>
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                    <circle cx="8.5" cy="8.5" r="1.5"></circle>
                    <polyline points="21 15 16 10 5 21"></polyline>
                  </svg>
                  <p style={{ color: 'var(--text-muted, #ffffff80)', fontSize: '14px', fontWeight: 600, margin: '0 0 6px' }}>
                    Tap to upload payment screenshot
                  </p>
                  <p style={{ color: 'var(--text-dimmed, #ffffff40)', fontSize: '12px', margin: 0 }}>
                    JPG, PNG up to 10MB. AI will read the transaction reference automatically.
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleScreenshotSelect}
                    style={{ display: 'none' }}
                  />
                </div>
              ) : (
                <div style={{ position: 'relative' }}>
                  <div style={{
                    borderRadius: '14px', overflow: 'hidden',
                    border: '2px solid var(--panel-border, rgba(255,255,255,0.15))',
                    position: 'relative',
                  }}>
                    <img
                      src={screenshotPreview}
                      alt="Payment screenshot"
                      style={{ width: '100%', maxHeight: '250px', objectFit: 'contain', display: 'block' }}
                    />
                    <button
                      onClick={() => {
                        setScreenshot(null); setScreenshotPreview(null);
                        setOcrResult(''); setOcrConfidence(0);
                        setExtractedRef(''); setExtractedAmount(''); setOcrError('');
                        if (fileInputRef.current) fileInputRef.current.value = '';
                      }}
                      style={{
                        position: 'absolute', top: '8px', right: '8px',
                        background: 'rgba(0,0,0,0.7)', color: 'white',
                        border: 'none', borderRadius: '8px', padding: '6px 12px',
                        cursor: 'pointer', fontSize: '12px', fontWeight: 600,
                      }}
                    >
                      Remove
                    </button>
                  </div>

                  {ocrProcessing && (
                    <div style={{ marginTop: '12px', padding: '16px', background: 'rgba(16,185,129,0.1)', borderRadius: '12px', textAlign: 'center' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '50%', border: '3px solid rgba(16,185,129,0.3)', borderTopColor: accent, animation: 'spin 1s linear infinite', margin: '0 auto 12px' }} />
                      <p style={{ color: accent, fontSize: '14px', fontWeight: 600, margin: 0 }}>AI is reading your screenshot...</p>
                      <p style={{ color: 'var(--text-dimmed, #ffffff40)', fontSize: '12px', margin: '4px 0 0' }}>Extracting transaction reference automatically</p>
                    </div>
                  )}

                  {!ocrProcessing && ocrResult && (
                    <div style={{
                      marginTop: '12px', padding: '16px',
                      background: extractedRef ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)',
                      borderRadius: '12px',
                      border: `1px solid ${extractedRef ? 'rgba(16,185,129,0.3)' : 'rgba(245,158,11,0.3)'}`,
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                        <span style={{ fontSize: '16px' }}>{extractedRef ? '\u2705' : '\u26a0\ufe0f'}</span>
                        <span style={{ color: 'var(--text, #fff)', fontSize: '14px', fontWeight: 600 }}>
                          {extractedRef ? 'Reference Detected!' : 'Could not auto-detect reference'}
                        </span>
                        {ocrConfidence > 0 && (
                          <span style={{
                            marginLeft: 'auto', fontSize: '11px', fontWeight: 600,
                            color: ocrConfidence > 70 ? accent : '#f59e0b',
                            background: ocrConfidence > 70 ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)',
                            padding: '2px 8px', borderRadius: '6px',
                          }}>
                            {ocrConfidence}% confidence
                          </span>
                        )}
                      </div>
                      {extractedRef && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                          <span style={{ color: 'var(--text-muted, #ffffff60)', fontSize: '12px' }}>Reference:</span>
                          <code style={{ color: accent, fontFamily: 'var(--font-mono, monospace)', fontWeight: 700, fontSize: '15px' }}>
                            {extractedRef}
                          </code>
                        </div>
                      )}
                      {extractedAmount && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ color: 'var(--text-muted, #ffffff60)', fontSize: '12px' }}>Amount:</span>
                          <span style={{ color: 'var(--text, #fff)', fontWeight: 600, fontSize: '14px' }}>${extractedAmount}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {screenshotPreview && !ocrProcessing && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  style={{ width: '100%', marginTop: '12px', background: 'transparent', color: accent, border: `1px solid ${accent}`, padding: '10px', borderRadius: '10px', fontWeight: 600, fontSize: '13px', cursor: 'pointer' }}
                >
                  Upload Different Screenshot
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleScreenshotSelect}
                style={{ display: 'none' }}
              />
            </div>
          )}

          {/* Manual Reference Entry */}
          {verifyMethod === 'manual' && (
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 600, color: 'var(--text, #fff)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                EcoCash Transaction Reference *
              </label>
              <input
                type="text"
                value={transactionRef}
                onChange={(e) => { setTransactionRef(e.target.value); setVerifyError(''); }}
                placeholder="e.g. TF8F3K2Q"
                style={{
                  width: '100%', padding: '14px 16px',
                  background: 'var(--input-bg, rgba(255,255,255,0.05))',
                  border: '1px solid var(--panel-border, rgba(255,255,255,0.15))',
                  borderRadius: '12px', color: 'var(--text, #fff)',
                  fontSize: '16px', outline: 'none', boxSizing: 'border-box',
                  fontFamily: 'var(--font-mono, monospace)',
                }}
              />
              <p style={{ color: 'var(--text-dimmed, #ffffff40)', fontSize: '11px', marginTop: '8px' }}>
                Check your SMS inbox for a message from EcoCash containing this reference.
              </p>
            </div>
          )}

          {/* Manual override for failed OCR */}
          {verifyMethod === 'screenshot' && !ocrProcessing && ocrResult && !extractedRef && (
            <div style={{
              marginTop: '12px', padding: '16px',
              background: 'var(--input-bg, rgba(255,255,255,0.03))',
              borderRadius: '12px', border: '1px solid var(--panel-border, rgba(255,255,255,0.15))',
            }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 600, color: 'var(--text, #fff)' }}>
                Enter Reference Manually
              </label>
              <input
                type="text"
                value={transactionRef}
                onChange={(e) => { setTransactionRef(e.target.value); setVerifyError(''); }}
                placeholder="e.g. TF8F3K2Q"
                style={{
                  width: '100%', padding: '14px 16px',
                  background: 'var(--input-bg, rgba(255,255,255,0.05))',
                  border: '1px solid var(--panel-border, rgba(255,255,255,0.15))',
                  borderRadius: '12px', color: 'var(--text, #fff)',
                  fontSize: '16px', outline: 'none', boxSizing: 'border-box',
                  fontFamily: 'var(--font-mono, monospace)',
                }}
              />
            </div>
          )}

          {verifyError && (
            <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#fca5a5', padding: '12px', borderRadius: '10px', fontSize: '13px', marginBottom: '16px' }}>
              {verifyError}
            </div>
          )}
          {ocrError && verifyMethod === 'screenshot' && (
            <div style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)', color: '#fbbf24', padding: '12px', borderRadius: '10px', fontSize: '13px', marginBottom: '16px' }}>
              {ocrError}
            </div>
          )}

          <button
            onClick={verifyPayment}
            disabled={verifying || uploading || ocrProcessing ||
              (verifyMethod === 'screenshot' && !extractedRef && !screenshot) ||
              (verifyMethod === 'manual' && !transactionRef.trim()) ||
              (!verifyMethod)}
            style={{
              width: '100%',
              background: (verifying || uploading || ocrProcessing)
                ? 'var(--text-dimmed, #ffffff30)'
                : `linear-gradient(135deg, ${accent}, #06b6d4)`,
              color: 'white', border: 'none', padding: '16px', borderRadius: '14px',
              fontWeight: 700, fontSize: '16px',
              cursor: (verifying || uploading || ocrProcessing) ? 'not-allowed' : 'pointer',
              marginBottom: '12px',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
            }}
          >
            {verifying || uploading ? (
              <>
                <div style={{ width: '18px', height: '18px', borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', animation: 'spin 1s linear infinite' }} />
                Verifying Payment...
              </>
            ) : (
              <>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                Verify & Activate Ticket
              </>
            )}
          </button>

          <button onClick={() => setStep('enter_phone')}
            style={{ width: '100%', background: 'transparent', color: 'var(--text-muted, #ffffff60)', border: '1px solid var(--panel-border, rgba(255,255,255,0.2))', padding: '14px', borderRadius: '14px', fontWeight: 600, fontSize: '14px', cursor: 'pointer' }}>
            Back
          </button>
        </div>
      )}

      {/* ═══════ STEP: Payment Confirmed ═══════ */}
      {step === 'confirmed' && (
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
          <h4 style={{ fontSize: '20px', marginBottom: '10px', fontWeight: 700 }}>Payment Verified!</h4>
          <p style={{ color: 'var(--text-muted, #ffffff60)', fontSize: '14px', lineHeight: 1.6 }}>
            Your payment has been confirmed. Your ticket is now active and has been sent to your email and WhatsApp.
          </p>
          {verifyMethod === 'screenshot' && screenshot && (
            <div style={{
              marginTop: '16px', padding: '12px 16px',
              background: 'rgba(16,185,129,0.1)',
              borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '8px',
              justifyContent: 'center',
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                <circle cx="12" cy="13" r="4"></circle>
              </svg>
              <span style={{ color: accent, fontSize: '13px', fontWeight: 600 }}>
                Screenshot saved as proof of payment
              </span>
            </div>
          )}
        </div>
      )}

      {/* Manual Fallback for USSD */}
      {(step === 'processing' || step === 'iphone_instructions') && ussdCode && (
        <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px dashed var(--panel-border, rgba(255,255,255,0.1))' }}>
          <p style={{ fontSize: '12px', color: 'var(--text-dimmed, #ffffff40)', textAlign: 'center', margin: 0 }}>
            Having trouble? Manually dial this code: <strong style={{ color: 'var(--text, #fff)' }}>{ussdCode}</strong>
          </p>
        </div>
      )}

      {/* CSS for animations */}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.3); }
        }
      `}</style>
    </div>
  );
}
