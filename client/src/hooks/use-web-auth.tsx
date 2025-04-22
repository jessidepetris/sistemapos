import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { useMutation, useQuery, UseMutationResult } from "@tanstack/react-query";
import { apiRequest, queryClient } from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type WebUser = {
  id: number;
  email: string;
  customerId: number | null;
  verified: boolean;
  customer?: {
    name: string;
    address: string;
    phone: string;
  };
  token?: string;
};

type LoginData = {
  email: string;
  password: string;
};

type RegisterData = {
  email: string;
  password: string;
  name: string;
  address: string;
  phone: string;
  city: string;
  province: string;
};

type WebAuthContextType = {
  user: WebUser | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: UseMutationResult<WebUser, Error, LoginData>;
  logoutMutation: UseMutationResult<void, Error, void>;
  registerMutation: UseMutationResult<WebUser, Error, RegisterData>;
};

export const WebAuthContext = createContext<WebAuthContextType | null>(null);

const LOCAL_STORAGE_KEY = 'web_user';

export function WebAuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const [storedUser, setStoredUser] = useState<WebUser | null>(null);
  
  // Cargar el usuario desde localStorage al inicio
  useEffect(() => {
    const savedUser = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (savedUser) {
      try {
        setStoredUser(JSON.parse(savedUser));
      } catch (error) {
        console.error("Error parsing stored user", error);
        localStorage.removeItem(LOCAL_STORAGE_KEY);
      }
    }
  }, []);

  // No usamos useQuery aquí porque la autenticación web es basada en localStorage,
  // no en sesiones del servidor como la autenticación regular
  
  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginData) => {
      const res = await apiRequest("POST", "/api/web/login", credentials);
      return await res.json();
    },
    onSuccess: (user: WebUser) => {
      setStoredUser(user);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(user));
      toast({
        title: "Inicio de sesión exitoso",
        description: `Bienvenido, ${user.customer?.name || user.email}`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error de inicio de sesión",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: RegisterData) => {
      const res = await apiRequest("POST", "/api/web/register", data);
      return await res.json();
    },
    onSuccess: (user: WebUser) => {
      toast({
        title: "Registro exitoso",
        description: "Tu cuenta ha sido creada. Ahora puedes iniciar sesión.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error de registro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      // En esta implementación, el logout es local
      // No hay una llamada al servidor porque usamos almacenamiento local
    },
    onSuccess: () => {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
      setStoredUser(null);
      queryClient.invalidateQueries({ queryKey: ['/api/web/user'] });
      toast({
        title: "Sesión cerrada",
        description: "Has cerrado sesión exitosamente",
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
        user: storedUser,
        isLoading: false,
        error: null,
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
    throw new Error("useWebAuth must be used within a WebAuthProvider");
  }
  return context;
}