import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '../../components/AdminLayout';
import { Badge, Button, Input, Card } from '../../components/ui';
import { AlertCircle, CheckCircle2, UserPlus, Pencil, Trash2, CalendarRange, Power } from 'lucide-react';

export default function AdminStaff() {
  const router = useRouter();
  const [staff, setStaff] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ full_name: '', email: '', phone: '', password: '', assigned_event_id: '' });
  const [editingId, setEditingId] = useState(null);
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => { loadStaff(); loadEvents(); }, []);

  async function loadStaff() {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/staff');
      const data = await res.json();
      setStaff(data.staff || []);
    } catch { setStaff([]); }
    setLoading(false);
  }

  async function loadEvents() {
    try {
      const res = await fetch('/api/admin/stats');
      const data = await res.json();
      setEvents(data.events || []);
    } catch { setEvents([]); }
  }

  function openAdd() {
    setEditingId(null);
    setForm({ full_name: '', email: '', phone: '', password: '', assigned_event_id: events[0]?.id || '' });
    setError(''); setSuccess('');
    setAdding(true);
  }

  function openEdit(s) {
    setEditingId(s.id);
    setForm({ full_name: s.full_name || '', email: s.email || '', phone: s.phone || '', password: '', assigned_event_id: s.assigned_event_id || events[0]?.id || '' });
    setError(''); setSuccess('');
    setAdding(true);
  }

  async function handleSubmit(e) {
    e.preventDefault(); setError(''); setSuccess('');
    if (!form.full_name || !form.email) { setError('Name and email are required'); return; }
    setSaving(true);
    try {
      if (editingId) {
        const res = await fetch('/api/admin/staff', {
          method: 'PUT', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingId, ...form, password: form.password || undefined }),
        });
        const data = await res.json();
        if (!res.ok) { setError(data.error || 'Failed to update staff'); setSaving(false); return; }
        setSuccess('Staff member updated successfully!');
      } else {
        if (!form.password || form.password.length < 8) { setError('Password must be at least 8 characters'); setSaving(false); return; }
        const res = await fetch('/api/admin/staff', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...form, role: 'gate_staff' }),
        });
        const data = await res.json();
        if (!res.ok) { setError(data.error || 'Failed to create staff'); setSaving(false); return; }
        setSuccess('Staff member created successfully!');
      }
      setForm({ full_name: '', email: '', phone: '', password: '', assigned_event_id: '' });
      setEditingId(null);
      setAdding(false);
      loadStaff();
    } catch { setError('Network error'); }
    setSaving(false);
  }

  async function toggleActive(s) {
    await fetch('/api/admin/staff', {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: s.id, is_active: !s.is_active }),
    });
    loadStaff();
  }

  async function removeStaff(s) {
    if (!confirm(`Delete staff account for ${s.full_name}? This cannot be undone.`)) return;
    await fetch('/api/admin/staff', {
      method: 'DELETE', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: s.id }),
    });
    loadStaff();
  }

  const activeCount = staff.filter(s => s.is_active).length;

  return (
    <AdminLayout title="Staff">
      <div className="adm-section-header fade-in-up">
        <div>
          <h1 className="adm-section-title">Gate Staff</h1>
          <p className="adm-section-sub">Each staff member is assigned to one event only</p>
        </div>
        <Button variant="primary" size="md" onClick={() => (adding ? setAdding(false) : openAdd())}>
          {adding ? '✕ Cancel' : '+ Add Staff'}
        </Button>
      </div>

      {/* Stats */}
      <div className="adm-kpi-grid stagger-children" style={{ marginBottom: '24px', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
        <div className="adm-kpi-card" style={{ '--kpi-accent': 'linear-gradient(135deg, #a855f7, #ec4899)' }}>
          <div className="adm-kpi-label">Total Staff</div>
          <div className="adm-kpi-value adm-count-animate" style={{ background: 'linear-gradient(135deg, #a855f7, #ec4899)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>{staff.length}</div>
          <div className="adm-kpi-sub">All accounts</div>
        </div>
        <div className="adm-kpi-card" style={{ '--kpi-accent': 'linear-gradient(135deg, #10b981, #06b6d4)' }}>
          <div className="adm-kpi-label">Active</div>
          <div className="adm-kpi-value adm-count-animate" style={{ background: 'linear-gradient(135deg, #10b981, #06b6d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>{activeCount}</div>
          <div className="adm-kpi-sub">Currently active</div>
        </div>
        <div className="adm-kpi-card" style={{ '--kpi-accent': 'linear-gradient(135deg, #f59e0b, #ef4444)' }}>
          <div className="adm-kpi-label">Assigned</div>
          <div className="adm-kpi-value adm-count-animate" style={{ background: 'linear-gradient(135deg, #f59e0b, #ef4444)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>{staff.filter(s => s.assigned_event_id).length}</div>
          <div className="adm-kpi-sub">Linked to an event</div>
        </div>
      </div>

      {/* Add / Edit Staff Form */}
      {adding && (
        <div className="adm-chart-card fade-in-up" style={{ marginBottom: '24px' }}>
          <div className="adm-chart-header">
            <div className="adm-chart-title"><UserPlus size={16} strokeWidth={2} style={{ verticalAlign: '-3px', marginRight: '6px' }} />{editingId ? 'Edit Staff Account' : 'New Staff Account'}</div>
            <Badge variant={editingId ? 'info' : 'primary'}>{editingId ? 'Editing' : 'Gate Staff Role'}</Badge>
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

          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '20px' }}>
              <Input label="Full Name *" placeholder="e.g. John Doe" value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} />
              <Input label="Email Address *" type="email" placeholder="staff@tiketflow.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
              <Input label="Phone Number" placeholder="+263 77 123 4567" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
              <Input
                label={editingId ? 'New Password (leave blank to keep)' : 'Password *'}
                type="password"
                placeholder={editingId ? '••••••••' : 'Min 8 characters'}
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
              />
            </div>

            <div className="field-group" style={{ marginBottom: '20px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px', color: 'var(--text-tertiary)' }}>
                <CalendarRange size={13} /> Assigned Event *
              </label>
              <select
                value={form.assigned_event_id}
                onChange={e => setForm({ ...form, assigned_event_id: e.target.value })}
                className="premium-input"
                style={{ width: '100%', padding: '12px 14px', borderRadius: 'var(--radius-md)', fontSize: '14px' }}
              >
                <option value="">— Select an event —</option>
                {events.map(ev => (
                  <option key={ev.id} value={ev.id}>{ev.event_name} {ev.status !== 'published' ? `(${ev.status})` : ''}</option>
                ))}
              </select>
              <p style={{ fontSize: '12px', color: 'var(--text-dimmed)', marginTop: '6px' }}>
                This staff member will only see and scan tickets for this event.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <Button type="submit" variant="primary" loading={saving}>{editingId ? 'Save Changes' : 'Create Account'}</Button>
              <Button type="button" variant="secondary" onClick={() => { setAdding(false); setEditingId(null); setError(''); }}>Cancel</Button>
            </div>
          </form>
        </div>
      )}

      {/* Staff List */}
      {loading ? (
        <div className="stagger-children" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {[...Array(3)].map((_, i) => (
            <div key={i} className="adm-chart-card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div className="adm-skeleton" style={{ width: '44px', height: '44px', borderRadius: '50%' }} />
              <div style={{ flex: 1 }}>
                <div className="adm-skeleton" style={{ width: '150px', height: '16px', marginBottom: '6px' }} />
                <div className="adm-skeleton" style={{ width: '200px', height: '13px' }} />
              </div>
            </div>
          ))}
        </div>
      ) : staff.length === 0 ? (
        <div className="adm-chart-card fade-in-up">
          <div className="adm-empty">
            <div className="adm-empty-icon"><UserPlus size={34} strokeWidth={1.75} /></div>
            <div className="adm-empty-title">No Gate Staff</div>
            <div className="adm-empty-desc">Add staff members to manage check-ins at your events.</div>
            <Button variant="primary" onClick={openAdd}>+ Add First Staff Member</Button>
          </div>
        </div>
      ) : (
        <div className="adm-table-wrap fade-in-up">
          <div className="adm-table-toolbar">
            <div style={{ fontSize: '14px', fontWeight: 700, fontFamily: 'var(--font-primary)' }}>Staff Members</div>
            <Badge variant="glass">{staff.length} total</Badge>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {staff.map(s => (
              <div
                key={s.id}
                className="adm-quick-action"
                style={{ borderRadius: 0, border: 'none', borderBottom: '1px solid var(--border-secondary)', padding: '16px 20px' }}
              >
                <div style={{
                  width: '44px', height: '44px', borderRadius: '50%',
                  background: s.is_active ? 'var(--accent-gradient)' : 'var(--bg-tertiary)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '16px', fontWeight: 800, color: '#fff', flexShrink: 0,
                }}>
                  {s.full_name?.charAt(0)?.toUpperCase() || '?'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '2px' }}>{s.full_name}</div>
                  <div style={{ fontSize: '13px', color: 'var(--text-tertiary)' }}>
                    {s.email}{s.phone && ` · ${s.phone}`}
                  </div>
                </div>
                <div style={{ minWidth: '160px', flexShrink: 0 }}>
                  <Badge variant={s.assigned_event_id ? 'primary' : 'warning'}>
                    <CalendarRange size={12} style={{ verticalAlign: '-2px', marginRight: '4px' }} />
                    {s.assigned_event_id ? (s.events?.event_name || 'Assigned') : 'Not Assigned'}
                  </Badge>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
                  <span className={`adm-status-dot ${s.is_active ? 'success' : 'error'}`}>
                    {s.is_active ? 'Active' : 'Inactive'}
                  </span>
                  <div className="adm-table-row-actions">
                    <button className="adm-table-row-action" title={s.is_active ? 'Deactivate' : 'Activate'} onClick={() => toggleActive(s)}><Power size={14} strokeWidth={2} /></button>
                    <button className="adm-table-row-action" title="Edit" onClick={() => openEdit(s)}><Pencil size={14} strokeWidth={2} /></button>
                    <button className="adm-table-row-action" title="Delete" onClick={() => removeStaff(s)} style={{ color: '#f87171' }}><Trash2 size={14} strokeWidth={2} /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

AdminStaff.getLayout = (page) => page;
