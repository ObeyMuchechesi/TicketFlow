import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';
import { Badge, Button, Card, Progress, CountdownTimer } from '../components/ui';
import {
  Ticket, Music, PartyPopper, Church, Briefcase, UtensilsCrossed, GraduationCap, Mic, Trophy,
  Star, Sparkles, BarChart3, Award, MessageSquare, HelpCircle, Mail, Zap, Search, Flame,
  Heart, Share2, Check, CheckCircle2, Users,
  MapPin, CalendarDays, Clock, Tent,
} from 'lucide-react';

const CATEGORIES = [
  { id: 'all', label: 'All Events', icon: Ticket },
  { id: 'Music', label: 'Music', icon: Music },
  { id: 'Festival', label: 'Festival', icon: PartyPopper },
  { id: 'Church', label: 'Church', icon: Church },
  { id: 'Corporate', label: 'Corporate', icon: Briefcase },
  { id: 'Dinner', label: 'Dinner', icon: UtensilsCrossed },
  { id: 'Graduation', label: 'Graduation', icon: GraduationCap },
  { id: 'Comedy', label: 'Comedy', icon: Mic },
  { id: 'Sports', label: 'Sports', icon: Trophy },
];

const SPONSORS = [
  { name: 'EverAfter Hub', tagline: 'Official Event Partner', icon: Sparkles },
];

const TESTIMONIALS = [
  { name: 'Tinashe Maposa', role: 'Concert Organiser', quote: 'TiketFlow changed everything for our festival. We sold out in 3 days, and check-in was instant.', rating: 5, initials: 'TM' },
  { name: 'Sarah Ndlovu', role: 'Church Administrator', quote: 'The cleanest interface we have ever used. Our congregation loved the ticket delivery via WhatsApp.', rating: 5, initials: 'SN' },
  { name: 'Nyasha Sibanda', role: 'Corporate Event Manager', quote: 'The analytics, reporting and gate scan dashboard are world class. Absolutely highly recommended!', rating: 5, initials: 'NS' }
];

const FAQS = [
  { q: 'How do I receive my ticket?', a: 'Once your purchase is completed, your ticket is instantly generated as a digital pass with a secure QR code. You can download it, print it, or save it to your Apple/Google Wallet. We also send it via email.' },
  { q: 'What payment methods do you support?', a: 'We support Stripe for international credit/debit cards, Apple Pay, Google Pay, and EcoCash for mobile payments in Zimbabwe.' },
  { q: 'Can I transfer my ticket to someone else?', a: 'Yes! You can share the ticket link or copy the WhatsApp ticket link directly from your confirmation page to send it to a friend.' },
  { q: 'How does check-in work at the event?', a: 'Simply show the QR code on your mobile device to the gate staff. They will scan it using the gate staff panel for instant verification.' },
  { q: 'Is TiketFlow available outside Zimbabwe?', a: 'Absolutely! While we are proudly built in Zimbabwe, TiketFlow supports international payments via Stripe and can be used for events anywhere in the world.' },
];

const DEMO_EVENTS = [
  {
    id: '1', slug: 'harare-summer-fest',
    event_name: 'Harare Summer Music Festival',
    description: 'Experience the biggest summer music festival in Harare! Top Afrobeat and Dancehall artists, local food stalls, and premium VIP lounges. Over 5,000 festival-goers expected.',
    date: '2026-08-20', time: '6:00 PM – 11:00 PM',
    venue: 'Harare International Conference Centre',
    poster_image: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=700&q=80',
    status: 'published', theme_color: '#a855f7',
    ticket_types: [
      { name: 'Early Bird', price: 10, color: '#10b981', quantity_available: 100, quantity_sold: 100 },
      { name: 'General Admission', price: 15, color: '#a855f7', quantity_available: 500, quantity_sold: 250 },
      { name: 'VIP Pass', price: 50, color: '#f59e0b', quantity_available: 50, quantity_sold: 40 },
    ],
  },
  {
    id: '2', slug: 'comedy-night-harare',
    event_name: 'Harare Comedy Unplugged',
    description: 'Get ready for an evening of non-stop laughter featuring Zimbabwe\'s top stand-up comedians and guest acts from South Africa. Dinner and drinks included for VIP ticket holders.',
    date: '2026-09-02', time: '7:30 PM – 10:30 PM',
    venue: 'Reps Theatre, Belgravia',
    poster_image: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=700&q=80',
    status: 'published', theme_color: '#ec4899',
    ticket_types: [
      { name: 'General Show', price: 15, color: '#ec4899', quantity_available: 150, quantity_sold: 90 },
      { name: 'VIP Dinner + Show', price: 40, color: '#f97316', quantity_available: 50, quantity_sold: 50 },
    ],
  },
  {
    id: '3', slug: 'royal-worship-concert',
    event_name: 'Royal Worship Night 2026',
    description: 'Join us for a divine evening of praise, worship, and spiritual elevation. Featuring multiple choirs, worship leaders, and guest speakers in Harare.',
    date: '2026-09-12', time: '5:00 PM – 9:00 PM',
    venue: 'Celebration Centre, Borrowdale',
    poster_image: 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=700&q=80',
    status: 'published', theme_color: '#3b82f6',
    ticket_types: [
      { name: 'Standard Seat', price: 5, color: '#3b82f6', quantity_available: 1000, quantity_sold: 600 },
      { name: 'Golden Circle', price: 20, color: '#10b981', quantity_available: 100, quantity_sold: 80 },
    ],
  },
  {
    id: '4', slug: 'corporate-summit-2026',
    event_name: 'Zimbabwe Tech & Business Summit',
    description: 'The premier corporate networking and technology exhibition. Learn from industry leaders, participate in panel sessions, and establish vital business connections.',
    date: '2026-10-10', time: '8:00 AM – 5:00 PM',
    venue: 'Meikles Hotel, Harare',
    poster_image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=700&q=80',
    status: 'published', theme_color: '#10b981',
    ticket_types: [
      { name: 'Delegate Pass', price: 80, color: '#10b981', quantity_available: 200, quantity_sold: 110 },
      { name: 'Executive VIP Table', price: 250, color: '#3b82f6', quantity_available: 20, quantity_sold: 15 },
    ],
  },
  {
    id: '5', slug: 'uz-graduation-2026',
    event_name: 'University of Zimbabwe Graduation',
    description: 'Celebrate academic excellence at the 2026 UZ Graduation Ceremony. Proud families and distinguished guests welcome.',
    date: '2026-08-28', time: '9:00 AM – 2:00 PM',
    venue: 'University of Zimbabwe, Great Hall',
    poster_image: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=700&q=80',
    status: 'published', theme_color: '#0ea5e9',
    ticket_types: [
      { name: 'Guest Pass', price: 0, color: '#0ea5e9', quantity_available: 500, quantity_sold: 200 },
      { name: 'VIP Seating', price: 20, color: '#f59e0b', quantity_available: 50, quantity_sold: 30 },
    ],
  },
  {
    id: '6', slug: 'marathon-harare-2026',
    event_name: 'Harare City Marathon 2026',
    description: 'Run the streets of Harare! Full marathon, half marathon, and 5K fun run categories. Chip timing, medals, and refreshments for all finishers.',
    date: '2026-09-18', time: '5:30 AM – 2:00 PM',
    venue: 'National Sports Stadium',
    poster_image: 'https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=700&q=80',
    status: 'published', theme_color: '#22c55e',
    ticket_types: [
      { name: '5K Fun Run', price: 5, color: '#22c55e', quantity_available: 500, quantity_sold: 150 },
      { name: 'Half Marathon', price: 20, color: '#3b82f6', quantity_available: 200, quantity_sold: 80 },
      { name: 'Full Marathon', price: 30, color: '#ef4444', quantity_available: 100, quantity_sold: 45 },
    ],
  }
];

function detectCategory(event) {
  const searchString = `${event.event_name} ${event.description || ''} ${event.venue} ${event.slug}`.toLowerCase();
  const keywords = {
    Music: ['music', 'concert', 'festival', 'gala', 'band', 'gig', 'live', 'worship', 'afrobeat', 'dancehall'],
    Festival: ['festival', 'fest', 'outdoor', 'gala'],
    Church: ['church', 'worship', 'praise', 'spiritual', 'prayer', 'celebration centre'],
    Corporate: ['corporate', 'summit', 'tech', 'business', 'networking', 'seminar', 'expo', 'delegate'],
    Dinner: ['dinner', 'gala', 'food', 'hotel', 'restaurant', 'lunch'],
    Graduation: ['graduation', 'university', 'college', 'school', 'academy'],
    Comedy: ['comedy', 'laughter', 'stand-up', 'laugh', 'humor', 'comedians'],
    Sports: ['sports', 'run', 'marathon', 'soccer', 'golf', 'football', 'fitness', 'athletic']
  };
  for (const [cat, words] of Object.entries(keywords)) {
    if (words.some(w => searchString.includes(w))) return cat;
  }
  return 'Music';
}

function formatDate(d) {
  if (!d) return '';
  try { return new Date(d).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }); }
  catch { return d; }
}

function minPrice(event) {
  const types = event.ticket_types || [];
  if (!types.length) return null;
  return Math.min(...types.map(t => Number(t.price)));
}

function allFree(event) {
  const types = event.ticket_types || [];
  return types.length > 0 && types.every(t => Number(t.price) === 0);
}

function totalTickets(event) {
  return (event.ticket_types || []).reduce((a, t) => a + (Number(t.quantity_available) || 0), 0);
}

function totalSold(event) {
  return (event.ticket_types || []).reduce((a, t) => a + (Number(t.quantity_sold) || 0), 0);
}

function percentSold(event) {
  const total = totalTickets(event);
  if (!total) return 0;
  return Math.round((totalSold(event) / total) * 100);
}

function daysUntil(dateStr) {
  const diff = new Date(dateStr).getTime() - new Date().getTime();
  if (diff <= 0) return 0;
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export default function Home({ events: serverEvents }) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [favourited, setFavourited] = useState({});
  const [copiedId, setCopiedId] = useState(null);
  const [faqOpen, setFaqOpen] = useState({});
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterSubscribed, setNewsletterSubscribed] = useState(false);
  const [activeTab, setActiveTab] = useState('trending');

  const rawEvents = serverEvents?.length ? serverEvents : DEMO_EVENTS;

  useEffect(() => {
    const favs = localStorage.getItem('tf-favs');
    if (favs) setFavourited(JSON.parse(favs));
  }, []);

  const toggleFavourite = (id, e) => {
    e.stopPropagation();
    const next = { ...favourited, [id]: !favourited[id] };
    setFavourited(next);
    localStorage.setItem('tf-favs', JSON.stringify(next));
  };

  const handleShare = (id, slug, e) => {
    e.stopPropagation();
    const url = `${window.location.origin}/events/${slug}`;
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const isMatchCategory = (event, catId) => {
    if (catId === 'all') return true;
    return detectCategory(event) === catId;
  };

  const filtered = rawEvents.filter(ev => {
    const q = search.toLowerCase();
    const matchSearch = !q || ev.event_name?.toLowerCase().includes(q) || ev.venue?.toLowerCase().includes(q) || ev.date?.includes(q);
    const matchCategory = isMatchCategory(ev, activeCategory);
    return matchSearch && matchCategory;
  });

  const trendingEvents = useMemo(() => [...rawEvents].sort((a, b) => percentSold(b) - percentSold(a)).slice(0, 6), [rawEvents]);
  const upcomingEvents = useMemo(() => [...rawEvents].sort((a, b) => new Date(a.date) - new Date(b.date)).slice(0, 6), [rawEvents]);
  const featuredEvent = filtered.find(e => e.theme_color) || filtered[0];
  const nextEvent = useMemo(() => [...rawEvents].sort((a, b) => new Date(a.date) - new Date(b.date))[0], [rawEvents]);

  const totalLiveEvents = rawEvents.length;
  const totalTicketsIssued = rawEvents.reduce((a, e) => a + totalSold(e), 0);

  const tabbedEvents = activeTab === 'trending' ? trendingEvents : activeTab === 'upcoming' ? upcomingEvents : rawEvents;

  return (
    <div style={{ overflowX: 'hidden' }}>
      {/* ═══════════════ HERO SECTION ═══════════════ */}
      <section className="tf-hero">
        <div className="tf-hero-bg">
          <div className="tf-hero-orb tf-hero-orb-1" />
          <div className="tf-hero-orb tf-hero-orb-2" />
          <div className="tf-hero-orb tf-hero-orb-3" />
        </div>

        <div className="tf-hero-content">
          <div className="tf-hero-badge animate-fade-in-up">
            <span className="tf-hero-badge-dot" />
            Next-Generation Digital Ticketing
          </div>

          <h1 className="tf-hero-title animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            Your Ticket to{' '}
            <span className="tf-hero-title-gradient">
              Unforgettable Events
            </span>
          </h1>

          <p className="tf-hero-subtitle animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            Secure, collectible digital passes for festivals, concerts, corporate summits,
            and church conferences. Beautiful. Fast. Reliable.
          </p>

          {/* Search Box */}
          <div className="animate-fade-in-up" style={{ animationDelay: '0.3s', maxWidth: '640px', margin: '0 auto 24px' }}>
            <div className="tf-search">
              <span className="tf-search-icon"><Search size={17} strokeWidth={2} /></span>
              <input
                type="text"
                className="tf-input tf-input-lg"
                placeholder="Search by event, artist, or location..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ paddingLeft: '48px', borderRadius: 'var(--radius-full)', background: 'var(--bg-glass)', backdropFilter: 'blur(20px)', border: '1px solid var(--border-primary)' }}
              />
            </div>
          </div>

          <div className="tf-hero-actions animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
            <button
              className="tf-btn tf-btn-primary tf-btn-lg"
              onClick={() => document.getElementById('events-section')?.scrollIntoView({ behavior: 'smooth' })}
            >
              Browse Events
            </button>
          </div>

          <div className="tf-hero-stats animate-fade-in-up" style={{ animationDelay: '0.5s' }}>
            {[
              { value: `${totalLiveEvents}+`, label: 'Events Live' },
              { value: `${(totalTicketsIssued / 1000).toFixed(1)}K+`, label: 'Tickets Sold' },
              { value: '99.9%', label: 'Scan Success' },
              { value: '150+', label: 'Organisers' },
            ].map((s, i) => (
              <div key={i} className="tf-hero-stat">
                <div className="tf-hero-stat-value">{s.value}</div>
                <div className="tf-hero-stat-label">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ NEXT EVENT COUNTDOWN ═══════════════ */}
      {nextEvent && !search && (
        <section className="tf-section" style={{ paddingTop: 0, marginTop: '-40px', position: 'relative', zIndex: 2 }}>
          <div
            className="glass-card animate-fade-in-up"
            onClick={() => router.push(`/events/${nextEvent.slug}`)}
            style={{ padding: '24px 32px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '20px' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
              <div style={{
                width: '56px', height: '56px', borderRadius: 'var(--radius-md)',
                background: `linear-gradient(135deg, ${nextEvent.theme_color || '#a855f7'}, ${nextEvent.theme_color || '#a855f7'}88)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}><Zap size={24} strokeWidth={2} style={{ color: '#fff' }} /></div>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 700, marginBottom: '4px' }}>
                  Next Up • Starts in
                </div>
                <CountdownTimer target={nextEvent.date} />
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap' }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '16px', fontWeight: 700, marginBottom: '2px' }}>{nextEvent.event_name}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}><MapPin size={12} style={{ verticalAlign: '-2px' }} /> {nextEvent.venue} • <CalendarDays size={12} style={{ verticalAlign: '-2px' }} /> {formatDate(nextEvent.date)}</div>
              </div>
              <button className="tf-btn tf-btn-primary" onClick={(e) => { e.stopPropagation(); router.push(`/events/${nextEvent.slug}`); }}>
                Get Tickets →
              </button>
            </div>
          </div>
        </section>
      )}

      {/* ═══════════════ CATEGORIES ═══════════════ */}
      <section className="tf-section" id="categories" style={{ paddingTop: '40px', paddingBottom: '40px' }}>
        <div className="tf-categories stagger-children">
          {CATEGORIES.map(cat => {
            const active = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className="tf-category animate-fade-in-up"
                style={active ? { borderColor: 'var(--accent-primary)', background: 'var(--bg-tertiary)', boxShadow: 'var(--shadow-glow)' } : {}}
              >
                <div className="tf-category-icon" style={active ? {} : { background: 'var(--bg-tertiary)' }}>
                  <cat.icon size={24} strokeWidth={1.9} style={{ color: active ? '#fff' : 'var(--accent-primary)' }} />
                </div>
                <span className="tf-category-name">{cat.label}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* ═══════════════ FEATURED EVENT ═══════════════ */}
      {featuredEvent && !search && activeCategory === 'all' && (
        <section className="tf-section" style={{ paddingTop: '20px' }}>
          <div className="tf-section-header">
            <span className="tf-section-badge"><Star size={12} strokeWidth={2.5} style={{ verticalAlign: '-2px', marginRight: '5px' }} />Featured</span>
            <h2 className="tf-section-title">Highlighted Event</h2>
          </div>

          <div
            className="glass-card animate-fade-in-up"
            onClick={() => router.push(`/events/${featuredEvent.slug}`)}
            style={{ overflow: 'hidden', cursor: 'pointer', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))' }}
          >
            <div style={{ position: 'relative', minHeight: '360px' }}>
              <img
                src={featuredEvent.cover_image || featuredEvent.poster_image}
                alt={featuredEvent.event_name}
                style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', inset: 0 }}
              />
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, rgba(0,0,0,0.8) 0%, transparent 100%)' }} />
              <div style={{ position: 'absolute', top: '24px', left: '24px', display: 'flex', gap: '8px' }}>
                <Badge variant="danger"><Flame size={12} strokeWidth={2.5} style={{ verticalAlign: '-2px', marginRight: '5px' }} />FEATURED</Badge>
                <Badge variant="glass">{detectCategory(featuredEvent)}</Badge>
              </div>
            </div>

            <div style={{ padding: 'clamp(32px, 5vw, 56px)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
                <Badge variant="primary"><CalendarDays size={12} style={{ verticalAlign: '-2px', marginRight: '4px' }} />{formatDate(featuredEvent.date)}</Badge>
                <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}><MapPin size={12} style={{ verticalAlign: '-2px' }} /> {featuredEvent.venue}</span>
              </div>

              <h3 style={{ fontSize: 'clamp(24px, 4vw, 36px)', fontWeight: 800, marginBottom: '16px', lineHeight: 1.1, letterSpacing: '-0.02em' }}>
                {featuredEvent.event_name}
              </h3>

              <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: 1.7, marginBottom: '24px' }}>
                {featuredEvent.description}
              </p>

              <div style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600 }}><Ticket size={13} style={{ verticalAlign: '-2px', marginRight: '4px' }} />Tickets Selling Fast</span>
                  <span style={{ fontSize: '12px', fontWeight: 800, color: featuredEvent.theme_color }}>{percentSold(featuredEvent)}% Sold</span>
                </div>
                <Progress value={percentSold(featuredEvent)} color={featuredEvent.theme_color} />
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: '11px', color: 'var(--text-tertiary)' }}>
                  <span>{totalSold(featuredEvent)} sold</span>
                  <span>{totalTickets(featuredEvent) - totalSold(featuredEvent)} left</span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
                <button
                  className="tf-btn tf-btn-primary tf-btn-lg animate-pulse-glow"
                  onClick={(e) => { e.stopPropagation(); router.push(`/events/${featuredEvent.slug}`); }}
                >
                  Get Tickets Now
                </button>
                {minPrice(featuredEvent) !== null && (
                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 700 }}>From</div>
                    <div style={{ fontSize: '24px', fontWeight: 800, color: featuredEvent.theme_color }}>${minPrice(featuredEvent)}</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ═══════════════ EVENTS SECTION (Tabs) ═══════════════ */}
      <section className="tf-section" id="events-section">
        <div className="tf-section-header">
          <span className="tf-section-badge"><Sparkles size={12} strokeWidth={2.5} style={{ verticalAlign: '-2px', marginRight: '5px' }} />Discover</span>
          <h2 className="tf-section-title">
            {search || activeCategory !== 'all' ? 'Filtered Results' : 'Explore Events'}
          </h2>
          <p className="tf-section-subtitle">
            Find your next unforgettable experience
          </p>
        </div>

        {!search && activeCategory === 'all' && (
          <div className="tf-events-tabs">
            {['trending', 'upcoming', 'all'].map(tab => (
              <button
                key={tab}
                className={`tf-events-tab ${activeTab === tab ? 'active' : ''}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab === 'trending' ? (<><Flame size={14} style={{ verticalAlign: '-2px' }} /> Trending</>) : tab === 'upcoming' ? (<><Clock size={14} style={{ verticalAlign: '-2px' }} /> Upcoming</>) : (<><Tent size={14} style={{ verticalAlign: '-2px' }} /> All Events</>)}
              </button>
            ))}
          </div>
        )}

        {filtered.length === 0 ? (
          <div className="tf-empty-state">
            <div className="tf-empty-state-icon"><Ticket size={36} /></div>
            <h3 className="tf-empty-state-title">No events found</h3>
            <p className="tf-empty-state-desc">Try selecting a different category or adjusting your search.</p>
          </div>
        ) : (
          <div className="tf-events-grid stagger-children">
            {tabbedEvents.filter(ev => {
              const q = search.toLowerCase();
              const matchSearch = !q || ev.event_name?.toLowerCase().includes(q) || ev.venue?.toLowerCase().includes(q);
              const matchCat = isMatchCategory(ev, activeCategory);
              return matchSearch && matchCat;
            }).map(event => (
              <PremiumEventCard
                key={event.id}
                event={event}
                formatDate={formatDate}
                minPrice={minPrice}
                favourited={favourited[event.id]}
                onToggleFav={(e) => toggleFavourite(event.id, e)}
                onShare={(e) => handleShare(event.id, event.slug, e)}
                isCopied={copiedId === event.id}
                onClick={() => router.push(`/events/${event.slug}`)}
              />
            ))}
          </div>
        )}
      </section>

      {/* ═══════════════ STATS ═══════════════ */}
      <section className="tf-section">
        <div className="tf-section-header">
          <span className="tf-section-badge"><BarChart3 size={12} strokeWidth={2.5} style={{ verticalAlign: '-2px', marginRight: '5px' }} />Platform</span>
          <h2 className="tf-section-title">Trusted at Scale</h2>
        </div>
        <div className="tf-stats-grid stagger-children">
          {[
            { value: `${totalLiveEvents}+`, label: 'Events Live', icon: PartyPopper },
            { value: `${totalTicketsIssued}+`, label: 'Tickets Issued', icon: Ticket },
            { value: '99.9%', label: 'Scan Success', icon: CheckCircle2 },
            { value: '150+', label: 'Local Organisers', icon: Users },
          ].map((stat) => (
            <div key={stat.label} className="tf-stat-card animate-fade-in-up">
              <div style={{ marginBottom: '12px' }}><stat.icon size={30} strokeWidth={1.75} /></div>
              <div className="tf-stat-card-value">{stat.value}</div>
              <div className="tf-stat-card-label">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════════════ SPONSORS ═══════════════ */}
      <section className="tf-section">
        <div className="tf-section-header">
          <span className="tf-section-badge"><Award size={12} strokeWidth={2.5} style={{ verticalAlign: '-2px', marginRight: '5px' }} />Partners</span>
          <h2 className="tf-section-title">Official Sponsors</h2>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center' }} className="stagger-children">
          {SPONSORS.map((s) => (
            <div key={s.name} className="glass-card animate-fade-in-up" style={{ padding: '28px 24px', textAlign: 'center', position: 'relative', overflow: 'hidden', maxWidth: '420px', width: '100%' }}>
              <div style={{
                position: 'absolute', top: '-30px', right: '-30px',
                width: '100px', height: '100px', borderRadius: '50%',
                background: 'var(--accent-primary)', opacity: 0.12, filter: 'blur(40px)',
              }} />
              <div style={{
                width: '64px', height: '64px', borderRadius: 'var(--radius-lg)',
                background: 'var(--accent-muted)',
                border: '1px solid var(--border-accent)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 16px', position: 'relative', zIndex: 1,
              }}><s.icon size={28} strokeWidth={1.75} style={{ color: 'var(--accent-primary)' }} /></div>
              <h3 style={{ fontSize: '17px', fontWeight: 700, marginBottom: '4px', position: 'relative', zIndex: 1 }}>{s.name}</h3>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', position: 'relative', zIndex: 1 }}>{s.tagline}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════════════ TESTIMONIALS ═══════════════ */}
      <section className="tf-section">
        <div className="tf-section-header">
          <span className="tf-section-badge"><MessageSquare size={12} strokeWidth={2.5} style={{ verticalAlign: '-2px', marginRight: '5px' }} />Testimonials</span>
          <h2 className="tf-section-title">What Organisers Say</h2>
          <p className="tf-section-subtitle">Trusted by event professionals across Africa</p>
        </div>
        <div className="tf-testimonials stagger-children">
          {TESTIMONIALS.map((t) => (
            <div key={t.name} className="tf-testimonial animate-fade-in-up">
              <div className="tf-testimonial-stars">{'★'.repeat(t.rating)}</div>
              <p className="tf-testimonial-text">&ldquo;{t.quote}&rdquo;</p>
              <div className="tf-testimonial-author">
                <div className="tf-testimonial-avatar">{t.initials}</div>
                <div>
                  <div className="tf-testimonial-name">{t.name}</div>
                  <div className="tf-testimonial-role">{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════════════ FAQ ═══════════════ */}
      <section className="tf-section">
        <div className="tf-section-header">
          <span className="tf-section-badge"><HelpCircle size={12} strokeWidth={2.5} style={{ verticalAlign: '-2px', marginRight: '5px' }} />FAQ</span>
          <h2 className="tf-section-title">Frequently Asked Questions</h2>
        </div>
        <div className="tf-faq stagger-children">
          {FAQS.map((faq, i) => {
            const open = faqOpen[i];
            return (
              <div key={i} className={`tf-faq-item ${open ? 'active' : ''} animate-fade-in-up`}>
                <button className="tf-faq-question" onClick={() => setFaqOpen({ ...faqOpen, [i]: !open })}>
                  <span>{faq.q}</span>
                  <span className="tf-faq-icon">+</span>
                </button>
                <div className="tf-faq-answer">
                  <div className="tf-faq-answer-inner">{faq.a}</div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ═══════════════ NEWSLETTER ═══════════════ */}
      <section className="tf-newsletter">
        <div className="tf-newsletter-inner">
          <Badge variant="primary" style={{ marginBottom: '20px' }}><Mail size={13} strokeWidth={2.5} style={{ verticalAlign: '-2px', marginRight: '6px' }} />Stay in the Loop</Badge>
          <h2 style={{ fontSize: 'clamp(24px, 4vw, 36px)', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '12px' }}>
            Never Miss an Event
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '15px', maxWidth: '460px', margin: '0 auto', lineHeight: 1.7 }}>
            Subscribe for exclusive early-bird discounts, new event announcements, and insider updates.
          </p>
          {newsletterSubscribed ? (
            <div className="glass-card" style={{ maxWidth: '420px', margin: '24px auto 0', padding: '20px 24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Sparkles size={24} style={{ color: 'var(--accent-primary)' }} />
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontWeight: 700 }}>Subscribed!</div>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Check your inbox for a welcome offer.</div>
              </div>
            </div>
          ) : (
            <form onSubmit={(e) => { e.preventDefault(); if (newsletterEmail.trim()) setNewsletterSubscribed(true); }} className="tf-newsletter-form">
              <input
                type="email"
                required
                placeholder="you@email.com"
                className="tf-input"
                value={newsletterEmail}
                onChange={e => setNewsletterEmail(e.target.value)}
                style={{ flex: 1 }}
              />
              <button type="submit" className="tf-btn tf-btn-primary">Subscribe</button>
            </form>
          )}
        </div>
      </section>
    </div>
  );
}

/* ═══════════════ PREMIUM EVENT CARD ═══════════════ */
function PremiumEventCard({ event, formatDate, minPrice, favourited, onToggleFav, onShare, isCopied, onClick }) {
  const low = minPrice(event);
  const accent = event.theme_color || '#a855f7';
  const category = detectCategory(event);
  const [daysLeft, setDaysLeft] = useState(null);
  const [hoursLeft, setHoursLeft] = useState(null);

  useEffect(() => {
    const diff = new Date(event.date).getTime() - new Date().getTime();
    if (diff > 0) {
      setDaysLeft(Math.ceil(diff / (1000 * 60 * 60 * 24)));
      setHoursLeft(Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)));
    }
  }, [event.date]);

  const ps = percentSold(event);
  const remaining = totalTickets(event) - totalSold(event);

  return (
    <div className="tf-event-card animate-fade-in-up" onClick={onClick}>
      <div className="tf-event-card-poster">
        <img
          src={event.cover_image || event.poster_image || 'https://images.unsplash.com/photo-1540039155733-5bb30b4259d6?w=700&q=80'}
          alt={event.event_name}
          loading="lazy"
        />
        <div className="tf-event-card-overlay" />

        <div className="tf-event-card-badge">
          <Badge variant="glass">{category}</Badge>
          {allFree(event) && <Badge variant="success">FREE</Badge>}
          {ps >= 80 && <Badge variant="error"><Flame size={11} style={{ verticalAlign: '-2px', marginRight: '3px' }} />{ps}% Sold</Badge>}
          {event.status === 'sold_out' && <Badge variant="error">Sold Out</Badge>}
        </div>

        <div className="tf-event-card-actions">
          <button className={`tf-event-card-action-btn ${favourited ? 'active' : ''}`} onClick={onToggleFav} aria-label="Favourite">
            <Heart size={16} strokeWidth={2} fill={favourited ? 'currentColor' : 'none'} />
          </button>
          <button className="tf-event-card-action-btn" onClick={onShare} aria-label="Share">
            {isCopied ? <Check size={16} strokeWidth={2.5} /> : <Share2 size={16} strokeWidth={2} />}
          </button>
        </div>
      </div>

      <div className="tf-event-card-body">
        <div className="tf-event-card-date">
          <CalendarDays size={12} style={{ verticalAlign: '-2px', marginRight: '4px' }} />{formatDate(event.date)}
          {event.time && <span style={{ color: 'var(--text-tertiary)', marginLeft: '8px' }}><Clock size={12} style={{ verticalAlign: '-2px' }} /> {event.time}</span>}
        </div>

        <h3 className="tf-event-card-title">{event.event_name}</h3>

        <div className="tf-event-card-location"><MapPin size={12} style={{ verticalAlign: '-2px', marginRight: '4px' }} />{event.venue}</div>

        {/* Countdown */}
        {daysLeft !== null && daysLeft <= 30 && daysLeft > 0 && (
          <div className="tf-event-card-countdown">
            <div className="tf-countdown-item">
              <span className="tf-countdown-value">{daysLeft}</span>
              <span className="tf-countdown-label">Days</span>
            </div>
            <div className="tf-countdown-item">
              <span className="tf-countdown-value">{hoursLeft ?? '–'}</span>
              <span className="tf-countdown-label">Hrs</span>
            </div>
          </div>
        )}

        {/* Progress */}
        <div style={{ marginTop: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Tickets</span>
            <span style={{ fontSize: '11px', fontWeight: 700, color: accent }}>{ps}% Sold</span>
          </div>
          <Progress value={ps} color={accent} />
        </div>

        {/* Ticket Tiers */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '12px' }}>
          {(event.ticket_types || []).slice(0, 3).map((t, i) => {
            const isFree = Number(t.price) === 0;
            return (
              <span key={i} className="tf-badge" style={{
                background: isFree ? 'rgba(16,185,129,0.12)' : `${t.color || accent}15`,
                border: `1px solid ${isFree ? 'rgba(16,185,129,0.4)' : `${t.color || accent}30`}`,
                color: 'var(--text-secondary)',
                fontSize: '11px',
              }}>
                {t.name} <strong style={{ color: isFree ? '#059669' : (t.color || accent) }}>{isFree ? 'FREE' : `$${t.price}`}</strong>
              </span>
            );
          })}
        </div>

        <div className="tf-event-card-footer">
          <div className="tf-event-card-price">
            {allFree(event) ? (
              <span style={{ color: '#059669' }}>Free</span>
            ) : low !== null ? (
              low === 0 ? (
                <>Free <span>from</span></>
              ) : (
                <>${low} <span>from</span></>
              )
            ) : (
              <span>Free</span>
            )}
          </div>
          <div className={`tf-event-card-tickets ${remaining < 50 ? 'low' : ''}`}>
            {remaining > 0 ? `${remaining} left` : 'Sold Out'}
          </div>
        </div>
      </div>
    </div>
  );
}

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
        id, slug, event_name, date, time, venue, poster_image, cover_image, status, theme_color, description,
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
