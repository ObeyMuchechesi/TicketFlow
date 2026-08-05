export default function Card({
  children,
  className = '',
  style = {},
  hoverable = true,
  glass = true,
  lift = true,
  accent = false,
  onClick,
  ...rest
}) {
  const classes = [
    glass ? 'glass-card' : 'tf-card',
    lift ? 'card-lift' : '',
    accent ? 'card-accent-border' : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <div
      className={classes}
      style={{
        cursor: onClick ? 'pointer' : undefined,
        ...style,
      }}
      onClick={onClick}
      {...rest}
    >
      {children}
    </div>
  );
}
