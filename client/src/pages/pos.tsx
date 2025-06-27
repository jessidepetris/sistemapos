import React, { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { PaymentMethod, PaymentDetails, BankAccount } from "@/shared/types";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Package, ShoppingBag, Search, Trash2, X, ShoppingCart, Plus, Minus, Tag } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ThermalTicket } from "@/components/printing/ThermalTicket";
import { InvoicePDF } from "@/components/printing/InvoicePDF";
import { InvoiceContent } from "@/components/invoices/InvoiceDetail";
import { PDFService } from "@/services/pdfService";
import { formatCurrency } from "@/lib/utils";
import { jsPDF } from "jspdf";
import { toPng } from "html-to-image";

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
  currency: string;
};

// Utilidad para convertir precios entre monedas
function convertPrice(price: number, fromCurrency: string, toCurrency: string): number {
  if (fromCurrency === toCurrency) return price;
  // Tasa fija de ejemplo: 1 USD = 1000 ARS
  const exchangeRate = fromCurrency === "USD" && toCurrency === "ARS"
    ? 1000
    : fromCurrency === "ARS" && toCurrency === "USD"
      ? 1 / 1000
      : 1;
  return price * exchangeRate;
}

const POSPage = () => {
  const { user, isLoading: isLoadingUser } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [priceType, setPriceType] = useState<"retail" | "wholesale">("retail");
  const [saleCurrency, setSaleCurrency] = useState<"ARS" | "USD">("ARS");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [paymentDetails, setPaymentDetails] = useState<PaymentDetails>({
    method: "cash",
    amount: 0,
    currency: "ARS"
  });
  const [checkoutDialogOpen, setCheckoutDialogOpen] = useState(false);
  const [barcodeInput, setBarcodeInput] = useState("");
  const [documentType, setDocumentType] = useState<"factura_c" | "remito_x" | "pedido" | "presupuesto">("remito_x");
  const [observations, setObservations] = useState("");
  const [printTicket, setPrintTicket] = useState(true);
  const [sendEmail, setSendEmail] = useState(false);
  const [cardType, setCardType] = useState("credit");
  const [discountPercent, setDiscountPercent] = useState(0);
  const [surchargePercent, setSurchargePercent] = useState(0);
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
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [saleId, setSaleId] = useState<number | null>(null);
  const [showInvoice, setShowInvoice] = useState(false);
  const [invoiceType, setInvoiceType] = useState<"remito_x" | "factura_c">("remito_x");
  const [showThermalTicket, setShowThermalTicket] = useState(false);
  const [showInvoicePDF, setShowInvoicePDF] = useState(false);
  const [printOptions, setPrintOptions] = useState({
    printCustomer: true,
    printPrices: true,
    printBarcodes: true,
    printNotes: true,
    copies: 1
  });
  const barcodeInputRef = useRef<HTMLInputElement>(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [lastCart, setLastCart] = useState<CartItem[]>([]);
  
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
  const { data: bankAccounts = [], isLoading: isLoadingBankAccounts } = useQuery<BankAccount[]>({
    queryKey: ["/api/bank-accounts"],
    retry: false,
  });
  
  // Process sale mutation
  const processSaleMutation = useMutation({
    mutationFn: async (saleData: any) => {
      let endpoint = "/api/sales";
      let data = saleData;
      
      // Determinar el endpoint según el tipo de documento
      if (saleData.documentType === "presupuesto") {
        endpoint = "/api/quotations";
        // Transformar los datos al formato esperado por el endpoint de presupuestos
        data = {
          clientId: Number(saleData.customerId),
          dateValidUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 días de validez
          notes: saleData.notes || "",
          items: saleData.items.map((item: any) => ({
            productId: Number(item.productId),
            quantity: Math.round(Number(item.quantity)), // Convertir a entero
            unitPrice: Number(item.price),
            subtotal: Number(item.total)
          }))
        };

        // Validar que todos los valores numéricos sean válidos
        if (isNaN(data.clientId)) {
          throw new Error("ID de cliente inválido");
        }
        if (data.items.some((item: any) => 
          isNaN(item.productId) || 
          isNaN(item.quantity) || 
          isNaN(item.unitPrice) || 
          isNaN(item.subtotal)
        )) {
          throw new Error("Valores numéricos inválidos en los items");
        }

        // Validar que la cantidad sea un entero positivo
        if (data.items.some((item: any) => 
          !Number.isInteger(item.quantity) || 
          item.quantity <= 0
        )) {
          throw new Error("Las cantidades deben ser números enteros positivos");
        }
      } else if (saleData.documentType === "pedido") {
        endpoint = "/api/orders";
      }

      const res = await apiRequest("POST", endpoint, data);
      if (!res.ok) {
        const errorData = await res.json();
        if (res.status === 401 && errorData.code === "SESSION_EXPIRED") {
          throw new Error("SESSION_EXPIRED");
        }
        throw new Error(errorData.message || "Error al procesar el documento");
      }
      return await res.json();
    },
    onSuccess: (data) => {
      // Invalidar consultas según el tipo de documento
      if (data.documentType === "presupuesto") {
        queryClient.invalidateQueries({ queryKey: ["/api/presupuestos"] });
      } else if (data.documentType === "pedido") {
        queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      } else {
        // Para ventas (facturas y remitos)
        queryClient.invalidateQueries({ queryKey: ["/api/products"] });
        queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
        queryClient.invalidateQueries({ queryKey: ["/api/dashboard/recent-sales"] });
        queryClient.invalidateQueries({ queryKey: ["/api/dashboard/recent-activity"] });
        queryClient.invalidateQueries({ queryKey: ["/api/dashboard/inventory-alerts"] });
      }
      
      // Guardar el documento completado y mostrar el recibo
      setCompletedSale({
        ...data,
        items: data.items || lastCart,
        timestamp: new Date().toISOString(),
        paymentMethod: data.paymentMethod || lastSaleData?.paymentMethod,
        paymentDetails: data.paymentDetails || lastSaleData?.paymentDetails,
        documentType: data.documentType || lastSaleData?.documentType,
        notes: data.notes || lastSaleData?.notes,
        subtotal: data.subtotal || lastSaleData?.subtotal,
        discountPercent: data.discountPercent || lastSaleData?.discountPercent,
        discountAmount: data.discount !== undefined ? parseFloat(data.discount) : (lastSaleData?.discountAmount !== undefined ? parseFloat(lastSaleData.discountAmount) : 0),
        surchargePercent: data.surchargePercent || lastSaleData?.surchargePercent,
        surchargeAmount: data.surchargeAmount || lastSaleData?.surchargeAmount,
        customer: customers?.find((c: any) => c.id === (data.customerId || lastSaleData?.customerId))
      });

      // Mostrar el diálogo de recibo solo para ventas
      if (data.documentType === "factura_c" || data.documentType === "remito_x") {
        setShowReceiptDialog(true);
      }
      
      // Limpiar estado
      setTimeout(() => {
        setCart([]);
        setSelectedCustomerId(null);
        setCheckoutDialogOpen(false);
      }, 500);
      
      // Mostrar mensaje según el tipo de documento
      let successMessage = "Venta completada";
      let successDescription = "La venta se ha procesado correctamente y el stock ha sido actualizado";
      
      if (data.documentType === "presupuesto") {
        successMessage = "Presupuesto guardado";
        successDescription = "El presupuesto ha sido guardado exitosamente";
      } else if (data.documentType === "pedido") {
        successMessage = "Pedido guardado";
        successDescription = "El pedido ha sido guardado exitosamente";
      }

      toast({
        title: successMessage,
        description: successDescription
      });
    },
    onError: (error) => {
      if ((error as Error).message === "SESSION_EXPIRED") {
        toast({
          title: "Sesión expirada",
          description: "Por favor, inicie sesión nuevamente para continuar",
          variant: "destructive",
        });
        window.location.href = "/login";
        return;
      }
      
      toast({
        title: "Error al procesar el documento",
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
  const addToCart = (product: any, quantity: number = 1, unit: string = product.baseUnit) => {
    // Determinar el precio base según el tipo de precio seleccionado
    const basePrice = priceType === "wholesale" && product.wholesalePrice 
      ? parseFloat(product.wholesalePrice) 
      : parseFloat(product.price);
    // Convertir el precio a la moneda de venta si es necesario
    let price = convertPrice(
      basePrice,
      product.currency || "ARS",
      saleCurrency
    );

    // Obtener nombre e imagen de forma robusta
    const productName = product.name || product.title || product.nombre || "Producto sin nombre";
    const productImageUrl = product.imageUrl || product.image || product.img || null;

    const existingItem = cart.find(item => item.productId === product.id && item.unit === unit);
    if (existingItem) {
      const newQuantity = existingItem.quantity + quantity;
      if (newQuantity > existingItem.stockAvailable) {
        toast({
          title: "Stock insuficiente",
          description: `No hay suficiente stock disponible (${existingItem.stockAvailable} ${unit})`,
          variant: "destructive",
        });
        return;
      }
      setCart(cart.map(item =>
        item.id === existingItem.id
          ? {
              ...item,
              quantity: newQuantity,
              total: newQuantity * price
            }
          : item
      ));
    } else {
      if (quantity > parseFloat(product.stock)) {
        toast({
          title: "Stock insuficiente",
          description: `No hay suficiente stock disponible (${product.stock} ${unit})`,
          variant: "destructive",
        });
        return;
      }
      setCart([
        ...cart,
        {
          id: Date.now(),
          productId: product.id,
          name: productName,
          price: price,
          quantity: quantity,
          unit: unit,
          total: quantity * price,
          stockAvailable: parseFloat(product.stock),
          isBulk: product.isBulk,
          isRefrigerated: product.isRefrigerated,
          conversionRates: product.conversionRates,
          imageUrl: productImageUrl,
          isConversion: false,
          conversionFactor: 1,
          currency: saleCurrency
        }
      ]);
    }
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
    // Convertir el precio base a la moneda de venta
    const convertedBasePrice = convertPrice(
      basePrice,
      product.currency || "ARS",
      saleCurrency
    );
    // Calculamos el precio basado en el factor de conversión
    const conversionPrice = convertedBasePrice * conversion.factor;
    
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
          conversionBarcode: conversion.barcode,
          currency: saleCurrency,
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
    console.log("handleCheckout called", {
      cartLength: cart.length,
      selectedCustomerId,
      paymentMethod,
      checkoutDialogOpen
    });
    if (cart.length === 0) {
      toast({
        title: "Carrito vacío",
        description: "Agregue productos al carrito antes de finalizar la venta",
        variant: "destructive",
      });
      return;
    }

    if (!paymentMethod) {
      toast({
        title: "Método de pago no seleccionado",
        description: "Seleccione un método de pago antes de finalizar la venta",
        variant: "destructive",
      });
      return;
    }

    setCheckoutDialogOpen(true);
  };
  
  // Finalize sale
  const finalizeSale = async () => {
    try {
      // Validar tipo de comprobante
      if (!documentType) {
        toast({
          title: "Error",
          description: "Debe seleccionar un tipo de comprobante",
          variant: "destructive",
        });
        return;
      }

      // Construir el array de métodos de pago según el método seleccionado
      let paymentMethods = [];
      if (paymentMethod === 'mixed') {
        // Para pago mixto, agregar todos los métodos con monto > 0
        paymentMethods = Object.entries(mixedPayment)
          .filter(([method, amount]) => amount > 0)
          .map(([method, amount]) => ({
            method,
            amount,
            currency: saleCurrency
          }));
      } else {
        // Para métodos simples, agregar uno solo
        paymentMethods = [{
          method: paymentMethod,
          amount: cartTotal,
          currency: saleCurrency
        }];
      }

      // Determinar el estado según el tipo de comprobante
      let status = "completed";
      if (documentType === "presupuesto") {
        status = "presupuesto";
      } else if (documentType === "pedido") {
        status = "pedido";
      }

      const saleData = {
        customerId: selectedCustomerId,
        userId: user?.id,
        total: cartTotal,
        subtotal: cartSubtotal,
        discount: discountAmount,
        surcharge: surchargeAmount,
        discountPercent,
        surchargePercent,
        paymentMethods,
        documentType,
        status,
        currency: saleCurrency,
        items: cart.map(item => ({
          productId: item.productId,
          name: item.name,
          quantity: item.quantity,
          unit: item.unit,
          price: item.price,
          discount: 0,
          total: item.total,
          isConversion: item.isConversion,
          conversionFactor: item.conversionFactor,
          conversionUnit: item.conversionUnit,
          conversionBarcode: item.conversionBarcode,
          currency: saleCurrency
        }))
      };

      // En finalizeSale, antes de llamar a la mutación:
      setLastCart(cart);
      await processSaleMutation.mutateAsync(saleData);

      // Mostrar mensaje según el tipo de comprobante
      let successMessage = "Venta completada";
      if (documentType === "presupuesto") {
        successMessage = "Presupuesto guardado exitosamente";
      } else if (documentType === "pedido") {
        successMessage = "Pedido guardado exitosamente";
      }

      toast({
        title: successMessage,
        description: documentType === "presupuesto" || documentType === "pedido" 
          ? "El documento ha sido guardado y puede ser consultado en su sección correspondiente"
          : "La venta se ha procesado correctamente y el stock ha sido actualizado"
      });

      // Mostrar opciones de impresión solo para facturas y remitos
      if (documentType === "factura_c" || documentType === "remito_x") {
        setShowThermalTicket(true);
      }
    } catch (error) {
      toast({
        title: "Error al finalizar la venta",
        description: (error as Error).message,
        variant: "destructive",
      });
    }
  };
  
  // Actualizar precios del carrito cuando cambia priceType o saleCurrency
  useEffect(() => {
    if (!products || products.length === 0 || cart.length === 0) return;
    setCart(prevCart => prevCart.map(item => {
      // Buscar el producto original
      const product = products.find((p: any) => p.id === item.productId);
      if (!product) return item; // Si no se encuentra, dejar igual
      // Si es conversión
      if (item.isConversion && item.conversionUnit) {
        // Buscar la conversión correspondiente
        const conversions = typeof product.conversionRates === 'string'
          ? JSON.parse(product.conversionRates)
          : product.conversionRates;
        const conversion = Array.isArray(conversions)
          ? conversions.find((conv: any) => conv.unit === item.conversionUnit)
          : null;
        if (!conversion) return item;
        const basePrice = priceType === "wholesale" && product.wholesalePrice
          ? parseFloat(product.wholesalePrice)
          : parseFloat(product.price);
        const convertedBasePrice = convertPrice(
          basePrice,
          product.currency || "ARS",
          saleCurrency
        );
        const conversionPrice = convertedBasePrice * conversion.factor;
        return {
          ...item,
          price: conversionPrice,
          total: conversionPrice * item.quantity,
          currency: saleCurrency
        };
      } else {
        // Producto normal
        const basePrice = priceType === "wholesale" && product.wholesalePrice
          ? parseFloat(product.wholesalePrice)
          : parseFloat(product.price);
        const price = convertPrice(
          basePrice,
          product.currency || "ARS",
          saleCurrency
        );
        return {
          ...item,
          price,
          total: price * item.quantity,
          currency: saleCurrency
        };
      }
    }));
  }, [priceType, saleCurrency, products]);
  
  // Agregar logs para depuración antes del Dialog de recibo
  console.log('completedSale:', completedSale);
  console.log('showReceiptDialog:', showReceiptDialog);
  
  const handleDocumentTypeChange = (value: string) => {
    const newValue = value as "factura_c" | "remito_x" | "pedido" | "presupuesto";
    setDocumentType(newValue);
    // Si es presupuesto o pedido, no permitir finalizar la venta
    if (newValue === "presupuesto" || newValue === "pedido") {
      setCheckoutDialogOpen(false);
    }
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
                {/* Selector de tipo de comprobante */}
                <div className="mb-4">
                  <Select 
                    value={documentType} 
                    onValueChange={handleDocumentTypeChange}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Seleccionar tipo de comprobante" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="factura_c">Factura C</SelectItem>
                      <SelectItem value="remito_x">Remito X</SelectItem>
                      <SelectItem value="pedido">Nota de Pedido</SelectItem>
                      <SelectItem value="presupuesto">Presupuesto</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
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
                    onValueChange={(value: "retail" | "wholesale") => setPriceType(value)}
                  >
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="Tipo de precio" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="retail">Minorista</SelectItem>
                      <SelectItem value="wholesale">Mayorista</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select
                    value={saleCurrency}
                    onValueChange={(value: "ARS" | "USD") => setSaleCurrency(value)}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Moneda de venta" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ARS">Pesos Argentinos (ARS)</SelectItem>
                      <SelectItem value="USD">Dólares (USD)</SelectItem>
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
                        {filteredProducts.map((product: any) => {
                          const productName = product.name || product.title || product.nombre || "Producto sin nombre";
                          const productImageUrl = product.imageUrl || product.image || product.img || null;

                          // Calcular el precio mostrado en la tarjeta según la moneda seleccionada
                          const displayPrice = convertPrice(
                            priceType === "wholesale" && product.wholesalePrice 
                              ? parseFloat(product.wholesalePrice) 
                              : parseFloat(product.price),
                            product.currency || "ARS",
                            saleCurrency
                          );

                          return (
                            <Card key={product.id} className="cursor-pointer hover:bg-accent/50 transition-colors" onClick={() => addToCart(product)}>
                              <CardContent className="p-4">
                                <div className="flex flex-col text-sm">
                                  <div className="mt-1 flex flex-col gap-2">
                                    {/* Imagen del producto */}
                                    <div className="h-32 w-full rounded overflow-hidden bg-gray-100 flex-shrink-0">
                                      {productImageUrl ? (
                                        <img
                                          src={productImageUrl}
                                          alt={productName}
                                          className="h-full w-full object-cover"
                                        />
                                      ) : (
                                        <div className="flex h-full w-full items-center justify-center bg-gray-100 text-gray-400">
                                          <Package className="h-8 w-8" />
                                        </div>
                                      )}
                                    </div>
                                    <div className="flex flex-col gap-1">
                                      {/* Nombre del producto */}
                                      <div className="font-bold text-base">{productName}</div>
                                      {/* Precio que aplica según la selección actual */}
                                      <div className="font-bold text-base">
                                        {formatCurrency(
                                          displayPrice,
                                          saleCurrency
                                        )}
                                      </div>
                                      
                                      {/* Mostrar el otro precio si existe */}
                                      {product.wholesalePrice && (
                                        <div className="text-xs text-muted-foreground">
                                          {priceType === "wholesale" 
                                            ? `Min: ${formatCurrency(convertPrice(parseFloat(product.price), product.currency || "ARS", saleCurrency), saleCurrency)}` 
                                            : `May: ${formatCurrency(convertPrice(parseFloat(product.wholesalePrice), product.currency || "ARS", saleCurrency), saleCurrency)}`
                                          }
                                        </div>
                                      )}
                                      
                                      {/* Stock */}
                                      <div className="text-xs">
                                        <Badge variant={parseFloat(product.stock) > 0 ? "default" : "destructive"} className="text-xs">
                                          {parseFloat(product.stock).toFixed(2)} {product.baseUnit}
                                        </Badge>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                
                                {/* Si tiene presentaciones alternativas */}
                                {product.conversionRates && product.conversionRates.length > 0 && (
                                  <div className="mt-2 pt-2 border-t">
                                    <div className="text-xs font-medium mb-1 text-muted-foreground">Presentaciones:</div>
                                    <div className="space-y-1">
                                      {product.conversionRates.map((conversion: any, index: number) => {
                                        // Calcular el precio de la conversión en la moneda seleccionada
                                        const basePrice = priceType === "wholesale" && product.wholesalePrice 
                                          ? parseFloat(product.wholesalePrice) 
                                          : parseFloat(product.price);
                                        const convertedBasePrice = convertPrice(
                                          basePrice,
                                          product.currency || "ARS",
                                          saleCurrency
                                        );
                                        const conversionPrice = convertedBasePrice * conversion.factor;
                                        return (
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
                                                conversionPrice,
                                                saleCurrency
                                              )}
                                            </span>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                )}
                              </CardContent>
                            </Card>
                          );
                        })}
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
                      {documentType === "presupuesto" ? "Guardar Presupuesto" :
                       documentType === "pedido" ? "Guardar Pedido" :
                       documentType === "factura_c" ? "Finalizar Venta con Factura C" :
                       "Finalizar Venta con Remito X"}
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
            <DialogTitle className="text-xl">
              {documentType === "presupuesto" ? "Guardar Presupuesto" :
               documentType === "pedido" ? "Guardar Pedido" :
               documentType === "factura_c" ? "Finalizar Venta con Factura C" :
               "Finalizar Venta con Remito X"}
            </DialogTitle>
            <DialogHeader className="text-muted-foreground text-sm mt-1">
              {documentType === "presupuesto" ? "Complete los datos para guardar el presupuesto" :
               documentType === "pedido" ? "Complete los datos para guardar el pedido" :
               documentType === "factura_c" ? "Complete los datos para finalizar la venta y generar la factura C" :
               "Complete los datos para finalizar la venta y generar el remito X"}
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
                  <Select 
                    value={documentType} 
                    onValueChange={handleDocumentTypeChange}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="factura_c">Factura C</SelectItem>
                      <SelectItem value="remito_x">Remito X</SelectItem>
                      <SelectItem value="pedido">Nota de Pedido</SelectItem>
                      <SelectItem value="presupuesto">Presupuesto</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Método de pago</label>
                  <Select value={paymentMethod} onValueChange={(value) => {
                    setPaymentMethod(value as PaymentMethod);
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
                          {bankAccounts?.map((account: BankAccount) => (
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
                onClick={() => setConfirmDialogOpen(true)}
                disabled={processSaleMutation.isPending}
              >
                {processSaleMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Procesando...
                  </>
                ) : documentType === "presupuesto" ? "Guardar Presupuesto" :
                   documentType === "pedido" ? "Guardar Pedido" :
                   documentType === "factura_c" ? "Finalizar Venta con Factura C" :
                   "Finalizar Venta con Remito X"
                }
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de confirmación de venta */}
      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>¿Desea confirmar la venta?</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-4">
            <p className="text-center text-lg">Esta acción finalizará la venta y generará el comprobante.</p>
          </div>
          <DialogFooter className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setConfirmDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={async () => {
                setConfirmDialogOpen(false);
                await finalizeSale();
              }}
              disabled={processSaleMutation.isPending}
            >
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de recibo */}
      <Dialog open={showReceiptDialog} onOpenChange={setShowReceiptDialog}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl">
              {completedSale?.documentType === "factura_c" ? "Factura C" :
               completedSale?.documentType === "remito_x" ? "Remito X" :
               "Comprobante"}
            </DialogTitle>
            <DialogDescription>
              {completedSale?.documentType === "factura_c" ? "Factura C generada exitosamente" :
               completedSale?.documentType === "remito_x" ? "Remito X generado exitosamente" :
               "Documento generado exitosamente"}
            </DialogDescription>
          </DialogHeader>
          {completedSale ? (
            <div className="py-4">
              <div className="mb-5 border rounded-lg p-4">
                <div ref={receiptRef} className="w-full">
                  <InvoiceContent 
                    invoice={completedSale}
                    items={completedSale.items}
                    customer={completedSale.customer}
                  />
                </div>
              </div>
              {completedSale.items ? (
                <DialogFooter className="flex flex-col sm:flex-row gap-3 justify-end">
                  <ThermalTicket
                    sale={completedSale}
                    saleItems={completedSale.items}
                    customerName={completedSale.customer?.name}
                  />
                  <Button
                    onClick={() => {
                      let text = `Comprobante de venta%0A`;
                      if (completedSale.items && completedSale.items.length > 0) {
                        completedSale.items.forEach((item: any) => {
                          text += `${item.name}: ${item.quantity} x $${parseFloat(item.price).toFixed(2)} = $${parseFloat(item.total).toFixed(2)}%0A`;
                        });
                      }
                      text += `Total: $${completedSale.total}`;
                      const url = `https://wa.me/?text=${text}`;
                      window.open(url, "_blank");
                    }}
                    variant="secondary"
                  >
                    Enviar por WhatsApp
                  </Button>
                  <Button
                    onClick={async () => {
                      if (!receiptRef.current) return;
                      const dataUrl = await toPng(receiptRef.current, { quality: 0.95 });
                      const pdf = new jsPDF({
                        orientation: "portrait",
                        unit: "mm",
                        format: "a4",
                      });
                      const imgProps = pdf.getImageProperties(dataUrl);
                      const pdfWidth = pdf.internal.pageSize.getWidth();
                      const pdfHeight = pdf.internal.pageSize.getHeight();
                      const imgWidth = imgProps.width;
                      const imgHeight = imgProps.height;
                      const scale = pdfWidth / imgWidth;
                      const scaledHeight = imgHeight * scale;
                      const finalScale = scaledHeight > pdfHeight ? (pdfHeight / scaledHeight) * scale : scale;
                      const finalWidth = imgWidth * finalScale;
                      const finalHeight = imgHeight * finalScale;
                      pdf.addImage(
                        dataUrl,
                        "PNG",
                        (pdfWidth - finalWidth) / 2,
                        10,
                        finalWidth,
                        finalHeight
                      );
                      const documentType = completedSale.documentType || "documento";
                      const documentId = completedSale.id || Date.now();
                      const fileName = `${documentType.replace("_", "")}_${documentId}.pdf`;
                      pdf.save(fileName);
                    }}
                    variant="outline"
                  >
                    Exportar PDF
                  </Button>
                </DialogFooter>
              ) : (
                <div className="p-6 text-center">Cargando comprobante...</div>
              )}
            </div>
          ) : (
            <div className="p-6 text-center">Cargando comprobante...</div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de ticket térmico - Solo para ventas */}
      {completedSale && completedSale.items && (completedSale.documentType === "factura_c" || completedSale.documentType === "remito_x") && (
        <ThermalTicket
          sale={completedSale}
          saleItems={completedSale.items}
          customerName={completedSale.customer?.name}
        />
      )}
    </div>
  );
};

export { POSPage };
export default POSPage;
