export default function Progress({
  value = 0,
  max = 100,
  color,
  showLabel = false,
  className = '',
  style = {},
  height = 6,
}) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));

  return (
    <div style={{ ...style }} className={className}>
      <div className="tf-progress" style={{ height: `${height}px` }}>
        <div
          className="tf-progress-bar"
          style={{
            width: `${pct}%`,
            background: color ? `linear-gradient(135deg, ${color}, ${color}cc)` : undefined,
          }}
        />
      </div>
      {showLabel && (
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginTop: '6px',
          fontSize: '11px',
          color: 'var(--text-tertiary)',
          fontWeight: 600,
        }}>
          <span>{value} / {max}</span>
          <span>{Math.round(pct)}%</span>
        </div>
      )}
    </div>
  );
}
