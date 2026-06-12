/**
 * Toast.jsx
 * ─────────────────────────────────────────────────
 * Toast notification system — renders a fixed
 * container in the bottom-right corner with
 * auto-dismissing, animated toast messages.
 *
 * Uses the toasts array from AppContext.
 * ─────────────────────────────────────────────────
 */

import { useEffect, useState, useCallback } from 'react';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Info,
  X,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

/* ============================================================
   Toast Type Configuration
   ============================================================ */

const TOAST_TYPES = {
  success: {
    icon: CheckCircle2,
    bgClass: 'bg-secondary-50 border-secondary-200',
    iconColorClass: 'text-secondary-500',
    titleColorClass: 'text-secondary-800',
    messageColorClass: 'text-secondary-700',
    progressClass: 'bg-secondary-400',
  },
  error: {
    icon: XCircle,
    bgClass: 'bg-red-50 border-red-200',
    iconColorClass: 'text-red-500',
    titleColorClass: 'text-red-800',
    messageColorClass: 'text-red-700',
    progressClass: 'bg-red-400',
  },
  warning: {
    icon: AlertTriangle,
    bgClass: 'bg-accent-50 border-accent-200',
    iconColorClass: 'text-accent-500',
    titleColorClass: 'text-accent-800',
    messageColorClass: 'text-accent-700',
    progressClass: 'bg-accent-400',
  },
  info: {
    icon: Info,
    bgClass: 'bg-blue-50 border-blue-200',
    iconColorClass: 'text-blue-500',
    titleColorClass: 'text-blue-800',
    messageColorClass: 'text-blue-700',
    progressClass: 'bg-blue-400',
  },
};

/** Auto-dismiss duration in ms */
const TOAST_DURATION = 5000;

/* ============================================================
   Individual Toast Component
   ============================================================ */

/**
 * SingleToast — renders one toast notification with
 * progress bar and dismiss button.
 */
function SingleToast({ toast, onDismiss }) {
  const [isExiting, setIsExiting] = useState(false);
  const [progress, setProgress] = useState(100);

  const config = TOAST_TYPES[toast.type] || TOAST_TYPES.info;
  const IconComponent = config.icon;

  // Animate progress bar countdown
  useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 100 - (elapsed / TOAST_DURATION) * 100);
      setProgress(remaining);

      if (remaining <= 0) {
        clearInterval(interval);
      }
    }, 50);

    return () => clearInterval(interval);
  }, []);

  /** Handle dismiss with exit animation */
  const handleDismiss = useCallback(() => {
    setIsExiting(true);
    setTimeout(() => {
      onDismiss(toast.id);
    }, 300); // Match the exit animation duration
  }, [onDismiss, toast.id]);

  return (
    <div
      id={toast.id}
      role="alert"
      aria-live="assertive"
      className={
        `relative w-80 rounded-xl border shadow-lg overflow-hidden ` +
        `${config.bgClass} ` +
        `${isExiting
          ? 'animate-[toast-slide-out_0.3s_ease-in_forwards]'
          : 'animate-[toast-slide-in_0.3s_ease-out]'
        }`
      }
    >
      {/* Content row */}
      <div className="flex items-start gap-3 p-4">
        {/* Icon */}
        <div className={`flex-shrink-0 mt-0.5 ${config.iconColorClass}`}>
          <IconComponent size={20} />
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0">
          {toast.title && (
            <p className={`text-sm font-semibold ${config.titleColorClass}`}>
              {toast.title}
            </p>
          )}
          {toast.message && (
            <p className={`text-sm mt-0.5 ${config.messageColorClass} ${!toast.title ? 'font-medium' : ''}`}>
              {toast.message}
            </p>
          )}
        </div>

        {/* Close button */}
        <button
          onClick={handleDismiss}
          className={
            `flex-shrink-0 p-1 rounded-lg transition-colors duration-150 ` +
            `hover:bg-black/5 cursor-pointer ` +
            `${config.iconColorClass} opacity-60 hover:opacity-100`
          }
          aria-label="Dismiss notification"
        >
          <X size={16} />
        </button>
      </div>

      {/* Progress bar */}
      <div className="h-1 w-full bg-black/5">
        <div
          className={`h-full ${config.progressClass} transition-all duration-100 ease-linear`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

/* ============================================================
   Toast Container Component
   ============================================================ */

/**
 * ToastContainer — fixed bottom-right container that
 * renders all active toasts from AppContext.
 *
 * Place this component once at the root of your app.
 */
export default function ToastContainer() {
  const { toasts, removeToast } = useApp();

  if (toasts.length === 0) return null;

  return (
    <div
      id="toast-container"
      aria-label="Notifications"
      className={
        `fixed bottom-6 right-6 z-[100] ` +
        `flex flex-col gap-3 ` +
        `pointer-events-none`
      }
    >
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <SingleToast toast={toast} onDismiss={removeToast} />
        </div>
      ))}
    </div>
  );
}
