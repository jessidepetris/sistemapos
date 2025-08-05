'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

interface CartItem {
  product: any;
  quantity: number;
}

interface CartContextValue {
  items: CartItem[];
  addItem: (product: any) => void;
  updateQuantity: (id: number, qty: number) => void;
  clear: () => void;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  const addItem = (product: any) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      if (existing) {
        return prev.map((i) =>
          i.product.id === product.id
            ? { ...i, quantity: i.quantity + 1 }
            : i,
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const updateQuantity = (id: number, qty: number) => {
    setItems((prev) => prev.map((i) => (i.product.id === id ? { ...i, quantity: qty } : i)));
  };

  const clear = () => setItems([]);

  return (
    <CartContext.Provider value={{ items, addItem, updateQuantity, clear }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
