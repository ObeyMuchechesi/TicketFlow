import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '../../../components/AdminLayout';
import { Badge, Button, Progress, Skeleton } from '../../../components/ui';

const GRADIENTS = [
  'linear-gradient(135deg, #a855f7 0%, #ec4899 100%)',
  'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
  'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)',
  'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)',
  'linear-gradient(135deg, #e94560 0%, #f97316 100%)',
  'linear-gradient(135deg, #0ea5e9 0%, #6366f1 100%)',
];

const STATUS_MAP = {
  published: { label: 'Live', variant: 'success', dot: 'success' },
  draft: { label: 'Draft', variant: 'warning', dot: 'warning' },
  sold_out: { label: 'Sold Out', variant: 'error', dot: 'error' },
  completed: { label: 'Completed', variant: 'info', dot: 'info' },
  cancelled: { label: 'Cancelled', variant: 'error', dot: 'error' },
};

export default function AdminEvents() {
  const router = useRouter();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetch('/api/admin/stats').then(r => r.json()).then(d => { setEvents(d.events || []); setLoading(false); });
  }, []);

  const filtered = events.filter(ev => {
    const matchSearch = !search || ev.event_name?.toLowerCase().includes(search.toLowerCase()) || ev.venue?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || ev.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const counts = {
    all: events.length,
    published: events.filter(e => e.status === 'published').length,
    draft: events.filter(e => e.status === 'draft').length,
    sold_out: events.filter(e => e.status === 'sold_out').length,
    completed: events.filter(e => e.status === 'completed').length,
  };

  function exportCSV() {
    const rows = [['Event', 'Status', 'Date', 'Venue', 'Sold', 'Capacity']];
    filtered.forEach(ev => rows.push([ev.event_name, ev.status, ev.date, ev.venue || '', ev.sold || 0, ev.capacity || 0]));
    const csv = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'events-report.csv'; a.click();
  }

  return (
    <AdminLayout title="Events">
      <div className="adm-section-header fade-in-up">
        <div>
          <h1 className="adm-section-title">Events</h1>
          <p className="adm-section-sub">Manage and monitor all your events</p>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button className="adm-export-btn" onClick={exportCSV}>📥 Export CSV</button>
          <Button variant="primary" size="md" onClick={() => router.push('/admin/events/new')}>
            ✨ Create Event
          </Button>
        </div>
      </div>

      {/* Filter tabs + search */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }} className="fade-in-up">
        <div style={{ display: 'flex', gap: '4px', background: 'var(--bg-glass-light)', border: '1px solid var(--border-primary)', borderRadius: '12px', padding: '4px' }}>
          {['all', 'published', 'draft', 'sold_out', 'completed'].map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              style={{
                padding: '8px 14px',
                background: statusFilter === s ? 'var(--accent-gradient)' : 'transparent',
                border: 'none',
                borderRadius: '8px',
                color: statusFilter === s ? '#fff' : 'var(--text-secondary)',
                fontWeight: statusFilter === s ? 700 : 500,
                fontSize: '13px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              {s === 'all' ? 'All' : s.replace('_', ' ')}
              <span style={{
                fontSize: '10px',
                padding: '1px 6px',
                borderRadius: '10px',
                background: statusFilter === s ? 'rgba(255,255,255,0.2)' : 'var(--bg-tertiary)',
                fontWeight: 700,
              }}>{counts[s] || 0}</span>
            </button>
          ))}
        </div>

        <div className="adm-table-search" style={{ flex: 1, maxWidth: '320px' }}>
          <span>🔍</span>
          <input
            placeholder="Search events..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="adm-event-grid stagger-children">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="adm-event-card">
              <div className="adm-skeleton" style={{ height: '160px', borderRadius: '0' }} />
              <div style={{ padding: '20px' }}>
                <div className="adm-skeleton" style={{ width: '70%', height: '18px', marginBottom: '10px' }} />
                <div className="adm-skeleton" style={{ width: '50%', height: '14px', marginBottom: '16px' }} />
                <div className="adm-skeleton" style={{ width: '100%', height: '8px' }} />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="adm-chart-card">
          <div className="adm-empty">
            <div className="adm-empty-icon">🎪</div>
            <div className="adm-empty-title">
              {events.length === 0 ? 'No Events Yet' : 'No Matching Events'}
            </div>
            <div className="adm-empty-desc">
              {events.length === 0
                ? 'Create your first event to start selling tickets.'
                : `No events match your search "${search}" or filter.`}
            </div>
            {events.length === 0 && (
              <Button variant="primary" size="lg" onClick={() => router.push('/admin/events/new')}>
                ✨ Create Your First Event
              </Button>
            )}
          </div>
        </div>
      ) : (
        <div className="adm-event-grid stagger-children">
          {filtered.map((ev, i) => {
            const pct = ev.capacity > 0 ? Math.min((ev.sold / ev.capacity) * 100, 100) : 0;
            const status = STATUS_MAP[ev.status] || STATUS_MAP.draft;
            const revenue = (ev.sold || 0) * (ev.avgPrice || 25);

            return (
              <div
                key={ev.id}
                className="adm-event-card"
                onClick={() => router.push(`/admin/events/${ev.id}`)}
              >
                <div className="adm-event-card-poster" style={{ background: GRADIENTS[i % GRADIENTS.length] }}>
                  {ev.poster_image ? (
                    <img src={ev.poster_image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : '🎪'}
                  <div style={{ position: 'absolute', top: '12px', right: '12px' }}>
                    <Badge variant={status.variant}>{status.label}</Badge>
                  </div>
                </div>

                <div className="adm-event-card-body">
                  <div className="adm-event-card-title">{ev.event_name}</div>
                  <div className="adm-event-card-meta">
                    📅 {new Date(ev.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    {ev.venue && <> · 📍 {ev.venue}</>}
                  </div>

                  <div style={{ marginBottom: '14px' }}>
                    <Progress value={ev.sold || 0} max={ev.capacity || 1} showLabel height={6} />
                  </div>

                  <div className="adm-event-card-stats">
                    <div className="adm-event-card-stat">
                      <div className="adm-event-card-stat-value" style={{ color: 'var(--accent-primary)' }}>{ev.sold || 0}</div>
                      <div className="adm-event-card-stat-label">Sold</div>
                    </div>
                    <div className="adm-event-card-stat">
                      <div className="adm-event-card-stat-value" style={{ color: 'var(--success)' }}>{ev.checkedIn || 0}</div>
                      <div className="adm-event-card-stat-label">Checked In</div>
                    </div>
                    <div className="adm-event-card-stat">
                      <div className="adm-event-card-stat-value" style={{ color: 'var(--warning)' }}>{ev.capacity || 0}</div>
                      <div className="adm-event-card-stat-label">Capacity</div>
                    </div>
                    <div className="adm-event-card-stat">
                      <div className="adm-event-card-stat-value" style={{ color: 'var(--text-primary)' }}>{Math.round(pct)}%</div>
                      <div className="adm-event-card-stat-label">Filled</div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </AdminLayout>
  );
}

AdminEvents.getLayout = (page) => page;
