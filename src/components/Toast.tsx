import { useEffect, useState, useCallback } from 'react';
import { registerToastHandler } from '../lib/toast';

interface ToastMessage {
  id: number;
  text: string;
  type: 'error' | 'success' | 'info';
}

let nextId = 0;

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback((text: string, type: ToastMessage['type'] = 'info') => {
    const id = nextId++;
    setToasts(prev => [...prev, { id, text, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  }, []);

  useEffect(() => {
    registerToastHandler(addToast);
    return () => { registerToastHandler(null); };
  }, [addToast]);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-6 right-6 z-50 flex flex-col gap-3 pointer-events-none">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className={`
            pointer-events-auto px-6 py-4 rounded-xl font-semibold text-sm
            shadow-2xl border backdrop-blur-sm cursor-pointer
            animate-toast-in
            ${toast.type === 'error'
              ? 'bg-red-950/90 border-red-800 text-red-200'
              : toast.type === 'success'
                ? 'bg-green-950/90 border-green-800 text-green-200'
                : 'bg-neutral-800/90 border-neutral-700 text-neutral-200'
            }
          `}
          onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
        >
          {toast.text}
        </div>
      ))}
    </div>
  );
}
