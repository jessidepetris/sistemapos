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
  total: string;
  unit: string;
  productName: string;
  product?: Product;
}

interface Cart {
  id: number;
  userId: number | null;
  sessionId: string;
  status: string;
  totalItems: number;
  totalAmount: string;
  createdAt: Date;
  updatedAt: Date;
}

interface AddToCartData {
  productId: number;
  quantity: string;
  unit: string;
}

type CartContextType = {
  cart: Cart | null;
  cartItems: CartItem[];
  isLoading: boolean;
  error: Error | null;
  totalItems: number;
  addToCartMutation: UseMutationResult<Cart, Error, AddToCartData>;
  removeFromCartMutation: UseMutationResult<Cart, Error, number>;
  clearCartMutation: UseMutationResult<void, Error, void>;
  clearCart: () => Promise<void>;
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
  const totalItems = cart?.totalItems || 0;
  
  // Obtención de items del carrito
  const { data: cartItems = [] } = useQuery<CartItem[]>({
    queryKey: ["/api/web/cart/items"],
    queryFn: async () => {
      // Usamos withCredentials para asegurar que se envíen las cookies
      const response = await fetch(`/api/web/cart/items`, {
        credentials: 'include', // Importante: envía las cookies con la solicitud
        headers: {
          'Accept': 'application/json'
        }
      });
      console.log('Respuesta de fetch carrito:', response.status);
      if (!response.ok) return [];
      const data = await response.json();
      console.log('Datos de items del carrito:', data);
      return data;
    },
    enabled: !!cart,
  });

  // Añadir producto al carrito
  const addToCartMutation = useMutation({
    mutationFn: async (data: AddToCartData) => {
      console.log('Enviando datos al carrito:', data);
      // Usamos fetch directamente para tener más control sobre la petición
      const res = await fetch("/api/web/cart/items", {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(data),
        credentials: 'include' // Importante: incluye las cookies
      });
      console.log('Respuesta de agregar al carrito:', res.status);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Error al agregar al carrito");
      }
      const responseData = await res.json();
      console.log('Datos de respuesta al agregar al carrito:', responseData);
      return responseData;
    },
    onSuccess: (data) => {
      // Invalidar consultas para forzar recargas de datos
      queryClient.reactQuery.invalidateQueries({ queryKey: ["/api/web/cart"] });
      queryClient.reactQuery.invalidateQueries({ queryKey: ["/api/web/cart/items"] });
      
      toast({
        title: "Producto agregado",
        description: "El producto ha sido agregado al carrito",
      });
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
    onSuccess: () => {
      // Invalidar consultas para forzar recargas de datos
      queryClient.reactQuery.invalidateQueries({ queryKey: ["/api/web/cart"] });
      queryClient.reactQuery.invalidateQueries({ queryKey: ["/api/web/cart/items"] });
      
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
      // Si el servidor indica que no hay carrito activo, tratamos la respuesta
      // como éxito para mantener un comportamiento idempotente
      if (!res.ok && res.status !== 404) {
        const error = await res.json();
        throw new Error(error.message || "Error al vaciar el carrito");
      }
    },
    onSuccess: () => {
      queryClient.reactQuery.setQueryData(["/api/web/cart"], { ...cart, items: [], itemCount: 0, totalAmount: 0 });
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

  // Función para limpiar el carrito
  const clearCart = async (): Promise<void> => {
    try {
      await clearCartMutation.mutateAsync();
      queryClient.reactQuery.invalidateQueries({ queryKey: ["/api/web/cart"] });
      queryClient.reactQuery.invalidateQueries({ queryKey: ["/api/web/cart/items"] });
    } catch (error) {
      console.error("Error al limpiar el carrito:", error);
      throw error;
    }
  };

  return (
    <CartContext.Provider
      value={{
        cart: cart ?? null,
        cartItems,
        isLoading,
        error,
        totalItems,
        addToCartMutation,
        removeFromCartMutation,
        clearCartMutation,
        clearCart,
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
