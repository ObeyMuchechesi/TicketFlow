import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { AlertCircle, Loader2 } from 'lucide-react';

export default function AdminLogin() {
  const router = useRouter();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Already signed in? Send the user to the right dashboard.
  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.json())
      .then(d => {
        if (d.user) {
          if (['super_admin', 'organiser'].includes(d.user.role)) router.replace('/admin');
          else if (d.user.role === 'gate_staff') router.replace('/staff');
        }
      })
      .catch(() => {});
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Login failed'); setLoading(false); return; }
      // Admin login is reserved for organisers & super admins
      if (!['super_admin', 'organiser'].includes(data.user.role)) {
        setError('Access denied. Use the Gate Staff login instead.');
        setLoading(false);
        return;
      }
      router.push(data.redirect || '/admin');
    } catch { setError('Network error. Please try again.'); setLoading(false); }
  }

  return (
    <>
      <Head>
        <title>Organiser Login — TiketFlow</title>
      </Head>
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(160deg, #f5f3ff 0%, #eef2ff 45%, #fdf2f8 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Background mesh */}
        <div style={{
          position: 'fixed', inset: 0, pointerEvents: 'none',
          background: 'radial-gradient(ellipse at 25% 15%, rgba(139,92,246,0.14) 0%, transparent 50%), radial-gradient(ellipse at 80% 85%, rgba(236,72,153,0.1) 0%, transparent 50%), radial-gradient(ellipse at 65% 25%, rgba(59,130,246,0.1) 0%, transparent 45%)',
        }} />

        <div style={{ width: '100%', maxWidth: '420px', position: 'relative', zIndex: 1 }}>
          {/* Logo */}
          <div style={{ textAlign: 'center', marginBottom: '36px' }} className="fade-in-up">
            <div style={{
              fontFamily: 'var(--font-primary, Plus Jakarta Sans)',
              fontSize: '32px', fontWeight: 800,
              background: 'linear-gradient(135deg, #7c3aed, #2563eb, #ec4899)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              marginBottom: '8px',
            }}>TiketFlow</div>
            <p style={{ color: '#5a6178', fontSize: '15px' }}>
              Organiser & Admin Dashboard
            </p>
          </div>

          {/* Card */}
          <div className="glass-card fade-in-up" style={{
            padding: '32px', borderRadius: '24px',
            background: 'rgba(255,255,255,0.9)',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 20px 60px -20px rgba(124,58,237,0.25), 0 4px 16px rgba(0,0,0,0.04)',
            border: '1px solid rgba(255,255,255,0.6)',
          }}>
            {error && (
              <div style={{
                padding: '12px 16px', borderRadius: '12px',
                background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
                color: '#dc2626', fontSize: '14px', marginBottom: '20px',
                display: 'flex', alignItems: 'center', gap: '8px',
              }}>
                <AlertCircle size={16} strokeWidth={2} /> {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{
                  display: 'block', fontSize: '12px', fontWeight: 700,
                  color: '#6b7280',
                  textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px',
                }}>Email Address</label>
                <input
                  type="email" required
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  placeholder="organiser@event.com"
                  className="premium-input"
                  style={{
                    width: '100%', padding: '14px 16px',
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '14px', color: '#1a1d2e',
                    fontSize: '15px', outline: 'none', boxSizing: 'border-box',
                    transition: 'all 0.2s',
                  }}
                  onFocus={e => { e.target.style.borderColor = '#7c3aed'; e.target.style.boxShadow = '0 0 0 4px rgba(124,58,237,0.12)'; }}
                  onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none'; }}
                />
              </div>
              <div style={{ marginBottom: '24px' }}>
                <label style={{
                  display: 'block', fontSize: '12px', fontWeight: 700,
                  color: '#6b7280',
                  textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px',
                }}>Password</label>
                <input
                  type="password" required
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  placeholder="••••••••"
                  className="premium-input"
                  style={{
                    width: '100%', padding: '14px 16px',
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '14px', color: '#1a1d2e',
                    fontSize: '15px', outline: 'none', boxSizing: 'border-box',
                    transition: 'all 0.2s',
                  }}
                  onFocus={e => { e.target.style.borderColor = '#7c3aed'; e.target.style.boxShadow = '0 0 0 4px rgba(124,58,237,0.12)'; }}
                  onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none'; }}
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="tf-btn tf-btn-primary adm-ripple"
                style={{
                  width: '100%', padding: '15px',
                  background: loading ? '#cbd5e1' : 'linear-gradient(135deg, #7c3aed, #2563eb)',
                  color: '#fff', border: 'none', borderRadius: '14px',
                  fontWeight: 700, fontSize: '16px', cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.6 : 1, transition: 'all 0.2s',
                  boxShadow: '0 10px 30px -10px rgba(124,58,237,0.5)',
                  fontFamily: 'var(--font-primary)',
                }}
              >
                {loading ? (<><Loader2 size={16} style={{ animation: 'spin-slow 0.8s linear infinite', verticalAlign: '-3px' }} /> Signing in...</>) : 'Sign In →'}
              </button>
            </form>
          </div>

          <p style={{ textAlign: 'center', marginTop: '20px', color: '#8b92a8', fontSize: '12px' }}>
            Gate staff? <a href="/staff/login" style={{ color: '#7c3aed', fontWeight: 600, textDecoration: 'none' }}>Staff login →</a>
          </p>
        </div>
      </div>
    </>
  );
}

AdminLogin.getLayout = (page) => page;
