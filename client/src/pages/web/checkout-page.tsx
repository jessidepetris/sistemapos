import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useCart } from "@/hooks/use-cart";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { apiRequest } from "@/lib/queryClient";
import { useNavigate } from "wouter";
import WebLayout from "./web-layout";

export default function CheckoutPage() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { cart, cartItems, isLoading: isCartLoading, clearCart } = useCart();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<string>("efectivo");
  const [customerData, setCustomerData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    notes: ""
  });

  // Redirigir si el carrito está vacío
  useEffect(() => {
    if (!isCartLoading && cart && cart.items === 0) {
      toast({
        title: "Carrito vacío",
        description: "No hay productos en su carrito de compras",
        variant: "destructive",
      });
      navigate("/catalogo");
    }
  }, [cart, isCartLoading, navigate, toast]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCustomerData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!cart) return;
    
    setIsSubmitting(true);
    
    try {
      // Crear la orden a partir del carrito
      const orderData = {
        paymentMethod,
        customerData,
        cartId: cart.id
      };
      
      const response = await apiRequest("POST", "/api/web/orders", orderData);
      
      if (!response.ok) {
        throw new Error("Error al procesar la orden");
      }
      
      const orderResult = await response.json();
      
      // Vaciar el carrito después de la orden exitosa
      await clearCart();
      
      toast({
        title: "¡Orden completada!",
        description: `Su orden #${orderResult.id} ha sido recibida y está siendo procesada.`,
      });
      
      // Redirigir a la página de confirmación
      navigate(`/orden-confirmada/${orderResult.id}`);
    } catch (error) {
      toast({
        title: "Error al procesar la orden",
        description: error instanceof Error ? error.message : "Ocurrió un error inesperado",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isCartLoading) {
    return (
      <WebLayout>
        <div className="container mx-auto py-8 flex items-center justify-center min-h-[50vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </WebLayout>
    );
  }

  return (
    <WebLayout>
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold mb-8">Finalizar Compra</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Formulario de datos del cliente */}
          <div className="md:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Información de Contacto</CardTitle>
                <CardDescription>
                  Ingrese sus datos para procesar su pedido
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Nombre Completo</Label>
                      <Input 
                        id="name" 
                        name="name"
                        value={customerData.name}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="email">Correo Electrónico</Label>
                      <Input 
                        id="email" 
                        name="email"
                        type="email"
                        value={customerData.email}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="phone">Teléfono</Label>
                      <Input 
                        id="phone" 
                        name="phone"
                        value={customerData.phone}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="address">Dirección de Entrega</Label>
                      <Input 
                        id="address" 
                        name="address"
                        value={customerData.address}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notes">Notas Adicionales</Label>
                    <Textarea 
                      id="notes" 
                      name="notes"
                      value={customerData.notes}
                      onChange={handleInputChange}
                      placeholder="Instrucciones especiales para la entrega, referencias, etc."
                    />
                  </div>

                  <div className="space-y-3 pt-4">
                    <Label>Método de Pago</Label>
                    <RadioGroup 
                      defaultValue="efectivo" 
                      value={paymentMethod}
                      onValueChange={setPaymentMethod}
                      className="flex flex-col space-y-2"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="efectivo" id="efectivo" />
                        <Label htmlFor="efectivo" className="font-normal">Efectivo (pago contra entrega)</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="transferencia" id="transferencia" />
                        <Label htmlFor="transferencia" className="font-normal">Transferencia Bancaria</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  {paymentMethod === "transferencia" && (
                    <div className="p-4 bg-muted rounded-md mt-2">
                      <p className="text-sm mb-2">Datos para la transferencia:</p>
                      <p className="text-sm"><strong>Banco:</strong> Banco de la Nación Argentina</p>
                      <p className="text-sm"><strong>Titular:</strong> Punto Pastelero S.R.L.</p>
                      <p className="text-sm"><strong>CUIT:</strong> 30-71234567-8</p>
                      <p className="text-sm"><strong>CBU:</strong> 0110012345678901234567</p>
                      <p className="text-sm"><strong>Alias:</strong> PUNTO.PASTELERO</p>
                      <p className="text-sm mt-2 italic">* Enviar comprobante a info@puntopastelero.com.ar</p>
                    </div>
                  )}
                </form>
              </CardContent>
            </Card>
          </div>
          
          {/* Resumen del pedido */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Resumen del Pedido</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {cartItems.map((item) => (
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
                
                <Separator />
                
                <div className="flex justify-between font-bold">
                  <p>Total</p>
                  <p>${cart?.total}</p>
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  className="w-full" 
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Procesando...
                    </>
                  ) : (
                    'Confirmar Pedido'
                  )}
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    </WebLayout>
  );
}