import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '../../../components/AdminLayout';

export default function AdminEvents() {
  const router = useRouter();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/stats').then(r => r.json()).then(d => { setEvents(d.events || []); setLoading(false); });
  }, []);

  const statusColor = { published: '#10b981', draft: '#f59e0b', sold_out: '#ef4444', completed: '#6b7280', cancelled: '#ef4444' };

  return (
    <AdminLayout title="Events">
      <div style={{ padding: 'clamp(20px,3vw,40px)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: '28px', fontWeight: 700 }}>Events</h1>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px', marginTop: '4px' }}>Manage all your events</p>
          </div>
          <button onClick={() => router.push('/admin/events/new')} style={{ background: '#e94560', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: '50px', fontWeight: 700, fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            + Create Event
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.3)', padding: '60px' }}>Loading events...</div>
        ) : events.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px', color: 'rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.02)', borderRadius: '20px', border: '1px dashed rgba(255,255,255,0.08)' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎪</div>
            <p style={{ fontSize: '18px', marginBottom: '20px' }}>No events yet</p>
            <button onClick={() => router.push('/admin/events/new')} style={{ background: '#e94560', color: '#fff', border: 'none', padding: '14px 28px', borderRadius: '50px', fontWeight: 700, cursor: 'pointer' }}>Create Your First Event</button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: '16px' }}>
            {events.map(ev => (
              <div key={ev.id} onClick={() => router.push(`/admin/events/${ev.id}`)} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px', padding: '20px', cursor: 'pointer', transition: 'all 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#e94560'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; e.currentTarget.style.transform = 'none'; }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: '17px', fontWeight: 600, lineHeight: 1.3, flex: 1, marginRight: '8px' }}>{ev.event_name}</h3>
                  <span style={{ fontSize: '11px', padding: '3px 10px', borderRadius: '50px', background: `${statusColor[ev.status]}18`, color: statusColor[ev.status], fontWeight: 700, whiteSpace: 'nowrap', textTransform: 'capitalize', flexShrink: 0 }}>{ev.status}</span>
                </div>
                <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '13px', marginBottom: '16px' }}>
                  📅 {new Date(ev.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontSize: '20px', fontWeight: 800, color: '#d4a853', fontFamily: "'Playfair Display',serif" }}>{ev.sold}</div>
                    <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)' }}>tickets sold</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '20px', fontWeight: 800, color: '#10b981', fontFamily: "'Playfair Display',serif" }}>{ev.checkedIn}</div>
                    <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)' }}>checked in</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

AdminEvents.getLayout = (page) => page;
