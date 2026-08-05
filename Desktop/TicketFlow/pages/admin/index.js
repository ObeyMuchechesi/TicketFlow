import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '../../components/AdminLayout';

function StatCard({ label, value, sub, color = '#e94560', icon }) {
  return (
    <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px', padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>{label}</p>
          <p style={{ fontSize: '32px', fontWeight: 800, color, fontFamily: "'Playfair Display',serif" }}>{value}</p>
          {sub && <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '12px', marginTop: '4px' }}>{sub}</p>}
        </div>
        <span style={{ fontSize: '28px' }}>{icon}</span>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/stats')
      .then(r => r.json())
      .then(d => { setStats(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return (
    <AdminLayout title="Dashboard">
      <div style={{ padding: 'clamp(20px,3vw,40px)' }}>
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: 'clamp(24px,3vw,32px)', fontWeight: 700, marginBottom: '6px' }}>Dashboard</h1>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px' }}>Welcome back. Here's your event overview.</p>
        </div>

        {loading ? (
          <div style={{ color: 'rgba(255,255,255,0.3)', padding: '40px', textAlign: 'center' }}>Loading stats...</div>
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: '16px', marginBottom: '32px' }}>
              <StatCard label="Total Revenue" value={`$${(stats?.totalRevenue || 0).toLocaleString()}`} sub="All time" color="#d4a853" icon="💰" />
              <StatCard label="Tickets Sold" value={(stats?.totalTicketsSold || 0).toLocaleString()} sub="All events" color="#e94560" icon="🎟️" />
              <StatCard label="Total Events" value={stats?.totalEvents || 0} sub="Across all organizers" color="#10b981" icon="🎪" />
              <StatCard label="Published" value={(stats?.events || []).filter(e => e.status === 'published').length} sub="Live events" color="#3b82f6" icon="🟢" />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: '20px', fontWeight: 600 }}>Your Events</h2>
              <button onClick={() => router.push('/admin/events/new')} style={{ background: '#e94560', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '50px', fontWeight: 600, fontSize: '14px' }}>+ New Event</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {(stats?.events || []).length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px', color: 'rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '1px dashed rgba(255,255,255,0.1)' }}>
                  <div style={{ fontSize: '40px', marginBottom: '12px' }}>🎪</div>
                  <p>No events yet. Create your first event!</p>
                  <button onClick={() => router.push('/admin/events/new')} style={{ marginTop: '16px', background: '#e94560', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: '50px', fontWeight: 600, cursor: 'pointer' }}>Create Event</button>
                </div>
              ) : (
                (stats.events || []).map(ev => (
                  <EventRow key={ev.id} event={ev} router={router} />
                ))
              )}
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
}

function EventRow({ event, router }) {
  const statusColor = { published: '#10b981', draft: '#f59e0b', sold_out: '#ef4444', completed: '#6b7280', cancelled: '#ef4444' };
  const pct = event.capacity > 0 ? Math.min((event.sold / event.capacity) * 100, 100) : 0;

  return (
    <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '14px', padding: '20px', display: 'grid', gridTemplateColumns: '1fr auto', gap: '16px', alignItems: 'center', cursor: 'pointer', transition: 'border-color 0.2s' }}
      onClick={() => router.push(`/admin/events/${event.id}`)}
      onMouseEnter={e => e.currentTarget.style.borderColor = '#e94560'}
      onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
          <span style={{ fontWeight: 600, fontSize: '16px' }}>{event.event_name}</span>
          <span style={{ fontSize: '11px', padding: '2px 10px', borderRadius: '50px', background: `${statusColor[event.status]}20`, color: statusColor[event.status], fontWeight: 700, textTransform: 'capitalize' }}>{event.status}</span>
        </div>
        <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', marginBottom: '10px' }}>
          📅 {new Date(event.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
        </div>
        {event.capacity > 0 && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'rgba(255,255,255,0.35)', marginBottom: '4px' }}>
              <span>{event.sold} sold</span><span>{event.capacity} capacity</span>
            </div>
            <div style={{ height: '4px', background: 'rgba(255,255,255,0.08)', borderRadius: '2px' }}>
              <div style={{ height: '100%', width: `${pct}%`, background: pct > 90 ? '#ef4444' : pct > 70 ? '#f59e0b' : '#10b981', borderRadius: '2px', transition: 'width 0.5s' }} />
            </div>
          </div>
        )}
      </div>
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div style={{ fontSize: '22px', fontWeight: 800, color: '#d4a853', fontFamily: "'Playfair Display',serif" }}>{event.sold}</div>
        <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)' }}>tickets sold</div>
        <div style={{ fontSize: '11px', color: '#e94560', marginTop: '8px', fontWeight: 600 }}>Manage →</div>
      </div>
    </div>
  );
}

AdminDashboard.getLayout = (page) => page;
