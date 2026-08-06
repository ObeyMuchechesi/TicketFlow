import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { Badge, Progress } from '../../components/ui';
import jsQR from 'jsqr';
import { CheckCircle2, AlertTriangle, XCircle, Ban, Camera, Search, ClipboardList, Flashlight, Lightbulb, RefreshCw, Keyboard, LogOut, ArrowLeft, CalendarDays, MapPin, Users, BarChart3, Battery, Zap, Ticket, User } from 'lucide-react';

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
  const [cameraOn, setCameraOn] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [detected, setDetected] = useState(false);
  const inputRef = useRef(null);
  const resultTimeout = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const scanLoopRef = useRef(null);
  const lastCodeRef = useRef('');
  const lastDecodeAtRef = useRef(0);
  const todayCount = (stats?.recent || []).filter(c => {
    if (!c?.scanned_at) return false;
    const d = new Date(c.scanned_at);
    const now = new Date();
    return d.toDateString() === now.toDateString();
  }).length;

  // Auth guard — gate staff (or admins/organisers) only.
  // Redirect only on a genuine missing/invalid session (401); transient
  // server errors must not bounce staff to the login page.
  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.json())
      .then(d => {
        if (d.user) {
          if (!['gate_staff', 'super_admin', 'organiser'].includes(d.user.role)) {
            router.replace('/staff/login');
          }
        } else if (!d.error) {
          router.replace('/staff/login');
        }
      })
      .catch(() => {});
  }, []);

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
      if (res.status === 401) {
        router.replace('/staff/login');
        return;
      }
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
      if (res.status === 401) { router.replace('/staff/login'); return; }
      const data = await res.json();
      setSearchResults(data.attendees || []);
    } catch { setSearchResults([]); }
  }

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.replace('/staff/login');
  }

  // ── Camera QR scanning ──────────────────────────────────────────
  function extractToken(data) {
    const t = String(data || '').trim();
    // Ticket QR codes encode the full /ticket/<token> URL — pull the token out
    const m = t.match(/\/ticket\/([A-Za-z0-9-]+)/);
    return m ? m[1] : t;
  }

  async function startCamera() {
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError('Camera is not supported in this browser. Use the manual input below instead.');
      return;
    }
    setCameraError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }
      setCameraOn(true);
      if (scanLoopRef.current) clearInterval(scanLoopRef.current);
      scanLoopRef.current = setInterval(scanFrame, 160);
    } catch (err) {
      console.error('Camera error:', err);
      setCameraError(
        err?.name === 'NotAllowedError'
          ? 'Camera permission was denied. Allow camera access in your browser, then tap Retry, or use manual entry.'
          : err?.name === 'NotFoundError'
            ? 'No camera was found on this device. Use the manual input below instead.'
            : 'Could not start the camera. Use the manual input below instead.'
      );
    }
  }

  function stopCamera() {
    if (scanLoopRef.current) { clearInterval(scanLoopRef.current); scanLoopRef.current = null; }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraOn(false);
  }

  function scanFrame() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState < 2 || !video.videoWidth) return;
    const W = 480;
    const H = Math.round((video.videoHeight / video.videoWidth) * W) || 360;
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(video, 0, 0, W, H);
    const img = ctx.getImageData(0, 0, W, H);
    const code = jsQR(img.data, W, H, { inversionAttempts: 'dontInvert' });
    if (code && code.data) {
      const now = Date.now();
      const token = extractToken(code.data);
      if (token && token !== lastCodeRef.current && now - lastDecodeAtRef.current > 2500) {
        lastCodeRef.current = token;
        lastDecodeAtRef.current = now;
        setDetected(true);
        setTimeout(() => setDetected(false), 1200);
        processToken(token);
      }
    }
  }

  async function flipCamera() {
    const next = cameraFacing === 'back' ? 'user' : 'environment';
    try {
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: next }, audio: false });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }
      setCameraFacing(next === 'environment' ? 'back' : 'front');
      setCameraOn(true);
      setCameraError('');
    } catch {
      // keep the current camera
    }
  }

  async function toggleTorch() {
    const track = streamRef.current?.getVideoTracks?.()[0];
    if (!track) {
      setFlashOn(f => !f); // cosmetic fallback when no live camera
      return;
    }
    try {
      await track.applyConstraints({ advanced: [{ torch: !flashOn }] });
      setFlashOn(f => !f);
    } catch {
      setFlashOn(f => !f); // torch unsupported — cosmetic highlight only
    }
  }

  // Auto-start the camera while the Scan tab is open; stop it when leaving
  useEffect(() => {
    if (tab !== 'scan') {
      stopCamera();
    } else if (!cameraOn && !cameraError) {
      startCamera();
    }
  }, [tab]);

  // Always release the camera when leaving the page
  useEffect(() => () => stopCamera(), []);

  const resultConfig = {
    SUCCESS: { color: '#059669', bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.35)', icon: CheckCircle2 },
    ALREADY_USED: { color: '#d97706', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.35)', icon: AlertTriangle },
    INVALID: { color: '#dc2626', bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.35)', icon: XCircle },
    CANCELLED: { color: '#dc2626', bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.35)', icon: Ban },
    ERROR: { color: '#dc2626', bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.35)', icon: AlertTriangle },
  };
  const rc = result ? (resultConfig[result.reason] || resultConfig.ERROR) : null;
  const isSuccess = result?.reason === 'SUCCESS';

  const glass = {
    background: 'rgba(255,255,255,0.85)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    border: '1px solid rgba(0,0,0,0.06)',
    boxShadow: '0 12px 40px -12px rgba(79, 70, 229, 0.12)',
  };

  const statColors = [
    'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)',
    'linear-gradient(135deg, #a855f7 0%, #ec4899 100%)',
    'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)',
    'linear-gradient(135deg, #0ea5e9 0%, #6366f1 100%)',
  ];

  return (
    <>
      <Head>
        <title>Check-In — TiketFlow</title>
        <style>{`*{box-sizing:border-box;margin:0;padding:0}body{font-family:'Inter',sans-serif;background:#f5f7ff;color:#1a1d2e;overflow-x:hidden;-webkit-font-smoothing:antialiased}`}</style>
      </Head>
      <div
        id="checkin-root"
        style={{
          minHeight: '100vh',
          background: 'linear-gradient(160deg, #f5f7ff 0%, #eef2ff 50%, #fdf2f8 100%)',
          transition: 'filter 0.3s ease',
          filter: batteryMode ? 'brightness(0.9) contrast(0.95)' : 'none',
          position: 'relative',
        }}
      >
        <div
          className="mesh-gradient"
          style={{
            position: 'fixed',
            inset: 0,
            pointerEvents: 'none',
            opacity: 0.5,
          }}
        />

        <div style={{ position: 'relative', zIndex: 2 }}>
          {/* Top bar */}
          <div
            style={{
              ...glass,
              borderTop: 'none',
              borderLeft: 'none',
              borderRight: 'none',
              borderRadius: 0,
              padding: '14px 18px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '10px',
            }}
          >
            <div>
              <div style={{
                fontFamily: 'var(--font-display)',
                fontSize: '18px',
                fontWeight: 800,
                background: 'linear-gradient(120deg, #7c3aed, #2563eb, #ec4899)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                marginBottom: '2px',
              }}>TiketFlow Gate</div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>
                Gate Staff · {stats?.eventName || 'Loading event...'}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <button
                onClick={() => setBatteryMode(b => !b)}
                title="Battery Friendly Mode"
                style={{
                  background: batteryMode ? 'rgba(16,185,129,0.12)' : 'rgba(0,0,0,0.04)',
                  border: `1px solid ${batteryMode ? 'rgba(16,185,129,0.35)' : 'rgba(0,0,0,0.08)'}`,
                  borderRadius: '12px',
                  padding: '8px 12px',
                  color: batteryMode ? '#059669' : 'var(--text-secondary)',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                {batteryMode ? <Battery size={16} /> : <Zap size={16} />}
                {batteryMode ? 'Low Power' : 'Battery'}
              </button>
              <button
                onClick={() => router.push('/staff')}
                style={{
                  background: 'rgba(0,0,0,0.04)',
                  border: '1px solid rgba(0,0,0,0.08)',
                  borderRadius: '12px',
                  padding: '8px 14px',
                  color: 'var(--text-secondary)',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,0,0,0.07)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(0,0,0,0.04)'; }}
              >
                ← Dashboard
              </button>
              <button
                onClick={handleLogout}
                style={{
                  background: 'rgba(239,68,68,0.06)',
                  border: '1px solid rgba(239,68,68,0.2)',
                  borderRadius: '12px',
                  padding: '8px 14px',
                  color: '#dc2626',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = '#dc2626'; e.currentTarget.style.color = '#fff'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.06)'; e.currentTarget.style.color = '#dc2626'; }}
              >
                🚪 Sign Out
              </button>
            </div>
          </div>

          {stats && (
            <div
              style={{
                ...glass,
                borderTop: 'none',
                borderLeft: 'none',
                borderRight: 'none',
                borderRadius: 0,
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
              }}
            >
              {[
                { l: 'Checked In', v: stats.checkedIn, c: statColors[0] },
                { l: 'Total Tickets', v: stats.total, c: statColors[1] },
                { l: "Today's Entries", v: todayCount, c: statColors[2], pulse: true },
                { l: 'Remaining', v: stats.capacity > 0 ? Math.max(0, stats.capacity - stats.checkedIn) : '∞', c: statColors[3] },
              ].map((s, i) => (
                <div
                  key={s.l}
                  style={{
                    padding: '16px 12px',
                    textAlign: 'center',
                    borderRight: i < 3 ? '1px solid rgba(0,0,0,0.06)' : 'none',
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
                    fontFamily: 'var(--font-display)',
                    background: s.c,
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    lineHeight: 1.1,
                  }}>{typeof s.v === 'number' ? s.v.toLocaleString() : s.v}</div>
                  <div style={{
                    fontSize: '10px',
                    color: 'var(--text-tertiary)',
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
            {/* Tabs */}
            <div
              style={{
                display: 'flex',
                gap: '4px',
                padding: '4px',
                background: 'rgba(255,255,255,0.7)',
                border: '1px solid rgba(0,0,0,0.06)',
                borderRadius: '16px',
                marginBottom: '18px',
                boxShadow: '0 4px 20px -8px rgba(79,70,229,0.15)',
              }}
            >
              {[
                ['scan', 'Scan', Camera],
                ['manual', 'Search', Search],
                ['recent', 'Recent', ClipboardList],
              ].map(([t, l, TabIcon]) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  style={{
                    flex: 1,
                    padding: '10px 12px',
                    background: tab === t ? 'linear-gradient(135deg, #7c3aed, #2563eb)' : 'transparent',
                    border: 'none',
                    borderRadius: '12px',
                    color: tab === t ? '#fff' : 'var(--text-secondary)',
                    fontWeight: tab === t ? 700 : 500,
                    fontSize: '13px',
                    cursor: 'pointer',
                    transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    boxShadow: tab === t ? '0 8px 24px -8px rgba(124,58,237,0.5)' : 'none',
                  }}
                ><TabIcon size={14} strokeWidth={2} />{l}</button>
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
                  <rc.icon size={26} strokeWidth={2} style={{ color: rc.color, flexShrink: 0 }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontWeight: 800,
                    fontSize: '17px',
                    color: rc.color,
                    marginBottom: '4px',
                    fontFamily: 'var(--font-display)',
                  }}>
                    {result.message}
                  </div>
                  {result.ticket && (
                    <div style={{
                      color: 'var(--text-secondary)',
                      fontSize: '13px',
                      lineHeight: 1.5,
                    }}>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
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
                    background: cameraOn
                      ? '#0d0d1f'
                      : 'radial-gradient(ellipse at center, rgba(124,58,237,0.12) 0%, rgba(15,15,30,0.96) 60%)',
                    border: `2px solid ${detected ? 'rgba(16,185,129,0.85)' : 'rgba(124,58,237,0.25)'}`,
                    marginBottom: '14px',
                    boxShadow: '0 20px 60px -20px rgba(79,70,229,0.35), inset 0 0 80px rgba(15,15,30,0.5)',
                    transition: 'border-color 0.2s',
                  }}
                >
                  {/* Live camera feed */}
                  <video
                    ref={videoRef}
                    playsInline
                    muted
                    autoPlay
                    style={{
                      position: 'absolute',
                      inset: 0,
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      opacity: cameraOn ? 1 : 0,
                      transform: cameraFacing === 'front' ? 'scaleX(-1)' : 'none',
                      transition: 'opacity 0.3s',
                    }}
                  />
                  {/* Hidden canvas used for frame decoding */}
                  <canvas ref={canvasRef} style={{ display: 'none' }} />

                  {/* Overlay: corner brackets + laser */}
                  <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
                    <div
                      style={{
                        position: 'absolute',
                        inset: '12% 14%',
                        borderRadius: '28px',
                      }}
                      className="pulse-glow"
                    >
                      {cameraOn && !detected && (
                        <div
                          className="animate-laser"
                          style={{
                            position: 'absolute',
                            left: '4%',
                            right: '4%',
                            top: '50%',
                            height: '3px',
                            background: 'linear-gradient(90deg, transparent, #a855f7, #ec4899, transparent)',
                            boxShadow: '0 0 24px rgba(168,85,247,0.8), 0 0 80px rgba(236,72,153,0.5)',
                            borderRadius: '3px',
                          }}
                        />
                      )}

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
                            borderColor: detected ? '#10b981' : '#a855f7',
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
                    </div>

                    {/* Status / placeholder / error */}
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
                      {!cameraOn && !cameraError && (
                        <>
                          <div style={{ fontSize: '48px', animation: 'bounce-slow 2s ease-in-out infinite' }}>📷</div>
                          <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.75)', fontWeight: 600, letterSpacing: '0.5px' }}>
                            STARTING CAMERA…
                          </div>
                        </>
                      )}
                      {cameraError && (
                        <>
                          <div style={{ fontSize: '40px' }}>📵</div>
                          <div style={{
                            fontSize: '12px',
                            color: 'rgba(255,255,255,0.9)',
                            fontWeight: 600,
                            textAlign: 'center',
                            maxWidth: '80%',
                            lineHeight: 1.5,
                          }}>
                            {cameraError}
                          </div>
                        </>
                      )}
                      {cameraOn && (
                        <div style={{
                          position: 'absolute',
                          top: '14px',
                          left: '14px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          background: detected ? 'rgba(16,185,129,0.9)' : 'rgba(0,0,0,0.55)',
                          color: '#fff',
                          padding: '6px 12px',
                          borderRadius: '999px',
                          fontSize: '11px',
                          fontWeight: 700,
                          letterSpacing: '0.5px',
                          backdropFilter: 'blur(8px)',
                        }}>
                          <span style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            background: detected ? '#fff' : '#10b981',
                            animation: detected ? 'none' : 'pulse-ring 1.8s infinite',
                          }} />
                          {detected ? '✓ CODE DETECTED' : 'SCANNING'}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px', marginBottom: '14px' }}>
                  <button
                    onClick={toggleTorch}
                    disabled={!cameraOn}
                    style={{
                      flex: 1,
                      padding: '12px',
                      background: flashOn ? 'rgba(245,158,11,0.12)' : 'rgba(0,0,0,0.04)',
                      border: `1px solid ${flashOn ? 'rgba(245,158,11,0.4)' : 'rgba(0,0,0,0.08)'}`,
                      borderRadius: '14px',
                      color: flashOn ? '#d97706' : 'var(--text-secondary)',
                      fontSize: '13px',
                      fontWeight: 600,
                      cursor: cameraOn ? 'pointer' : 'not-allowed',
                      opacity: cameraOn ? 1 : 0.5,
                      transition: 'all 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                    }}
                  >
                    <span>{flashOn ? <Lightbulb size={15} strokeWidth={2} /> : <Flashlight size={15} strokeWidth={2} />}</span>
                    {flashOn ? 'Flash ON' : 'Flash OFF'}
                  </button>
                  <button
                    onClick={() => { if (cameraOn) { flipCamera(); } else { startCamera(); } }}
                    style={{
                      flex: 1,
                      padding: '12px',
                      background: 'rgba(0,0,0,0.04)',
                      border: '1px solid rgba(0,0,0,0.08)',
                      borderRadius: '14px',
                      color: 'var(--text-secondary)',
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
                    <RefreshCw size={15} strokeWidth={2} />
                    {cameraOn ? (cameraFacing === 'back' ? 'Rear Cam' : 'Front Cam') : (cameraError ? 'Retry Camera' : 'Start Camera')}
                  </button>
                </div>

                <div style={{ ...glass, borderRadius: '18px', padding: '18px' }}>
                  <div style={{ textAlign: 'center', marginBottom: '12px' }}>
                    <Badge variant="glass"><Keyboard size={12} strokeWidth={2} style={{ verticalAlign: '-2px', marginRight: '5px' }} />USB Scanner / Manual Token</Badge>
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
                      background: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: '12px',
                      color: '#1a1d2e',
                      outline: 'none',
                      transition: 'all 0.2s',
                    }}
                    onFocus={e => { e.target.style.borderColor = '#7c3aed'; e.target.style.boxShadow = '0 0 0 4px rgba(124,58,237,0.12)'; }}
                    onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none'; }}
                  />
                  <button
                    onClick={() => processToken(scanInput)}
                    disabled={!scanInput.trim()}
                    style={{
                      marginTop: '12px',
                      width: '100%',
                      padding: '14px',
                      background: 'linear-gradient(135deg, #7c3aed, #2563eb)',
                      border: 'none',
                      borderRadius: '14px',
                      color: '#fff',
                      fontWeight: 700,
                      fontSize: '15px',
                      cursor: scanInput.trim() ? 'pointer' : 'not-allowed',
                      opacity: scanInput.trim() ? 1 : 0.5,
                      transition: 'all 0.2s',
                      boxShadow: '0 10px 30px -10px rgba(124,58,237,0.5)',
                      fontFamily: 'var(--font-display)',
                    }}
                  >
                    ✓ Verify Ticket
                  </button>
                  <p style={{
                    textAlign: 'center',
                    color: 'var(--text-tertiary)',
                    fontSize: '11px',
                    marginTop: '10px',
                    fontWeight: 500,
                  }}>                     <Lightbulb size={14} style={{ verticalAlign: '-2px' }} /> Tip: Connect a USB QR scanner — it acts as keyboard input, press Enter after scan
                  </p>
                </div>
              </div>
            )}

            {tab === 'manual' && (
              <div className="fade-in-up">
                <form
                  onSubmit={handleSearchSubmit}
                  style={{ ...glass, borderRadius: '18px', padding: '16px', marginBottom: '16px' }}
                >
                  <div style={{ position: 'relative' }}>
                    <span style={{
                      position: 'absolute',
                      left: '16px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      fontSize: '18px',
                      opacity: 0.5,
                      pointerEvents: 'none',
                    }}><Search size={16} strokeWidth={2} /></span>
                    <input
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      placeholder="Search by name, email, or phone..."
                      style={{
                        width: '100%',
                        padding: '16px 16px 16px 46px',
                        background: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        borderRadius: '14px',
                        color: '#1a1d2e',
                        fontSize: '15px',
                        outline: 'none',
                        transition: 'all 0.2s',
                      }}
                      onFocus={e => {
                        e.target.style.borderColor = '#7c3aed';
                        e.target.style.boxShadow = '0 0 0 4px rgba(124,58,237,0.12)';
                      }}
                      onBlur={e => {
                        e.target.style.borderColor = '#e2e8f0';
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
                      background: 'linear-gradient(135deg, #7c3aed, #2563eb)',
                      border: 'none',
                      borderRadius: '14px',
                      color: '#fff',
                      fontWeight: 700,
                      fontSize: '14px',
                      cursor: 'pointer',
                      boxShadow: '0 10px 30px -10px rgba(124,58,237,0.5)',
                    }}
                  >
                    🔎 Search Attendees
                  </button>
                </form>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }} className="stagger-children">
                  {searchResults.map(a => (
                    <div
                      key={a.id}
                      style={{ ...glass, borderRadius: '16px', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}
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
                            background: 'linear-gradient(135deg, #7c3aed, #2563eb)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '12px',
                            fontWeight: 800,
                            color: '#fff',
                            flexShrink: 0,
                          }}>
                            {a.buyer_name?.charAt(0) || <User size={14} />}
                          </div>
                          <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {a.buyer_name}
                          </span>
                        </div>
                        <div style={{
                          fontSize: '12px',
                          color: 'var(--text-secondary)',
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
                    <div style={{
                      textAlign: 'center',
                      padding: '40px 20px',
                      borderRadius: '16px',
                      background: 'rgba(255,255,255,0.7)',
                    }}>
                      <div style={{ fontSize: '36px', marginBottom: '8px' }}>🔎</div>
                      <p style={{ color: 'var(--text-tertiary)', fontSize: '13px', fontWeight: 500 }}>
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
                    color: 'var(--text-tertiary)',
                  }}>Scanning History</div>
                  <Badge variant="primary" icon={<ClipboardList size={14} />}>
                    {(stats?.recent || []).length} scans
                  </Badge>
                </div>

                {(stats?.recent || []).length === 0 ? (
                  <div style={{
                    textAlign: 'center',
                    padding: '48px 20px',
                    borderRadius: '18px',
                    background: 'rgba(255,255,255,0.7)',
                  }}>
                    <div style={{
                      fontSize: '48px',
                      marginBottom: '10px',
                      animation: 'bounce-slow 2s ease-in-out infinite',
                    }}><Ticket size={48} /></div>
                    <h3 style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: '16px',
                      fontWeight: 700,
                      marginBottom: '4px',
                      color: 'var(--text-primary)',
                    }}>No scans yet today</h3>
                    <p style={{ color: 'var(--text-tertiary)', fontSize: '13px' }}>
                      Recent check-ins will appear here automatically
                    </p>
                  </div>
                ) : (
                  <div style={{ ...glass, borderRadius: '18px', padding: '22px 20px 22px 36px' }}>
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
                              style={{
                                background: isRecent ? 'rgba(16,185,129,0.06)' : 'rgba(0,0,0,0.02)',
                                border: `1px solid ${isRecent ? 'rgba(16,185,129,0.25)' : 'rgba(0,0,0,0.05)'}`,
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
                                  <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
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
                                  <span style={{ color: 'var(--text-tertiary)' }}>
                                    {c.tickets?.buyer_email || ''}
                                  </span>
                                </div>
                              </div>
                              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                <div style={{
                                  fontSize: '12px',
                                  fontWeight: 700,
                                  color: 'var(--accent-primary, #7c3aed)',
                                  fontFamily: 'var(--font-display)',
                                }}>{time}</div>
                                <div style={{
                                  fontSize: '10px',
                                  color: 'var(--text-tertiary)',
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
