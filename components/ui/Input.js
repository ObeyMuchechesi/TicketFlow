export default function Input({
  label,
  error,
  helper,
  className = '',
  style = {},
  wrapperStyle = {},
  id,
  ...rest
}) {
  return (
    <div className="tf-field" style={wrapperStyle}>
      {label && (
        <label
          htmlFor={id}
          style={{
            display: 'block',
            fontSize: '0.85rem',
            fontWeight: 600,
            color: 'var(--text-secondary)',
            marginBottom: '8px',
          }}
        >
          {label}
        </label>
      )}
      <input
        id={id}
        className={`tf-input ${error ? 'tf-input-error' : ''} ${className}`.trim()}
        style={{
          borderColor: error ? 'var(--error)' : undefined,
          ...style,
        }}
        aria-invalid={!!error}
        {...rest}
      />
      {error ? (
        <p style={{ fontSize: '12px', color: 'var(--error)', marginTop: '6px' }}>
          {error}
        </p>
      ) : helper ? (
        <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '6px' }}>
          {helper}
        </p>
      ) : null}
    </div>
  );
}
