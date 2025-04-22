import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useWebAuth } from "./use-web-auth";

type Product = {
  id: number;
  name: string;
  description: string | null;
  price: string;
  imageUrl: string | null;
  baseUnit: string;
  conversionRates: any;
  category: string | null;
  inStock: boolean;
  isRefrigerated: boolean;
};

type CartItem = {
  id: number;
  cartId: number;
  productId: number;
  quantity: string;
  unit: string;
  price: string;
  notes: string | null;
  product?: Product;
};

type Cart = {
  id: number;
  webUserId: number | null;
  sessionId: string | null;
  status: string;
  totalItems: number;
  totalAmount: string;
  items: CartItem[];
};

type AddToCartData = {
  productId: number;
  quantity: string;
  unit: string;
  notes?: string;
};

type CartContextType = {
  cart: Cart | null;
  isLoading: boolean;
  error: Error | null;
  addToCartMutation: any;
  removeFromCartMutation: any;
  createCartMutation: any;
  cartId: number | null;
  totalItems: number;
  totalAmount: number;
};

export const CartContext = createContext<CartContextType | null>(null);

const SESSION_ID_KEY = 'web_cart_session';
const CART_ID_KEY = 'web_cart_id';

function getOrCreateSessionId() {
  let sessionId = localStorage.getItem(SESSION_ID_KEY);
  if (!sessionId) {
    sessionId = Math.random().toString(36).substring(2, 15);
    localStorage.setItem(SESSION_ID_KEY, sessionId);
  }
  return sessionId;
}

export function CartProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const { user } = useWebAuth();
  const [cartId, setCartId] = useState<number | null>(null);
  
  // Cargar ID del carrito desde localStorage al inicio
  useEffect(() => {
    const savedCartId = localStorage.getItem(CART_ID_KEY);
    if (savedCartId) {
      setCartId(parseInt(savedCartId));
    }
  }, []);

  // Mutación para crear un nuevo carrito
  const createCartMutation = useMutation({
    mutationFn: async () => {
      const sessionId = getOrCreateSessionId();
      const res = await apiRequest("POST", "/api/web/carts", {
        webUserId: user?.id || null,
        sessionId: sessionId
      });
      return await res.json();
    },
    onSuccess: (newCart: Cart) => {
      setCartId(newCart.id);
      localStorage.setItem(CART_ID_KEY, newCart.id.toString());
      queryClient.invalidateQueries({ queryKey: ['/api/web/carts', cartId] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error al crear carrito",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Obtener carrito actual
  const { 
    data: cart, 
    isLoading, 
    error 
  } = useQuery({
    queryKey: ['/api/web/carts', cartId],
    queryFn: async () => {
      if (!cartId) return null;
      const res = await apiRequest("GET", `/api/web/carts/${cartId}`);
      return await res.json();
    },
    enabled: !!cartId,
  });

  // Mutación para agregar producto al carrito
  const addToCartMutation = useMutation({
    mutationFn: async (data: AddToCartData) => {
      // Si no hay carrito, crear uno primero
      if (!cartId) {
        const sessionId = getOrCreateSessionId();
        const cartRes = await apiRequest("POST", "/api/web/carts", {
          webUserId: user?.id || null,
          sessionId: sessionId
        });
        const newCart = await cartRes.json();
        setCartId(newCart.id);
        localStorage.setItem(CART_ID_KEY, newCart.id.toString());
        
        // Luego agregar el producto al nuevo carrito
        const itemRes = await apiRequest("POST", "/api/web/cart-items", {
          cartId: newCart.id,
          ...data
        });
        return await itemRes.json();
      } else {
        // Agregar al carrito existente
        const res = await apiRequest("POST", "/api/web/cart-items", {
          cartId,
          ...data
        });
        return await res.json();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/web/carts', cartId] });
      toast({
        title: "Producto agregado",
        description: "El producto ha sido agregado al carrito",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error al agregar producto",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mutación para quitar producto del carrito
  const removeFromCartMutation = useMutation({
    mutationFn: async (itemId: number) => {
      const res = await apiRequest("DELETE", `/api/web/cart-items/${itemId}`);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/web/carts', cartId] });
      toast({
        title: "Producto eliminado",
        description: "El producto ha sido eliminado del carrito",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error al eliminar producto",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const totalItems = cart?.totalItems || 0;
  const totalAmount = cart?.totalAmount ? parseFloat(cart.totalAmount) : 0;

  return (
    <CartContext.Provider
      value={{
        cart,
        isLoading,
        error,
        addToCartMutation,
        removeFromCartMutation,
        createCartMutation,
        cartId,
        totalItems,
        totalAmount
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}