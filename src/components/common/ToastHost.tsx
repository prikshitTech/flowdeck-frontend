import { memo, useEffect } from 'react';
import { FiAlertCircle, FiCheckCircle, FiInfo, FiX } from 'react-icons/fi';

import { dismissToast, type Toast } from '@/store/slices/uiSlice';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { cn } from '@/utils/cn';

const VISIBLE_FOR_MS = 4000;

const ICONS = {
  success: <FiCheckCircle className="text-green-600" />,
  error: <FiAlertCircle className="text-red-600" />,
  info: <FiInfo className="text-sky-600" />
};

const ToastItem = memo(function ToastItem({ toast }: { toast: Toast }) {
  const dispatch = useAppDispatch();

  useEffect(() => {
    const timer = window.setTimeout(() => dispatch(dismissToast(toast.id)), VISIBLE_FOR_MS);
    return () => window.clearTimeout(timer);
  }, [dispatch, toast.id]);

  return (
    <div
      role={toast.tone === 'error' ? 'alert' : 'status'}
      className={cn(
        'flex w-full items-start gap-3 rounded-md border bg-white px-4 py-3 text-sm shadow-sm sm:w-80',
        'border-stone-200 dark:border-stone-700 dark:bg-stone-900'
      )}
    >
      <span className="mt-0.5">{ICONS[toast.tone]}</span>
      <p className="flex-1">{toast.message}</p>
      <button
        type="button"
        aria-label="Dismiss"
        className="text-stone-400 hover:text-stone-700"
        onClick={() => dispatch(dismissToast(toast.id))}
      >
        <FiX />
      </button>
    </div>
  );
});

export default function ToastHost() {
  const toasts = useAppSelector((state) => state.ui.toasts);

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[60] flex flex-col items-center gap-2 p-4 sm:items-end">
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto w-full sm:w-auto">
          <ToastItem toast={toast} />
        </div>
      ))}
    </div>
  );
}
