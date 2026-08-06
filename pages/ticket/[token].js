import { QRCodeSVG } from 'qrcode.react';
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import { buildTiketFlowWhatsAppMessage, buildWhatsAppHandoffUrl } from '../../lib/tickets';
import { Apple, Smartphone, MessageCircle, Mail, Link2, Printer, Check, ArrowLeft, TicketX, ImageIcon, Share2, Loader2 } from 'lucide-react';

export default function TicketPage({ ticket, event, ticketType, error: serverError }) {
  const router = useRouter();
  const [copied, setCopied] = useState(null);

  if (serverError || !ticket) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
        <div className="tf-empty-state">
          <div className="tf-empty-state-icon"><TicketX size={36} /></div>
          <h3 className="tf-empty-state-title">Ticket Not Found</h3>
          <p className="tf-empty-state-desc">This ticket may be invalid, cancelled, or the link may have expired.</p>
          <button className="tf-btn tf-btn-primary" style={{ marginTop: '24px' }} onClick={() => router.push('/')}>
            Back to Events
          </button>
        </div>
      </div>
    );
  }

  const accent = event?.theme_color || '#a855f7';
  const ticketColor = ticketType?.color || accent;
  const isFree = !!ticketType && Number(ticketType.price) === 0;
  // Hydration-safe origin: SSR and first client render stay identical (env
  // fallback), then the real origin is applied after mount so card/share links
  // work from any deployment (dev ports included).
  const [origin, setOrigin] = useState(null);
  useEffect(() => { setOrigin(window.location.origin); }, []);
  const siteUrl = origin || process.env.NEXT_PUBLIC_SITE_URL || 'https://tiketflow.vercel.app';
  const qrValue = `${siteUrl}/ticket/${ticket.qr_code_token}`;

  function formatDate(d) {
    try { return new Date(d).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }); }
    catch { return d; }
  }

  function formatDateShort(d) {
    try { return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); }
    catch { return d; }
  }

  const handleCopy = (text, label) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  const [cardBusy, setCardBusy] = useState(false);
  const cardUrl = `${siteUrl}/api/tickets/card/${ticket.qr_code_token}`;

  // Download the ticket card PNG so the buyer can attach it to WhatsApp manually.
  async function handleDownloadCard() {
    setCardBusy(true);
    try {
      const res = await fetch(cardUrl);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `TiketFlow-ticket-${ticket.qr_code_token.slice(0, 8)}.png`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    } catch { /* ignore */ }
    setCardBusy(false);
  }

  // Native share with the actual image file — on mobile this opens WhatsApp
  // with the ticket card attached.
  async function handleShareCard() {
    setCardBusy(true);
    try {
      const res = await fetch(cardUrl);
      const blob = await res.blob();
      const file = new File([blob], `TiketFlow-ticket-${ticket.qr_code_token.slice(0, 8)}.png`, { type: 'image/png' });
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: `TiketFlow Ticket — ${event?.event_name}`, text: 'My TiketFlow ticket card' });
      } else {
        // Desktop fallback — open WhatsApp with the branded message
        window.open(whatsappUrl, '_blank', 'noopener');
      }
    } catch { window.open(whatsappUrl, '_blank', 'noopener'); }
    setCardBusy(false);
  }

  const ticketUrl = `${siteUrl}/ticket/${ticket.qr_code_token}`;
  const shareText = encodeURIComponent(`I have a ticket for ${event?.event_name}! View it here:`);
  // WhatsApp handoff branded as TiketFlow, addressed to the buyer's own number
  const whatsappMessage = buildTiketFlowWhatsAppMessage({ ticket, event, ticketType });
  const whatsappUrl = buildWhatsAppHandoffUrl({ phone: ticket.buyer_phone, message: whatsappMessage });
  const emailSubject = encodeURIComponent(`My Ticket: ${event?.event_name}`);
  const emailBody = encodeURIComponent(`View my ticket at: ${ticketUrl}`);
  const emailUrl = `mailto:?subject=${emailSubject}&body=${emailBody}`;

  const isUsed = ticket.status === 'used';
  const isActive = ticket.status === 'active';

  // Generate barcode-like lines
  const barcodeLines = Array.from({ length: 40 }, (_, i) => {
    const hash = (ticket.qr_code_token.charCodeAt(i % ticket.qr_code_token.length) * (i + 1)) % 3;
    return hash === 0 ? 1 : hash === 1 ? 2 : 3;
  });

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 20px',
      position: 'relative',
    }}>
      {/* Background gradient */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: -1,
        background: `radial-gradient(ellipse 80% 60% at 50% 30%, ${ticketColor}15, transparent)`,
      }} />

      <div style={{ width: '100%', maxWidth: '420px' }}>
        {/* ═══════ TICKET CARD ═══════ */}
        <div className="tf-ticket animate-scale-in" style={{ borderColor: `${ticketColor}40`, boxShadow: `0 20px 60px -20px ${ticketColor}30, var(--shadow-xl)` }}>

          {/* Header with gradient */}
          <div className="tf-ticket-header" style={{ borderBottom: `1px solid ${ticketColor}20` }}>
            <div className="tf-ticket-brand">TiketFlow</div>
            <h2 className="tf-ticket-event">{event?.event_name}</h2>
            <div className="tf-ticket-type" style={{
              background: `${ticketColor}15`,
              borderColor: `${ticketColor}40`,
              color: ticketColor,
            }}>
              {ticketType?.name || 'General Admission'}
            </div>
            {isFree && (
              <div style={{
                display: 'inline-block', marginTop: '8px', padding: '5px 14px',
                borderRadius: '999px', fontSize: '11px', fontWeight: 800,
                letterSpacing: '1px', textTransform: 'uppercase',
                background: 'rgba(16,185,129,0.12)',
                border: '1px solid rgba(16,185,129,0.4)',
                color: '#059669',
              }}>FREE ADMISSION</div>
            )}
          </div>

          {/* Tear perforation */}
          <div className="tf-ticket-tear">
            <div className="tf-ticket-tear-line" />
          </div>

          {/* QR Code Section */}
          <div className="tf-ticket-body">
            <div className={`tf-ticket-qr ${isUsed ? 'used' : ''}`} style={{ boxShadow: isUsed ? 'none' : `0 0 30px ${ticketColor}20` }}>
              <QRCodeSVG
                value={qrValue}
                size={180}
                level="H"
                includeMargin={false}
                fgColor="#0a0a0a"
              />
              {isUsed && (
                <div className="tf-ticket-qr-overlay">
                  <span className="tf-ticket-qr-stamp">USED</span>
                </div>
              )}
            </div>

            <div className="tf-ticket-token">
              {ticket.qr_code_token.slice(0, 8).toUpperCase()}...{ticket.qr_code_token.slice(-4).toUpperCase()}
            </div>

            {/* Barcode */}
            <div className="tf-ticket-barcode">
              {barcodeLines.map((w, i) => (
                <div key={i} className="tf-ticket-barcode-line" style={{ flex: w }} />
              ))}
            </div>

            {/* Ticket Details */}
            <div className="tf-ticket-details">
              {[
                { label: 'Ticket Holder', value: ticket.buyer_name },
                { label: 'Date', value: formatDate(event?.date) },
                { label: 'Time', value: event?.time },
                { label: 'Venue', value: event?.venue },
                { label: 'Price', value: isFree ? 'Free' : ticketType?.price != null ? `$${ticketType.price}` : null, color: isFree ? 'var(--success)' : null },
                {
                  label: 'Status',
                  value: isUsed ? 'Checked In' : isActive ? 'Valid' : ticket.status,
                  color: isActive ? 'var(--success)' : isUsed ? 'var(--warning)' : 'var(--error)',
                },
              ].filter(r => r.value).map(row => (
                <div key={row.label} className="tf-ticket-row">
                  <span className="tf-ticket-row-label">{row.label}</span>
                  <span className="tf-ticket-row-value" style={row.color ? { color: row.color } : {}}>
                    {row.value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="tf-ticket-footer">
            Show this QR code at the gate
          </div>
        </div>

        {/* ═══════ WALLET & SHARE BUTTONS ═══════ */}
        <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '10px' }} className="stagger-children">

          {/* Wallet passes */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <button
              className="tf-wallet-card tf-wallet-apple animate-fade-in-up"
              onClick={() => alert('Apple Wallet integration requires native app support')}
            >
              <Apple size={19} strokeWidth={2} fill="currentColor" />
              Apple Wallet
            </button>
            <button
              className="tf-wallet-card tf-wallet-google animate-fade-in-up"
              style={{ animationDelay: '0.05s' }}
              onClick={() => alert('Google Wallet integration requires native app support')}
            >
              <Smartphone size={18} strokeWidth={2} />
              Google Wallet
            </button>
          </div>

          {/* Share buttons */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="tf-wallet-card tf-wallet-whatsapp animate-fade-in-up"
              style={{ animationDelay: '0.1s' }}
            >
              <MessageCircle size={17} strokeWidth={2} /> WhatsApp
            </a>
            <a
              href={emailUrl}
              className="tf-wallet-card tf-wallet-email animate-fade-in-up"
              style={{ animationDelay: '0.15s' }}
            >
              <Mail size={17} strokeWidth={2} /> Email
            </a>
          </div>

          {/* Ticket card share/download */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <button
              className="tf-wallet-card"
              style={{ background: 'var(--bg-glass-light)', border: '1px solid var(--border-primary)', justifyContent: 'center' }}
              onClick={handleShareCard}
              disabled={cardBusy}
            >
              {cardBusy ? <Loader2 size={16} style={{ animation: 'spin-slow 0.8s linear infinite' }} /> : <Share2 size={16} strokeWidth={2} />} Share Ticket Card
            </button>
            <button
              className="tf-wallet-card"
              style={{ background: 'var(--bg-glass-light)', border: '1px solid var(--border-primary)', justifyContent: 'center' }}
              onClick={handleDownloadCard}
              disabled={cardBusy}
            >
              {cardBusy ? <Loader2 size={16} style={{ animation: 'spin-slow 0.8s linear infinite' }} /> : <ImageIcon size={16} strokeWidth={2} />} Save Card
            </button>
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
            <button
              className="tf-btn tf-btn-secondary"
              style={{ flex: 1 }}
              onClick={() => handleCopy(ticketUrl, 'link')}
            >
              {copied === 'link' ? <Check size={14} strokeWidth={2.5} /> : <Link2 size={14} strokeWidth={2} />} {copied === 'link' ? 'Copied!' : 'Copy Link'}
            </button>
            <button
              className="tf-btn tf-btn-secondary"
              style={{ flex: 1 }}
              onClick={() => window.print()}
            >
              <Printer size={14} strokeWidth={2} /> Print
            </button>
          </div>

          <button
            className="tf-btn tf-btn-ghost"
            style={{ width: '100%', marginTop: '4px' }}
            onClick={() => router.push('/')}
          >
            <ArrowLeft size={14} strokeWidth={2} /> Back to Events
          </button>

          <button
            className="tf-btn tf-btn-ghost"
            style={{ width: '100%', color: 'var(--text-tertiary)', fontSize: '12px' }}
            onClick={() => router.push('/ticket/recover')}
          >
            Lost your ticket? Recover it here
          </button>
        </div>
      </div>
    </div>
  );
}

export async function getServerSideProps({ params }) {
  const { token } = params;
  try {
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    );
    const { data: ticket } = await supabase
      .from('tickets')
      .select('*')
      .eq('qr_code_token', token)
      .single();
    if (!ticket) return { props: { error: 'not_found' } };

    const [{ data: event }, { data: ticketType }] = await Promise.all([
      supabase.from('events').select('event_name, date, time, venue, theme_color').eq('id', ticket.event_id).single(),
      supabase.from('ticket_types').select('name, color, price').eq('id', ticket.ticket_type_id).single(),
    ]);
    return { props: { ticket, event: event || null, ticketType: ticketType || null } };
  } catch {
    return { props: { error: 'server_error' } };
  }
}

TicketPage.getLayout = (page) => <Layout title="Your Ticket">{page}</Layout>;
