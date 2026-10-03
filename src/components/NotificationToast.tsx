import React from 'react';
import { Bot, X, CheckCircle2, ArrowDownLeft, ArrowUpRight } from 'lucide-react';

export interface ToastAlert {
  id: string;
  title: string;
  message: string;
  type: 'deposit' | 'withdraw' | 'transfer' | 'bot' | 'info';
  amount?: number;
}

interface NotificationToastProps {
  toasts: ToastAlert[];
  onDismiss: (id: string) => void;
}

export const NotificationToast: React.FC<NotificationToastProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-16 sm:top-20 right-2 sm:right-4 left-2 sm:left-auto max-w-full sm:max-w-sm z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="pointer-events-auto rounded-2xl bg-white dark:bg-[#2b2d31] border border-slate-200 dark:border-zinc-700 shadow-xl p-3.5 flex items-start gap-3 animate-in slide-in-from-top-4 duration-200"
        >
          <div className="w-9 h-9 rounded-xl bg-[#5865F2] text-white flex items-center justify-center flex-shrink-0">
            <Bot className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-slate-900 dark:text-white truncate">
                {toast.title}
              </span>
              <button
                onClick={() => onDismiss(toast.id)}
                className="text-slate-400 hover:text-slate-600 p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-zinc-300 mt-0.5">
              {toast.message}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};
