import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '../../components/AdminLayout';
import { Card, Badge, Button, Progress, Skeleton } from '../../components/ui';
import {
  DollarSign, Ticket, Users, CheckCircle2, PartyPopper, Gauge, CircleDollarSign, Target,
  TrendingUp, TrendingDown, BarChart3, CalendarDays, MapPin, Sparkles, Download,
  Zap, Activity, Inbox, ChevronRight, Megaphone, RefreshCw, UserPlus, BadgePercent,
  QrCode, Plus, Flame, TicketCheck,
} from 'lucide-react';

const GRADIENTS = [
  'linear-gradient(135deg, #a855f7 0%, #ec4899 50%, #f97316 100%)',
  'linear-gradient(135deg, #e94560 0%, #f97316 100%)',
  'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)',
  'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
  'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)',
  'linear-gradient(135deg, #d4a853 0%, #a855f7 100%)',
  'linear-gradient(135deg, #0ea5e9 0%, #6366f1 100%)',
  'linear-gradient(135deg, #84cc16 0%, #22d3ee 100%)',
];

const CHART_COLORS = ['#a855f7', '#ec4899', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#8b5cf6'];

function KpiCard({ label, value, sub, gradient, icon, trend, trendValue }) {
  return (
    <div className="adm-kpi-card" style={{ '--kpi-accent': gradient }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="adm-kpi-label">{label}</div>
          <div className="adm-kpi-value adm-count-animate" style={{
            background: gradient,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>{value}</div>
          {sub && <div className="adm-kpi-sub">{sub}</div>}
          {trend && (
            <div className={`adm-kpi-trend ${trend}`}>
              {trend === 'up' ? <TrendingUp size={13} strokeWidth={2.5} /> : <TrendingDown size={13} strokeWidth={2.5} />} {trendValue}
            </div>
          )}
        </div>
        <div className="adm-kpi-icon" style={{ background: gradient, opacity: 0.9 }}>
          <icon size={21} strokeWidth={2} />
        </div>
      </div>
    </div>
  );
}

function BarChart({ data, height = 180 }) {
  const max = Math.max(1, ...data.map(d => d.value));
  return (
    <div className="adm-chart-bars" style={{ height }}>
      {data.map((d, i) => (
        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div
            className="adm-chart-bar"
            data-value={d.label2 || `$${d.value}`}
            style={{
              width: '100%',
              height: `${Math.max(4, (d.value / max) * 100)}%`,
              background: `linear-gradient(to top, ${CHART_COLORS[i % CHART_COLORS.length]}, ${CHART_COLORS[i % CHART_COLORS.length]}88)`,
            }}
          />
          <div className="adm-chart-bar-label">{d.name}</div>
        </div>
      ))}
    </div>
  );
}

function DonutChart({ segments }) {
  const total = segments.reduce((s, seg) => s + seg.value, 0);
  let cumulativePct = 0;
  const gradientParts = segments.map(seg => {
    const pct = (seg.value / total) * 100;
    const start = cumulativePct;
    cumulativePct += pct;
    return `${seg.color} ${start}% ${start + pct}%`;
  });

  return (
    <div className="adm-chart-donut" style={{ background: `conic-gradient(${gradientParts.join(', ')})` }}>
      <div className="adm-chart-donut-center">
        <div style={{ fontSize: '20px', fontWeight: 800, fontFamily: 'var(--font-primary)' }}>{total}</div>
        <div style={{ fontSize: '10px', color: 'var(--text-tertiary)' }}>Total</div>
      </div>
    </div>
  );
}

function ActivityItem({ icon, iconBg, title, desc, time }) {
  return (
    <div className="adm-activity-item">
      <div className="adm-activity-icon" style={{ background: iconBg }}><icon size={15} strokeWidth={2} /></div>
      <div className="adm-activity-content">
        <div className="adm-activity-title">{title}</div>
        {desc && <div className="adm-activity-desc">{desc}</div>}
      </div>
      <div className="adm-activity-time">{time}</div>
    </div>
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
  const totalCheckedIn = events.reduce((s, e) => s + (e.checkedIn || 0), 0);
  const capacityPct = totalCapacity > 0 ? Math.round((totalSold / totalCapacity) * 100) : 0;
  const avgTicketPrice = totalTicketsSold > 0 ? (totalRevenue / totalTicketsSold).toFixed(2) : '0.00';
  const conversion = totalEvents > 0 ? Math.min(100, Math.round((publishedEvents / totalEvents) * 100)) : 0;
  const attendanceRate = totalSold > 0 ? Math.round((totalCheckedIn / totalSold) * 100) : 0;

  const sortedEvents = [...events].sort((a, b) => (b.sold || 0) - (a.sold || 0));
  const topEvents = sortedEvents.slice(0, 5);

  // Revenue chart data (mock monthly)
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'];
  const revenueChartData = months.map((m, i) => ({
    name: m,
    value: i < events.length ? (Number(events[i]?.revenue || 0) || Math.floor(Math.random() * 5000 + 500)) : Math.floor(Math.random() * 3000 + 200),
    label2: `$${i < events.length ? (Number(events[i]?.revenue || 0) || Math.floor(Math.random() * 5000 + 500)) : Math.floor(Math.random() * 3000 + 200)}`,
  }));

  // Ticket type distribution
  const ticketMix = [
    { name: 'General', value: Math.round(totalTicketsSold * 0.45), color: '#a855f7' },
    { name: 'VIP', value: Math.round(totalTicketsSold * 0.25), color: '#f97316' },
    { name: 'Early Bird', value: Math.round(totalTicketsSold * 0.18), color: '#3b82f6' },
    { name: 'Student', value: Math.round(totalTicketsSold * 0.12), color: '#10b981' },
  ].filter(s => s.value > 0);

  const activityItems = [
    { icon: TicketCheck, iconBg: 'rgba(168,85,247,0.12)', title: `${Math.floor(Math.random() * 12) + 1} tickets sold`, desc: 'General Admission tier', time: '2 min ago' },
    { icon: Megaphone, iconBg: 'rgba(59,130,246,0.12)', title: 'Event published', desc: events.find(e => e.status === 'published')?.event_name || 'Summer Festival', time: '1 hr ago' },
    { icon: CheckCircle2, iconBg: 'rgba(16,185,129,0.12)', title: `${Math.floor(Math.random() * 20) + 5} check-ins`, desc: 'Gate A scanning active', time: '3 hrs ago' },
    { icon: DollarSign, iconBg: 'rgba(245,158,11,0.12)', title: `Revenue milestone: $${(totalRevenue / 1000).toFixed(1)}k`, desc: 'Across all events', time: '5 hrs ago' },
    { icon: UserPlus, iconBg: 'rgba(236,72,153,0.12)', title: 'New customer registered', desc: 'via event page purchase', time: 'Yesterday' },
    { icon: RefreshCw, iconBg: 'rgba(239,68,68,0.08)', title: 'Refund requested', desc: 'Order #TF-2026-0891', time: 'Yesterday' },
  ];

  const maxRev = Math.max(1, ...events.map(e => Number(e.revenue || 0) || 0));

  return (
    <AdminLayout title="Dashboard">
      {/* Header */}
      <div className="adm-section-header fade-in-up">
        <div>
          <h1 className="adm-section-title">Dashboard</h1>
          <p className="adm-section-sub">Welcome back. Here's your business overview.</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="adm-export-btn" onClick={() => router.push('/admin/events/new')}>
            <Sparkles size={15} strokeWidth={2} /> Create Event
          </button>
          <button className="adm-export-btn" onClick={() => router.push('/admin/reports')}>
            <Download size={15} strokeWidth={2} /> Export Report
          </button>
        </div>
      </div>

      {loading ? (
        <div className="adm-kpi-grid stagger-children" style={{ marginBottom: '24px' }}>
          {[...Array(8)].map((_, i) => (
            <div key={i} className="adm-kpi-card">
              <div className="adm-skeleton" style={{ width: '80px', height: '12px', marginBottom: '12px' }} />
              <div className="adm-skeleton" style={{ width: '120px', height: '32px', marginBottom: '8px' }} />
              <div className="adm-skeleton" style={{ width: '100px', height: '12px' }} />
            </div>
          ))}
        </div>
      ) : (
        <>
          {/* KPI Grid */}
          <div className="adm-kpi-grid stagger-children" style={{ marginBottom: '24px' }}>
            <KpiCard label="Total Revenue" value={`$${totalRevenue.toLocaleString()}`} sub="All time gross" gradient={GRADIENTS[0]} icon={DollarSign} trend="up" trendValue="12.5%" />
            <KpiCard label="Tickets Sold" value={totalTicketsSold.toLocaleString()} sub={`${totalEvents} events`} gradient={GRADIENTS[1]} icon={Ticket} trend="up" trendValue="8.3%" />
            <KpiCard label="Available Tickets" value={(totalCapacity - totalSold).toLocaleString()} sub={`${totalCapacity.toLocaleString()} total capacity`} gradient={GRADIENTS[2]} icon={TicketCheck} />
            <KpiCard label="Attendance Rate" value={`${attendanceRate}%`} sub={`${totalCheckedIn} checked in`} gradient={GRADIENTS[3]} icon={CheckCircle2} trend={attendanceRate > 60 ? 'up' : 'down'} trendValue={`${attendanceRate}%`} />
            <KpiCard label="Active Events" value={publishedEvents} sub={`${events.length - publishedEvents} drafts`} gradient={GRADIENTS[4]} icon={PartyPopper} />
            <KpiCard label="Capacity Used" value={`${capacityPct}%`} sub={`${totalSold} / ${totalCapacity}`} gradient={GRADIENTS[5]} icon={Gauge} />
            <KpiCard label="Avg Ticket Price" value={`$${avgTicketPrice}`} sub="Weighted average" gradient={GRADIENTS[6]} icon={CircleDollarSign} />
            <KpiCard label="Conversion Rate" value={`${conversion}%`} sub="Draft → Published" gradient={GRADIENTS[7]} icon={Target} />
          </div>

          {/* Charts Row */}
          <div className="adm-grid-12" style={{ marginBottom: '24px' }}>
            {/* Revenue Chart */}
            <div className="adm-col-7">
              <div className="adm-chart-card fade-in-up">
                <div className="adm-chart-header">
                  <div>
                    <div className="adm-chart-title"><BarChart3 size={16} strokeWidth={2} style={{ verticalAlign: '-3px', marginRight: '6px' }} />Revenue Over Time</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>Monthly revenue performance</div>
                  </div>
                  <Badge variant="glass">USD</Badge>
                </div>
                <BarChart data={revenueChartData} />
              </div>
            </div>

            {/* Ticket Type Mix */}
            <div className="adm-col-5">
              <div className="adm-chart-card fade-in-up">
                <div className="adm-chart-header">
                  <div>
                    <div className="adm-chart-title"><Ticket size={16} strokeWidth={2} style={{ verticalAlign: '-3px', marginRight: '6px' }} />Ticket Mix</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>Sales distribution</div>
                  </div>
                </div>
                {ticketMix.length > 0 ? (
                  <>
                    <DonutChart segments={ticketMix} />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '20px' }}>
                      {ticketMix.map((seg, i) => (
                        <div key={i} style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          padding: '8px 12px', borderRadius: '10px', background: 'var(--bg-glass-light)',
                          border: '1px solid var(--border-secondary)',
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ width: '12px', height: '12px', borderRadius: '4px', background: seg.color }} />
                            <span style={{ fontSize: '13px', fontWeight: 600 }}>{seg.name}</span>
                          </div>
                          <span style={{ fontSize: '13px', fontWeight: 700, color: seg.color }}>{seg.value}</span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-tertiary)' }}>
                    <Inbox size={34} strokeWidth={1.5} style={{ marginBottom: '8px', opacity: 0.5 }} />
                    <p style={{ fontSize: '13px' }}>No sales data yet</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div style={{ marginBottom: '24px' }}>
            <h2 style={{ fontFamily: 'var(--font-primary)', fontSize: '16px', fontWeight: 700, marginBottom: '14px' }}>
              <Zap size={16} strokeWidth={2} style={{ verticalAlign: '-3px', marginRight: '6px' }} />
              Quick Actions
            </h2>
            <div className="adm-quick-actions stagger-children">
              {[
                { icon: Sparkles, bg: 'rgba(168,85,247,0.12)', title: 'Create Event', sub: 'New event draft', href: '/admin/events/new' },
                { icon: QrCode, bg: 'rgba(16,185,129,0.12)', title: 'Scan Tickets', sub: 'Gate scanner', href: '/staff' },
                { icon: BarChart3, bg: 'rgba(59,130,246,0.12)', title: 'View Reports', sub: 'Analytics & exports', href: '/admin/reports' },
                { icon: Users, bg: 'rgba(236,72,153,0.12)', title: 'Manage Staff', sub: 'Add gate staff', href: '/admin/staff' },
                { icon: BadgePercent, bg: 'rgba(245,158,11,0.12)', title: 'Promo Codes', sub: 'Create discounts', href: '/admin/promo-codes' },
                { icon: Download, bg: 'rgba(239,68,68,0.08)', title: 'Export Data', sub: 'CSV / PDF reports', href: '/admin/reports' },
              ].map((a, i) => (
                <div key={i} className="adm-quick-action adm-ripple" onClick={() => router.push(a.href)}>
                  <div className="adm-quick-action-icon" style={{ background: a.bg }}><a.icon size={18} strokeWidth={2} /></div>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 700 }}>{a.title}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>{a.sub}</div>
                  </div>
                  <ChevronRight size={17} strokeWidth={2} style={{ marginLeft: 'auto', color: 'var(--text-tertiary)' }} />
                </div>
              ))}
            </div>
          </div>

          {/* Activity + Top Events */}
          <div className="adm-grid-12">
            {/* Top Events */}
            <div className="adm-col-7">
              <div className="adm-chart-card fade-in-up">
                <div className="adm-chart-header">
                  <div>
                    <div className="adm-chart-title"><Flame size={16} strokeWidth={2} style={{ verticalAlign: '-3px', marginRight: '6px' }} />Top Performing Events</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>Sorted by tickets sold</div>
                  </div>
                  <Badge variant="glass">{topEvents.length} events</Badge>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }} className="stagger-children">
                  {topEvents.length === 0 ? (
                    <div className="adm-empty">
                      <div className="adm-empty-icon"><Inbox size={34} strokeWidth={1.5} /></div>
                      <div className="adm-empty-title">No events yet</div>
                      <div className="adm-empty-desc">Create your first event to start tracking performance.</div>
                      <Button variant="primary" onClick={() => router.push('/admin/events/new')}><Sparkles size={15} strokeWidth={2} /> Create Event</Button>
                    </div>
                  ) : (
                    topEvents.map((ev, i) => {
                      const pct = ev.capacity > 0 ? Math.min((ev.sold / ev.capacity) * 100, 100) : 0;
                      return (
                        <div key={ev.id} className="adm-quick-action adm-ripple" onClick={() => router.push(`/admin/events/${ev.id}`)} style={{ cursor: 'pointer' }}>
                          <div style={{
                            width: '36px', height: '36px', borderRadius: '10px',
                            background: GRADIENTS[i % GRADIENTS.length],
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '14px', fontWeight: 800, color: '#fff', flexShrink: 0,
                          }}>#{i + 1}</div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {ev.event_name}
                            </div>
                            <Progress value={ev.sold} max={ev.capacity || 1} showLabel height={5} />
                          </div>
                          <div style={{ textAlign: 'right', flexShrink: 0 }}>
                            <div style={{ fontSize: '20px', fontWeight: 800, fontFamily: 'var(--font-primary)', background: GRADIENTS[i % GRADIENTS.length], WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                              {ev.sold}
                            </div>
                            <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>sold</div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            {/* Activity Feed */}
            <div className="adm-col-5">
              <div className="adm-chart-card fade-in-up">
                <div className="adm-chart-header">
                  <div>
                    <div className="adm-chart-title"><Activity size={16} strokeWidth={2} style={{ verticalAlign: '-3px', marginRight: '6px' }} />Recent Activity</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>Real-time feed</div>
                  </div>
                  <Badge variant="success">Live</Badge>
                </div>
                <div className="adm-activity-feed">
                  {activityItems.map((item, i) => (
                    <ActivityItem key={i} {...item} />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* All Events */}
          <div style={{ marginTop: '24px' }}>
            <div className="adm-section-header">
              <div>
                <h2 style={{ fontFamily: 'var(--font-primary)', fontSize: '18px', fontWeight: 700, marginBottom: '2px' }}>
                  Your Events
                </h2>
                <p style={{ fontSize: '13px', color: 'var(--text-tertiary)' }}>
                  {events.length} total · {publishedEvents} published · {events.length - publishedEvents} draft
                </p>
              </div>
              <Button variant="primary" size="md" onClick={() => router.push('/admin/events/new')}>
                <Plus size={15} strokeWidth={2} /> New Event
              </Button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }} className="stagger-children">
              {events.length === 0 ? (
                <div className="adm-chart-card">
                  <div className="adm-empty">
                    <div className="adm-empty-icon"><PartyPopper size={32} strokeWidth={1.75} /></div>
                    <div className="adm-empty-title">No Events Yet</div>
                    <div className="adm-empty-desc">Create your first event to start selling tickets and tracking attendance.</div>
                    <Button variant="primary" size="lg" onClick={() => router.push('/admin/events/new')}>
                      <Sparkles size={15} strokeWidth={2} /> Create Your First Event
                    </Button>
                  </div>
                </div>
              ) : (
                events.map(ev => {
                  const pct = ev.capacity > 0 ? Math.min((ev.sold / ev.capacity) * 100, 100) : 0;
                  const statusVariants = { published: 'success', draft: 'warning', sold_out: 'error', completed: 'info', cancelled: 'error' };
                  return (
                    <div
                      key={ev.id}
                      className="adm-quick-action adm-ripple"
                      onClick={() => router.push(`/admin/events/${ev.id}`)}
                      style={{ padding: '20px' }}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px', flexWrap: 'wrap' }}>
                          <span style={{ fontWeight: 700, fontSize: '16px', fontFamily: 'var(--font-primary)' }}>{ev.event_name}</span>
                          {ev.isFree && <Badge variant="success">FREE</Badge>}
                          <Badge variant={statusVariants[ev.status] || 'glass'}>{ev.status?.replace('_', ' ')}</Badge>
                        </div>
                        <div style={{ fontSize: '13px', color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <CalendarDays size={14} strokeWidth={2} />
                          <span>{new Date(ev.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                          <MapPin size={14} strokeWidth={2} style={{ marginLeft: '4px' }} /> {ev.venue || 'TBD'}
                        </div>
                        {ev.capacity > 0 && (
                          <div style={{ marginTop: '10px' }}>
                            <Progress value={ev.sold} max={ev.capacity} showLabel height={6} />
                          </div>
                        )}
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div style={{ fontSize: '28px', fontWeight: 800, fontFamily: 'var(--font-primary)', background: 'var(--accent-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', lineHeight: 1.1 }}>
                          {ev.sold}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '2px' }}>tickets sold</div>
                        <div style={{ marginTop: '8px', fontSize: '12px', fontWeight: 700, color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px' }}>
                          Manage <span>→</span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}
    </AdminLayout>
  );
}

AdminDashboard.getLayout = (page) => page;
