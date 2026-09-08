import PropTypes from 'prop-types';
import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { LuCircleAlert, LuCircleCheck, LuInfo, LuX } from 'react-icons/lu';

const ToastContext = createContext(null);

const tones = {
  success: { icon: LuCircleCheck, className: 'border-success-600/40 text-success-700', iconClass: 'text-success-600' },
  error: { icon: LuCircleAlert, className: 'border-danger-600/40 text-danger-700', iconClass: 'text-danger-600' },
  info: { icon: LuInfo, className: 'border-pine-300 text-ink', iconClass: 'text-pine-600' },
};

/** Short confirmations in the bottom-right corner. Use `useToast()` to show one. */
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const counter = useRef(0);

  const dismiss = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const show = useCallback(
    (message, { tone = 'info', duration = 4000 } = {}) => {
      const id = ++counter.current;
      setToasts((current) => [...current, { id, message, tone }]);
      if (duration > 0) {
        setTimeout(() => dismiss(id), duration);
      }
      return id;
    },
    [dismiss],
  );

  const api = useMemo(
    () => ({
      show,
      success: (message, options) => show(message, { ...options, tone: 'success' }),
      error: (message, options) => show(message, { ...options, tone: 'error', duration: 7000 }),
      info: (message, options) => show(message, { ...options, tone: 'info' }),
      dismiss,
    }),
    [show, dismiss],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-[60] flex w-80 flex-col gap-2" aria-live="polite">
        {toasts.map((toast) => {
          const { icon: Icon, className, iconClass } = tones[toast.tone] || tones.info;
          return (
            <div
              key={toast.id}
              role="status"
              className={`pointer-events-auto flex items-start gap-3 rounded-md border bg-surface px-3.5 py-3 text-small shadow-pop ${className}`}
            >
              <Icon size={18} className={`mt-px shrink-0 ${iconClass}`} aria-hidden />
              <p className="flex-1">{toast.message}</p>
              <button
                type="button"
                onClick={() => dismiss(toast.id)}
                aria-label="Dismiss"
                className="-mr-1 -mt-0.5 rounded-sm p-1 text-ink-faint hover:text-ink"
              >
                <LuX size={14} aria-hidden />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

ToastProvider.propTypes = {
  children: PropTypes.node,
};

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used inside ToastProvider');
  }
  return context;
}
