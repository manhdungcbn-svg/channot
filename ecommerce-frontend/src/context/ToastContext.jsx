import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { Close } from '../components/icons';
import { cn } from '../utils/cn';

/**
 * Hệ thống toast nhỏ — góc trên phải, tự ẩn sau 3 giây.
 */

const ToastContext = createContext(null);

const TONES = {
  success: 'border-status-success/40 bg-white',
  error: 'border-status-danger/40 bg-white',
  info: 'border-status-info/40 bg-white',
};

const ICON_TONES = {
  success: 'bg-status-success-bg text-status-success-text',
  error: 'bg-status-danger-bg text-status-danger-text',
  info: 'bg-status-info-bg text-status-info-text',
};

let toastSeq = 0;

/**
 * @param {object} props
 * @param {import('react').ReactNode} props.children
 */
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timers = useRef(new Map());

  const dismiss = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const show = useCallback(
    (message, options = {}) => {
      const { tone = 'info', duration = 3000, action } = options;
      toastSeq += 1;
      const id = `toast-${toastSeq}`;
      setToasts((current) => [...current, { id, message, tone, action }]);
      const timer = setTimeout(() => dismiss(id), duration);
      timers.current.set(id, timer);
      return id;
    },
    [dismiss],
  );

  const value = useMemo(() => ({ show, dismiss }), [show, dismiss]);

  return (
    <ToastContext.Provider value={value}>
      {children}

      <div
        className="pointer-events-none fixed right-4 top-4 z-[90] flex w-[min(360px,calc(100vw-2rem))] flex-col gap-2"
        role="status"
        aria-live="polite"
        aria-atomic="false"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={cn(
              'pointer-events-auto flex items-start gap-3 rounded-xl border px-3.5 py-3 shadow-lg',
              TONES[toast.tone] ?? TONES.info,
            )}
          >
            <span
              className={cn(
                'mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-2xs font-bold',
                ICON_TONES[toast.tone] ?? ICON_TONES.info,
              )}
              aria-hidden="true"
            >
              {toast.tone === 'error' ? '!' : '✓'}
            </span>
            <p className="min-w-0 flex-1 text-sm font-medium text-ink-900 text-pretty">
              {toast.message}
            </p>
            {toast.action ? (
              <button
                type="button"
                onClick={() => {
                  toast.action.onClick?.();
                  dismiss(toast.id);
                }}
                className="shrink-0 rounded-md px-2 py-1 text-xs font-semibold text-brand-600 transition-colors duration-150 hover:bg-brand-50"
              >
                {toast.action.label}
              </button>
            ) : null}
            <button
              type="button"
              aria-label="Đóng thông báo"
              onClick={() => dismiss(toast.id)}
              className="-mr-1 -mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-ink-300 transition-colors duration-150 hover:bg-surface-hover hover:text-ink-700"
            >
              <Close className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

/**
 * Hook truy cập toast.
 * @returns {{show: Function, dismiss: Function}}
 */
export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast phải được dùng bên trong <ToastProvider>.');
  }
  return context;
}

export { ToastContext };

export default ToastProvider;
