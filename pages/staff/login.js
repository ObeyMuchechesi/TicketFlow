import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { AlertCircle, Loader2 } from 'lucide-react';

export default function StaffLogin() {
  const router = useRouter();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Already signed in? Send staff straight to their dashboard.
  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.json())
      .then(d => {
        if (d.user) {
          if (d.user.role === 'gate_staff') router.replace('/staff');
          else if (['super_admin', 'organiser'].includes(d.user.role)) router.replace('/admin');
        }
      })
      .catch(() => {});
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Login failed');
        setLoading(false);
        return;
      }
      // Gate staff login is reserved for gate staff only
      if (data.user.role !== 'gate_staff') {
        setError('Access denied. This login is for gate staff only.');
        setLoading(false);
        return;
      }
      router.push(data.redirect || '/staff');
    } catch {
      setError('Network error. Please try again.');
      setLoading(false);
    }
  }

  return (
    <>
      <Head>
        <title>Gate Staff Login — TiketFlow</title>
      </Head>
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(160deg, #f5f7ff 0%, #eef2ff 45%, #fdf2f8 100%)',
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
          background: 'radial-gradient(ellipse at 20% 10%, rgba(16,185,129,0.14) 0%, transparent 50%), radial-gradient(ellipse at 80% 90%, rgba(59,130,246,0.12) 0%, transparent 50%), radial-gradient(ellipse at 60% 30%, rgba(236,72,153,0.08) 0%, transparent 45%)',
        }} />

        <div style={{ width: '100%', maxWidth: '420px', position: 'relative', zIndex: 1 }}>
          {/* Logo */}
          <div style={{ textAlign: 'center', marginBottom: '36px' }} className="fade-in-up">
            <div style={{
              fontFamily: 'var(--font-primary, Plus Jakarta Sans)',
              fontSize: '32px', fontWeight: 800,
              background: 'linear-gradient(135deg, #10b981, #2563eb, #ec4899)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              marginBottom: '8px',
            }}>TiketFlow</div>
            <p style={{ color: 'var(--text-secondary, #5a6178)', fontSize: '15px' }}>
              Gate Staff Check-In Portal
            </p>
          </div>

          {/* Card */}
          <div className="glass-card fade-in-up" style={{
            padding: '32px', borderRadius: '24px',
            background: 'rgba(255,255,255,0.9)',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 20px 60px -20px rgba(79, 70, 229, 0.25), 0 4px 16px rgba(0,0,0,0.04)',
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
                  placeholder="staff@event.com"
                  className="premium-input"
                  style={{
                    width: '100%', padding: '14px 16px',
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '14px', color: '#1a1d2e',
                    fontSize: '15px', outline: 'none', boxSizing: 'border-box',
                    transition: 'all 0.2s',
                  }}
                  onFocus={e => { e.target.style.borderColor = '#10b981'; e.target.style.boxShadow = '0 0 0 4px rgba(16,185,129,0.12)'; }}
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
                  onFocus={e => { e.target.style.borderColor = '#10b981'; e.target.style.boxShadow = '0 0 0 4px rgba(16,185,129,0.12)'; }}
                  onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none'; }}
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="tf-btn tf-btn-primary adm-ripple"
                style={{
                  width: '100%', padding: '15px',
                  background: loading ? '#cbd5e1' : 'linear-gradient(135deg, #10b981, #2563eb)',
                  color: '#fff', border: 'none', borderRadius: '14px',
                  fontWeight: 700, fontSize: '16px', cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.6 : 1, transition: 'all 0.2s',
                  boxShadow: '0 10px 30px -10px rgba(16,185,129,0.5)',
                  fontFamily: 'var(--font-primary)',
                }}
              >
                {loading ? (<><Loader2 size={16} style={{ animation: 'spin-slow 0.8s linear infinite', verticalAlign: '-3px' }} /> Signing in...</>) : 'Sign In →'}
              </button>
            </form>
          </div>

          <div style={{ textAlign: 'center', marginTop: '24px' }}>
            <a href="/" style={{ color: '#8b92a8', fontSize: '13px', textDecoration: 'none' }}>
              ← Back to TiketFlow
            </a>
          </div>
        </div>
      </div>
    </>
  );
}

StaffLogin.getLayout = (page) => page;
