import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import WebLayout from "@/layouts/web-layout";
import { useWebAuth } from "@/hooks/use-web-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Loader2, Package, Truck, CheckCircle, AlertCircle, Clock, XCircle } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { OrderPDF } from "@/components/printing/OrderPDF";

// Interfaces para tipar los datos
interface OrderItem {
  id: number;
  productId: number;
  orderId: number;
  quantity: string;
  unit: string;
  price: string;
  total: string;
  productName: string;
}

interface CustomerData {
  name?: string;
  address?: string;
  city?: string;
  province?: string;
  phone?: string;
  email?: string;
  notes?: string;
}

interface Order {
  id: number;
  customerId: number | null;
  routeId: number | null;
  userId: number;
  status: string;
  timestamp: string | Date;
  deliveryDate: string | Date | null;
  notes: string | null;
  total: string;
  route?: { id: number; name: string } | null;
  customer?: { id: number; name: string } | null;
  items: OrderItem[];
  deliveryMethod: string;
  paymentMethod: string;
  customerData?: string; // JSON string
  parsedCustomerData?: CustomerData;
}

// Función para determinar el color del estado
function getStatusColor(status: string): string {
  switch (status.toLowerCase()) {
    case "pending":
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
    case "processing":
      return "bg-blue-100 text-blue-800 border-blue-200";
    case "shipped":
    case "in_transit":
      return "bg-indigo-100 text-indigo-800 border-indigo-200";
    case "delivered":
    case "completed":
      return "bg-green-100 text-green-800 border-green-200";
    case "canceled":
    case "cancelled":
      return "bg-red-100 text-red-800 border-red-200";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
}

// Componente para mostrar el icono del estado
function StatusIcon({ status }: { status: string }) {
  const statusLower = status.toLowerCase();
  if (statusLower === "delivered" || statusLower === "completed") {
    return <CheckCircle className="h-5 w-5 text-green-600" />;
  } else if (statusLower === "in_transit" || statusLower === "shipped") {
    return <Truck className="h-5 w-5 text-indigo-600" />;
  } else if (statusLower === "processing") {
    return <Package className="h-5 w-5 text-blue-600" />;
  } else if (statusLower === "pending") {
    return <Clock className="h-5 w-5 text-yellow-600" />;
  } else if (statusLower === "canceled" || statusLower === "cancelled") {
    return <XCircle className="h-5 w-5 text-red-600" />;
  } else {
    return <AlertCircle className="h-5 w-5 text-gray-600" />;
  }
}

// Componente para mostrar los detalles de un pedido
function OrderDetails({ order }: { order: Order }) {
  // Convertir fecha a formato local
  const formatDate = (dateString: string | Date | null) => {
    if (!dateString) return "No disponible";
    const date = new Date(dateString);
    return date.toLocaleDateString("es-AR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  // Parsear datos de cliente si es necesario
  const customerData = order.parsedCustomerData || {} as CustomerData;

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <OrderPDF order={order} showPrintButton={true} />
      </div>
      
      {/* Información del pedido */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h4 className="text-sm font-medium text-gray-500 mb-1">Fecha del Pedido</h4>
          <p className="text-sm">{formatDate(order.timestamp)}</p>
        </div>
        <div>
          <h4 className="text-sm font-medium text-gray-500 mb-1">Método de Pago</h4>
          <p className="text-sm capitalize">{order.paymentMethod || "No especificado"}</p>
        </div>
        <div>
          <h4 className="text-sm font-medium text-gray-500 mb-1">Fecha de Entrega Estimada</h4>
          <p className="text-sm">{formatDate(order.deliveryDate)}</p>
        </div>
        <div>
          <h4 className="text-sm font-medium text-gray-500 mb-1">Estado del Pedido</h4>
          <div className="flex items-center">
            <StatusIcon status={order.status} />
            <Badge className={`ml-2 ${getStatusColor(order.status)}`}>
              {order.status === "pending" ? "Pendiente" : 
               order.status === "processing" ? "Procesando" : 
               order.status === "in_transit" ? "En Tránsito" :
               order.status === "shipped" ? "Enviado" :
               order.status === "delivered" ? "Entregado" :
               order.status === "completed" ? "Completado" :
               order.status === "canceled" || order.status === "cancelled" ? "Cancelado" : 
               order.status}
            </Badge>
          </div>
        </div>
      </div>

      {/* Dirección de entrega */}
      {(customerData.name || customerData.address) && (
        <div>
          <h4 className="text-sm font-medium mb-2">Dirección de Entrega</h4>
          {customerData.name && <p className="text-sm">{customerData.name}</p>}
          {customerData.address && <p className="text-sm">{customerData.address}</p>}
          {customerData.city && customerData.province && (
            <p className="text-sm">{customerData.city}, {customerData.province}</p>
          )}
          {customerData.phone && <p className="text-sm">{customerData.phone}</p>}
          {customerData.email && <p className="text-sm">{customerData.email}</p>}
        </div>
      )}

      {/* Notas */}
      {(order.notes || (customerData.notes && customerData.notes.length > 0)) && (
        <div>
          <h4 className="text-sm font-medium mb-2">Notas</h4>
          <p className="text-sm">{order.notes || customerData.notes}</p>
        </div>
      )}

      {/* Items del pedido */}
      <div>
        <h4 className="text-sm font-medium mb-2">Productos</h4>
        <div className="border rounded-md divide-y">
          {order.items.map((item) => (
            <div key={item.id} className="p-3 flex justify-between items-center">
              <div>
                <p className="font-medium">{item.productName}</p>
                <p className="text-sm text-gray-500">
                  {item.quantity} {item.unit} x {formatCurrency(parseFloat(item.price))}
                </p>
              </div>
              <p className="font-medium">{formatCurrency(parseFloat(item.total))}</p>
            </div>
          ))}
          
          {/* Total del pedido */}
          <div className="p-3 flex justify-between items-center bg-gray-50">
            <p className="font-bold">Total</p>
            <p className="font-bold">{formatCurrency(parseFloat(order.total))}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function OrdersPage() {
  const [_, navigate] = useLocation();
  const { user, isLoading } = useWebAuth();
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);

  // Redirección si no está autenticado
  useEffect(() => {
    if (!isLoading && !user) {
      navigate("/web/login");
    }
  }, [user, isLoading, navigate]);

  // Cargar pedidos cuando el usuario está autenticado
  useEffect(() => {
    if (user) {
      loadOrders();
    }
  }, [user]);

  const loadOrders = async () => {
    setLoadingOrders(true);
    try {
      const response = await apiRequest("GET", "/api/web/orders");
      
      if (response.ok) {
        const ordersData = await response.json();
        
        // Procesar los datos de los pedidos
        const processedOrders = ordersData.map((order: Order) => {
          let parsedCustomerData: CustomerData | undefined = undefined;
          
          if (order.customerData) {
            try {
              parsedCustomerData = JSON.parse(order.customerData);
            } catch (e) {
              console.error("Error al parsear datos del cliente:", e);
            }
          }
          
          return {
            ...order,
            parsedCustomerData
          };
        });
        
        setOrders(processedOrders);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || "No se pudieron cargar los pedidos");
      }
    } catch (error) {
      console.error("Error al cargar pedidos:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Ocurrió un error al cargar tus pedidos",
        variant: "destructive",
      });
    } finally {
      setLoadingOrders(false);
    }
  };

  if (isLoading) {
    return (
      <WebLayout>
        <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </WebLayout>
    );
  }

  return (
    <WebLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-2">Mis Pedidos</h1>
          <p className="text-muted-foreground mb-6">
            Consulta el estado y detalles de tus pedidos recientes
          </p>

          {loadingOrders ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : orders.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center pt-10 pb-10">
                <Package className="h-12 w-12 text-gray-300 mb-4" />
                <h3 className="text-lg font-medium mb-2">No tienes pedidos</h3>
                <p className="text-gray-500 text-center mb-4">
                  Aún no has realizado ningún pedido en nuestra tienda.
                </p>
                <Button asChild>
                  <a href="/web/products">Ver Productos</a>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              <Accordion type="single" collapsible className="w-full">
                {orders.map((order) => (
                  <AccordionItem key={order.id} value={`order-${order.id}`}>
                    <Card className="mb-2 border-none shadow-none">
                      <CardHeader className="p-0">
                        <AccordionTrigger className="px-4 py-2 hover:no-underline">
                          <div className="flex-1 text-left">
                            <CardTitle className="flex items-center space-x-2 text-lg">
                              <span>Pedido #{order.id}</span>
                              <Badge className={`ml-2 ${getStatusColor(order.status)}`}>
                                {order.status === "pending" ? "Pendiente" : 
                                 order.status === "processing" ? "Procesando" : 
                                 order.status === "in_transit" ? "En Tránsito" :
                                 order.status === "shipped" ? "Enviado" :
                                 order.status === "delivered" ? "Entregado" :
                                 order.status === "completed" ? "Completado" :
                                 order.status === "canceled" || order.status === "cancelled" ? "Cancelado" : 
                                 order.status}
                              </Badge>
                            </CardTitle>
                            <div className="text-sm text-muted-foreground mt-1">
                              {new Date(order.timestamp).toLocaleDateString("es-AR", {
                                day: "2-digit",
                                month: "2-digit",
                                year: "numeric"
                              })} - {formatCurrency(parseFloat(order.total))}
                            </div>
                          </div>
                        </AccordionTrigger>
                      </CardHeader>
                    </Card>
                    <AccordionContent className="px-4 pt-0">
                      <OrderDetails order={order} />
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          )}
        </div>
      </div>
    </WebLayout>
  );
}