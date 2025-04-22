import { createContext, ReactNode, useContext } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";
import { getQueryFn, apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useWebAuth } from "@/hooks/use-web-auth";

// Interfaces para el carrito
interface Product {
  id: number;
  name: string;
  description: string | null;
  price: string;
  imageUrl: string | null;
  category: string | null;
  inStock: boolean;
  baseUnit: string;
}

interface CartItem {
  id: number;
  productId: number;
  cartId: number;
  quantity: string;
  price: string;
  unit: string;
  product?: Product;
}

interface Cart {
  id: number;
  userId: number | null;
  items: CartItem[];
  itemCount: number;
  totalAmount: number;
  createdAt: string;
  updatedAt: string;
}

interface AddToCartData {
  productId: number;
  quantity: string;
  unit: string;
}

type CartContextType = {
  cart: Cart | null;
  isLoading: boolean;
  error: Error | null;
  totalItems: number;
  addToCartMutation: UseMutationResult<Cart, Error, AddToCartData>;
  removeFromCartMutation: UseMutationResult<Cart, Error, number>;
  clearCartMutation: UseMutationResult<void, Error, void>;
};

export const CartContext = createContext<CartContextType | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const { user } = useWebAuth();
  
  const {
    data: cart,
    error,
    isLoading,
  } = useQuery<Cart | undefined, Error>({
    queryKey: ["/api/web/cart"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  // Número total de artículos en el carrito
  const totalItems = cart?.itemCount || 0;

  // Añadir producto al carrito
  const addToCartMutation = useMutation({
    mutationFn: async (data: AddToCartData) => {
      const res = await apiRequest("POST", "/api/web/cart/items", data);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Error al agregar al carrito");
      }
      return await res.json();
    },
    onSuccess: (updatedCart: Cart) => {
      queryClient.setQueryData(["/api/web/cart"], updatedCart);
    },
    onError: (error: Error) => {
      toast({
        title: "Error al agregar al carrito",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Eliminar producto del carrito
  const removeFromCartMutation = useMutation({
    mutationFn: async (itemId: number) => {
      const res = await apiRequest("DELETE", `/api/web/cart/items/${itemId}`);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Error al eliminar del carrito");
      }
      return await res.json();
    },
    onSuccess: (updatedCart: Cart) => {
      queryClient.setQueryData(["/api/web/cart"], updatedCart);
      toast({
        title: "Producto eliminado",
        description: "El producto ha sido eliminado del carrito",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error al eliminar del carrito",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Vaciar el carrito
  const clearCartMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("DELETE", "/api/web/cart");
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Error al vaciar el carrito");
      }
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/web/cart"], { ...cart, items: [], itemCount: 0, totalAmount: 0 });
      toast({
        title: "Carrito vacío",
        description: "Tu carrito ha sido vaciado",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error al vaciar el carrito",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <CartContext.Provider
      value={{
        cart: cart ?? null,
        isLoading,
        error,
        totalItems,
        addToCartMutation,
        removeFromCartMutation,
        clearCartMutation,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart debe usarse dentro de un CartProvider");
  }
  return context;
}