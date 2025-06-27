import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader,
  DialogTitle, DialogDescription
} from "@/components/ui/dialog";
import {
  Form, FormControl, FormField,
  FormItem, FormLabel, FormMessage
} from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertOrderSchema } from "../../../shared/schema";
import { Calendar, ClipboardList, Eye, Plus, Search, Trash2, Pencil, FileDown, Printer, MessageCircle, FileText, Loader2 } from "lucide-react";
import { DatePicker } from "@/components/ui/date-picker";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { OrderPDF, OrderPDFHelper } from "@/components/printing/OrderPDF";
import { Checkbox } from "@/components/ui/checkbox";

// Types for API responses
interface Customer {
  id: number;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
}

interface Product {
  id: number;
  name: string;
  price: string;
  stock: string;
  baseUnit: string;
  isRefrigerated: boolean;
  isBulk: boolean;
}

interface Route {
  id: number;
  name: string;
  active: boolean;
}

interface Order {
  id: number;
  timestamp: string;
  customer?: Customer;
  total: string;
  status: string;
  deliveryDate?: string;
  items: OrderItem[];
  notes?: string;
  deliveryMethod: string;
  route?: Route;
  shippingInfo?: string;
  source?: string;
}

interface OrderItem {
  productId: number;
  quantity: string;
  unit: string;
  price: string;
  total: string;
  productName: string;
  product?: Product;
}

// Form schema for new order
const orderFormSchema = z.object({
  customerId: z.string().optional(),
  routeId: z.string().optional(),
  deliveryDate: z.date().optional(),
  notes: z.string().optional(),
  status: z.string().optional(),
  shippingInfo: z.string().optional(),
  items: z.array(z.object({
    productId: z.number(),
    quantity: z.number().min(0.01, "La cantidad debe ser mayor a 0"),
    unit: z.string(),
    price: z.number(),
    name: z.string(),
    total: z.number(),
    isRefrigerated: z.boolean(),
    isBulk: z.boolean(),
  })).optional(),
});

type OrderFormValues = z.infer<typeof orderFormSchema>;

interface CreateOrderData {
  customerId: number | null;
  routeId: number | null;
  userId: number;
  total: string;
  status: string;
  source: "manual" | "web";
  deliveryMethod: "pickup" | "route" | "shipping";
  items: {
    productId: number;
    quantity: string;
    unit: string;
    price: string;
    total: string;
  }[];
  notes?: string;
  deliveryDate?: Date;
  shippingInfo?: string;
}

export default function OrdersPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [dateRange, setDateRange] = useState<{ startDate: Date | null; endDate: Date | null }>({ 
    startDate: null, 
    endDate: null 
  });
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [productSearch, setProductSearch] = useState("");
  const [orderItems, setOrderItems] = useState<any[]>([]);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isInvoiceDialogOpen, setIsInvoiceDialogOpen] = useState(false);
  const [invoiceDetails, setInvoiceDetails] = useState({
    documentType: "remito",
    paymentMethod: "cash",
    notes: "",
    printTicket: true,
    sendEmail: false,
    discountPercent: 0,
    surchargePercent: 0
  });
  
  // Función para obtener el teléfono del cliente de forma segura
  const getCustomerPhone = (customer: any): string => {
    if (customer && typeof customer === 'object') {
      return customer.phone || '';
    }
    return '';
  };
  
  // Get orders
  const { data: orders = [], isLoading } = useQuery<Order[]>({
    queryKey: ["/api/orders"],
    queryFn: async () => {
      console.log("Consultando órdenes...");
      const response = await apiRequest("GET", "/api/orders");
      console.log("Respuesta de la consulta de órdenes:", {
        status: response.status,
        contentType: response.headers.get("content-type")
      });
      
      if (!response.ok) {
        throw new Error("Error al cargar los pedidos");
      }
      
      const data = await response.json();
      console.log("Datos recibidos del servidor:", data);
      
      // Obtener todos los productos para poder asignar nombres
      const productsResponse = await apiRequest("GET", "/api/products");
      const products = await productsResponse.json();
      const productsMap = new Map(products.map((p: Product) => [p.id, p]));
      
      // Mapear los pedidos y asignar nombres de productos
      return data.map((order: any) => ({
        ...order,
        items: order.items.map((item: any) => ({
          ...item,
          product: productsMap.get(item.productId) || null
        }))
      }));
    },
    retry: false,
  });
  
  // Get customers for select dropdown
  const { data: customers = [] } = useQuery<Customer[]>({
    queryKey: ["/api/customers"],
    retry: false,
  });
  
  // Get products for adding to order
  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ["/api/products"],
    retry: false,
  });

  // Get routes for delivery
  const { data: routes = [] } = useQuery<Route[]>({
    queryKey: ["/api/delivery-routes"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/delivery-routes");
      if (!response.ok) {
        throw new Error("Error al cargar las rutas");
      }
      const data = await response.json();
      // Filtrar solo rutas activas
      return data.filter((route: any) => route.active);
    },
  });
  
  // Filtered routes including pickup option
  const deliveryOptions = [
    { id: "pickup", name: "RETIRO EN SUCURSAL" },
    { id: "shipping", name: "ENVÍO POR COMISIONISTA/CORREO" },
    ...routes.map(route => ({
      id: route.id.toString(),
      name: route.name
    }))
  ];
  
  // Form definition
  const form = useForm<OrderFormValues>({
    resolver: zodResolver(orderFormSchema),
    defaultValues: {
      customerId: "",
      routeId: "",
      notes: "",
      shippingInfo: "",
    },
  });
  
  // Create order mutation
  const createOrderMutation = useMutation({
    mutationFn: async (data: OrderFormValues) => {
      console.log("Mutation - Datos del formulario recibidos:", data);
      
      if (!orderItems.length) {
        throw new Error("Debe agregar al menos un producto al pedido");
      }

      const submitData = {
        customerId: data.customerId ? parseInt(data.customerId) : null,
        userId: 1,
        total: calculateTotal().toString(),
        status: "pending",
        source: "manual",
        notes: data.notes || "",
        deliveryDate: data.deliveryDate,
        items: orderItems.map(item => ({
          productId: item.productId,
          quantity: item.quantity.toString(),
          unit: item.unit,
          price: item.price.toString(),
          total: item.total.toString(),
          productName: item.name
        }))
      };

      console.log("Mutation - Datos preparados para enviar:", submitData);
      
      try {
        const response = await apiRequest("POST", "/api/orders", submitData);
        console.log("Mutation - Respuesta del servidor:", response);
        
        if (!response.ok) {
          let errorMsg = "Error al crear el pedido";
          try {
            const errorData = await response.json();
            errorMsg = errorData.message || errorMsg;
          } catch (e) {
            console.error("Error al procesar la respuesta de error:", e);
          }
          throw new Error(errorMsg);
        }
        
        return response.json();
      } catch (error) {
        console.error("Error en la mutación de creación:", error);
        // Si es un error 401, mostramos un mensaje específico
        if (error instanceof Error && error.message.includes("401")) {
          throw new Error("Su sesión ha expirado. Por favor, inicie sesión nuevamente para continuar.");
        }
        throw error;
      }
    },
    onSuccess: (data) => {
      console.log("Mutation - Éxito:", data);
      toast({ 
        title: "Pedido creado correctamente",
        variant: "default"
      });
      form.reset();
      setOrderItems([]);
      setIsDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
    },
    onError: (error) => {
      console.error("Mutation - Error:", error);
      toast({ 
        title: "Error al crear pedido",
        description: error instanceof Error ? error.message : "Ha ocurrido un error inesperado",
        variant: "destructive" 
      });
    }
  });
  
  // Update order mutation
  const updateOrderMutation = useMutation({
    mutationFn: async (data: OrderFormValues & { id: number }) => {
      console.log("Update Mutation - Datos del formulario recibidos:", data);
      
      if (!orderItems.length) {
        throw new Error("Debe agregar al menos un producto al pedido");
      }

      const submitData = {
        customerId: data.customerId ? parseInt(data.customerId) : null,
        routeId: data.routeId === "pickup" || data.routeId === "shipping" ? null : data.routeId ? parseInt(data.routeId) : null,
        total: calculateTotal().toString(),
        status: data.status || "pending",
        deliveryMethod: data.routeId === "pickup" ? "pickup" : (data.routeId === "shipping" ? "shipping" : "route"),
        items: orderItems.map(item => ({
          productId: item.productId,
          quantity: item.quantity.toString(),
          unit: item.unit,
          price: item.price.toString(),
          total: item.total.toString(),
          productName: item.name
        })),
        notes: data.notes || "",
        deliveryDate: data.deliveryDate,
        shippingInfo: data.routeId === "shipping" ? data.shippingInfo : "",
      };

      console.log("Update Mutation - Datos preparados para enviar:", submitData);
      
      try {
        // Usar fetch con URL absoluta para evitar problemas de enrutamiento
        const apiUrl = window.location.origin + `/api/orders/${data.id}`;
        console.log(`Enviando solicitud PUT a ${apiUrl}`);
        
        const response = await fetch(apiUrl, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json"
          },
          body: JSON.stringify(submitData),
          credentials: "include" // Enviar cookies
        });
        
        console.log("Update Mutation - Respuesta del servidor:", {
          status: response.status,
          statusText: response.statusText,
          contentType: response.headers.get("content-type")
        });
        
        // Comprobar si la respuesta es HTML
        const contentType = response.headers.get("content-type") || "";
        if (contentType.includes("text/html")) {
          const html = await response.text();
          console.error("Recibido HTML en lugar de JSON:", html.substring(0, 1000));
          throw new Error("El servidor devolvió HTML en lugar de JSON. Posible problema con la sesión o el endpoint.");
        }
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error("Error en la respuesta:", errorText);
          throw new Error(`Error ${response.status}: ${response.statusText}. ${errorText}`);
        }
        
        try {
          const responseClone = response.clone();
          const jsonData = await response.json();
          console.log("Datos JSON recibidos:", jsonData);
          return jsonData;
        } catch (jsonError) {
          console.error("Error al parsear JSON:", jsonError);
          const text = await response.clone().text();
          console.error("Texto de la respuesta:", text.substring(0, 1000));
          throw new Error("Error al procesar la respuesta JSON del servidor.");
        }
      } catch (error) {
        console.error("Error en la mutación de actualización:", error);
        throw error;
      }
    },
    onSuccess: (data) => {
      console.log("Update Mutation - Éxito:", data);
      toast({ 
        title: "Pedido actualizado correctamente",
        variant: "default"
      });
      form.reset();
      setOrderItems([]);
      setIsDialogOpen(false);
      setIsEditMode(false);
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
    },
    onError: (error) => {
      console.error("Update Mutation - Error:", error);
      toast({ 
        title: "Error al actualizar pedido",
        description: error instanceof Error ? error.message : "Ha ocurrido un error inesperado",
        variant: "destructive" 
      });
    }
  });
  
  // Update order status mutation
  const updateOrderStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number, status: string }) => {
      const res = await apiRequest("PATCH", `/api/orders/${id}/status`, { status });
      return await res.json();
    },
    onSuccess: () => {
      toast({ title: "Estado del pedido actualizado correctamente" });
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      setIsDetailDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Error al actualizar el estado",
        description: (error as Error).message,
        variant: "destructive",
      });
    }
  });
  
  // Convertir pedido a factura
  const convertToInvoiceMutation = useMutation({
    mutationFn: async (data: any) => {
      console.log("Enviando datos para crear factura:", data);
      try {
        const res = await apiRequest("POST", `/api/invoices/from-order/${data.orderId}`, {
          documentType: data.documentType,
          paymentMethod: data.paymentMethod,
          notes: data.notes,
          printOptions: {
            printTicket: data.printTicket,
            sendEmail: data.sendEmail
          },
          discountPercent: data.discountPercent,
          surchargePercent: data.surchargePercent
        });
        
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.message || "Error al crear la factura");
        }
        
        return await res.json();
      } catch (error) {
        console.error("Error en la mutación convertToInvoice:", error);
        throw error;
      }
    },
    onSuccess: (data) => {
      console.log("Factura creada con éxito:", data);
      toast({ 
        title: "Factura creada correctamente", 
        description: `Se ha creado la factura #${data.id || data.invoice?.id} a partir del pedido.`,
        variant: "default" 
      });
      
      // Actualizar todas las consultas relevantes
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      queryClient.invalidateQueries({ queryKey: ["/api/sales"] });
      
      // Redirigir a la página de facturas después de un tiempo para que el usuario vea el mensaje
      setTimeout(() => {
        window.location.href = "/invoices";
      }, 2500);
    },
    onError: (error) => {
      console.error("Error al crear la factura:", error);
      toast({
        title: "Error al crear la factura",
        description: (error as Error).message || "Hubo un problema al procesar la solicitud",
        variant: "destructive",
      });
    }
  });
  
  // Función para abrir el diálogo de facturación
  const handleOpenInvoiceDialog = (order: Order) => {
    setSelectedOrder(order);
    setInvoiceDetails({
      documentType: "remito",
      paymentMethod: "cash",
      notes: order.notes || "",
      printTicket: true,
      sendEmail: false,
      discountPercent: 0,
      surchargePercent: 0
    });
    setIsInvoiceDialogOpen(true);
  };
  
  // Función para enviar los datos de facturación
  const handleInvoiceSubmit = () => {
    if (!selectedOrder) {
      toast({
        title: "Error",
        description: "No hay un pedido seleccionado para facturar",
        variant: "destructive"
      });
      return;
    }
    
    console.log("Enviando factura para el pedido:", selectedOrder.id, "con detalles:", invoiceDetails);
    
    try {
      // Preparar los detalles del pago según el método seleccionado
      const paymentDetails = {
        mixedPayment: {
          cash: invoiceDetails.paymentMethod === 'cash' ? parseFloat(selectedOrder.total) : 0,
          transfer: invoiceDetails.paymentMethod === 'transfer' ? parseFloat(selectedOrder.total) : 0,
          current_account: invoiceDetails.paymentMethod === 'current_account' ? parseFloat(selectedOrder.total) : 0,
          card: invoiceDetails.paymentMethod === 'card' ? parseFloat(selectedOrder.total) : 0,
        }
      };

      convertToInvoiceMutation.mutate({
        orderId: selectedOrder.id,
        ...invoiceDetails,
        paymentDetails
      });
      
      setIsInvoiceDialogOpen(false);
    } catch (error) {
      console.error("Error al enviar datos de factura:", error);
      toast({
        title: "Error",
        description: "No se pudo procesar la solicitud de facturación",
        variant: "destructive"
      });
    }
  };
  
  // Date formatting
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };
  
  // Filtered orders
  const filteredOrders = orders
    ? orders.filter((order: any) => {
        // Filter by search query
        const matchesSearch = !searchQuery || 
          order.id.toString().includes(searchQuery) || 
          (order.customer?.name && order.customer.name.toLowerCase().includes(searchQuery.toLowerCase()));
        
        // Filter by date range
        let matchesDateRange = true;
        if (dateRange.startDate) {
          matchesDateRange = new Date(order.timestamp) >= new Date(dateRange.startDate);
        }
        if (dateRange.endDate && matchesDateRange) {
          matchesDateRange = new Date(order.timestamp) <= new Date(dateRange.endDate);
        }
        
        return matchesSearch && matchesDateRange;
      })
    : [];
  
  // View order details
  const handleViewOrder = (order: any) => {
    console.log("Detalle del pedido:", order);
    console.log("Items del pedido:", order.items);
    setSelectedOrder(order);
    setIsDetailDialogOpen(true);
  };

  // Edit order
  const handleEditOrder = (order: Order) => {
    console.log("Editar pedido:", order);
    setSelectedOrder(order);
    setIsEditMode(true);
    
    // Rellenar el formulario con los datos del pedido
    form.reset({
      customerId: order.customer?.id.toString() || "",
      routeId: order.deliveryMethod === "pickup" ? "pickup" : (order.deliveryMethod === "shipping" ? "shipping" : order.route?.id.toString() || ""),
      deliveryDate: order.deliveryDate ? new Date(order.deliveryDate) : undefined,
      notes: order.notes || "",
      status: order.status,
      shippingInfo: order.shippingInfo || "",
    });
    
    // Convertir los items del pedido al formato requerido por el formulario
    const items = order.items.map(item => {
      // Buscar el producto completo en la lista de productos
      const productInfo = products?.find(p => p.id === item.productId);
      
      return {
        productId: item.productId,
        // Priorizar el nombre del producto encontrado, luego el productName del item, y finalmente el placeholder
        name: productInfo?.name || item.productName || `Producto #${item.productId}`,
        quantity: parseFloat(item.quantity),
        unit: item.unit,
        price: parseFloat(item.price),
        total: parseFloat(item.total),
        isRefrigerated: item.product?.isRefrigerated || productInfo?.isRefrigerated || false,
        isBulk: item.product?.isBulk || productInfo?.isBulk || false,
        // Guardar la referencia completa del producto, priorizando la que ya tiene el item
        product: item.product || productInfo
      };
    });
    
    setOrderItems(items);
    setIsDialogOpen(true);
  };
  
  // Update order status
  const handleUpdateStatus = (id: number, status: string) => {
    updateOrderStatusMutation.mutate({ id, status });
  };
  
  // Filtered products based on search
  const filteredProducts = productSearch
    ? products?.filter((product: any) =>
        product.name.toLowerCase().includes(productSearch.toLowerCase())
      )
    : [];
  
  // Add product to order
  const handleAddProduct = (product: any) => {
    const existingItem = orderItems.find(item => item.productId === product.id);
    
    if (existingItem) {
      // Update quantity if product already exists
      setOrderItems(orderItems.map(item => 
        item.productId === product.id 
          ? { ...item, quantity: item.quantity + 1, total: (item.quantity + 1) * item.price }
          : item
      ));
    } else {
      // Add new product
      setOrderItems([...orderItems, {
        productId: product.id,
        name: product.name,
        quantity: 1,
        unit: product.baseUnit,
        price: parseFloat(product.price),
        total: parseFloat(product.price),
        isRefrigerated: product.isRefrigerated,
        isBulk: product.isBulk,
        product: product // Guardamos la referencia completa al producto
      }]);
    }
    
    setProductSearch("");
  };
  
  // Remove product from order
  const handleRemoveProduct = (productId: number) => {
    setOrderItems(orderItems.filter(item => item.productId !== productId));
  };
  
  // Update product quantity
  const handleUpdateQuantity = (productId: number, quantity: number) => {
    setOrderItems(orderItems.map(item => 
      item.productId === productId 
        ? { ...item, quantity, total: quantity * item.price }
        : item
    ));
  };
  
  // Calculate order total
  const calculateTotal = () => {
    return orderItems.reduce((sum, item) => sum + item.total, 0).toFixed(2);
  };
  
  // Handle form submission
  const handleFormSubmit = async (data: OrderFormValues) => {
    console.log("Formulario enviado - Datos:", data);
    try {
      if (isEditMode && selectedOrder) {
        // Actualizar pedido existente
        await updateOrderMutation.mutateAsync({
          ...data,
          id: selectedOrder.id
        });
      } else {
        // Crear nuevo pedido
        await createOrderMutation.mutateAsync(data);
      }
    } catch (error) {
      console.error("Error en handleFormSubmit:", error);
    }
  };
  
  // --- Cálculo de totales para el resumen de facturación ---
  const invoiceSubtotal = selectedOrder ? parseFloat(selectedOrder.total) : 0;
  const invoiceDiscount = invoiceDetails.discountPercent > 0 ? invoiceSubtotal * (invoiceDetails.discountPercent / 100) : 0;
  const invoiceAfterDiscount = invoiceSubtotal - invoiceDiscount;
  const invoiceSurcharge = invoiceDetails.surchargePercent > 0 ? invoiceAfterDiscount * (invoiceDetails.surchargePercent / 100) : 0;
  const invoiceTotal = invoiceAfterDiscount + invoiceSurcharge;
  
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title="Pedidos" />
        
        <main className="flex-1 overflow-auto p-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={18} />
              <Input
                placeholder="Buscar por número o cliente..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 w-full"
              />
            </div>
            
            <div className="flex items-center gap-2 w-full md:w-auto">
              <Button onClick={() => setIsDialogOpen(true)} className="w-full md:w-auto">
                <Plus className="mr-2 h-4 w-4" />
                Nuevo Pedido
              </Button>
            </div>
          </div>
          
          <Card>
            <CardHeader className="px-6 py-4">
              <div className="flex justify-between items-center">
                <CardTitle>Lista de Pedidos</CardTitle>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>Filtrar por fecha:</span>
                  <DatePicker 
                    placeholder="Desde" 
                    value={dateRange.startDate}
                    onChange={(date) => setDateRange({...dateRange, startDate: date})}
                  />
                  <span>-</span>
                  <DatePicker 
                    placeholder="Hasta" 
                    value={dateRange.endDate}
                    onChange={(date) => setDateRange({...dateRange, endDate: date})}
                  />
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="p-0">
              <Tabs defaultValue="all">
                <div className="border-b px-6">
                  <TabsList className="w-auto">
                    <TabsTrigger value="all">Todos</TabsTrigger>
                    <TabsTrigger value="pending">Pendientes</TabsTrigger>
                    <TabsTrigger value="processing">En Proceso</TabsTrigger>
                    <TabsTrigger value="completed">Completados</TabsTrigger>
                  </TabsList>
                </div>
                
                <TabsContent value="all" className="m-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Número</TableHead>
                          <TableHead>Cliente</TableHead>
                          <TableHead>Fecha</TableHead>
                          <TableHead>Entrega</TableHead>
                          <TableHead>Método</TableHead>
                          <TableHead>Origen</TableHead>
                          <TableHead>Total</TableHead>
                          <TableHead>Estado</TableHead>
                          <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {isLoading ? (
                          <TableRow>
                            <TableCell colSpan={9} className="text-center py-10">
                              Cargando pedidos...
                            </TableCell>
                          </TableRow>
                        ) : filteredOrders.length > 0 ? (
                          filteredOrders.map((order: any) => (
                            <TableRow key={order.id}>
                              <TableCell className="font-medium">#{order.id}</TableCell>
                              <TableCell>{order.customer?.name || "Pedido sin cliente"}</TableCell>
                              <TableCell>{formatDate(order.timestamp)}</TableCell>
                              <TableCell>{order.deliveryDate ? formatDate(order.deliveryDate) : "-"}</TableCell>
                              <TableCell>
                                {order.deliveryMethod === "pickup" ? (
                                  <Badge variant="outline" className="bg-orange-100 text-orange-800">
                                    Retiro en Sucursal
                                  </Badge>
                                ) : order.deliveryMethod === "shipping" ? (
                                  <div>
                                    <Badge variant="outline" className="bg-purple-100 text-purple-800">
                                      Envío por Comisionista/Correo
                                    </Badge>
                                    {order.shippingInfo && (
                                      <div className="text-xs text-muted-foreground mt-1 truncate max-w-[150px]" title={order.shippingInfo}>
                                        {order.shippingInfo}
                                      </div>
                                    )}
                                  </div>
                                ) : order.route ? (
                                  <Badge variant="outline" className="bg-green-100 text-green-800">
                                    Ruta: {order.route.name}
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="bg-gray-100 text-gray-800">
                                    Sin asignar
                                  </Badge>
                                )}
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className={order.source === 'web' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}>
                                  {order.source === 'web' ? 'Web' : 'Manual'}
                                </Badge>
                              </TableCell>
                              <TableCell>${parseFloat(order.total).toFixed(2)}</TableCell>
                              <TableCell>
                                <Badge 
                                  variant={
                                    order.status === "completed" ? "default" :
                                    order.status === "invoiced" ? "default" : 
                                    order.status === "processing" ? "secondary" : 
                                    "outline"
                                  } 
                                  className={
                                    order.status === "completed" 
                                      ? "bg-green-100 text-green-800" :
                                    order.status === "invoiced"
                                      ? "bg-purple-100 text-purple-800" : 
                                    order.status === "processing"
                                      ? "bg-blue-100 text-blue-800"
                                      : "bg-yellow-100 text-yellow-800"
                                  }
                                >
                                  {order.status === "completed" 
                                    ? "Completado" :
                                  order.status === "invoiced" 
                                    ? "Facturado" : 
                                  order.status === "processing"
                                    ? "En proceso"
                                    : "Pendiente"
                                  }
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => handleViewOrder(order)}
                                  className="mr-1"
                                >
                                  <Eye className="h-4 w-4 mr-1" />
                                  Ver
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => handleEditOrder(order)}
                                  className="mr-1"
                                >
                                  <Pencil className="h-4 w-4 mr-1" />
                                  Editar
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => OrderPDFHelper.generate(order)}
                                  className="mr-1"
                                >
                                  <FileDown className="h-4 w-4 mr-1" />
                                  PDF
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    try {
                                      const printWindow = window.open('', '_blank');
                                      if (!printWindow) {
                                        console.error('No se pudo abrir la ventana de impresión');
                                        return;
                                      }
                                      
                                      // Procesar items para impresión
                                      const items = (order.items || []).map((item: any) => {
                                        const productName = item.productName || 
                                                         (item.product && item.product.name) || 
                                                         (typeof item.name === 'string' ? item.name : `Producto #${item.productId}`);
                                        
                                        return {
                                          ...item,
                                          displayName: productName,
                                          quantity: item.quantity,
                                          unit: item.unit || '',
                                          price: typeof item.price === 'string' ? parseFloat(item.price) : item.price,
                                          total: typeof item.total === 'string' ? parseFloat(item.total) : item.total
                                        };
                                      });
                                      
                                      // Agrupar los productos por categoría
                                      const refrigeratedItems = items.filter((item: any) => 
                                        item.product?.isRefrigerated && !item.product?.isBulk
                                      );
                                      
                                      const bulkItems = items.filter((item: any) => 
                                        item.product?.isBulk
                                      );
                                      
                                      const regularItems = items.filter((item: any) => 
                                        !item.product?.isRefrigerated && !item.product?.isBulk
                                      );
                                      
                                      // Escribir el contenido HTML en la ventana de impresión
                                      printWindow.document.write(`
                                        <!DOCTYPE html>
                                        <html>
                                          <head>
                                            <meta charset="utf-8">
                                            <title>Pedido #${order.id || 'Nuevo'}</title>
                                            <style>
                                              @page { 
                                                size: auto;
                                                margin: 10mm;
                                              }
                                              body { 
                                                font-family: 'Arial', sans-serif;
                                                margin: 0;
                                                padding: 0;
                                                background-color: white;
                                              }
                                              .header {
                                                display: flex;
                                                justify-content: space-between;
                                                margin-bottom: 20px;
                                              }
                                              .header-left h1 {
                                                margin: 0;
                                                font-size: 24px;
                                              }
                                              .header-left p {
                                                margin: 5px 0;
                                                color: #666;
                                              }
                                              .header-right {
                                                text-align: right;
                                              }
                                              .header-right h2 {
                                                margin: 0;
                                                font-size: 18px;
                                              }
                                              .header-right p {
                                                margin: 5px 0;
                                                color: #666;
                                              }
                                              .section {
                                                margin-bottom: 20px;
                                              }
                                              .section-title {
                                                margin: 0 0 10px 0;
                                                font-size: 14px;
                                                text-transform: uppercase;
                                                color: #666;
                                              }
                                              .customer-info {
                                                background-color: #f5f5f5;
                                                padding: 10px;
                                                border-radius: 4px;
                                              }
                                              .items-table {
                                                width: 100%;
                                                border-collapse: collapse;
                                              }
                                              .items-table th {
                                                background-color: #f5f5f5;
                                                padding: 8px;
                                                text-align: left;
                                                border-bottom: 1px solid #ddd;
                                              }
                                              .items-table th:nth-child(2),
                                              .items-table th:nth-child(3),
                                              .items-table th:nth-child(4) {
                                                text-align: right;
                                              }
                                              .items-table td {
                                                padding: 8px;
                                                border-bottom: 1px solid #ddd;
                                              }
                                              .items-table td:nth-child(2),
                                              .items-table td:nth-child(3),
                                              .items-table td:nth-child(4) {
                                                text-align: right;
                                              }
                                              .items-table tfoot td {
                                                font-weight: bold;
                                              }
                                              .items-table tfoot td:first-child {
                                                text-align: right;
                                              }
                                              .notes {
                                                background-color: #f5f5f5;
                                                padding: 10px;
                                                border-radius: 4px;
                                              }
                                              .footer {
                                                margin-top: 40px;
                                                text-align: center;
                                                font-size: 12px;
                                                color: #666;
                                              }
                                              .category-header {
                                                background-color: #f0f0f0;
                                                font-weight: bold;
                                                text-transform: uppercase;
                                                font-size: 12px;
                                                color: #555;
                                                padding: 8px;
                                              }
                                            </style>
                                          </head>
                                          <body>
                                            <div class="header">
                                              <div class="header-left">
                                                <h1>PUNTO PASTELERO</h1>
                                                <p>Avenida Siempre Viva 123, Springfield</p>
                                                <p>(555) 123-4567</p>
                                                <p>CUIT: 30-12345678-9</p>
                                              </div>
                                              <div class="header-right">
                                                <h2>PEDIDO</h2>
                                                <p>N°: ${order.id || '-------'}</p>
                                                <p>Fecha: ${formatDate(order.timestamp || order.createdAt)}</p>
                                                <p>Estado: ${order.status}</p>
                                              </div>
                                            </div>
                                            
                                            <div class="section">
                                              <h3 class="section-title">Datos del cliente</h3>
                                              <div class="customer-info">
                                                <p><strong>Cliente:</strong> ${order.customer?.name || 'Sin cliente asignado'}</p>
                                                ${getCustomerPhone(order.customer) ? `<p><strong>Teléfono:</strong> ${getCustomerPhone(order.customer)}</p>` : ''}
                                                ${order.customer?.email ? `<p><strong>Email:</strong> ${order.customer.email}</p>` : ''}
                                                ${order.customer?.address ? `<p><strong>Dirección:</strong> ${order.customer.address}</p>` : ''}
                                              </div>
                                            </div>
                                            
                                            <div class="section">
                                              <h3 class="section-title">Detalle del Pedido</h3>
                                              <table class="items-table">
                                                <thead>
                                                  <tr>
                                                    <th>Producto</th>
                                                    <th>Cantidad</th>
                                                    <th>Precio Unit.</th>
                                                    <th>Subtotal</th>
                                                  </tr>
                                                </thead>
                                                <tbody>
                                                  ${refrigeratedItems.length > 0 ? `
                                                    <tr>
                                                      <td colspan="4" class="category-header">Productos Refrigerados</td>
                                                    </tr>
                                                    ${refrigeratedItems.map((item: any) => `
                                                      <tr>
                                                        <td>${item.displayName}</td>
                                                        <td>${item.quantity} ${item.unit}</td>
                                                        <td>$${item.price.toFixed(2)}</td>
                                                        <td>$${item.total.toFixed(2)}</td>
                                                      </tr>
                                                    `).join('')}
                                                  ` : ''}
                                                  
                                                  ${bulkItems.length > 0 ? `
                                                    <tr>
                                                      <td colspan="4" class="category-header">Productos a Granel</td>
                                                    </tr>
                                                    ${bulkItems.map((item: any) => `
                                                      <tr>
                                                        <td>${item.displayName}</td>
                                                        <td>${item.quantity} ${item.unit}</td>
                                                        <td>$${item.price.toFixed(2)}</td>
                                                        <td>$${item.total.toFixed(2)}</td>
                                                      </tr>
                                                    `).join('')}
                                                  ` : ''}
                                                  
                                                  ${regularItems.length > 0 ? `
                                                    <tr>
                                                      <td colspan="4" class="category-header">Productos Comunes</td>
                                                    </tr>
                                                    ${regularItems.map((item: any) => `
                                                      <tr>
                                                        <td>${item.displayName}</td>
                                                        <td>${item.quantity} ${item.unit}</td>
                                                        <td>$${item.price.toFixed(2)}</td>
                                                        <td>$${item.total.toFixed(2)}</td>
                                                      </tr>
                                                    `).join('')}
                                                  ` : ''}
                                                  
                                                  ${items.length === 0 ? `
                                                    <tr>
                                                      <td colspan="4" style="text-align: center; padding: 20px;">
                                                        No hay productos en este pedido
                                                      </td>
                                                    </tr>
                                                  ` : ''}
                                                </tbody>
                                                <tfoot>
                                                  <tr>
                                                    <td colspan="3">Total:</td>
                                                    <td>$${parseFloat(order.total).toFixed(2)}</td>
                                                  </tr>
                                                </tfoot>
                                              </table>
                                            </div>
                                            
                                            ${order.notes ? `
                                              <div class="section">
                                                <h3 class="section-title">Notas</h3>
                                                <p class="notes">${order.notes}</p>
                                              </div>
                                            ` : ''}
                                            
                                            <div class="section">
                                              <h3 class="section-title">Información de Entrega</h3>
                                              <p><strong>Fecha de Entrega:</strong> ${formatDate(order.deliveryDate)}</p>
                                              <p><strong>Método de Entrega:</strong> ${
                                                order.deliveryMethod === 'pickup' 
                                                  ? 'Retiro en Sucursal' 
                                                  : order.deliveryMethod === 'shipping'
                                                    ? `Envío por Comisionista/Correo${order.shippingInfo ? ` - ${order.shippingInfo}` : ''}`
                                                    : (order.route ? `Ruta: ${order.route.name}` : 'Entrega a domicilio')
                                              }</p>
                                            </div>
                                            
                                            <div class="footer">
                                              <p>Este documento es un comprobante de pedido y no tiene valor fiscal.</p>
                                              <p>¡Gracias por su compra!</p>
                                            </div>
                                            
                                            <script>
                                              window.onload = function() {
                                                window.print();
                                                setTimeout(function() { window.close(); }, 1000);
                                              };
                                            </script>
                                          </body>
                                        </html>
                                      `);
                                      
                                      printWindow.document.close();
                                    } catch (error) {
                                      console.error('Error al imprimir pedido:', error);
                                      toast({
                                        title: "Error",
                                        description: "No se pudo imprimir el pedido",
                                        variant: "destructive"
                                      });
                                    }
                                  }}
                                >
                                  <Printer className="h-4 w-4 mr-1" />
                                  Impr.
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    try {
                                      // Verificar si hay número de teléfono del cliente
                                      const phone = getCustomerPhone(order.customer);
                                      
                                      if (!phone) {
                                        toast({
                                          title: "Advertencia",
                                          description: "El cliente no tiene número de teléfono registrado",
                                          variant: "default"
                                        });
                                        return;
                                      }
                                      
                                      // Formatear el número de teléfono (eliminar espacios, guiones, etc.)
                                      const formattedPhone = phone.replace(/\D/g, '');
                                      
                                      // Crear mensaje para WhatsApp
                                      let message = `*PEDIDO #${order.id}*\n\n`;
                                      message += `*Cliente:* ${order.customer?.name || 'Cliente'}\n`;
                                      message += `*Fecha:* ${new Date(order.timestamp).toLocaleDateString()}\n`;
                                      message += `*Total:* $${parseFloat(order.total).toFixed(2)}\n\n`;
                                      
                                      // Agregar información de entrega
                                      message += `*Método de entrega:* ${
                                        order.deliveryMethod === 'pickup' 
                                          ? 'Retiro en Sucursal' 
                                          : order.deliveryMethod === 'shipping'
                                            ? `Envío por Comisionista/Correo${order.shippingInfo ? ` - ${order.shippingInfo}` : ''}`
                                            : order.route ? `Ruta: ${order.route.name}` : 'Entrega a domicilio'
                                      }\n`;

                                      if (order.deliveryDate) {
                                        message += `*Fecha de entrega:* ${new Date(order.deliveryDate).toLocaleDateString()}\n`;
                                      }

                                      message += "\n*Productos:*\n";
                                      order.items.forEach((item: any) => {
                                        const productName = item.productName || 
                                                         (item.product && item.product.name) || 
                                                         (typeof item.name === 'string' ? item.name : `Producto #${item.productId}`);
                                        
                                        message += `- ${productName}: ${item.quantity} ${item.unit} x $${parseFloat(item.price).toFixed(2)} = $${parseFloat(item.total).toFixed(2)}\n`;
                                      });
                                      
                                      if (order.notes) {
                                        message += `\n*Notas:* ${order.notes}\n`;
                                      }
                                      
                                      // Abrir WhatsApp con el mensaje
                                      window.open(`https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`, '_blank');
                                    } catch (error) {
                                      console.error('Error al enviar mensaje de WhatsApp:', error);
                                      toast({
                                        title: "Error",
                                        description: "No se pudo abrir WhatsApp",
                                        variant: "destructive"
                                      });
                                    }
                                  }}
                                >
                                  <MessageCircle className="h-4 w-4 mr-1" />
                                  WhatsApp
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={8} className="text-center py-10">
                              <div className="flex flex-col items-center justify-center text-center">
                                <ClipboardList className="h-12 w-12 text-muted-foreground mb-4" />
                                <h3 className="text-lg font-medium mb-2">
                                  {searchQuery || dateRange.startDate || dateRange.endDate
                                    ? "No se encontraron pedidos con los filtros aplicados"
                                    : "No hay pedidos registrados"
                                  }
                                </h3>
                                <p className="text-muted-foreground mb-4">
                                  {searchQuery || dateRange.startDate || dateRange.endDate
                                    ? "Intente con otros criterios de búsqueda"
                                    : "Comience creando un nuevo pedido"
                                  }
                                </p>
                                {!searchQuery && !dateRange.startDate && !dateRange.endDate && (
                                  <Button onClick={() => setIsDialogOpen(true)}>
                                    <Plus className="mr-2 h-4 w-4" />
                                    Nuevo Pedido
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </TabsContent>
                
                <TabsContent value="pending" className="m-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Número</TableHead>
                          <TableHead>Cliente</TableHead>
                          <TableHead>Fecha</TableHead>
                          <TableHead>Entrega</TableHead>
                          <TableHead>Método</TableHead>
                          <TableHead>Total</TableHead>
                          <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {isLoading ? (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center py-10">
                              Cargando pedidos pendientes...
                            </TableCell>
                          </TableRow>
                        ) : filteredOrders.filter(order => order.status === "pending").length > 0 ? (
                          filteredOrders
                            .filter(order => order.status === "pending")
                            .map((order: any) => (
                              <TableRow key={order.id}>
                                <TableCell className="font-medium">#{order.id}</TableCell>
                                <TableCell>{order.customer?.name || "Pedido sin cliente"}</TableCell>
                                <TableCell>{formatDate(order.timestamp)}</TableCell>
                                <TableCell>{order.deliveryDate ? formatDate(order.deliveryDate) : "-"}</TableCell>
                                <TableCell>
                                  {order.deliveryMethod === "pickup" ? (
                                    <Badge variant="outline" className="bg-orange-100 text-orange-800">
                                      Retiro en Sucursal
                                    </Badge>
                                  ) : order.deliveryMethod === "shipping" ? (
                                    <div>
                                      <Badge variant="outline" className="bg-purple-100 text-purple-800">
                                        Envío por Comisionista/Correo
                                      </Badge>
                                      {order.shippingInfo && (
                                        <div className="text-xs text-muted-foreground mt-1 truncate max-w-[150px]" title={order.shippingInfo}>
                                          {order.shippingInfo}
                                        </div>
                                      )}
                                    </div>
                                  ) : order.route ? (
                                    <Badge variant="outline" className="bg-green-100 text-green-800">
                                      Ruta: {order.route.name}
                                    </Badge>
                                  ) : (
                                    <Badge variant="outline" className="bg-gray-100 text-gray-800">
                                      Sin asignar
                                    </Badge>
                                  )}
                                </TableCell>
                                <TableCell>${parseFloat(order.total).toFixed(2)}</TableCell>
                                <TableCell className="text-right">
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    onClick={() => handleViewOrder(order)}
                                    className="mr-1"
                                  >
                                    <Eye className="h-4 w-4 mr-1" />
                                    Ver
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    onClick={() => handleEditOrder(order)}
                                    className="mr-1"
                                  >
                                    <Pencil className="h-4 w-4 mr-1" />
                                    Editar
                                  </Button>
                                  <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => handleUpdateStatus(order.id, "processing")}
                                    className="mr-1"
                                  >
                                    <ClipboardList className="h-4 w-4 mr-1" />
                                    Iniciar proceso
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center py-10">
                              No hay pedidos pendientes.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </TabsContent>
                
                <TabsContent value="processing" className="m-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Número</TableHead>
                          <TableHead>Cliente</TableHead>
                          <TableHead>Fecha</TableHead>
                          <TableHead>Entrega</TableHead>
                          <TableHead>Método</TableHead>
                          <TableHead>Total</TableHead>
                          <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {isLoading ? (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center py-10">
                              Cargando pedidos en proceso...
                            </TableCell>
                          </TableRow>
                        ) : filteredOrders.filter(order => order.status === "processing").length > 0 ? (
                          filteredOrders
                            .filter(order => order.status === "processing")
                            .map((order: any) => (
                              <TableRow key={order.id}>
                                <TableCell className="font-medium">#{order.id}</TableCell>
                                <TableCell>{order.customer?.name || "Pedido sin cliente"}</TableCell>
                                <TableCell>{formatDate(order.timestamp)}</TableCell>
                                <TableCell>{order.deliveryDate ? formatDate(order.deliveryDate) : "-"}</TableCell>
                                <TableCell>
                                  {order.deliveryMethod === "pickup" ? (
                                    <Badge variant="outline" className="bg-orange-100 text-orange-800">
                                      Retiro en Sucursal
                                    </Badge>
                                  ) : order.deliveryMethod === "shipping" ? (
                                    <div>
                                      <Badge variant="outline" className="bg-purple-100 text-purple-800">
                                        Envío por Comisionista/Correo
                                      </Badge>
                                      {order.shippingInfo && (
                                        <div className="text-xs text-muted-foreground mt-1 truncate max-w-[150px]" title={order.shippingInfo}>
                                          {order.shippingInfo}
                                        </div>
                                      )}
                                    </div>
                                  ) : order.route ? (
                                    <Badge variant="outline" className="bg-green-100 text-green-800">
                                      Ruta: {order.route.name}
                                    </Badge>
                                  ) : (
                                    <Badge variant="outline" className="bg-gray-100 text-gray-800">
                                      Sin asignar
                                    </Badge>
                                  )}
                                </TableCell>
                                <TableCell>${parseFloat(order.total).toFixed(2)}</TableCell>
                                <TableCell className="text-right">
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    onClick={() => handleViewOrder(order)}
                                    className="mr-1"
                                  >
                                    <Eye className="h-4 w-4 mr-1" />
                                    Ver
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    onClick={() => handleEditOrder(order)}
                                    className="mr-1"
                                  >
                                    <Pencil className="h-4 w-4 mr-1" />
                                    Editar
                                  </Button>
                                  <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => handleUpdateStatus(order.id, "completed")}
                                    className="mr-1"
                                  >
                                    <ClipboardList className="h-4 w-4 mr-1" />
                                    Completar
                                  </Button>
                                </TableCell>
                              </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center py-10">
                              No hay pedidos en proceso.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </TabsContent>
                
                <TabsContent value="completed" className="m-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Número</TableHead>
                          <TableHead>Cliente</TableHead>
                          <TableHead>Fecha</TableHead>
                          <TableHead>Entrega</TableHead>
                          <TableHead>Método</TableHead>
                          <TableHead>Total</TableHead>
                          <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {isLoading ? (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center py-10">
                              Cargando pedidos completados...
                            </TableCell>
                          </TableRow>
                        ) : filteredOrders.filter(order => order.status === "completed" || order.status === "invoiced").length > 0 ? (
                          filteredOrders
                            .filter(order => order.status === "completed" || order.status === "invoiced")
                            .map((order: any) => (
                              <TableRow key={order.id}>
                                <TableCell className="font-medium">#{order.id}</TableCell>
                                <TableCell>{order.customer?.name || "Pedido sin cliente"}</TableCell>
                                <TableCell>{formatDate(order.timestamp)}</TableCell>
                                <TableCell>{order.deliveryDate ? formatDate(order.deliveryDate) : "-"}</TableCell>
                                <TableCell>
                                  {order.deliveryMethod === "pickup" ? (
                                    <Badge variant="outline" className="bg-orange-100 text-orange-800">
                                      Retiro en Sucursal
                                    </Badge>
                                  ) : order.deliveryMethod === "shipping" ? (
                                    <div>
                                      <Badge variant="outline" className="bg-purple-100 text-purple-800">
                                        Envío por Comisionista/Correo
                                      </Badge>
                                      {order.shippingInfo && (
                                        <div className="text-xs text-muted-foreground mt-1 truncate max-w-[150px]" title={order.shippingInfo}>
                                          {order.shippingInfo}
                                        </div>
                                      )}
                                    </div>
                                  ) : order.route ? (
                                    <Badge variant="outline" className="bg-green-100 text-green-800">
                                      Ruta: {order.route.name}
                                    </Badge>
                                  ) : (
                                    <Badge variant="outline" className="bg-gray-100 text-gray-800">
                                      Sin asignar
                                    </Badge>
                                  )}
                                </TableCell>
                                <TableCell>${parseFloat(order.total).toFixed(2)}</TableCell>
                                <TableCell className="text-right">
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    onClick={() => handleViewOrder(order)}
                                    className="mr-1"
                                  >
                                    <Eye className="h-4 w-4 mr-1" />
                                    Ver
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleOpenInvoiceDialog(order)}
                                    className="mr-1"
                                    disabled={order.status === "invoiced"}
                                  >
                                    <FileText className="h-4 w-4 mr-1" />
                                    {order.status === "invoiced" ? "Ya facturado" : "Facturar"}
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center py-10">
                              No hay pedidos completados ni facturados.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </main>
      </div>
      
      {/* Order Detail Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={(open) => {
        setIsDetailDialogOpen(open);
        if (!open) {
          setSelectedOrder(null);
        }
      }}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Detalle de Pedido #{selectedOrder?.id}</DialogTitle>
          </DialogHeader>
          
          {selectedOrder && (
            <div className="space-y-6">
              <div className="flex justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  className="mr-2"
                  onClick={() => {
                    try {
                      // Verificar si hay número de teléfono del cliente
                      const phone = getCustomerPhone(selectedOrder.customer);
                      
                      if (!phone) {
                        toast({
                          title: "Advertencia",
                          description: "El cliente no tiene número de teléfono registrado",
                          variant: "default"
                        });
                        return;
                      }
                      
                      // Formatear el número de teléfono (eliminar espacios, guiones, etc.)
                      const formattedPhone = phone.replace(/\D/g, '');
                      
                      // Crear mensaje para WhatsApp
                      let message = `*PEDIDO #${selectedOrder.id}*\n\n`;
                      message += `*Cliente:* ${selectedOrder.customer?.name || 'Cliente'}\n`;
                      message += `*Fecha:* ${new Date(selectedOrder.timestamp).toLocaleDateString()}\n`;
                      message += `*Total:* $${parseFloat(selectedOrder.total).toFixed(2)}\n\n`;
                      
                      // Agregar información de entrega
                      message += `*Método de entrega:* ${
                        selectedOrder.deliveryMethod === 'pickup' 
                          ? 'Retiro en Sucursal' 
                          : selectedOrder.deliveryMethod === 'shipping'
                            ? `Envío por Comisionista/Correo${selectedOrder.shippingInfo ? ` - ${selectedOrder.shippingInfo}` : ''}`
                            : selectedOrder.route ? `Ruta: ${selectedOrder.route.name}` : 'Entrega a domicilio'
                      }\n`;

                      if (selectedOrder.deliveryDate) {
                        message += `*Fecha de entrega:* ${new Date(selectedOrder.deliveryDate).toLocaleDateString()}\n`;
                      }

                      message += "\n*Productos:*\n";
                      selectedOrder.items.forEach((item: any) => {
                        const productName = item.productName || 
                                         (item.product && item.product.name) || 
                                         (typeof item.name === 'string' ? item.name : `Producto #${item.productId}`);
                        
                        message += `- ${productName}: ${item.quantity} ${item.unit} x $${parseFloat(item.price).toFixed(2)} = $${parseFloat(item.total).toFixed(2)}\n`;
                      });
                      
                      if (selectedOrder.notes) {
                        message += `\n*Notas:* ${selectedOrder.notes}\n`;
                      }
                      
                      // Abrir WhatsApp con el mensaje
                      window.open(`https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`, '_blank');
                    } catch (error) {
                      console.error('Error al enviar mensaje de WhatsApp:', error);
                      toast({
                        title: "Error",
                        description: "No se pudo abrir WhatsApp",
                        variant: "destructive"
                      });
                    }
                  }}
                >
                  <MessageCircle className="h-4 w-4 mr-1" />
                  Enviar por WhatsApp
                </Button>
                <OrderPDF order={selectedOrder} showPrintButton={true} />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Cliente</p>
                  <p className="font-medium">{selectedOrder.customer?.name || "Pedido sin cliente"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Fecha de Creación</p>
                  <p className="font-medium">{formatDate(selectedOrder.timestamp)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Fecha de Entrega</p>
                  <p className="font-medium">{selectedOrder.deliveryDate ? formatDate(selectedOrder.deliveryDate) : "No especificada"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Método de Entrega</p>
                  <div className="mt-1">
                    {selectedOrder.deliveryMethod === "pickup" ? (
                      <Badge variant="outline" className="bg-orange-100 text-orange-800">
                        Retiro en Sucursal
                      </Badge>
                    ) : selectedOrder.deliveryMethod === "shipping" ? (
                      <div>
                        <Badge variant="outline" className="bg-purple-100 text-purple-800">
                          Envío por Comisionista/Correo
                        </Badge>
                        {selectedOrder.shippingInfo && (
                          <div className="mt-2 text-sm">
                            <p className="text-sm text-muted-foreground">Información de envío:</p>
                            <p className="bg-gray-50 p-2 rounded border mt-1">{selectedOrder.shippingInfo}</p>
                          </div>
                        )}
                      </div>
                    ) : selectedOrder.route ? (
                      <Badge variant="outline" className="bg-green-100 text-green-800">
                        Ruta: {selectedOrder.route.name}
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-gray-100 text-gray-800">
                        Sin asignar
                      </Badge>
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Estado</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge 
                      variant={
                        selectedOrder.status === "completed" ? "default" :
                        selectedOrder.status === "invoiced" ? "default" : 
                        selectedOrder.status === "processing" ? "secondary" : 
                        "outline"
                      } 
                      className={
                        selectedOrder.status === "completed" 
                          ? "bg-green-100 text-green-800" :
                        selectedOrder.status === "invoiced"
                          ? "bg-purple-100 text-purple-800" : 
                        selectedOrder.status === "processing"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-yellow-100 text-yellow-800"
                      }
                    >
                      {selectedOrder.status === "completed" 
                        ? "Completado" :
                        selectedOrder.status === "invoiced" 
                          ? "Facturado" : 
                        selectedOrder.status === "processing"
                          ? "En proceso"
                          : "Pendiente"
                      }
                    </Badge>
                    
                    <Select 
                      defaultValue={selectedOrder.status}
                      onValueChange={(value) => handleUpdateStatus(selectedOrder.id, value)}
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Cambiar estado" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pendiente</SelectItem>
                        <SelectItem value="processing">En proceso</SelectItem>
                        <SelectItem value="completed">Completado</SelectItem>
                        <SelectItem value="invoiced">Facturado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="font-medium mb-2">Productos</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Producto</TableHead>
                      <TableHead className="text-right">Cantidad</TableHead>
                      <TableHead className="text-right">Precio Unit.</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(() => {
                      // Agrupar los productos por categoría
                      const refrigeratedItems = selectedOrder.items?.filter((item: any) => 
                        item.product?.isRefrigerated && !item.product?.isBulk
                      ) || [];
                      
                      const bulkItems = selectedOrder.items?.filter((item: any) => 
                        item.product?.isBulk
                      ) || [];
                      
                      const regularItems = selectedOrder.items?.filter((item: any) => 
                        !item.product?.isRefrigerated && !item.product?.isBulk
                      ) || [];
                      
                      // Función para renderizar una fila de categoría
                      const renderCategoryRow = (categoryName: string) => (
                        <TableRow key={categoryName} className="bg-slate-50">
                          <TableCell colSpan={4} className="font-medium text-slate-700">
                            {categoryName}
                          </TableCell>
                        </TableRow>
                      );
                      
                      // Función para renderizar las filas de productos
                      const renderItemRows = (items: any[]) => {
                        return items.map((item: any, index: number) => {
                          // Buscar el producto en la lista completa de productos
                          const productInfo = products?.find(p => p.id === item.productId);
                          
                          // Intentar obtener el nombre del producto en este orden:
                          // 1. Del objeto producto si existe
                          // 2. Del productInfo (de products global)
                          // 3. Del productName del item
                          // 4. Como último recurso mostrar el ID
                          const productName = item.product?.name || 
                                             productInfo?.name || 
                                             item.productName || 
                                             `Producto #${item.productId}`;
                          
                          return (
                            <TableRow key={`${item.productId}-${index}`}>
                              <TableCell>
                                <div>
                                  <span>{productName}</span>
                                  <div className="flex gap-2 mt-1">
                                    {(item.product?.isRefrigerated || productInfo?.isRefrigerated) && (
                                      <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                                        Refrigerado
                                      </Badge>
                                    )}
                                    {(item.product?.isBulk || productInfo?.isBulk) && (
                                      <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                                        A Granel
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="text-right">{parseFloat(item.quantity).toFixed(2)} {item.unit}</TableCell>
                              <TableCell className="text-right">${parseFloat(item.price).toFixed(2)}</TableCell>
                              <TableCell className="text-right">${parseFloat(item.total).toFixed(2)}</TableCell>
                            </TableRow>
                          );
                        });
                      };
                      
                      // Renderizar todos los grupos
                      return (
                        <>
                          {refrigeratedItems.length > 0 && (
                            <>
                              {renderCategoryRow("Productos Refrigerados")}
                              {renderItemRows(refrigeratedItems)}
                            </>
                          )}
                          
                          {bulkItems.length > 0 && (
                            <>
                              {renderCategoryRow("Productos a Granel")}
                              {renderItemRows(bulkItems)}
                            </>
                          )}
                          
                          {regularItems.length > 0 && (
                            <>
                              {renderCategoryRow("Productos Comunes")}
                              {renderItemRows(regularItems)}
                            </>
                          )}
                          
                          {selectedOrder.items?.length === 0 && (
                            <TableRow>
                              <TableCell colSpan={4} className="text-center py-4">
                                No hay productos en este pedido
                              </TableCell>
                            </TableRow>
                          )}
                        </>
                      );
                    })()}
                  </TableBody>
                </Table>
              </div>
              
              <div className="flex justify-between items-center pt-4 border-t">
                <div>
                  {selectedOrder.notes && (
                    <div>
                      <p className="text-sm text-muted-foreground">Notas</p>
                      <p>{selectedOrder.notes}</p>
                    </div>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Total</p>
                  <p className="font-medium text-lg">${parseFloat(selectedOrder.total).toFixed(2)}</p>
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDetailDialogOpen(false)}
            >
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Create Order Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={(open) => {
        setIsDialogOpen(open);
        if (!open) {
          setIsEditMode(false);
          setSelectedOrder(null);
          setOrderItems([]);
          form.reset();
        }
      }}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{isEditMode ? "Editar Pedido #" + selectedOrder?.id : "Crear Nuevo Pedido"}</DialogTitle>
          </DialogHeader>
          
          <Form {...form}>
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                console.log("Formulario submit - Iniciando validación");
                const formData = form.getValues();
                console.log("Datos del formulario:", formData);
                handleFormSubmit(formData);
              }}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="customerId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cliente (opcional)</FormLabel>
                      <Select 
                        value={field.value?.toString() || "none"}
                        onValueChange={(value) => field.onChange(value === "none" ? null : parseInt(value))}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar cliente" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">Sin cliente</SelectItem>
                          {customers?.map((customer: any) => (
                            <SelectItem key={customer.id} value={customer.id.toString()}>
                              {customer.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="routeId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Método de Entrega</FormLabel>
                      <Select 
                        value={field.value?.toString() || "none"}
                        onValueChange={(value) => field.onChange(value === "none" ? null : value)}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar método de entrega" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">Seleccionar...</SelectItem>
                          {deliveryOptions.map(option => (
                            <SelectItem key={option.id} value={option.id}>
                              {option.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="deliveryDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Fecha de Entrega (opcional)</FormLabel>
                      <DatePicker 
                        value={field.value}
                        onChange={field.onChange}
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">Productos del Pedido</h3>
                  <div className="relative w-64">
                    <Input
                      placeholder="Buscar producto..."
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                    />
                    {productSearch && filteredProducts && filteredProducts.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-y-auto">
                        {filteredProducts.map((product: any) => (
                          <div 
                            key={product.id} 
                            className="p-2 hover:bg-slate-100 cursor-pointer"
                            onClick={() => handleAddProduct(product)}
                          >
                            <div className="font-medium">{product.name}</div>
                            <div className="text-xs text-muted-foreground flex justify-between">
                              <span>Stock: {parseFloat(product.stock)} {product.baseUnit}</span>
                              <span>${parseFloat(product.price).toFixed(2)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Producto</TableHead>
                        <TableHead>Precio</TableHead>
                        <TableHead>Cantidad</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {orderItems.length > 0 ? (
                        orderItems.map((item) => (
                          <TableRow key={item.productId}>
                            <TableCell>
                              <div>
                                <span>{item.name}</span>
                                <div className="flex gap-2 mt-1">
                                  {item.isRefrigerated && (
                                    <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                                      Refrigerado
                                    </Badge>
                                  )}
                                  {item.isBulk && (
                                    <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                                      A Granel
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>${item.price.toFixed(2)}</TableCell>
                            <TableCell>
                              <div className="flex items-center w-24">
                                <Input
                                  type="number"
                                  min="0.01"
                                  step="0.01"
                                  value={item.quantity}
                                  onChange={(e) => handleUpdateQuantity(item.productId, parseFloat(e.target.value))}
                                  className="w-full"
                                />
                                <span className="ml-1">{item.unit}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-right">${item.total.toFixed(2)}</TableCell>
                            <TableCell>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => handleRemoveProduct(item.productId)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-4">
                            <p className="text-muted-foreground">No hay productos agregados</p>
                            <p className="text-sm text-muted-foreground">Busque y agregue productos usando el campo de búsqueda</p>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
                
                {orderItems.length > 0 && (
                  <div className="flex justify-end items-center pt-4">
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Total del Pedido</p>
                      <p className="font-medium text-lg">${calculateTotal()}</p>
                    </div>
                  </div>
                )}
              </div>
              
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notas (opcional)</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Notas o instrucciones especiales" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {form.watch("routeId") === "shipping" && (
                <FormField
                  control={form.control}
                  name="shippingInfo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Información de Envío</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Nombre del comisionista, servicio de correo, guía de envío, etc." 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={createOrderMutation.isPending || updateOrderMutation.isPending || orderItems.length === 0}
                  onClick={() => console.log("Botón submit clickeado")}
                >
                  {createOrderMutation.isPending || updateOrderMutation.isPending 
                    ? (isEditMode ? "Actualizando..." : "Creando...") 
                    : (isEditMode ? "Actualizar Pedido" : "Crear Pedido")
                  }
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Invoice Dialog */}
      <Dialog open={isInvoiceDialogOpen} onOpenChange={setIsInvoiceDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl">Generar Factura</DialogTitle>
            <DialogDescription className="text-muted-foreground text-sm mt-1">
              Complete los datos para generar una factura a partir del pedido #{selectedOrder?.id}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
            {/* Columna izquierda: Datos de facturación */}
            <div className="space-y-4">
              <div className="space-y-3">
                <h3 className="text-base font-medium">Datos de facturación</h3>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Cliente</label>
                  <div className="p-2 border rounded-md bg-slate-50">
                    {selectedOrder?.customer?.name || "Pedido sin cliente"}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Tipo de comprobante</label>
                  <Select 
                    value={invoiceDetails.documentType}
                    onValueChange={(value) => setInvoiceDetails({...invoiceDetails, documentType: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="remito">Remito</SelectItem>
                      <SelectItem value="factura_c">Factura C</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Método de pago</label>
                  <Select 
                    value={invoiceDetails.paymentMethod}
                    onValueChange={(value) => setInvoiceDetails({...invoiceDetails, paymentMethod: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Efectivo</SelectItem>
                      <SelectItem value="card">Tarjeta</SelectItem>
                      <SelectItem value="transfer">Transferencia</SelectItem>
                      <SelectItem value="current_account">Cuenta Corriente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Observaciones</label>
                  <Textarea 
                    placeholder="Observaciones para la factura (opcional)" 
                    value={invoiceDetails.notes}
                    onChange={(e) => setInvoiceDetails({...invoiceDetails, notes: e.target.value})}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Descuento (%)</label>
                    <Input 
                      type="number" 
                      min="0" 
                      max="100" 
                      step="0.1"
                      value={invoiceDetails.discountPercent}
                      onChange={(e) => setInvoiceDetails({...invoiceDetails, discountPercent: parseFloat(e.target.value) || 0})}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Recargo (%)</label>
                    <Input 
                      type="number" 
                      min="0" 
                      max="100" 
                      step="0.1"
                      value={invoiceDetails.surchargePercent}
                      onChange={(e) => setInvoiceDetails({...invoiceDetails, surchargePercent: parseFloat(e.target.value) || 0})}
                    />
                  </div>
                </div>
              </div>
            </div>
            
            {/* Columna derecha: Resumen del pedido */}
            <div className="space-y-4">
              <div className="border rounded-md">
                <div className="border-b px-4 py-3">
                  <h3 className="font-medium">Resumen de productos</h3>
                </div>
                
                <div className="px-4 py-2 max-h-[200px] overflow-y-auto">
                  {selectedOrder?.items.map((item) => {
                    // Determinar el nombre del producto de manera más robusta
                    const productName = item.productName || 
                                       (item.product && item.product.name) || 
                                       `Producto #${item.productId}`;
                    return (
                      <div key={item.productId} className="py-2 border-b last:border-0">
                        <div className="flex justify-between">
                          <div>
                            <div className="font-medium">{productName}</div>
                            <div className="text-sm text-muted-foreground">
                              {item.quantity} x ${parseFloat(item.price).toFixed(2)} ({item.unit})
                            </div>
                          </div>
                          <div className="font-medium">${parseFloat(item.total).toFixed(2)}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                <div className="border-t px-4 py-3 space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal</span>
                    <span>${invoiceSubtotal.toFixed(2)}</span>
                  </div>
                  {invoiceDetails.discountPercent > 0 && (
                    <div className="flex justify-between text-sm text-green-700">
                      <span>Descuento ({invoiceDetails.discountPercent}%)</span>
                      <span>- ${invoiceDiscount.toFixed(2)}</span>
                    </div>
                  )}
                  {invoiceDetails.surchargePercent > 0 && (
                    <div className="flex justify-between text-sm text-orange-700">
                      <span>Recargo ({invoiceDetails.surchargePercent}%)</span>
                      <span>+ ${invoiceSurcharge.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-semibold text-lg pt-1 border-t mt-1">
                    <span>Total</span>
                    <span>${invoiceTotal.toFixed(2)}</span>
                  </div>
                </div>
              </div>
              
              <div className="border rounded-md p-4">
                <h3 className="font-medium mb-3">Opciones de impresión</h3>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="print-invoice" 
                      checked={invoiceDetails.printTicket}
                      onCheckedChange={(checked) => 
                        setInvoiceDetails({...invoiceDetails, printTicket: checked as boolean})
                      }
                    />
                    <label 
                      htmlFor="print-invoice" 
                      className="text-sm cursor-pointer"
                    >
                      Imprimir comprobante
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="send-email-invoice" 
                      checked={invoiceDetails.sendEmail}
                      onCheckedChange={(checked) => 
                        setInvoiceDetails({...invoiceDetails, sendEmail: checked as boolean})
                      }
                    />
                    <label 
                      htmlFor="send-email-invoice" 
                      className="text-sm cursor-pointer"
                    >
                      Enviar por email
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsInvoiceDialogOpen(false)}
              disabled={convertToInvoiceMutation.isPending}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleInvoiceSubmit}
              disabled={convertToInvoiceMutation.isPending}
            >
              {convertToInvoiceMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Procesando...
                </>
              ) : (
                "Generar Factura"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
