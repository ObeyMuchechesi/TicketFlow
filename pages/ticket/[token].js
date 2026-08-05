import { QRCodeSVG } from 'qrcode.react';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';

export default function TicketPage({ ticket, event, ticketType, error: serverError }) {
  const router = useRouter();
  const { token } = router.query;

  if (serverError || !ticket) {
    return (
      <div style={{ minHeight: '100vh', background: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
        <div style={{ textAlign: 'center', maxWidth: '400px' }}>
          <div style={{ fontSize: '64px', marginBottom: '20px' }}>❌</div>
          <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: '28px', marginBottom: '12px' }}>Ticket Not Found</h2>
          <p style={{ color: 'rgba(255,255,255,0.4)', marginBottom: '28px' }}>This ticket may be invalid, cancelled, or the link may have expired.</p>
          <button onClick={() => router.push('/')} style={{ background: '#e94560', color: '#fff', border: 'none', padding: '14px 28px', borderRadius: '50px', fontWeight: 700, fontSize: '15px', cursor: 'pointer' }}>Back to Events</button>
        </div>
      </div>
    );
  }

  const accent = event?.theme_color || '#e94560';
  const ticketColor = ticketType?.color || accent;
  const qrValue = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://tiketflow.vercel.app'}/ticket/${ticket.qr_code_token}`;

  function formatDate(d) {
    try { return new Date(d).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }); }
    catch { return d; }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(160deg,#0a0a0a 0%,#1a1a2e 55%,#16213e 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div style={{ width: '100%', maxWidth: '400px' }}>
        {/* Ticket card */}
        <div style={{ background: 'rgba(255,255,255,0.05)', border: `1px solid ${ticketColor}40`, borderRadius: '24px', overflow: 'hidden', boxShadow: `0 0 60px ${ticketColor}20` }}>
          {/* Header */}
          <div style={{ background: `linear-gradient(135deg, ${ticketColor}22, ${ticketColor}08)`, borderBottom: `1px solid ${ticketColor}20`, padding: '28px 28px 20px', textAlign: 'center' }}>
            <div style={{ fontFamily: "'Playfair Display',serif", fontSize: '22px', fontWeight: 700, background: 'linear-gradient(120deg,#e94560,#d4a853)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: '4px' }}>TiketFlow</div>
            <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: 'clamp(18px,4vw,22px)', fontWeight: 700, lineHeight: 1.3 }}>{event?.event_name}</h2>
            <div style={{ marginTop: '10px', display: 'inline-block', background: `${ticketColor}20`, border: `1px solid ${ticketColor}60`, color: ticketColor, padding: '4px 16px', borderRadius: '50px', fontSize: '13px', fontWeight: 700 }}>
              {ticketType?.name || 'General Admission'}
            </div>
          </div>

          {/* QR Code */}
          <div style={{ padding: '28px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{
              background: '#fff',
              borderRadius: '16px',
              padding: '16px',
              marginBottom: '20px',
              boxShadow: ticket.status === 'used' ? 'none' : `0 0 30px ${ticketColor}30`,
              opacity: ticket.status === 'used' ? 0.4 : 1,
              position: 'relative',
            }}>
              <QRCodeSVG value={qrValue} size={200} level="H" includeMargin={false} fgColor="#0a0a0a" />
              {ticket.status === 'used' && (
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)', borderRadius: '16px' }}>
                  <span style={{ color: '#ef4444', fontWeight: 900, fontSize: '24px', border: '3px solid #ef4444', padding: '6px 12px', borderRadius: '8px', transform: 'rotate(-15deg)', letterSpacing: '2px' }}>USED</span>
                </div>
              )}
            </div>

            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '11px', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '24px' }}>
              {ticket.qr_code_token.slice(0, 8).toUpperCase()}...{ticket.qr_code_token.slice(-4).toUpperCase()}
            </p>

            {/* Details */}
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '12px', borderTop: '1px dashed rgba(255,255,255,0.1)', paddingTop: '20px' }}>
              {[
                { label: 'Ticket Holder', value: ticket.buyer_name },
                { label: 'Date', value: formatDate(event?.date) },
                { label: 'Time', value: event?.time },
                { label: 'Venue', value: event?.venue },
                { label: 'Status', value: ticket.status === 'used' ? '✓ Checked In' : ticket.status === 'active' ? '✅ Valid' : ticket.status, color: ticket.status === 'active' ? '#10b981' : ticket.status === 'used' ? '#f59e0b' : '#ef4444' },
              ].filter(r => r.value).map(row => (
                <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                  <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px', flexShrink: 0 }}>{row.label}</span>
                  <span style={{ fontSize: '14px', fontWeight: 500, textAlign: 'right', color: row.color || '#fff' }}>{row.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Footer strip */}
          <div style={{ background: `${ticketColor}15`, borderTop: `1px dashed ${ticketColor}30`, padding: '14px 28px', textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: '11px', letterSpacing: '1px' }}>
            SHOW THIS QR CODE AT THE GATE
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <button onClick={() => window.print()} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.5)', padding: '10px 24px', borderRadius: '50px', fontSize: '14px', cursor: 'pointer', marginRight: '10px' }}>🖨️ Print</button>
          <button onClick={() => router.push('/')} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.5)', padding: '10px 24px', borderRadius: '50px', fontSize: '14px', cursor: 'pointer' }}>← Home</button>
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
