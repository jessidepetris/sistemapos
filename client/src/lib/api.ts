export async function apiRequest(method: string, endpoint: string, data?: any) {
  try {
    const response = await fetch(endpoint, {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: data ? JSON.stringify(data) : undefined,
      credentials: 'include' // Para manejar cookies de sesión
    });
    return response;
  } catch (error) {
    console.error('Error en la petición API:', error);
    throw error;
  }
} 
