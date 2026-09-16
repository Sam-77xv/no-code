'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { CheckCircle2, XCircle, AlertTriangle, Info } from 'lucide-react';

interface ToastMessage {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
}

interface ToastContextType {
  toasts: ToastMessage[];
  addToast: (message: string, type?: 'success' | 'error' | 'warning' | 'info', title?: string) => void;
  removeToast: (id: string) => void;
  clearToasts: () => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

const toastIcons = {
  success: CheckCircle2,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};

const toastColors = {
  success: 'bg-green-500/20 text-green-500 border-green-500/30',
  error: 'bg-red-500/20 text-red-500 border-red-500/30',
  warning: 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30',
  info: 'bg-blue-500/20 text-blue-500 border-blue-500/30',
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback((message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info', title?: string) => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    setToasts(prev => [...prev, { id, title: title || type.charAt(0).toUpperCase() + type.slice(1), message, type }]);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 5000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const clearToasts = useCallback(() => {
    setToasts([]);
  }, []);

  const value: ToastContextType = {
    toasts,
    addToast,
    removeToast,
    clearToasts,
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      
      {/* Toast Container */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map((toast) => {
          const Icon = toastIcons[toast.type];
          const colors = toastColors[toast.type];
          return (
            <div
              key={toast.id}
              className={`flex items-start gap-3 p-4 rounded border ${colors} animate-in slide-in-from-bottom-2 duration-300`}
            >
              <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-medium text-sm">{toast.title}</h4>
                <p className="text-sm opacity-80">{toast.message}</p>
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="text-xs opacity-50 hover:opacity-100"
              >
                Dismiss
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
