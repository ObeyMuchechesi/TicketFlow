import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '../../../components/AdminLayout';
import { Badge, Button, Progress, Skeleton, Input } from '../../../components/ui';
import { ClipboardList, Ticket, Users, Zap, AlertCircle, CalendarDays, MapPin, ExternalLink, Search, Copy, PauseCircle, PlayCircle, RefreshCw, Mail, Archive, Download, Smartphone, Landmark, Check, X } from 'lucide-react';

const STATUS_COLORS = { published: '#10b981', draft: '#f59e0b', sold_out: '#ef4444', completed: '#6b7280', cancelled: '#ef4444' };
const STATUS_MAP = { published: { variant: 'success', label: 'Live' }, draft: { variant: 'warning', label: 'Draft' }, sold_out: { variant: 'error', label: 'Sold Out' }, completed: { variant: 'info', label: 'Completed' }, cancelled: { variant: 'error', label: 'Cancelled' } };
const TABS = [
  { key: 'overview', label: 'Overview', icon: ClipboardList },
  { key: 'tickets', label: 'Ticket Types', icon: Ticket },
  { key: 'attendees', label: 'Attendees', icon: Users },
  { key: 'actions', label: 'Actions', icon: Zap },
];

export default function AdminEventDetail() {
  const router = useRouter();
  const { id } = router.query;
  const [event, setEvent] = useState(null);
  const [attendees, setAttendees] = useState([]);
  const [tab, setTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusLoading, setStatusLoading] = useState(false);
  const [sortField, setSortField] = useState('purchase_date');
  const [sortDir, setSortDir] = useState('desc');

  useEffect(() => {
    if (!id) return;
    fetch(`/api/events/${id}`).then(r => r.json()).then(d => { setEvent(d.event); setLoading(false); });
  }, [id]);

  useEffect(() => {
    if (!id || tab !== 'attendees') return;
    fetch(`/api/admin/attendees?eventId=${id}&search=${search}`).then(r => r.json()).then(d => setAttendees(d.attendees || []));
  }, [id, tab, search]);

  async function updateStatus(status) {
    setStatusLoading(true);
    await fetch(`/api/events/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) });
    setEvent(e => ({ ...e, status }));
    setStatusLoading(false);
  }

  function exportAttendeesCSV() {
    const rows = [['Name', 'Email', 'Ticket Type', 'Status', 'Checked In', 'Purchase Date']];
    attendees.forEach(a => rows.push([a.buyer_name, a.buyer_email, a.ticket_types?.name || '', a.status, a.is_checked_in ? 'Yes' : 'No', new Date(a.purchase_date).toLocaleDateString()]));
    const csv = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `attendees-${event?.event_name || 'event'}.csv`; a.click();
  }

  function toggleSort(field) {
    if (sortField === field) { setSortDir(d => d === 'asc' ? 'desc' : 'asc'); }
    else { setSortField(field); setSortDir('asc'); }
  }

  const sortedAttendees = [...attendees].sort((a, b) => {
    const va = a[sortField] || '';
    const vb = b[sortField] || '';
    const cmp = typeof va === 'string' ? va.localeCompare(vb) : va - vb;
    return sortDir === 'asc' ? cmp : -cmp;
  });

  if (loading) return <AdminLayout title="Event"><div className="adm-content"><div className="adm-skeleton" style={{ height: '40px', width: '200px', marginBottom: '20px' }} /><div className="adm-skeleton" style={{ height: '300px' }} /></div></AdminLayout>;
  if (!event) return <AdminLayout title="Event"><div className="adm-content"><div className="adm-chart-card"><div className="adm-empty"><div className="adm-empty-icon"><AlertCircle size={34} strokeWidth={1.75} /></div><div className="adm-empty-title">Event Not Found</div><Button variant="primary" onClick={() => router.push('/admin/events')}>← Back to Events</Button></div></div></div></AdminLayout>;

  const sold = (event.ticket_types || []).reduce((s, t) => s + (t.quantity_sold || 0), 0);
  const total = (event.ticket_types || []).reduce((s, t) => s + t.quantity_available, 0);
  const available = total - sold;
  const revenue = (event.ticket_types || []).reduce((s, t) => s + ((t.quantity_sold || 0) * t.price), 0);
  const pctSold = total > 0 ? Math.round((sold / total) * 100) : 0;
  const sm = STATUS_MAP[event.status] || STATUS_MAP.draft;
  const isFree = (event.ticket_types || []).length > 0 && (event.ticket_types || []).every(t => Number(t.price) === 0);

  const statCards = [
    { l: 'Tickets Sold', v: sold, c: 'linear-gradient(135deg, #a855f7, #ec4899)', sub: `${pctSold}% of capacity` },
    { l: 'Available', v: available, c: 'linear-gradient(135deg, #10b981, #06b6d4)', sub: `${total} total` },
    { l: 'Revenue', v: isFree ? '$0.00' : `$${revenue.toLocaleString()}`, c: 'linear-gradient(135deg, #d4a853, #f97316)', sub: isFree ? 'Free event — no payments' : 'Gross sales' },
    { l: 'Capacity', v: event.capacity || '∞', c: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', sub: 'Max attendees' },
  ];

  return (
    <AdminLayout title={event.event_name}>
      {/* Back + Header */}
      <button onClick={() => router.push('/admin/events')} style={{ background: 'none', border: 'none', color: 'var(--text-tertiary)', fontSize: '13px', cursor: 'pointer', marginBottom: '16px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
        ← All Events
      </button>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }} className="fade-in-up">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px', flexWrap: 'wrap' }}>
            <h1 style={{ fontFamily: 'var(--font-primary)', fontSize: 'clamp(22px, 3vw, 30px)', fontWeight: 800, margin: 0 }}>{event.event_name}</h1>
            <Badge variant={sm.variant}>{sm.label}</Badge>
            {isFree && <Badge variant="success">Free Event</Badge>}
          </div>
          <div style={{ fontSize: '14px', color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span><CalendarDays size={14} strokeWidth={2} style={{ verticalAlign: '-2px', marginRight: '4px' }} />{new Date(event.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
            <span>·</span>
            <span><MapPin size={14} strokeWidth={2} style={{ verticalAlign: '-2px', marginRight: '4px' }} />{event.venue || 'TBD'}</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <a href={`/events/${event.slug}`} target="_blank" rel="noopener noreferrer" className="adm-export-btn" style={{ textDecoration: 'none' }}><ExternalLink size={14} strokeWidth={2} /> View Page</a>
          <select
            value={event.status}
            onChange={e => updateStatus(e.target.value)}
            disabled={statusLoading}
            style={{ padding: '8px 14px', background: 'var(--bg-glass-light)', border: '1px solid var(--border-primary)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', fontSize: '13px', cursor: 'pointer', outline: 'none' }}
          >
            {['draft', 'published', 'sold_out', 'completed', 'cancelled'].map(s => (
              <option key={s} value={s} style={{ background: 'var(--bg-secondary)' }}>{s.replace('_', ' ')}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Stats */}
      <div className="adm-kpi-grid stagger-children" style={{ marginBottom: '24px', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
        {statCards.map(s => (
          <div key={s.l} className="adm-kpi-card" style={{ '--kpi-accent': s.c }}>
            <div className="adm-kpi-label">{s.l}</div>
            <div className="adm-kpi-value adm-count-animate" style={{ background: s.c, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>{s.v}</div>
            <div className="adm-kpi-sub">{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', background: 'var(--bg-glass-light)', border: '1px solid var(--border-primary)', borderRadius: '12px', padding: '4px', marginBottom: '24px' }} className="fade-in-up">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              flex: 1, padding: '10px 14px',
              background: tab === t.key ? 'var(--accent-gradient)' : 'transparent',
              border: 'none', borderRadius: '8px',
              color: tab === t.key ? '#fff' : 'var(--text-secondary)',
              fontWeight: tab === t.key ? 700 : 500, fontSize: '13px',
              cursor: 'pointer', transition: 'all 0.2s',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
            }}
          >
            <t.icon size={15} strokeWidth={2} /> {t.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {tab === 'overview' && (
        <div className="adm-grid-12 fade-in-up">
          <div className="adm-col-7">
            <div className="adm-chart-card">
              <div className="adm-chart-header">
                <div className="adm-chart-title">Event Details</div>
              </div>
              {(event.cover_image || event.poster_image) && (
                <img src={event.cover_image || event.poster_image} alt="poster" style={{ width: '100%', maxHeight: '280px', objectFit: 'cover', borderRadius: '14px', marginBottom: '20px' }} />
              )}
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: '16px', fontSize: '14px' }}>
                {event.description || 'No description provided.'}
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '14px' }}>
                <div><strong style={{ color: 'var(--text-primary)' }}>Time:</strong> <span style={{ color: 'var(--text-secondary)' }}>{event.time || '—'}</span></div>
                <div><strong style={{ color: 'var(--text-primary)' }}>Theme:</strong> <span style={{ display: 'inline-block', width: '16px', height: '16px', background: event.theme_color, borderRadius: '4px', marginLeft: '6px', verticalAlign: 'middle' }} /></div>
                <div><strong style={{ color: 'var(--text-primary)' }}>Slug:</strong> <span style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', fontSize: '12px' }}>{event.slug}</span></div>
                <div><strong style={{ color: 'var(--text-primary)' }}>Status:</strong> <Badge variant={sm.variant}>{sm.label}</Badge></div>
              </div>
            </div>
          </div>
          <div className="adm-col-5">
            <div className="adm-chart-card">
              <div className="adm-chart-header">
                <div className="adm-chart-title">Sales Progress</div>
              </div>
              <div style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Tickets Sold</span>
                  <span style={{ fontWeight: 700 }}>{sold} / {total}</span>
                </div>
                <Progress value={sold} max={total || 1} showLabel height={10} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {(event.ticket_types || []).map(tt => {
                  const tp = tt.quantity_available > 0 ? Math.min((tt.quantity_sold / tt.quantity_available) * 100, 100) : 0;
                  return (
                    <div key={tt.id} style={{ padding: '12px', borderRadius: '10px', background: 'var(--bg-glass-light)', border: '1px solid var(--border-secondary)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                        <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: tt.color }} />
                        <span style={{ fontSize: '13px', fontWeight: 600 }}>{tt.name}</span>
                        <span style={{ marginLeft: 'auto', fontSize: '13px', fontWeight: 700, color: Number(tt.price) === 0 ? '#059669' : tt.color }}>
                          {Number(tt.price) === 0 ? 'FREE' : `$${tt.price}`}
                        </span>
                      </div>
                      <Progress value={tt.quantity_sold || 0} max={tt.quantity_available} height={5} />
                      <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '4px' }}>
                        {tt.quantity_sold || 0} / {tt.quantity_available} ({Math.round(tp)}%)
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Payment Settings */}
            <div className="adm-chart-card" style={{ marginTop: '20px' }}>
              <div className="adm-chart-header">
                <div className="adm-chart-title"><Zap size={14} strokeWidth={2} style={{ verticalAlign: '-2px', marginRight: '5px' }} />Payment Settings</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '13px' }}>
                {/* EcoCash */}
                <div style={{ padding: '12px', borderRadius: '10px', background: 'var(--bg-glass-light)', border: '1px solid var(--border-secondary)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, marginBottom: '8px' }}>
                    <Smartphone size={14} strokeWidth={2} style={{ color: '#10b981' }} /> EcoCash
                    {event.ecocash_type && event.ecocash_type !== 'none' ? <Check size={13} strokeWidth={2.5} style={{ color: '#10b981', marginLeft: 'auto' }} /> : <X size={13} strokeWidth={2.5} style={{ color: '#9ca3af', marginLeft: 'auto' }} />}
                  </div>
                  {event.ecocash_type && event.ecocash_type !== 'none' ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '4px 12px', color: 'var(--text-secondary)' }}>
                      <span style={{ color: 'var(--text-tertiary)' }}>Type</span><span style={{ fontWeight: 600, textTransform: 'capitalize' }}>{event.ecocash_type} code</span>
                      <span style={{ color: 'var(--text-tertiary)' }}>Code</span><span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{event.ecocash_code || '—'}</span>
                      <span style={{ color: 'var(--text-tertiary)' }}>Phone</span><span>{event.ecocash_phone || '—'}</span>
                    </div>
                  ) : (
                    <span style={{ color: 'var(--text-tertiary)', fontSize: '12px' }}>Not configured</span>
                  )}
                </div>

                {/* Bank Transfer */}
                <div style={{ padding: '12px', borderRadius: '10px', background: 'var(--bg-glass-light)', border: '1px solid var(--border-secondary)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, marginBottom: '8px' }}>
                    <Landmark size={14} strokeWidth={2} style={{ color: '#6366f1' }} /> Bank Transfer
                    {event.bank_account_number ? <Check size={13} strokeWidth={2.5} style={{ color: '#10b981', marginLeft: 'auto' }} /> : <X size={13} strokeWidth={2.5} style={{ color: '#9ca3af', marginLeft: 'auto' }} />}
                  </div>
                  {event.bank_account_number ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '4px 12px', color: 'var(--text-secondary)' }}>
                      <span style={{ color: 'var(--text-tertiary)' }}>Bank</span><span style={{ fontWeight: 600 }}>{event.bank_name || '—'}</span>
                      <span style={{ color: 'var(--text-tertiary)' }}>Account</span><span>{event.bank_account_name || '—'}</span>
                      <span style={{ color: 'var(--text-tertiary)' }}>Number</span><span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{event.bank_account_number}</span>
                    </div>
                  ) : (
                    <span style={{ color: 'var(--text-tertiary)', fontSize: '12px' }}>Not configured</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === 'tickets' && (
        <div className="fade-in-up">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', alignItems: 'center' }}>
            <h3 style={{ fontFamily: 'var(--font-primary)', fontSize: '16px', fontWeight: 700 }}>Ticket Types</h3>
            <Badge variant="glass">{(event.ticket_types || []).length} tiers</Badge>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {(event.ticket_types || []).map(tt => {
              const tp = tt.quantity_available > 0 ? Math.min((tt.quantity_sold / tt.quantity_available) * 100, 100) : 0;
              const rev = (tt.quantity_sold || 0) * tt.price;
              return (
                <div key={tt.id} className="adm-chart-card" style={{ border: `1px solid ${tt.color}30` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                    <div style={{ flex: 1, minWidth: '200px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                        <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: tt.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: 800, color: '#fff' }}>
                          {tt.name?.charAt(0) || 'T'}
                        </div>
                        <div>
                          <div style={{ fontSize: '16px', fontWeight: 700 }}>{tt.name}</div>
                          <div style={{ fontSize: '13px', color: Number(tt.price) === 0 ? '#059669' : 'var(--text-tertiary)' }}>
                            {Number(tt.price) === 0 ? 'Free · No payment required' : `$${tt.price} per ticket`}
                          </div>
                        </div>
                      </div>
                      <Progress value={tt.quantity_sold || 0} max={tt.quantity_available} showLabel height={8} />
                      <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '6px' }}>
                        {tt.quantity_sold || 0} sold / {tt.quantity_available} total ({Math.round(tp)}%)
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '24px', fontWeight: 800, fontFamily: 'var(--font-primary)', background: `linear-gradient(135deg, ${tt.color}, #d4a853)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                        ${rev.toLocaleString()}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>revenue</div>
                    </div>
                  </div>
                </div>
              );
            })}
            {(!event.ticket_types || event.ticket_types.length === 0) && (
              <div className="adm-chart-card"><div className="adm-empty"><div className="adm-empty-icon"><Ticket size={32} strokeWidth={1.75} /></div><div className="adm-empty-title">No Ticket Types</div><div className="adm-empty-desc">Add ticket types to start selling.</div></div></div>
            )}
          </div>
        </div>
      )}

      {tab === 'attendees' && (
        <div className="fade-in-up">
          <div className="adm-table-wrap">
            <div className="adm-table-toolbar">
              <div className="adm-table-search">
                <Search size={15} strokeWidth={2} />
                <input
                  placeholder="Search by name, email, phone, or ticket ID..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="adm-export-btn" onClick={exportAttendeesCSV}><Download size={14} style={{ verticalAlign: '-2px' }} /> Export CSV</button>
                <Badge variant="glass">{attendees.length} attendees</Badge>
              </div>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table className="adm-table">
                <thead>
                  <tr>
                    {[
                      { key: 'buyer_name', label: 'Name' },
                      { key: 'buyer_email', label: 'Email' },
                      { key: null, label: 'Ticket Type' },
                      { key: 'status', label: 'Status' },
                      { key: 'is_checked_in', label: 'Checked In' },
                      { key: 'purchase_date', label: 'Date' },
                      { key: null, label: 'Actions' },
                    ].map(h => (
                      <th key={h.label} onClick={() => h.key && toggleSort(h.key)} style={{ cursor: h.key ? 'pointer' : 'default' }}>
                        {h.label} {sortField === h.key && (sortDir === 'asc' ? '↑' : '↓')}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sortedAttendees.length === 0 ? (
                    <tr><td colSpan="7" style={{ textAlign: 'center', padding: '40px' }}>
                      <Users size={34} strokeWidth={1.5} style={{ marginBottom: '8px', opacity: 0.6 }} />
                      <div style={{ color: 'var(--text-tertiary)', fontSize: '14px' }}>No attendees found</div>
                    </td></tr>
                  ) : (
                    sortedAttendees.map(a => (
                      <tr key={a.id}>
                        <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--accent-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 800, color: '#fff', flexShrink: 0 }}>
                              {a.buyer_name?.charAt(0) || '?'}
                            </div>
                            {a.buyer_name}
                          </div>
                        </td>
                        <td>{a.buyer_email}</td>
                        <td>
                          <Badge variant="primary" style={{ background: `${a.ticket_types?.color || '#8b5cf6'}20`, color: a.ticket_types?.color || '#8b5cf6' }}>
                            {a.ticket_types?.name || 'Ticket'}
                          </Badge>
                        </td>
                        <td>
                          <span className={`adm-status-dot ${a.status === 'active' ? 'success' : a.status === 'used' ? 'warning' : 'error'}`}>
                            {a.status}
                          </span>
                        </td>
                        <td>
                          {a.is_checked_in ? (
                            <span style={{ color: 'var(--success)', fontWeight: 600 }}>
                              ✓ {a.checked_in_at ? new Date(a.checked_in_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                            </span>
                          ) : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                        </td>
                        <td style={{ color: 'var(--text-tertiary)', fontSize: '13px' }}>
                          {new Date(a.purchase_date).toLocaleDateString()}
                        </td>
                        <td>
                          <div className="adm-table-row-actions">
                            <button className="adm-table-row-action" title="View ticket" onClick={() => router.push(`/ticket/${a.qr_code_token}`)}><ExternalLink size={14} strokeWidth={2} /></button>
                            <button className="adm-table-row-action" title="Email"><Mail size={14} strokeWidth={2} /></button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {tab === 'actions' && (
        <div className="adm-grid-12 fade-in-up">
          <div className="adm-col-6">
            <div className="adm-chart-card">
              <div className="adm-chart-title" style={{ marginBottom: '16px' }}>Event Actions</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {[
                  { icon: Copy, label: 'Duplicate Event', desc: 'Create a copy of this event', action: () => {} },
                  { icon: PauseCircle, label: 'Pause Sales', desc: 'Temporarily stop ticket sales', action: () => updateStatus('draft') },
                  { icon: PlayCircle, label: 'Resume Sales', desc: 'Reopen ticket purchasing', action: () => updateStatus('published') },
                  { icon: RefreshCw, label: 'Issue Refund', desc: 'Process a customer refund', action: () => {} },
                  { icon: Mail, label: 'Email Attendees', desc: 'Send a message to all buyers', action: () => {} },
                  { icon: Archive, label: 'Archive Event', desc: 'Move to archived events', action: () => updateStatus('completed') },
                ].map((a, i) => (
                  <div key={i} className="adm-quick-action adm-ripple" onClick={a.action}>
                    <div className="adm-quick-action-icon" style={{ background: 'var(--bg-glass-light)' }}><a.icon size={18} strokeWidth={2} /></div>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 600 }}>{a.label}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>{a.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="adm-col-6">
            <div className="adm-chart-card">
              <div className="adm-chart-title" style={{ marginBottom: '16px' }}>Danger Zone</div>
              <div style={{ padding: '20px', borderRadius: '14px', border: '1px solid rgba(239,68,68,0.2)', background: 'rgba(239,68,68,0.04)' }}>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#fca5a5', marginBottom: '4px' }}>Cancel Event</div>
                <div style={{ fontSize: '13px', color: 'var(--text-tertiary)', marginBottom: '14px' }}>
                  This will cancel the event and stop all sales. Attendees will be notified.
                </div>
                <button
                  onClick={() => { if (confirm('Are you sure you want to cancel this event?')) updateStatus('cancelled'); }}
                  style={{ padding: '10px 20px', background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '10px', color: '#fca5a5', fontWeight: 700, fontSize: '13px', cursor: 'pointer' }}
                >
                  🚫 Cancel This Event
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

AdminEventDetail.getLayout = (page) => page;
