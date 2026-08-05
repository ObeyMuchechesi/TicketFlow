import { useState, useEffect } from 'react';
import AdminLayout from '../../components/AdminLayout';

export default function AdminStaff() {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ full_name: '', email: '', phone: '', password: '' });
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { loadStaff(); }, []);

  async function loadStaff() {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/staff');
      const data = await res.json();
      setStaff(data.staff || []);
    } catch { setStaff([]); }
    setLoading(false);
  }

  async function handleAdd(e) {
    e.preventDefault(); setError('');
    try {
      const res = await fetch('/api/admin/staff', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, role: 'gate_staff' }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Failed'); return; }
      setForm({ full_name: '', email: '', phone: '', password: '' });
      setAdding(false);
      loadStaff();
    } catch { setError('Network error'); }
  }

  const inp = { width: '100%', padding: '11px 14px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '10px', color: '#fff', fontSize: '14px', outline: 'none', boxSizing: 'border-box' };

  return (
    <AdminLayout title="Gate Staff">
      <div style={{ padding: 'clamp(20px,3vw,40px)', maxWidth: '800px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: '28px', fontWeight: 700, marginBottom: '4px' }}>Gate Staff</h1>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px' }}>Manage check-in staff accounts</p>
          </div>
          <button onClick={() => setAdding(!adding)} style={{ background: '#e94560', border: 'none', borderRadius: '50px', padding: '11px 22px', color: '#fff', fontWeight: 700, fontSize: '14px', cursor: 'pointer' }}>
            {adding ? 'Cancel' : '+ Add Staff'}
          </button>
        </div>

        {adding && (
          <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', padding: '24px', marginBottom: '24px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>New Staff Account</h3>
            {error && <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '8px', padding: '10px', color: '#fca5a5', fontSize: '13px', marginBottom: '14px' }}>{error}</div>}
            <form onSubmit={handleAdd}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                <input required placeholder="Full Name" value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} style={inp} />
                <input required type="email" placeholder="Email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} style={inp} />
                <input placeholder="Phone" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} style={inp} />
                <input required type="password" placeholder="Password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} style={inp} />
              </div>
              <button type="submit" style={{ background: '#e94560', border: 'none', borderRadius: '50px', padding: '12px 24px', color: '#fff', fontWeight: 700, fontSize: '14px', cursor: 'pointer' }}>Create Account</button>
            </form>
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'rgba(255,255,255,0.3)' }}>Loading staff...</div>
        ) : staff.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px', color: 'rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '1px dashed rgba(255,255,255,0.08)' }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>👮</div>
            <p>No gate staff accounts yet.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {staff.map(s => (
              <div key={s.id} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '14px', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 600, marginBottom: '3px' }}>{s.full_name}</div>
                  <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px' }}>{s.email}{s.phone && ` · ${s.phone}`}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '12px', padding: '3px 10px', borderRadius: '50px', background: s.is_active ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)', color: s.is_active ? '#10b981' : '#ef4444', fontWeight: 600 }}>{s.is_active ? 'Active' : 'Inactive'}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

AdminStaff.getLayout = (page) => page;
