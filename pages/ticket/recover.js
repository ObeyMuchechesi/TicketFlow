import { useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';
import { Badge, Button } from '../../components/ui';
import {
  Search, Mail, Phone, Ticket, TicketX, Loader2, CalendarDays, MapPin,
  ArrowLeft, CheckCircle2,
} from 'lucide-react';

export default function RecoverTicket() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [tickets, setTickets] = useState(null);
  const [searched, setSearched] = useState(false);

  async function handleRecover(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    setTickets(null);
    setSearched(true);
    try {
      const res = await fetch('/api/tickets/recover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, phone }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Could not look up your tickets');
      } else {
        setTickets(data.tickets || []);
      }
    } catch {
      setError('Could not look up your tickets. Please try again.');
    }
    setLoading(false);
  }

  function formatDate(d) {
    try {
      return new Date(d).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
    } catch { return d; }
  }

  return (
    <div style={{ minHeight: '100vh' }}>
      {/* Hero */}
      <section style={{
        padding: 'clamp(110px, 13vw, 150px) 20px 50px',
        textAlign: 'center',
        position: 'relative',
      }}>
        <div className="tf-bg-mesh" />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <Badge variant="primary" style={{ marginBottom: '16px' }}>
            <Ticket size={12} style={{ verticalAlign: '-2px', marginRight: '4px' }} />Ticket Recovery
          </Badge>
          <h1 style={{
            fontSize: 'clamp(28px, 5vw, 44px)',
            fontWeight: 800,
            letterSpacing: '-0.03em',
            marginBottom: '12px',
          }}>
            Lost Your Ticket?
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', maxWidth: '520px', margin: '0 auto', lineHeight: 1.7 }}>
            No problem. Enter the email or phone number you used when buying, and we'll
            instantly recover every ticket linked to your account.
          </p>
        </div>
      </section>

      {/* Search */}
      <section style={{ maxWidth: '620px', margin: '0 auto', padding: '0 20px 80px' }}>
        <div className="glass-card" style={{ padding: 'clamp(24px, 4vw, 36px)', borderRadius: '20px' }}>
          <form onSubmit={handleRecover} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="field-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 700 }}>
                <Mail size={14} /> Email used at checkout
              </label>
              <input
                type="email"
                className="tf-input"
                placeholder="you@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                style={{ width: '100%', padding: '13px 16px' }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
              <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 700 }}>or</span>
              <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
            </div>

            <div className="field-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 700 }}>
                <Phone size={14} /> Phone number used at checkout
              </label>
              <input
                type="tel"
                className="tf-input"
                placeholder="e.g. 0771234567"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                style={{ width: '100%', padding: '13px 16px' }}
              />
            </div>

            {error && (
              <div style={{
                padding: '12px 16px',
                borderRadius: '12px',
                background: 'rgba(239,68,68,0.08)',
                border: '1px solid rgba(239,68,68,0.2)',
                color: '#fca5a5',
                fontSize: '13px',
                fontWeight: 500,
              }}>{error}</div>
            )}

            <Button type="submit" variant="primary" fullWidth size="lg" loading={loading}>
              {loading ? (<><Loader2 size={16} style={{ animation: 'spin-slow 0.8s linear infinite' }} /> Searching...</>) : (<><Search size={16} /> Find My Tickets</>)}
            </Button>
          </form>
        </div>

        {/* Results */}
        {searched && !loading && tickets !== null && (
          <div style={{ marginTop: '28px' }} className="fade-in-up">
            {tickets.length === 0 ? (
              <div className="tf-empty-state" style={{ padding: '48px 24px' }}>
                <div className="tf-empty-state-icon"><TicketX size={36} /></div>
                <h3 className="tf-empty-state-title">No Tickets Found</h3>
                <p className="tf-empty-state-desc">
                  We couldn't find any tickets with that email or phone. Double-check the
                  details you entered, or contact support at support@tiketflow.com.
                </p>
                <a href="mailto:support@tiketflow.com" className="tf-btn tf-btn-primary" style={{ marginTop: '20px', textDecoration: 'none' }}>
                  Contact Support
                </a>
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                  <CheckCircle2 size={18} style={{ color: '#10b981' }} />
                  <h3 style={{ fontSize: '17px', fontWeight: 800, margin: 0 }}>
                    Found {tickets.length} ticket{tickets.length > 1 ? 's' : ''}
                  </h3>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {tickets.map((t) => {
                    const accent = t.event?.theme_color || '#a855f7';
                    const isFree = !!t.ticket_type && Number(t.ticket_type.price) === 0;
                    return (
                      <div key={t.qr_code_token} className="glass-card" style={{ padding: '18px', borderRadius: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', flexWrap: 'wrap' }}>
                          <div style={{
                            width: '48px', height: '48px', borderRadius: '14px', flexShrink: 0,
                            background: `linear-gradient(135deg, ${accent}, ${accent}aa)`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}>
                            <Ticket size={22} strokeWidth={2} style={{ color: '#fff' }} />
                          </div>
                          <div style={{ flex: 1, minWidth: '200px' }}>
                            <div style={{ fontWeight: 800, fontSize: '15px', marginBottom: '4px' }}>
                              {t.event?.event_name || 'Event'}
                            </div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                              {t.event?.date && (
                                <span><CalendarDays size={12} style={{ verticalAlign: '-2px', marginRight: '4px' }} />{formatDate(t.event.date)}</span>
                              )}
                              {t.event?.venue && (
                                <span><MapPin size={12} style={{ verticalAlign: '-2px', marginRight: '4px' }} />{t.event.venue}</span>
                              )}
                            </div>
                            <div style={{ marginTop: '8px', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                              <Badge variant="glass">{t.ticket_type?.name || 'Ticket'}</Badge>
                              {isFree ? (
                                <Badge variant="success">FREE</Badge>
                              ) : (
                                <Badge variant="primary">${t.ticket_type?.price}</Badge>
                              )}
                              {t.status === 'active' ? (
                                <Badge variant="success">Valid</Badge>
                              ) : t.status === 'used' ? (
                                <Badge variant="warning">Used</Badge>
                              ) : (
                                <Badge variant="error">{t.status}</Badge>
                              )}
                            </div>
                          </div>
                          <Button
                            variant="primary"
                            onClick={() => router.push(`/ticket/${t.qr_code_token}`)}
                          >
                            View Ticket
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        )}

        <button
          className="tf-btn tf-btn-ghost"
          style={{ marginTop: '32px', width: '100%' }}
          onClick={() => router.push('/')}
        >
          <ArrowLeft size={14} strokeWidth={2} /> Back to Events
        </button>
      </section>
    </div>
  );
}

RecoverTicket.getLayout = (page) => (
  <Layout title="Recover Ticket" description="Retrieve your lost TiketFlow tickets by email or phone.">
    {page}
  </Layout>
);
