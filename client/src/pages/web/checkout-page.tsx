import { useState } from "react";
import { useCart } from "@/hooks/use-cart";
import { useWebAuth } from "@/hooks/use-web-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation } from "wouter";
import WebLayout from "./web-layout";
import { apiRequest } from "@/lib/queryClient";
import { Loader2 } from "lucide-react";

const CheckoutPage = () => {
  const { cart, cartItems, clearCart } = useCart();
  const { user } = useWebAuth();
  const { toast } = useToast();
  const [location, setLocation] = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Redireccionar si el carrito está vacío
  if (cart && cartItems.length === 0) {
    setLocation("/web/catalogo");
    return null;
  }

  const formSchema = z.object({
    name: z.string().min(3, { message: "El nombre es obligatorio" }),
    email: z.string().email({ message: "Email inválido" }),
    phone: z.string().min(6, { message: "Teléfono inválido" }),
    address: z.string().min(5, { message: "La dirección es obligatoria" }),
    notes: z.string().optional(),
    paymentMethod: z.enum(["efectivo", "transferencia"], {
      required_error: "Por favor seleccione un método de pago",
    }),
  });

  type CheckoutFormValues = z.infer<typeof formSchema>;

  // Valores por defecto del formulario
  const defaultValues: Partial<CheckoutFormValues> = {
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    address: user?.address || "",
    notes: "",
    paymentMethod: "efectivo",
  };

  const form = useForm<CheckoutFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  const onSubmit = async (data: CheckoutFormValues) => {
    if (!cart) {
      toast({
        title: "Error",
        description: "No hay productos en el carrito",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Crear el objeto de la orden
      const orderData = {
        customerData: {
          name: data.name,
          email: data.email,
          phone: data.phone,
          address: data.address,
          notes: data.notes || "",
        },
        paymentMethod: data.paymentMethod,
        items: cartItems,
        total: calculateTotal(),
      };

      // Enviar la orden al servidor
      const response = await apiRequest("POST", "/api/web/orders", orderData);
      
      if (!response.ok) {
        throw new Error("Error al procesar el pedido");
      }
      
      const result = await response.json();
      
      // Limpiar el carrito después de la orden exitosa
      await clearCart();
      
      // Redireccionar a la página de confirmación
      setLocation(`/web/order-confirmation/${result.id}`);
      
      toast({
        title: "¡Pedido realizado!",
        description: "Tu pedido ha sido procesado correctamente",
      });
    } catch (error) {
      console.error("Error al procesar el pedido:", error);
      toast({
        title: "Error",
        description: "Hubo un problema al procesar tu pedido. Por favor intenta nuevamente.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calcular el total de la orden
  const calculateTotal = () => {
    return cartItems.reduce((sum, item) => sum + parseFloat(item.total), 0).toFixed(2);
  };

  return (
    <WebLayout>
      <div className="container py-10">
        <h1 className="text-3xl font-bold mb-6">Finalizar Compra</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Formulario de checkout */}
          <div className="md:col-span-2">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Información de contacto</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nombre completo</FormLabel>
                          <FormControl>
                            <Input placeholder="Tu nombre completo" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input placeholder="tu@email.com" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Teléfono</FormLabel>
                            <FormControl>
                              <Input placeholder="Tu número de teléfono" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <FormField
                      control={form.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Dirección de entrega</FormLabel>
                          <FormControl>
                            <Input placeholder="Dirección completa" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Notas adicionales</FormLabel>
                          <FormControl>
                            <Textarea placeholder="Instrucciones especiales para la entrega" {...field} />
                          </FormControl>
                          <FormDescription>
                            Opcional: Indicaciones para la entrega, horarios preferidos, etc.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Método de pago</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <FormField
                      control={form.control}
                      name="paymentMethod"
                      render={({ field }) => (
                        <FormItem className="space-y-3">
                          <FormControl>
                            <RadioGroup
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                              className="flex flex-col space-y-1"
                            >
                              <FormItem className="flex items-center space-x-3 space-y-0">
                                <FormControl>
                                  <RadioGroupItem value="efectivo" />
                                </FormControl>
                                <FormLabel className="font-normal">
                                  Efectivo al momento de la entrega
                                </FormLabel>
                              </FormItem>
                              <FormItem className="flex items-center space-x-3 space-y-0">
                                <FormControl>
                                  <RadioGroupItem value="transferencia" />
                                </FormControl>
                                <FormLabel className="font-normal">
                                  Transferencia bancaria
                                </FormLabel>
                              </FormItem>
                            </RadioGroup>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                  <CardFooter>
                    <Button 
                      type="submit" 
                      className="w-full"
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
              </form>
            </Form>
          </div>
          
          {/* Resumen del pedido */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Resumen del pedido</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  {cartItems.map((item) => (
                    <div key={item.id} className="flex justify-between items-start py-2 border-b">
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
                <p className="font-bold text-xl">${calculateTotal()}</p>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    </WebLayout>
  );
};

export default CheckoutPage;