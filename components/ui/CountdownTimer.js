import { useEffect, useState } from 'react';

function compute(target) {
  const diff = new Date(target).getTime() - Date.now();
  if (diff <= 0) return null;
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
    minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
    seconds: Math.floor((diff % (1000 * 60)) / 1000),
    totalMs: diff,
  };
}

export default function CountdownTimer({
  target,
  compact = false,
  label,
  accent,
  onExpire,
}) {
  // Start with null (SSR-safe) and compute only after mount to avoid
  // server/client hydration mismatches from Date.now().
  const [time, setTime] = useState(null);

  useEffect(() => {
    setTime(compute(target));
    const iv = setInterval(() => {
      const next = compute(target);
      setTime(next);
      if (!next && onExpire) onExpire();
    }, 1000);
    return () => clearInterval(iv);
  }, [target, onExpire]);

  if (time === null) {
    return (
      <div style={{
        padding: compact ? '8px 14px' : '12px 20px',
        borderRadius: 'var(--radius-md)',
        background: 'rgba(16, 185, 129, 0.08)',
        color: 'var(--success)',
        fontWeight: 700,
        fontSize: compact ? '12px' : '14px',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        minWidth: compact ? 0 : '120px',
      }}>
        ⏳
      </div>
    );
  }

  if (!time) {
    return (
      <div style={{
        padding: compact ? '8px 14px' : '12px 20px',
        borderRadius: 'var(--radius-md)',
        background: 'rgba(16, 185, 129, 0.12)',
        color: 'var(--success)',
        fontWeight: 700,
        fontSize: compact ? '12px' : '14px',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
      }}>
        {label || 'Happening Now'}
      </div>
    );
  }

  const parts = [
    { k: 'days', l: 'Days' },
    { k: 'hours', l: 'Hrs' },
    { k: 'minutes', l: 'Min' },
    { k: 'seconds', l: 'Sec' },
  ];

  if (compact) {
    const d = time.days;
    const h = time.hours;
    const text = d > 0 ? `${d}d ${h}h` : `${h}h ${time.minutes}m`;
    const urgent = time.totalMs < 3 * 24 * 60 * 60 * 1000;
    return (
      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '4px 10px',
        borderRadius: '8px',
        background: urgent ? 'rgba(239, 68, 68, 0.12)' : 'rgba(59, 130, 246, 0.12)',
        color: urgent ? '#fca5a5' : accent || 'var(--info)',
        fontSize: '11px',
        fontWeight: 800,
        letterSpacing: '0.5px',
        border: `1px solid ${urgent ? 'rgba(239, 68, 68, 0.2)' : 'rgba(59, 130, 246, 0.2)'}`,
      }}>
        {urgent ? '⏳' : '📅'} {text}
      </span>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {label && (
        <div style={{
          fontSize: '11px',
          textTransform: 'uppercase',
          letterSpacing: '2px',
          color: 'var(--text-tertiary)',
          fontWeight: 800,
        }}>
          {label}
        </div>
      )}
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        {parts.map(p => (
          <div key={p.k} className="tf-countdown-item">
            <span className="tf-countdown-value" style={{ color: accent }}>
              {time[p.k].toString().padStart(2, '0')}
            </span>
            <span className="tf-countdown-label">{p.l}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
