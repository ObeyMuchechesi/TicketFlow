import { useState, useEffect } from 'react';
import AdminLayout from '../../components/AdminLayout';

export default function AdminPromoCodes() {
  const [events, setEvents] = useState([]);
  const [promos, setPromos] = useState([]);
  const [form, setForm] = useState({ event_id: '', code: '', discount_percent: 10, max_uses: 100, expires_at: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetch('/api/events').then(r => r.json()).then(d => setEvents(d.events || []));
    loadPromos();
  }, []);

  async function loadPromos() {
    if (!form.event_id) return;
    const res = await fetch(`/api/promo/list?eventId=${form.event_id}`);
    const d = await res.json();
    setPromos(d.promos || []);
  }

  useEffect(() => { if (form.event_id) loadPromos(); }, [form.event_id]);

  async function handleCreate(e) {
    e.preventDefault(); setLoading(true); setError(''); setSuccess('');
    try {
      const res = await fetch('/api/promo/create', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, code: form.code.toUpperCase() }) });
      const d = await res.json();
      if (!res.ok) { setError(d.error || 'Failed'); } else { setSuccess('Promo code created!'); loadPromos(); setForm(f => ({ ...f, code: '' })); }
    } catch { setError('Network error'); }
    setLoading(false);
  }

  const inp = { width: '100%', padding: '11px 14px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '10px', color: '#fff', fontSize: '14px', outline: 'none', boxSizing: 'border-box' };

  return (
    <AdminLayout title="Promo Codes">
      <div style={{ padding: 'clamp(20px,3vw,40px)', maxWidth: '800px' }}>
        <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: '28px', fontWeight: 700, marginBottom: '8px' }}>Promo Codes</h1>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px', marginBottom: '28px' }}>Create discount codes for your events</p>

        <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '24px', marginBottom: '28px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '18px' }}>Create New Code</h3>
          {error && <div style={{ background: 'rgba(239,68,68,0.1)', borderRadius: '8px', padding: '10px', color: '#fca5a5', fontSize: '13px', marginBottom: '14px' }}>{error}</div>}
          {success && <div style={{ background: 'rgba(16,185,129,0.1)', borderRadius: '8px', padding: '10px', color: '#6ee7b7', fontSize: '13px', marginBottom: '14px' }}>{success}</div>}
          <form onSubmit={handleCreate}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginBottom: '5px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Event *</label>
                <select required value={form.event_id} onChange={e => setForm({ ...form, event_id: e.target.value })} style={{ ...inp }}>
                  <option value="">Select event...</option>
                  {events.map(ev => <option key={ev.id} value={ev.id} style={{ background: '#1a1a2e' }}>{ev.event_name}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginBottom: '5px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Code *</label>
                <input required value={form.code} onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="EARLY20" style={{ ...inp, textTransform: 'uppercase', letterSpacing: '2px', fontWeight: 700 }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginBottom: '5px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Discount %</label>
                <input type="number" min="1" max="100" value={form.discount_percent} onChange={e => setForm({ ...form, discount_percent: Number(e.target.value) })} style={inp} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginBottom: '5px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Max Uses</label>
                <input type="number" min="1" value={form.max_uses} onChange={e => setForm({ ...form, max_uses: Number(e.target.value) })} style={inp} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginBottom: '5px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Expires</label>
                <input type="date" value={form.expires_at} onChange={e => setForm({ ...form, expires_at: e.target.value })} style={inp} />
              </div>
            </div>
            <button type="submit" disabled={loading} style={{ background: loading ? 'rgba(233,69,96,0.5)' : '#e94560', border: 'none', borderRadius: '50px', padding: '12px 28px', color: '#fff', fontWeight: 700, fontSize: '15px', cursor: 'pointer' }}>
              {loading ? 'Creating...' : '+ Create Code'}
            </button>
          </form>
        </div>

        {promos.length > 0 && (
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '14px' }}>Existing Codes</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {promos.map(p => (
                <div key={p.id} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                  <div>
                    <span style={{ fontFamily: 'monospace', fontSize: '16px', fontWeight: 700, letterSpacing: '2px', color: '#d4a853' }}>{p.code}</span>
                    <span style={{ marginLeft: '12px', color: '#10b981', fontWeight: 600 }}>{p.discount_percent}% off</span>
                  </div>
                  <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                    <span>{p.times_used}/{p.max_uses} used</span>
                    {p.expires_at && <span>Expires: {new Date(p.expires_at).toLocaleDateString()}</span>}
                    <span style={{ color: p.is_active ? '#10b981' : '#ef4444' }}>{p.is_active ? '● Active' : '● Inactive'}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

AdminPromoCodes.getLayout = (page) => page;
