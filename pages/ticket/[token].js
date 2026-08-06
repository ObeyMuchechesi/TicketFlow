import { QRCodeSVG } from 'qrcode.react';
import { useRouter } from 'next/router';
import { useState } from 'react';
import Layout from '../../components/Layout';

export default function TicketPage({ ticket, event, ticketType, error: serverError }) {
  const router = useRouter();
  const [copied, setCopied] = useState(null);

  if (serverError || !ticket) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
        <div className="tf-empty-state">
          <div className="tf-empty-state-icon">❌</div>
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
  const qrValue = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://tiketflow.vercel.app'}/ticket/${ticket.qr_code_token}`;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://tiketflow.vercel.app';

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

  const ticketUrl = `${siteUrl}/ticket/${ticket.qr_code_token}`;
  const shareText = encodeURIComponent(`I have a ticket for ${event?.event_name}! View it here:`);
  const whatsappUrl = `https://wa.me/?text=${shareText}%20${encodeURIComponent(ticketUrl)}`;
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
              }}>🎉 FREE ADMISSION</div>
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
                  value: isUsed ? '✓ Checked In' : isActive ? '✅ Valid' : ticket.status,
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
              <span style={{ fontSize: '1.2rem' }}></span>
              Apple Wallet
            </button>
            <button
              className="tf-wallet-card tf-wallet-google animate-fade-in-up"
              style={{ animationDelay: '0.05s' }}
              onClick={() => alert('Google Wallet integration requires native app support')}
            >
              <span style={{ fontSize: '1.2rem' }}>G</span>
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
              💬 WhatsApp
            </a>
            <a
              href={emailUrl}
              className="tf-wallet-card tf-wallet-email animate-fade-in-up"
              style={{ animationDelay: '0.15s' }}
            >
              ✉️ Email
            </a>
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
            <button
              className="tf-btn tf-btn-secondary"
              style={{ flex: 1 }}
              onClick={() => handleCopy(ticketUrl, 'link')}
            >
              {copied === 'link' ? '✓ Copied!' : '🔗 Copy Link'}
            </button>
            <button
              className="tf-btn tf-btn-secondary"
              style={{ flex: 1 }}
              onClick={() => window.print()}
            >
              🖨️ Print
            </button>
          </div>

          <button
            className="tf-btn tf-btn-ghost"
            style={{ width: '100%', marginTop: '4px' }}
            onClick={() => router.push('/')}
          >
            ← Back to Events
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
