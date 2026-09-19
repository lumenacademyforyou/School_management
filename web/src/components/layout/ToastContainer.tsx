import React from 'react';
import { useApp } from '../../context/AppContext';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useApp();

  // The live region stays mounted even with nothing in it: a region inserted at the same moment as its
  // first message is not reliably announced.
  return (
    <div
      className="fixed bottom-4 right-4 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none"
      role="log"
      aria-live="polite"
      aria-relevant="additions"
      aria-label="Notifications"
    >
      {toasts.map(toast => {
        const isSuccess = toast.type === 'success';
        const isError = toast.type === 'error';
        const isWarning = toast.type === 'warning';

        return (
          <div
            key={toast.id}
            role={isError || isWarning ? 'alert' : undefined}
            className={`pointer-events-auto flex flex-col rounded-xl shadow-xl ring-1 text-xs transition-all duration-200 slide-in-from-bottom-2 overflow-hidden ${
              isError ? 'bg-rose-950 text-rose-50 ring-rose-800' : 'bg-lumen-900 text-cream-100 ring-white/10'
            }`}
          >
            <div className="flex items-start gap-3 p-3.5">
              <span
                className={`material-symbols-outlined text-lg shrink-0 mt-0.5 ${
                  isError
                    ? 'text-rose-400'
                    : isWarning
                    ? 'text-gold-300'
                    : isSuccess
                    ? 'text-emerald-300'
                    : 'text-lumen-300'
                }`}
              >
                {isError ? 'report' : isWarning ? 'warning' : isSuccess ? 'check_circle' : 'info'}
              </span>
              <div className="flex-1">
                <div className="font-semibold text-white">{toast.title}</div>
                {toast.description && (
                  <div className="text-[11px] text-cream-200/80 mt-0.5 leading-relaxed">{toast.description}</div>
                )}
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                aria-label={`Dismiss notification: ${toast.title}`}
                className="text-white/60 hover:text-white p-0.5 transition-colors"
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>
            {/* Auto-dismiss progress bar */}
            <div className="h-0.5 w-full">
              <div
                className={`h-full animate-toast-progress ${
                  isError
                    ? 'bg-rose-500/60'
                    : isWarning
                    ? 'bg-gold-400/70'
                    : isSuccess
                    ? 'bg-emerald-400/60'
                    : 'bg-lumen-400/60'
                }`}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};
