import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';
import { Badge, Button, Skeleton } from '../components/ui';

const MOCK_TICKETS = [
  {
    id: '1', token: 'abc123def456', event_name: 'Harare Summer Music Festival',
    date: '2026-08-20', time: '6:00 PM', venue: 'Harare International Conference Centre',
    ticket_type: 'VIP Pass', price: 50, status: 'active',
    poster: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=400&q=80',
    theme_color: '#a855f7',
  },
  {
    id: '2', token: 'xyz789ghi012', event_name: 'Harare Comedy Unplugged',
    date: '2026-09-02', time: '7:30 PM', venue: 'Reps Theatre, Belgravia',
    ticket_type: 'General Show', price: 15, status: 'active',
    poster: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=400&q=80',
    theme_color: '#ec4899',
  },
  {
    id: '3', token: 'mno345pqr678', event_name: 'Royal Worship Night 2026',
    date: '2026-07-12', time: '5:00 PM', venue: 'Celebration Centre, Borrowdale',
    ticket_type: 'Standard Seat', price: 5, status: 'used',
    poster: 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=400&q=80',
    theme_color: '#3b82f6',
  },
];

const MOCK_HISTORY = [
  { id: 'ord-001', event: 'Harare Summer Music Festival', date: '2026-07-28', tickets: 2, total: 30.50, status: 'completed' },
  { id: 'ord-002', event: 'Royal Worship Night 2026', date: '2026-07-10', tickets: 1, total: 5.25, status: 'completed' },
  { id: 'ord-003', event: 'UZ Graduation 2026', date: '2026-06-15', tickets: 3, total: 21.00, status: 'refunded' },
];

const MOCK_NOTIFICATIONS = [
  { id: 1, type: 'info', title: 'Event Reminder', message: 'Harare Summer Music Festival is in 15 days!', time: '2 hours ago', read: false },
  { id: 2, type: 'success', title: 'Ticket Confirmed', message: 'Your VIP Pass has been confirmed.', time: '1 day ago', read: false },
  { id: 3, type: 'warning', title: 'Price Drop', message: 'Comedy Unplugged tickets are 20% off today!', time: '3 days ago', read: true },
];

function formatDate(d) {
  try { return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); }
  catch { return d; }
}

export default function Dashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('tickets');
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);
  const [copied, setCopied] = useState(null);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(t);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const handleCopy = (token) => {
    const url = `${window.location.origin}/ticket/${token}`;
    navigator.clipboard.writeText(url);
    setCopied(token);
    setTimeout(() => setCopied(null), 2000);
  };

  const tabs = [
    { id: 'tickets', label: 'My Tickets', icon: '🎟️' },
    { id: 'favourites', label: 'Favourites', icon: '❤️' },
    { id: 'history', label: 'Purchase History', icon: '📋' },
    { id: 'refunds', label: 'Refunds', icon: '💰' },
    { id: 'notifications', label: `Notifications${unreadCount > 0 ? ` (${unreadCount})` : ''}`, icon: '🔔' },
  ];

  return (
    <div style={{ minHeight: '100vh' }}>
      {/* Hero Header */}
      <section style={{
        padding: 'clamp(100px, 12vw, 140px) 20px 40px',
        textAlign: 'center',
        position: 'relative',
      }}>
        <div className="tf-bg-mesh" />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <Badge variant="primary" style={{ marginBottom: '16px' }}>👤 My Account</Badge>
          <h1 style={{
            fontSize: 'clamp(28px, 5vw, 42px)',
            fontWeight: 800,
            letterSpacing: '-0.03em',
            marginBottom: '8px',
          }}>
            Customer Dashboard
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', maxWidth: '500px', margin: '0 auto' }}>
            Manage your tickets, view history, and stay up to date with your events.
          </p>
        </div>
      </section>

      {/* Dashboard Content */}
      <section style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 20px 80px' }}>
        {/* Tab Navigation */}
        <div className="tf-dash-nav">
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`tf-dash-tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <Skeleton variant="card" count={3} />
          </div>
        ) : (
          <>
            {/* ═══ MY TICKETS ═══ */}
            {activeTab === 'tickets' && (
              <div className="tf-dash-grid stagger-children">
                {MOCK_TICKETS.map(ticket => (
                  <div key={ticket.id} className="tf-dash-ticket animate-fade-in-up">
                    <div
                      className="tf-dash-ticket-banner"
                      style={{ backgroundImage: `url(${ticket.poster})` }}
                    />
                    <div className="tf-dash-ticket-body">
                      <div className="tf-dash-ticket-event">{ticket.event_name}</div>
                      <div className="tf-dash-ticket-meta">
                        <span>📅 {formatDate(ticket.date)} • 🕐 {ticket.time}</span>
                        <span>📍 {ticket.venue}</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Badge variant={ticket.status === 'active' ? 'success' : 'warning'} style={{ fontSize: '10px' }}>
                            {ticket.status === 'active' ? '✅ Valid' : '✓ Used'}
                          </Badge>
                          <span style={{ color: 'var(--text-tertiary)' }}>{ticket.ticket_type} • ${ticket.price}</span>
                        </span>
                      </div>
                      <div className="tf-dash-ticket-actions">
                        <Button
                          size="sm"
                          variant="primary"
                          onClick={() => router.push(`/ticket/${ticket.token}`)}
                        >
                          View Ticket
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleCopy(ticket.token)}
                        >
                          {copied === ticket.token ? '✓ Copied' : '🔗 Share'}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => alert('Transfer feature coming soon!')}
                        >
                          ↗️ Transfer
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ═══ FAVOURITES ═══ */}
            {activeTab === 'favourites' && (
              <div className="tf-dash-grid stagger-children">
                {MOCK_TICKETS.slice(0, 2).map(ticket => (
                  <div key={ticket.id} className="tf-dash-ticket animate-fade-in-up" onClick={() => router.push(`/events/harare-summer-fest`)}>
                    <div className="tf-dash-ticket-banner" style={{ backgroundImage: `url(${ticket.poster})` }} />
                    <div className="tf-dash-ticket-body">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div className="tf-dash-ticket-event">{ticket.event_name}</div>
                        <span style={{ fontSize: '1.2rem' }}>❤️</span>
                      </div>
                      <div className="tf-dash-ticket-meta">
                        <span>📅 {formatDate(ticket.date)} • 📍 {ticket.venue}</span>
                        <span style={{ color: ticket.theme_color, fontWeight: 600 }}>From ${ticket.price}</span>
                      </div>
                      <Button size="sm" variant="primary" onClick={(e) => { e.stopPropagation(); router.push(`/events/harare-summer-fest`); }}>
                        Get Tickets
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ═══ PURCHASE HISTORY ═══ */}
            {activeTab === 'history' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }} className="stagger-children">
                {MOCK_HISTORY.map(order => (
                  <div key={order.id} className="glass-card animate-fade-in-up" style={{ padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                    <div>
                      <div style={{ fontWeight: 700, marginBottom: '4px' }}>{order.event}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        {formatDate(order.date)} • {order.tickets} ticket{order.tickets > 1 ? 's' : ''} • #{order.id}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>${order.total.toFixed(2)}</div>
                      <Badge variant={order.status === 'completed' ? 'success' : 'warning'}>
                        {order.status === 'completed' ? '✓ Completed' : '↩ Refunded'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ═══ REFUNDS ═══ */}
            {activeTab === 'refunds' && (
              <div className="tf-empty-state animate-fade-in-up">
                <div className="tf-empty-state-icon">💰</div>
                <h3 className="tf-empty-state-title">No Refund Requests</h3>
                <p className="tf-empty-state-desc">
                  If you need a refund for an event, you can request one from your purchase history.
                  Refunds are subject to the event organiser's policy.
                </p>
                <Button variant="secondary" style={{ marginTop: '24px' }} onClick={() => setActiveTab('history')}>
                  View Purchase History
                </Button>
              </div>
            )}

            {/* ═══ NOTIFICATIONS ═══ */}
            {activeTab === 'notifications' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }} className="stagger-children">
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '8px' }}>
                  <Button size="sm" variant="ghost" onClick={markAllRead}>
                    Mark all as read
                  </Button>
                </div>
                {notifications.map(notif => (
                  <div
                    key={notif.id}
                    className={`glass-card animate-fade-in-up ${!notif.read ? 'card-accent-border' : ''}`}
                    style={{
                      padding: '18px 24px',
                      display: 'flex',
                      gap: '14px',
                      alignItems: 'flex-start',
                      opacity: notif.read ? 0.7 : 1,
                    }}
                  >
                    <div style={{
                      width: '40px', height: '40px', borderRadius: 'var(--radius-md)',
                      background: notif.type === 'success' ? 'rgba(16,185,129,0.15)' : notif.type === 'warning' ? 'rgba(245,158,11,0.15)' : 'rgba(99,102,241,0.15)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '1.1rem', flexShrink: 0,
                    }}>
                      {notif.type === 'success' ? '✅' : notif.type === 'warning' ? '⚠️' : 'ℹ️'}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '2px' }}>{notif.title}</div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{notif.message}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '6px' }}>{notif.time}</div>
                    </div>
                    {!notif.read && (
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent-primary)', flexShrink: 0, marginTop: '6px' }} />
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}

Dashboard.getLayout = (page) => <Layout title="Dashboard">{page}</Layout>;
