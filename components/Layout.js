import Head from 'next/head';
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import { Ticket, Palette, Menu, X, AtSign, Camera, ThumbsUp, Briefcase, Check } from 'lucide-react';

const THEMES = [
  { id: 'vibrant', name: 'Vibrant Light', color: '#7c3aed' },
  { id: 'dark-concert', name: 'Dark Concert', color: '#a855f7' },
  { id: 'elegant-white', name: 'Elegant White', color: '#6366f1' },
  { id: 'midnight-blue', name: 'Midnight Blue', color: '#3b82f6' },
  { id: 'royal-purple', name: 'Royal Purple', color: '#c084fc' },
  { id: 'emerald', name: 'Emerald', color: '#10b981' }
];

export default function Layout({ children, title = 'TiketFlow', description = 'Premium digital ticketing for events & concerts' }) {
  const router = useRouter();
  const [activeTheme, setActiveTheme] = useState('vibrant');
  const [themeMenuOpen, setThemeMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isAdmin = router.pathname.startsWith('/admin');
  const isCheckin = router.pathname.startsWith('/checkin');
  const isHidden = isAdmin || isCheckin;

  useEffect(() => {
    const savedTheme = localStorage.getItem('tf-theme') || 'vibrant';
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
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%238b5cf6' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z'/><path d='M13 5v2'/><path d='M13 17v2'/><path d='M13 11v2'/></svg>" />
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
              <div className="tf-logo-icon"><Ticket size={20} strokeWidth={2.25} /></div>
              <span>TiketFlow</span>
            </a>

            <ul className="tf-nav-links">
              <li><a href="/#events-section">Browse Events</a></li>
              <li><a href="/#categories">Categories</a></li>
              <li><a href="/dashboard">My Tickets</a></li>
              <li><a href="/#about">About</a></li>
              <li><a href="mailto:support@tiketflow.com">Contact</a></li>
            </ul>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {/* Mobile menu toggle */}
              <button
                className="tf-btn tf-btn-ghost tf-btn-icon"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                style={{ display: 'none' }}
                aria-label="Menu"
              >
                {mobileMenuOpen ? <X size={18} strokeWidth={2} /> : <Menu size={18} strokeWidth={2} />}
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
              <a href="/#events-section" className="tf-btn tf-btn-ghost" style={{ justifyContent: 'flex-start' }}>Browse Events</a>
              <a href="/#categories" className="tf-btn tf-btn-ghost" style={{ justifyContent: 'flex-start' }}>Categories</a>
              <a href="/dashboard" className="tf-btn tf-btn-ghost" style={{ justifyContent: 'flex-start' }}>My Tickets</a>
              <a href="mailto:support@tiketflow.com" className="tf-btn tf-btn-ghost" style={{ justifyContent: 'flex-start' }}>Contact</a>
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
                  <div className="tf-logo-icon"><Ticket size={20} strokeWidth={2.25} /></div>
                  <span>TiketFlow</span>
                </a>
                <p>
                  Next-generation digital ticketing platform for events and concerts.
                  Fast, secure, and beautifully designed.
                </p>
                <div className="tf-footer-social">
                  <a href="#" aria-label="X (Twitter)"><AtSign size={16} strokeWidth={2} /></a>
                  <a href="#" aria-label="Instagram"><Camera size={16} strokeWidth={2} /></a>
                  <a href="#" aria-label="Facebook"><ThumbsUp size={16} strokeWidth={2} /></a>
                  <a href="#" aria-label="LinkedIn"><Briefcase size={16} strokeWidth={2} /></a>
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

              {/* Support */}
              <div className="tf-footer-column">
                <h4>Support</h4>
                <a href="#about">About Us</a>
                <a href="mailto:support@tiketflow.com">Contact</a>
                <a href="/ticket/recover">Recover a Lost Ticket</a>
                <a href="#">FAQ</a>
              </div>

              {/* Company */}
              <div className="tf-footer-column">
                <h4>Company</h4>
                <a href="/dashboard">My Tickets</a>
                <a href="/#events-section">Browse Events</a>
                <a href="/#categories">Event Categories</a>
                <a href="#">Terms of Service</a>
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
            <Palette size={20} strokeWidth={2} />
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
                    <Check size={15} strokeWidth={2.5} style={{ marginLeft: 'auto', color: 'var(--accent-primary)' }} />
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
