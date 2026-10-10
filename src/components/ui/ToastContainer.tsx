import React from 'react';
import { useToast } from '../../context/ToastContext';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2.5 max-w-md w-full pointer-events-none px-4 sm:px-0">
      {toasts.map((toast) => {
        const isSuccess = toast.type === 'success';
        const isError = toast.type === 'error';
        const isWarning = toast.type === 'warning';

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border shadow-lg backdrop-blur-xs transition-all duration-200 animate-in slide-in-from-bottom-3 ${
              isSuccess
                ? 'bg-emerald-900/95 text-white border-emerald-700'
                : isError
                ? 'bg-rose-900/95 text-white border-rose-700'
                : isWarning
                ? 'bg-amber-900/95 text-white border-amber-700'
                : 'bg-slate-900/95 text-white border-slate-700'
            }`}
          >
            <div className="shrink-0 mt-0.5">
              {isSuccess && <CheckCircle2 className="w-5 h-5 text-emerald-300" />}
              {isError && <AlertCircle className="w-5 h-5 text-rose-300" />}
              {isWarning && <AlertTriangle className="w-5 h-5 text-amber-300" />}
              {toast.type === 'info' && <Info className="w-5 h-5 text-sky-300" />}
            </div>
            <div className="flex-1 min-w-0">
              {toast.title && <h5 className="text-sm font-semibold mb-0.5">{toast.title}</h5>}
              <p className="text-xs text-slate-100 leading-relaxed break-words">{toast.message}</p>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="shrink-0 text-slate-300 hover:text-white p-1 rounded-md transition-colors"
              aria-label="Dismiss toast"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
