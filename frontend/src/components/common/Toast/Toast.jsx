import { useEffect } from 'react';
import { create } from 'zustand';

export const useToastStore = create((set) => ({
  toasts: [],
  addToast: (toast) =>
    set((s) => ({
      toasts: [
        ...s.toasts,
        {
          id: Date.now() + Math.random(),
          type: toast.type || 'info',
          message: toast.message,
          duration: toast.duration || 4000,
        },
      ],
    })),
  removeToast: (id) =>
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

export const toast = {
  success: (message) =>
    useToastStore.getState().addToast({ type: 'success', message }),
  error: (message) =>
    useToastStore.getState().addToast({
      type: 'error',
      message: message || 'Something went wrong. Please try again.',
    }),
  info: (message) =>
    useToastStore.getState().addToast({ type: 'info', message }),
};

const ICONS = {
  success: '✓',
  error: '✕',
  info: 'ℹ',
};

const STYLES = {
  success: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
  error: 'bg-red-500/10 border-red-500/20 text-red-400',
  info: 'bg-blue-500/10 border-blue-500/20 text-blue-400',
};

const ICON_STYLES = {
  success: 'bg-emerald-500 text-white',
  error: 'bg-red-500 text-white',
  info: 'bg-blue-500 text-white',
};

function ToastItem({ toast: t, onRemove }) {
  useEffect(() => {
    const timer = setTimeout(() => onRemove(t.id), t.duration);
    return () => clearTimeout(timer);
  }, [t.id, t.duration, onRemove]);

  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 rounded-xl border backdrop-blur-sm shadow-lg animate-slideDown ${STYLES[t.type]}`}
    >
      <span
        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${ICON_STYLES[t.type]}`}
      >
        {ICONS[t.type]}
      </span>
      <p className="text-sm font-medium text-[var(--text-primary)] flex-1">
        {t.message}
      </p>
      <button
        type="button"
        onClick={() => onRemove(t.id)}
        className="text-[var(--text-muted)] hover:text-[var(--text-secondary)] text-lg leading-none shrink-0"
      >
        &times;
      </button>
    </div>
  );
}

export default function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts);
  const removeToast = useToastStore((s) => s.removeToast);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[var(--z-toast)] flex flex-col gap-2 w-80 max-w-[calc(100vw-2rem)]">
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onRemove={removeToast} />
      ))}
    </div>
  );
}

