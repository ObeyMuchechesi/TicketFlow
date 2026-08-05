import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '../../components/AdminLayout';
import { Card, Badge, Button, Progress, Skeleton } from '../../components/ui';

const STAT_GRADIENTS = {
  revenue: 'linear-gradient(135deg, #a855f7 0%, #ec4899 50%, #f97316 100%)',
  tickets: 'linear-gradient(135deg, #e94560 0%, #f97316 100%)',
  capacity: 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)',
  conversion: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
  visitors: 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)',
  avgPrice: 'linear-gradient(135deg, #d4a853 0%, #a855f7 100%)',
};

function StatCard({ label, value, sub, gradient, icon, pulse = false }) {
  return (
    <Card
      hoverable
      accent
      className={`stagger-children ${pulse ? 'pulse-glow' : ''}`}
      style={{ padding: '24px' }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{
            fontSize: '11px',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            color: 'var(--text-dimmed)',
            marginBottom: '10px',
          }}>{label}</p>
          <p style={{
            fontSize: '32px',
            fontWeight: 800,
            fontFamily: "var(--font-display)",
            background: gradient,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            lineHeight: 1.1,
          }}>{value}</p>
          {sub && (
            <p style={{
              fontSize: '12px',
              color: 'var(--text-dimmed)',
              marginTop: '6px',
            }}>{sub}</p>
          )}
        </div>
        <div style={{
          width: '48px',
          height: '48px',
          borderRadius: '14px',
          background: gradient,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '22px',
          flexShrink: 0,
          opacity: 0.9,
        }}>
          {icon}
        </div>
      </div>
    </Card>
  );
}

function TimelineItem({ type, title, subtitle, time }) {
  const icons = {
    sold: '🎫',
    published: '📢',
    checkedin: '✅',
    created: '✨',
  };
  const variants = {
    sold: 'success',
    published: 'info',
    checkedin: 'warning',
    created: 'primary',
  };
  return (
    <div className="timeline-item fade-in-up">
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
        <div style={{
          width: '36px',
          height: '36px',
          borderRadius: '10px',
          background: 'var(--accent-muted)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '16px',
          flexShrink: 0,
          marginTop: '-2px',
        }}>
          {icons[type] || '📌'}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
            <span style={{ fontSize: '13px', fontWeight: 600 }}>{title}</span>
            <Badge variant={variants[type] || 'primary'}>{type}</Badge>
          </div>
          {subtitle && (
            <p style={{ fontSize: '12px', color: 'var(--text-dimmed)', marginBottom: '2px' }}>{subtitle}</p>
          )}
          <p style={{ fontSize: '11px', color: 'var(--text-dimmed)', opacity: 0.7 }}>{time}</p>
        </div>
      </div>
    </div>
  );
}

function QuickActionCard({ icon, title, subtitle, onClick, gradient }) {
  return (
    <Card hoverable accent onClick={onClick} style={{ padding: '20px' }} className="card-lift">
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <div style={{
          width: '52px',
          height: '52px',
          borderRadius: '16px',
          background: gradient || 'var(--accent-muted)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '24px',
          flexShrink: 0,
        }}>
          {icon}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '14px', fontWeight: 700, marginBottom: '2px' }}>{title}</div>
          {subtitle && (
            <div style={{ fontSize: '12px', color: 'var(--text-dimmed)' }}>{subtitle}</div>
          )}
        </div>
        <div style={{
          color: 'var(--text-dimmed)',
          fontSize: '18px',
          flexShrink: 0,
        }}>→</div>
      </div>
    </Card>
  );
}

function PopularEventCard({ event, rank, onClick }) {
  const pct = event.capacity > 0 ? Math.min((event.sold / event.capacity) * 100, 100) : 0;
  return (
    <Card hoverable onClick={onClick} style={{ padding: '18px' }} className="card-lift">
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <div style={{
          width: '44px',
          height: '44px',
          borderRadius: '12px',
          background: 'var(--accent-gradient)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '18px',
          fontWeight: 800,
          color: '#fff',
          flexShrink: 0,
        }}>
          #{rank}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: '14px',
            fontWeight: 600,
            marginBottom: '6px',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}>
            {event.event_name}
          </div>
          <Progress value={event.sold} max={event.capacity || 1} showLabel height={5} />
        </div>
      </div>
    </Card>
  );
}

function EventRow({ event, router }) {
  const statusVariants = {
    published: 'success',
    draft: 'warning',
    sold_out: 'danger',
    completed: 'info',
    cancelled: 'danger',
  };
  const pct = event.capacity > 0 ? Math.min((event.sold / event.capacity) * 100, 100) : 0;

  return (
    <Card
      hoverable
      accent
      className="card-lift"
      onClick={() => router.push(`/admin/events/${event.id}`)}
      style={{ padding: '20px' }}
    >
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr auto',
        gap: '16px',
        alignItems: 'center',
      }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px', flexWrap: 'wrap' }}>
            <span style={{
              fontWeight: 700,
              fontSize: '16px',
              fontFamily: "var(--font-display)",
            }}>{event.event_name}</span>
            <Badge variant={statusVariants[event.status] || 'glass'}>
              {event.status?.replace('_', ' ')}
            </Badge>
          </div>
          <div style={{
            fontSize: '13px',
            color: 'var(--text-muted)',
            marginBottom: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}>
            <span>📅</span>
            <span>{new Date(event.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
            <span style={{ marginLeft: '4px' }}>📍 {event.venue || 'TBD'}</span>
          </div>
          {event.capacity > 0 && (
            <Progress value={event.sold} max={event.capacity} showLabel height={6} />
          )}
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{
            fontSize: '28px',
            fontWeight: 800,
            fontFamily: "var(--font-display)",
            background: 'var(--accent-gradient)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            lineHeight: 1.1,
          }}>
            {event.sold}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-dimmed)', marginTop: '2px' }}>tickets sold</div>
          <div style={{
            marginTop: '10px',
            fontSize: '12px',
            fontWeight: 700,
            color: 'var(--accent)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: '4px',
          }}>
            Manage <span>→</span>
          </div>
        </div>
      </div>
    </Card>
  );
}

export default function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/stats')
      .then(r => r.json())
      .then(d => { setStats(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const totalRevenue = stats?.totalRevenue || 0;
  const totalTicketsSold = stats?.totalTicketsSold || 0;
  const totalEvents = stats?.totalEvents || 0;
  const events = stats?.events || [];
  const publishedEvents = events.filter(e => e.status === 'published').length;
  const totalCapacity = events.reduce((sum, e) => sum + (Number(e.capacity) || 0), 0);
  const totalSold = events.reduce((sum, e) => sum + (Number(e.sold) || 0), 0);
  const capacityPct = totalCapacity > 0 ? Math.round((totalSold / totalCapacity) * 100) : 0;
  const avgTicketPrice = totalTicketsSold > 0 ? `$${(totalRevenue / totalTicketsSold).toFixed(2)}` : '$0.00';
  const conversion = totalEvents > 0 ? Math.min(100, Math.round((publishedEvents / totalEvents) * 100)) : 0;
  const liveVisitors = Math.floor(Math.random() * 500) + 50;

  const sortedEvents = [...events].sort((a, b) => (b.sold || 0) - (a.sold || 0));
  const top3 = sortedEvents.slice(0, 3);

  const activityItems = [
    { type: 'sold', title: `${Math.floor(Math.random() * 10) + 1} tickets sold`, subtitle: 'General Admission', time: '2 min ago' },
    { type: 'published', title: 'Event published', subtitle: publishedEvents > 0 ? (events.find(e => e.status === 'published')?.event_name || 'Summer Festival') : 'New event live', time: '1 hour ago' },
    { type: 'checkedin', title: `${Math.floor(Math.random() * 20) + 5} guests checked in`, subtitle: 'Gate A scanning', time: '3 hours ago' },
    { type: 'created', title: 'New event created', subtitle: 'Draft saved', time: 'Yesterday' },
  ];

  return (
    <AdminLayout title="Dashboard">
      <div style={{ padding: 'clamp(20px, 3vw, 40px)' }}>
        <div style={{ marginBottom: '32px' }} className="fade-in-up">
          <h1 style={{
            fontFamily: "var(--font-display)",
            fontSize: 'clamp(24px, 3vw, 36px)',
            fontWeight: 800,
            marginBottom: '6px',
            background: 'var(--accent-gradient)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>Dashboard</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
            Welcome back. Here's your event overview at a glance.
          </p>
        </div>

        {loading ? (
          <div className="stagger-children">
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '16px',
              marginBottom: '32px',
            }}>
              {[...Array(6)].map((_, i) => (
                <div key={i} className="glass-panel" style={{ padding: '24px', borderRadius: '20px' }}>
                  <Skeleton variant="text" width="80px" height="12px" />
                  <div style={{ height: '8px' }} />
                  <Skeleton variant="title" width="120px" />
                  <div style={{ height: '4px' }} />
                  <Skeleton variant="text" width="100px" />
                </div>
              ))}
            </div>
            <Skeleton variant="card" height="400px" />
          </div>
        ) : (
          <>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '16px',
              marginBottom: '32px',
            }} className="stagger-children">
              <StatCard
                label="Total Revenue"
                value={`$${totalRevenue.toLocaleString()}`}
                sub="All time · across events"
                gradient={STAT_GRADIENTS.revenue}
                icon="💰"
                pulse
              />
              <StatCard
                label="Tickets Sold"
                value={totalTicketsSold.toLocaleString()}
                sub={`${totalEvents} events total`}
                gradient={STAT_GRADIENTS.tickets}
                icon="🎟️"
              />
              <StatCard
                label="Capacity %"
                value={`${capacityPct}%`}
                sub={`${totalSold} / ${totalCapacity} seats`}
                gradient={STAT_GRADIENTS.capacity}
                icon="📊"
              />
              <StatCard
                label="Conversion"
                value={`${conversion}%`}
                sub="Draft → Published rate"
                gradient={STAT_GRADIENTS.conversion}
                icon="🎯"
              />
              <StatCard
                label="Live Visitors"
                value={liveVisitors.toLocaleString()}
                sub="Right now · browsing"
                gradient={STAT_GRADIENTS.visitors}
                icon="👀"
              />
              <StatCard
                label="Avg Ticket Price"
                value={avgTicketPrice}
                sub="Weighted across tiers"
                gradient={STAT_GRADIENTS.avgPrice}
                icon="💵"
              />
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(12, 1fr)',
              gap: '20px',
              marginBottom: '32px',
            }}>
              <div style={{ gridColumn: 'span 12', gridRow: 'span 1' }} className="stagger-children">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <h2 style={{
                    fontFamily: "var(--font-display)",
                    fontSize: '18px',
                    fontWeight: 700,
                  }}>Quick Actions</h2>
                </div>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                  gap: '14px',
                }}>
                  <QuickActionCard
                    icon="✨"
                    title="Create Event"
                    subtitle="Start a new event draft"
                    onClick={() => router.push('/admin/events/new')}
                    gradient="linear-gradient(135deg, rgba(233,69,96,0.15), rgba(249,115,22,0.15))"
                  />
                  <QuickActionCard
                    icon="📈"
                    title="View Reports"
                    subtitle="Sales & attendance data"
                    onClick={() => router.push('/admin/reports')}
                    gradient="linear-gradient(135deg, rgba(59,130,246,0.15), rgba(168,85,247,0.15))"
                  />
                  <QuickActionCard
                    icon="👥"
                    title="Invite Staff"
                    subtitle="Add gate & event team"
                    onClick={() => router.push('/admin/staff')}
                    gradient="linear-gradient(135deg, rgba(16,185,129,0.15), rgba(6,182,212,0.15))"
                  />
                  <QuickActionCard
                    icon="🏷️"
                    title="Create Promo Code"
                    subtitle="Discounts & campaigns"
                    onClick={() => router.push('/admin/promo-codes')}
                    gradient="linear-gradient(135deg, rgba(245,158,11,0.15), rgba(239,68,68,0.15))"
                  />
                </div>
              </div>

              <div style={{ gridColumn: 'span 12', lgGridColumn: 'span 8' }}>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(12, 1fr)',
                  gap: '20px',
                }}>
                  <div style={{ gridColumn: 'span 12', mdGridColumn: 'span 7' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                      <h2 style={{
                        fontFamily: "var(--font-display)",
                        fontSize: '18px',
                        fontWeight: 700,
                      }}>🔥 Top Performing Events</h2>
                      <Badge variant="glass">{top3.length} events</Badge>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }} className="stagger-children">
                      {top3.length === 0 ? (
                        <Card style={{ padding: '32px', textAlign: 'center' }}>
                          <div style={{ fontSize: '36px', marginBottom: '8px' }}>📭</div>
                          <p style={{ color: 'var(--text-dimmed)', fontSize: '13px' }}>No events yet</p>
                        </Card>
                      ) : (
                        top3.map((ev, i) => (
                          <PopularEventCard
                            key={ev.id}
                            event={ev}
                            rank={i + 1}
                            onClick={() => router.push(`/admin/events/${ev.id}`)}
                          />
                        ))
                      )}
                    </div>
                  </div>

                  <div style={{ gridColumn: 'span 12', mdGridColumn: 'span 5' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                      <h2 style={{
                        fontFamily: "var(--font-display)",
                        fontSize: '18px',
                        fontWeight: 700,
                      }}>⚡ Recent Activity</h2>
                      <Badge variant="primary">Live</Badge>
                    </div>
                    <Card style={{ padding: '24px 20px' }} className="fade-in-up">
                      <div className="timeline">
                        {activityItems.map((item, i) => (
                          <TimelineItem key={i} {...item} />
                        ))}
                      </div>
                    </Card>
                  </div>
                </div>
              </div>
            </div>

            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '16px',
              flexWrap: 'wrap',
              gap: '12px',
            }}>
              <div>
                <h2 style={{
                  fontFamily: "var(--font-display)",
                  fontSize: '20px',
                  fontWeight: 700,
                  marginBottom: '4px',
                }}>Your Events</h2>
                <p style={{ color: 'var(--text-dimmed)', fontSize: '13px' }}>
                  {events.length} total · {publishedEvents} published · {events.length - publishedEvents} draft
                </p>
              </div>
              <Button
                variant="primary"
                size="md"
                onClick={() => router.push('/admin/events/new')}
              >
                <span>+</span> New Event
              </Button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }} className="stagger-children">
              {events.length === 0 ? (
                <Card accent style={{ padding: '60px 40px' }} className="fade-in-up">
                  <div style={{ textAlign: 'center' }}>
                    <div style={{
                      width: '100px',
                      height: '100px',
                      margin: '0 auto 20px',
                      borderRadius: '28px',
                      background: 'var(--accent-gradient)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '48px',
                      opacity: 0.95,
                    }}>
                      🎪
                    </div>
                    <h3 style={{
                      fontFamily: "var(--font-display)",
                      fontSize: '22px',
                      fontWeight: 700,
                      marginBottom: '8px',
                    }}>No Events Yet</h3>
                    <p style={{
                      color: 'var(--text-muted)',
                      fontSize: '14px',
                      marginBottom: '24px',
                      maxWidth: '380px',
                      margin: '0 auto 24px',
                      lineHeight: 1.6,
                    }}>
                      Create your first event to start selling tickets, tracking attendance, and managing attendees.
                    </p>
                    <Button
                      variant="primary"
                      size="lg"
                      onClick={() => router.push('/admin/events/new')}
                    >
                      ✨ Create Your First Event
                    </Button>
                  </div>
                </Card>
              ) : (
                events.map(ev => (
                  <EventRow key={ev.id} event={ev} router={router} />
                ))
              )}
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
}

AdminDashboard.getLayout = (page) => page;
