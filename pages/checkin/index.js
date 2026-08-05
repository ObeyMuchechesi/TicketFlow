import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

export default function CheckinHome() {
  const router = useRouter();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/events').then(r => r.json()).then(d => { setEvents(d.events || []); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  return (
    <>
      <Head>
        <title>Gate Staff — TiketFlow</title>
      </Head>
      <div style={{ minHeight: '100vh', background: 'var(--bg-primary, #0a0a0f)', color: 'var(--text-primary, #fff)' }}>
        <div style={{ maxWidth: '640px', margin: '0 auto', padding: 'clamp(20px, 3vw, 40px)' }}>
          {/* Header */}
          <div style={{ marginBottom: '32px' }} className="fade-in-up">
            <div style={{
              fontFamily: 'var(--font-primary, Plus Jakarta Sans)',
              fontSize: '22px', fontWeight: 800,
              background: 'var(--accent-gradient)', WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent', backgroundClip: 'text',
              marginBottom: '4px',
            }}>TiketFlow</div>
            <h1 style={{ fontFamily: 'var(--font-primary)', fontSize: '28px', fontWeight: 800, marginBottom: '6px' }}>Gate Staff Panel</h1>
            <p style={{ color: 'var(--text-secondary, rgba(255,255,255,0.4))', fontSize: '14px' }}>
              Select an event to start checking in attendees
            </p>
          </div>

          {/* Stats */}
          {!loading && events.length > 0 && (
            <div className="adm-kpi-grid" style={{ marginBottom: '24px', gridTemplateColumns: '1fr 1fr' }}>
              <div className="adm-kpi-card" style={{ '--kpi-accent': 'linear-gradient(135deg, #10b981, #06b6d4)' }}>
                <div className="adm-kpi-label">Available Events</div>
                <div className="adm-kpi-value" style={{ background: 'linear-gradient(135deg, #10b981, #06b6d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                  {events.filter(e => e.status === 'published').length || events.length}
                </div>
              </div>
              <div className="adm-kpi-card" style={{ '--kpi-accent': 'linear-gradient(135deg, #a855f7, #ec4899)' }}>
                <div className="adm-kpi-label">Today</div>
                <div className="adm-kpi-value" style={{ background: 'linear-gradient(135deg, #a855f7, #ec4899)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                  {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </div>
              </div>
            </div>
          )}

          {loading ? (
            <div className="stagger-children" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[...Array(3)].map((_, i) => (
                <div key={i} className="adm-chart-card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div className="adm-skeleton" style={{ width: '48px', height: '48px', borderRadius: '14px' }} />
                  <div style={{ flex: 1 }}>
                    <div className="adm-skeleton" style={{ width: '70%', height: '18px', marginBottom: '6px' }} />
                    <div className="adm-skeleton" style={{ width: '50%', height: '13px' }} />
                  </div>
                </div>
              ))}
            </div>
          ) : events.length === 0 ? (
            <div className="adm-chart-card fade-in-up">
              <div className="adm-empty">
                <div className="adm-empty-icon">📋</div>
                <div className="adm-empty-title">No Events Available</div>
                <div className="adm-empty-desc">No published events to check in for. Contact the event organizer.</div>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }} className="stagger-children">
              {events.map((ev, i) => (
                <div
                  key={ev.id}
                  className="adm-quick-action adm-ripple"
                  onClick={() => router.push(`/checkin/${ev.id}`)}
                  style={{ padding: '20px 24px' }}
                >
                  <div style={{
                    width: '48px', height: '48px', borderRadius: '14px',
                    background: `linear-gradient(135deg, ${['#a855f7', '#3b82f6', '#10b981', '#f59e0b', '#e94560'][i % 5]}, ${['#ec4899', '#8b5cf6', '#06b6d4', '#ef4444', '#f97316'][i % 5]})`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '20px', flexShrink: 0,
                  }}>🎪</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '16px', fontWeight: 700, marginBottom: '4px' }}>{ev.event_name}</div>
                    <div style={{ fontSize: '13px', color: 'var(--text-secondary, rgba(255,255,255,0.4))' }}>
                      📅 {new Date(ev.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                      {ev.venue && ` · 📍 ${ev.venue.split(',')[0]}`}
                    </div>
                  </div>
                  <div style={{ color: 'var(--accent-primary, #8b5cf6)', fontWeight: 700, fontSize: '20px', flexShrink: 0 }}>→</div>
                </div>
              ))}
            </div>
          )}

          <div style={{ marginTop: '40px', textAlign: 'center' }}>
            <a href="/admin/login" style={{ color: 'var(--text-tertiary, rgba(255,255,255,0.25))', fontSize: '13px', textDecoration: 'none', transition: 'color 0.2s' }}
              onMouseEnter={e => e.target.style.color = 'var(--text-primary, #fff)'}
              onMouseLeave={e => e.target.style.color = 'var(--text-tertiary, rgba(255,255,255,0.25)'}
            >Admin Login →</a>
          </div>
        </div>
      </div>
    </>
  );
}

CheckinHome.getLayout = (page) => page;
