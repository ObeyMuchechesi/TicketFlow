import { useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';

const inputStyle = {
  width: '100%', padding: '14px 16px',
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.15)',
  borderRadius: '12px', color: '#fff',
  fontSize: '15px', outline: 'none',
  boxSizing: 'border-box', transition: 'border-color 0.2s',
};

const DEMO_EVENT = {
  id: 'demo', slug: 'harare-summer-fest',
  event_name: 'Harare Summer Music Festival',
  date: '2026-08-20', time: '6:00 PM – 11:00 PM',
  venue: 'Harare International Conference Centre',
  description: 'Experience the biggest summer music festival in Harare! Top artists, food stalls, and unforgettable vibes. This is a night you cannot miss.',
  poster_image: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=1200&q=80',
  theme_color: '#e94560', capacity: 500,
  ticket_types: [
    { id: 't1', name: 'Early Bird', price: 10, quantity_available: 45, quantity_sold: 55, color: '#10b981' },
    { id: 't2', name: 'General Admission', price: 15, quantity_available: 120, quantity_sold: 80, color: '#e94560' },
    { id: 't3', name: 'VIP', price: 50, quantity_available: 30, quantity_sold: 20, color: '#d4a853' },
  ],
};

export default function EventPage({ event: serverEvent }) {
  const router = useRouter();
  const event = serverEvent || DEMO_EVENT;
  const accent = event.theme_color || '#e94560';

  const [step, setStep] = useState('select');
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [qty, setQty] = useState(1);
  const [promoCode, setPromoCode] = useState('');
  const [promoApplied, setPromoApplied] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', phone: '' });
  const [payMethod, setPayMethod] = useState('stripe');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [orderId, setOrderId] = useState(null);
  const [tokens, setTokens] = useState([]);

  const discount = promoApplied ? promoApplied.discount_percent : 0;
  const baseTotal = selectedTicket ? selectedTicket.price * qty : 0;
  const discountAmt = Math.round(baseTotal * discount / 100 * 100) / 100;
  const total = baseTotal - discountAmt;

  async function applyPromo() {
    if (!promoCode.trim()) return;
    try {
      const res = await fetch(`/api/promo/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: promoCode, eventId: event.id }),
      });
      const data = await res.json();
      if (data.valid) setPromoApplied(data.promo);
      else setError('Invalid or expired promo code');
    } catch { setError('Could not validate promo code'); }
  }

  async function handlePurchase(e) {
    e.preventDefault();
    if (!selectedTicket) return;
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/tickets/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: event.id,
          ticketTypeId: selectedTicket.id,
          quantity: qty,
          buyerName: form.name,
          buyerEmail: form.email,
          buyerPhone: form.phone,
          paymentMethod: payMethod,
          promoCode: promoApplied?.code,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Purchase failed'); setLoading(false); return; }
      if (payMethod === 'stripe' && data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        setOrderId(data.orderId);
        setTokens(data.tokens || []);
        setStep('confirm');
      }
    } catch (err) { setError('Something went wrong. Please try again.'); }
    setLoading(false);
  }

  function formatDate(d) {
    try { return new Date(d).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }); }
    catch { return d; }
  }

  const available = selectedTicket
    ? (selectedTicket.quantity_available - (selectedTicket.quantity_sold || 0))
    : 0;

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(160deg,#0a0a0a 0%,#1a1a2e 55%,#16213e 100%)' }}>
      {/* Hero */}
      <div style={{ height: 'clamp(280px, 40vw, 420px)', background: `url(${event.poster_image}) center/cover`, position: 'relative' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg,rgba(0,0,0,0.2) 0%,rgba(0,0,0,0.85) 100%)' }} />
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: 'clamp(24px,4vw,48px)' }}>
          <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: 'clamp(26px,4vw,46px)', fontWeight: 800, marginBottom: '10px' }}>{event.event_name}</h1>
          <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', color: 'rgba(255,255,255,0.7)', fontSize: '14px' }}>
            <span>📅 {formatDate(event.date)}</span>
            {event.time && <span>🕐 {event.time}</span>}
            <span>📍 {event.venue}</span>
          </div>
        </div>
      </div>

      {/* Steps */}
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '36px 20px' }}>
        <StepBar step={step} accent={accent} />
        {error && <div style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '10px', padding: '12px 16px', color: '#fca5a5', fontSize: '14px', marginBottom: '20px' }}>{error}</div>}

        {step === 'select' && (
          <SelectStep event={event} accent={accent} selectedTicket={selectedTicket} setSelectedTicket={setSelectedTicket}
            qty={qty} setQty={setQty} promoCode={promoCode} setPromoCode={setPromoCode}
            promoApplied={promoApplied} applyPromo={applyPromo} discount={discount}
            discountAmt={discountAmt} total={total} available={available}
            onNext={() => { if (selectedTicket) setStep('form'); }} />
        )}
        {step === 'form' && (
          <FormStep form={form} setForm={setForm} payMethod={payMethod} setPayMethod={setPayMethod}
            total={total} qty={qty} selectedTicket={selectedTicket} loading={loading}
            onBack={() => setStep('select')} onSubmit={handlePurchase} accent={accent} />
        )}
        {step === 'confirm' && (
          <ConfirmStep form={form} qty={qty} selectedTicket={selectedTicket} event={event}
            tokens={tokens} router={router} accent={accent} />
        )}
      </div>
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────────
function StepBar({ step, accent }) {
  const steps = ['select', 'form', 'confirm'];
  const labels = ['Select Tickets', 'Your Details', 'Confirmation'];
  const idx = steps.indexOf(step);
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0', marginBottom: '36px' }}>
      {steps.map((s, i) => (
        <div key={s} style={{ display: 'flex', alignItems: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: '36px', height: '36px', borderRadius: '50%', margin: '0 auto 6px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: i <= idx ? accent : 'rgba(255,255,255,0.08)',
              fontWeight: 700, fontSize: '14px',
              transition: 'background 0.3s',
            }}>
              {i < idx ? '✓' : i + 1}
            </div>
            <div style={{ fontSize: '11px', color: i <= idx ? '#fff' : 'rgba(255,255,255,0.3)', whiteSpace: 'nowrap' }}>{labels[i]}</div>
          </div>
          {i < steps.length - 1 && (
            <div style={{ width: 'clamp(40px,6vw,80px)', height: '2px', background: i < idx ? accent : 'rgba(255,255,255,0.1)', margin: '0 8px 20px', transition: 'background 0.3s' }} />
          )}
        </div>
      ))}
    </div>
  );
}

function SelectStep({ event, accent, selectedTicket, setSelectedTicket, qty, setQty, promoCode, setPromoCode, promoApplied, applyPromo, discount, discountAmt, total, available, onNext }) {
  return (
    <div>
      {event.description && <p style={{ color: 'rgba(255,255,255,0.55)', lineHeight: 1.7, marginBottom: '28px', fontSize: '15px' }}>{event.description}</p>}
      <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: '22px', marginBottom: '16px' }}>Choose Ticket Type</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
        {event.ticket_types?.map(t => {
          const rem = t.quantity_available - (t.quantity_sold || 0);
          const soldOut = rem <= 0;
          const sel = selectedTicket?.id === t.id;
          return (
            <div key={t.id} onClick={() => !soldOut && setSelectedTicket(t)} style={{
              border: `${sel ? 2 : 1}px solid ${sel ? t.color : 'rgba(255,255,255,0.1)'}`,
              borderRadius: '16px', padding: '20px', cursor: soldOut ? 'not-allowed' : 'pointer',
              background: sel ? `rgba(${hexToRgb(t.color)},0.1)` : 'rgba(255,255,255,0.02)',
              opacity: soldOut ? 0.5 : 1, transition: 'all 0.2s',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                  <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: t.color }} />
                  <span style={{ fontWeight: 600, fontSize: '17px' }}>{t.name}</span>
                  {soldOut && <span style={{ fontSize: '11px', color: '#ef4444', background: 'rgba(239,68,68,0.1)', padding: '2px 8px', borderRadius: '50px' }}>Sold Out</span>}
                </div>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px' }}>{soldOut ? 'No tickets remaining' : `${rem} tickets remaining`}</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: '26px', fontWeight: 800, color: t.color }}>${t.price}</p>
                <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)' }}>per ticket</p>
              </div>
            </div>
          );
        })}
      </div>

      {selectedTicket && (
        <>
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '20px', marginBottom: '16px' }}>
            <label style={{ display: 'block', fontWeight: 500, marginBottom: '14px', fontSize: '14px' }}>Quantity</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <QtyBtn onClick={() => qty > 1 && setQty(qty - 1)} label="−" />
              <span style={{ fontSize: '28px', fontWeight: 700, minWidth: '48px', textAlign: 'center' }}>{qty}</span>
              <QtyBtn onClick={() => qty < Math.min(available, 10) && setQty(qty + 1)} label="+" />
              <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '13px' }}>Max 10 per order</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
            <input value={promoCode} onChange={e => setPromoCode(e.target.value.toUpperCase())} placeholder="PROMO CODE" style={{ ...inputStyle, flex: 1, textTransform: 'uppercase', letterSpacing: '2px' }} />
            <button onClick={applyPromo} style={{ padding: '14px 20px', background: promoApplied ? '#10b981' : 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '12px', color: '#fff', fontWeight: 600, fontSize: '14px', cursor: 'pointer', whiteSpace: 'nowrap' }}>
              {promoApplied ? '✓ Applied' : 'Apply'}
            </button>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px' }}>{qty} × {selectedTicket.name}</p>
              {discount > 0 && <p style={{ color: '#10b981', fontSize: '13px' }}>Promo: −${discountAmt} ({discount}% off)</p>}
              <p style={{ fontSize: '36px', fontWeight: 800, marginTop: '4px' }}>${total.toFixed(2)}</p>
            </div>
            <button onClick={onNext} style={{ background: accent, color: '#fff', border: 'none', padding: '16px 36px', borderRadius: '50px', fontWeight: 700, fontSize: '16px', cursor: 'pointer' }}>
              Continue →
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function FormStep({ form, setForm, payMethod, setPayMethod, total, qty, selectedTicket, loading, onBack, onSubmit, accent }) {
  const PAY_METHODS = [
    { id: 'stripe', label: '💳 Card / Apple Pay / Google Pay' },
    { id: 'ecocash', label: '📱 EcoCash' },
    { id: 'paypal', label: '🅿️ PayPal' },
  ];
  return (
    <div style={{ maxWidth: '520px', margin: '0 auto' }}>
      <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: '22px', marginBottom: '20px' }}>Your Details</h3>
      <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '12px', padding: '14px 18px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: 'rgba(255,255,255,0.7)' }}>
        <span>{qty} × {selectedTicket?.name}</span>
        <span style={{ fontWeight: 700, color: '#fff' }}>${total.toFixed(2)}</span>
      </div>
      <form onSubmit={onSubmit}>
        {[
          { key: 'name', label: 'Full Name', type: 'text', placeholder: 'Your full name' },
          { key: 'email', label: 'Email Address', type: 'email', placeholder: 'your@email.com' },
          { key: 'phone', label: 'Phone Number', type: 'tel', placeholder: '+263 77 123 4567' },
        ].map(f => (
          <div key={f.key} style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '7px', fontSize: '13px', fontWeight: 600, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{f.label} *</label>
            <input type={f.type} required value={form[f.key]} placeholder={f.placeholder}
              onChange={e => setForm({ ...form, [f.key]: e.target.value })}
              style={inputStyle}
              onFocus={e => e.target.style.borderColor = accent}
              onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.15)'} />
          </div>
        ))}

        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', marginBottom: '10px', fontSize: '13px', fontWeight: 600, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Payment Method</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {PAY_METHODS.map(m => (
              <div key={m.id} onClick={() => setPayMethod(m.id)} style={{
                padding: '14px 18px', borderRadius: '12px', cursor: 'pointer',
                border: `${payMethod === m.id ? 2 : 1}px solid ${payMethod === m.id ? accent : 'rgba(255,255,255,0.1)'}`,
                background: payMethod === m.id ? `rgba(233,69,96,0.08)` : 'rgba(255,255,255,0.02)',
                fontWeight: payMethod === m.id ? 600 : 400, fontSize: '15px', transition: 'all 0.2s',
              }}>{m.label}</div>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button type="button" onClick={onBack} style={{ flex: 1, background: 'transparent', color: '#fff', border: '1px solid rgba(255,255,255,0.15)', padding: '14px', borderRadius: '50px', fontWeight: 600, fontSize: '15px' }}>← Back</button>
          <button type="submit" disabled={loading} style={{ flex: 2, background: loading ? 'rgba(233,69,96,0.5)' : accent, color: '#fff', border: 'none', padding: '14px', borderRadius: '50px', fontWeight: 700, fontSize: '16px' }}>
            {loading ? '⏳ Processing...' : `Pay $${total.toFixed(2)} →`}
          </button>
        </div>
      </form>
    </div>
  );
}

function ConfirmStep({ form, qty, selectedTicket, event, tokens, router, accent }) {
  return (
    <div style={{ maxWidth: '500px', margin: '0 auto', textAlign: 'center' }}>
      <div style={{ width: '80px', height: '80px', background: 'rgba(16,185,129,0.15)', border: '2px solid rgba(16,185,129,0.4)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', fontSize: '36px' }}>🎉</div>
      <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: '28px', marginBottom: '10px' }}>Booking Confirmed!</h3>
      <p style={{ color: 'rgba(255,255,255,0.5)', marginBottom: '28px', lineHeight: 1.6 }}>
        {qty} × {selectedTicket?.name} ticket{qty > 1 ? 's' : ''} for <strong>{event.event_name}</strong> confirmed.
      </p>
      <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '20px', marginBottom: '20px', textAlign: 'left' }}>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>Tickets sent to</p>
        <p style={{ fontWeight: 600, fontSize: '17px' }}>{form.email}</p>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px', marginTop: '4px' }}>{form.phone}</p>
      </div>
      {tokens.length > 0 && (
        <div style={{ marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {tokens.map((token, i) => (
            <button key={i} onClick={() => router.push(`/ticket/${token}`)}
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '12px', padding: '12px', color: '#fff', fontWeight: 600, fontSize: '14px', cursor: 'pointer', transition: 'background 0.2s' }}>
              🎟️ View Ticket {tokens.length > 1 ? `#${i + 1}` : ''}
            </button>
          ))}
        </div>
      )}
      <button onClick={() => router.push('/')} style={{ width: '100%', background: accent, color: '#fff', border: 'none', padding: '16px', borderRadius: '50px', fontWeight: 700, fontSize: '16px', cursor: 'pointer' }}>Browse More Events</button>
    </div>
  );
}

function QtyBtn({ onClick, label }) {
  return (
    <button onClick={onClick} style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', fontSize: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>{label}</button>
  );
}

function hexToRgb(hex = '#e94560') {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r},${g},${b}`;
}

export async function getServerSideProps({ params }) {
  const { slug } = params;
  try {
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    );
    const { data: event } = await supabase
      .from('events')
      .select(`*, ticket_types (id, name, price, quantity_available, quantity_sold, color)`)
      .eq('slug', slug)
      .eq('status', 'published')
      .single();
    return { props: { event: event || null } };
  } catch {
    return { props: { event: null } };
  }
}

EventPage.getLayout = (page) => <Layout>{page}</Layout>;
