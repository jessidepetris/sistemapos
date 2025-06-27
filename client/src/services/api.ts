/*
export async function createSale(saleData: any) {
  try {
    // Verificar si la sesión está activa antes de hacer la petición
    const response = await fetch(`${this.baseUrl}/api/sales`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      credentials: 'include',
      body: JSON.stringify(saleData)
    });

    const data = await response.json();

    if (!response.ok) {
      if (response.status === 401 && data.code === "SESSION_EXPIRED") {
        // Limpiar datos de sesión
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        // Redirigir al login
        window.location.href = '/login';
        throw new Error("SESSION_EXPIRED");
      }
      throw new Error(data.message || 'Error al crear la venta');
    }

    return data;
  } catch (error) {
    console.error('Error al crear la venta:', error);
    throw error;
  }
}
*/

export {};
