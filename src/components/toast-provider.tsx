'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
    id: string;
    type: ToastType;
    message: string;
}

interface ToastContextType {
    toasts: Toast[];
    showToast: (type: ToastType, message: string) => void;
    dismissToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
}

const toastConfig = {
    success: {
        icon: CheckCircle,
        bg: 'bg-[#22c55e]/20',
        border: 'border-[#22c55e]',
        text: 'text-[#22c55e]',
    },
    error: {
        icon: XCircle,
        bg: 'bg-red-500/20',
        border: 'border-red-500',
        text: 'text-red-500',
    },
    warning: {
        icon: AlertTriangle,
        bg: 'bg-[#eab308]/20',
        border: 'border-[#eab308]',
        text: 'text-[#eab308]',
    },
    info: {
        icon: Info,
        bg: 'bg-blue-500/20',
        border: 'border-blue-500',
        text: 'text-blue-500',
    },
};

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const showToast = useCallback((type: ToastType, message: string) => {
        const id = Date.now().toString();
        setToasts(prev => [...prev, { id, type, message }]);

        // Auto dismiss after 3 seconds
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 3000);
    }, []);

    const dismissToast = useCallback((id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    return (
        <ToastContext.Provider value={{ toasts, showToast, dismissToast }}>
            {children}

            {/* Toast Container */}
            <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2">
                {toasts.map(toast => {
                    const config = toastConfig[toast.type];
                    const Icon = config.icon;

                    return (
                        <div
                            key={toast.id}
                            className={`flex items-center gap-3 px-4 py-3 rounded-lg border ${config.bg} ${config.border} shadow-lg backdrop-blur-sm animate-slide-in min-w-[300px] max-w-[400px]`}
                        >
                            <Icon size={20} className={config.text} />
                            <span className="flex-1 text-sm text-white">{toast.message}</span>
                            <button
                                onClick={() => dismissToast(toast.id)}
                                className="text-slate-400 hover:text-white"
                            >
                                <X size={16} />
                            </button>
                        </div>
                    );
                })}
            </div>
        </ToastContext.Provider>
    );
}
