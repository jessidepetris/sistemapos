import React, { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { PaymentMethod, PaymentDetails } from "@/shared/types";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Package, ShoppingBag, Search, Trash2, X, ShoppingCart, Plus, Minus, Tag } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ThermalTicket } from "@/components/printing/ThermalTicket";
import { InvoicePDF } from "@/components/printing/InvoicePDF";
import { InvoiceContent } from "@/components/invoices/InvoiceDetail";
import { PDFService } from "@/services/pdfService";
import { formatCurrency } from "@/lib/utils";

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
  imageUrl?: string;
  // Campos para conversiones mejoradas
  isConversion?: boolean;
  conversionUnit?: string;
  conversionFactor?: number;
  conversionBarcode?: string;
};

const POSPage = () => {
  const { user, isLoading: isLoadingUser } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("");
  const [paymentDetails, setPaymentDetails] = useState<PaymentDetails>({
    cardType: 'credit',
    cardNumber: '',
    cardHolder: '',
    cardExpiry: '',
    cardCvv: '',
    bankName: '',
    accountNumber: '',
    checkNumber: '',
    qrCode: '',
    mixedPayment: {
      cash: 0,
      transfer: 0,
      qr: 0,
      credit_card: 0,
      debit_card: 0,
      check: 0,
      current_account: 0
    }
  });
  const [checkoutDialogOpen, setCheckoutDialogOpen] = useState(false);
  const [barcodeInput, setBarcodeInput] = useState("");
  const [documentType, setDocumentType] = useState("remito");
  const [observations, setObservations] = useState("");
  const [printTicket, setPrintTicket] = useState(true);
  const [sendEmail, setSendEmail] = useState(false);
  const [cardType, setCardType] = useState("credit");
  const [discountPercent, setDiscountPercent] = useState(0);
  const [surchargePercent, setSurchargePercent] = useState(0);
  const [priceType, setPriceType] = useState("retail"); // 'retail' o 'wholesale'
  const [mixedPayment, setMixedPayment] = useState({
    cash: 0,
    transfer: 0,
    qr: 0,
    credit_card: 0,
    debit_card: 0,
    check: 0,
    current_account: 0
  });
  const [completedSale, setCompletedSale] = useState<any | null>(null);
  const [showReceiptDialog, setShowReceiptDialog] = useState(false);
  const receiptRef = useRef<HTMLDivElement>(null);
  const [lastSaleData, setLastSaleData] = useState<any>(null);
  
  // Get products
  const { data: products = [], isLoading: isLoadingProducts } = useQuery<any[]>({
    queryKey: ["/api/products"],
    retry: false,
  });
  
  // Get customers for checkout
  const { data: customers = [], isLoading: isLoadingCustomers } = useQuery<any[]>({
    queryKey: ["/api/customers"],
    retry: false,
  });
  
  // Get bank accounts
  const { data: bankAccounts = [], isLoading: isLoadingBankAccounts } = useQuery({
    queryKey: ["/api/bank-accounts"],
    retry: false,
  });
  
  // Process sale mutation
  const processSaleMutation = useMutation({
    mutationFn: async (saleData: any) => {
      const res = await apiRequest("POST", "/api/sales", saleData);
      if (!res.ok) {
        const errorData = await res.json();
        if (res.status === 401 && errorData.code === "SESSION_EXPIRED") {
          throw new Error("SESSION_EXPIRED");
        }
        throw new Error(errorData.message || "Error al procesar la venta");
      }
      return await res.json();
    },
    onSuccess: (data) => {
      // Invalidar consultas para actualizar los datos
      reactQueryClient.invalidateQueries({ queryKey: ["/api/products"] });
      reactQueryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      reactQueryClient.invalidateQueries({ queryKey: ["/api/dashboard/recent-sales"] });
      reactQueryClient.invalidateQueries({ queryKey: ["/api/dashboard/recent-activity"] });
      reactQueryClient.invalidateQueries({ queryKey: ["/api/dashboard/inventory-alerts"] });
      
      // Guardar la venta completada y mostrar el recibo
      setCompletedSale({
        ...data,
        items: cart,
        timestamp: new Date().toISOString(),
        paymentMethod: lastSaleData?.paymentMethod,
        paymentDetails: lastSaleData?.paymentDetails,
        documentType: lastSaleData?.documentType,
        notes: lastSaleData?.notes,
        subtotal: lastSaleData?.subtotal,
        discountPercent: lastSaleData?.discountPercent,
        discountAmount: data.discount !== undefined ? parseFloat(data.discount) : (lastSaleData?.discountAmount !== undefined ? parseFloat(lastSaleData.discountAmount) : 0),
        surchargePercent: lastSaleData?.surchargePercent,
        surchargeAmount: lastSaleData?.surchargeAmount,
        customer: customers?.find((c: any) => c.id === lastSaleData?.customerId)
      });
      setShowReceiptDialog(true);
      
      // Limpiar estado
      setCart([]);
      setSelectedCustomerId(null);
      setCheckoutDialogOpen(false);
      
      toast({
        title: "Venta completada",
        description: "La venta se ha procesado correctamente y el stock ha sido actualizado"
      });
    },
    onError: (error) => {
      if ((error as Error).message === "SESSION_EXPIRED") {
        toast({
          title: "Sesión expirada",
          description: "Por favor, inicie sesión nuevamente para continuar",
          variant: "destructive",
        });
        // Redirigir a la página de login
        window.location.href = "/login";
        return;
      }
      
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
    // Determinar qué precio usar
    const price = priceType === "wholesale" && product.wholesalePrice 
      ? parseFloat(product.wholesalePrice) 
      : parseFloat(product.price);
    
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
          price: price,
          quantity: 1,
          unit: product.baseUnit,
          total: price,
          stockAvailable: parseFloat(product.stock),
          isBulk: product.isBulk,
          isRefrigerated: product.isRefrigerated,
          conversionRates: product.conversionRates,
          imageUrl: product.imageUrl || null,
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
      
    // Determinamos qué precio base usar (minorista o mayorista)
    const basePrice = priceType === "wholesale" && product.wholesalePrice 
      ? parseFloat(product.wholesalePrice) 
      : parseFloat(product.price);
      
    // Calculamos el precio basado en el factor de conversión
    const conversionPrice = basePrice * conversion.factor;
    
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
          imageUrl: product.imageUrl || null,
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
  const cartSubtotal = cart.reduce((sum, item) => sum + item.total, 0);
  const discountAmount = (cartSubtotal * discountPercent) / 100;
  const surchargeAmount = (cartSubtotal * surchargePercent) / 100;
  const cartTotal = cartSubtotal - discountAmount + surchargeAmount;
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
  const finalizeSale = async () => {
    if (isLoadingUser) {
      toast({
        title: "Verificando sesión",
        description: "Por favor espere mientras verificamos su sesión",
      });
      return;
    }

    if (!user) {
      toast({
        title: "Error de autenticación",
        description: "Debe estar autenticado para realizar una venta",
        variant: "destructive"
      });
      window.location.href = '/login';
      return;
    }

    if (!paymentMethod) {
      toast({
        title: "Error",
        description: "Debe seleccionar un método de pago",
        variant: "destructive",
      });
      return;
    }

    const saleData = {
      userId: user.id,
      customerId: selectedCustomerId,
      subtotal: cartSubtotal,
      total: cartTotal,
      discount: discountAmount,
      surcharge: surchargeAmount,
      discountPercent,
      surchargePercent,
      paymentMethods: [
        {
          method: paymentMethod,
          amount: cartTotal,
          accountId: paymentDetails?.bankAccountId || null
        }
      ],
      paymentDetails,
      documentType,
      notes: observations,
      status: "completed",
      printOptions: {
        printTicket,
        sendEmail
      },
      items: cart.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
        unit: item.unit,
        price: item.price,
        total: item.total,
        isConversion: item.isConversion || false,
        conversionFactor: item.conversionFactor || 1,
        conversionUnit: item.conversionUnit || item.unit,
        conversionBarcode: item.conversionBarcode || null
      }))
    };

    setLastSaleData(saleData);
    try {
      await processSaleMutation.mutateAsync(saleData);
    } catch (error) {
      console.error("Error al finalizar la venta:", error);
    }
  };
  
  const reactQueryClient = useQueryClient();
  
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
                  
                  {/* Tipo de precio */}
                  <Select
                    value={priceType}
                    onValueChange={setPriceType}
                  >
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="Tipo de precio" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="retail">Minorista</SelectItem>
                      <SelectItem value="wholesale">Mayorista</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              
              <CardContent className="p-0 overflow-auto flex-1">
                {isLoadingProducts ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <>
                    <div className="p-3 bg-muted/30 border-b flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Tag size={16} />
                        <span className="text-sm font-medium">Lista de precios: </span>
                        <Badge variant={priceType === "wholesale" ? "secondary" : "default"}>
                          {priceType === "wholesale" ? "Mayorista (35%)" : "Minorista (55%)"}
                        </Badge>
                      </div>
                      
                      <span className="text-xs text-muted-foreground">
                        {filteredProducts?.length || 0} productos
                      </span>
                    </div>
                    
                    {filteredProducts && filteredProducts.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 p-6">
                        {filteredProducts.map((product: any) => (
                          <Card key={product.id} className="cursor-pointer hover:bg-accent/50 transition-colors">
                            <CardContent className="p-4">
                              <div className="flex flex-col text-sm">
                                <div className="mt-1 flex justify-between items-center">
                                  <div className="flex flex-col">
                                    {/* Precio que aplica según la selección actual */}
                                    <div className="font-bold text-base">
                                      {formatCurrency(
                                        priceType === "wholesale" && product.wholesalePrice 
                                          ? parseFloat(product.wholesalePrice) 
                                          : parseFloat(product.price),
                                        product.currency || "ARS"
                                      )}
                                    </div>
                                    
                                    {/* Mostrar el otro precio si existe */}
                                    {product.wholesalePrice && (
                                      <div className="text-xs text-muted-foreground">
                                        {priceType === "wholesale" 
                                          ? `Min: ${formatCurrency(parseFloat(product.price), product.currency || "ARS")}` 
                                          : `May: ${formatCurrency(parseFloat(product.wholesalePrice), product.currency || "ARS")}`
                                        }
                                      </div>
                                    )}
                                  </div>
                                  
                                  <div className="text-xs">
                                    <Badge variant={parseFloat(product.stock) > 0 ? "default" : "destructive"} className="text-xs">
                                      {parseFloat(product.stock).toFixed(2)} {product.baseUnit}
                                    </Badge>
                                  </div>
                                </div>
                              </div>
                              
                              {/* Si tiene presentaciones alternativas */}
                              {product.conversionRates && product.conversionRates.length > 0 && (
                                <div className="mt-2 pt-2 border-t">
                                  <div className="text-xs font-medium mb-1 text-muted-foreground">Presentaciones:</div>
                                  <div className="space-y-1">
                                    {product.conversionRates.map((conversion: any, index: number) => (
                                      <div 
                                        key={`${product.id}-${index}`}
                                        className="text-xs py-1 px-2 rounded bg-secondary/20 hover:bg-secondary/40 cursor-pointer flex justify-between items-center"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          addConversionToCart(product, conversion);
                                        }}
                                      >
                                        <span>{conversion.unit}</span>
                                        <span className="font-medium">
                                          {formatCurrency(
                                            priceType === "wholesale" && product.wholesalePrice 
                                              ? parseFloat(product.wholesalePrice) * conversion.factor
                                              : parseFloat(product.price) * conversion.factor,
                                            product.currency || "ARS"
                                          )}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
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
                  </>
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
                            <div className="flex items-center gap-2">
                              <div className="h-10 w-10 rounded overflow-hidden bg-gray-100 flex-shrink-0">
                                {item.imageUrl ? (
                                  <img 
                                    src={item.imageUrl} 
                                    alt={item.name}
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <div className="flex h-full w-full items-center justify-center bg-gray-100 text-gray-400">
                                    <Package className="h-5 w-5" />
                                  </div>
                                )}
                              </div>
                              <div>
                                {item.name}
                                <div className="flex gap-1 mt-1">
                                  {item.isRefrigerated && (
                                    <Badge variant="secondary" className="text-xs">Refrigerado</Badge>
                                  )}
                                  {item.isBulk && (
                                    <Badge variant="outline" className="text-xs">A granel</Badge>
                                  )}
                                  {item.isConversion && (
                                    <Badge variant="outline" className="text-green-500 border-green-200 bg-green-100 text-xs">
                                      Presentación: {item.unit}
                                    </Badge>
                                  )}
                                </div>
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
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl">Finalizar Venta</DialogTitle>
            <DialogHeader className="text-muted-foreground text-sm mt-1">
              Complete los datos para finalizar la venta y generar el comprobante
            </DialogHeader>
          </DialogHeader>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
            {/* Columna izquierda: Datos de venta */}
            <div className="space-y-5">
              <div className="space-y-3">
                <h3 className="text-base font-medium">Datos de la venta</h3>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Cliente</label>
                  <Select value={selectedCustomerId?.toString() || "0"} onValueChange={(value) => setSelectedCustomerId(value === "0" ? null : parseInt(value))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar cliente" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">Venta sin cliente</SelectItem>
                      {Array.isArray(customers) && customers.map((customer: any) => (
                        <SelectItem key={customer.id} value={customer.id.toString()}>
                          {customer.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Tipo de comprobante</label>
                  <Select value={documentType} onValueChange={setDocumentType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="remito">Remito</SelectItem>
                      <SelectItem value="factura_a">Factura A</SelectItem>
                      <SelectItem value="factura_b">Factura B</SelectItem>
                      <SelectItem value="factura_c">Factura C</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Método de pago</label>
                  <Select value={paymentMethod} onValueChange={(value) => {
                    setPaymentMethod(value);
                    if (value === 'cash') {
                      setDiscountPercent(5);
                    } else {
                      setDiscountPercent(0);
                    }
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar método de pago" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Efectivo</SelectItem>
                      <SelectItem value="transfer">Transferencia</SelectItem>
                      <SelectItem value="qr">QR</SelectItem>
                      <SelectItem value="credit_card">Tarjeta de Crédito</SelectItem>
                      <SelectItem value="debit_card">Tarjeta de Débito</SelectItem>
                      <SelectItem value="check">Cheque</SelectItem>
                      <SelectItem value="current_account">Cuenta Corriente</SelectItem>
                      <SelectItem value="mixed">Pago mixto</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Payment details based on selected method */}
                {paymentMethod === 'credit_card' && (
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">Pago con tarjeta de crédito</p>
                  </div>
                )}
                
                {paymentMethod === 'debit_card' && (
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">Pago con tarjeta de débito</p>
                  </div>
                )}
                
                {paymentMethod === 'transfer' && (
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-sm">Cuenta bancaria</label>
                      <Select
                        value={paymentDetails.bankAccountId?.toString() || ''}
                        onValueChange={(value) => setPaymentDetails({
                          ...paymentDetails,
                          bankAccountId: parseInt(value)
                        })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar cuenta" />
                        </SelectTrigger>
                        <SelectContent>
                          {bankAccounts.map((account: any) => (
                            <SelectItem key={account.id} value={account.id.toString()}>
                              {account.alias} - {account.bankName} ({account.accountNumber})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
                
                {paymentMethod === 'check' && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="text-sm">Banco</label>
                        <Input 
                          type="text"
                          value={paymentDetails.bankName || ''}
                          onChange={(e) => setPaymentDetails({...paymentDetails, bankName: e.target.value})}
                          placeholder="Nombre del banco"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-sm">Número de cheque</label>
                        <Input 
                          type="text"
                          value={paymentDetails.checkNumber || ''}
                          onChange={(e) => setPaymentDetails({...paymentDetails, checkNumber: e.target.value})}
                          placeholder="Número de cheque"
                        />
                      </div>
                    </div>
                  </div>
                )}
                
                {paymentMethod === 'qr' && (
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-sm">Código QR</label>
                      <Input 
                        type="text"
                        value={paymentDetails.qrCode || ''}
                        onChange={(e) => setPaymentDetails({...paymentDetails, qrCode: e.target.value})}
                        placeholder="Código QR"
                      />
                    </div>
                  </div>
                )}
                
                {paymentMethod === 'mixed' && (
                  <div className="space-y-3 border rounded-md p-3">
                    <h4 className="text-sm font-medium">Detalles del pago mixto</h4>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="text-xs">Efectivo</label>
                        <Input 
                          type="number" 
                          min="0" 
                          value={mixedPayment.cash.toString()} 
                          onChange={(e) => setMixedPayment({
                            ...mixedPayment,
                            cash: parseFloat(e.target.value) || 0
                          })}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs">Transferencia</label>
                        <Input 
                          type="number" 
                          min="0" 
                          value={mixedPayment.transfer.toString()} 
                          onChange={(e) => setMixedPayment({
                            ...mixedPayment,
                            transfer: parseFloat(e.target.value) || 0
                          })}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs">QR</label>
                        <Input 
                          type="number" 
                          min="0" 
                          value={mixedPayment.qr.toString()} 
                          onChange={(e) => setMixedPayment({
                            ...mixedPayment,
                            qr: parseFloat(e.target.value) || 0
                          })}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs">Tarjeta Crédito</label>
                        <Input 
                          type="number" 
                          min="0" 
                          value={mixedPayment.credit_card.toString()} 
                          onChange={(e) => setMixedPayment({
                            ...mixedPayment,
                            credit_card: parseFloat(e.target.value) || 0
                          })}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs">Tarjeta Débito</label>
                        <Input 
                          type="number" 
                          min="0" 
                          value={mixedPayment.debit_card.toString()} 
                          onChange={(e) => setMixedPayment({
                            ...mixedPayment,
                            debit_card: parseFloat(e.target.value) || 0
                          })}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs">Cheque</label>
                        <Input 
                          type="number" 
                          min="0" 
                          value={mixedPayment.check.toString()} 
                          onChange={(e) => setMixedPayment({
                            ...mixedPayment,
                            check: parseFloat(e.target.value) || 0
                          })}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs">Cuenta Corriente</label>
                        <Input 
                          type="number" 
                          min="0" 
                          value={mixedPayment.current_account.toString()} 
                          onChange={(e) => setMixedPayment({
                            ...mixedPayment,
                            current_account: parseFloat(e.target.value) || 0
                          })}
                        />
                      </div>
                    </div>
                    
                    <div className="mt-2 text-right text-sm">
                      <span className="text-muted-foreground">Total de pagos: </span>
                      <span className={`font-medium ${
                        Object.values(mixedPayment).reduce((a, b) => a + b, 0) === cartTotal
                          ? 'text-green-600'
                          : 'text-orange-600'
                      }`}>
                        ${Object.values(mixedPayment).reduce((a, b) => a + b, 0).toFixed(2)}
                      </span>
                    </div>
                  </div>
                )}
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Observaciones</label>
                  <Input 
                    placeholder="Observaciones para la venta (opcional)" 
                    value={observations}
                    onChange={(e) => setObservations(e.target.value)}
                  />
                </div>
                
                <div className="space-y-4 mt-4">
                  <h4 className="text-sm font-medium">Ajustes al precio</h4>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Descuento (%)</label>
                      <Input 
                        type="number" 
                        min="0" 
                        max="100" 
                        step="0.1"
                        value={discountPercent}
                        onChange={(e) => setDiscountPercent(parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Recargo (%)</label>
                      <Input 
                        type="number" 
                        min="0" 
                        max="100" 
                        step="0.1"
                        value={surchargePercent}
                        onChange={(e) => setSurchargePercent(parseFloat(e.target.value) || 0)}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="flex justify-between text-lg font-semibold">
                  <span>Total a pagar</span>
                  <span>${cartTotal.toFixed(2)}</span>
                </div>
                {(discountPercent > 0 || surchargePercent > 0) && (
                  <div className="mt-2 text-sm text-muted-foreground">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>${cartSubtotal.toFixed(2)}</span>
                    </div>
                    {discountPercent > 0 && (
                      <div className="flex justify-between">
                        <span>Descuento ({discountPercent}%):</span>
                        <span>-${discountAmount.toFixed(2)}</span>
                      </div>
                    )}
                    {surchargePercent > 0 && (
                      <div className="flex justify-between">
                        <span>Recargo ({surchargePercent}%):</span>
                        <span>+${surchargeAmount.toFixed(2)}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
            
            {/* Columna derecha: Resumen de la venta */}
            <div className="space-y-4">
              <div className="border rounded-md">
                <div className="border-b px-4 py-3">
                  <h3 className="font-medium">Resumen de productos</h3>
                </div>
                
                <div className="px-4 py-2 max-h-[300px] overflow-y-auto">
                  {cart.map((item) => (
                    <div key={item.id} className="py-2 border-b last:border-0">
                      <div className="flex justify-between">
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded overflow-hidden bg-gray-100 flex-shrink-0">
                            {item.imageUrl ? (
                              <img 
                                src={item.imageUrl} 
                                alt={item.name}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center bg-gray-100 text-gray-400">
                                <Package className="h-4 w-4" />
                              </div>
                            )}
                          </div>
                          <div>
                            <div className="font-medium">{item.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {item.quantity} x ${item.price.toFixed(2)} ({item.unit})
                              {item.isConversion && (
                                <span className="ml-1 text-xs text-green-600">
                                  Factor: {item.conversionFactor}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="font-medium">${item.total.toFixed(2)}</div>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="border-t px-4 py-3">
                  <div className="flex justify-between">
                    <span className="font-medium">Subtotal</span>
                    <span>${cartSubtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Descuento: ${discountAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Recargo: ${surchargeAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-semibold mt-2 text-lg">
                    <span>Total</span>
                    <span>${cartTotal.toFixed(2)}</span>
                  </div>
                </div>
              </div>
              
              <div className="border rounded-md p-4">
                <h3 className="font-medium mb-3">Opciones de impresión</h3>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="print-ticket" 
                      checked={printTicket}
                      onCheckedChange={(checked) => setPrintTicket(checked as boolean)}
                    />
                    <label 
                      htmlFor="print-ticket" 
                      className="text-sm cursor-pointer"
                      onClick={() => setPrintTicket(!printTicket)}
                    >
                      Imprimir ticket
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="send-email" 
                      checked={sendEmail}
                      onCheckedChange={(checked) => setSendEmail(checked as boolean)}
                    />
                    <label 
                      htmlFor="send-email" 
                      className="text-sm cursor-pointer"
                      onClick={() => setSendEmail(!sendEmail)}
                    >
                      Enviar por email
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <DialogFooter className="flex justify-between mt-6">
            <Button variant="outline" onClick={() => setCheckoutDialogOpen(false)}>
              Cancelar
            </Button>
            <div className="space-x-2">
              <Button
                variant="secondary"
                disabled={processSaleMutation.isPending}
                onClick={() => {
                  // Lógica para guardar como borrador
                  toast({
                    title: "Venta guardada como borrador",
                    description: "Podrá completarla más tarde"
                  });
                  setCheckoutDialogOpen(false);
                }}
              >
                Guardar borrador
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
                  "Finalizar Venta"
                )}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Receipt Dialog */}
      <Dialog open={showReceiptDialog} onOpenChange={setShowReceiptDialog}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl">Comprobante de Venta</DialogTitle>
            <DialogHeader className="text-muted-foreground text-sm mt-1">
              Venta realizada exitosamente. Puede imprimir o exportar el comprobante.
            </DialogHeader>
          </DialogHeader>
          
          {completedSale && (
            <div className="py-4">
              <div className="mb-5 border rounded-lg p-4">
                <div ref={receiptRef} className="w-full">
                  {completedSale.documentType.startsWith('factura') ? (
                    <InvoiceContent 
                      invoice={completedSale} 
                      items={completedSale.items}
                      customer={completedSale.customer}
                    />
                  ) : (
                    <div className="receipt-preview p-6 bg-white rounded-lg border border-dashed">
                      <div className="text-center mb-4">
                        <h3 className="font-mono font-bold text-lg">PUNTO PASTELERO</h3>
                        <p className="font-mono text-sm">Avenida Siempre Viva 123, Springfield</p>
                        <p className="font-mono text-sm">(555) 123-4567</p>
                        <p className="font-mono text-sm">CUIT: 30-12345678-9</p>
                      </div>
                      <div className="border-t border-dashed my-4"></div>
                      <div className="font-mono text-sm">
                        <p><b>Fecha:</b> {new Date(completedSale.timestamp).toLocaleString()}</p>
                        <p><b>Ticket #:</b> {completedSale.id || 'N/A'}</p>
                        <p><b>Comprobante:</b> {completedSale.documentType}</p>
                        <p><b>Cliente:</b> {completedSale.customer?.name || 'Consumidor Final'}</p>
                        <p><b>Vendedor:</b> {completedSale.userId || 'N/A'}</p>
                      </div>
                      <div className="border-t border-dashed my-4"></div>
                      <div className="font-mono text-sm">
                        <p className="font-bold">PRODUCTOS</p>
                        {completedSale.items.map((item: any, index: number) => (
                          <div key={index} className="my-2">
                            <div className="font-bold">{item.name}</div>
                            <div>{item.quantity} x ${parseFloat(item.price).toFixed(2)} = ${parseFloat(item.total).toFixed(2)}</div>
                            {item.isConversion && (
                              <div className="text-xs">Presentación: {item.unit} (Factor: {item.conversionFactor})</div>
                            )}
                          </div>
                        ))}
                      </div>
                      <div className="border-t border-dashed my-4"></div>
                      <div className="font-mono text-sm text-right">
                        <p className="font-bold">TOTAL: ${parseFloat(completedSale.total).toFixed(2)}</p>
                        {(completedSale.discountPercent > 0 || completedSale.surchargePercent > 0) && (
                          <>
                            <p className="text-xs mt-2">Subtotal: ${parseFloat(completedSale.subtotal).toFixed(2)}</p>
                            {completedSale.discountPercent > 0 && (
                              <p className="text-xs">Descuento ({completedSale.discountPercent}%): -${parseFloat((completedSale.discountAmount ?? 0).toString()).toFixed(2)}</p>
                            )}
                            {completedSale.surchargePercent > 0 && (
                              <p className="text-xs">Recargo ({completedSale.surchargePercent}%): +${parseFloat(completedSale.surchargeAmount).toFixed(2)}</p>
                            )}
                          </>
                        )}
                      </div>
                      <div className="font-mono text-xs text-center mt-4">
                        <p>Gracias por su compra!</p>
                        <p>Punto Pastelero</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              <DialogFooter className="flex flex-col sm:flex-row gap-3 justify-end">
                <Button 
                  variant="outline"
                  onClick={() => setShowReceiptDialog(false)}
                >
                  Cerrar
                </Button>
                
                <Button
                  variant="secondary"
                  onClick={() => {
                    // Generar un PDF con el comprobante (factura o remito)
                    PDFService.generateInvoicePDF(
                      completedSale,
                      completedSale.items,
                      completedSale.customer
                    );
                  }}
                >
                  Exportar a PDF
                </Button>
                
                <ThermalTicket
                  sale={completedSale}
                  items={completedSale.items}
                  customer={completedSale.customer}
                  businessInfo={{
                    name: 'PUNTO PASTELERO',
                    address: 'Avenida Siempre Viva 123, Springfield',
                    phone: '(555) 123-4567',
                    taxId: '30-12345678-9'
                  }}
                />
                
                {completedSale.documentType.startsWith('factura') && (
                  <Button
                    onClick={() => {
                      // Enviar por email
                      toast({
                        title: "Enviando por email",
                        description: "El comprobante se enviará al correo del cliente"
                      });
                    }}
                  >
                    Enviar por Email
                  </Button>
                )}
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export { POSPage };
export default POSPage;
