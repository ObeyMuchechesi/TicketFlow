import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { Badge, Progress } from '../../components/ui';

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
  const [flashOn, setFlashOn] = useState(false);
  const [cameraFacing, setCameraFacing] = useState('back');
  const [batteryMode, setBatteryMode] = useState(false);
  const inputRef = useRef(null);
  const resultTimeout = useRef(null);
  const todayCount = (stats?.recent || []).filter(c => {
    if (!c?.scanned_at) return false;
    const d = new Date(c.scanned_at);
    const now = new Date();
    return d.toDateString() === now.toDateString();
  }).length;

  useEffect(() => { if (tab === 'scan') inputRef.current?.focus(); }, [tab]);

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
      fetch(`/api/checkin/stats?eventId=${eventId}`).then(r => r.json()).then(setStats);
    } catch { setResult({ valid: false, reason: 'ERROR', message: 'Network error. Check connection.' }); }
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
    SUCCESS: { color: '#10b981', bg: 'rgba(16,185,129,0.14)', border: 'rgba(16,185,129,0.4)', icon: '✅' },
    ALREADY_USED: { color: '#f59e0b', bg: 'rgba(245,158,11,0.14)', border: 'rgba(245,158,11,0.4)', icon: '⚠️' },
    INVALID: { color: '#ef4444', bg: 'rgba(239,68,68,0.14)', border: 'rgba(239,68,68,0.4)', icon: '❌' },
    CANCELLED: { color: '#ef4444', bg: 'rgba(239,68,68,0.14)', border: 'rgba(239,68,68,0.4)', icon: '🚫' },
    ERROR: { color: '#ef4444', bg: 'rgba(239,68,68,0.14)', border: 'rgba(239,68,68,0.4)', icon: '⚠️' },
  };
  const rc = result ? (resultConfig[result.reason] || resultConfig.ERROR) : null;
  const isSuccess = result?.reason === 'SUCCESS';

  return (
    <>
      <Head>
        <title>Check-In — TiketFlow</title>
        <style>{`*{box-sizing:border-box;margin:0;padding:0}body{font-family:'Inter',sans-serif;background:#050508;color:#fff;overflow-x:hidden;-webkit-font-smoothing:antialiased}`}</style>
      </Head>
      <div
        id="checkin-root"
        style={{
          minHeight: '100vh',
          background: 'linear-gradient(160deg, #050508 0%, #0c0915 50%, #03050c 100%)',
          transition: 'filter 0.3s ease',
          filter: batteryMode ? 'brightness(0.65) contrast(0.9)' : 'none',
          position: 'relative',
        }}
      >
        <div
          className="mesh-gradient"
          style={{
            position: 'fixed',
            inset: 0,
            pointerEvents: 'none',
            opacity: 0.35,
          }}
        />

        <div style={{ position: 'relative', zIndex: 2 }}>
          <div
            style={{
              background: 'rgba(13, 11, 22, 0.7)',
              backdropFilter: 'blur(24px) saturate(180%)',
              WebkitBackdropFilter: 'blur(24px) saturate(180%)',
              borderBottom: '1px solid rgba(255,255,255,0.06)',
              padding: '14px 18px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '10px',
            }}
            className="glass"
          >
            <div>
              <div style={{
                fontFamily: "var(--font-display)",
                fontSize: '18px',
                fontWeight: 800,
                background: 'linear-gradient(120deg, #e94560, #d4a853, #a855f7)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                marginBottom: '2px',
              }}>TiketFlow Gate</div>
              <div style={{ color: 'var(--text-muted)', fontSize: '12px' }}>
                Gate Staff · {stats?.eventName || 'Loading event...'}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                onClick={() => setBatteryMode(b => !b)}
                title="Battery Friendly Mode"
                style={{
                  background: batteryMode ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.05)',
                  border: `1px solid ${batteryMode ? 'rgba(16,185,129,0.35)' : 'rgba(255,255,255,0.1)'}`,
                  borderRadius: '12px',
                  padding: '8px 12px',
                  color: batteryMode ? '#10b981' : 'var(--text-muted)',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <span style={{ fontSize: '14px' }}>{batteryMode ? '🔋' : '⚡'}</span>
                {batteryMode ? 'Low Power' : 'Battery'}
              </button>
              <button
                onClick={() => router.push('/checkin')}
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '12px',
                  padding: '8px 14px',
                  color: 'var(--text-muted)',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
              >
                ← Events
              </button>
            </div>
          </div>

          {stats && (
            <div
              className="glass"
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                borderBottom: '1px solid rgba(255,255,255,0.05)',
                background: 'rgba(13, 11, 22, 0.5)',
                backdropFilter: 'blur(16px)',
              }}
            >
              {[
                { l: 'Checked In', v: stats.checkedIn, c: 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)', badge: 'success' },
                { l: 'Total Tickets', v: stats.total, c: 'linear-gradient(135deg, #a855f7 0%, #ec4899 100%)', badge: 'primary' },
                { l: "Today's Entries", v: todayCount, c: 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)', badge: 'warning', pulse: true },
                { l: 'Remaining', v: stats.capacity > 0 ? Math.max(0, stats.capacity - stats.checkedIn) : '∞', c: 'linear-gradient(135deg, #d4a853 0%, #a855f7 100%)', badge: 'info' },
              ].map((s, i) => (
                <div
                  key={s.l}
                  style={{
                    padding: '16px 12px',
                    textAlign: 'center',
                    borderRight: i < 3 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                    position: 'relative',
                  }}
                >
                  {s.pulse && (
                    <div style={{
                      position: 'absolute',
                      top: '10px',
                      right: '10px',
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: '#f59e0b',
                      animation: 'pulse-ring 1.8s infinite',
                    }} />
                  )}
                  <div style={{
                    fontSize: '26px',
                    fontWeight: 800,
                    fontFamily: "var(--font-display)",
                    background: s.c,
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    lineHeight: 1.1,
                  }}>{typeof s.v === 'number' ? s.v.toLocaleString() : s.v}</div>
                  <div style={{
                    fontSize: '10px',
                    color: 'var(--text-dimmed)',
                    marginTop: '4px',
                    fontWeight: 600,
                    letterSpacing: '0.3px',
                    textTransform: 'uppercase',
                  }}>{s.l}</div>
                </div>
              ))}
            </div>
          )}

          <div style={{ maxWidth: '560px', margin: '0 auto', padding: '18px 16px 40px' }}>
            <div
              style={{
                display: 'flex',
                gap: '4px',
                padding: '4px',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: '14px',
                marginBottom: '18px',
              }}
              className="glass"
            >
              {[
                ['scan', '📷 Scan'],
                ['manual', '🔍 Search'],
                ['recent', '📋 Recent'],
              ].map(([t, l]) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  style={{
                    flex: 1,
                    padding: '10px 12px',
                    background: tab === t ? 'var(--accent-gradient)' : 'transparent',
                    border: 'none',
                    borderRadius: '10px',
                    color: tab === t ? '#fff' : 'var(--text-muted)',
                    fontWeight: tab === t ? 700 : 500,
                    fontSize: '13px',
                    cursor: 'pointer',
                    transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    backgroundSize: '200% 200%',
                  }}
                  onMouseEnter={e => { if (tab !== t) e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
                  onMouseLeave={e => { if (tab !== t) e.currentTarget.style.background = 'transparent'; }}
                >{l}</button>
              ))}
            </div>

            {result && rc && (
              <div
                style={{
                  background: rc.bg,
                  border: `1px solid ${rc.border}`,
                  borderRadius: '20px',
                  padding: '22px',
                  marginBottom: '18px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  animation: 'fade-in 0.25s ease, modal-scale-up 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                  position: 'relative',
                  overflow: 'hidden',
                }}
                className={isSuccess ? 'pulse-ring' : 'animate-shake'}
              >
                <div
                  style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '20px',
                    background: `linear-gradient(135deg, ${rc.color}, ${rc.color}cc)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '32px',
                    flexShrink: 0,
                    boxShadow: `0 0 30px ${rc.color}55`,
                  }}
                  className={isSuccess ? 'animate-checkmark' : ''}
                >
                  {rc.icon}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontWeight: 800,
                    fontSize: '17px',
                    color: rc.color,
                    marginBottom: '4px',
                    fontFamily: "var(--font-display)",
                  }}>
                    {result.message}
                  </div>
                  {result.ticket && (
                    <div style={{
                      color: 'var(--text-muted)',
                      fontSize: '13px',
                      lineHeight: 1.5,
                    }}>
                      <div style={{ fontWeight: 600, color: 'var(--text)' }}>
                        {result.ticket.buyer_name}
                      </div>
                      <div>
                        {result.ticket.ticket_type}
                        {result.ticket.checked_in_at && (
                          <> · <span style={{ color: rc.color, fontWeight: 600 }}>{new Date(result.ticket.checked_in_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span></>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {tab === 'scan' && (
              <div className="fade-in-up">
                <div
                  style={{
                    position: 'relative',
                    width: '100%',
                    aspectRatio: '4/3',
                    borderRadius: '24px',
                    overflow: 'hidden',
                    background: flashOn
                      ? 'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.12), rgba(0,0,0,0.95) 50%)'
                      : 'radial-gradient(ellipse at center, rgba(168,85,247,0.08) 0%, rgba(0,0,0,0.95) 60%)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    marginBottom: '14px',
                    boxShadow: '0 20px 60px -20px rgba(0,0,0,0.8), inset 0 0 80px rgba(0,0,0,0.6)',
                  }}
                  className="glass"
                >
                  <div
                    style={{
                      position: 'absolute',
                      inset: '0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <div
                      style={{
                        width: '72%',
                        height: '65%',
                        position: 'relative',
                        borderRadius: '28px',
                      }}
                      className="pulse-glow"
                    >
                      <div
                        className="animate-laser"
                        style={{
                          position: 'absolute',
                          left: '6%',
                          right: '6%',
                          height: '3px',
                          background: 'linear-gradient(90deg, transparent, #a855f7, #ec4899, transparent)',
                          boxShadow: '0 0 24px rgba(168,85,247,0.8), 0 0 80px rgba(236,72,153,0.5)',
                          borderRadius: '3px',
                        }}
                      />

                      {/* Corner brackets */}
                      {[
                        { top: '0', left: '0', br: '20px 0 0 0', borderTop: '4px', borderLeft: '4px' },
                        { top: '0', right: '0', br: '0 20px 0 0', borderTop: '4px', borderRight: '4px' },
                        { bottom: '0', left: '0', br: '0 0 0 20px', borderBottom: '4px', borderLeft: '4px' },
                        { bottom: '0', right: '0', br: '0 0 20px 0', borderBottom: '4px', borderRight: '4px' },
                      ].map((pos, i) => (
                        <div
                          key={i}
                          style={{
                            position: 'absolute',
                            width: '36px',
                            height: '36px',
                            borderRadius: pos.br,
                            borderStyle: 'solid',
                            borderColor: '#a855f7',
                            borderTopWidth: pos.borderTop || '0',
                            borderLeftWidth: pos.borderLeft || '0',
                            borderRightWidth: pos.borderRight || '0',
                            borderBottomWidth: pos.borderBottom || '0',
                            top: pos.top,
                            left: pos.left,
                            right: pos.right,
                            bottom: pos.bottom,
                            filter: 'drop-shadow(0 0 8px rgba(168,85,247,0.7))',
                          }}
                        />
                      ))}

                      <div style={{
                        position: 'absolute',
                        inset: 0,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        pointerEvents: 'none',
                        gap: '10px',
                      }}>
                        <div style={{
                          fontSize: '48px',
                          animation: 'bounce-slow 2s ease-in-out infinite',
                        }}>📷</div>
                        <div style={{
                          fontSize: '12px',
                          color: 'rgba(255,255,255,0.7)',
                          fontWeight: 600,
                          letterSpacing: '0.5px',
                        }}>
                          POSITION QR CODE IN FRAME
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{
                  display: 'flex',
                  gap: '10px',
                  marginBottom: '14px',
                }}>
                  <button
                    onClick={() => setFlashOn(f => !f)}
                    style={{
                      flex: 1,
                      padding: '12px',
                      background: flashOn ? 'rgba(245,158,11,0.15)' : 'rgba(255,255,255,0.04)',
                      border: `1px solid ${flashOn ? 'rgba(245,158,11,0.4)' : 'rgba(255,255,255,0.08)'}`,
                      borderRadius: '14px',
                      color: flashOn ? '#f59e0b' : 'var(--text-muted)',
                      fontSize: '13px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                    }}
                  >
                    <span>{flashOn ? '💡' : '🔦'}</span>
                    {flashOn ? 'Flash ON' : 'Flash OFF'}
                  </button>
                  <button
                    onClick={() => setCameraFacing(f => f === 'back' ? 'front' : 'back')}
                    style={{
                      flex: 1,
                      padding: '12px',
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: '14px',
                      color: 'var(--text-muted)',
                      fontSize: '13px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                    }}
                  >
                    <span>🔄</span>
                    {cameraFacing === 'back' ? 'Rear Cam' : 'Front Cam'}
                  </button>
                </div>

                <div
                  className="glass"
                  style={{
                    background: 'rgba(13, 11, 22, 0.7)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '18px',
                    padding: '18px',
                  }}
                >
                  <div style={{
                    textAlign: 'center',
                    marginBottom: '12px',
                  }}>
                    <Badge variant="glass" icon="⌨️">USB Scanner / Manual Token</Badge>
                  </div>
                  <input
                    ref={inputRef}
                    value={scanInput}
                    onChange={e => setScanInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && scanInput.trim()) processToken(scanInput); }}
                    placeholder="Scan QR or paste ticket token here..."
                    className="premium-input"
                    style={{
                      textAlign: 'center',
                      letterSpacing: '1px',
                      fontSize: '14px',
                      fontWeight: 500,
                    }}
                  />
                  <button
                    onClick={() => processToken(scanInput)}
                    disabled={!scanInput.trim()}
                    style={{
                      marginTop: '12px',
                      width: '100%',
                      padding: '14px',
                      background: 'var(--accent-gradient)',
                      backgroundSize: '200% 200%',
                      border: 'none',
                      borderRadius: '14px',
                      color: '#fff',
                      fontWeight: 700,
                      fontSize: '15px',
                      cursor: scanInput.trim() ? 'pointer' : 'not-allowed',
                      opacity: scanInput.trim() ? 1 : 0.5,
                      transition: 'all 0.2s',
                      boxShadow: '0 10px 30px -10px rgba(168,85,247,0.5)',
                      fontFamily: "var(--font-display)",
                    }}
                  >
                    ✓ Verify Ticket
                  </button>
                  <p style={{
                    textAlign: 'center',
                    color: 'var(--text-dimmed)',
                    fontSize: '11px',
                    marginTop: '10px',
                    fontWeight: 500,
                  }}>
                    💡 Tip: Connect a USB QR scanner — it acts as keyboard input, press Enter after scan
                  </p>
                </div>
              </div>
            )}

            {tab === 'manual' && (
              <div className="fade-in-up">
                <form
                  onSubmit={handleSearchSubmit}
                  className="glass"
                  style={{
                    background: 'rgba(13, 11, 22, 0.7)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '18px',
                    padding: '16px',
                    marginBottom: '16px',
                  }}
                >
                  <div style={{
                    position: 'relative',
                  }}>
                    <span style={{
                      position: 'absolute',
                      left: '16px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      fontSize: '18px',
                      opacity: 0.6,
                      pointerEvents: 'none',
                    }}>🔍</span>
                    <input
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      placeholder="Search by name, email, or phone..."
                      style={{
                        width: '100%',
                        padding: '16px 16px 16px 46px',
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '14px',
                        color: '#fff',
                        fontSize: '15px',
                        outline: 'none',
                        transition: 'all 0.2s',
                      }}
                      onFocus={e => {
                        e.target.style.borderColor = 'var(--accent)';
                        e.target.style.boxShadow = '0 0 0 3px var(--accent-muted)';
                      }}
                      onBlur={e => {
                        e.target.style.borderColor = 'rgba(255,255,255,0.1)';
                        e.target.style.boxShadow = 'none';
                      }}
                    />
                  </div>
                  <button
                    type="submit"
                    style={{
                      marginTop: '12px',
                      width: '100%',
                      padding: '13px',
                      background: 'var(--accent-gradient)',
                      border: 'none',
                      borderRadius: '14px',
                      color: '#fff',
                      fontWeight: 700,
                      fontSize: '14px',
                      cursor: 'pointer',
                    }}
                  >
                    🔎 Search Attendees
                  </button>
                </form>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }} className="stagger-children">
                  {searchResults.map(a => (
                    <div
                      key={a.id}
                      className="glass card-lift"
                      style={{
                        background: 'rgba(13, 11, 22, 0.65)',
                        backdropFilter: 'blur(16px)',
                        border: '1px solid rgba(255,255,255,0.07)',
                        borderRadius: '16px',
                        padding: '16px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: '12px',
                      }}
                    >
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{
                          fontWeight: 700,
                          fontSize: '14px',
                          marginBottom: '4px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                        }}>
                          <div style={{
                            width: '28px',
                            height: '28px',
                            borderRadius: '50%',
                            background: 'var(--accent-gradient)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '12px',
                            fontWeight: 800,
                            color: '#fff',
                            flexShrink: 0,
                          }}>
                            {a.buyer_name?.charAt(0) || '👤'}
                          </div>
                          <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {a.buyer_name}
                          </span>
                        </div>
                        <div style={{
                          fontSize: '12px',
                          color: 'var(--text-muted)',
                          paddingLeft: '36px',
                        }}>
                          {a.buyer_email}
                        </div>
                        <div style={{
                          fontSize: '11px',
                          paddingLeft: '36px',
                          marginTop: '2px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                        }}>
                          <Badge variant="primary">{a.ticket_types?.name || 'Ticket'}</Badge>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                        {a.is_checked_in ? (
                          <Badge variant="warning" icon="✓">Used</Badge>
                        ) : (
                          <button
                            onClick={() => processToken(a.qr_code_token)}
                            style={{
                              background: 'linear-gradient(135deg, #10b981, #059669)',
                              border: 'none',
                              borderRadius: '12px',
                              padding: '9px 16px',
                              color: '#fff',
                              fontWeight: 700,
                              fontSize: '12px',
                              cursor: 'pointer',
                              transition: 'all 0.2s',
                              boxShadow: '0 6px 20px -6px rgba(16,185,129,0.5)',
                            }}
                            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
                            onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                          >
                            ✓ Check In
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                  {searchResults.length === 0 && searchQuery && (
                    <div
                      className="glass"
                      style={{
                        textAlign: 'center',
                        padding: '40px 20px',
                        borderRadius: '16px',
                        background: 'rgba(13, 11, 22, 0.5)',
                      }}
                    >
                      <div style={{ fontSize: '36px', marginBottom: '8px' }}>🔎</div>
                      <p style={{ color: 'var(--text-dimmed)', fontSize: '13px', fontWeight: 500 }}>
                        No attendees match "{searchQuery}"
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {tab === 'recent' && (
              <div className="fade-in-up">
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '14px',
                }}>
                  <div style={{
                    fontSize: '12px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    color: 'var(--text-dimmed)',
                  }}>Scanning History</div>
                  <Badge variant="primary" icon="📋">
                    {(stats?.recent || []).length} scans
                  </Badge>
                </div>

                {(stats?.recent || []).length === 0 ? (
                  <div
                    className="glass"
                    style={{
                      textAlign: 'center',
                      padding: '48px 20px',
                      borderRadius: '18px',
                      background: 'rgba(13, 11, 22, 0.5)',
                    }}
                  >
                    <div style={{
                      fontSize: '48px',
                      marginBottom: '10px',
                      animation: 'bounce-slow 2s ease-in-out infinite',
                    }}>🎫</div>
                    <h3 style={{
                      fontFamily: "var(--font-display)",
                      fontSize: '16px',
                      fontWeight: 700,
                      marginBottom: '4px',
                    }}>No scans yet today</h3>
                    <p style={{ color: 'var(--text-dimmed)', fontSize: '13px' }}>
                      Recent check-ins will appear here automatically
                    </p>
                  </div>
                ) : (
                  <div className="glass" style={{
                    background: 'rgba(13, 11, 22, 0.5)',
                    backdropFilter: 'blur(16px)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    borderRadius: '18px',
                    padding: '22px 20px 22px 36px',
                  }}>
                    <div className="timeline">
                      {(stats?.recent || []).map((c, i) => {
                        const time = c.scanned_at
                          ? new Date(c.scanned_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                          : '—';
                        const dateStr = c.scanned_at
                          ? new Date(c.scanned_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                          : '';
                        const isRecent = i === 0;
                        return (
                          <div key={i} className="timeline-item" style={{ paddingBottom: i < (stats?.recent?.length || 1) - 1 ? '18px' : 0 }}>
                            <div
                              className="glass card-lift"
                              style={{
                                background: isRecent ? 'rgba(16,185,129,0.06)' : 'rgba(255,255,255,0.02)',
                                border: `1px solid ${isRecent ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.05)'}`,
                                borderRadius: '14px',
                                padding: '12px 14px',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                gap: '10px',
                              }}
                            >
                              <div style={{ minWidth: 0, flex: 1 }}>
                                <div style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '8px',
                                  marginBottom: '3px',
                                  flexWrap: 'wrap',
                                }}>
                                  <span style={{
                                    fontSize: '13px',
                                    fontWeight: 700,
                                    color: 'var(--text)',
                                  }}>
                                    {c.tickets?.buyer_name || 'Unknown Guest'}
                                  </span>
                                  {isRecent && <Badge variant="success">NEW</Badge>}
                                </div>
                                <div style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '8px',
                                  fontSize: '11px',
                                  flexWrap: 'wrap',
                                }}>
                                  <Badge variant="info" style={{ fontSize: '10px', padding: '2px 8px' }}>
                                    {c.tickets?.ticket_types?.name || 'Ticket'}
                                  </Badge>
                                  <span style={{ color: 'var(--text-dimmed)' }}>
                                    {c.tickets?.buyer_email || ''}
                                  </span>
                                </div>
                              </div>
                              <div style={{
                                textAlign: 'right',
                                flexShrink: 0,
                              }}>
                                <div style={{
                                  fontSize: '12px',
                                  fontWeight: 700,
                                  color: 'var(--accent)',
                                  fontFamily: "var(--font-display)",
                                }}>{time}</div>
                                <div style={{
                                  fontSize: '10px',
                                  color: 'var(--text-dimmed)',
                                  fontWeight: 500,
                                }}>{dateStr}</div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

CheckinPage.getLayout = (page) => page;
