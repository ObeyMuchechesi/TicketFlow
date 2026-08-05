import Head from 'next/head';
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';

const THEMES = [
  { id: 'dark-concert', name: 'Dark Concert', color: '#a855f7' },
  { id: 'elegant-white', name: 'Elegant White', color: '#6366f1' },
  { id: 'midnight-blue', name: 'Midnight Blue', color: '#3b82f6' },
  { id: 'royal-purple', name: 'Royal Purple', color: '#c084fc' },
  { id: 'emerald', name: 'Emerald', color: '#10b981' }
];

export default function Layout({ children, title = 'TiketFlow', description = 'Premium digital ticketing for events & concerts' }) {
  const router = useRouter();
  const [activeTheme, setActiveTheme] = useState('dark-concert');
  const [themeMenuOpen, setThemeMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isAdmin = router.pathname.startsWith('/admin');
  const isCheckin = router.pathname.startsWith('/checkin');
  const isHidden = isAdmin || isCheckin;

  useEffect(() => {
    const savedTheme = localStorage.getItem('tf-theme') || 'dark-concert';
    setActiveTheme(savedTheme);
    document.documentElement.setAttribute('data-theme', savedTheme);
  }, []);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleThemeChange = (themeId) => {
    setActiveTheme(themeId);
    localStorage.setItem('tf-theme', themeId);
    document.documentElement.setAttribute('data-theme', themeId);
    setThemeMenuOpen(false);
  };

  return (
    <>
      <Head>
        <title>{`${title} | TiketFlow`}</title>
        <meta name="description" content={description} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🎟️</text></svg>" />
      </Head>

      {/* Animated Background Mesh */}
      {!isHidden && <div className="tf-bg-mesh" />}

      {/* Premium Navigation */}
      {!isHidden && (
        <nav className={`tf-nav ${scrolled ? 'scrolled' : ''}`}>
          <div className="tf-nav-inner">
            <a
              href="/"
              className="tf-logo"
              onClick={(e) => { e.preventDefault(); router.push('/'); }}
            >
              <div className="tf-logo-icon">🎟️</div>
              <span>TiketFlow</span>
            </a>

            <ul className="tf-nav-links">
              <li><a href="/#events-grid">Events</a></li>
              <li><a href="/dashboard">My Tickets</a></li>
              <li><a href="/admin">Admin</a></li>
              <li><a href="/checkin">Check-In</a></li>
            </ul>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                onClick={() => router.push('/admin/events/new')}
                className="tf-btn tf-btn-primary tf-btn-sm"
                style={{ display: 'none' }}
              >
                Create Event
              </button>

              {/* Mobile menu toggle */}
              <button
                className="tf-btn tf-btn-ghost tf-btn-icon"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                style={{ display: 'none' }}
                aria-label="Menu"
              >
                {mobileMenuOpen ? '✕' : '☰'}
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="glass-card animate-fade-in-down" style={{
              position: 'absolute',
              top: '100%',
              left: '16px',
              right: '16px',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
            }}>
              <a href="/#events-grid" className="tf-btn tf-btn-ghost" style={{ justifyContent: 'flex-start' }}>Events</a>
              <a href="/#categories" className="tf-btn tf-btn-ghost" style={{ justifyContent: 'flex-start' }}>Categories</a>
              <a href="/admin" className="tf-btn tf-btn-ghost" style={{ justifyContent: 'flex-start' }}>Dashboard</a>
              <a href="/checkin" className="tf-btn tf-btn-ghost" style={{ justifyContent: 'flex-start' }}>Check-In</a>
            </div>
          )}
        </nav>
      )}

      <main style={{ minHeight: '100vh' }}>{children}</main>

      {/* Premium Footer */}
      {!isHidden && (
        <footer className="tf-footer">
          <div className="tf-footer-inner">
            <div className="tf-footer-grid">
              {/* Brand Column */}
              <div className="tf-footer-brand">
                <a href="/" className="tf-logo" style={{ marginBottom: '16px' }}>
                  <div className="tf-logo-icon">🎟️</div>
                  <span>TiketFlow</span>
                </a>
                <p>
                  Next-generation digital ticketing platform for events and concerts.
                  Fast, secure, and beautifully designed.
                </p>
                <div className="tf-footer-social">
                  <a href="#" aria-label="Twitter">𝕏</a>
                  <a href="#" aria-label="Instagram">📷</a>
                  <a href="#" aria-label="Facebook">f</a>
                  <a href="#" aria-label="LinkedIn">in</a>
                </div>
              </div>

              {/* Categories */}
              <div className="tf-footer-column">
                <h4>Categories</h4>
                <a href="/?category=Music">Music & Concerts</a>
                <a href="/?category=Festival">Festivals</a>
                <a href="/?category=Comedy">Comedy Shows</a>
                <a href="/?category=Sports">Sports Events</a>
                <a href="/?category=Church">Church & Community</a>
              </div>

              {/* Organisers */}
              <div className="tf-footer-column">
                <h4>Organisers</h4>
                <a href="/admin">Partner Dashboard</a>
                <a href="/admin/events/new">Create Event</a>
                <a href="/checkin">Gate Staff Login</a>
                <a href="mailto:support@tiketflow.com">Support Center</a>
              </div>

              {/* Resources */}
              <div className="tf-footer-column">
                <h4>Resources</h4>
                <a href="#">API Documentation</a>
                <a href="#">Pricing</a>
                <a href="#">Help Center</a>
                <a href="#">Status Page</a>
              </div>
            </div>

            <div className="tf-footer-bottom">
              <p>© {new Date().getFullYear()} TiketFlow. All rights reserved.</p>
              <div style={{ display: 'flex', gap: '20px' }}>
                <a href="#" style={{ color: 'var(--text-tertiary)', textDecoration: 'none' }}>Terms of Service</a>
                <a href="#" style={{ color: 'var(--text-tertiary)', textDecoration: 'none' }}>Privacy Policy</a>
                <a href="#" style={{ color: 'var(--text-tertiary)', textDecoration: 'none' }}>Cookie Policy</a>
              </div>
            </div>
          </div>
        </footer>
      )}

      {/* Floating Theme Switcher */}
      {!isHidden && (
        <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 1000 }}>
          <button
            onClick={() => setThemeMenuOpen(!themeMenuOpen)}
            className="glass-card"
            style={{
              width: '52px',
              height: '52px',
              borderRadius: '50%',
              padding: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 30px rgba(0,0,0,0.3)',
              cursor: 'pointer',
              border: '1px solid var(--border-primary)',
              background: 'var(--bg-glass)',
              backdropFilter: 'blur(20px)',
              fontSize: '20px',
              transition: 'all 0.3s var(--ease-out)',
            }}
            aria-label="Change theme"
          >
            🎨
          </button>
          {themeMenuOpen && (
            <div
              className="glass-card animate-scale-in"
              style={{
                position: 'absolute',
                bottom: '64px',
                right: 0,
                padding: '16px',
                width: '200px',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
                boxShadow: 'var(--shadow-xl)',
              }}
            >
              <div style={{
                fontSize: '11px',
                color: 'var(--text-tertiary)',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                marginBottom: '8px',
                paddingLeft: '8px',
                fontWeight: 700,
              }}>
                Select Theme
              </div>
              {THEMES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => handleThemeChange(t.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-sm)',
                    border: 'none',
                    background: activeTheme === t.id ? 'rgba(139, 92, 246, 0.15)' : 'transparent',
                    color: 'var(--text-primary)',
                    fontSize: '13px',
                    cursor: 'pointer',
                    textAlign: 'left',
                    fontWeight: activeTheme === t.id ? 600 : 400,
                    transition: 'all 0.15s ease',
                    fontFamily: 'var(--font-primary)',
                  }}
                  onMouseEnter={(e) => { if (activeTheme !== t.id) e.currentTarget.style.background = 'var(--bg-glass-light)'; }}
                  onMouseLeave={(e) => { if (activeTheme !== t.id) e.currentTarget.style.background = 'transparent'; }}
                >
                  <span style={{
                    display: 'inline-block',
                    width: '14px',
                    height: '14px',
                    borderRadius: '50%',
                    background: t.color,
                    boxShadow: activeTheme === t.id ? `0 0 12px ${t.color}` : 'none',
                    transition: 'box-shadow 0.2s',
                  }} />
                  {t.name}
                  {activeTheme === t.id && (
                    <span style={{ marginLeft: 'auto', fontSize: '12px', color: 'var(--accent-primary)' }}>✓</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}
