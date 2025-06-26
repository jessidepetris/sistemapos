import { useEffect, useState, useRef } from "react";
import { useParams, useLocation } from "wouter";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Check, ArrowLeft } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import WebLayout from "./web-layout";
import { OrderPDF } from "@/components/printing/OrderPDF";

interface OrderItem {
  id: number;
  productId: number;
  productName: string;
  price: string;
  quantity: string;
  unit: string;
  total: string;
}

interface Order {
  id: number;
  status: string;
  notes: string | null;
  customerId: number | null;
  timestamp: Date | null;
  total: string;
  customerData: {
    name: string;
    email: string;
    phone: string;
    address: string;
    notes: string;
  };
  paymentMethod: string;
  items: OrderItem[];
}

export default function OrderConfirmationPage() {
  const params = useParams<{ orderId: string }>();
  const [location, setLocation] = useLocation();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const orderContentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const orderId = params.orderId;
        if (!orderId) {
          setError("Número de pedido no válido");
          setLoading(false);
          return;
        }

        const response = await apiRequest("GET", `/api/web/orders/${orderId}`);
        
        if (!response.ok) {
          throw new Error("No se pudo obtener la información del pedido");
        }
        
        const data = await response.json();
        setOrder(data);
      } catch (err) {
        console.error("Error al obtener el pedido:", err);
        setError("Error al cargar los detalles del pedido");
        toast({
          title: "Error",
          description: "No se pudo cargar la información del pedido",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [params.orderId, toast]);

  const goToCatalog = () => {
    setLocation("/catalogo");
  };

  if (loading) {
    return (
      <WebLayout>
        <div className="container py-16 flex flex-col items-center justify-center min-h-[60vh]">
          <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
          <h2 className="text-xl font-medium text-center">Cargando información del pedido...</h2>
        </div>
      </WebLayout>
    );
  }

  if (error || !order) {
    return (
      <WebLayout>
        <div className="container py-16 flex flex-col items-center justify-center min-h-[60vh]">
          <div className="w-full max-w-md">
            <Card>
              <CardHeader>
                <CardTitle className="text-center text-red-500">Error</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-center">
                  {error || "No se pudo encontrar la información del pedido"}
                </p>
              </CardContent>
              <CardFooter className="flex justify-center">
                <Button onClick={goToCatalog}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Volver al catálogo
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </WebLayout>
    );
  }

  const formatDate = (date: Date | null) => {
    if (!date) return "Fecha no disponible";
    return format(new Date(date), "d 'de' MMMM 'de' yyyy, HH:mm", { locale: es });
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "pending":
        return "Pendiente";
      case "processing":
        return "En proceso";
      case "preparing":
        return "En preparación";
      case "shipping":
        return "En envío";
      case "delivered":
        return "Entregado";
      case "cancelled":
        return "Cancelado";
      default:
        return "Pendiente";
    }
  };

  const getPaymentMethodLabel = (method: string) => {
    switch (method) {
      case "efectivo":
        return "Efectivo al momento de la entrega";
      case "transferencia":
        return "Transferencia bancaria";
      default:
        return method;
    }
  };

  return (
    <WebLayout>
      <div className="container py-10">
        <div className="flex flex-col items-center max-w-4xl mx-auto mb-8">
          <div className="h-16 w-16 rounded-full bg-primary/20 flex items-center justify-center mb-4">
            <Check className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-center mb-2">¡Pedido Confirmado!</h1>
          <p className="text-xl text-center text-muted-foreground mb-4">
            Gracias por tu compra. Tu pedido ha sido recibido.
          </p>
          <p className="text-center text-muted-foreground mb-6">
            Hemos enviado un correo de confirmación a{" "}
            <span className="font-medium text-foreground">{order.customerData.email}</span>
          </p>
          
          <div className="w-full mb-6 flex justify-center">
            {order && <OrderPDF order={order} showPrintButton={true} />}
          </div>
          
          <div className="w-full" ref={orderContentRef}>
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Resumen del pedido #{order.id}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-medium text-md mb-1">Fecha del pedido</h3>
                    <p className="text-muted-foreground">{formatDate(order.timestamp)}</p>
                  </div>
                  <div>
                    <h3 className="font-medium text-md mb-1">Estado</h3>
                    <div className="flex items-center">
                      <span className={`inline-block h-2 w-2 rounded-full mr-2 ${
                        order.status === "delivered" 
                        ? "bg-green-500" 
                        : order.status === "cancelled" 
                        ? "bg-red-500" 
                        : "bg-amber-500"
                      }`}></span>
                      <span className="text-muted-foreground">{getStatusLabel(order.status)}</span>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-medium text-md mb-1">Método de pago</h3>
                    <p className="text-muted-foreground">{getPaymentMethodLabel(order.paymentMethod)}</p>
                  </div>
                  <div>
                    <h3 className="font-medium text-md mb-1">Total</h3>
                    <p className="text-lg font-semibold">${parseFloat(order.total).toFixed(2)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <Card>
                <CardHeader>
                  <CardTitle>Información de contacto</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p><span className="font-medium">Nombre:</span> {order.customerData.name}</p>
                  <p><span className="font-medium">Email:</span> {order.customerData.email}</p>
                  <p><span className="font-medium">Teléfono:</span> {order.customerData.phone}</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Dirección de entrega</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p>{order.customerData.address}</p>
                  {order.customerData.notes && (
                    <div className="mt-4">
                      <p className="font-medium">Notas:</p>
                      <p className="text-muted-foreground">{order.customerData.notes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle>Productos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="divide-y">
                  {order.items.map((item) => (
                    <div key={item.id} className="py-4 flex justify-between">
                      <div>
                        <p className="font-medium">{item.productName}</p>
                        <p className="text-sm text-muted-foreground">
                          {item.quantity} {item.unit} x ${parseFloat(item.price).toFixed(2)}
                        </p>
                      </div>
                      <p className="font-medium">${parseFloat(item.total).toFixed(2)}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
              <CardFooter className="flex justify-between border-t pt-4">
                <p className="font-bold text-lg">Total</p>
                <p className="font-bold text-xl">${parseFloat(order.total).toFixed(2)}</p>
              </CardFooter>
            </Card>
            
            <div className="flex justify-center mt-8">
              <Button onClick={goToCatalog} className="px-8">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Volver al catálogo
              </Button>
            </div>
          </div>
        </div>
      </div>
    </WebLayout>
  );
}
