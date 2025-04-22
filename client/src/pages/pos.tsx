import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Minus, Plus, Search, ShoppingCart, Trash2, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type CartItem = {
  id: number;
  productId: number;
  name: string;
  price: number;
  quantity: number;
  unit: string;
  total: number;
  stockAvailable: number;
  isBulk: boolean;
  isRefrigerated: boolean;
  conversionRates?: any;
  // Campos para conversiones mejoradas
  isConversion?: boolean;
  conversionUnit?: string;
  conversionFactor?: number;
  conversionBarcode?: string;
};

export default function POSPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [checkoutDialogOpen, setCheckoutDialogOpen] = useState(false);
  const [barcodeInput, setBarcodeInput] = useState("");
  
  // Get products
  const { data: products, isLoading: isLoadingProducts } = useQuery({
    queryKey: ["/api/products"],
    retry: false,
  });
  
  // Get customers for checkout
  const { data: customers, isLoading: isLoadingCustomers } = useQuery({
    queryKey: ["/api/customers"],
    retry: false,
  });
  
  // Process sale mutation
  const processSaleMutation = useMutation({
    mutationFn: async (saleData: any) => {
      const res = await apiRequest("POST", "/api/sales", saleData);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Venta completada",
        description: "La venta se ha procesado correctamente",
      });
      setCart([]);
      setSelectedCustomerId(null);
      setCheckoutDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/recent-sales"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/recent-activity"] });
    },
    onError: (error) => {
      toast({
        title: "Error al procesar la venta",
        description: (error as Error).message,
        variant: "destructive",
      });
    }
  });
  
  // Filtered products based on search
  const filteredProducts = searchQuery 
    ? products?.filter((product: any) => 
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        (product.barcodes && product.barcodes.some((barcode: string) => barcode.includes(searchQuery)))
      )
    : products;
  
  // Handle adding product to cart
  const addToCart = (product: any) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => 
        item.productId === product.id && item.isConversion === false
      );
      
      if (existingItem) {
        return prevCart.map(item => 
          item.productId === product.id && item.isConversion === false
            ? { ...item, quantity: item.quantity + 1, total: (item.quantity + 1) * item.price }
            : item
        );
      } else {
        return [...prevCart, {
          id: Date.now(),
          productId: product.id,
          name: product.name,
          price: parseFloat(product.price),
          quantity: 1,
          unit: product.baseUnit,
          total: parseFloat(product.price),
          stockAvailable: parseFloat(product.stock),
          isBulk: product.isBulk,
          isRefrigerated: product.isRefrigerated,
          conversionRates: product.conversionRates,
          isConversion: false,
          conversionFactor: 1  // Factor 1 para producto principal
        }];
      }
    });
  };
  
  // Handle adding a product conversion to cart
  const addConversionToCart = (product: any, conversion: any) => {
    const displayName = conversion.description 
      ? `${product.name} - ${conversion.description}` 
      : `${product.name} (${conversion.unit})`;
      
    // Calculamos el precio basado en el factor de conversión
    // Por ejemplo, si vende en unidades de 500g, y el factor es 0.5,
    // entonces el precio es el 50% del precio total
    const conversionPrice = parseFloat(product.price) * conversion.factor;
    
    setCart(prevCart => {
      // Buscar si ya existe este producto con esta conversión específica
      const existingItem = prevCart.find(item => 
        item.productId === product.id && 
        item.isConversion === true && 
        item.conversionUnit === conversion.unit
      );
      
      if (existingItem) {
        return prevCart.map(item => 
          (item.productId === product.id && 
           item.isConversion === true && 
           item.conversionUnit === conversion.unit)
            ? { ...item, quantity: item.quantity + 1, total: (item.quantity + 1) * item.price }
            : item
        );
      } else {
        return [...prevCart, {
          id: Date.now(),
          productId: product.id,
          name: displayName,
          price: conversionPrice,
          quantity: 1,
          unit: conversion.unit,
          total: conversionPrice,
          stockAvailable: parseFloat(product.stock) / conversion.factor,
          isBulk: product.isBulk,
          isRefrigerated: product.isRefrigerated,
          conversionRates: product.conversionRates,
          isConversion: true,
          conversionUnit: conversion.unit,
          conversionFactor: conversion.factor,
          conversionBarcode: conversion.barcode
        }];
      }
    });
    
    // Mostrar un toast de confirmación
    toast({
      title: "Producto agregado",
      description: `${displayName} agregado al carrito`,
    });
  };
  
  // Handle barcode input
  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcodeInput.trim()) return;
    
    // Primero buscamos si es un código de barras principal del producto
    const foundProduct = products?.find((product: any) => 
      product.barcodes && product.barcodes.includes(barcodeInput.trim())
    );
    
    if (foundProduct) {
      // Añadir el producto con su código principal
      addToCart(foundProduct);
      setBarcodeInput("");
      return;
    }
    
    // Si no encontramos un producto directamente, buscamos en las conversiones
    let foundConversion = false;
    
    if (Array.isArray(products)) {
      for (const product of products) {
        if (!product.isBulk || !product.conversionRates) continue;
        
        // Parsear las conversiones si están en formato string
        const conversions = typeof product.conversionRates === 'string' 
          ? JSON.parse(product.conversionRates) 
          : product.conversionRates;
        
        if (!Array.isArray(conversions)) continue;
        
        // Buscar en las conversiones
        const matchingConversion = conversions.find((conv: any) => 
          conv.barcode === barcodeInput.trim()
        );
        
        if (matchingConversion) {
          // Encontramos una presentación con este código de barras
          foundConversion = true;
          
          // Añadir al carrito con la información de la conversión
          addConversionToCart(product, matchingConversion);
          setBarcodeInput("");
          break;
        }
      }
    }
    
    if (!foundConversion) {
      toast({
        title: "Producto no encontrado",
        description: `No se encontró ningún producto con el código de barras ${barcodeInput}`,
        variant: "destructive",
      });
    }
  };
  
  // Handle quantity change
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
  
  // Calculate cart totals
  const cartTotal = cart.reduce((sum, item) => sum + item.total, 0);
  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  
  // Process checkout
  const handleCheckout = () => {
    if (cart.length === 0) {
      toast({
        title: "Carrito vacío",
        description: "Agregue productos al carrito para continuar",
        variant: "destructive",
      });
      return;
    }
    
    setCheckoutDialogOpen(true);
  };
  
  // Finalize sale
  const finalizeSale = () => {
    if (!user) return;
    
    const saleData = {
      userId: user.id,
      customerId: selectedCustomerId,
      total: cartTotal,
      paymentMethod,
      status: "completed",
      items: cart.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
        unit: item.unit,
        price: item.price,
        total: item.total
      }))
    };
    
    processSaleMutation.mutate(saleData);
  };
  
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title="Punto de Venta" />
        
        <main className="flex-1 overflow-hidden p-6 flex flex-col lg:flex-row gap-6">
          {/* Left side - Product search and list */}
          <div className="w-full lg:w-7/12 flex flex-col h-full overflow-hidden">
            <Card className="flex-1 flex flex-col h-full overflow-hidden">
              <CardHeader className="px-6 py-4 flex-shrink-0">
                <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4">
                  {/* Barcode scanner */}
                  <form onSubmit={handleBarcodeSubmit} className="flex-1 flex gap-2">
                    <Input 
                      placeholder="Escanear código de barras" 
                      value={barcodeInput}
                      onChange={(e) => setBarcodeInput(e.target.value)}
                      className="flex-1"
                    />
                    <Button type="submit">Agregar</Button>
                  </form>
                  
                  {/* Text search */}
                  <div className="flex items-center gap-2 flex-1 relative">
                    <Input
                      placeholder="Buscar productos"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="flex-1"
                    />
                    <Search className="absolute right-3 text-muted-foreground" size={18} />
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="p-0 overflow-auto flex-1">
                {isLoadingProducts ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : filteredProducts && filteredProducts.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 p-6">
                    {filteredProducts.map((product: any) => (
                      <Card 
                        key={product.id} 
                        className="cursor-pointer hover:shadow-md transition"
                        onClick={() => addToCart(product)}
                      >
                        <CardContent className="p-4">
                          <div className="flex flex-col h-full">
                            <div className="flex justify-between items-start mb-2">
                              <h3 className="font-medium text-sm">{product.name}</h3>
                              <div className="flex gap-1">
                                {product.isRefrigerated && (
                                  <Badge variant="secondary" className="text-xs">Refrigerado</Badge>
                                )}
                                {product.isBulk && (
                                  <Badge variant="outline" className="text-xs">A granel</Badge>
                                )}
                              </div>
                            </div>
                            
                            <div className="mt-auto flex justify-between items-center">
                              <span className="text-lg font-semibold">
                                ${parseFloat(product.price).toFixed(2)}
                              </span>
                              <div className="text-xs text-muted-foreground">
                                Stock: {parseFloat(product.stock)} {product.baseUnit}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full p-6 text-center">
                    <ShoppingCart className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">
                      {searchQuery ? "No se encontraron productos" : "Comience a buscar productos"}
                    </h3>
                    <p className="text-muted-foreground">
                      {searchQuery 
                        ? `No hay resultados para "${searchQuery}"`
                        : "Use la barra de búsqueda o escanee un código de barras"
                      }
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          
          {/* Right side - Shopping cart */}
          <div className="w-full lg:w-5/12 flex flex-col h-full overflow-hidden">
            <Card className="flex-1 flex flex-col h-full overflow-hidden">
              <CardHeader className="px-6 py-4 border-b flex-shrink-0">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-xl">Carrito de Compra</CardTitle>
                  <Badge variant="secondary" className="text-sm">
                    {itemCount} {itemCount === 1 ? "Producto" : "Productos"}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="p-0 overflow-auto flex-1">
                {cart.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Producto</TableHead>
                        <TableHead className="text-right">Precio</TableHead>
                        <TableHead className="text-center">Cant.</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {cart.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">
                            <div>
                              {item.name}
                              <div className="flex gap-1 mt-1">
                                {item.isRefrigerated && (
                                  <Badge variant="secondary" className="text-xs">Refrigerado</Badge>
                                )}
                                {item.isBulk && (
                                  <Badge variant="outline" className="text-xs">A granel</Badge>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">${item.price.toFixed(2)}</TableCell>
                          <TableCell>
                            <div className="flex items-center justify-center">
                              <Button 
                                variant="outline" 
                                size="icon" 
                                className="h-8 w-8"
                                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              >
                                <Minus className="h-4 w-4" />
                              </Button>
                              <span className="w-10 text-center">{item.quantity}</span>
                              <Button 
                                variant="outline" 
                                size="icon" 
                                className="h-8 w-8"
                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            ${item.total.toFixed(2)}
                          </TableCell>
                          <TableCell>
                            <Button 
                              variant="ghost" 
                              size="icon" 
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
                  <div className="flex flex-col items-center justify-center h-full p-6 text-center">
                    <ShoppingCart className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">Carrito vacío</h3>
                    <p className="text-muted-foreground">
                      Agregue productos al carrito para comenzar
                    </p>
                  </div>
                )}
              </CardContent>
              
              <CardFooter className="p-6 border-t flex-shrink-0">
                <div className="w-full">
                  <div className="flex justify-between text-lg font-semibold mb-4">
                    <span>Total</span>
                    <span>${cartTotal.toFixed(2)}</span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <Button variant="outline" onClick={() => setCart([])}>
                      Cancelar Venta
                    </Button>
                    <Button 
                      onClick={handleCheckout}
                      disabled={cart.length === 0}
                    >
                      Finalizar Venta
                    </Button>
                  </div>
                </div>
              </CardFooter>
            </Card>
          </div>
        </main>
      </div>
      
      {/* Checkout Dialog */}
      <Dialog open={checkoutDialogOpen} onOpenChange={setCheckoutDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Finalizar Venta</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Cliente (opcional)</label>
              <Select value={selectedCustomerId?.toString()} onValueChange={(value) => setSelectedCustomerId(parseInt(value))}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar cliente" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Venta sin cliente</SelectItem>
                  {customers?.map((customer: any) => (
                    <SelectItem key={customer.id} value={customer.id.toString()}>
                      {customer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Método de pago</label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Efectivo</SelectItem>
                  <SelectItem value="card">Tarjeta</SelectItem>
                  <SelectItem value="transfer">Transferencia</SelectItem>
                  <SelectItem value="account">Cuenta Corriente</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="border-t pt-4">
              <div className="flex justify-between text-lg font-semibold">
                <span>Total a pagar</span>
                <span>${cartTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setCheckoutDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={finalizeSale}
              disabled={processSaleMutation.isPending}
            >
              {processSaleMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Procesando...
                </>
              ) : (
                "Confirmar Venta"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
