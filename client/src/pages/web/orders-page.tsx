import { useEffect, useState } from "react";
import { useWebAuth } from "@/hooks/use-web-auth";
import { useLocation } from "wouter";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  UserIcon, 
  ShoppingBag, 
  Truck, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  ChevronRight,
  LogOut,
  Package
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import WebLayout from "@/layouts/web-layout";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { getQueryFn } from "@/lib/queryClient";

// Interfaces
interface OrderItem {
  id: number;
  productId: number;
  orderId: number;
  quantity: number;
  unit: string;
  price: number;
  total: number;
  productName: string;
}

interface Order {
  id: number;
  timestamp: string;
  customerId: number;
  total: number;
  status: string;
  paymentMethod: string;
  paymentStatus: string;
  trackingCode?: string;
  items: OrderItem[];
}

// Función de ayuda para el color del estado del pedido
function getStatusColor(status: string): string {
  switch (status.toLowerCase()) {
    case 'entregado':
    case 'completed':
    case 'delivered':
      return 'bg-green-100 text-green-800';
    case 'en proceso':
    case 'processing':
    case 'in progress':
      return 'bg-blue-100 text-blue-800';
    case 'pendiente':
    case 'pending':
      return 'bg-yellow-100 text-yellow-800';
    case 'cancelado':
    case 'canceled':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

// Función de ayuda para el icono del estado del pedido
function StatusIcon({ status }: { status: string }) {
  switch (status.toLowerCase()) {
    case 'entregado':
    case 'completed':
    case 'delivered':
      return <CheckCircle className="h-5 w-5 text-green-600" />;
    case 'en proceso':
    case 'processing':
    case 'in progress':
      return <Clock className="h-5 w-5 text-blue-600" />;
    case 'pendiente':
    case 'pending':
      return <Clock className="h-5 w-5 text-yellow-600" />;
    case 'enviado':
    case 'shipped':
      return <Truck className="h-5 w-5 text-purple-600" />;
    case 'cancelado':
    case 'canceled':
      return <AlertCircle className="h-5 w-5 text-red-600" />;
    default:
      return <Package className="h-5 w-5 text-gray-600" />;
  }
}

// Componente para detalles del pedido
function OrderDetails({ order }: { order: Order }) {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium">Pedido #{order.id}</h3>
          <p className="text-sm text-gray-500">
            {format(new Date(order.timestamp), "d 'de' MMMM, yyyy", { locale: es })}
          </p>
        </div>
        <Badge className={getStatusColor(order.status)}>
          {order.status}
        </Badge>
      </div>

      <Separator />

      <div>
        <h4 className="font-medium mb-2">Detalles del pedido</h4>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Producto</TableHead>
              <TableHead className="text-right">Cantidad</TableHead>
              <TableHead className="text-right">Precio</TableHead>
              <TableHead className="text-right">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {order.items.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">{item.productName}</TableCell>
                <TableCell className="text-right">{item.quantity} {item.unit}</TableCell>
                <TableCell className="text-right">${item.price.toFixed(2)}</TableCell>
                <TableCell className="text-right">${item.total.toFixed(2)}</TableCell>
              </TableRow>
            ))}
            <TableRow>
              <TableCell colSpan={3} className="text-right font-medium">Total:</TableCell>
              <TableCell className="text-right font-bold">${order.total.toFixed(2)}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h4 className="font-medium mb-2">Información de pago</h4>
          <p className="text-sm">
            <span className="font-medium">Método: </span>
            {order.paymentMethod}
          </p>
          <p className="text-sm">
            <span className="font-medium">Estado: </span>
            <Badge variant={order.paymentStatus === 'paid' ? 'default' : 'outline'}>
              {order.paymentStatus === 'paid' ? 'Pagado' : 'Pendiente'}
            </Badge>
          </p>
        </div>
        
        {order.trackingCode && (
          <div>
            <h4 className="font-medium mb-2">Información de envío</h4>
            <p className="text-sm">
              <span className="font-medium">Código de seguimiento: </span>
              {order.trackingCode}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function OrdersPage() {
  const [location, navigate] = useLocation();
  const { user, isLoading, logoutMutation } = useWebAuth();
  const { toast } = useToast();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Obtener pedidos del usuario
  const { data: orders, isLoading: ordersLoading } = useQuery<Order[], Error>({
    queryKey: ["/api/web/orders"],
    queryFn: getQueryFn(),
    enabled: !!user,
  });

  // Si no hay usuario y no está cargando, redirigir al login
  useEffect(() => {
    if (!isLoading && !user) {
      navigate("/web/login");
    }
  }, [isLoading, user, navigate]);

  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSuccess: () => {
        navigate("/web");
      },
    });
  };

  if (isLoading || !user) {
    return (
      <WebLayout>
        <div className="container mx-auto py-8 text-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
          <p className="mt-4">Cargando información...</p>
        </div>
      </WebLayout>
    );
  }

  return (
    <WebLayout>
      <div className="container mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold mb-8">Mis Pedidos</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Panel de navegación lateral */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <UserIcon className="mr-2 h-5 w-5" />
                  <span>{user.name}</span>
                </CardTitle>
                <CardDescription>{user.email}</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <nav className="space-y-1">
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start" 
                    onClick={() => navigate("/web/account")}
                  >
                    <UserIcon className="mr-2 h-5 w-5" />
                    Mi Perfil
                  </Button>
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start" 
                    onClick={() => navigate("/web/orders")}
                  >
                    <ShoppingBag className="mr-2 h-5 w-5" />
                    Mis Pedidos
                  </Button>
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start text-destructive" 
                    onClick={handleLogout}
                  >
                    <LogOut className="mr-2 h-5 w-5" />
                    Cerrar Sesión
                  </Button>
                </nav>
              </CardContent>
            </Card>
          </div>

          {/* Lista de pedidos */}
          <div className="md:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Historial de Pedidos</CardTitle>
                <CardDescription>
                  Visualiza y da seguimiento a todos tus pedidos anteriores.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {ordersLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
                    <p className="mt-4">Cargando pedidos...</p>
                  </div>
                ) : orders && orders.length > 0 ? (
                  <div className="space-y-4">
                    {orders.map((order) => (
                      <Card key={order.id} className="overflow-hidden">
                        <div className="p-4 flex justify-between items-center">
                          <div className="flex items-center space-x-4">
                            <div className="p-2 rounded-full bg-gray-100">
                              <StatusIcon status={order.status} />
                            </div>
                            <div>
                              <h3 className="font-medium">Pedido #{order.id}</h3>
                              <p className="text-sm text-gray-500">
                                {format(new Date(order.timestamp), "d 'de' MMMM, yyyy", { locale: es })}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-4">
                            <div className="text-right">
                              <p className="font-medium">${order.total.toFixed(2)}</p>
                              <Badge className={getStatusColor(order.status)}>
                                {order.status}
                              </Badge>
                            </div>
                            <Sheet>
                              <SheetTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  onClick={() => setSelectedOrder(order)}
                                >
                                  <ChevronRight className="h-5 w-5" />
                                </Button>
                              </SheetTrigger>
                              <SheetContent className="w-full sm:max-w-md">
                                <SheetHeader>
                                  <SheetTitle>Detalles del Pedido</SheetTitle>
                                  <SheetDescription>
                                    Información detallada de tu pedido.
                                  </SheetDescription>
                                </SheetHeader>
                                {selectedOrder && <OrderDetails order={selectedOrder} />}
                                <SheetFooter className="mt-6">
                                  <SheetClose asChild>
                                    <Button>Cerrar</Button>
                                  </SheetClose>
                                </SheetFooter>
                              </SheetContent>
                            </Sheet>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 border rounded-md">
                    <ShoppingBag className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium mb-2">Aún no tienes pedidos</h3>
                    <p className="text-gray-500 mb-4">Cuando realices pedidos, aparecerán aquí</p>
                    <Button 
                      variant="default" 
                      onClick={() => navigate("/web/products")}
                    >
                      Ver Productos
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </WebLayout>
  );
}