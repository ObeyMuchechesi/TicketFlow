import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { Ticket, Globe, LogOut, CalendarDays, MapPin, CalendarRange, QrCode, ClipboardList } from 'lucide-react';

const EVENT_GRADIENTS = [
  'linear-gradient(135deg, #a855f7, #ec4899)',
  'linear-gradient(135deg, #3b82f6, #8b5cf6)',
  'linear-gradient(135deg, #10b981, #06b6d4)',
  'linear-gradient(135deg, #f59e0b, #ef4444)',
  'linear-gradient(135deg, #0ea5e9, #6366f1)',
  'linear-gradient(135deg, #84cc16, #22d3ee)',
];

export default function StaffDashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    // Role guard: only gate staff (or admins/organisers) may view this page.
    // Only a genuine 401 (no session / expired / deactivated) sends us to login;
    // transient server errors are ignored so users are never logged out by a hiccup.
    fetch('/api/auth/me')
      .then(r => r.json())
      .then(d => {
        if (d.user) {
          if (!['gate_staff', 'super_admin', 'organiser'].includes(d.user.role)) {
            router.replace('/staff/login');
            return;
          }
          setUser(d.user);
          setChecking(false);
        } else if (d.error) {
          // server hiccup — keep waiting, don't bounce
        } else {
          router.replace('/staff/login');
        }
      })
      .catch(() => {});
  }, []);

  // Staff only ever see the event(s) they are assigned to — never all events.
  useEffect(() => {
    fetch('/api/staff/events')
      .then(r => r.json())
      .then(d => { setEvents(d.events || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/staff/login');
  }

  const available = events.filter(e => e.status === 'published' || e.status === 'sold_out');

  return (
    <>
      <Head>
        <title>Gate Staff Dashboard — TiketFlow</title>
      </Head>
      <div style={{ minHeight: '100vh', background: 'var(--bg-primary, #f8f9fc)', color: 'var(--text-primary, #1a1d2e)' }}>
        {/* Top bar */}
        <header style={{
          position: 'sticky', top: 0, zIndex: 10,
          background: 'rgba(255,255,255,0.85)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid var(--border-primary, rgba(0,0,0,0.07))',
          padding: '14px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          flexWrap: 'wrap',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '38px', height: '38px', borderRadius: '12px',
              background: 'linear-gradient(135deg, #10b981, #2563eb, #ec4899)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}><Ticket size={20} strokeWidth={2.25} style={{ color: '#fff' }} /></div>
            <div>
              <div style={{ fontFamily: 'var(--font-primary)', fontWeight: 800, fontSize: '16px', lineHeight: 1.2 }}>
                TiketFlow <span style={{ color: 'var(--text-tertiary)', fontWeight: 600, fontSize: '13px' }}>· Gate Staff</span>
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
                {user ? `${user.full_name} · ${user.role.replace('_', ' ')}` : 'Loading…'}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <a
              href="/"
              style={{
                fontSize: '13px', color: 'var(--text-secondary)',
                textDecoration: 'none', padding: '9px 14px',
                borderRadius: '10px', fontWeight: 600,
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-tertiary)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            ><Globe size={14} strokeWidth={2} style={{ verticalAlign: '-2px', marginRight: '5px' }} />View Site</a>
            <button
              onClick={handleLogout}
              style={{
                fontSize: '13px', fontWeight: 700, cursor: 'pointer',
                padding: '9px 16px', borderRadius: '10px',
                border: '1px solid rgba(239,68,68,0.25)',
                background: 'rgba(239,68,68,0.06)',
                color: '#dc2626',
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#dc2626'; e.currentTarget.style.color = '#fff'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.06)'; e.currentTarget.style.color = '#dc2626'; }}
            ><LogOut size={14} strokeWidth={2} style={{ verticalAlign: '-2px', marginRight: '5px' }} />Sign Out</button>
          </div>
        </header>

        <div style={{ maxWidth: '860px', margin: '0 auto', padding: 'clamp(24px, 4vw, 48px) 20px 80px' }}>
          {/* Heading */}
          <div className="fade-in-up" style={{ marginBottom: '28px' }}>
            <h1 style={{ fontFamily: 'var(--font-primary)', fontSize: 'clamp(24px, 4vw, 32px)', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '6px' }}>
              Gate Staff Dashboard
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
              Select an event to start scanning tickets and checking in attendees.
            </p>
          </div>

          {/* Quick stats */}
          {!loading && (
            <div className="adm-kpi-grid" style={{ marginBottom: '24px', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))' }}>
              <div className="adm-kpi-card" style={{ '--kpi-accent': 'linear-gradient(135deg, #10b981, #06b6d4)' }}>
                <div className="adm-kpi-label">Live Events</div>
                <div className="adm-kpi-value" style={{ background: 'linear-gradient(135deg, #10b981, #06b6d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                  {available.length}
                </div>
              </div>
              <div className="adm-kpi-card" style={{ '--kpi-accent': 'linear-gradient(135deg, #a855f7, #ec4899)' }}>
                <div className="adm-kpi-label">Today</div>
                <div className="adm-kpi-value" style={{ background: 'linear-gradient(135deg, #a855f7, #ec4899)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                  {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </div>
              </div>
              <div className="adm-kpi-card" style={{ '--kpi-accent': 'linear-gradient(135deg, #f59e0b, #ef4444)' }}>
                <div className="adm-kpi-label">My Role</div>
                <div className="adm-kpi-value" style={{ background: 'linear-gradient(135deg, #f59e0b, #ef4444)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', fontSize: '20px' }}>
                  Gate Staff
                </div>
              </div>
            </div>
          )}

          {/* Event list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }} className="stagger-children">
            {loading || checking ? (
              [...Array(3)].map((_, i) => (
                <div key={i} className="adm-chart-card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div className="adm-skeleton" style={{ width: '48px', height: '48px', borderRadius: '14px' }} />
                  <div style={{ flex: 1 }}>
                    <div className="adm-skeleton" style={{ width: '70%', height: '18px', marginBottom: '6px' }} />
                    <div className="adm-skeleton" style={{ width: '50%', height: '13px' }} />
                  </div>
                </div>
              ))
            ) : events.length === 0 ? (
              <div className="adm-chart-card fade-in-up">                  <div className="adm-empty">
                  <div className="adm-empty-icon"><ClipboardList size={32} strokeWidth={1.75} /></div>
                  <div className="adm-empty-title">No Events Available</div>
                  <div className="adm-empty-desc">No published events to check in for yet. Contact the event organiser.</div>
                </div>
              </div>
            ) : (
              available.map((ev, i) => (
                <div
                  key={ev.id}
                  className="adm-quick-action adm-ripple"
                  onClick={() => router.push(`/checkin/${ev.id}`)}
                  style={{ padding: '20px 24px', cursor: 'pointer' }}
                >
                  <div style={{
                    width: '48px', height: '48px', borderRadius: '14px',
                    background: EVENT_GRADIENTS[i % EVENT_GRADIENTS.length],
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}><CalendarRange size={20} strokeWidth={2} style={{ color: '#fff' }} /></div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '16px', fontWeight: 700, marginBottom: '4px' }}>{ev.event_name}</div>
                    <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                      <CalendarDays size={13} strokeWidth={2} style={{ verticalAlign: '-2px', marginRight: '4px' }} />{new Date(ev.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                      {ev.venue && <> · <MapPin size={13} strokeWidth={2} style={{ verticalAlign: '-2px', marginRight: '3px' }} />{ev.venue.split(',')[0]}</>}
                    </div>
                  </div>
                  <div style={{ color: 'var(--accent-primary, #7c3aed)', fontWeight: 700, fontSize: '14px', flexShrink: 0 }}>
                    Open Check-in →
                  </div>
                </div>
              ))
            )}
          </div>

          <p style={{ marginTop: '36px', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '12px' }}>
            Scan tickets at the gate · Search attendees · Track attendance in real time
          </p>
        </div>
      </div>
    </>
  );
}

StaffDashboard.getLayout = (page) => page;
