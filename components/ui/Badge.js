const VARIANTS = {
  primary: 'tf-badge-primary',
  success: 'tf-badge-success',
  warning: 'tf-badge-warning',
  danger: 'tf-badge-error',
  info: 'tf-badge-primary',
  glass: 'tf-badge-glass',
  ghost: 'tf-badge-glass',
};

export default function Badge({
  children,
  variant = 'primary',
  className = '',
  style = {},
  icon,
  ...rest
}) {
  return (
    <span
      className={`tf-badge ${VARIANTS[variant] || ''} ${className}`.trim()}
      style={style}
      {...rest}
    >
      {icon && <span>{icon}</span>}
      {children}
    </span>
  );
}
