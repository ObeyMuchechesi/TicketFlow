import Head from 'next/head';
import { useRouter } from 'next/router';
import { useState } from 'react';

export default function Layout({ children, title = 'TiketFlow', description = 'Digital ticketing for events & concerts' }) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  const isAdmin = router.pathname.startsWith('/admin');
  const isCheckin = router.pathname.startsWith('/checkin');
  const isHidden = isAdmin || isCheckin;

  return (
    <>
      <Head>
        <title>{`${title} | TiketFlow`}</title>
        <meta name="description" content={description} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />

        <style>{`
          *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
          html { scroll-behavior: smooth; }
          body {
            font-family: 'DM Sans', sans-serif;
            background: #0a0a0a;
            color: #fff;
            overflow-x: hidden;
            -webkit-font-smoothing: antialiased;
          }
          ::-webkit-scrollbar { width: 6px; }
          ::-webkit-scrollbar-track { background: #0a0a0a; }
          ::-webkit-scrollbar-thumb { background: #e94560; border-radius: 3px; }
          ::selection { background: #e94560; color: #fff; }
          input::placeholder, textarea::placeholder { color: rgba(255,255,255,0.3); }
          input, textarea, select {
            font-family: 'DM Sans', sans-serif;
            color: #fff;
          }
          a { color: inherit; text-decoration: none; }
          button { font-family: 'DM Sans', sans-serif; cursor: pointer; }
        `}</style>
      </Head>

      {!isHidden && (
        <nav style={{
          position: 'sticky',
          top: 0,
          zIndex: 100,
          padding: '0 40px',
          height: '64px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'rgba(10,10,10,0.95)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
        }}>
          <span
            onClick={() => router.push('/')}
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: '26px',
              fontWeight: 700,
              background: 'linear-gradient(120deg, #e94560, #d4a853)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              cursor: 'pointer',
              userSelect: 'none',
            }}
          >
            TiketFlow
          </span>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <NavLink href="/admin">Organise</NavLink>
            <NavLink href="/checkin">Check-In</NavLink>
          </div>
        </nav>
      )}

      <main>{children}</main>

      {!isHidden && (
        <footer style={{
          textAlign: 'center',
          padding: '40px 20px',
          borderTop: '1px solid rgba(255,255,255,0.06)',
          color: 'rgba(255,255,255,0.25)',
          fontSize: '13px',
          lineHeight: 1.8,
        }}>
          <p style={{ marginBottom: '4px' }}>
            <span style={{
              fontFamily: "'Playfair Display', serif",
              background: 'linear-gradient(120deg, #e94560, #d4a853)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              fontWeight: 700,
            }}>TiketFlow</span>
            {' '}— Digital Ticketing for Concerts & Events
          </p>
          <p>Built for Zimbabwe, Designed for the World 🌍</p>
          <p style={{ marginTop: '8px', color: 'rgba(255,255,255,0.12)' }}>
            © {new Date().getFullYear()} TiketFlow. All rights reserved.
          </p>
        </footer>
      )}
    </>
  );
}

function NavLink({ href, children }) {
  const router = useRouter();
  return (
    <a
      href={href}
      style={{
        color: 'rgba(255,255,255,0.6)',
        fontSize: '14px',
        fontWeight: 500,
        padding: '8px 16px',
        borderRadius: '8px',
        transition: 'all 0.2s',
      }}
      onMouseEnter={e => { e.target.style.color = '#fff'; e.target.style.background = 'rgba(255,255,255,0.06)'; }}
      onMouseLeave={e => { e.target.style.color = 'rgba(255,255,255,0.6)'; e.target.style.background = 'transparent'; }}
    >
      {children}
    </a>
  );
}
