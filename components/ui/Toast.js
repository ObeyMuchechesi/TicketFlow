import { createContext, useCallback, useContext, useEffect, useState } from 'react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, exiting: true } : t)));
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 300);
  }, []);

  const showToast = useCallback((toast) => {
    const id = Date.now() + Math.random();
    const newToast = {
      id,
      title: '',
      message: '',
      variant: 'info',
      duration: 4000,
      ...toast,
    };
    setToasts((prev) => [...prev, newToast]);
    if (newToast.duration > 0) {
      setTimeout(() => removeToast(id), newToast.duration);
    }
    return id;
  }, [removeToast]);

  const ctx = {
    showToast,
    success: (title, message) => showToast({ title, message, variant: 'success' }),
    error: (title, message) => showToast({ title, message, variant: 'error' }),
    warning: (title, message) => showToast({ title, message, variant: 'warning' }),
    info: (title, message) => showToast({ title, message, variant: 'info' }),
    remove: removeToast,
  };

  return (
    <ToastContext.Provider value={ctx}>
      {children}
      <div className="toast-container" role="region" aria-label="Notifications">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`toast toast-${t.variant} ${t.exiting ? 'toast-exit' : ''}`}
            role={t.variant === 'error' ? 'alert' : 'status'}
          >
            {t.icon !== null && (
              <div className="toast-icon">
                {t.icon ?? ({
                  success: '✅',
                  error: '❌',
                  warning: '⚠️',
                  info: 'ℹ️',
                }[t.variant])}
              </div>
            )}
            <div className="toast-content">
              {t.title && <div className="toast-title">{t.title}</div>}
              {t.message && <div className="toast-message">{t.message}</div>}
            </div>
            <button
              className="toast-close"
              onClick={() => removeToast(t.id)}
              aria-label="Dismiss"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  return ctx;
}
