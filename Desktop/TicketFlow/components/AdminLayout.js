import Head from 'next/head';
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';

const NAV = [
  { href: '/admin', label: 'Dashboard', icon: '📊' },
  { href: '/admin/events', label: 'Events', icon: '🎪' },
  { href: '/admin/staff', label: 'Gate Staff', icon: '👮' },
  { href: '/admin/promo-codes', label: 'Promo Codes', icon: '🏷️' },
  { href: '/admin/reports', label: 'Reports', icon: '📈' },
  { href: '/admin/settings', label: 'Settings', icon: '⚙️' },
];

export default function AdminLayout({ children, title = 'Admin' }) {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(d => {
      if (!d.user || !['super_admin', 'organiser'].includes(d.user.role)) {
        router.push('/admin/login');
      } else {
        setUser(d.user);
      }
    }).catch(() => router.push('/admin/login'));
  }, []);

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/admin/login');
  }

  return (
    <>
      <Head>
        <title>{title} — TiketFlow Admin</title>
        <style>{`*, *::before, *::after{box-sizing:border-box;margin:0;padding:0}body{font-family:'DM Sans',sans-serif;background:#0d0d1a;color:#fff;-webkit-font-smoothing:antialiased}input,textarea,select{font-family:'DM Sans',sans-serif;color:#fff}button{font-family:'DM Sans',sans-serif;cursor:pointer}::-webkit-scrollbar{width:4px}::-webkit-scrollbar-thumb{background:#e94560;border-radius:2px}`}</style>
      </Head>
      <div style={{ display: 'flex', minHeight: '100vh' }}>
        {/* Sidebar */}
        <aside style={{
          width: '240px', flexShrink: 0,
          background: 'rgba(255,255,255,0.03)',
          borderRight: '1px solid rgba(255,255,255,0.07)',
          display: 'flex', flexDirection: 'column',
          position: 'sticky', top: 0, height: '100vh', overflowY: 'auto',
        }}>
          <div style={{ padding: '24px 20px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ fontFamily: "'Playfair Display',serif", fontSize: '22px', fontWeight: 700, background: 'linear-gradient(120deg,#e94560,#d4a853)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>TiketFlow</div>
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', marginTop: '2px', textTransform: 'uppercase', letterSpacing: '1px' }}>Admin Panel</div>
          </div>

          <nav style={{ flex: 1, padding: '16px 12px' }}>
            {NAV.map(item => {
              const active = router.pathname === item.href || (item.href !== '/admin' && router.pathname.startsWith(item.href));
              return (
                <a key={item.href} href={item.href} style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  padding: '10px 12px', borderRadius: '10px', marginBottom: '4px',
                  background: active ? 'rgba(233,69,96,0.12)' : 'transparent',
                  color: active ? '#e94560' : 'rgba(255,255,255,0.55)',
                  fontSize: '14px', fontWeight: active ? 600 : 400,
                  textDecoration: 'none', transition: 'all 0.2s',
                  borderLeft: active ? '3px solid #e94560' : '3px solid transparent',
                }}>
                  <span>{item.icon}</span> {item.label}
                </a>
              );
            })}
          </nav>

          <div style={{ padding: '16px 12px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            {user && (
              <div style={{ marginBottom: '12px' }}>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#fff' }}>{user.full_name}</div>
                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', textTransform: 'capitalize' }}>{user.role.replace('_', ' ')}</div>
              </div>
            )}
            <button onClick={handleLogout} style={{ width: '100%', padding: '9px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '8px', color: '#fca5a5', fontSize: '13px', fontWeight: 600 }}>
              Sign Out
            </button>
            <a href="/" style={{ display: 'block', textAlign: 'center', marginTop: '8px', fontSize: '12px', color: 'rgba(255,255,255,0.25)', textDecoration: 'none' }}>← Back to Site</a>
          </div>
        </aside>

        {/* Main content */}
        <main style={{ flex: 1, minWidth: 0, overflowX: 'hidden' }}>
          {children}
        </main>
      </div>
    </>
  );
}
