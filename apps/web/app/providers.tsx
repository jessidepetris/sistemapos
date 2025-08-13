'use client';
import { SessionProvider } from 'next-auth/react';
import { ReactNode } from 'react';
import { CartProvider } from './cart-context';
import { Toaster } from 'react-hot-toast';

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <CartProvider>
        {children}
        <Toaster position="top-right" />
      </CartProvider>
    </SessionProvider>
  );
}
