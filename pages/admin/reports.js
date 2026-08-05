import { useState, useEffect } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { Card, Badge, Button, Progress, Skeleton, Input } from '../../components/ui';

const STAT_GRADIENTS = {
  revenue: 'linear-gradient(135deg, #a855f7 0%, #ec4899 50%, #f97316 100%)',
  tickets: 'linear-gradient(135deg, #e94560 0%, #f97316 100%)',
  events: 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)',
  avg: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
};

const BAR_COLORS = [
  'linear-gradient(135deg, #a855f7 0%, #ec4899 100%)',
  'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
  'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)',
  'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)',
  'linear-gradient(135deg, #e94560 0%, #f97316 100%)',
  'linear-gradient(135deg, #0ea5e9 0%, #6366f1 100%)',
  'linear-gradient(135deg, #84cc16 0%, #22d3ee 100%)',
  'linear-gradient(135deg, #d4a853 0%, #a855f7 100%)',
];

function StatCard({ label, value, sub, gradient, icon }) {
  return (
    <Card hoverable accent style={{ padding: '22px' }} className="card-lift stagger-children">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{
            fontSize: '11px',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            color: 'var(--text-dimmed)',
            marginBottom: '8px',
          }}>{label}</p>
          <p style={{
            fontSize: '30px',
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
          width: '44px',
          height: '44px',
          borderRadius: '14px',
          background: gradient,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '20px',
          flexShrink: 0,
          opacity: 0.92,
        }}>
          {icon}
        </div>
      </div>
    </Card>
  );
}

export default function AdminReports() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
    event: 'all',
  });

  useEffect(() => {
    fetch('/api/admin/stats').then(r => r.json()).then(d => { setStats(d); setLoading(false); });
  }, []);

  function exportCSV() {
    if (!stats?.events) return;
    const rows = [['Event', 'Status', 'Date', 'Tickets Sold', 'Checked In']];
    stats.events.forEach(ev => rows.push([ev.event_name, ev.status, ev.date, ev.sold, ev.checkedIn]));
    const csv = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'tiketflow-report.csv'; a.click();
  }

  const events = stats?.events || [];
  const totalRevenue = stats?.totalRevenue || 0;
  const totalTicketsSold = stats?.totalTicketsSold || 0;
  const totalEvents = stats?.totalEvents || 0;
  const avgPerEvent = totalEvents ? Math.round(totalRevenue / totalEvents) : 0;

  const maxRevenue = Math.max(1, ...events.map(e => Number(e.revenue || 0) || 0));

  const ticketMix = stats?.ticketBreakdown || [
    { name: 'General Admission', pct: 55, color: '#a855f7' },
    { name: 'VIP', pct: 25, color: '#f97316' },
    { name: 'Early Bird', pct: 12, color: '#3b82f6' },
    { name: 'Premium', pct: 8, color: '#10b981' },
  ];

  return (
    <AdminLayout title="Reports">
      <div style={{ padding: 'clamp(20px, 3vw, 40px)' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '28px',
          flexWrap: 'wrap',
          gap: '16px',
        }} className="fade-in-up">
          <div>
            <h1 style={{
              fontFamily: "var(--font-display)",
              fontSize: 'clamp(26px, 3vw, 34px)',
              fontWeight: 800,
              marginBottom: '4px',
              background: 'var(--accent-gradient)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>Reports & Analytics</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
              Sales, attendance, and performance overview across all events
            </p>
          </div>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <Button variant="secondary" size="md" onClick={exportCSV}>
              📥 Export CSV
            </Button>
            <Button variant="secondary" size="md" disabled>
              📄 Export PDF
            </Button>
            <Button variant="secondary" size="md" disabled>
              📊 Export Excel
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="stagger-children" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '16px',
            }}>
              {[...Array(4)].map((_, i) => (
                <div key={i} className="glass-panel" style={{ padding: '22px', borderRadius: '20px' }}>
                  <Skeleton variant="text" width="70px" height="12px" />
                  <div style={{ height: '10px' }} />
                  <Skeleton variant="title" width="100px" />
                  <div style={{ height: '6px' }} />
                  <Skeleton variant="text" width="90px" />
                </div>
              ))}
            </div>
            <Skeleton variant="card" height="320px" />
            <Skeleton variant="card" height="440px" />
          </div>
        ) : (
          <>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '16px',
              marginBottom: '28px',
            }} className="stagger-children">
              <StatCard
                label="Total Revenue"
                value={`$${totalRevenue.toLocaleString()}`}
                sub="Gross across all events"
                gradient={STAT_GRADIENTS.revenue}
                icon="💰"
              />
              <StatCard
                label="Tickets Sold"
                value={totalTicketsSold.toLocaleString()}
                sub="All ticket tiers combined"
                gradient={STAT_GRADIENTS.tickets}
                icon="🎟️"
              />
              <StatCard
                label="Total Events"
                value={totalEvents}
                sub={`${events.filter(e => e.status === 'published').length} published`}
                gradient={STAT_GRADIENTS.events}
                icon="🎪"
              />
              <StatCard
                label="Avg / Event"
                value={`$${avgPerEvent.toLocaleString()}`}
                sub="Revenue per event average"
                gradient={STAT_GRADIENTS.avg}
                icon="📈"
              />
            </div>

            <Card style={{ padding: '20px', marginBottom: '24px' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '18px',
                flexWrap: 'wrap',
                gap: '12px',
              }}>
                <div>
                  <h3 style={{
                    fontFamily: "var(--font-display)",
                    fontSize: '17px',
                    fontWeight: 700,
                    marginBottom: '2px',
                  }}>🔍 Filter Report</h3>
                  <p style={{ fontSize: '12px', color: 'var(--text-dimmed)' }}>
                    Narrow down your analytics view
                  </p>
                </div>
                <Badge variant="glass">{events.length} events matched</Badge>
              </div>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '12px',
              }}>
                <Input
                  label="Date From"
                  type="date"
                  value={filters.dateFrom}
                  onChange={e => setFilters(f => ({ ...f, dateFrom: e.target.value }))}
                />
                <Input
                  label="Date To"
                  type="date"
                  value={filters.dateTo}
                  onChange={e => setFilters(f => ({ ...f, dateTo: e.target.value }))}
                />
                <div className="field-group">
                  <label>Event</label>
                  <select
                    className="premium-input"
                    value={filters.event}
                    onChange={e => setFilters(f => ({ ...f, event: e.target.value }))}
                    style={{ cursor: 'pointer' }}
                  >
                    <option value="all">All Events</option>
                    {events.map(e => (
                      <option key={e.id} value={e.id}>{e.event_name}</option>
                    ))}
                  </select>
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                  <Button variant="primary" fullWidth size="md" onClick={() => {}}>
                    🔄 Apply Filters
                  </Button>
                </div>
              </div>
            </Card>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(12, 1fr)',
              gap: '20px',
              marginBottom: '28px',
            }}>
              <div style={{ gridColumn: 'span 12', mdGridColumn: 'span 7' }}>
                <Card style={{ padding: '24px' }} className="fade-in-up">
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '20px',
                    flexWrap: 'wrap',
                    gap: '10px',
                  }}>
                    <div>
                      <h3 style={{
                        fontFamily: "var(--font-display)",
                        fontSize: '18px',
                        fontWeight: 700,
                        marginBottom: '2px',
                      }}>📊 Revenue by Event</h3>
                      <p style={{ fontSize: '12px', color: 'var(--text-dimmed)' }}>
                        Top performing events sorted by revenue
                      </p>
                    </div>
                    <Badge variant="success">USD</Badge>
                  </div>

                  {events.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-dimmed)' }}>
                      <div style={{ fontSize: '36px', marginBottom: '8px' }}>📭</div>
                      <p style={{ fontSize: '13px' }}>No event data yet</p>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      {[...events]
                        .sort((a, b) => (Number(b.revenue || 0) || 0) - (Number(a.revenue || 0) || 0))
                        .map((ev, i) => {
                          const rev = Number(ev.revenue || 0) || 0;
                          const pct = Math.round((rev / maxRevenue) * 100);
                          return (
                            <div key={ev.id} className="stagger-children">
                              <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: '6px',
                              }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                                  <Badge variant={i < 3 ? 'primary' : 'glass'}>{i + 1}</Badge>
                                  <span style={{
                                    fontSize: '13px',
                                    fontWeight: 600,
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    maxWidth: '300px',
                                  }}>
                                    {ev.event_name}
                                  </span>
                                </div>
                                <span style={{
                                  fontSize: '14px',
                                  fontWeight: 800,
                                  fontFamily: "var(--font-display)",
                                  background: BAR_COLORS[i % BAR_COLORS.length],
                                  WebkitBackgroundClip: 'text',
                                  WebkitTextFillColor: 'transparent',
                                  backgroundClip: 'text',
                                  flexShrink: 0,
                                }}>
                                  ${rev.toLocaleString()}
                                </span>
                              </div>
                              <div style={{
                                width: '100%',
                                height: '14px',
                                background: 'rgba(255,255,255,0.05)',
                                borderRadius: 'var(--radius-pill)',
                                overflow: 'hidden',
                              }}>
                                <div
                                  className="animate-gradient-bg"
                                  style={{
                                    height: '100%',
                                    width: `${pct}%`,
                                    background: BAR_COLORS[i % BAR_COLORS.length],
                                    borderRadius: 'var(--radius-pill)',
                                    transition: 'width 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
                                    position: 'relative',
                                  }}
                                />
                              </div>
                              <div style={{ fontSize: '11px', color: 'var(--text-dimmed)', marginTop: '2px' }}>
                                {pct}% of top · {ev.sold || 0} tickets
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  )}
                </Card>
              </div>

              <div style={{ gridColumn: 'span 12', mdGridColumn: 'span 5' }}>
                <Card style={{ padding: '24px' }} className="fade-in-up">
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '20px',
                  }}>
                    <div>
                      <h3 style={{
                        fontFamily: "var(--font-display)",
                        fontSize: '18px',
                        fontWeight: 700,
                        marginBottom: '2px',
                      }}>🎟️ Ticket Type Mix</h3>
                      <p style={{ fontSize: '12px', color: 'var(--text-dimmed)' }}>
                        Sales distribution
                      </p>
                    </div>
                    <Badge variant="primary">{ticketMix.length} tiers</Badge>
                  </div>

                  <div style={{
                    display: 'flex',
                    width: '100%',
                    height: '36px',
                    borderRadius: 'var(--radius-pill)',
                    overflow: 'hidden',
                    border: '1px solid var(--panel-border)',
                    marginBottom: '18px',
                  }}>
                    {ticketMix.map((seg, i) => (
                      <div
                        key={i}
                        className="animate-gradient-bg"
                        title={`${seg.name} — ${seg.pct}%`}
                        style={{
                          flex: seg.pct,
                          background: `linear-gradient(135deg, ${seg.color} 0%, ${seg.color}bb 100%)`,
                          backgroundSize: '200% 200%',
                        }}
                      />
                    ))}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {ticketMix.map((seg, i) => (
                      <div key={i} style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 12px',
                        borderRadius: '12px',
                        background: 'var(--panel-bg)',
                        border: '1px solid var(--panel-border)',
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                          <div style={{
                            width: '14px',
                            height: '14px',
                            borderRadius: '5px',
                            background: seg.color,
                            flexShrink: 0,
                          }} />
                          <span style={{ fontSize: '13px', fontWeight: 600 }}>{seg.name}</span>
                        </div>
                        <span style={{
                          fontSize: '13px',
                          fontWeight: 800,
                          color: seg.color,
                        }}>{seg.pct}%</span>
                      </div>
                    ))}
                  </div>

                  <div style={{ marginTop: '18px', paddingTop: '18px', borderTop: '1px solid var(--panel-border)' }}>
                    <div style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.5px', color: 'var(--text-dimmed)', marginBottom: '8px' }}>
                      Total Check-in Rate
                    </div>
                    <Progress
                      value={events.reduce((s, e) => s + (e.checkedIn || 0), 0)}
                      max={Math.max(1, events.reduce((s, e) => s + (e.sold || 0), 0))}
                      showLabel
                      height={8}
                    />
                  </div>
                </Card>
              </div>
            </div>

            <Card style={{ padding: 0, overflow: 'hidden' }} accent className="fade-in-up">
              <div style={{
                padding: '20px 24px',
                borderBottom: '1px solid var(--panel-border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '12px',
              }}>
                <div>
                  <h3 style={{
                    fontFamily: "var(--font-display)",
                    fontSize: '18px',
                    fontWeight: 700,
                    marginBottom: '2px',
                  }}>📋 Event Breakdown</h3>
                  <p style={{ fontSize: '12px', color: 'var(--text-dimmed)' }}>
                    Detailed attendance & sales per event
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <Badge variant="success">{events.filter(e => e.status === 'published').length} Live</Badge>
                  <Badge variant="warning">{events.filter(e => e.status === 'draft').length} Draft</Badge>
                </div>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px', minWidth: '720px' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--panel-border)', background: 'var(--panel-bg)' }}>
                      {['Event', 'Date', 'Status', 'Sold', 'Checked In', 'Attendance %'].map(h => (
                        <th key={h} style={{
                          padding: '14px 20px',
                          textAlign: 'left',
                          fontWeight: 700,
                          fontSize: '11px',
                          textTransform: 'uppercase',
                          letterSpacing: '0.6px',
                          color: 'var(--text-dimmed)',
                          whiteSpace: 'nowrap',
                        }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {events.length === 0 ? (
                      <tr>
                        <td colSpan="6" style={{ padding: '50px 20px', textAlign: 'center' }}>
                          <div style={{ fontSize: '36px', marginBottom: '10px' }}>📊</div>
                          <p style={{ color: 'var(--text-dimmed)', fontSize: '14px' }}>No events to report on yet</p>
                        </td>
                      </tr>
                    ) : (
                      events.map((ev, rowIdx) => {
                        const pct = ev.sold > 0 ? Math.round(((ev.checkedIn || 0) / ev.sold) * 100) : 0;
                        const statusVariants = {
                          published: 'success',
                          draft: 'warning',
                          sold_out: 'danger',
                          completed: 'info',
                          cancelled: 'danger',
                        };
                        const rowStyle = rowIdx % 2 === 1 ? { background: 'var(--panel-bg)' } : {};
                        return (
                          <tr
                            key={ev.id}
                            style={{
                              ...rowStyle,
                              borderBottom: '1px solid var(--panel-border)',
                              transition: 'background 0.2s',
                            }}
                            onMouseEnter={e => { e.currentTarget.style.background = 'var(--accent-muted)'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = rowStyle.background || ''; }}
                          >
                            <td style={{ padding: '16px 20px', fontWeight: 600 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <div style={{
                                  width: '32px',
                                  height: '32px',
                                  borderRadius: '10px',
                                  background: BAR_COLORS[rowIdx % BAR_COLORS.length],
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: '14px',
                                  flexShrink: 0,
                                }}>🎪</div>
                                <span style={{ fontFamily: "var(--font-display)", fontSize: '14px' }}>{ev.event_name}</span>
                              </div>
                            </td>
                            <td style={{ padding: '16px 20px', color: 'var(--text-muted)', fontSize: '13px', whiteSpace: 'nowrap' }}>
                              {ev.date ? new Date(ev.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                            </td>
                            <td style={{ padding: '16px 20px' }}>
                              <Badge variant={statusVariants[ev.status] || 'glass'}>
                                {ev.status?.replace('_', ' ')}
                              </Badge>
                            </td>
                            <td style={{ padding: '16px 20px' }}>
                              <span style={{
                                fontWeight: 700,
                                background: 'linear-gradient(135deg, #d4a853 0%, #f97316 100%)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                backgroundClip: 'text',
                              }}>
                                {ev.sold || 0}
                              </span>
                            </td>
                            <td style={{ padding: '16px 20px' }}>
                              <span style={{
                                fontWeight: 700,
                                background: 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                backgroundClip: 'text',
                              }}>
                                {ev.checkedIn || 0}
                              </span>
                            </td>
                            <td style={{ padding: '16px 20px', minWidth: '180px' }}>
                              <Progress
                                value={ev.checkedIn || 0}
                                max={Math.max(1, ev.sold || 1)}
                                showLabel
                                height={6}
                                color={pct >= 80 ? '#10b981' : pct >= 50 ? '#f59e0b' : '#ef4444'}
                              />
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </>
        )}
      </div>
    </AdminLayout>
  );
}

AdminReports.getLayout = (page) => page;
