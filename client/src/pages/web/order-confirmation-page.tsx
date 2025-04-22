import { useState, useEffect } from "react";
import { useRoute } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Loader2, CheckCircle, ArrowLeft, CalendarClock, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import WebLayout from "./web-layout";

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
  const [, params] = useRoute<{ id: string }>("/orden-confirmada/:id");
  const { toast } = useToast();
  const orderId = params?.id ? parseInt(params.id) : 0;

  const { data: order, isLoading, error } = useQuery<Order>({
    queryKey: ["/api/web/orders", orderId],
    queryFn: async () => {
      const response = await fetch(`/api/web/orders/${orderId}`);
      if (!response.ok) {
        throw new Error("No se pudo cargar la información de la orden");
      }
      return response.json();
    },
    enabled: orderId > 0,
  });

  useEffect(() => {
    if (error) {
      toast({
        title: "Error",
        description: "No se pudo cargar la información de la orden",
        variant: "destructive",
      });
    }
  }, [error, toast]);

  if (isLoading) {
    return (
      <WebLayout>
        <div className="container mx-auto py-8 flex items-center justify-center min-h-[50vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </WebLayout>
    );
  }

  if (!order) {
    return (
      <WebLayout>
        <div className="container mx-auto py-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Orden no encontrada</CardTitle>
              <CardDescription>
                No pudimos encontrar la información de la orden solicitada.
              </CardDescription>
            </CardHeader>
            <CardFooter>
              <Link href="/catalogo">
                <Button variant="outline" className="flex items-center gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Volver al catálogo
                </Button>
              </Link>
            </CardFooter>
          </Card>
        </div>
      </WebLayout>
    );
  }

  // Formatear fecha de forma legible
  const orderDate = order.timestamp 
    ? new Date(order.timestamp).toLocaleDateString('es-AR', {
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      })
    : "N/A";

  return (
    <WebLayout>
      <div className="container mx-auto py-8">
        <div className="mb-8 text-center">
          <div className="flex justify-center mb-4">
            <CheckCircle className="h-16 w-16 text-green-500" />
          </div>
          <h1 className="text-3xl font-bold">¡Orden Confirmada!</h1>
          <p className="text-muted-foreground mt-2">
            Su pedido #{order.id} ha sido recibido y será procesado a la brevedad.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarClock className="h-5 w-5" />
                  Detalles del Pedido
                </CardTitle>
                <CardDescription>
                  Orden #{order.id} • {orderDate}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-medium mb-2">Productos</h3>
                  <div className="space-y-3">
                    {order.items?.map((item) => (
                      <div key={item.id} className="flex justify-between">
                        <div>
                          <p>{item.productName}</p>
                          <p className="text-sm text-muted-foreground">
                            {item.quantity} x ${item.price}
                          </p>
                        </div>
                        <p className="font-medium">${item.total}</p>
                      </div>
                    ))}
                  </div>

                  <Separator className="my-4" />

                  <div className="flex justify-between font-bold">
                    <p>Total</p>
                    <p>${order.total}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="h-5 w-5" />
                  Información de Entrega
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm font-medium">Nombre:</p>
                  <p>{order.customerData.name}</p>
                </div>

                <div>
                  <p className="text-sm font-medium">Dirección:</p>
                  <p>{order.customerData.address}</p>
                </div>

                <div>
                  <p className="text-sm font-medium">Teléfono:</p>
                  <p>{order.customerData.phone}</p>
                </div>

                <div>
                  <p className="text-sm font-medium">Email:</p>
                  <p>{order.customerData.email}</p>
                </div>

                {order.customerData.notes && (
                  <div>
                    <p className="text-sm font-medium">Notas:</p>
                    <p>{order.customerData.notes}</p>
                  </div>
                )}

                <Separator className="my-2" />

                <div>
                  <p className="text-sm font-medium">Método de pago:</p>
                  <p className="capitalize">{order.paymentMethod}</p>
                </div>

                {order.paymentMethod === "transferencia" && (
                  <div className="p-3 bg-muted rounded-md mt-2">
                    <p className="text-sm mb-1">Datos para la transferencia:</p>
                    <p className="text-xs"><strong>Banco:</strong> Banco de la Nación Argentina</p>
                    <p className="text-xs"><strong>Titular:</strong> Punto Pastelero S.R.L.</p>
                    <p className="text-xs"><strong>CUIT:</strong> 30-71234567-8</p>
                    <p className="text-xs"><strong>CBU:</strong> 0110012345678901234567</p>
                    <p className="text-xs"><strong>Alias:</strong> PUNTO.PASTELERO</p>
                    <p className="text-xs mt-2 italic">* Enviar comprobante a info@puntopastelero.com.ar</p>
                  </div>
                )}
              </CardContent>
              <CardFooter>
                <Link href="/catalogo">
                  <Button variant="outline" className="w-full flex items-center gap-2">
                    <ArrowLeft className="h-4 w-4" />
                    Volver al catálogo
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    </WebLayout>
  );
}