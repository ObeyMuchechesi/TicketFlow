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

  const inp = { width: '100%', padding: '14px 16px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '12px', color: '#fff', fontSize: '15px', outline: 'none', boxSizing: 'border-box', marginTop: '6px' };

  return (
    <>
      <Head>
        <title>Admin Login — TiketFlow</title>
        <style>{`*{box-sizing:border-box;margin:0;padding:0}body{font-family:'DM Sans',sans-serif;background:#0a0a0a;color:#fff}input{font-family:'DM Sans',sans-serif}`}</style>
      </Head>
      <div style={{ minHeight: '100vh', background: 'linear-gradient(160deg,#0a0a0a 0%,#1a1a2e 55%,#16213e 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
        <div style={{ width: '100%', maxWidth: '400px' }}>
          <div style={{ textAlign: 'center', marginBottom: '36px' }}>
            <div style={{ fontFamily: "'Playfair Display',serif", fontSize: '32px', fontWeight: 700, background: 'linear-gradient(120deg,#e94560,#d4a853)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: '8px' }}>TiketFlow</div>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '15px' }}>Sign in to your admin panel</p>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '20px', padding: '32px' }}>
            {error && <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '10px', padding: '12px', color: '#fca5a5', fontSize: '14px', marginBottom: '20px' }}>{error}</div>}
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Email</label>
                <input type="email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="admin@tiketflow.com" style={inp} onFocus={e => e.target.style.borderColor = '#e94560'} onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.12)'} />
              </div>
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Password</label>
                <input type="password" required value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="••••••••" style={inp} onFocus={e => e.target.style.borderColor = '#e94560'} onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.12)'} />
              </div>
              <button type="submit" disabled={loading} style={{ width: '100%', padding: '15px', background: loading ? 'rgba(233,69,96,0.5)' : '#e94560', color: '#fff', border: 'none', borderRadius: '50px', fontWeight: 700, fontSize: '16px' }}>
                {loading ? '⏳ Signing in...' : 'Sign In →'}
              </button>
            </form>
          </div>

          <p style={{ textAlign: 'center', marginTop: '20px', color: 'rgba(255,255,255,0.2)', fontSize: '13px' }}>
            Default: admin@tiketflow.com / Admin1234!
          </p>
        </div>
      </div>
    </>
  );
}

AdminLogin.getLayout = (page) => page;
