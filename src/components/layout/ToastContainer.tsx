import React from 'react';
import { useApp } from '../../context/AppContext';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useApp();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
      {toasts.map(toast => {
        const isSuccess = toast.type === 'success';
        const isError = toast.type === 'error';
        const isWarning = toast.type === 'warning';

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex flex-col rounded-xl shadow-xl border text-xs transition-all duration-200 slide-in-from-bottom-2 overflow-hidden ${
              isError
                ? 'bg-rose-950 text-rose-100 border-rose-800'
                : isWarning
                ? 'bg-amber-950 text-amber-100 border-amber-800'
                : isSuccess
                ? 'bg-emerald-950 text-emerald-100 border-emerald-800'
                : 'bg-[#082b3d] text-[#e0f2fe] border-[#213145]'
            }`}
          >
            <div className="flex items-start gap-3 p-3.5">
              <span
                className={`material-symbols-outlined text-lg shrink-0 mt-0.5 ${
                  isError
                    ? 'text-rose-400'
                    : isWarning
                    ? 'text-amber-400'
                    : isSuccess
                    ? 'text-emerald-400'
                    : 'text-[#f59e0b]'
                }`}
              >
                {isError ? 'report' : isWarning ? 'warning' : isSuccess ? 'check_circle' : 'info'}
              </span>
              <div className="flex-1">
                <div className="font-bold">{toast.title}</div>
                {toast.description && (
                  <div className="text-[11px] opacity-90 mt-0.5 leading-relaxed">{toast.description}</div>
                )}
              </div>
              <button
                onClick={() => removeToast(toast.id)}
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
                    ? 'bg-amber-500/60'
                    : isSuccess
                    ? 'bg-emerald-500/60'
                    : 'bg-[#f59e0b]/60'
                }`}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};
