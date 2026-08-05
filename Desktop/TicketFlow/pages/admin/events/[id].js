import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '../../../components/AdminLayout';

const TAB_STYLE = (active) => ({
  padding: '10px 20px', background: 'transparent', border: 'none',
  borderBottom: active ? '2px solid #e94560' : '2px solid transparent',
  color: active ? '#fff' : 'rgba(255,255,255,0.4)', fontWeight: active ? 600 : 400,
  fontSize: '14px', cursor: 'pointer', transition: 'all 0.2s',
});

const STATUS_COLORS = { published: '#10b981', draft: '#f59e0b', sold_out: '#ef4444', completed: '#6b7280', cancelled: '#ef4444' };

export default function AdminEventDetail() {
  const router = useRouter();
  const { id } = router.query;
  const [event, setEvent] = useState(null);
  const [attendees, setAttendees] = useState([]);
  const [tab, setTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusLoading, setStatusLoading] = useState(false);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/events/${id}`).then(r => r.json()).then(d => { setEvent(d.event); setLoading(false); });
  }, [id]);

  useEffect(() => {
    if (!id || tab !== 'attendees') return;
    fetch(`/api/admin/attendees?eventId=${id}&search=${search}`).then(r => r.json()).then(d => setAttendees(d.attendees || []));
  }, [id, tab, search]);

  async function updateStatus(status) {
    setStatusLoading(true);
    await fetch(`/api/events/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) });
    setEvent(e => ({ ...e, status }));
    setStatusLoading(false);
  }

  if (loading) return <AdminLayout title="Event"><div style={{ padding: '40px', color: 'rgba(255,255,255,0.3)' }}>Loading...</div></AdminLayout>;
  if (!event) return <AdminLayout title="Event"><div style={{ padding: '40px', color: '#fca5a5' }}>Event not found.</div></AdminLayout>;

  const sold = (event.ticket_types || []).reduce((s, t) => s + (t.quantity_sold || 0), 0);
  const total = (event.ticket_types || []).reduce((s, t) => s + t.quantity_available, 0);

  return (
    <AdminLayout title={event.event_name}>
      <div style={{ padding: 'clamp(20px,3vw,40px)' }}>
        {/* Header */}
        <button onClick={() => router.push('/admin/events')} style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: '14px', cursor: 'pointer', marginBottom: '12px' }}>← All Events</button>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '24px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
              <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: 'clamp(20px,3vw,28px)', fontWeight: 700 }}>{event.event_name}</h1>
              <span style={{ fontSize: '12px', padding: '3px 12px', borderRadius: '50px', background: `${STATUS_COLORS[event.status]}18`, color: STATUS_COLORS[event.status], fontWeight: 700, textTransform: 'capitalize' }}>{event.status}</span>
            </div>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px' }}>📅 {new Date(event.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} &nbsp; 📍 {event.venue}</p>
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <a href={`/events/${event.slug}`} target="_blank" rel="noopener noreferrer" style={{ padding: '9px 16px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '50px', color: '#fff', fontSize: '13px', fontWeight: 600, textDecoration: 'none' }}>🔗 View Page</a>
            <select value={event.status} onChange={e => updateStatus(e.target.value)} disabled={statusLoading} style={{ padding: '9px 14px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '50px', color: '#fff', fontSize: '13px', cursor: 'pointer', outline: 'none' }}>
              {['draft', 'published', 'sold_out', 'completed', 'cancelled'].map(s => <option key={s} value={s} style={{ background: '#1a1a2e' }}>{s}</option>)}
            </select>
            <button onClick={() => router.push(`/admin/events/edit/${id}`)} style={{ padding: '9px 16px', background: '#e94560', border: 'none', borderRadius: '50px', color: '#fff', fontSize: '13px', fontWeight: 600 }}>✏️ Edit</button>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: '12px', marginBottom: '28px' }}>
          {[
            { l: 'Tickets Sold', v: sold, c: '#d4a853' },
            { l: 'Available', v: total - sold, c: '#10b981' },
            { l: 'Checked In', v: (event.ticket_types || []).reduce((s, t) => s + (t.quantity_sold || 0), 0), c: '#3b82f6' },
            { l: 'Capacity', v: event.capacity || '∞', c: '#6b7280' },
          ].map(s => (
            <div key={s.l} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '14px', padding: '18px', textAlign: 'center' }}>
              <div style={{ fontSize: '26px', fontWeight: 800, color: s.c, fontFamily: "'Playfair Display',serif" }}>{s.v}</div>
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)', marginTop: '4px' }}>{s.l}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', marginBottom: '24px', display: 'flex', gap: '0' }}>
          {[['overview', 'Overview'], ['tickets', 'Ticket Types'], ['attendees', 'Attendees']].map(([t, l]) => (
            <button key={t} style={TAB_STYLE(tab === t)} onClick={() => setTab(t)}>{l}</button>
          ))}
        </div>

        {tab === 'overview' && (
          <div>
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px', padding: '24px' }}>
              {event.poster_image && <img src={event.poster_image} alt="poster" style={{ width: '100%', maxHeight: '300px', objectFit: 'cover', borderRadius: '12px', marginBottom: '20px' }} />}
              <p style={{ color: 'rgba(255,255,255,0.6)', lineHeight: 1.7, marginBottom: '16px' }}>{event.description || 'No description provided.'}</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '14px', color: 'rgba(255,255,255,0.5)' }}>
                <div><strong style={{ color: '#fff' }}>Time:</strong> {event.time || '—'}</div>
                <div><strong style={{ color: '#fff' }}>Theme Color:</strong> <span style={{ display: 'inline-block', width: '14px', height: '14px', background: event.theme_color, borderRadius: '3px', marginLeft: '6px', verticalAlign: 'middle' }} /></div>
              </div>
            </div>
          </div>
        )}

        {tab === 'tickets' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
              <button onClick={() => router.push(`/admin/events/edit/${id}#tickets`)} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '50px', padding: '9px 18px', color: '#fff', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>+ Add Ticket Type</button>
            </div>
            {(event.ticket_types || []).map(tt => {
              const pct = tt.quantity_available > 0 ? Math.min((tt.quantity_sold / tt.quantity_available) * 100, 100) : 0;
              return (
                <div key={tt.id} style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${tt.color}30`, borderRadius: '14px', padding: '20px', marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                  <div style={{ flex: 1, minWidth: '200px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: tt.color }} />
                      <span style={{ fontWeight: 600, fontSize: '16px' }}>{tt.name}</span>
                      <span style={{ color: tt.color, fontWeight: 700, fontSize: '15px' }}>${tt.price}</span>
                    </div>
                    <div style={{ height: '6px', background: 'rgba(255,255,255,0.08)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: tt.color, borderRadius: '3px' }} />
                    </div>
                    <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)', marginTop: '6px' }}>{tt.quantity_sold || 0} sold / {tt.quantity_available} total ({Math.round(pct)}%)</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '22px', fontWeight: 800, color: '#d4a853', fontFamily: "'Playfair Display',serif" }}>
                      ${((tt.quantity_sold || 0) * tt.price).toLocaleString()}
                    </div>
                    <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)' }}>revenue</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {tab === 'attendees' && (
          <div>
            <div style={{ marginBottom: '16px' }}>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, email, phone, or ticket ID..." style={{ width: '100%', padding: '12px 16px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '12px', color: '#fff', fontSize: '14px', outline: 'none' }} />
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.4)', textAlign: 'left' }}>
                    {['Name', 'Email', 'Ticket Type', 'Status', 'Checked In', 'Date'].map(h => <th key={h} style={{ padding: '10px 12px', fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {attendees.map(a => (
                    <tr key={a.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', transition: 'background 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <td style={{ padding: '12px' }}>{a.buyer_name}</td>
                      <td style={{ padding: '12px', color: 'rgba(255,255,255,0.5)' }}>{a.buyer_email}</td>
                      <td style={{ padding: '12px' }}><span style={{ background: `${a.ticket_types?.color || '#e94560'}18`, color: a.ticket_types?.color || '#e94560', padding: '2px 8px', borderRadius: '50px', fontSize: '11px', fontWeight: 600 }}>{a.ticket_types?.name}</span></td>
                      <td style={{ padding: '12px' }}><span style={{ color: a.status === 'active' ? '#10b981' : a.status === 'used' ? '#f59e0b' : '#ef4444' }}>{a.status}</span></td>
                      <td style={{ padding: '12px' }}>{a.is_checked_in ? <span style={{ color: '#10b981' }}>✓ {a.checked_in_at ? new Date(a.checked_in_at).toLocaleTimeString() : ''}</span> : <span style={{ color: 'rgba(255,255,255,0.25)' }}>—</span>}</td>
                      <td style={{ padding: '12px', color: 'rgba(255,255,255,0.4)' }}>{new Date(a.purchase_date).toLocaleDateString()}</td>
                    </tr>
                  ))}
                  {attendees.length === 0 && (
                    <tr><td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: 'rgba(255,255,255,0.3)' }}>No attendees found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

AdminEventDetail.getLayout = (page) => page;
