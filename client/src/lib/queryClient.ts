import { QueryClient, QueryFunction } from "@tanstack/react-query";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    try {
      const text = await res.text();
      console.error("Error en la respuesta HTTP:", {
        status: res.status,
        statusText: res.statusText,
        contentType: res.headers.get("content-type"),
        responseText: text.substring(0, 500) // Mostramos los primeros 500 caracteres
      });
      
      if (res.headers.get("content-type")?.includes("application/json")) {
        throw new Error(`${res.status}: ${JSON.parse(text).message || text}`);
      } else {
        throw new Error(`${res.status}: Error de respuesta no JSON - ${res.statusText}`);
      }
    } catch (parseError) {
      console.error("Error al procesar la respuesta:", parseError);
      throw new Error(`${res.status}: ${res.statusText} - Error al procesar la respuesta`);
    }
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  console.log(`ApiRequest: ${method} ${url}`, data ? JSON.stringify(data) : 'Sin datos');
  
  try {
    const res = await fetch(url, {
      method,
      headers: data ? { 
        "Content-Type": "application/json",
        "Accept": "application/json"
      } : {
        "Accept": "application/json"
      },
      body: data ? JSON.stringify(data) : undefined,
      credentials: "include", // Enviar cookies con la solicitud
    });

    console.log(`ApiRequest respuesta: ${res.status}, Content-Type: ${res.headers.get("content-type")}`);
    
    // Verificamos si es un problema de autenticación
    if (res.status === 401) {
      const errorData = await res.json();
      console.error("Error de autenticación:", errorData);
      
      // Si es un error de sesión expirada, intentar renovar
      if (errorData.code === "SESSION_EXPIRED") {
        try {
          const refreshRes = await fetch('/api/refresh-session', {
            method: 'POST',
            credentials: 'include',
            headers: {
              "Accept": "application/json"
            }
          });
          
          if (refreshRes.ok) {
            // Si la renovación fue exitosa, reintentar la petición original
            return apiRequest(method, url, data);
          }
        } catch (refreshError) {
          console.error('Error al renovar la sesión:', refreshError);
        }
      }
      
      // Si no se pudo renovar o no era un error de sesión expirada, redirigir al login
      window.location.href = '/auth';
      throw new Error(errorData.message || 'La sesión ha expirado. Por favor, inicie sesión nuevamente.');
    }
    
    // Si la respuesta tiene código de éxito pero el tipo de contenido es HTML,
    // probablemente sea una redirección o página de error
    if (res.ok && res.headers.get("content-type")?.includes("text/html")) {
      console.warn("Advertencia: Se recibió HTML en una respuesta exitosa. Posible redirección o problema de sesión.");
      window.location.href = '/auth';
      throw new Error('Error de sesión. Por favor, inicie sesión nuevamente.');
    }
    
    return res;
  } catch (error) {
    console.error("Error en la petición:", error);
    throw error;
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn = <T>(options: {
  on401: UnauthorizedBehavior;
}): QueryFunction<T> =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey[0] as string, {
      credentials: "include",
    });

    if (options.on401 === "returnNull" && res.status === 401) {
      return null as T;
    }

    await throwIfResNotOk(res);
    return (await res.json()) as T;
  };

export const queryClient = {
  // React Query client
  reactQuery: new QueryClient({
    defaultOptions: {
      queries: {
        queryFn: getQueryFn({ on401: "throw" }),
        refetchInterval: false,
        refetchOnWindowFocus: true,
        staleTime: 30000,
        retry: false,
      },
      mutations: {
        retry: false,
      },
    },
  }),

  // API client methods
  async get<T>(endpoint: string): Promise<T> {
    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          console.error("Authentication error - Session may have expired");
          window.location.href = "/auth-page";
          throw new Error("Session expired");
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return response.json();
    } catch (error) {
      console.error("Error in GET request:", error);
      throw error;
    }
  },

  async post<T>(endpoint: string, data: any): Promise<T> {
    try {
      console.log("Making POST request to:", endpoint);
      console.log("With data:", data);
      
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      console.log("Response status:", response.status);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error("Error response:", errorData);
        
        if (response.status === 401) {
          if (errorData.code === "SESSION_EXPIRED") {
            console.error("Session expired - Attempting to refresh session");
            // Intentar renovar la sesión
            try {
              const refreshResponse = await fetch(`${API_URL}/api/refresh-session`, {
                method: "POST",
                credentials: "include",
                headers: {
                  "Content-Type": "application/json",
                }
              });
              
              if (refreshResponse.ok) {
                // Si la renovación fue exitosa, reintentar la petición original
                return this.post(endpoint, data);
              }
            } catch (refreshError) {
              console.error("Error refreshing session:", refreshError);
            }
          }
          console.error("Authentication error - Redirecting to login");
          window.location.href = "/login";
          throw new Error("Session expired");
        }
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      return response.json();
    } catch (error) {
      console.error("Error in POST request:", error);
      throw error;
    }
  },
};
