import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';

// ─── Styles ───────────────────────────────────────────────────────────────────
const S = {
  page: {
    minHeight: '100vh',
    background: 'linear-gradient(160deg, #0a0a0a 0%, #1a1a2e 55%, #16213e 100%)',
  },
  hero: {
    textAlign: 'center',
    padding: 'clamp(60px, 8vw, 100px) 20px 60px',
  },
  badge: {
    display: 'inline-block',
    background: 'rgba(233,69,96,0.15)',
    border: '1px solid rgba(233,69,96,0.3)',
    color: '#e94560',
    padding: '8px 20px',
    borderRadius: '50px',
    fontSize: '12px',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '2px',
    marginBottom: '24px',
  },
  heroTitle: {
    fontFamily: "'Playfair Display', serif",
    fontSize: 'clamp(36px, 6vw, 60px)',
    fontWeight: 800,
    lineHeight: 1.15,
    marginBottom: '20px',
  },
  heroSub: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: '17px',
    maxWidth: '520px',
    margin: '0 auto 44px',
    lineHeight: 1.6,
  },
  // Search bar
  searchWrap: {
    maxWidth: '680px',
    margin: '0 auto 16px',
    display: 'flex',
    gap: '12px',
    flexWrap: 'wrap',
  },
  searchInput: {
    flex: 1,
    minWidth: '220px',
    padding: '14px 20px',
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: '12px',
    color: '#fff',
    fontSize: '15px',
    outline: 'none',
  },
  searchBtn: {
    padding: '14px 28px',
    background: '#e94560',
    color: '#fff',
    border: 'none',
    borderRadius: '12px',
    fontWeight: 700,
    fontSize: '15px',
    cursor: 'pointer',
    transition: 'background 0.2s',
    whiteSpace: 'nowrap',
  },
  // Grid
  grid: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '0 20px 80px',
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
    gap: '24px',
  },
  card: {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '20px',
    overflow: 'hidden',
    cursor: 'pointer',
    transition: 'transform 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease',
  },
  cardImg: {
    height: '210px',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    position: 'relative',
  },
  cardBadge: {
    position: 'absolute',
    top: '12px',
    left: '12px',
    background: '#e94560',
    color: '#fff',
    padding: '4px 14px',
    borderRadius: '50px',
    fontSize: '11px',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  cardBody: { padding: '22px' },
  cardTitle: {
    fontFamily: "'Playfair Display', serif",
    fontSize: '21px',
    fontWeight: 700,
    marginBottom: '8px',
    lineHeight: 1.3,
  },
  cardMeta: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: '13px',
    marginBottom: '4px',
  },
  ticketPill: {
    display: 'inline-block',
    background: 'rgba(255,255,255,0.07)',
    padding: '4px 10px',
    borderRadius: '6px',
    fontSize: '12px',
    marginRight: '6px',
    marginBottom: '4px',
    border: '1px solid rgba(255,255,255,0.08)',
  },
  buyBtn: {
    background: '#e94560',
    color: '#fff',
    border: 'none',
    padding: '10px 22px',
    borderRadius: '50px',
    fontWeight: 700,
    fontSize: '14px',
    cursor: 'pointer',
    transition: 'background 0.2s, transform 0.1s',
    whiteSpace: 'nowrap',
  },
};

// ─── Fallback / demo events ───────────────────────────────────────────────────
const DEMO_EVENTS = [
  {
    id: '1',
    slug: 'harare-summer-fest',
    event_name: 'Harare Summer Music Festival',
    date: '2026-08-20',
    time: '6:00 PM – 11:00 PM',
    venue: 'Harare International Conference Centre',
    poster_image: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=700&q=80',
    status: 'published',
    theme_color: '#e94560',
    ticket_types: [
      { name: 'Early Bird', price: 10, color: '#10b981' },
      { name: 'General Admission', price: 15, color: '#e94560' },
      { name: 'VIP', price: 50, color: '#d4a853' },
    ],
  },
  {
    id: '2',
    slug: 'jazz-night-gala',
    event_name: 'Jazz Night Gala',
    date: '2026-09-10',
    time: '8:00 PM – 1:00 AM',
    venue: 'Meikles Hotel, Harare',
    poster_image: 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=700&q=80',
    status: 'published',
    theme_color: '#d4a853',
    ticket_types: [
      { name: 'General Admission', price: 25, color: '#e94560' },
      { name: 'VIP Table', price: 120, color: '#d4a853' },
    ],
  },
  {
    id: '3',
    slug: 'afrobeats-night',
    event_name: 'Afrobeats Night Live',
    date: '2026-10-05',
    time: '7:00 PM – 12:00 AM',
    venue: 'Rainbow Towers, Harare',
    poster_image: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=700&q=80',
    status: 'published',
    theme_color: '#f59e0b',
    ticket_types: [
      { name: 'General', price: 12, color: '#e94560' },
      { name: 'VIP', price: 40, color: '#d4a853' },
    ],
  },
];

// ─── Component ────────────────────────────────────────────────────────────────
export default function Home({ events: serverEvents }) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const rawEvents = serverEvents?.length ? serverEvents : DEMO_EVENTS;

  const filtered = rawEvents.filter(ev => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      ev.event_name?.toLowerCase().includes(q) ||
      ev.venue?.toLowerCase().includes(q) ||
      ev.date?.includes(q);
    const matchFilter = filter === 'all' || ev.status === filter;
    return matchSearch && matchFilter;
  });

  function formatDate(d) {
    if (!d) return '';
    try {
      return new Date(d).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'long', day: 'numeric' });
    } catch { return d; }
  }

  function minPrice(event) {
    const types = event.ticket_types || [];
    if (!types.length) return null;
    return Math.min(...types.map(t => Number(t.price)));
  }

  return (
    <div style={S.page}>
      {/* Hero */}
      <div style={S.hero}>
        <div style={S.badge}>🎵 Digital Ticketing Platform</div>
        <h1 style={S.heroTitle}>
          Your Ticket to<br />
          <span style={{
            background: 'linear-gradient(120deg, #e94560, #d4a853)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            Unforgettable Events
          </span>
        </h1>
        <p style={S.heroSub}>
          Browse events, buy tickets, and get digital passes with QR codes.
          Fast entry, no paper, no fraud.
        </p>

        {/* Search */}
        <div style={S.searchWrap}>
          <input
            style={S.searchInput}
            type="text"
            placeholder="Search by name, venue or date..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <button
            style={S.searchBtn}
            onMouseEnter={e => e.target.style.background = '#c73652'}
            onMouseLeave={e => e.target.style.background = '#e94560'}
          >
            🔍 Search
          </button>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '40px' }}>
          {['all', 'published', 'sold_out'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: '7px 18px',
                borderRadius: '50px',
                border: '1px solid',
                borderColor: filter === f ? '#e94560' : 'rgba(255,255,255,0.15)',
                background: filter === f ? 'rgba(233,69,96,0.15)' : 'transparent',
                color: filter === f ? '#e94560' : 'rgba(255,255,255,0.5)',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                textTransform: 'capitalize',
                transition: 'all 0.2s',
              }}
            >
              {f === 'all' ? 'All Events' : f === 'sold_out' ? 'Sold Out' : 'On Sale'}
            </button>
          ))}
        </div>
      </div>

      {/* Events Grid */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'rgba(255,255,255,0.3)' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎟️</div>
          <p style={{ fontSize: '18px' }}>No events found for "{search}"</p>
        </div>
      ) : (
        <div style={S.grid}>
          {filtered.map(event => (
            <EventCard
              key={event.id}
              event={event}
              formatDate={formatDate}
              minPrice={minPrice}
              onClick={() => router.push(`/events/${event.slug}`)}
            />
          ))}
        </div>
      )}

      {/* Stats bar */}
      <div style={{
        maxWidth: '900px',
        margin: '0 auto 80px',
        padding: '0 20px',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
        gap: '16px',
      }}>
        {[
          { label: 'Events Live', value: rawEvents.filter(e => e.status === 'published').length + '+' },
          { label: 'Tickets Sold', value: '10,000+' },
          { label: 'Happy Fans', value: '8,500+' },
          { label: 'Cities', value: '12+' },
        ].map(stat => (
          <div key={stat.label} style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: '16px',
            padding: '24px',
            textAlign: 'center',
          }}>
            <div style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: '32px',
              fontWeight: 800,
              background: 'linear-gradient(120deg, #e94560, #d4a853)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>{stat.value}</div>
            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px', marginTop: '4px' }}>{stat.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function EventCard({ event, formatDate, minPrice, onClick }) {
  const [hovered, setHovered] = useState(false);
  const low = minPrice(event);

  return (
    <div
      style={{
        ...S.card,
        transform: hovered ? 'translateY(-6px)' : 'none',
        borderColor: hovered ? (event.theme_color || '#e94560') : 'rgba(255,255,255,0.08)',
        boxShadow: hovered ? `0 20px 40px rgba(0,0,0,0.4)` : 'none',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onClick}
    >
      <div style={{
        ...S.cardImg,
        backgroundImage: `url(${event.poster_image || 'https://images.unsplash.com/photo-1540039155733-5bb30b4259d6?w=700&q=80'})`,
      }}>
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(180deg, transparent 50%, rgba(0,0,0,0.6) 100%)',
        }} />
        <div style={S.cardBadge}>
          {event.status === 'sold_out' ? '🔴 Sold Out' : event.status === 'published' ? '🟢 On Sale' : event.status}
        </div>
        {low !== null && (
          <div style={{
            position: 'absolute',
            bottom: '12px',
            right: '12px',
            background: 'rgba(0,0,0,0.7)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255,255,255,0.15)',
            padding: '4px 12px',
            borderRadius: '50px',
            fontSize: '13px',
            fontWeight: 700,
            color: '#d4a853',
          }}>
            From ${low}
          </div>
        )}
      </div>

      <div style={S.cardBody}>
        <h3 style={S.cardTitle}>{event.event_name}</h3>
        <p style={S.cardMeta}>📅 {formatDate(event.date)}</p>
        <p style={{ ...S.cardMeta, marginBottom: '16px' }}>📍 {event.venue}</p>

        <div style={{ marginBottom: '16px' }}>
          {(event.ticket_types || []).map((t, i) => (
            <span key={i} style={S.ticketPill}>
              {t.name}: <span style={{ color: t.color || '#e94560', fontWeight: 600 }}>${t.price}</span>
            </span>
          ))}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '12px' }}>
            {event.time || ''}
          </span>
          <button
            style={S.buyBtn}
            onMouseEnter={e => { e.stopPropagation(); e.target.style.background = '#c73652'; }}
            onMouseLeave={e => { e.target.style.background = '#e94560'; }}
            onClick={onClick}
          >
            Get Tickets →
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Server-side data fetch ───────────────────────────────────────────────────
export async function getServerSideProps() {
  try {
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    );

    const { data: events, error } = await supabase
      .from('events')
      .select(`
        id, slug, event_name, date, time, venue, poster_image, status, theme_color,
        ticket_types (id, name, price, color, quantity_available, quantity_sold)
      `)
      .eq('status', 'published')
      .order('date', { ascending: true });

    if (error || !events?.length) {
      return { props: { events: [] } };
    }
    return { props: { events } };
  } catch {
    return { props: { events: [] } };
  }
}

Home.getLayout = (page) => <Layout title="Home">{page}</Layout>;
