import React, { useState, useEffect } from 'react';

interface ToastProps {
    message: string;
    type?: 'success' | 'error' | 'info' | 'warning';
    onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message, type = 'info', onClose }) => {
    useEffect(() => {
        const timer = setTimeout(onClose, 4000);
        return () => clearTimeout(timer);
    }, [onClose]);

    const colors = {
        success: 'bg-green-900/90 border-green-500 text-green-200',
        error: 'bg-red-900/90 border-red-500 text-red-200',
        info: 'bg-blue-900/90 border-blue-500 text-blue-200',
        warning: 'bg-amber-900/90 border-amber-500 text-amber-200',
    };

    return (
        <div className={`fixed bottom-4 left-1/2 -translate-x-1/2 z-50 animate-slide-up ${colors[type]} border rounded-lg px-4 py-3 shadow-xl backdrop-blur-sm flex items-center gap-3`}>
            <span className="text-sm font-medium">{message}</span>
            <button onClick={onClose} className="hover:opacity-80">✕</button>
        </div>
    );
};

// Toast container component
interface ToastMessage {
    id: number;
    message: string;
    type: 'success' | 'error' | 'info' | 'warning';
}

interface ToastContainerProps {
    toasts: ToastMessage[];
    onRemove: (id: number) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onRemove }) => {
    return (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 space-y-2">
            {toasts.map(toast => (
                <Toast 
                    key={toast.id} 
                    message={toast.message} 
                    type={toast.type} 
                    onClose={() => onRemove(toast.id)} 
                />
            ))}
        </div>
    );
};
