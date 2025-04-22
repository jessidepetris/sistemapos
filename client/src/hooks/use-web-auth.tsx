import { createContext, ReactNode, useContext } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";
import { getQueryFn, apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// Interfaces para los usuarios web
interface WebUser {
  id: number;
  name: string;
  email: string;
  address: string | null;
  phone: string | null;
  city: string | null;
  province: string | null;
}

interface LoginData {
  username: string;
  password: string;
}

interface RegisterData {
  name: string;
  email: string;
  password: string;
  address: string;
  phone: string;
  city: string;
  province: string;
}

type WebAuthContextType = {
  user: WebUser | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: UseMutationResult<WebUser, Error, LoginData>;
  logoutMutation: UseMutationResult<void, Error, void>;
  registerMutation: UseMutationResult<WebUser, Error, RegisterData>;
};

export const WebAuthContext = createContext<WebAuthContextType | null>(null);

export function WebAuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  
  const {
    data: user,
    error,
    isLoading,
  } = useQuery<WebUser | undefined, Error>({
    queryKey: ["/api/web/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginData) => {
      const res = await apiRequest("POST", "/api/web/login", credentials);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Error al iniciar sesión");
      }
      return await res.json();
    },
    onSuccess: (user: WebUser) => {
      queryClient.setQueryData(["/api/web/user"], user);
      toast({
        title: "Sesión iniciada",
        description: `Bienvenido/a, ${user.name}`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error al iniciar sesión",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (userData: RegisterData) => {
      const res = await apiRequest("POST", "/api/web/register", userData);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Error al registrarse");
      }
      return await res.json();
    },
    onSuccess: (user: WebUser) => {
      queryClient.setQueryData(["/api/web/user"], user);
      toast({
        title: "Registro exitoso",
        description: `Bienvenido/a, ${user.name}`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error al registrarse",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/web/logout");
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Error al cerrar sesión");
      }
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/web/user"], null);
      toast({
        title: "Sesión cerrada",
        description: "Has cerrado sesión correctamente",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error al cerrar sesión",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <WebAuthContext.Provider
      value={{
        user: user ?? null,
        isLoading,
        error,
        loginMutation,
        logoutMutation,
        registerMutation,
      }}
    >
      {children}
    </WebAuthContext.Provider>
  );
}

export function useWebAuth() {
  const context = useContext(WebAuthContext);
  if (!context) {
    throw new Error("useWebAuth debe usarse dentro de un WebAuthProvider");
  }
  return context;
}