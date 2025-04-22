import { useState } from "react";
import { Link, useLocation } from "wouter";
import CatalogLayout from "./catalog-layout";
import { useCart } from "@/hooks/use-cart";
import { useWebAuth } from "@/hooks/use-web-auth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Trash, Plus, Minus, ShoppingBag } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";

export default function CartPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user } = useWebAuth();
  const { cart, cartItems, isLoading, removeFromCartMutation } = useCart();

  // Si no hay carrito creado o está vacío
  const isCartEmpty = !cart || cartItems.length === 0;

  // Calcular totales
  const subtotal = cart?.totalAmount || 0;
  const deliveryFee = 300; // Se podría obtener de la configuración del catálogo
  const total = subtotal + (subtotal > 0 ? deliveryFee : 0);

  // Eliminar un producto del carrito
  const handleRemoveItem = (itemId: number) => {
    removeFromCartMutation.mutate(itemId);
  };

  // Ir a checkout (verificar si el usuario está autenticado)
  const handleProceedToCheckout = () => {
    if (!user) {
      toast({
        title: "Inicia sesión primero",
        description: "Debes iniciar sesión para completar tu compra",
        variant: "destructive",
      });
      setLocation("/web/login");
      return;
    }
    
    setLocation("/web/checkout");
  };

  // Función para convertir número a formato de moneda local
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(amount);
  };

  return (
    <CatalogLayout>
      <div className="container mx-auto px-4 py-10">
        <h1 className="text-3xl font-bold mb-6">Tu Carrito</h1>
        
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
          </div>
        ) : isCartEmpty ? (
          <Card className="text-center py-12">
            <CardContent>
              <div className="flex flex-col items-center justify-center space-y-4">
                <ShoppingBag className="h-12 w-12 text-muted-foreground" />
                <h2 className="text-2xl font-semibold">Tu carrito está vacío</h2>
                <p className="text-muted-foreground">
                  Parece que aún no has agregado ningún producto a tu carrito.
                </p>
                <Button asChild className="mt-4">
                  <Link href="/web/products">
                    <a>Ver productos</a>
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Lista de productos */}
            <div className="md:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Productos ({cartItems.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[80px]">Producto</TableHead>
                        <TableHead>Descripción</TableHead>
                        <TableHead className="text-right">Cantidad</TableHead>
                        <TableHead className="text-right">Precio</TableHead>
                        <TableHead className="text-right">Subtotal</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {cartItems.map((item) => {
                        const product = item.product;
                        const itemPrice = parseFloat(item.price);
                        const quantity = parseFloat(item.quantity);
                        const itemTotal = itemPrice * quantity;
                        
                        return (
                          <TableRow key={item.id}>
                            <TableCell>
                              <div className="h-16 w-16 overflow-hidden rounded">
                                <img
                                  src={product?.imageUrl || "https://placehold.co/80x80/e2e8f0/1e293b?text=" + product?.name}
                                  alt={product?.name}
                                  className="h-full w-full object-cover"
                                />
                              </div>
                            </TableCell>
                            <TableCell>
                              <div>
                                <p className="font-medium">{product?.name}</p>
                                <p className="text-sm text-muted-foreground">
                                  {item.unit}
                                </p>
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end space-x-2">
                                <div className="flex items-center border rounded-md">
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-8 w-8 rounded-r-none"
                                    disabled // En esta versión no implementamos modificar cantidad
                                  >
                                    <Minus className="h-3 w-3" />
                                    <span className="sr-only">Reducir</span>
                                  </Button>
                                  <Input
                                    type="text"
                                    value={item.quantity}
                                    className="h-8 w-12 text-center border-0"
                                    readOnly
                                  />
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-8 w-8 rounded-l-none"
                                    disabled // En esta versión no implementamos modificar cantidad
                                  >
                                    <Plus className="h-3 w-3" />
                                    <span className="sr-only">Aumentar</span>
                                  </Button>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              {formatCurrency(itemPrice)}
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              {formatCurrency(itemTotal)}
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-red-500 hover:text-red-700 hover:bg-red-100"
                                onClick={() => handleRemoveItem(item.id)}
                                disabled={removeFromCartMutation.isPending}
                              >
                                <Trash className="h-4 w-4" />
                                <span className="sr-only">Eliminar</span>
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button variant="outline" asChild>
                    <Link href="/web/products">
                      Seguir comprando
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            </div>
            
            {/* Resumen del pedido */}
            <div>
              <Card>
                <CardHeader>
                  <CardTitle>Resumen del pedido</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span>{formatCurrency(subtotal)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Envío</span>
                      <span>{formatCurrency(deliveryFee)}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-bold">
                      <span>Total</span>
                      <span>{formatCurrency(total)}</span>
                    </div>
                  </div>
                  
                  <Button 
                    className="w-full mt-6" 
                    onClick={handleProceedToCheckout}
                    disabled={isCartEmpty || removeFromCartMutation.isPending}
                  >
                    Proceder al pago
                  </Button>
                  
                  {!user && (
                    <p className="text-sm text-muted-foreground mt-4 text-center">
                      Debes <Link href="/web/login" className="text-primary underline">iniciar sesión</Link> para completar tu compra
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </CatalogLayout>
  );
}