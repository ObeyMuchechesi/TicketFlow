import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '../../components/AdminLayout';
import { Badge, Button, Skeleton } from '../../components/ui';
import {
  Shield, Camera, FileText, CheckCircle2, XCircle, AlertTriangle,
  Clock, Eye, ChevronRight, Filter, RefreshCw, Search, Image,
  User, Mail, Phone, Calendar, MapPin, DollarSign, TrendingUp,
  Inbox, ExternalLink, ZoomIn, X, ChevronDown,
} from 'lucide-react';

function VerificationCard({ v, onAction }) {
  const [expanded, setExpanded] = useState(false);
  const [showScreenshot, setShowScreenshot] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const ticket = v.tickets;
  const event = ticket?.events;
  const statusColors = {
    pending: { bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.3)', text: '#f59e0b', label: 'Pending Review' },
    verified: { bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.3)', text: '#10b981', label: 'Verified' },
    rejected: { bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.3)', text: '#ef4444', label: 'Rejected' },
    needs_review: { bg: 'rgba(139,92,246,0.1)', border: 'rgba(139,92,246,0.3)', text: '#8b5cf6', label: 'Needs Review' },
  };
  const typeIcons = {
    screenshot_ocr: { icon: Camera, label: 'Screenshot OCR', color: '#3b82f6' },
    manual_ref: { icon: FileText, label: 'Manual Reference', color: '#8b5cf6' },
    admin_review: { icon: Shield, label: 'Admin Review', color: '#f59e0b' },
  };

  const status = statusColors[v.status] || statusColors.pending;
  const type = typeIcons[v.verification_type] || typeIcons.manual_ref;
  const TypeIcon = type.icon;
  const confidence = Number(v.confidence) || 0;

  const handleAction = async (action) => {
    setActionLoading(true);
    await onAction(v.id, action);
    setActionLoading(false);
  };

  return (
    <>
      <div
        className="adm-chart-card fade-in-up"
        style={{
          border: `1px solid ${status.border}`,
          background: status.bg,
          cursor: 'pointer',
          transition: 'all 0.2s ease',
        }}
        onClick={() => setExpanded(!expanded)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          {/* Type Icon */}
          <div style={{
            width: '44px', height: '44px', borderRadius: '12px',
            background: `${type.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <TypeIcon size={20} strokeWidth={2} style={{ color: type.color }} />
          </div>

          {/* Main Info */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
              <span style={{ fontWeight: 700, fontSize: '14px' }}>{ticket?.buyer_name || 'Unknown'}</span>
              <Badge variant="glass" style={{ fontSize: '11px' }}>{type.label}</Badge>
              {v.extracted_ref && (
                <code style={{
                  fontSize: '11px', fontWeight: 700, color: '#10b981',
                  background: 'rgba(16,185,129,0.15)', padding: '2px 8px', borderRadius: '6px',
                  fontFamily: 'var(--font-mono, monospace)',
                }}>
                  {v.extracted_ref}
                </code>
              )}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span>{event?.event_name || 'Unknown event'}</span>
              {v.extracted_amount && <span>${v.extracted_amount}</span>}
              <span>{new Date(v.created_at).toLocaleDateString()}</span>
            </div>
          </div>

          {/* Status + Confidence */}
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '4px',
              padding: '4px 10px', borderRadius: '8px',
              background: status.bg, border: `1px solid ${status.border}`,
              fontSize: '12px', fontWeight: 600, color: status.text,
            }}>
              {status.label}
            </div>
            {confidence > 0 && (
              <div style={{
                fontSize: '11px', color: confidence > 70 ? '#10b981' : '#f59e0b',
                marginTop: '4px', fontWeight: 600,
              }}>
                {confidence}% confidence
              </div>
            )}
          </div>

          <ChevronDown
            size={18}
            strokeWidth={2}
            style={{
              color: 'var(--text-tertiary)',
              transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s ease',
              flexShrink: 0,
            }}
          />
        </div>
      </div>

      {/* Expanded Details */}
      {expanded && (
        <div className="adm-chart-card fade-in-up" style={{ marginTop: '-8px', borderTopLeftRadius: 0, borderTopRightRadius: 0, paddingTop: '16px' }}>
          <div className="adm-grid-12">
            {/* Left: Buyer & Event Info */}
            <div className="adm-col-6">
              <h4 style={{ fontSize: '13px', fontWeight: 700, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <User size={14} strokeWidth={2} /> Buyer Details
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
                <InfoRow icon={User} label="Name" value={ticket?.buyer_name} />
                <InfoRow icon={Mail} label="Email" value={ticket?.buyer_email} />
                <InfoRow icon={Phone} label="Phone" value={ticket?.buyer_phone} />
                <InfoRow icon={DollarSign} label="Amount" value={v.extracted_amount ? `$${v.extracted_amount}` : 'N/A'} />
                <InfoRow icon={FileText} label="Reference" value={v.extracted_ref || 'N/A'} mono />
              </div>

              <h4 style={{ fontSize: '13px', fontWeight: 700, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Calendar size={14} strokeWidth={2} /> Event Details
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <InfoRow icon={Calendar} label="Event" value={event?.event_name} />
                <InfoRow icon={MapPin} label="Venue" value={event?.venue} />
                <InfoRow icon={Calendar} label="Date" value={event?.date ? new Date(event.date).toLocaleDateString() : 'N/A'} />
                <InfoRow icon={Clock} label="Submitted" value={new Date(v.created_at).toLocaleString()} />
              </div>
            </div>

            {/* Right: Screenshot & Actions */}
            <div className="adm-col-6">
              {/* Screenshot Preview */}
              {v.screenshot_data && (
                <div style={{ marginBottom: '20px' }}>
                  <h4 style={{ fontSize: '13px', fontWeight: 700, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Camera size={14} strokeWidth={2} /> Payment Screenshot
                  </h4>
                  <div
                    onClick={() => setShowScreenshot(true)}
                    style={{
                      position: 'relative', borderRadius: '12px', overflow: 'hidden',
                      border: '1px solid var(--border-secondary)',
                      cursor: 'pointer',
                    }}
                  >
                    <img
                      src={v.screenshot_data}
                      alt="Payment screenshot"
                      style={{ width: '100%', maxHeight: '250px', objectFit: 'contain', display: 'block' }}
                    />
                    <div style={{
                      position: 'absolute', bottom: 0, left: 0, right: 0,
                      background: 'linear-gradient(transparent, rgba(0,0,0,0.8))',
                      padding: '20px 12px 8px', display: 'flex', alignItems: 'center', gap: '6px',
                    }}>
                      <ZoomIn size={14} strokeWidth={2} style={{ color: 'white' }} />
                      <span style={{ color: 'white', fontSize: '12px', fontWeight: 600 }}>Click to zoom</span>
                    </div>
                  </div>
                </div>
              )}

              {/* OCR Details */}
              <div style={{
                background: 'var(--bg-glass-light, rgba(255,255,255,0.03))',
                borderRadius: '12px', padding: '16px', marginBottom: '20px',
                border: '1px solid var(--border-secondary)',
              }}>
                <h4 style={{ fontSize: '13px', fontWeight: 700, marginBottom: '10px' }}>OCR Extraction Details</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-tertiary)' }}>Type</span>
                    <span style={{ fontWeight: 600 }}>{type.label}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-tertiary)' }}>Confidence</span>
                    <span style={{ fontWeight: 600, color: confidence > 70 ? '#10b981' : '#f59e0b' }}>{confidence}%</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-tertiary)' }}>Extracted Ref</span>
                    <code style={{ fontWeight: 700, color: '#10b981', fontFamily: 'var(--font-mono, monospace)' }}>{v.extracted_ref || 'None'}</code>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-tertiary)' }}>Extracted Amount</span>
                    <span style={{ fontWeight: 600 }}>${v.extracted_amount || 'N/A'}</span>
                  </div>
                  {v.extracted_phone && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-tertiary)' }}>Phone</span>
                      <span style={{ fontWeight: 600 }}>{v.extracted_phone}</span>
                    </div>
                  )}
                  {v.notes && (
                    <div style={{ marginTop: '8px', padding: '8px', background: 'rgba(59,130,246,0.08)', borderRadius: '8px' }}>
                      <span style={{ color: 'var(--text-tertiary)', fontSize: '11px' }}>Notes:</span>
                      <p style={{ margin: '4px 0 0', fontSize: '12px', lineHeight: 1.5 }}>{v.notes}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              {v.status === 'pending' && (
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleAction('verified'); }}
                    disabled={actionLoading}
                    style={{
                      flex: 1, padding: '12px', borderRadius: '10px', border: 'none',
                      background: 'linear-gradient(135deg, #10b981, #06b6d4)',
                      color: 'white', fontWeight: 700, fontSize: '13px', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                    }}
                  >
                    <CheckCircle2 size={16} strokeWidth={2} />
                    {actionLoading ? 'Approving...' : 'Approve'}
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleAction('rejected'); }}
                    disabled={actionLoading}
                    style={{
                      flex: 1, padding: '12px', borderRadius: '10px', border: 'none',
                      background: 'linear-gradient(135deg, #ef4444, #f97316)',
                      color: 'white', fontWeight: 700, fontSize: '13px', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                    }}
                  >
                    <XCircle size={16} strokeWidth={2} />
                    {actionLoading ? 'Rejecting...' : 'Reject'}
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleAction('needs_review'); }}
                    disabled={actionLoading}
                    style={{
                      flex: 1, padding: '12px', borderRadius: '10px', border: 'none',
                      background: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
                      color: 'white', fontWeight: 700, fontSize: '13px', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                    }}
                  >
                    <AlertTriangle size={16} strokeWidth={2} />
                    {actionLoading ? 'Flagging...' : 'Flag'}
                  </button>
                </div>
              )}

              {v.status === 'verified' && (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  padding: '12px', borderRadius: '10px',
                  background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)',
                }}>
                  <CheckCircle2 size={18} strokeWidth={2} style={{ color: '#10b981' }} />
                  <span style={{ color: '#10b981', fontWeight: 600, fontSize: '13px' }}>Payment verified — ticket is active</span>
                </div>
              )}

              {v.status === 'rejected' && (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  padding: '12px', borderRadius: '10px',
                  background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
                }}>
                  <XCircle size={18} strokeWidth={2} style={{ color: '#ef4444' }} />
                  <span style={{ color: '#ef4444', fontWeight: 600, fontSize: '13px' }}>Payment rejected — ticket remains pending</span>
                </div>
              )}

              {v.status === 'needs_review' && (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  padding: '12px', borderRadius: '10px',
                  background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.3)',
                }}>
                  <AlertTriangle size={18} strokeWidth={2} style={{ color: '#8b5cf6' }} />
                  <span style={{ color: '#8b5cf6', fontWeight: 600, fontSize: '13px' }}>Flagged for manual review</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Full-screen Screenshot Modal */}
      {showScreenshot && v.screenshot_data && (
        <div
          onClick={() => setShowScreenshot(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            background: 'rgba(0,0,0,0.9)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '40px', cursor: 'zoom-out',
          }}
        >
          <button
            onClick={() => setShowScreenshot(false)}
            style={{
              position: 'absolute', top: '20px', right: '20px',
              background: 'rgba(255,255,255,0.1)', border: 'none',
              borderRadius: '10px', padding: '10px', cursor: 'pointer',
              color: 'white',
            }}
          >
            <X size={20} strokeWidth={2} />
          </button>
          <img
            src={v.screenshot_data}
            alt="Payment screenshot full size"
            style={{ maxWidth: '90%', maxHeight: '90vh', objectFit: 'contain', borderRadius: '12px' }}
          />
        </div>
      )}
    </>
  );
}

function InfoRow({ icon: Icon, label, value, mono }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <Icon size={13} strokeWidth={2} style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} />
      <span style={{ fontSize: '12px', color: 'var(--text-tertiary)', width: '70px', flexShrink: 0 }}>{label}</span>
      <span style={{
        fontSize: '12px', fontWeight: 600,
        fontFamily: mono ? 'var(--font-mono, monospace)' : 'inherit',
        color: mono ? '#10b981' : 'var(--text-primary)',
        wordBreak: 'break-all',
      }}>
        {value || 'N/A'}
      </span>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, color, gradient }) {
  return (
    <div className="adm-kpi-card" style={{ '--kpi-accent': gradient }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div className="adm-kpi-label">{label}</div>
          <div className="adm-kpi-value" style={{
            background: gradient,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>
            {value}
          </div>
        </div>
        <div className="adm-kpi-icon" style={{ background: gradient, opacity: 0.9 }}>
          <Icon size={21} strokeWidth={2} />
        </div>
      </div>
    </div>
  );
}

export default function PaymentVerifications() {
  const router = useRouter();
  const [verifications, setVerifications] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);

  const fetchVerifications = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        status: statusFilter,
        type: typeFilter,
        page: String(page),
        limit: '20',
      });
      const res = await fetch(`/api/admin/payment-verifications?${params}`);
      const data = await res.json();
      setVerifications(data.verifications || []);
      setStats(data.stats || null);
      setPagination(data.pagination || null);
    } catch (err) {
      console.error('Failed to fetch verifications:', err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchVerifications();
  }, [statusFilter, typeFilter, page]);

  const handleAction = async (id, action) => {
    try {
      const res = await fetch('/api/admin/payment-verifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: action }),
      });
      const data = await res.json();
      if (data.success) {
        fetchVerifications(); // Refresh the list
      }
    } catch (err) {
      console.error('Action failed:', err);
    }
  };

  return (
    <AdminLayout title="Payment Verifications">
      {/* Header */}
      <div className="adm-section-header fade-in-up">
        <div>
          <h1 className="adm-section-title">Payment Verifications</h1>
          <p className="adm-section-sub">Review screenshots and verify EcoCash payments</p>
        </div>
        <button className="adm-export-btn" onClick={fetchVerifications}>
          <RefreshCw size={15} strokeWidth={2} /> Refresh
        </button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="adm-kpi-grid stagger-children" style={{ marginBottom: '24px' }}>
          <StatCard label="Total" value={stats.total} icon={FileText} gradient="linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)" />
          <StatCard label="Pending Review" value={stats.pending} icon={Clock} gradient="linear-gradient(135deg, #f59e0b 0%, #f97316 100%)" />
          <StatCard label="Verified" value={stats.verified} icon={CheckCircle2} gradient="linear-gradient(135deg, #10b981 0%, #06b6d4 100%)" />
          <StatCard label="Rejected" value={stats.rejected} icon={XCircle} gradient="linear-gradient(135deg, #ef4444 0%, #f97316 100%)" />
          <StatCard label="Needs Review" value={stats.needs_review} icon={AlertTriangle} gradient="linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)" />
          <StatCard label="Screenshot OCR" value={stats.screenshot_ocr} icon={Camera} gradient="linear-gradient(135deg, #0ea5e9 0%, #6366f1 100%)" />
        </div>
      )}

      {/* Filters */}
      <div style={{
        display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap',
        alignItems: 'center',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Filter size={14} strokeWidth={2} style={{ color: 'var(--text-tertiary)' }} />
          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-tertiary)' }}>Status:</span>
        </div>
        {['all', 'pending', 'verified', 'rejected', 'needs_review'].map(s => (
          <button
            key={s}
            onClick={() => { setStatusFilter(s); setPage(1); }}
            style={{
              padding: '6px 14px', borderRadius: '8px', border: 'none',
              background: statusFilter === s ? 'var(--accent-primary, #10b981)' : 'var(--bg-glass-light, rgba(255,255,255,0.05))',
              color: statusFilter === s ? 'white' : 'var(--text-secondary)',
              fontWeight: 600, fontSize: '12px', cursor: 'pointer',
              textTransform: 'capitalize',
            }}
          >
            {s === 'all' ? 'All' : s.replace('_', ' ')}
          </button>
        ))}

        <div style={{ width: '1px', height: '24px', background: 'var(--border-secondary)', margin: '0 4px' }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-tertiary)' }}>Type:</span>
        </div>
        {['all', 'screenshot_ocr', 'manual_ref', 'admin_review'].map(t => (
          <button
            key={t}
            onClick={() => { setTypeFilter(t); setPage(1); }}
            style={{
              padding: '6px 14px', borderRadius: '8px', border: 'none',
              background: typeFilter === t ? 'var(--accent-primary, #10b981)' : 'var(--bg-glass-light, rgba(255,255,255,0.05))',
              color: typeFilter === t ? 'white' : 'var(--text-secondary)',
              fontWeight: 600, fontSize: '12px', cursor: 'pointer',
              textTransform: 'capitalize',
            }}
          >
            {t === 'all' ? 'All' : t.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Verification Cards */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="adm-chart-card">
              <div className="adm-skeleton" style={{ width: '200px', height: '16px', marginBottom: '12px' }} />
              <div className="adm-skeleton" style={{ width: '300px', height: '12px' }} />
            </div>
          ))}
        </div>
      ) : verifications.length === 0 ? (
        <div className="adm-chart-card">
          <div className="adm-empty">
            <div className="adm-empty-icon"><Inbox size={34} strokeWidth={1.5} /></div>
            <div className="adm-empty-title">No Payment Verifications</div>
            <div className="adm-empty-desc">
              {statusFilter === 'all'
                ? 'No payment verifications have been submitted yet. Customers will upload screenshots when paying via EcoCash.'
                : `No ${statusFilter.replace('_', ' ')} verifications found. Try a different filter.`
              }
            </div>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }} className="stagger-children">
          {verifications.map(v => (
            <VerificationCard key={v.id} v={v} onAction={handleAction} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.pages > 1 && (
        <div style={{
          display: 'flex', justifyContent: 'center', alignItems: 'center',
          gap: '8px', marginTop: '24px',
        }}>
          <button
            disabled={page <= 1}
            onClick={() => setPage(p => p - 1)}
            style={{
              padding: '8px 16px', borderRadius: '8px', border: 'none',
              background: page <= 1 ? 'var(--bg-glass-light)' : 'var(--accent-primary, #10b981)',
              color: page <= 1 ? 'var(--text-tertiary)' : 'white',
              fontWeight: 600, fontSize: '13px', cursor: page <= 1 ? 'not-allowed' : 'pointer',
            }}
          >
            Previous
          </button>
          <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            Page {page} of {pagination.pages}
          </span>
          <button
            disabled={page >= pagination.pages}
            onClick={() => setPage(p => p + 1)}
            style={{
              padding: '8px 16px', borderRadius: '8px', border: 'none',
              background: page >= pagination.pages ? 'var(--bg-glass-light)' : 'var(--accent-primary, #10b981)',
              color: page >= pagination.pages ? 'var(--text-tertiary)' : 'white',
              fontWeight: 600, fontSize: '13px', cursor: page >= pagination.pages ? 'not-allowed' : 'pointer',
            }}
          >
            Next
          </button>
        </div>
      )}
    </AdminLayout>
  );
}

PaymentVerifications.getLayout = (page) => page;
