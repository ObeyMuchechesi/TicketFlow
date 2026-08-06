import { useState, useEffect } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { Badge, Button, Input } from '../../components/ui';
import { AlertCircle, CheckCircle2, BadgePercent } from 'lucide-react';

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
    try {
      const res = await fetch(`/api/promo/list?eventId=${form.event_id}`);
      const d = await res.json();
      setPromos(d.promos || []);
    } catch {}
  }

  useEffect(() => { if (form.event_id) loadPromos(); }, [form.event_id]);

  async function handleCreate(e) {
    e.preventDefault(); setLoading(true); setError(''); setSuccess('');
    try {
      const res = await fetch('/api/promo/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, code: form.code.toUpperCase() }),
      });
      const d = await res.json();
      if (!res.ok) { setError(d.error || 'Failed to create'); }
      else { setSuccess('Promo code created successfully!'); loadPromos(); setForm(f => ({ ...f, code: '' })); }
    } catch { setError('Network error'); }
    setLoading(false);
  }

  const totalPromos = promos.length;
  const activePromos = promos.filter(p => p.is_active).length;
  const totalUses = promos.reduce((s, p) => s + (p.times_used || 0), 0);

  return (
    <AdminLayout title="Promo Codes">
      <div className="adm-section-header fade-in-up">
        <div>
          <h1 className="adm-section-title">Promo Codes</h1>
          <p className="adm-section-sub">Create and manage discount codes for your events</p>
        </div>
      </div>

      {/* Stats */}
      <div className="adm-kpi-grid stagger-children" style={{ marginBottom: '24px', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
        <div className="adm-kpi-card" style={{ '--kpi-accent': 'linear-gradient(135deg, #a855f7, #ec4899)' }}>
          <div className="adm-kpi-label">Total Codes</div>
          <div className="adm-kpi-value adm-count-animate" style={{ background: 'linear-gradient(135deg, #a855f7, #ec4899)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>{totalPromos}</div>
        </div>
        <div className="adm-kpi-card" style={{ '--kpi-accent': 'linear-gradient(135deg, #10b981, #06b6d4)' }}>
          <div className="adm-kpi-label">Active Codes</div>
          <div className="adm-kpi-value adm-count-animate" style={{ background: 'linear-gradient(135deg, #10b981, #06b6d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>{activePromos}</div>
        </div>
        <div className="adm-kpi-card" style={{ '--kpi-accent': 'linear-gradient(135deg, #f59e0b, #ef4444)' }}>
          <div className="adm-kpi-label">Total Uses</div>
          <div className="adm-kpi-value adm-count-animate" style={{ background: 'linear-gradient(135deg, #f59e0b, #ef4444)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>{totalUses}</div>
        </div>
      </div>

      {/* Create Form */}
      <div className="adm-chart-card fade-in-up" style={{ marginBottom: '24px' }}>
        <div className="adm-chart-header">
          <div className="adm-chart-title">🏷️ Create New Code</div>
          <Badge variant="primary">Discount</Badge>
        </div>

        {error && (
          <div style={{ padding: '12px 16px', borderRadius: '12px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#fca5a5', fontSize: '13px', fontWeight: 500, marginBottom: '16px' }}>
            <AlertCircle size={15} strokeWidth={2} style={{ verticalAlign: '-2px', marginRight: '6px' }} />{error}
          </div>
        )}
        {success && (
          <div style={{ padding: '12px 16px', borderRadius: '12px', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', color: '#6ee7b7', fontSize: '13px', fontWeight: 500, marginBottom: '16px' }}>
            <CheckCircle2 size={15} strokeWidth={2} style={{ verticalAlign: '-2px', marginRight: '6px' }} />{success}
          </div>
        )}

        <form onSubmit={handleCreate}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '20px' }}>
            <div className="field-group">
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>Event *</label>
              <select
                required
                value={form.event_id}
                onChange={e => setForm({ ...form, event_id: e.target.value })}
                className="premium-input"
                style={{ cursor: 'pointer' }}
              >
                <option value="">Select event...</option>
                {events.map(ev => <option key={ev.id} value={ev.id}>{ev.event_name}</option>)}
              </select>
            </div>
            <Input
              label="Code *"
              placeholder="EARLY20"
              value={form.code}
              onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })}
              helper="Auto-uppercase · Letters & numbers"
            />
            <Input
              label="Discount %"
              type="number"
              min="1"
              max="100"
              value={form.discount_percent}
              onChange={e => setForm({ ...form, discount_percent: Number(e.target.value) })}
            />
            <Input
              label="Max Uses"
              type="number"
              min="1"
              value={form.max_uses}
              onChange={e => setForm({ ...form, max_uses: Number(e.target.value) })}
            />
            <Input
              label="Expires"
              type="date"
              value={form.expires_at}
              onChange={e => setForm({ ...form, expires_at: e.target.value })}
            />
          </div>
          <Button type="submit" variant="primary" loading={loading}>
            {loading ? 'Creating...' : '+ Create Code'}
          </Button>
        </form>
      </div>

      {/* Promo List */}
      {promos.length > 0 && (
        <div className="fade-in-up">
          <div className="adm-section-header" style={{ marginBottom: '14px' }}>
            <h3 style={{ fontFamily: 'var(--font-primary)', fontSize: '16px', fontWeight: 700 }}>Existing Codes</h3>
            <Badge variant="glass">{promos.length} codes</Badge>
          </div>
          <div className="adm-table-wrap">
            <div style={{ overflowX: 'auto' }}>
              <table className="adm-table">
                <thead>
                  <tr>
                    {['Code', 'Discount', 'Uses', 'Expires', 'Status'].map(h => (
                      <th key={h}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {promos.map(p => (
                    <tr key={p.id}>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: '15px', fontWeight: 700, letterSpacing: '2px', color: 'var(--accent-primary)' }}>
                        {p.code}
                      </td>
                      <td>
                        <span style={{ fontWeight: 700, color: 'var(--success)' }}>{p.discount_percent}% off</span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontWeight: 600 }}>{p.times_used || 0}</span>
                          <span style={{ color: 'var(--text-tertiary)', fontSize: '12px' }}>/ {p.max_uses}</span>
                        </div>
                      </td>
                      <td style={{ color: 'var(--text-tertiary)', fontSize: '13px' }}>
                        {p.expires_at ? new Date(p.expires_at).toLocaleDateString() : 'Never'}
                      </td>
                      <td>
                        <span className={`adm-status-dot ${p.is_active ? 'success' : 'error'}`}>
                          {p.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {promos.length === 0 && form.event_id && (
        <div className="adm-chart-card fade-in-up">
          <div className="adm-empty">
            <div className="adm-empty-icon">🏷️</div>
            <div className="adm-empty-title">No Promo Codes</div>
            <div className="adm-empty-desc">Create your first discount code above to start running promotions.</div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

AdminPromoCodes.getLayout = (page) => page;
