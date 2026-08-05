import { useState, useEffect } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { Card, Badge, Button, Progress, Skeleton, Input } from '../../components/ui';

const GRADIENTS = {
  revenue: 'linear-gradient(135deg, #a855f7 0%, #ec4899 50%, #f97316 100%)',
  tickets: 'linear-gradient(135deg, #e94560 0%, #f97316 100%)',
  events: 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)',
  avg: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
  attendance: 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)',
  customers: 'linear-gradient(135deg, #d4a853 0%, #a855f7 100%)',
};

const BAR_COLORS = ['#a855f7', '#3b82f6', '#10b981', '#f59e0b', '#e94560', '#0ea5e9', '#84cc16', '#d4a853'];

function StatCard({ label, value, sub, gradient, icon }) {
  return (
    <div className="adm-kpi-card" style={{ '--kpi-accent': gradient }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="adm-kpi-label">{label}</div>
          <div className="adm-kpi-value adm-count-animate" style={{
            background: gradient, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
          }}>{value}</div>
          {sub && <div className="adm-kpi-sub">{sub}</div>}
        </div>
        <div className="adm-kpi-icon" style={{ background: gradient, opacity: 0.92 }}>{icon}</div>
      </div>
    </div>
  );
}

export default function AdminReports() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ dateFrom: '', dateTo: '', event: 'all' });

  useEffect(() => {
    fetch('/api/admin/stats').then(r => r.json()).then(d => { setStats(d); setLoading(false); });
  }, []);

  function exportCSV() {
    if (!stats?.events) return;
    const rows = [['Event', 'Status', 'Date', 'Tickets Sold', 'Checked In', 'Revenue']];
    stats.events.forEach(ev => rows.push([ev.event_name, ev.status, ev.date, ev.sold, ev.checkedIn, ev.revenue || 0]));
    const csv = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'tiketflow-report.csv'; a.click();
  }

  const events = stats?.events || [];
  const totalRevenue = stats?.totalRevenue || 0;
  const totalTicketsSold = stats?.totalTicketsSold || 0;
  const totalEvents = stats?.totalEvents || 0;
  const totalCheckedIn = events.reduce((s, e) => s + (e.checkedIn || 0), 0);
  const avgPerEvent = totalEvents ? Math.round(totalRevenue / totalEvents) : 0;
  const attendanceRate = totalTicketsSold > 0 ? Math.round((totalCheckedIn / totalTicketsSold) * 100) : 0;
  const maxRevenue = Math.max(1, ...events.map(e => Number(e.revenue || 0) || 0));

  const ticketMix = stats?.ticketBreakdown || [
    { name: 'General Admission', pct: 55, color: '#a855f7' },
    { name: 'VIP', pct: 25, color: '#f97316' },
    { name: 'Early Bird', pct: 12, color: '#3b82f6' },
    { name: 'Premium', pct: 8, color: '#10b981' },
  ];

  return (
    <AdminLayout title="Reports">
      <div className="adm-section-header fade-in-up">
        <div>
          <h1 className="adm-section-title">Reports & Analytics</h1>
          <p className="adm-section-sub">Sales, attendance, and performance overview across all events</p>
        </div>
        <div className="adm-export-group">
          <button className="adm-export-btn" onClick={exportCSV}>📥 CSV</button>
          <button className="adm-export-btn" disabled style={{ opacity: 0.5 }}>📄 PDF</button>
          <button className="adm-export-btn" disabled style={{ opacity: 0.5 }}>📊 Excel</button>
        </div>
      </div>

      {loading ? (
        <div className="adm-kpi-grid stagger-children">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="adm-kpi-card">
              <div className="adm-skeleton" style={{ width: '80px', height: '12px', marginBottom: '12px' }} />
              <div className="adm-skeleton" style={{ width: '120px', height: '32px', marginBottom: '8px' }} />
              <div className="adm-skeleton" style={{ width: '100px', height: '12px' }} />
            </div>
          ))}
        </div>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="adm-kpi-grid stagger-children" style={{ marginBottom: '24px' }}>
            <StatCard label="Total Revenue" value={`$${totalRevenue.toLocaleString()}`} sub="Gross across all events" gradient={GRADIENTS.revenue} icon="💰" />
            <StatCard label="Tickets Sold" value={totalTicketsSold.toLocaleString()} sub="All tiers combined" gradient={GRADIENTS.tickets} icon="🎟️" />
            <StatCard label="Total Events" value={totalEvents} sub={`${events.filter(e => e.status === 'published').length} published`} gradient={GRADIENTS.events} icon="🎪" />
            <StatCard label="Avg / Event" value={`$${avgPerEvent.toLocaleString()}`} sub="Revenue per event" gradient={GRADIENTS.avg} icon="📈" />
            <StatCard label="Attendance Rate" value={`${attendanceRate}%`} sub={`${totalCheckedIn} checked in`} gradient={GRADIENTS.attendance} icon="✅" />
            <StatCard label="Unique Customers" value={Math.round(totalTicketsSold * 0.82).toLocaleString()} sub="Estimated unique buyers" gradient={GRADIENTS.customers} icon="👥" />
          </div>

          {/* Filters */}
          <div className="adm-chart-card fade-in-up" style={{ marginBottom: '24px' }}>
            <div className="adm-chart-header">
              <div>
                <div className="adm-chart-title">🔍 Filter Report</div>
                <div style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>Narrow down analytics</div>
              </div>
              <Badge variant="glass">{events.length} events</Badge>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
              <Input label="Date From" type="date" value={filters.dateFrom} onChange={e => setFilters(f => ({ ...f, dateFrom: e.target.value }))} />
              <Input label="Date To" type="date" value={filters.dateTo} onChange={e => setFilters(f => ({ ...f, dateTo: e.target.value }))} />
              <div className="field-group">
                <label>Event</label>
                <select className="premium-input" value={filters.event} onChange={e => setFilters(f => ({ ...f, event: e.target.value }))} style={{ cursor: 'pointer' }}>
                  <option value="all">All Events</option>
                  {events.map(e => <option key={e.id} value={e.id}>{e.event_name}</option>)}
                </select>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                <Button variant="primary" fullWidth size="md">🔄 Apply</Button>
              </div>
            </div>
          </div>

          {/* Charts Row */}
          <div className="adm-grid-12" style={{ marginBottom: '24px' }}>
            {/* Revenue by Event */}
            <div className="adm-col-7">
              <div className="adm-chart-card fade-in-up">
                <div className="adm-chart-header">
                  <div>
                    <div className="adm-chart-title">📊 Revenue by Event</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>Top performing events</div>
                  </div>
                  <Badge variant="success">USD</Badge>
                </div>
                {events.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-tertiary)' }}>
                    <div style={{ fontSize: '36px', marginBottom: '8px' }}>📭</div>
                    <p style={{ fontSize: '13px' }}>No event data yet</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }} className="stagger-children">
                    {[...events]
                      .sort((a, b) => (Number(b.revenue || 0) || 0) - (Number(a.revenue || 0) || 0))
                      .map((ev, i) => {
                        const rev = Number(ev.revenue || 0) || 0;
                        const pct = Math.round((rev / maxRevenue) * 100);
                        return (
                          <div key={ev.id}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                                <Badge variant={i < 3 ? 'primary' : 'glass'}>{i + 1}</Badge>
                                <span style={{ fontSize: '13px', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '280px' }}>{ev.event_name}</span>
                              </div>
                              <span style={{ fontSize: '14px', fontWeight: 800, fontFamily: 'var(--font-primary)', color: BAR_COLORS[i % BAR_COLORS.length], flexShrink: 0 }}>${rev.toLocaleString()}</span>
                            </div>
                            <div style={{ width: '100%', height: '12px', background: 'var(--bg-glass-light)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                              <div style={{ height: '100%', width: `${pct}%`, background: `linear-gradient(90deg, ${BAR_COLORS[i % BAR_COLORS.length]}, ${BAR_COLORS[i % BAR_COLORS.length]}88)`, borderRadius: 'var(--radius-full)', transition: 'width 0.8s cubic-bezier(0.16, 1, 0.3, 1)' }} />
                            </div>
                            <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '2px' }}>{pct}% of top · {ev.sold || 0} tickets</div>
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>
            </div>

            {/* Ticket Type Mix */}
            <div className="adm-col-5">
              <div className="adm-chart-card fade-in-up">
                <div className="adm-chart-header">
                  <div>
                    <div className="adm-chart-title">🎟️ Ticket Type Mix</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>Sales distribution</div>
                  </div>
                  <Badge variant="primary">{ticketMix.length} tiers</Badge>
                </div>
                <div style={{ display: 'flex', width: '100%', height: '32px', borderRadius: 'var(--radius-full)', overflow: 'hidden', border: '1px solid var(--border-primary)', marginBottom: '16px' }}>
                  {ticketMix.map((seg, i) => (
                    <div key={i} title={`${seg.name} — ${seg.pct}%`} style={{ flex: seg.pct, background: `linear-gradient(135deg, ${seg.color}, ${seg.color}bb)` }} />
                  ))}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {ticketMix.map((seg, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', borderRadius: '10px', background: 'var(--bg-glass-light)', border: '1px solid var(--border-secondary)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '14px', height: '14px', borderRadius: '5px', background: seg.color }} />
                        <span style={{ fontSize: '13px', fontWeight: 600 }}>{seg.name}</span>
                      </div>
                      <span style={{ fontSize: '13px', fontWeight: 800, color: seg.color }}>{seg.pct}%</span>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border-primary)' }}>
                  <div style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.5px', color: 'var(--text-tertiary)', marginBottom: '8px' }}>Check-in Rate</div>
                  <Progress value={totalCheckedIn} max={Math.max(1, totalTicketsSold)} showLabel height={8} />
                </div>
              </div>
            </div>
          </div>

          {/* Event Breakdown Table */}
          <div className="adm-table-wrap fade-in-up">
            <div className="adm-table-toolbar">
              <div>
                <div style={{ fontFamily: 'var(--font-primary)', fontSize: '16px', fontWeight: 700 }}>📋 Event Breakdown</div>
                <div style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>Detailed attendance & sales per event</div>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <Badge variant="success">{events.filter(e => e.status === 'published').length} Live</Badge>
                <Badge variant="warning">{events.filter(e => e.status === 'draft').length} Draft</Badge>
              </div>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table className="adm-table">
                <thead>
                  <tr>
                    {['Event', 'Date', 'Status', 'Sold', 'Checked In', 'Attendance %'].map(h => (
                      <th key={h}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {events.length === 0 ? (
                    <tr><td colSpan="6" style={{ textAlign: 'center', padding: '50px 20px' }}>
                      <div style={{ fontSize: '36px', marginBottom: '10px' }}>📊</div>
                      <div style={{ color: 'var(--text-tertiary)', fontSize: '14px' }}>No events to report on yet</div>
                    </td></tr>
                  ) : (
                    events.map((ev, rowIdx) => {
                      const pct = ev.sold > 0 ? Math.round(((ev.checkedIn || 0) / ev.sold) * 100) : 0;
                      const statusVariants = { published: 'success', draft: 'warning', sold_out: 'error', completed: 'info', cancelled: 'error' };
                      return (
                        <tr key={ev.id}>
                          <td style={{ fontWeight: 600 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: `linear-gradient(135deg, ${BAR_COLORS[rowIdx % BAR_COLORS.length]}, ${BAR_COLORS[rowIdx % BAR_COLORS.length]}88)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', flexShrink: 0 }}>🎪</div>
                              <span style={{ fontFamily: 'var(--font-primary)', fontSize: '14px' }}>{ev.event_name}</span>
                            </div>
                          </td>
                          <td style={{ color: 'var(--text-tertiary)', fontSize: '13px' }}>{ev.date ? new Date(ev.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}</td>
                          <td><Badge variant={statusVariants[ev.status] || 'glass'}>{ev.status?.replace('_', ' ')}</Badge></td>
                          <td><span style={{ fontWeight: 700, color: 'var(--accent-primary)' }}>{ev.sold || 0}</span></td>
                          <td><span style={{ fontWeight: 700, color: 'var(--success)' }}>{ev.checkedIn || 0}</span></td>
                          <td style={{ minWidth: '180px' }}>
                            <Progress value={ev.checkedIn || 0} max={Math.max(1, ev.sold || 1)} showLabel height={6} color={pct >= 80 ? '#10b981' : pct >= 50 ? '#f59e0b' : '#ef4444'} />
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </AdminLayout>
  );
}

AdminReports.getLayout = (page) => page;
