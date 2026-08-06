import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';
import { Badge, Button, Progress, StepIndicator } from '../../components/ui';
import {
  CalendarDays, Clock, MapPin, MessageCircle, Link2, Ticket, Image, FileText,
  Hourglass, Crown, HelpCircle, ScrollText, Sparkles, Gift, CreditCard, Smartphone,
  CheckCircle2, Copy, Share2, AlertTriangle, Loader2, Flame, TrendingUp, Mail, Phone,
  Landmark, MessageCircleMore,
} from 'lucide-react';

const MOCK_GALLERY = [
  'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800&q=80',
  'https://images.unsplash.com/photo-1506157786151-b8491531f063?w=500&q=80',
  'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=500&q=80',
  'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=500&q=80'
];

const MOCK_FAQS = [
  { q: 'Is there parking at the venue?', a: 'Yes, secure parking is available on-site with 24/7 security patrol. VIP ticket holders have reserved parking close to the main gate entrance.' },
  { q: 'Can I get a refund if I cannot make it?', a: 'All sales are final. However, you can transfer your digital ticket to someone else by sharing the unique link or copying the pass token.' },
  { q: 'What security measures are in place?', a: 'We have professional security screening at all gates. No bags larger than A4 size, drugs, weapons, or outside alcohol are permitted.' }
];

const DEMO_EVENT = {
  id: 'demo',
  slug: 'harare-summer-fest',
  event_name: 'Harare Summer Music Festival',
  date: '2026-08-20',
  time: '6:00 PM – 11:00 PM',
  venue: 'Harare International Conference Centre',
  description: 'Experience the biggest summer music festival in Harare! Top Afrobeat, Amapiano, and Dancehall artists, local gourmet food stalls, and interactive visual projection booths. This is a premium night you cannot miss. Secure your tickets now to avoid disappointment.',
  poster_image: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=1200&q=80',
  theme_color: '#a855f7',
  capacity: 500,
  ticket_types: [
    { id: 't1', name: 'Early Bird', price: 10, quantity_available: 100, quantity_sold: 100, color: '#10b981' },
    { id: 't2', name: 'General Admission', price: 15, quantity_available: 300, quantity_sold: 180, color: '#a855f7' },
    { id: 't3', name: 'VIP Pass', price: 50, quantity_available: 50, quantity_sold: 45, color: '#f59e0b' },
  ],
};

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

function formatDate(d) {
  try {
    return new Date(d).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  } catch { return d; }
}

function formatDateShort(d) {
  try {
    return new Date(d).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  } catch { return d; }
}

function adjustColorBrightness(hex, percent) {
  let R = parseInt(hex.substring(1, 3), 16);
  let G = parseInt(hex.substring(3, 5), 16);
  let B = parseInt(hex.substring(5, 7), 16);
  R = parseInt(R * (100 + percent) / 100);
  G = parseInt(G * (100 + percent) / 100);
  B = parseInt(B * (100 + percent) / 100);
  R = (R < 255) ? R : 255;
  G = (G < 255) ? G : 255;
  B = (B < 255) ? B : 255;
  R = (R < 0) ? 0 : R;
  G = (G < 0) ? 0 : G;
  B = (B < 0) ? 0 : B;
  return `#${R.toString(16).padStart(2, '0')}${G.toString(16).padStart(2, '0')}${B.toString(16).padStart(2, '0')}`;
}

export default function EventPage({ event: serverEvent, recommended: serverRecommended }) {
  const router = useRouter();
  const event = serverEvent || DEMO_EVENT;
  const recommended = serverRecommended || [DEMO_EVENT];
  const accent = event.theme_color || '#a855f7';
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://tiketflow.vercel.app';

  const [step, setStep] = useState('select');
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [qty, setQty] = useState(1);
  const [promoCode, setPromoCode] = useState('');
  const [promoApplied, setPromoApplied] = useState(null);
  const [buyerForm, setBuyerForm] = useState({ name: '', email: '', phone: '' });
  const [attendeeList, setAttendeeList] = useState([]);
  const [payMethod, setPayMethod] = useState('stripe');
  const [simulatedCard, setSimulatedCard] = useState({ number: '', expiry: '', cvc: '' });
  const [simulatedEcocash, setSimulatedEcocash] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [orderId, setOrderId] = useState(null);
  const [tokens, setTokens] = useState([]);
  const [whatsappUrl, setWhatsappUrl] = useState(null);
  const [ecocashData, setEcocashData] = useState(null);
  const [ecocashCopied, setEcocashCopied] = useState(false);
  const [faqOpen, setFaqOpen] = useState({});
  const [copiedLink, setCopiedLink] = useState(false);
  const [liveViewers, setLiveViewers] = useState(5);
  const [shakeKey, setShakeKey] = useState(0);

  // A ticket is FREE when its price is $0 — the checkout skips payment entirely.
  // A fully-free event (all tiers $0) shows the 3-step flow from the start.
  const isFreeEvent = (event.ticket_types || []).length > 0 && (event.ticket_types || []).every(t => Number(t.price) === 0);
  const isFreeSelected = isFreeEvent || (!!selectedTicket && Number(selectedTicket.price) === 0);

  const discount = promoApplied ? promoApplied.discount_percent : 0;
  const baseTotal = selectedTicket ? selectedTicket.price * qty : 0;
  const discountAmt = Math.round(baseTotal * discount / 100 * 100) / 100;
  const serviceFee = Math.round(baseTotal * 0.05 * 100) / 100;
  const total = baseTotal - discountAmt + serviceFee;

  const adjustedAccent = adjustColorBrightness(accent, -15);
  const gradientAccent = `linear-gradient(135deg, ${accent} 0%, ${adjustedAccent} 100%)`;

  const category = detectCategory(event);
  const ps = percentSold(event);
  const totalAvail = totalTickets(event) - totalSold(event);
  const urgencyLabel = ps >= 80 ? 'Almost Sold Out!' : ps >= 60 ? 'Selling Fast!' : ps >= 30 ? 'Popular!' : 'On Sale Now';
  const UrgencyIcon = ps >= 80 ? Flame : ps >= 60 ? Clock : ps >= 30 ? TrendingUp : Ticket;

  useEffect(() => {
    const iv = setInterval(() => {
      setLiveViewers(prev => {
        const delta = Math.random() > 0.5 ? 1 : -1;
        const next = prev + delta;
        return next > 2 ? next : 3;
      });
    }, 4000);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    if (qty > 0) {
      setAttendeeList(prev => {
        const next = [...prev];
        while (next.length < qty) {
          next.push({ name: '', email: '' });
        }
        return next.slice(0, qty);
      });
    }
  }, [qty]);

  useEffect(() => {
    if (error) {
      setShakeKey(k => k + 1);
    }
  }, [error]);

  async function applyPromo() {
    if (!promoCode.trim()) return;
    setError('');
    try {
      const res = await fetch(`/api/promo/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: promoCode, eventId: event.id }),
      });
      const data = await res.json();
      if (data.valid) {
        setPromoApplied(data.promo);
      } else {
        setError('Invalid or expired promo code');
      }
    } catch {
      setError('Could not validate promo code');
    }
  }

  async function handlePurchase(e) {
    if (e) e.preventDefault();
    if (!selectedTicket) return;
    setLoading(true);
    setError('');

    // Free tickets go straight to reservation — no payment validation
    const method = isFreeSelected ? 'free' : payMethod;

    if (method === 'stripe') {
      if (!simulatedCard.number || simulatedCard.number.replace(/\s/g, '').length < 16) {
        setError('Please enter a valid 16-digit card number.');
        setLoading(false);
        return;
      }
    } else if (method === 'ecocash') {
      if (!simulatedEcocash || !simulatedEcocash.startsWith('07')) {
        setError('Please enter a valid EcoCash number starting with 07.');
        setLoading(false);
        return;
      }
    }

    try {
      const res = await fetch('/api/tickets/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: event.id,
          ticketTypeId: selectedTicket.id,
          quantity: qty,
          buyerName: buyerForm.name,
          buyerEmail: buyerForm.email,
          buyerPhone: buyerForm.phone,
          paymentMethod: method,
          promoCode: promoApplied?.code,
          attendees: attendeeList
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Purchase failed');
        setLoading(false);
        return;
      }
      if (method === 'stripe' && data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else if (method === 'ecocash') {
        setOrderId(data.orderId);
        setTokens(data.tokens || []);
        setEcocashData(data.ecocash || null);
        setWhatsappUrl(data.whatsappUrl || null);
        setStep('ecocash');
      } else {
        // Free reservations & bank transfers land directly on the confirmation step
        setOrderId(data.orderId);
        setTokens(data.tokens || []);
        setWhatsappUrl(data.whatsappUrl || null);
        setStep('confirm');
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
    }
    setLoading(false);
  }

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const shareText = encodeURIComponent(`Check out ${event.event_name} on TicketFlow! ${formatDateShort(event.date)} at ${event.venue}`);
  // Guard for SSR — window is undefined on the server
  const shareUrl = typeof window !== 'undefined' ? encodeURIComponent(window.location.href) : '';
  const whatsappShare = `https://wa.me/?text=${shareText}%20${shareUrl}`;
  const twitterShare = `https://twitter.com/intent/tweet?text=${shareText}&url=${shareUrl}`;

  // Free tickets skip the payment step: Tickets → Details → Confirmed
  const steps = isFreeSelected
    ? [
        { label: 'Tickets', key: 'select' },
        { label: 'Details', key: 'details' },
        { label: 'Confirmed', key: 'confirm' },
      ]
    : [
        { label: 'Tickets', key: 'select' },
        { label: 'Details', key: 'details' },
        { label: 'Payment', key: 'payment' },
        { label: 'Confirmed', key: 'confirm' },
      ];
  // The EcoCash prompt is treated as part of the Payment step in the indicator
  const currentStepIdx = step === 'ecocash' ? 2 : steps.findIndex(s => s.key === step);

  return (
    <div style={{
      background: 'var(--bg)',
      color: 'var(--text)',
      minHeight: '100vh',
      '--accent': accent,
      '--accent-gradient': gradientAccent
    }}>
      {/* HERO BANNER - Large mesh-gradient */}
      <section className="mesh-gradient animate-gradient-bg" style={{
        minHeight: 'clamp(400px, 60vh, 600px)',
        backgroundImage: `url(${event.cover_image || event.poster_image})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Animated mesh overlay */}
        <div style={{
          position: 'absolute', inset: 0,
          background: `linear-gradient(180deg, rgba(0,0,0,0.2) 0%, ${accent}22 40%, rgba(0,0,0,0.95) 100%)`,
          backdropFilter: 'saturate(1.2)'
        }} />
        {event.theme_image && (
          <div style={{
            position: 'absolute', inset: 0,
            backgroundImage: `url(${event.theme_image})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            opacity: 0.35,
            mixBlendMode: 'screen',
            animation: 'ken-burns 30s ease-in-out infinite alternate',
            pointerEvents: 'none',
          }} />
        )}
        <div style={{
          position: 'absolute', top: '-20%', left: '-10%',
          width: '500px', height: '500px', borderRadius: '50%',
          background: `radial-gradient(circle, ${accent}55 0%, transparent 70%)`,
          filter: 'blur(100px)', animation: 'float-blob 20s ease-in-out infinite alternate',
          pointerEvents: 'none'
        }} />
        <div style={{
          position: 'absolute', bottom: '-20%', right: '-10%',
          width: '600px', height: '600px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(59,130,246,0.35) 0%, transparent 70%)',
          filter: 'blur(120px)', animation: 'float-blob 25s ease-in-out infinite alternate',
          animationDelay: '-8s', pointerEvents: 'none'
        }} />

        {/* Top glass badges — pushed below the fixed nav so they are never hidden behind it */}
        <div style={{
          position: 'absolute', top: 'clamp(96px, 12vh, 108px)', left: '24px', right: '24px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', zIndex: 5
        }} className="fade-in-up">
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <Badge variant="glass" style={{ backdropFilter: 'blur(14px)', padding: '6px 14px', fontSize: '11px' }}>
              {category}
            </Badge>
            <Badge variant="primary" style={{ backdropFilter: 'blur(14px)', padding: '6px 14px', fontSize: '11px' }}>
              <UrgencyIcon size={12} style={{ verticalAlign: '-2px', marginRight: '4px' }} />{urgencyLabel}
            </Badge>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }} className="pulse-ring">
            <div style={{
              width: '10px', height: '10px', borderRadius: '50%',
              background: '#ef4444',
              boxShadow: '0 0 10px rgba(239,68,68,0.8)',
              animation: 'pulse-ring 1.8s cubic-bezier(0.66, 0, 0, 1) infinite'
            }} />
            <Badge variant="glass" style={{ backdropFilter: 'blur(14px)', padding: '6px 14px', fontSize: '11px', color: '#fca5a5' }}>
              {liveViewers} watching
            </Badge>
          </div>
        </div>

        {/* Poster with gradient fade */}
        <div style={{
          position: 'absolute', right: 'clamp(20px, 5vw, 60px)', top: '50%',
          transform: 'translateY(-50%)',
          width: 'min(340px, 35vw)', aspectRatio: '3/4',
          borderRadius: '20px', overflow: 'hidden',
          boxShadow: `0 30px 80px -20px rgba(0,0,0,0.8), 0 0 60px ${accent}33`,
          border: `1px solid ${accent}44`,
          display: 'none',
          zIndex: 4
        }} className="fade-in-up" />

        {/* Bottom content */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          padding: 'clamp(64px, 9vw, 120px) clamp(20px, 4vw, 60px) clamp(72px, 8vw, 120px)',
          maxWidth: '1200px', margin: '0 auto', zIndex: 5
        }}>
          <div className="stagger-children" style={{ maxWidth: '780px' }}>
            <div className="fade-in-up" style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap' }}>
              <Badge variant="primary" style={{ padding: '6px 14px', fontSize: '11px' }}>
                <CalendarDays size={12} strokeWidth={2} style={{ verticalAlign: '-2px', marginRight: '5px' }} />{formatDate(event.date)}
              </Badge>
              {event.time && (
                <Badge variant="glass" style={{ padding: '6px 14px', fontSize: '11px' }}>
                  <Clock size={12} strokeWidth={2} style={{ verticalAlign: '-2px', marginRight: '5px' }} />{event.time}
                </Badge>
              )}
              <Badge variant="glass" style={{ padding: '6px 14px', fontSize: '11px' }}>
                <MapPin size={12} strokeWidth={2} style={{ verticalAlign: '-2px', marginRight: '5px' }} />{event.venue}
              </Badge>
            </div>
            <h1 className="fade-in-up" style={{
              fontSize: 'clamp(32px, 6vw, 60px)',
              fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.05,
              marginBottom: '18px', fontFamily: 'var(--font-display)',
              textShadow: `0 4px 40px ${accent}44`
            }}>
              {event.event_name}
            </h1>
            <div className="fade-in-up" style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
              {/* Social share block */}
              <div style={{ display: 'flex', gap: '8px' }}>
                <a href={whatsappShare} target="_blank" rel="noopener noreferrer"
                   onClick={(e) => e.stopPropagation()}
                   style={{
                     background: '#25D366', color: '#fff', padding: '10px 18px', borderRadius: '12px',
                     fontSize: '13px', fontWeight: 600, textDecoration: 'none',
                     display: 'inline-flex', alignItems: 'center', gap: '6px',
                     border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer',
                     transition: 'all 0.2s'
                   }}
                   onMouseEnter={e => { e.currentTarget.style.filter = 'brightness(1.1)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                   onMouseLeave={e => { e.currentTarget.style.filter = 'none'; e.currentTarget.style.transform = 'none'; }}
                >
                  <MessageCircle size={15} strokeWidth={2} /> WhatsApp
                </a>
                <a href={twitterShare} target="_blank" rel="noopener noreferrer"
                   onClick={(e) => e.stopPropagation()}
                   style={{
                     background: '#000', color: '#fff', padding: '10px 18px', borderRadius: '12px',
                     fontSize: '13px', fontWeight: 600, textDecoration: 'none',
                     display: 'inline-flex', alignItems: 'center', gap: '6px',
                     border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer',
                     transition: 'all 0.2s'
                   }}
                   onMouseEnter={e => { e.currentTarget.style.background = '#222'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                   onMouseLeave={e => { e.currentTarget.style.background = '#000'; e.currentTarget.style.transform = 'none'; }}
                >
                  <Share2 size={14} strokeWidth={2} /> Post
                </a>
                <Button
                  className="premium-btn-secondary"
                  onClick={(e) => { e.stopPropagation(); handleShare(); }}
                  style={{ padding: '10px 18px', fontSize: '13px' }}
                >
                  {copiedLink ? <CheckCircle2 size={14} strokeWidth={2.5} /> : <Link2 size={14} strokeWidth={2} />} {copiedLink ? 'Copied!' : 'Copy'}
                </Button>
              </div>

              {/* Floating gradient CTA over image area */}
              <Button
                className="premium-btn-primary pulse-glow"
                style={{
                  padding: '14px 32px', fontSize: '15px',
                  background: gradientAccent
                }}
                onClick={() => {
                  const el = document.getElementById('checkout-card');
                  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }}
              >
                <Ticket size={17} strokeWidth={2.25} /> Get Tickets →
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Ticket Progress Bar - Urgency */}
      <section style={{
        maxWidth: '1200px', margin: '-40px auto 0', padding: '0 20px',
        position: 'relative', zIndex: 10
      }} className="fade-in-up">
        <div className="glass" style={{
          borderRadius: '20px', padding: '24px 28px',
          border: `1px solid ${accent}33`,
          boxShadow: `0 20px 60px -20px ${accent}44, var(--shadow-premium)`
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontWeight: 800, fontFamily: 'var(--font-display)', fontSize: '15px' }}>
                <Ticket size={15} strokeWidth={2} style={{ verticalAlign: '-3px', marginRight: '6px' }} />Ticket Sales Progress
              </span>
              <Badge variant={ps >= 80 ? 'danger' : ps >= 60 ? 'warning' : 'info'} style={{ fontSize: '10px', padding: '4px 10px' }}>
                <UrgencyIcon size={12} style={{ verticalAlign: '-2px', marginRight: '4px' }} />{urgencyLabel}
              </Badge>
            </div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: accent }}>
              {ps}% SOLD • {totalAvail} {totalAvail === 1 ? 'ticket' : 'tickets'} left
            </div>
          </div>
          <Progress value={ps} color={accent} />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '11px', color: 'var(--text-dimmed)' }}>
            <span>{totalSold(event)} tickets purchased</span>
            <span>{totalTickets(event)} total capacity</span>
          </div>
        </div>
      </section>

      {/* Main split grid */}
      <section style={{ maxWidth: '1200px', margin: '0 auto', padding: '50px 20px 80px' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '48px',
          alignItems: 'start'
        }}>
          {/* Left Column: Details */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '40px', gridColumn: 'span 2' }} className="stagger-children">

            {/* Gallery Section */}
            <div className="fade-in-up">
              <h3 style={{ fontSize: '16px', textTransform: 'uppercase', letterSpacing: '2px', color: 'var(--text-dimmed)', marginBottom: '18px', fontFamily: 'var(--font-display)', fontWeight: 800 }}>
                <Image size={16} strokeWidth={2} style={{ verticalAlign: '-3px', marginRight: '7px' }} />Event Gallery
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '10px', borderRadius: '16px', overflow: 'hidden' }}>
                <div style={{
                  backgroundImage: `url(${MOCK_GALLERY[0]})`,
                  backgroundSize: 'cover', backgroundPosition: 'center',
                  minHeight: '260px', position: 'relative', cursor: 'pointer',
                  borderRadius: '16px', overflow: 'hidden'
                }}>
                  <div style={{
                    position: 'absolute', inset: 0,
                    background: 'linear-gradient(180deg, transparent 50%, rgba(0,0,0,0.8) 100%)',
                    opacity: 0, transition: 'opacity 0.3s',
                    display: 'flex', alignItems: 'flex-end', padding: '20px'
                  }} className="glass" onMouseEnter={e => e.currentTarget.style.opacity = '1'} onMouseLeave={e => e.currentTarget.style.opacity = '0'}>
                    <Badge variant="glass">Main Stage</Badge>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateRows: '1fr 1fr', gap: '10px' }}>
                  {MOCK_GALLERY.slice(1, 3).map((img, i) => (
                    <div key={i} style={{
                      backgroundImage: `url(${img})`,
                      backgroundSize: 'cover', backgroundPosition: 'center',
                      position: 'relative', cursor: 'pointer',
                      borderRadius: '16px', overflow: 'hidden'
                    }}>
                      <div style={{
                        position: 'absolute', inset: 0,
                        background: 'linear-gradient(180deg, transparent 50%, rgba(0,0,0,0.8) 100%)',
                        opacity: 0, transition: 'opacity 0.3s',
                        display: 'flex', alignItems: 'flex-end', padding: '14px'
                      }} onMouseEnter={e => e.currentTarget.style.opacity = '1'} onMouseLeave={e => e.currentTarget.style.opacity = '0'}>
                        <Badge variant="glass" style={{ fontSize: '9px' }}>
                          {['Crowd', 'Artist'][i]}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="fade-in-up">
              <h3 style={{ fontSize: '16px', textTransform: 'uppercase', letterSpacing: '2px', color: 'var(--text-dimmed)', marginBottom: '16px', fontFamily: 'var(--font-display)', fontWeight: 800 }}>
                <FileText size={16} strokeWidth={2} style={{ verticalAlign: '-3px', marginRight: '7px' }} />About This Event
              </h3>
              <div className="glass-panel" style={{ padding: '28px', borderRadius: '18px' }}>
                <p style={{ color: 'var(--text-muted)', fontSize: '15px', lineHeight: 1.8, whiteSpace: 'pre-line' }}>
                  {event.description}
                </p>
              </div>
            </div>

            {/* Event Countdown */}
            <CountdownBox eventDate={event.date} accent={accent} />

            {/* Organizer Profile Card */}
            <div className="fade-in-up glass-panel card-lift" style={{ padding: '28px', display: 'flex', gap: '18px', alignItems: 'center', borderRadius: '18px' }}>
              <div style={{
                width: '64px', height: '64px', borderRadius: '18px',
                background: gradientAccent,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
                boxShadow: `0 10px 30px ${accent}33`
              }}>
                <Crown size={28} strokeWidth={2} style={{ color: '#fff' }} />
              </div>
              <div style={{ flex: 1 }}>
                <h4 style={{ fontSize: '17px', fontWeight: 700, marginBottom: '4px' }}>Organised by Harare Promoter Guild</h4>
                <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '10px' }}>Verified Elite Organiser • 24 Live Events</p>
                <a href="mailto:promoter@tiketflow.com" style={{ fontSize: '13px', color: accent, fontWeight: 600, textDecoration: 'none' }} className="hover-underline">
                  <Mail size={13} style={{ verticalAlign: '-2px', marginRight: '5px' }} />Contact Promoter
                </a>
              </div>
            </div>

            {/* Google Maps Mock Location Card */}
            <div className="fade-in-up">
              <h3 style={{ fontSize: '16px', textTransform: 'uppercase', letterSpacing: '2px', color: 'var(--text-dimmed)', marginBottom: '16px', fontFamily: 'var(--font-display)', fontWeight: 800 }}>
                <MapPin size={16} strokeWidth={2} style={{ verticalAlign: '-3px', marginRight: '7px' }} />Venue Location
              </h3>
              <div className="glass-panel" style={{ padding: '20px', borderRadius: '18px' }}>
                <div style={{
                  height: '200px', borderRadius: '14px',
                  background: '#0d1117', border: '1px solid var(--border)',
                  position: 'relative', overflow: 'hidden',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: '18px'
                }}>
                  <div style={{
                    position: 'absolute', width: '100%', height: '100%',
                    opacity: 0.12,
                    background: 'radial-gradient(circle, #fff 10%, transparent 11%) 0 0/18px 18px'
                  }} />
                  <div style={{
                    position: 'absolute', inset: '20%',
                    border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '50%'
                  }} />
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', zIndex: 1 }}>
                    <div className="pulse-ring" style={{
                      width: '18px', height: '18px', borderRadius: '50%',
                      background: accent, border: '3px solid #fff',
                      boxShadow: `0 0 15px ${accent}cc`,
                      animation: 'pulse-ring 1.8s cubic-bezier(0.66, 0, 0, 1) infinite'
                    }} />
                    <div style={{ fontSize: '14px', fontWeight: 700 }}>{event.venue}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '14px', marginBottom: '2px' }}>{event.venue}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Harare, Zimbabwe</div>
                  </div>
                  <Button
                    className="premium-btn-secondary"
                    onClick={() => navigator.clipboard.writeText(event.venue)}
                    style={{ padding: '10px 18px', fontSize: '12px' }}
                  >
                    <Copy size={13} strokeWidth={2} /> Copy Address
                  </Button>
                </div>
              </div>
            </div>

            {/* FAQ Accordions */}
            <div className="fade-in-up">
              <h3 style={{ fontSize: '16px', textTransform: 'uppercase', letterSpacing: '2px', color: 'var(--text-dimmed)', marginBottom: '16px', fontFamily: 'var(--font-display)', fontWeight: 800 }}>
                <HelpCircle size={16} strokeWidth={2} style={{ verticalAlign: '-3px', marginRight: '7px' }} />FAQs & Info
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {MOCK_FAQS.map((faq, idx) => {
                  const open = faqOpen[idx];
                  return (
                    <div key={idx} className="glass-panel card-lift" style={{ padding: 0, overflow: 'hidden', borderRadius: '14px' }}>
                      <button
                        onClick={() => setFaqOpen({ ...faqOpen, [idx]: !open })}
                        style={{
                          width: '100%', background: 'transparent', border: 'none', color: 'var(--text)',
                          padding: '20px 24px', display: 'flex', justifyContent: 'space-between',
                          alignItems: 'center', fontSize: '14px', fontWeight: 600, cursor: 'pointer', textAlign: 'left'
                        }}
                      >
                        <span>{faq.q}</span>
                        <span style={{
                          color: accent, fontSize: '18px',
                          transform: open ? 'rotate(45deg)' : 'none',
                          transition: 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                          width: '28px', height: '28px', borderRadius: '50%',
                          background: open ? `${accent}22` : 'transparent',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          flexShrink: 0, marginLeft: '12px'
                        }}>+</span>
                      </button>
                      {open && (
                        <div style={{
                          padding: '0 24px 20px', fontSize: '13px', color: 'var(--text-muted)',
                          lineHeight: 1.7, borderTop: '1px solid var(--border)',
                          paddingTop: '14px', animation: 'fade-in 0.2s ease both'
                        }}>
                          {faq.a}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Terms and Conditions */}
            <div className="fade-in-up">
              <h3 style={{ fontSize: '16px', textTransform: 'uppercase', letterSpacing: '2px', color: 'var(--text-dimmed)', marginBottom: '16px', fontFamily: 'var(--font-display)', fontWeight: 800 }}>
                <ScrollText size={16} strokeWidth={2} style={{ verticalAlign: '-3px', marginRight: '7px' }} />General Terms
              </h3>
              <div className="glass-panel" style={{ padding: '24px', fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.8, borderRadius: '16px' }}>
                <p>• Tickets purchased here are strictly non-refundable unless the event is cancelled.</p>
                <p style={{ marginTop: '6px' }}>• You must present a valid QR code on entry. Screenshots are not recommended due to scanning resolution limits.</p>
                <p style={{ marginTop: '6px' }}>• Right of admission reserved. Under 18s are not permitted in designated bar and VIP areas.</p>
              </div>
            </div>

            {/* Recommended Events */}
            {recommended.length > 0 && (
              <div className="fade-in-up">
                <h3 style={{ fontSize: '16px', textTransform: 'uppercase', letterSpacing: '2px', color: 'var(--text-dimmed)', marginBottom: '20px', fontFamily: 'var(--font-display)', fontWeight: 800 }}>
                  <Sparkles size={16} strokeWidth={2} style={{ verticalAlign: '-3px', marginRight: '7px' }} />Other Upcoming Events
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px' }} className="stagger-children">
                  {recommended.map(item => (
                    <div
                      key={item.id}
                      onClick={() => router.push(`/events/${item.slug}`)}
                      className="glass-panel glass card-lift fade-in-up"
                      style={{ cursor: 'pointer', overflow: 'hidden', borderRadius: '16px' }}
                    >
                      <div style={{ height: '140px', backgroundImage: `url(${item.poster_image})`, backgroundSize: 'cover', backgroundPosition: 'center', position: 'relative' }}>
                        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, transparent 50%, rgba(0,0,0,0.7) 100%)' }} />
                        <div style={{ position: 'absolute', bottom: '12px', left: '14px' }}>
                          <Badge variant="glass" style={{ fontSize: '10px', padding: '4px 10px' }}>
                            {detectCategory(item)}
                          </Badge>
                        </div>
                      </div>
                      <div style={{ padding: '18px' }}>
                        <h4 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '6px', fontFamily: 'var(--font-display)' }}>{item.event_name}</h4>
                        <p style={{ fontSize: '12px', color: (item.theme_color || accent), fontWeight: 600 }}><CalendarDays size={12} strokeWidth={2} style={{ verticalAlign: '-2px', marginRight: '4px' }} />{formatDateShort(item.date)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Sticky checkout card */}
          <div id="checkout-card" style={{ position: 'sticky', top: '90px' }}>
            <div
              key={shakeKey}
              className={`glass ${error ? 'animate-shake' : ''}`}
              style={{
                borderRadius: '24px',
                border: `1px solid ${accent}33`,
                padding: '28px',
                boxShadow: `0 30px 80px -30px ${accent}44, var(--shadow-premium)`
              }}
            >
              {/* Step indicator */}
              {step !== 'confirm' && (
                <div style={{ marginBottom: '28px' }}>
                  <StepIndicator steps={steps.map(s => s.label)} currentStep={currentStepIdx} />
                </div>
              )}

              {error && (
                <div style={{
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: '#fca5a5', padding: '14px', borderRadius: '12px',
                  fontSize: '13px', marginBottom: '20px',
                  display: 'flex', alignItems: 'flex-start', gap: '8px'
                }}>
                  <AlertTriangle size={18} style={{ flexShrink: 0 }} />
                  <span>{error}</span>
                </div>
              )}

              {/* STEP: SELECT */}
              {step === 'select' && (
                <div key="step-select" className="fade-in-up">
                  <h3 style={{ fontSize: '17px', fontWeight: 800, marginBottom: '18px', textTransform: 'uppercase', letterSpacing: '1px', fontFamily: 'var(--font-display)' }}>
                    Select Tickets
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
                    {event.ticket_types?.map(t => {
                      const rem = t.quantity_available - (t.quantity_sold || 0);
                      const soldOut = rem <= 0;
                      const sel = selectedTicket?.id === t.id;
                      const free = Number(t.price) === 0;
                      return (
                        <div
                          key={t.id}
                          onClick={() => !soldOut && setSelectedTicket(t)}
                          style={{
                            padding: '18px', borderRadius: '14px',
                            border: `2px solid ${sel ? t.color || accent : 'var(--panel-border)'}`,
                            background: sel ? `${(t.color || accent)}11` : 'var(--panel-bg)',
                            cursor: soldOut ? 'not-allowed' : 'pointer',
                            opacity: soldOut ? 0.4 : 1,
                            display: 'flex', justifyContent: 'space-between',
                            alignItems: 'center', transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                            position: 'relative', overflow: 'hidden'
                          }}
                          onMouseEnter={e => { if (!soldOut && !sel) e.currentTarget.style.borderColor = `${t.color || accent}55`; }}
                          onMouseLeave={e => { if (!soldOut && !sel) e.currentTarget.style.borderColor = 'var(--panel-border)'; }}
                        >
                          {sel && <div style={{
                            position: 'absolute', left: 0, top: 0, bottom: 0, width: '3px',
                            background: t.color || accent
                          }} />}
                          <div style={{ paddingLeft: sel ? '8px' : 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                              <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: t.color || accent, boxShadow: `0 0 8px ${t.color || accent}66` }} />
                              <span style={{ fontWeight: 700, fontSize: '15px' }}>{t.name}</span>
                            </div>
                            <span style={{ fontSize: '12px', color: soldOut ? '#ef4444' : 'var(--text-muted)' }}>
                              {soldOut
                                ? (free ? 'Fully Booked' : 'Sold Out')
                                : `${rem} ${rem === 1 ? 'ticket' : 'tickets'} left`}
                            </span>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            {free ? (
                              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                                <div style={{
                                  fontSize: '18px', fontWeight: 800, color: '#10b981',
                                  fontFamily: 'var(--font-display)',
                                  background: 'rgba(16,185,129,0.12)',
                                  padding: '4px 12px', borderRadius: '10px',
                                  border: '1px solid rgba(16,185,129,0.35)',
                                }}>FREE</div>
                                <div style={{ fontSize: '10px', color: '#10b981', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                  No payment
                                </div>
                              </div>
                            ) : (
                              <div style={{
                                fontSize: '22px', fontWeight: 800,
                                color: t.color || accent,
                                fontFamily: 'var(--font-display)',
                                background: `linear-gradient(135deg, ${t.color || accent}, ${adjustColorBrightness(t.color || accent, -20)})`,
                                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
                              }}>${t.price}</div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {selectedTicket && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }} className="stagger-children">
                      <div className="fade-in-up">
                        <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-dimmed)', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 700 }}>Quantity</label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', background: 'var(--input-bg)', padding: '10px', borderRadius: '14px', border: '1px solid var(--panel-border)' }}>
                          <button
                            onClick={() => qty > 1 && setQty(qty - 1)}
                            style={{
                              width: '40px', height: '40px', borderRadius: '12px',
                              border: '1px solid var(--panel-border)',
                              background: 'var(--panel-bg)', color: 'var(--text)',
                              cursor: 'pointer', fontSize: '18px', fontWeight: 700,
                              transition: 'all 0.2s'
                            }}
                            onMouseEnter={e => { e.currentTarget.style.borderColor = accent; e.currentTarget.style.color = accent; }}
                            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--panel-border)'; e.currentTarget.style.color = 'var(--text)'; }}
                          >
                            −
                          </button>
                          <span style={{ fontSize: '24px', fontWeight: 800, minWidth: '40px', textAlign: 'center', fontFamily: 'var(--font-display)' }}>{qty}</span>
                          <button
                            onClick={() => qty < 10 && setQty(qty + 1)}
                            style={{
                              width: '40px', height: '40px', borderRadius: '12px',
                              border: '1px solid var(--panel-border)',
                              background: 'var(--panel-bg)', color: 'var(--text)',
                              cursor: 'pointer', fontSize: '18px', fontWeight: 700,
                              transition: 'all 0.2s'
                            }}
                            onMouseEnter={e => { e.currentTarget.style.borderColor = accent; e.currentTarget.style.color = accent; }}
                            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--panel-border)'; e.currentTarget.style.color = 'var(--text)'; }}
                          >
                            +
                          </button>
                        </div>
                      </div>

                      {/* Promo input — paid tickets only */}
                      {!isFreeSelected && (
                        <div className="fade-in-up">
                          <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-dimmed)', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 700 }}>Promo Code</label>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <input
                              type="text"
                              placeholder="PROMO CODE"
                              value={promoCode}
                              onChange={e => setPromoCode(e.target.value.toUpperCase())}
                              className="premium-input"
                              style={{ padding: '12px 14px', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '1px' }}
                            />
                            <Button
                              onClick={applyPromo}
                              style={{
                                padding: '12px 20px', fontSize: '12px',
                                background: promoApplied ? 'linear-gradient(135deg, #10b981, #059669)' : 'var(--panel-bg)',
                                color: '#fff', border: '1px solid',
                                borderColor: promoApplied ? '#10b981' : 'var(--panel-border)',
                                borderRadius: '12px', fontWeight: 700, cursor: 'pointer'
                              }}
                            >
                              {promoApplied ? '✓ Applied' : 'Apply'}
                            </Button>
                          </div>
                        </div>
                      )}

                      {/* Invoice Summary — free events show a FREE block instead of pricing */}
                      {isFreeSelected ? (
                        <div className="fade-in-up" style={{
                          borderTop: '1px dashed var(--border)', paddingTop: '20px',
                          display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '14px'
                        }}>
                          <div style={{
                            display: 'flex', alignItems: 'center', gap: '10px',
                            padding: '14px', borderRadius: '12px',
                            background: 'rgba(16,185,129,0.08)',
                            border: '1px solid rgba(16,185,129,0.3)',
                          }}>
                            <Sparkles size={19} strokeWidth={2} style={{ color: '#10b981' }} />
                            <div>
                              <div style={{ fontWeight: 800, color: '#059669', fontSize: '15px' }}>FREE · No payment required</div>
                              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                                {qty} × {selectedTicket.name} — your tickets will be reserved instantly
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="fade-in-up" style={{
                          borderTop: '1px dashed var(--border)', paddingTop: '20px',
                          display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '14px'
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                            <span>{qty} × {selectedTicket.name}</span>
                            <span>${baseTotal.toFixed(2)}</span>
                          </div>
                          {discountAmt > 0 && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#10b981' }}>
                              <span>Promo Discount ({discount}%)</span>
                              <span>−${discountAmt.toFixed(2)}</span>
                            </div>
                          )}
                          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                            <span>Platform Fee (5%)</span>
                            <span>${serviceFee.toFixed(2)}</span>
                          </div>
                          <div style={{
                            display: 'flex', justifyContent: 'space-between',
                            fontSize: '20px', fontWeight: 800, color: 'var(--text)',
                            borderTop: '2px solid var(--border)',
                            paddingTop: '14px', marginTop: '4px',
                            fontFamily: 'var(--font-display)'
                          }}>
                            <span>Total</span>
                            <span style={{
                              background: gradientAccent,
                              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
                            }}>${total.toFixed(2)}</span>
                          </div>
                        </div>
                      )}

                      <Button
                        onClick={() => setStep('details')}
                        className="premium-btn-primary pulse-glow fade-in-up"
                        style={{ width: '100%', padding: '16px', fontSize: '15px', marginTop: '4px' }}
                      >
                        Continue →
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {/* STEP: DETAILS - Customer Info */}
              {step === 'details' && (
                <div key="step-details" className="fade-in-up" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <h3 style={{ fontSize: '17px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', fontFamily: 'var(--font-display)' }}>
                    Your Details
                  </h3>

                  <div>
                    <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-dimmed)', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 700 }}>Contact Info</label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <input
                        type="text" required placeholder="Full Name"
                        value={buyerForm.name}
                        onChange={e => setBuyerForm({ ...buyerForm, name: e.target.value })}
                        className="premium-input" style={{ padding: '12px 16px', fontSize: '14px', borderRadius: '12px' }}
                      />
                      <input
                        type="email" required placeholder="Email Address"
                        value={buyerForm.email}
                        onChange={e => setBuyerForm({ ...buyerForm, email: e.target.value })}
                        className="premium-input" style={{ padding: '12px 16px', fontSize: '14px', borderRadius: '12px' }}
                      />
                      <input
                        type="tel" required placeholder="Phone (+263...)"
                        value={buyerForm.phone}
                        onChange={e => setBuyerForm({ ...buyerForm, phone: e.target.value })}
                        className="premium-input" style={{ padding: '12px 16px', fontSize: '14px', borderRadius: '12px' }}
                      />
                    </div>
                  </div>

                  {qty > 1 && (
                    <div style={{ borderTop: '1px dashed var(--border)', paddingTop: '16px' }}>
                      <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-dimmed)', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 700 }}>Attendee Passes</label>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '200px', overflowY: 'auto' }} className="no-scrollbar">
                        {attendeeList.map((att, idx) => (
                          <div key={idx} className="glass" style={{ padding: '12px', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
                            <div style={{ fontSize: '11px', fontWeight: 700, color: accent, marginBottom: '8px' }}>Attendee #{idx + 1}</div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                              <input
                                type="text" required placeholder="Attendee Name"
                                value={att.name}
                                onChange={e => { const next = [...attendeeList]; next[idx].name = e.target.value; setAttendeeList(next); }}
                                className="premium-input" style={{ padding: '10px 12px', fontSize: '13px', borderRadius: '10px' }}
                              />
                              <input
                                type="email" placeholder="Email (Optional)"
                                value={att.email}
                                onChange={e => { const next = [...attendeeList]; next[idx].email = e.target.value; setAttendeeList(next); }}
                                className="premium-input" style={{ padding: '10px 12px', fontSize: '13px', borderRadius: '10px' }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Gift ticket toggle */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px', background: 'var(--panel-bg)', borderRadius: '12px', border: '1px solid var(--panel-border)' }}>
                    <Gift size={18} strokeWidth={2} style={{ color: 'var(--text-secondary)' }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '13px', fontWeight: 600 }}>Gift this ticket</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-dimmed)' }}>Send directly to someone special</div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '10px' }}>
                    <Button type="button" onClick={() => setStep('select')} className="premium-btn-secondary" style={{ flex: 1, padding: '14px', fontSize: '13px' }}>
                      ← Back
                    </Button>
                    <Button
                      onClick={() => {
                        if (!buyerForm.name || !buyerForm.email) {
                          setError('Please fill in your name and email');
                          return;
                        }
                        if (isFreeSelected) {
                          // Free events: reserve instantly, skip payment entirely
                          handlePurchase();
                        } else {
                          setStep('payment');
                        }
                      }}
                      disabled={loading}
                      className="premium-btn-primary"
                      style={{
                        flex: 2, padding: '14px', fontSize: '14px',
                        ...(isFreeSelected ? { background: 'linear-gradient(135deg, #10b981, #059669)' } : {}),
                      }}
                    >
                      {loading ? (<><Loader2 size={16} style={{ animation: 'spin-slow 0.8s linear infinite' }} /> Reserving...</>) : isFreeSelected ? (<><Ticket size={16} /> Reserve Free Tickets</>) : 'Continue to Payment →'}
                    </Button>
                  </div>
                </div>
              )}

              {/* STEP: PAYMENT */}
              {step === 'payment' && (
                <div key="step-payment" className="fade-in-up" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <h3 style={{ fontSize: '17px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', fontFamily: 'var(--font-display)' }}>
                    Payment
                  </h3>

                  <div>
                    <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-dimmed)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 700 }}>Payment Method</label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '14px' }}>
                      <button
                        type="button" onClick={() => setPayMethod('stripe')}
                        style={{
                          padding: '14px', borderRadius: '12px',
                          background: payMethod === 'stripe' ? `${accent}22` : 'var(--panel-bg)',
                          border: `2px solid ${payMethod === 'stripe' ? accent : 'var(--panel-border)'}`,
                          color: 'var(--text)', fontSize: '13px', fontWeight: 700, cursor: 'pointer',
                          transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
                        }}
                      ><CreditCard size={15} strokeWidth={2} /> Card</button>
                      <button
                        type="button" onClick={() => setPayMethod('ecocash')}
                        style={{
                          padding: '14px', borderRadius: '12px',
                          background: payMethod === 'ecocash' ? `${accent}22` : 'var(--panel-bg)',
                          border: `2px solid ${payMethod === 'ecocash' ? accent : 'var(--panel-border)'}`,
                          color: 'var(--text)', fontSize: '13px', fontWeight: 700, cursor: 'pointer',
                          transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
                        }}
                      ><Smartphone size={15} strokeWidth={2} /> EcoCash</button>
                      {(event.bank_name || event.bank_account_number) && (
                        <button
                          type="button" onClick={() => setPayMethod('bank_transfer')}
                          style={{
                            padding: '14px', borderRadius: '12px',
                            background: payMethod === 'bank_transfer' ? `${accent}22` : 'var(--panel-bg)',
                            border: `2px solid ${payMethod === 'bank_transfer' ? accent : 'var(--panel-border)'}`,
                            color: 'var(--text)', fontSize: '13px', fontWeight: 700, cursor: 'pointer',
                            transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                            gridColumn: (event.bank_name || event.bank_account_number) && !event.bank_name ? 'span 2' : undefined,
                          }}
                        ><Landmark size={15} strokeWidth={2} /> Bank Transfer</button>
                      )}
                    </div>

                    {payMethod === 'stripe' && (
                      <div className="glass" style={{ padding: '14px', borderRadius: '12px', border: '1px solid var(--glass-border)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <input type="text" required placeholder="Card Number (4000 1234 ...)" value={simulatedCard.number}
                          onChange={e => setSimulatedCard({ ...simulatedCard, number: e.target.value.replace(/[^0-9\s]/g, '') })}
                          className="premium-input" style={{ padding: '10px 14px', fontSize: '13px', borderRadius: '10px' }} />
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                          <input type="text" required placeholder="MM/YY" value={simulatedCard.expiry}
                            onChange={e => setSimulatedCard({ ...simulatedCard, expiry: e.target.value })}
                            className="premium-input" style={{ padding: '10px 14px', fontSize: '13px', borderRadius: '10px', textAlign: 'center' }} />
                          <input type="text" required placeholder="CVC" value={simulatedCard.cvc}
                            onChange={e => setSimulatedCard({ ...simulatedCard, cvc: e.target.value.slice(0, 4) })}
                            className="premium-input" style={{ padding: '10px 14px', fontSize: '13px', borderRadius: '10px', textAlign: 'center' }} />
                        </div>
                      </div>
                    )}

                    {payMethod === 'ecocash' && (
                      <div className="glass" style={{ padding: '14px', borderRadius: '12px', border: '1px solid rgba(16,185,129,0.25)', background: 'linear-gradient(160deg, rgba(16,185,129,0.06), rgba(6,182,212,0.04))' }}>
                        <input type="text" required placeholder="EcoCash Number (e.g. 077123456)" value={simulatedEcocash}
                          onChange={e => setSimulatedEcocash(e.target.value.replace(/[^0-9]/g, ''))}
                          className="premium-input" style={{ padding: '10px 14px', fontSize: '13px', borderRadius: '10px', textAlign: 'center' }} />
                        <div style={{ fontSize: '11px', color: 'var(--text-dimmed)', marginTop: '8px', textAlign: 'center' }}>
                          📲 After payment, your EcoCash prompt is sent to this number — enter your PIN to confirm.
                        </div>
                      </div>
                    )}

                    {payMethod === 'bank_transfer' && (
                      <div className="glass" style={{ padding: '18px', borderRadius: '12px', border: '1px solid rgba(99,102,241,0.25)', background: 'linear-gradient(160deg, rgba(99,102,241,0.06), rgba(59,130,246,0.04))' }}>
                        <div style={{ fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px', color: 'var(--text)' }}>
                          Transfer to this account
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
                            <span style={{ color: 'var(--text-dimmed)' }}>Bank</span>
                            <strong>{event.bank_name || '—'}</strong>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
                            <span style={{ color: 'var(--text-dimmed)' }}>Account Name</span>
                            <strong>{event.bank_account_name || '—'}</strong>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
                            <span style={{ color: 'var(--text-dimmed)' }}>Account Number</span>
                            <strong style={{ fontFamily: 'monospace' }}>{event.bank_account_number || '—'}</strong>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
                            <span style={{ color: 'var(--text-dimmed)' }}>Amount</span>
                            <strong style={{ color: accent }}>${total.toFixed(2)}</strong>
                          </div>
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-dimmed)', marginTop: '12px', lineHeight: 1.5 }}>
                          After transferring, confirm below and your tickets will be issued instantly. The organiser may verify the payment.
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Order Summary */}
                  <div style={{ borderTop: '2px solid var(--border)', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-dimmed)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 700, marginBottom: '4px' }}>Order Summary</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                      <span>{qty} × {selectedTicket?.name}</span><span>${baseTotal.toFixed(2)}</span>
                    </div>
                    {discountAmt > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: '#10b981' }}>
                        <span>Promo ({discount}%)</span><span>−${discountAmt.toFixed(2)}</span>
                      </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                      <span>Platform Fee</span><span>${serviceFee.toFixed(2)}</span>
                    </div>
                    <div style={{
                      display: 'flex', justifyContent: 'space-between',
                      fontSize: '20px', fontWeight: 800, fontFamily: 'var(--font-display)',
                      borderTop: '2px solid var(--border)', paddingTop: '14px', marginTop: '4px'
                    }}>
                      <span>Total</span>
                      <span style={{ background: gradientAccent, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>${total.toFixed(2)}</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '10px' }}>
                    <Button type="button" onClick={() => setStep('details')} className="premium-btn-secondary" style={{ flex: 1, padding: '14px', fontSize: '13px' }}>
                      ← Back
                    </Button>
                    <Button
                      onClick={(e) => handlePurchase(e)}
                      disabled={loading}
                      className="premium-btn-primary pulse-glow"
                      style={{ flex: 2, padding: '14px', fontSize: '14px', background: gradientAccent }}
                    >
                      {loading ? (<><Loader2 size={16} style={{ animation: 'spin-slow 0.8s linear infinite' }} /> Processing...</>) : payMethod === 'ecocash' ? `Pay $${total.toFixed(2)} with EcoCash` : payMethod === 'bank_transfer' ? 'I Have Transferred — Get Tickets' : `Pay $${total.toFixed(2)}`}
                    </Button>
                  </div>
                </div>
              )}

              {/* STEP: ECOCASH PAYMENT PROMPT */}
              {step === 'ecocash' && (
                <div key="step-ecocash" className="fade-in-up" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div style={{ textAlign: 'center', marginBottom: '4px' }}>
                    <div style={{
                      width: '72px', height: '72px', margin: '0 auto 16px', borderRadius: '22px',
                      background: 'linear-gradient(135deg, #059669, #10b981)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      boxShadow: '0 12px 40px -8px rgba(16,185,129,0.5)',
                    }}><Smartphone size={34} strokeWidth={1.9} style={{ color: '#fff' }} /></div>
                    <h3 style={{ fontSize: '22px', fontFamily: 'var(--font-display)', marginBottom: '6px', letterSpacing: '-0.02em' }}>
                      Complete your EcoCash Payment
                    </h3>
                    <p style={{ color: 'var(--text-muted)', fontSize: '13px', lineHeight: 1.6 }}>
                      A payment prompt will be sent to <strong style={{ color: 'var(--text)' }}>{simulatedEcocash}</strong>.
                    </p>
                  </div>

                  {ecocashData?.configured ? (
                    <>
                      {/* Shortcode display */}
                      <div className="glass" style={{
                        padding: '24px', borderRadius: '20px', textAlign: 'center',
                        border: '2px solid rgba(16,185,129,0.3)',
                        background: 'linear-gradient(160deg, rgba(16,185,129,0.08), rgba(6,182,212,0.06))',
                      }}>
                        <div style={{ fontSize: '10px', color: 'var(--text-dimmed)', textTransform: 'uppercase', letterSpacing: '1.5px', fontWeight: 700, marginBottom: '10px' }}>
                          Your Payment Shortcode
                        </div>
                        <div style={{
                          fontSize: 'clamp(20px, 4.5vw, 28px)',
                          fontWeight: 800,
                          fontFamily: 'var(--font-mono, monospace)',
                          color: '#059669',
                          letterSpacing: '1px',
                          padding: '12px',
                          borderRadius: '14px',
                          background: 'rgba(255,255,255,0.7)',
                          border: '1px dashed rgba(16,185,129,0.4)',
                          wordBreak: 'break-all',
                        }}>{ecocashData.shortcode}</div>

                        <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
                          <a
                            href={ecocashData.dialUrl}
                            className="premium-btn-primary"
                            style={{
                              flex: 1.4, padding: '14px', borderRadius: '14px',
                              background: 'linear-gradient(135deg, #059669, #10b981)',
                              color: '#fff', fontWeight: 800, fontSize: '14px',
                              textDecoration: 'none', textAlign: 'center',
                              boxShadow: '0 10px 30px -10px rgba(16,185,129,0.6)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                            }}
                          >
                            <Phone size={16} /> Tap to Dial
                          </a>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(ecocashData.shortcode);
                              setEcocashCopied(true);
                              setTimeout(() => setEcocashCopied(false), 2000);
                            }}
                            className="premium-btn-secondary"
                            style={{ flex: 1, padding: '14px', borderRadius: '14px', fontWeight: 700, fontSize: '13px' }}
                          >
                            {ecocashCopied ? <CheckCircle2 size={14} strokeWidth={2.5} /> : <Copy size={14} strokeWidth={2} />} {ecocashCopied ? 'Copied' : 'Copy'}
                          </button>
                        </div>
                        <p style={{ fontSize: '11px', color: 'var(--text-dimmed)', marginTop: '10px' }}>
                          On phones that support USSD dialing this opens your dialer — just press call and follow the prompts.
                        </p>
                      </div>

                      {/* Steps */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {[
                          ['1', 'Tap to dial the shortcode above'],
                          ['2', 'Enter your EcoCash PIN and confirm the payment on your handset'],
                          ['3', 'Return to TiketFlow — your QR ticket unlocks instantly'],
                        ].map(([n, t]) => (
                          <div key={n} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                            <div style={{
                              width: '28px', height: '28px', borderRadius: '50%', flexShrink: 0,
                              background: 'linear-gradient(135deg, #10b981, #06b6d4)',
                              color: '#fff', fontWeight: 800, fontSize: '13px',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>{n}</div>
                            <p style={{ color: 'var(--text-muted)', fontSize: '13px', lineHeight: 1.5, paddingTop: '5px' }}>{t}</p>
                          </div>
                        ))}
                      </div>

                      {/* Order reference */}
                      <div className="glass" style={{
                        padding: '14px 18px', borderRadius: '14px', display: 'flex',
                        justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', fontSize: '13px',
                      }}>
                        <div>
                          <div style={{ fontSize: '10px', color: 'var(--text-dimmed)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 700, marginBottom: '2px' }}>Amount to Pay</div>
                          <div style={{ fontWeight: 800, fontSize: '18px', fontFamily: 'var(--font-display)' }}>${ecocashData.amount}</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '10px', color: 'var(--text-dimmed)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 700, marginBottom: '2px' }}>Payment Reference</div>
                          <div style={{ fontFamily: 'monospace', fontWeight: 700, color: '#059669', fontSize: '13px' }}>{ecocashData.reference}</div>
                        </div>
                      </div>

                      <Button
                        onClick={() => setStep('confirm')}
                        className="premium-btn-primary pulse-glow"
                        style={{ width: '100%', padding: '15px', fontSize: '15px', background: 'linear-gradient(135deg, #059669, #10b981)', borderRadius: '14px' }}
                      >
                        <CheckCircle2 size={16} strokeWidth={2.5} /> I've Completed the Payment — Get My Tickets
                      </Button>
                    </>
                  ) : (
                    <div className="glass" style={{ padding: '24px', borderRadius: '18px', textAlign: 'center' }}>
                      <div style={{ marginBottom: '10px' }}><AlertTriangle size={40} strokeWidth={1.8} /></div>
                      <p style={{ color: 'var(--text-muted)', fontSize: '13px', lineHeight: 1.6 }}>
                        The organiser hasn't finished setting up EcoCash for this event,
                        so your order was not created. Please choose a different payment
                        method, or contact the organiser.
                      </p>
                      <Button
                        onClick={() => { setStep('payment'); setPayMethod('stripe'); }}
                        className="premium-btn-secondary"
                        style={{ marginTop: '16px', padding: '12px 24px' }}
                      >
                        <CreditCard size={14} strokeWidth={2} /> Pay by Card instead
                      </Button>
                    </div>
                  )}

                  <Button
                    type="button"
                    onClick={() => setStep('payment')}
                    className="premium-btn-secondary"
                    style={{ width: '100%', padding: '13px', fontSize: '13px' }}
                  >
                    ← Back to Payment
                  </Button>
                </div>
              )}

              {/* STEP: CONFIRM */}
              {step === 'confirm' && (
                <div key="step-confirm" className="fade-in-up" style={{ textAlign: 'center', padding: '16px 0', position: 'relative' }}>
                  {/* Confetti pieces */}
                  <ConfettiExplosion accent={accent} />

                  {/* Animated success circle + checkmark */}
                  <div style={{ position: 'relative', margin: '0 auto 24px', width: '88px', height: '88px' }}>
                    <div style={{
                      position: 'absolute', inset: 0, borderRadius: '50%',
                      background: `radial-gradient(circle, ${accent}44 0%, transparent 70%)`,
                      animation: 'pulse-glow-keyframes 2s infinite alternate'
                    }} />
                    <div style={{
                      width: '88px', height: '88px', borderRadius: '50%',
                      background: 'linear-gradient(135deg, #10b981, #059669)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      position: 'relative', zIndex: 1,
                      boxShadow: '0 10px 40px rgba(16,185,129,0.4)',
                      animation: 'modal-scale-up 0.5s cubic-bezier(0.16, 1, 0.3, 1) both'
                    }}>
                      <svg className="animate-checkmark" width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                    </div>
                  </div>

                  <h3 style={{ fontSize: '24px', fontFamily: 'var(--font-display)', marginBottom: '10px', letterSpacing: '-0.02em' }}>
                    {isFreeSelected ? 'Tickets Reserved!' : 'Booking Confirmed!'}
                  </h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '14px', lineHeight: 1.6, marginBottom: '24px' }}>
                    {isFreeSelected ? (
                      <>Your free tickets for <strong style={{ color: 'var(--text)' }}>{event.event_name}</strong> have been reserved. No payment required.</>
                    ) : (
                      <>Thank you! Your tickets for <strong style={{ color: 'var(--text)' }}>{event.event_name}</strong> are successfully issued.</>
                    )}
                  </p>

                  {isFreeSelected && (
                    <div style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                      padding: '12px 16px', borderRadius: '12px', marginBottom: '22px',
                      background: 'rgba(16,185,129,0.1)',
                      border: '1px solid rgba(16,185,129,0.35)',
                    }}>
                      <Sparkles size={17} strokeWidth={2} style={{ color: '#059669' }} />
                      <span style={{ fontSize: '13px', fontWeight: 700, color: '#059669' }}>
                        Free — No Payment Required · {qty} {qty === 1 ? 'ticket' : 'tickets'} reserved
                      </span>
                    </div>
                  )}

                  <div className="glass" style={{
                    padding: '18px', borderRadius: '14px',
                    border: `1px solid ${accent}33`, textAlign: 'left',
                    marginBottom: '22px', fontSize: '13px'
                  }}>
                    <div style={{ fontSize: '10px', color: 'var(--text-dimmed)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 700, marginBottom: '4px' }}>Sent To</div>
                    <div style={{ fontWeight: 700, fontSize: '14px', marginBottom: '4px' }}>{buyerForm.email}</div>
                    {buyerForm.phone && <div style={{ color: 'var(--text-muted)', fontSize: '12px' }}>{buyerForm.phone}</div>}
                    {orderId && (
                      <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px dashed var(--border)' }}>
                        <div style={{ fontSize: '10px', color: 'var(--text-dimmed)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 700, marginBottom: '4px' }}>Order ID</div>
                        <div style={{ fontFamily: 'monospace', fontSize: '13px', color: accent, fontWeight: 600 }}>#{orderId}</div>
                      </div>
                    )}
                  </div>

                  {/* WhatsApp delivery — branded TiketFlow handoff */}
                  <div className="glass" style={{
                    padding: '18px', borderRadius: '14px', marginBottom: '14px',
                    border: '1px solid rgba(37,211,102,0.3)',
                    background: 'linear-gradient(160deg, rgba(37,211,102,0.08), rgba(37,211,102,0.03))',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                      <div style={{
                        width: '38px', height: '38px', borderRadius: '11px',
                        background: 'linear-gradient(135deg, #25D366, #128C7E)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                      }}><MessageCircleMore size={19} strokeWidth={2} style={{ color: '#fff' }} /></div>
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: 800 }}>Get it on WhatsApp</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                          Sent by TiketFlow · with your ticket link
                        </div>
                      </div>
                    </div>
                    <a
                      href={whatsappUrl || `https://wa.me/?text=${encodeURIComponent('My TiketFlow ticket is ready — view it here: ')}${tokens[0] ? '%20' + encodeURIComponent(`${siteUrl}/ticket/${tokens[0]}`) : ''}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="pulse-glow"
                      style={{
                        width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                        padding: '12px', borderRadius: '12px', marginTop: '6px',
                        background: 'linear-gradient(135deg, #25D366, #128C7E)',
                        color: '#fff', fontWeight: 800, fontSize: '13px', textDecoration: 'none',
                        fontFamily: 'var(--font-display)',
                      }}
                    >
                      <MessageCircleMore size={16} strokeWidth={2.25} /> Send my ticket to WhatsApp
                    </a>
                  </div>

                  {/* Generated Ticket Links */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '22px' }}>
                    {tokens.map((tok, i) => (
                      <Button
                        key={i}
                        onClick={() => router.push(`/ticket/${tok}`)}
                        className="pulse-glow"
                        style={{
                          width: '100%', fontSize: '14px', padding: '14px',
                          background: `linear-gradient(135deg, ${accent}, ${adjustedAccent})`,
                          color: '#fff', borderRadius: '14px', fontWeight: 700,
                          border: 'none', cursor: 'pointer',
                          fontFamily: 'var(--font-display)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                        }}
                      >
                        <Ticket size={16} strokeWidth={2.25} /> View Ticket {tokens.length > 1 ? `#${i + 1}` : ''} →
                      </Button>
                    ))}
                  </div>

                  <Button
                    onClick={() => router.push('/')}
                    className="premium-btn-secondary"
                    style={{ width: '100%', padding: '14px', fontSize: '14px' }}
                  >
                    Explore More Events
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function CountdownBox({ eventDate, accent }) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [hasStarted, setHasStarted] = useState(false);

  useEffect(() => {
    const target = new Date(eventDate).getTime();
    function update() {
      const now = new Date().getTime();
      const diff = target - now;
      if (diff <= 0) {
        setHasStarted(true);
      } else {
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        setTimeLeft({ days, hours, minutes, seconds });
      }
    }
    update();
    const iv = setInterval(update, 1000);
    return () => clearInterval(iv);
  }, [eventDate]);

  if (hasStarted) return null;

  return (
    <div className="fade-in-up">
      <h3 style={{ fontSize: '16px', textTransform: 'uppercase', letterSpacing: '2px', color: 'var(--text-dimmed)', marginBottom: '16px', fontFamily: 'var(--font-display)', fontWeight: 800 }}>
        <Hourglass size={16} strokeWidth={2} style={{ verticalAlign: '-3px', marginRight: '7px' }} />Doors Opening In
      </h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }} className="stagger-children">
        {[
          { v: timeLeft.days, l: 'Days' },
          { v: timeLeft.hours, l: 'Hours' },
          { v: timeLeft.minutes, l: 'Mins' },
          { v: timeLeft.seconds, l: 'Secs' }
        ].map((item, i) => (
          <div key={item.l} className="countdown-tile fade-in-up" style={{
            padding: '18px 12px', borderRadius: '14px', textAlign: 'center',
            border: `1px solid ${accent}22`
          }}>
            <div style={{
              fontSize: '32px', fontWeight: 800,
              fontFamily: 'var(--font-display)',
              background: `linear-gradient(135deg, ${accent}, ${adjustColorBrightness(accent, -20)})`,
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              lineHeight: 1, marginBottom: '4px'
            }}>{item.v.toString().padStart(2, '0')}</div>
            <div style={{ fontSize: '10px', color: 'var(--text-dimmed)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 700 }}>{item.l}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ConfettiExplosion({ accent }) {
  const colors = [accent, '#ec4899', '#3b82f6', '#10b981', '#fbbf24', '#f97316', '#a855f7'];
  const pieces = useMemo(() => {
    return [...Array(35)].map((_, i) => ({
      left: 5 + Math.random() * 90,
      delay: Math.random() * 0.8,
      duration: 1.8 + Math.random() * 1.5,
      size: 6 + Math.random() * 8,
      color: colors[Math.floor(Math.random() * colors.length)],
      rotate: Math.random() * 360,
      shape: Math.random() > 0.5 ? '50%' : '2px'
    }));
  }, [accent]);

  return (
    <div style={{ position: 'absolute', top: '-20px', left: 0, width: '100%', height: '100%', pointerEvents: 'none', overflow: 'hidden', zIndex: 5 }}>
      {pieces.map((p, i) => (
        <div
          key={i}
          className="confetti-piece"
          style={{
            left: `${p.left}%`,
            width: `${p.size}px`,
            height: `${p.size * 1.4}px`,
            background: p.color,
            borderRadius: p.shape,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            transform: `rotate(${p.rotate}deg)`,
            boxShadow: `0 0 6px ${p.color}66`
          }}
        />
      ))}
    </div>
  );
}

export async function getServerSideProps({ params }) {
  const { slug } = params;
  try {
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    );

    const { data: event } = await supabase
      .from('events')
      .select(`*, ticket_types (id, name, price, quantity_available, quantity_sold, color)`)
      .eq('slug', slug)
      .eq('status', 'published')
      .single();

    if (!event) return { props: { event: null, recommended: [] } };

    const { data: recommended } = await supabase
      .from('events')
      .select('id, slug, event_name, date, poster_image, theme_color')
      .eq('status', 'published')
      .neq('id', event.id)
      .limit(2);

    return { props: { event, recommended: recommended || [] } };
  } catch {
    return { props: { event: null, recommended: [] } };
  }
}

EventPage.getLayout = (page) => <Layout>{page}</Layout>;
