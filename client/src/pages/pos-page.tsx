import { useState } from "react";
import { DashboardLayout } from "@/layouts/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Product, Customer, InsertSale, InsertSaleDetail } from "@shared/schema";
import { 
  Search, 
  Barcode, 
  ShoppingCart, 
  Trash2, 
  Plus, 
  Minus, 
  User, 
  CreditCard, 
  DollarSign,
  Receipt, 
  X 
} from "lucide-react";

interface CartItem {
  productId: number;
  name: string;
  price: string;
  quantity: number;
  unit: string;
}

export default function PosPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [barcode, setBarcode] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerId, setCustomerId] = useState<number | null>(null);
  const [paymentMethod, setPaymentMethod] = useState("efectivo");
  
  // Fetch products
  const { data: products } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });
  
  // Fetch customers
  const { data: customers } = useQuery<Customer[]>({
    queryKey: ["/api/customers"],
  });
  
  // Create sale mutation
  const createSale = useMutation({
    mutationFn: async (data: { sale: InsertSale, details: InsertSaleDetail[] }) => {
      const res = await apiRequest("POST", "/api/sales", data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Venta realizada",
        description: "La venta se ha registrado correctamente",
      });
      // Clear cart
      setCart([]);
      setCustomerId(null);
      setPaymentMethod("efectivo");
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ["/api/sales/recent"] });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Error al registrar la venta: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  // Handle barcode search
  const handleBarcodeSearch = () => {
    if (!barcode.trim()) return;
    
    const product = products?.find(p => p.barcodes?.includes(barcode));
    
    if (product) {
      addToCart(product);
      setBarcode("");
    } else {
      toast({
        title: "Producto no encontrado",
        description: `No se encontró ningún producto con el código de barras ${barcode}`,
        variant: "destructive",
      });
    }
  };
  
  // Add product to cart
  const addToCart = (product: Product) => {
    setCart(prev => {
      // Check if product already in cart
      const existingItem = prev.find(item => item.productId === product.id);
      
      if (existingItem) {
        // Increment quantity
        return prev.map(item =>
          item.productId === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        // Add new item
        return [
          ...prev,
          {
            productId: product.id,
            name: product.name,
            price: product.price.toString(),
            quantity: 1,
            unit: product.unit
          }
        ];
      }
    });
  };
  
  // Remove item from cart
  const removeFromCart = (productId: number) => {
    setCart(prev => prev.filter(item => item.productId !== productId));
  };
  
  // Update item quantity
  const updateQuantity = (productId: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }
    
    setCart(prev =>
      prev.map(item =>
        item.productId === productId
          ? { ...item, quantity: newQuantity }
          : item
      )
    );
  };
  
  // Calculate subtotal for an item
  const calculateSubtotal = (item: CartItem) => {
    return (parseFloat(item.price) * item.quantity).toFixed(2);
  };
  
  // Calculate total
  const calculateTotal = () => {
    return cart
      .reduce((total, item) => total + parseFloat(calculateSubtotal(item)), 0)
      .toFixed(2);
  };
  
  // Complete sale
  const completeSale = () => {
    if (cart.length === 0) {
      toast({
        title: "Carrito vacío",
        description: "Agregue productos al carrito para realizar una venta",
        variant: "destructive",
      });
      return;
    }
    
    const saleData: InsertSale = {
      customerId: customerId || undefined,
      userId: user?.id || 0,
      total: calculateTotal(),
      paymentMethod,
      receiptNumber: `${Date.now()}`,
      receiptType: "X",
      status: "completed"
    };
    
    const saleDetails: InsertSaleDetail[] = cart.map(item => ({
      productId: item.productId,
      quantity: item.quantity.toString(),
      unitPrice: item.price,
      subtotal: calculateSubtotal(item),
      unit: item.unit,
      saleId: 0 // This will be set by the server
    }));
    
    createSale.mutate({ sale: saleData, details: saleDetails });
  };
  
  return (
    <DashboardLayout 
      title="Punto de Venta"
      description="Gestión de ventas"
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Products Section */}
        <div className="lg:col-span-2 space-y-6">
          {/* Search Bar */}
          <Card>
            <CardContent className="p-4">
              <div className="flex space-x-2">
                <div className="relative flex-1">
                  <Input
                    value={barcode}
                    onChange={(e) => setBarcode(e.target.value)}
                    placeholder="Buscar por código de barras..."
                    className="pl-10"
                    onKeyDown={(e) => e.key === 'Enter' && handleBarcodeSearch()}
                  />
                  <Barcode className="absolute left-3 top-2.5 h-4 w-4 text-neutral-500" />
                </div>
                <Button onClick={handleBarcodeSearch}>
                  <Search className="h-4 w-4 mr-2" />
                  Buscar
                </Button>
              </div>
            </CardContent>
          </Card>
          
          {/* Products Grid */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Productos</CardTitle>
            </CardHeader>
            <CardContent>
              {products && products.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {products.map((product) => (
                    <Card 
                      key={product.id} 
                      className="cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => addToCart(product)}
                    >
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-medium text-sm">{product.name}</h3>
                            <p className="text-xs text-neutral-500 mt-1">SKU: {product.sku}</p>
                          </div>
                          <div className="flex space-x-1">
                            {product.isRefrigerated && (
                              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                                Refrigerado
                              </Badge>
                            )}
                            {product.isBulk && (
                              <Badge variant="secondary" className="bg-green-100 text-green-800">
                                Granel
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex justify-between items-center mt-3">
                          <span className="text-lg font-semibold">${parseFloat(product.price.toString()).toFixed(2)}</span>
                          <span className="text-xs text-neutral-500">Stock: {product.stock.toString()}</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-neutral-500">
                  No hay productos disponibles
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
        {/* Cart Section */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center">
                  <ShoppingCart className="h-5 w-5 mr-2" />
                  Carrito
                </CardTitle>
                {cart.length > 0 && (
                  <Button variant="outline" size="sm" onClick={() => setCart([])}>
                    <X className="h-4 w-4 mr-1" />
                    Limpiar
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {cart.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Producto</TableHead>
                      <TableHead className="text-right">Precio</TableHead>
                      <TableHead className="text-center">Cant.</TableHead>
                      <TableHead className="text-right">Subtotal</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cart.map((item) => (
                      <TableRow key={item.productId}>
                        <TableCell className="font-medium">{item.name}</TableCell>
                        <TableCell className="text-right">${parseFloat(item.price).toFixed(2)}</TableCell>
                        <TableCell>
                          <div className="flex items-center justify-center">
                            <Button 
                              variant="outline" 
                              size="icon" 
                              className="h-6 w-6 rounded-full"
                              onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="mx-2">{item.quantity}</span>
                            <Button 
                              variant="outline" 
                              size="icon" 
                              className="h-6 w-6 rounded-full"
                              onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">${calculateSubtotal(item)}</TableCell>
                        <TableCell>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-red-500"
                            onClick={() => removeFromCart(item.productId)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-neutral-500">
                  El carrito está vacío
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Checkout Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Finalizar Venta</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Customer Selection */}
              <div>
                <label className="text-sm font-medium">Cliente</label>
                <div className="flex mt-1">
                  <select 
                    className="flex-1 rounded-md border border-neutral-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    value={customerId || ""}
                    onChange={(e) => setCustomerId(e.target.value ? parseInt(e.target.value) : null)}
                  >
                    <option value="">Cliente ocasional</option>
                    {customers?.map((customer) => (
                      <option key={customer.id} value={customer.id}>
                        {customer.name}
                      </option>
                    ))}
                  </select>
                  <Button className="ml-2" variant="outline" size="icon">
                    <User className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              {/* Payment Method */}
              <div>
                <label className="text-sm font-medium">Método de Pago</label>
                <div className="grid grid-cols-3 gap-2 mt-1">
                  <Button 
                    variant={paymentMethod === "efectivo" ? "default" : "outline"}
                    onClick={() => setPaymentMethod("efectivo")}
                    className="justify-start"
                  >
                    <DollarSign className="h-4 w-4 mr-2" />
                    Efectivo
                  </Button>
                  <Button 
                    variant={paymentMethod === "tarjeta" ? "default" : "outline"}
                    onClick={() => setPaymentMethod("tarjeta")}
                    className="justify-start"
                  >
                    <CreditCard className="h-4 w-4 mr-2" />
                    Tarjeta
                  </Button>
                  <Button 
                    variant={paymentMethod === "cuenta" ? "default" : "outline"}
                    onClick={() => setPaymentMethod("cuenta")}
                    className="justify-start"
                    disabled={!customerId}
                  >
                    <Receipt className="h-4 w-4 mr-2" />
                    Cuenta
                  </Button>
                </div>
              </div>
              
              <Separator />
              
              {/* Totals */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm">Subtotal:</span>
                  <span className="font-medium">${calculateTotal()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">IVA (21%):</span>
                  <span className="font-medium">Incluido</span>
                </div>
                <div className="flex justify-between text-lg font-bold">
                  <span>Total:</span>
                  <span>${calculateTotal()}</span>
                </div>
              </div>
              
              <Button 
                className="w-full mt-4" 
                size="lg" 
                onClick={completeSale}
                disabled={cart.length === 0 || createSale.isPending}
              >
                {createSale.isPending ? (
                  "Procesando..."
                ) : (
                  <>
                    Finalizar Venta
                    <ShoppingCart className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
