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
        <style>{`*{box-sizing:border-box;margin:0;padding:0}body{font-family:'DM Sans',sans-serif;background:#0a0a0a;color:#fff}`}</style>
      </Head>
      <div style={{ minHeight: '100vh', background: 'linear-gradient(160deg,#0a0a0a 0%,#0d1117 100%)', padding: '24px' }}>
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
          <div style={{ marginBottom: '32px' }}>
            <div style={{ fontFamily: "'Playfair Display',serif", fontSize: '24px', fontWeight: 700, background: 'linear-gradient(120deg,#e94560,#d4a853)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: '4px' }}>TiketFlow</div>
            <h1 style={{ fontSize: '28px', fontWeight: 700, marginBottom: '6px' }}>Gate Staff Panel</h1>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '15px' }}>Select an event to start checking in attendees</p>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px', color: 'rgba(255,255,255,0.3)' }}>Loading events...</div>
          ) : events.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px', color: 'rgba(255,255,255,0.3)' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>📋</div>
              <p>No published events available.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {events.map(ev => (
                <div key={ev.id} onClick={() => router.push(`/checkin/${ev.id}`)}
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '20px 24px', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = '#e94560'; e.currentTarget.style.background = 'rgba(233,69,96,0.06)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '17px', marginBottom: '4px' }}>{ev.event_name}</div>
                    <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px' }}>
                      📅 {new Date(ev.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                      {ev.venue && ` · 📍 ${ev.venue.split(',')[0]}`}
                    </div>
                  </div>
                  <div style={{ color: '#e94560', fontWeight: 700, fontSize: '20px' }}>→</div>
                </div>
              ))}
            </div>
          )}

          <div style={{ marginTop: '40px', textAlign: 'center' }}>
            <a href="/admin/login" style={{ color: 'rgba(255,255,255,0.25)', fontSize: '13px', textDecoration: 'none' }}>Admin Login →</a>
          </div>
        </div>
      </div>
    </>
  );
}

CheckinHome.getLayout = (page) => page;
