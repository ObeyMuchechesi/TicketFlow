import Head from 'next/head';
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';

const NAV = [
  { href: '/admin', label: 'Overview', icon: '📊' },
  { href: '/admin/events', label: 'Events', icon: '🎪' },
  { href: '/admin/staff', label: 'Gate Staff', icon: '👮' },
  { href: '/admin/promo-codes', label: 'Promo Codes', icon: '🏷️' },
  { href: '/admin/reports', label: 'Reports', icon: '📈' },
];

export default function AdminLayout({ children, title = 'Admin' }) {
  const router = useRouter();
  const [user, setUser] = useState(null);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((d) => {
        if (!d.user || !['super_admin', 'organiser'].includes(d.user.role)) {
          router.push('/admin/login');
        } else {
          setUser(d.user);
        }
      })
      .catch(() => router.push('/admin/login'));
  }, []);

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/admin/login');
  }

  return (
    <>
      <Head>
        <title>{title} — TiketFlow Admin</title>
      </Head>
      <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)' }}>
        {/* Sidebar */}
        <aside style={{
          width: '260px',
          flexShrink: 0,
          background: 'rgba(255, 255, 255, 0.01)',
          borderRight: '1px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          position: 'sticky',
          top: 0,
          height: '100vh',
          overflowY: 'auto',
        }}>
          {/* Logo Brand area */}
          <div style={{ padding: '24px 24px 20px', borderBottom: '1px solid var(--border)' }}>
            <span
              onClick={() => router.push('/')}
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '22px',
                fontWeight: 800,
                background: 'var(--accent-gradient)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                cursor: 'pointer',
                letterSpacing: '-0.03em',
                display: 'block'
              }}
            >
              TiketFlow
            </span>
            <div style={{
              fontSize: '10px',
              color: 'var(--text-dimmed)',
              marginTop: '4px',
              textTransform: 'uppercase',
              letterSpacing: '1.5px',
              fontWeight: 600
            }}>
              Organiser Center
            </div>
          </div>

          {/* Navigation Links */}
          <nav style={{ flex: 1, padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {NAV.map((item) => {
              const active = router.pathname === item.href || (item.href !== '/admin' && router.pathname.startsWith(item.href));
              return (
                <a
                  key={item.href}
                  href={item.href}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px 14px',
                    borderRadius: 'var(--radius-btn)',
                    background: active ? 'var(--accent-muted)' : 'transparent',
                    color: active ? 'var(--accent)' : 'var(--text-muted)',
                    fontSize: '14px',
                    fontWeight: active ? 600 : 500,
                    textDecoration: 'none',
                    transition: 'all 0.2s',
                    border: '1px solid',
                    borderColor: active ? 'rgba(168, 85, 247, 0.15)' : 'transparent',
                  }}
                  onMouseEnter={(e) => {
                    if (!active) {
                      e.currentTarget.style.color = 'var(--text)';
                      e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!active) {
                      e.currentTarget.style.color = 'var(--text-muted)';
                      e.currentTarget.style.background = 'transparent';
                    }
                  }}
                >
                  <span style={{ fontSize: '16px' }}>{item.icon}</span>
                  {item.label}
                </a>
              );
            })}
          </nav>

          {/* User info and Logout action */}
          <div style={{ padding: '20px 16px', borderTop: '1px solid var(--border)', background: 'rgba(255,255,255,0.005)' }}>
            {user && (
              <div style={{ marginBottom: '16px', paddingLeft: '8px' }}>
                <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)' }}>{user.full_name}</div>
                <div style={{
                  fontSize: '11px',
                  color: 'var(--text-dimmed)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  marginTop: '2px'
                }}>
                  {user.role.replace('_', ' ')}
                </div>
              </div>
            )}
            <button
              onClick={handleLogout}
              className="premium-btn"
              style={{
                width: '100%',
                padding: '10px',
                background: 'rgba(239, 68, 68, 0.08)',
                border: '1px solid rgba(239, 68, 68, 0.15)',
                color: '#fca5a5',
                fontSize: '13px',
                fontWeight: 600,
                borderRadius: '8px'
              }}
              onMouseEnter={e => {
                e.target.style.background = 'rgba(239, 68, 68, 0.15)';
                e.target.style.borderColor = 'rgba(239, 68, 68, 0.3)';
              }}
              onMouseLeave={e => {
                e.target.style.background = 'rgba(239, 68, 68, 0.08)';
                e.target.style.borderColor = 'rgba(239, 68, 68, 0.15)';
              }}
            >
              Sign Out
            </button>
            <a
              href="/"
              style={{
                display: 'block',
                textAlign: 'center',
                marginTop: '12px',
                fontSize: '12px',
                color: 'var(--text-dimmed)',
                textDecoration: 'none',
                transition: 'color 0.2s'
              }}
              onMouseEnter={e => e.target.style.color = 'var(--text)'}
              onMouseLeave={e => e.target.style.color = 'var(--text-dimmed)'}
            >
              ← Back to main site
            </a>
          </div>
        </aside>

        {/* Admin Content Area */}
        <main style={{ flex: 1, minWidth: 0, padding: '40px', overflowX: 'hidden' }}>
          {children}
        </main>
      </div>
    </>
  );
}
