import Head from 'next/head';
import { useRouter } from 'next/router';
import { useState, useEffect, useCallback, useRef } from 'react';

const NAV_MAIN = [
  { href: '/admin', label: 'Dashboard', icon: '📊' },
  { href: '/admin/events', label: 'Events', icon: '🎪' },
  { href: '/admin/events/new', label: 'Create Event', icon: '✨' },
];

const NAV_MANAGE = [
  { href: '/admin/staff', label: 'Staff', icon: '👥' },
  { href: '/admin/promo-codes', label: 'Promo Codes', icon: '🏷️' },
  { href: '/admin/reports', label: 'Reports', icon: '📈' },
];

const NAV_TOOLS = [
  { href: '/staff', label: 'Gate Staff Panel', icon: '📷' },
  { href: '/', label: 'View Site', icon: '🌐', external: true },
];

const CMD_ITEMS = [
  ...NAV_MAIN,
  ...NAV_MANAGE,
  ...NAV_TOOLS,
  { href: '/admin/events/new', label: 'New Event', icon: '🎪' },
  { href: '/admin/reports', label: 'Export CSV', icon: '📥' },
  { href: '/admin/staff', label: 'Add Staff Member', icon: '👤' },
  { href: '/admin/promo-codes', label: 'Create Promo Code', icon: '🎟️' },
  { href: '/staff', label: 'Open Gate Scanner', icon: '📷' },
];

export default function AdminLayout({ children, title = 'Admin' }) {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [cmdOpen, setCmdOpen] = useState(false);
  const [cmdQuery, setCmdQuery] = useState('');
  const [cmdIdx, setCmdIdx] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const cmdInputRef = useRef(null);

  useEffect(() => {
    // Only a genuine missing/invalid session (401) redirects to login;
    // transient server errors don't log admins out.
    fetch('/api/auth/me')
      .then(r => r.json())
      .then(d => {
        if (d.user) {
          if (d.user.role === 'gate_staff') {
            router.push('/staff'); // gate staff should use /staff, not admin pages
          } else if (!['super_admin', 'organiser'].includes(d.user.role)) {
            router.push('/admin/login');
          } else {
            setUser(d.user);
          }
        } else if (!d.error) {
          router.push('/admin/login');
        }
      })
      .catch(() => {});
  }, []);

  const handleKey = useCallback((e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      setCmdOpen(o => !o);
      setCmdQuery('');
      setCmdIdx(0);
    }
    if (e.key === 'Escape') {
      setCmdOpen(false);
    }
  }, []);

  useEffect(() => {
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [handleKey]);

  useEffect(() => {
    if (cmdOpen) cmdInputRef.current?.focus();
  }, [cmdOpen]);

  const filteredCmds = CMD_ITEMS.filter(i =>
    i.label.toLowerCase().includes(cmdQuery.toLowerCase())
  );

  function cmdNavigate(href) {
    setCmdOpen(false);
    router.push(href);
  }

  function cmdKeyDown(e) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setCmdIdx(i => Math.min(i + 1, filteredCmds.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setCmdIdx(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && filteredCmds[cmdIdx]) {
      cmdNavigate(filteredCmds[cmdIdx].href);
    }
  }

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/admin/login');
  }

  function isNavActive(href) {
    if (href === '/admin') return router.pathname === '/admin';
    return router.pathname.startsWith(href);
  }

  return (
    <>
      <Head>
        <title>{title} — TiketFlow Admin</title>
      </Head>
      <div className="adm-shell">
        {/* Mobile sidebar overlay */}
        {sidebarOpen && (
          <div
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 300 }}
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside className={`adm-sidebar ${sidebarOpen ? 'open' : ''}`}>
          <div className="adm-sidebar-brand">
            <span
              onClick={() => router.push('/')}
              className="adm-sidebar-brand-name"
              style={{ cursor: 'pointer', display: 'block' }}
            >
              TiketFlow
            </span>
            <div className="adm-sidebar-brand-sub">Organiser Center</div>
          </div>

          <nav className="adm-nav">
            <div className="adm-nav-section">Main</div>
            {NAV_MAIN.map(item => (
              <a
                key={item.href}
                href={item.href}
                className={`adm-nav-link ${isNavActive(item.href) ? 'active' : ''}`}
              >
                <span className="adm-nav-icon">{item.icon}</span>
                {item.label}
              </a>
            ))}

            <div className="adm-nav-section" style={{ marginTop: '8px' }}>Management</div>
            {NAV_MANAGE.map(item => (
              <a
                key={item.href}
                href={item.href}
                className={`adm-nav-link ${isNavActive(item.href) ? 'active' : ''}`}
              >
                <span className="adm-nav-icon">{item.icon}</span>
                {item.label}
              </a>
            ))}

            <div className="adm-nav-section" style={{ marginTop: '8px' }}>Tools</div>
            {NAV_TOOLS.map(item => (
              item.external ? (
                <a
                  key={item.href}
                  href={item.href}
                  className="adm-nav-link"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <span className="adm-nav-icon">{item.icon}</span>
                  {item.label}
                </a>
              ) : (
                <a
                  key={item.href}
                  href={item.href}
                  className={`adm-nav-link ${isNavActive(item.href) ? 'active' : ''}`}
                >
                  <span className="adm-nav-icon">{item.icon}</span>
                  {item.label}
                </a>
              )
            ))}
          </nav>

          <div className="adm-sidebar-footer">
            {user && (
              <div className="adm-user-card">
                <div className="adm-user-avatar">
                  {user.full_name?.charAt(0)?.toUpperCase() || 'A'}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {user.full_name}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    {user.role?.replace('_', ' ')}
                  </div>
                </div>
              </div>
            )}
            <button
              onClick={handleLogout}
              className="adm-nav-link"
              style={{
                color: '#fca5a5',
                background: 'rgba(239, 68, 68, 0.06)',
                border: '1px solid rgba(239, 68, 68, 0.12)',
                width: '100%',
              }}
            >
              <span className="adm-nav-icon">🚪</span>
              Sign Out
            </button>
            <a
              href="/"
              className="adm-nav-link"
              style={{ marginTop: '4px', fontSize: '12px', color: 'var(--text-tertiary)' }}
            >
              <span className="adm-nav-icon">←</span>
              Back to site
            </a>
          </div>
        </aside>

        {/* Main content */}
        <main className="adm-main">
          {/* Topbar */}
          <div className="adm-topbar">
            <button
              onClick={() => setSidebarOpen(o => !o)}
              className="adm-topbar-btn"
              style={{ display: 'none' }}
              id="adm-menu-toggle"
            >
              ☰
            </button>
            <style>{`@media(max-width:1024px){#adm-menu-toggle{display:flex!important}}`}</style>

            <div
              className="adm-topbar-search"
              onClick={() => { setCmdOpen(true); setCmdQuery(''); setCmdIdx(0); }}
            >
              <span>🔍</span>
              <span>Search or type a command...</span>
              <kbd>⌘K</kbd>
            </div>

            <div className="adm-topbar-actions">
              <button className="adm-topbar-btn" title="Notifications" onClick={() => router.push('/admin/reports')}>
                🔔
                <span className="notif-dot" />
              </button>
              <button
                className="adm-topbar-btn"
                title="Create Event"
                onClick={() => router.push('/admin/events/new')}
              >
                ✨
              </button>
              <button
                className="adm-topbar-btn"
                title="Toggle Theme"
                onClick={() => {
                  const html = document.documentElement;
                  const current = html.getAttribute('data-theme');
                  const themes = ['vibrant', 'dark-concert', 'midnight-blue', 'royal-purple', 'emerald', 'elegant-white'];
                  const idx = themes.indexOf(current);
                  const next = themes[(idx + 1) % themes.length];
                  html.setAttribute('data-theme', next);
                  try { localStorage.setItem('tf-theme', next); } catch {}
                }}
              >
                🎨
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="adm-content">
            {children}
          </div>
        </main>

        {/* Command Palette */}
        {cmdOpen && (
          <div className="adm-cmd-overlay" onClick={() => setCmdOpen(false)}>
            <div className="adm-cmd-modal" onClick={e => e.stopPropagation()}>
              <input
                ref={cmdInputRef}
                className="adm-cmd-input"
                placeholder="Type a command or search..."
                value={cmdQuery}
                onChange={e => { setCmdQuery(e.target.value); setCmdIdx(0); }}
                onKeyDown={cmdKeyDown}
              />
              <div className="adm-cmd-results">
                {filteredCmds.length === 0 ? (
                  <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-tertiary)' }}>
                    No results found
                  </div>
                ) : (
                  filteredCmds.map((item, i) => (
                    <div
                      key={item.href + item.label}
                      className={`adm-cmd-item ${i === cmdIdx ? 'selected' : ''}`}
                      onClick={() => cmdNavigate(item.href)}
                      onMouseEnter={() => setCmdIdx(i)}
                    >
                      <span className="cmd-icon">{item.icon}</span>
                      <span>{item.label}</span>
                      <span className="cmd-shortcut">↵</span>
                    </div>
                  ))
                )}
              </div>
              <div style={{
                padding: '10px 16px',
                borderTop: '1px solid var(--border-primary)',
                display: 'flex',
                gap: '16px',
                fontSize: '11px',
                color: 'var(--text-tertiary)',
              }}>
                <span>↑↓ Navigate</span>
                <span>↵ Select</span>
                <span>Esc Close</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
