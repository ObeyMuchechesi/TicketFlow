const VARIANTS = {
  text: 'skeleton-text',
  title: 'skeleton-title',
  card: 'skeleton-card',
  circle: 'skeleton-circle',
  btn: 'skeleton-btn',
  custom: '',
};

export default function Skeleton({
  variant = 'text',
  width,
  height,
  className = '',
  style = {},
  count = 1,
}) {
  if (count > 1) {
    return (
      <>
        {Array.from({ length: count }).map((_, i) => (
          <Skeleton
            key={i}
            variant={variant}
            width={width}
            height={height}
            className={className}
            style={{ ...style, marginBottom: i < count - 1 ? '8px' : undefined }}
          />
        ))}
      </>
    );
  }

  return (
    <div
      className={`tf-skeleton ${VARIANTS[variant] || ''} ${className}`.trim()}
      style={{
        width,
        height,
        minHeight: variant === 'text' ? '16px' : variant === 'title' ? '28px' : variant === 'card' ? '200px' : variant === 'circle' ? '48px' : undefined,
        borderRadius: variant === 'circle' ? '50%' : variant === 'card' ? 'var(--radius-lg)' : 'var(--radius-sm)',
        ...style,
      }}
    />
  );
}
