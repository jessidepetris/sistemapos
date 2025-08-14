'use client';
import { SessionProvider } from 'next-auth/react';
import { ReactNode, useEffect, useState } from 'react';
import { CartProvider } from './cart-context';
import { Toaster } from 'react-hot-toast';
import { syncPendingSales, pendingSalesCount } from '../lib/offline-sales';

export default function Providers({ children }: { children: ReactNode }) {
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [pending, setPending] = useState(0);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js');
    }
    const handler = (e: any) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    const interval = setInterval(() => {
      if (navigator.onLine) {
        syncPendingSales();
      }
      pendingSalesCount().then(setPending);
    }, 10000);
    pendingSalesCount().then(setPending);
    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      clearInterval(interval);
    };
  }, []);

  const install = async () => {
    await installPrompt.prompt();
    await installPrompt.userChoice;
    setInstallPrompt(null);
  };

  return (
    <SessionProvider>
      <CartProvider>
        {children}
        {pending > 0 && !navigator.onLine && (
          <div className="fixed top-0 inset-x-0 bg-yellow-500 text-black text-center p-2">
            Modo offline: {pending} ventas en cola
          </div>
        )}
        {installPrompt && (
          <button
            onClick={install}
            className="fixed bottom-4 right-4 bg-blue-600 text-white px-4 py-2 rounded"
          >
            Instalar app
          </button>
        )}
        <Toaster position="top-right" />
      </CartProvider>
    </SessionProvider>
  );
}
