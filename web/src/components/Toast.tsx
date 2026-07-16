import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { CheckIcon, CloseIcon } from './icons';

type ToastVariant = 'success' | 'error' | 'info';

interface Toast {
  id: number;
  message: string;
  variant: ToastVariant;
}

interface ToastContextValue {
  toast: (message: string, variant?: ToastVariant) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const counter = useRef(0);

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((item) => item.id !== id));
  }, []);

  const toast = useCallback(
    (message: string, variant: ToastVariant = 'success') => {
      const id = ++counter.current;
      setToasts((current) => [...current, { id, message, variant }]);
      window.setTimeout(() => dismiss(id), 3500);
    },
    [dismiss],
  );

  const value = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="pointer-events-none fixed inset-x-0 top-4 z-[100] flex flex-col items-center gap-2 px-4"
        role="region"
        aria-label="通知"
        aria-live="polite"
      >
        {toasts.map((item) => (
          <div
            key={item.id}
            className="toast-in pointer-events-auto flex max-w-sm items-center gap-3 rounded-[var(--radius)] border border-line bg-surface px-4 py-3 shadow-[var(--shadow-pop)]"
          >
            <span
              className={`flex size-6 shrink-0 items-center justify-center rounded-full text-white ${
                item.variant === 'error'
                  ? 'bg-danger'
                  : item.variant === 'info'
                    ? 'bg-ink'
                    : 'bg-gold'
              }`}
            >
              {item.variant === 'error' ? (
                <CloseIcon size={14} />
              ) : (
                <CheckIcon size={14} />
              )}
            </span>
            <p className="text-sm text-ink">{item.message}</p>
            <button
              type="button"
              onClick={() => dismiss(item.id)}
              className="ml-1 text-ink-faint hover:text-ink"
              aria-label="關閉通知"
            >
              <CloseIcon size={16} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used inside a ToastProvider');
  return context;
}
