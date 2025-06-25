import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, Minus, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { formatCurrency } from "@/lib/utils";

interface BudgetFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface CartItem {
  id: number;
  productId: number;
  name: string;
  price: number;
  quantity: number;
  unit: string;
  total: number;
  stockAvailable: number;
}

export function BudgetFormDialog({ open, onOpenChange }: BudgetFormDialogProps) {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<string>("cash");
  const [discountPercent, setDiscountPercent] = useState(0);
  const [observations, setObservations] = useState("");
  const [validityDays, setValidityDays] = useState(30);
  const barcodeInputRef = useRef<HTMLInputElement>(null);

  // Get products
  const { data: products = [], isLoading: isLoadingProducts } = useQuery<any[]>({
    queryKey: ["/api/products"],
    retry: false,
  });

  // Get customers
  const { data: customers = [], isLoading: isLoadingCustomers } = useQuery<any[]>({
    queryKey: ["/api/customers"],
    retry: false,
  });

  // Filtered products based on search
  const filteredProducts = searchQuery 
    ? products?.filter((product: any) => 
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        (product.barcodes && product.barcodes.some((barcode: string) => barcode.includes(searchQuery)))
      )
    : products;

  // Add item to cart
  const addToCart = (product: any) => {
    const existingItem = cart.find(item => item.productId === product.id);
    
    if (existingItem) {
      setCart(prevCart => 
        prevCart.map(item => 
          item.productId === product.id 
            ? { ...item, quantity: item.quantity + 1, total: (item.quantity + 1) * item.price }
            : item
        )
      );
    } else {
      setCart(prevCart => [...prevCart, {
        id: Date.now(),
        productId: product.id,
        name: product.name,
        price: parseFloat(product.price),
        quantity: 1,
        unit: product.baseUnit,
        total: parseFloat(product.price),
        stockAvailable: parseFloat(product.stock)
      }]);
    }
  };

  // Update quantity
  const updateQuantity = (id: number, newQuantity: number) => {
    if (newQuantity <= 0) return;
    
    setCart(prevCart => 
      prevCart.map(item => 
        item.id === id 
          ? { ...item, quantity: newQuantity, total: newQuantity * item.price }
          : item
      )
    );
  };

  // Remove item from cart
  const removeFromCart = (id: number) => {
    setCart(prevCart => prevCart.filter(item => item.id !== id));
  };

  // Calculate totals
  const cartSubtotal = cart.reduce((sum, item) => sum + item.total, 0);
  const discountAmount = (cartSubtotal * discountPercent) / 100;
  const cartTotal = cartSubtotal - discountAmount;

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (cart.length === 0) {
      toast({
        title: "Carrito vacío",
        description: "Agregue productos al carrito antes de crear el presupuesto",
        variant: "destructive",
      });
      return;
    }

    if (!selectedCustomerId) {
      toast({
        title: "Cliente no seleccionado",
        description: "Seleccione un cliente antes de crear el presupuesto",
        variant: "destructive",
      });
      return;
    }

    try {
      const budgetData = {
        customerId: selectedCustomerId,
        items: cart.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          unit: item.unit,
          price: item.price,
          total: item.total
        })),
        subtotal: cartSubtotal,
        discount: discountAmount,
        discountPercent,
        total: cartTotal,
        paymentMethod,
        observations,
        validityDays,
        status: "pending"
      };

      // TODO: Implement budget creation API call
      // await apiRequest("POST", "/api/budgets", budgetData);

      toast({
        title: "Presupuesto creado",
        description: "El presupuesto se ha creado correctamente"
      });

      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Hubo un error al crear el presupuesto",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nuevo Presupuesto</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left side - Product search and list */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Productos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Barcode scanner */}
                  <form onSubmit={(e) => { e.preventDefault(); }} className="flex gap-2">
                    <Input 
                      ref={barcodeInputRef}
                      placeholder="Escanear código de barras" 
                      className="flex-1"
                    />
                    <Button type="submit">Agregar</Button>
                  </form>
                  
                  {/* Text search */}
                  <div className="relative">
                    <Input
                      placeholder="Buscar productos"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={18} />
                  </div>

                  {/* Products list */}
                  <div className="space-y-2">
                    {filteredProducts?.map((product: any) => (
                      <div
                        key={product.id}
                        className="flex items-center justify-between p-2 border rounded-md hover:bg-accent cursor-pointer"
                        onClick={() => addToCart(product)}
                      >
                        <div>
                          <div className="font-medium">{product.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {formatCurrency(parseFloat(product.price), "ARS")}
                          </div>
                        </div>
                        <Badge variant={parseFloat(product.stock) > 0 ? "default" : "destructive"}>
                          {parseFloat(product.stock).toFixed(2)} {product.baseUnit}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right side - Cart and checkout */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Carrito</CardTitle>
              </CardHeader>
              <CardContent>
                {cart.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Producto</TableHead>
                        <TableHead>Cantidad</TableHead>
                        <TableHead>Precio</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {cart.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>{item.name}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              >
                                <Minus className="h-4 w-4" />
                              </Button>
                              <span>{item.quantity}</span>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                          <TableCell>{formatCurrency(item.price, "ARS")}</TableCell>
                          <TableCell>{formatCurrency(item.total, "ARS")}</TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeFromCart(item.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    El carrito está vacío
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Detalles del Presupuesto</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Cliente</Label>
                  <Select
                    value={selectedCustomerId?.toString() || "0"}
                    onValueChange={(value) => setSelectedCustomerId(value === "0" ? null : parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar cliente" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">Sin cliente</SelectItem>
                      {customers.map((customer: any) => (
                        <SelectItem key={customer.id} value={customer.id.toString()}>
                          {customer.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Método de pago</Label>
                  <Select
                    value={paymentMethod}
                    onValueChange={setPaymentMethod}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar método de pago" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Efectivo</SelectItem>
                      <SelectItem value="transfer">Transferencia</SelectItem>
                      <SelectItem value="credit_card">Tarjeta de Crédito</SelectItem>
                      <SelectItem value="debit_card">Tarjeta de Débito</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Descuento (%)</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={discountPercent}
                    onChange={(e) => setDiscountPercent(parseFloat(e.target.value) || 0)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Validez (días)</Label>
                  <Input
                    type="number"
                    min="1"
                    value={validityDays}
                    onChange={(e) => setValidityDays(parseInt(e.target.value) || 30)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Observaciones</Label>
                  <Textarea
                    value={observations}
                    onChange={(e) => setObservations(e.target.value)}
                    placeholder="Observaciones del presupuesto..."
                  />
                </div>

                <div className="space-y-2 pt-4 border-t">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>{formatCurrency(cartSubtotal, "ARS")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Descuento:</span>
                    <span>-{formatCurrency(discountAmount, "ARS")}</span>
                  </div>
                  <div className="flex justify-between font-bold">
                    <span>Total:</span>
                    <span>{formatCurrency(cartTotal, "ARS")}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={cart.length === 0}>
            Crear Presupuesto
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 