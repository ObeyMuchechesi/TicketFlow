import { useRef } from 'react';

const VARIANTS = {
  primary: 'tf-btn-primary',
  secondary: 'tf-btn-secondary',
  ghost: 'tf-btn-ghost',
  danger: 'tf-btn-danger',
  success: 'tf-btn-success',
};

const SIZES = {
  sm: 'tf-btn-sm',
  md: '',
  lg: 'tf-btn-lg',
  icon: 'tf-btn-icon',
};

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  onClick,
  disabled,
  loading,
  className = '',
  style = {},
  type = 'button',
  fullWidth,
  ...rest
}) {
  const ref = useRef(null);

  function handleMouseDown(e) {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    ref.current.style.setProperty('--x', `${x}px`);
    ref.current.style.setProperty('--y', `${y}px`);
  }

  const classes = ['tf-btn', VARIANTS[variant] || '', SIZES[size] || '', className].filter(Boolean).join(' ');

  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      onMouseDown={handleMouseDown}
      className={classes}
      style={{
        width: fullWidth ? '100%' : undefined,
        opacity: disabled ? 0.5 : undefined,
        ...style,
      }}
      {...rest}
    >
      {loading && (
        <span style={{
          width: '14px',
          height: '14px',
          border: '2px solid currentColor',
          borderTopColor: 'transparent',
          borderRadius: '50%',
          animation: 'spin-slow 0.8s linear infinite',
          display: 'inline-block',
        }} />
      )}
      {!loading && children}
    </button>
  );
}
