import { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

export default function AdminLogin() {
  const router = useRouter();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
      router.push('/admin');
    } catch { setError('Network error. Please try again.'); setLoading(false); }
  }

  return (
    <>
      <Head>
        <title>Admin Login — TiketFlow</title>
      </Head>
      <div style={{
        minHeight: '100vh',
        background: 'var(--bg-primary, #0a0a0f)',
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
          background: 'radial-gradient(ellipse at 30% 20%, rgba(139,92,246,0.08) 0%, transparent 50%), radial-gradient(ellipse at 70% 80%, rgba(236,72,153,0.06) 0%, transparent 50%)',
        }} />

        <div style={{ width: '100%', maxWidth: '420px', position: 'relative', zIndex: 1 }}>
          {/* Logo */}
          <div style={{ textAlign: 'center', marginBottom: '36px' }} className="fade-in-up">
            <div style={{
              fontFamily: 'var(--font-primary, Plus Jakarta Sans)',
              fontSize: '32px', fontWeight: 800,
              background: 'var(--accent-gradient, linear-gradient(120deg, #8b5cf6, #ec4899))',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              marginBottom: '8px',
            }}>TiketFlow</div>
            <p style={{ color: 'var(--text-secondary, rgba(255,255,255,0.4))', fontSize: '15px' }}>
              Sign in to your admin dashboard
            </p>
          </div>

          {/* Card */}
          <div className="adm-chart-card fade-in-up" style={{ padding: '32px' }}>
            {error && (
              <div style={{
                padding: '12px 16px', borderRadius: '12px',
                background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
                color: '#fca5a5', fontSize: '14px', marginBottom: '20px',
                display: 'flex', alignItems: 'center', gap: '8px',
              }}>
                <span>❌</span> {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{
                  display: 'block', fontSize: '12px', fontWeight: 700,
                  color: 'var(--text-tertiary, rgba(255,255,255,0.4))',
                  textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px',
                }}>Email Address</label>
                <input
                  type="email" required
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  placeholder="admin@tiketflow.com"
                  className="premium-input"
                  style={{
                    width: '100%', padding: '14px 16px',
                    background: 'var(--bg-glass-light, rgba(255,255,255,0.03))',
                    border: '1px solid var(--border-primary, rgba(255,255,255,0.08))',
                    borderRadius: '12px', color: 'var(--text-primary, #fff)',
                    fontSize: '15px', outline: 'none', boxSizing: 'border-box',
                  }}
                  onFocus={e => { e.target.style.borderColor = 'var(--accent-primary, #8b5cf6)'; e.target.style.boxShadow = '0 0 0 3px var(--accent-muted, rgba(139,92,246,0.15))'; }}
                  onBlur={e => { e.target.style.borderColor = 'var(--border-primary, rgba(255,255,255,0.08))'; e.target.style.boxShadow = 'none'; }}
                />
              </div>
              <div style={{ marginBottom: '24px' }}>
                <label style={{
                  display: 'block', fontSize: '12px', fontWeight: 700,
                  color: 'var(--text-tertiary, rgba(255,255,255,0.4))',
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
                    background: 'var(--bg-glass-light, rgba(255,255,255,0.03))',
                    border: '1px solid var(--border-primary, rgba(255,255,255,0.08))',
                    borderRadius: '12px', color: 'var(--text-primary, #fff)',
                    fontSize: '15px', outline: 'none', boxSizing: 'border-box',
                  }}
                  onFocus={e => { e.target.style.borderColor = 'var(--accent-primary, #8b5cf6)'; e.target.style.boxShadow = '0 0 0 3px var(--accent-muted, rgba(139,92,246,0.15))'; }}
                  onBlur={e => { e.target.style.borderColor = 'var(--border-primary, rgba(255,255,255,0.08))'; e.target.style.boxShadow = 'none'; }}
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="tf-btn tf-btn-primary adm-ripple"
                style={{
                  width: '100%', padding: '15px',
                  background: loading ? 'var(--bg-tertiary, rgba(255,255,255,0.06))' : 'var(--accent-gradient, linear-gradient(135deg, #8b5cf6, #ec4899))',
                  color: '#fff', border: 'none', borderRadius: '12px',
                  fontWeight: 700, fontSize: '16px', cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.6 : 1, transition: 'all 0.2s',
                  fontFamily: 'var(--font-primary)',
                }}
              >
                {loading ? '⏳ Signing in...' : 'Sign In →'}
              </button>
            </form>
          </div>

          <p style={{ textAlign: 'center', marginTop: '20px', color: 'var(--text-muted, rgba(255,255,255,0.2))', fontSize: '12px' }}>
            Default: admin@tiketflow.com / Admin1234!
          </p>
        </div>
      </div>
    </>
  );
}

AdminLogin.getLayout = (page) => page;
