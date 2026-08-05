import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

export default function CheckinPage() {
  const router = useRouter();
  const { eventId } = router.query;
  const [stats, setStats] = useState(null);
  const [scanInput, setScanInput] = useState('');
  const [result, setResult] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [tab, setTab] = useState('scan');
  const [camError, setCamError] = useState('');
  const inputRef = useRef(null);
  const resultTimeout = useRef(null);

  // Auto-focus scan input
  useEffect(() => { if (tab === 'scan') inputRef.current?.focus(); }, [tab]);

  // Poll stats every 10s
  useEffect(() => {
    if (!eventId) return;
    function load() { fetch(`/api/checkin/stats?eventId=${eventId}`).then(r => r.json()).then(setStats); }
    load();
    const iv = setInterval(load, 10000);
    return () => clearInterval(iv);
  }, [eventId]);

  async function processToken(token) {
    if (!token?.trim()) return;
    setScanInput(''); setResult(null);
    try {
      const res = await fetch('/api/checkin/scan', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: token.trim(), eventId }),
      });
      const data = await res.json();
      setResult(data);
      // Refresh stats
      fetch(`/api/checkin/stats?eventId=${eventId}`).then(r => r.json()).then(setStats);
    } catch { setResult({ valid: false, reason: 'ERROR', message: 'Network error. Check connection.' }); }
    // Auto-clear result after 5s
    clearTimeout(resultTimeout.current);
    resultTimeout.current = setTimeout(() => setResult(null), 5000);
  }

  async function handleSearchSubmit(e) {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    try {
      const res = await fetch(`/api/admin/attendees?eventId=${eventId}&search=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      setSearchResults(data.attendees || []);
    } catch { setSearchResults([]); }
  }

  const resultConfig = {
    SUCCESS: { color: '#10b981', bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.3)', icon: '✅' },
    ALREADY_USED: { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.3)', icon: '⚠️' },
    INVALID: { color: '#ef4444', bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.3)', icon: '❌' },
    CANCELLED: { color: '#ef4444', bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.3)', icon: '🚫' },
    ERROR: { color: '#ef4444', bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.3)', icon: '⚠️' },
  };
  const rc = result ? (resultConfig[result.reason] || resultConfig.ERROR) : null;

  return (
    <>
      <Head>
        <title>Check-In — TiketFlow</title>
        <style>{`*{box-sizing:border-box;margin:0;padding:0}body{font-family:'DM Sans',sans-serif;background:#0a0a0a;color:#fff;overflow-x:hidden}`}</style>
      </Head>
      <div style={{ minHeight: '100vh', background: 'linear-gradient(160deg,#0a0a0a 0%,#0d1117 100%)' }}>
        {/* Header */}
        <div style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.07)', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontFamily: "'Playfair Display',serif", fontSize: '18px', fontWeight: 700, background: 'linear-gradient(120deg,#e94560,#d4a853)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>TiketFlow</div>
            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px', marginTop: '2px' }}>Gate Staff · {stats?.eventName || 'Loading...'}</div>
          </div>
          <button onClick={() => router.push('/checkin')} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '50px', padding: '8px 16px', color: 'rgba(255,255,255,0.5)', fontSize: '13px', cursor: 'pointer' }}>← Events</button>
        </div>

        {/* Stats bar */}
        {stats && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            {[
              { l: 'Checked In', v: stats.checkedIn, c: '#10b981' },
              { l: 'Total Tickets', v: stats.total, c: '#fff' },
              { l: 'Capacity Left', v: stats.capacity > 0 ? stats.capacity - stats.checkedIn : '∞', c: '#d4a853' },
            ].map(s => (
              <div key={s.l} style={{ padding: '16px', textAlign: 'center', borderRight: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ fontSize: '28px', fontWeight: 800, color: s.c, fontFamily: "'Playfair Display',serif" }}>{s.v}</div>
                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', marginTop: '2px' }}>{s.l}</div>
              </div>
            ))}
          </div>
        )}

        <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px' }}>
          {/* Tabs */}
          <div style={{ display: 'flex', gap: '0', borderBottom: '1px solid rgba(255,255,255,0.08)', marginBottom: '20px' }}>
            {[['scan', '📷 Scan QR'], ['manual', '🔍 Manual Search'], ['recent', '📋 Recent']].map(([t, l]) => (
              <button key={t} onClick={() => setTab(t)} style={{ padding: '12px 18px', background: 'transparent', border: 'none', borderBottom: tab === t ? '2px solid #e94560' : '2px solid transparent', color: tab === t ? '#fff' : 'rgba(255,255,255,0.4)', fontWeight: tab === t ? 600 : 400, fontSize: '14px', cursor: 'pointer' }}>{l}</button>
            ))}
          </div>

          {/* Result overlay */}
          {result && rc && (
            <div style={{ background: rc.bg, border: `1px solid ${rc.border}`, borderRadius: '16px', padding: '20px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '16px', animation: 'fadeIn 0.2s ease' }}>
              <div style={{ fontSize: '40px', flexShrink: 0 }}>{rc.icon}</div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '18px', color: rc.color }}>{result.message}</div>
                {result.ticket && (
                  <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px', marginTop: '4px' }}>
                    {result.ticket.buyer_name} · {result.ticket.ticket_type}
                    {result.ticket.checked_in_at && ` · ${new Date(result.ticket.checked_in_at).toLocaleTimeString()}`}
                  </div>
                )}
              </div>
            </div>
          )}

          {tab === 'scan' && (
            <div>
              {/* QR code text input (for USB scanners or manual token entry) */}
              <div style={{ background: 'rgba(255,255,255,0.04)', border: '2px solid rgba(255,255,255,0.1)', borderRadius: '16px', padding: '24px', marginBottom: '16px', textAlign: 'center' }}>
                <div style={{ fontSize: '40px', marginBottom: '12px' }}>📷</div>
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px', marginBottom: '16px' }}>Point your QR scanner at the ticket, or enter the token manually below.</p>
                <input
                  ref={inputRef}
                  value={scanInput}
                  onChange={e => setScanInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && scanInput.trim()) processToken(scanInput); }}
                  placeholder="Scan or paste ticket token here..."
                  style={{ width: '100%', padding: '14px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '12px', color: '#fff', fontSize: '15px', outline: 'none', textAlign: 'center', letterSpacing: '1px' }}
                />
                <button onClick={() => processToken(scanInput)} disabled={!scanInput.trim()} style={{ marginTop: '12px', width: '100%', padding: '14px', background: '#e94560', border: 'none', borderRadius: '50px', color: '#fff', fontWeight: 700, fontSize: '16px', opacity: scanInput.trim() ? 1 : 0.5 }}>
                  ✓ Verify Ticket
                </button>
              </div>
              <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.25)', fontSize: '12px' }}>Press Enter after scanning to auto-verify</p>
            </div>
          )}

          {tab === 'manual' && (
            <div>
              <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search by name, email, or phone..." style={{ flex: 1, padding: '13px 16px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '12px', color: '#fff', fontSize: '14px', outline: 'none' }} />
                <button type="submit" style={{ padding: '13px 20px', background: '#e94560', border: 'none', borderRadius: '12px', color: '#fff', fontWeight: 700, fontSize: '14px' }}>Search</button>
              </form>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {searchResults.map(a => (
                  <div key={a.id} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '14px', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
                    <div>
                      <div style={{ fontWeight: 600, marginBottom: '3px' }}>{a.buyer_name}</div>
                      <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px' }}>{a.buyer_email} · {a.ticket_types?.name}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                      {a.is_checked_in ? (
                        <span style={{ color: '#f59e0b', fontSize: '12px', fontWeight: 600 }}>✓ Used</span>
                      ) : (
                        <button onClick={() => processToken(a.qr_code_token)} style={{ background: '#10b981', border: 'none', borderRadius: '50px', padding: '8px 16px', color: '#fff', fontWeight: 700, fontSize: '13px', cursor: 'pointer' }}>Check In</button>
                      )}
                    </div>
                  </div>
                ))}
                {searchResults.length === 0 && searchQuery && (
                  <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.3)', padding: '32px', fontSize: '14px' }}>No attendees found</div>
                )}
              </div>
            </div>
          )}

          {tab === 'recent' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {(stats?.recent || []).length === 0 ? (
                <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.3)', padding: '40px', fontSize: '14px' }}>No recent check-ins</div>
              ) : (
                (stats?.recent || []).map((c, i) => (
                  <div key={i} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(16,185,129,0.15)', borderRadius: '12px', padding: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '14px', marginBottom: '2px' }}>{c.tickets?.buyer_name || 'Unknown'}</div>
                      <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: '12px' }}>{c.tickets?.ticket_types?.name || '—'}</div>
                    </div>
                    <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: '12px' }}>
                      {new Date(c.scanned_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

CheckinPage.getLayout = (page) => page;
