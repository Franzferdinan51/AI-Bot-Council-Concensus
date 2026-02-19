import React, { useState, useEffect } from 'react';

interface ToastProps {
    message: string;
    type?: 'success' | 'error' | 'info' | 'warning';
    duration?: number;
}

let globalRemove: ((id: number) => void) | null = null;

export const useToast = () => {
    const [toasts, setToasts] = useState<{id: number, message: string, type: string}[]>([]);
    
    useEffect(() => {
        globalRemove = (id: number) => {
            setToasts(prev => prev.filter(t => t.id !== id));
        };
    }, []);
    
    const addToast = (message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info') => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => {
            globalRemove?.(id);
        }, 4000);
    };
    
    return { toasts, addToast };
};

export const ToastContainer: React.FC<{toasts: {id: number, message: string, type: string}[]}> = ({ toasts }) => {
    if (toasts.length === 0) return null;
    
    const colors: Record<string, string> = {
        success: 'bg-green-900/90 border-green-500',
        error: 'bg-red-900/90 border-red-500',
        info: 'bg-blue-900/90 border-blue-500',
        warning: 'bg-amber-900/90 border-amber-500',
    };
    
    const icons: Record<string, string> = {
        success: '✓',
        error: '✕',
        info: 'ℹ',
        warning: '⚠',
    };
    
    return (
        <div className="fixed bottom-4 right-4 z-50 space-y-2">
            {toasts.map(toast => (
                <div key={toast.id} className={`${colors[toast.type]} border rounded-lg px-4 py-3 shadow-xl flex items-center gap-3 animate-slide-in-right`}>
                    <span className="text-lg">{icons[toast.type]}</span>
                    <span className="text-sm font-medium">{toast.message}</span>
                    <button onClick={() => globalRemove?.(toast.id)} className="ml-2 hover:opacity-70">✕</button>
                </div>
            ))}
        </div>
    );
};
