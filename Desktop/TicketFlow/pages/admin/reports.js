import { useState, useEffect } from 'react';
import AdminLayout from '../../components/AdminLayout';

export default function AdminReports() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

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

  return (
    <AdminLayout title="Reports">
      <div style={{ padding: 'clamp(20px,3vw,40px)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: '28px', fontWeight: 700, marginBottom: '4px' }}>Reports</h1>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px' }}>Sales and attendance overview</p>
          </div>
          <button onClick={exportCSV} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '50px', padding: '10px 20px', color: '#fff', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>
            📥 Export CSV
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px', color: 'rgba(255,255,255,0.3)' }}>Loading...</div>
        ) : (
          <>
            {/* Summary cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: '14px', marginBottom: '32px' }}>
              {[
                { l: 'Total Revenue', v: `$${(stats?.totalRevenue || 0).toLocaleString()}`, c: '#d4a853' },
                { l: 'Tickets Sold', v: stats?.totalTicketsSold || 0, c: '#e94560' },
                { l: 'Total Events', v: stats?.totalEvents || 0, c: '#10b981' },
                { l: 'Avg per Event', v: stats?.totalEvents ? `$${Math.round((stats.totalRevenue || 0) / stats.totalEvents)}` : '$0', c: '#3b82f6' },
              ].map(s => (
                <div key={s.l} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '14px', padding: '20px', textAlign: 'center' }}>
                  <div style={{ fontSize: '28px', fontWeight: 800, color: s.c, fontFamily: "'Playfair Display',serif" }}>{s.v}</div>
                  <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)', marginTop: '4px' }}>{s.l}</div>
                </div>
              ))}
            </div>

            {/* Events table */}
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px', overflow: 'hidden' }}>
              <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: '18px', fontWeight: 600 }}>Event Breakdown</h3>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.4)' }}>
                      {['Event', 'Date', 'Status', 'Sold', 'Checked In', 'Attendance %'].map(h => <th key={h} style={{ padding: '12px 20px', textAlign: 'left', fontWeight: 600, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>{h}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {(stats?.events || []).map(ev => {
                      const pct = ev.sold > 0 ? Math.round((ev.checkedIn / ev.sold) * 100) : 0;
                      return (
                        <tr key={ev.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                          <td style={{ padding: '14px 20px', fontWeight: 500 }}>{ev.event_name}</td>
                          <td style={{ padding: '14px 20px', color: 'rgba(255,255,255,0.4)' }}>{new Date(ev.date).toLocaleDateString()}</td>
                          <td style={{ padding: '14px 20px' }}><span style={{ fontSize: '12px', padding: '2px 10px', borderRadius: '50px', textTransform: 'capitalize', background: ev.status === 'published' ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.06)', color: ev.status === 'published' ? '#10b981' : 'rgba(255,255,255,0.5)' }}>{ev.status}</span></td>
                          <td style={{ padding: '14px 20px', color: '#d4a853', fontWeight: 600 }}>{ev.sold}</td>
                          <td style={{ padding: '14px 20px', color: '#10b981', fontWeight: 600 }}>{ev.checkedIn}</td>
                          <td style={{ padding: '14px 20px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <div style={{ flex: 1, height: '6px', background: 'rgba(255,255,255,0.08)', borderRadius: '3px' }}>
                                <div style={{ height: '100%', width: `${pct}%`, background: '#10b981', borderRadius: '3px' }} />
                              </div>
                              <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', minWidth: '36px' }}>{pct}%</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
}

AdminReports.getLayout = (page) => page;
