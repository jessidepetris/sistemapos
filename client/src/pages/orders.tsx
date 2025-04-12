import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
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
  DialogTitle
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
import { insertOrderSchema } from "@shared/schema";
import { Calendar, ClipboardList, Eye, Plus, Search, Trash2 } from "lucide-react";
import { DatePicker } from "@/components/ui/date-picker";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

// Form schema for new order
const orderFormSchema = insertOrderSchema.extend({
  customerId: z.string().optional(),
  deliveryDate: z.date().optional(),
  items: z.array(z.object({
    productId: z.number(),
    quantity: z.number().min(0.01, "La cantidad debe ser mayor a 0"),
    unit: z.string(),
    price: z.number(),
    name: z.string(),
    total: z.number(),
  })).min(1, "Debe agregar al menos un producto"),
});

type OrderFormValues = z.infer<typeof orderFormSchema>;

export default function OrdersPage() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [dateRange, setDateRange] = useState({ startDate: null, endDate: null });
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [productSearch, setProductSearch] = useState("");
  const [orderItems, setOrderItems] = useState<any[]>([]);
  
  // Get orders
  const { data: orders, isLoading } = useQuery({
    queryKey: ["/api/orders"],
    retry: false,
  });
  
  // Get customers for select dropdown
  const { data: customers } = useQuery({
    queryKey: ["/api/customers"],
    retry: false,
  });
  
  // Get products for adding to order
  const { data: products } = useQuery({
    queryKey: ["/api/products"],
    retry: false,
  });
  
  // Form definition
  const form = useForm<OrderFormValues>({
    resolver: zodResolver(orderFormSchema),
    defaultValues: {
      customerId: "",
      total: 0,
      status: "pending",
      notes: "",
      items: [],
    },
  });
  
  // Create order mutation
  const createOrderMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/orders", data);
      return await res.json();
    },
    onSuccess: () => {
      toast({ title: "Pedido creado correctamente" });
      form.reset();
      setOrderItems([]);
      setIsDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
    },
    onError: (error) => {
      toast({
        title: "Error al crear el pedido",
        description: (error as Error).message,
        variant: "destructive",
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
    setSelectedOrder(order);
    setIsDetailDialogOpen(true);
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
        total: parseFloat(product.price)
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
  
  // Form submission handler
  const onSubmit = (data: OrderFormValues) => {
    // Add items and calculated total to form data
    const submitData = {
      ...data,
      items: orderItems,
      total: parseFloat(calculateTotal()),
      customerId: data.customerId ? parseInt(data.customerId) : undefined,
      userId: 1, // This should be the current user's ID
    };
    
    createOrderMutation.mutate(submitData);
  };
  
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
                          <TableHead>Total</TableHead>
                          <TableHead>Estado</TableHead>
                          <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {isLoading ? (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center py-10">
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
                              <TableCell>${parseFloat(order.total).toFixed(2)}</TableCell>
                              <TableCell>
                                <Badge 
                                  variant={
                                    order.status === "completed" ? "default" : 
                                    order.status === "processing" ? "secondary" : 
                                    "outline"
                                  } 
                                  className={
                                    order.status === "completed" 
                                      ? "bg-green-100 text-green-800" 
                                      : order.status === "processing"
                                      ? "bg-blue-100 text-blue-800"
                                      : "bg-yellow-100 text-yellow-800"
                                  }
                                >
                                  {order.status === "completed" 
                                    ? "Completado" 
                                    : order.status === "processing"
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
                                >
                                  <Eye className="h-4 w-4 mr-1" />
                                  Ver
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center py-10">
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
                  {/* Similar table but filtered for pending orders */}
                  <div className="text-center py-10">
                    <p className="text-muted-foreground">Vista pendiente de implementación</p>
                  </div>
                </TabsContent>
                
                <TabsContent value="processing" className="m-0">
                  {/* Similar table but filtered for processing orders */}
                  <div className="text-center py-10">
                    <p className="text-muted-foreground">Vista pendiente de implementación</p>
                  </div>
                </TabsContent>
                
                <TabsContent value="completed" className="m-0">
                  {/* Similar table but filtered for completed orders */}
                  <div className="text-center py-10">
                    <p className="text-muted-foreground">Vista pendiente de implementación</p>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </main>
      </div>
      
      {/* Order Detail Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Detalle de Pedido #{selectedOrder?.id}</DialogTitle>
          </DialogHeader>
          
          {selectedOrder && (
            <div className="space-y-6">
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
                  <p className="text-sm text-muted-foreground">Estado</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge 
                      variant={
                        selectedOrder.status === "completed" ? "default" : 
                        selectedOrder.status === "processing" ? "secondary" : 
                        "outline"
                      } 
                      className={
                        selectedOrder.status === "completed" 
                          ? "bg-green-100 text-green-800" 
                          : selectedOrder.status === "processing"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-yellow-100 text-yellow-800"
                      }
                    >
                      {selectedOrder.status === "completed" 
                        ? "Completado" 
                        : selectedOrder.status === "processing"
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
                    {selectedOrder.items && selectedOrder.items.map((item: any, index: number) => (
                      <TableRow key={index}>
                        <TableCell>{item.product?.name || `Producto #${item.productId}`}</TableCell>
                        <TableCell className="text-right">{parseFloat(item.quantity).toFixed(2)} {item.unit}</TableCell>
                        <TableCell className="text-right">${parseFloat(item.price).toFixed(2)}</TableCell>
                        <TableCell className="text-right">${parseFloat(item.total).toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
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
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Crear Nuevo Pedido</DialogTitle>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="customerId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cliente (opcional)</FormLabel>
                      <Select 
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar cliente" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="">Sin cliente</SelectItem>
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
                            <TableCell>{item.name}</TableCell>
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
                  disabled={createOrderMutation.isPending || orderItems.length === 0}
                >
                  {createOrderMutation.isPending 
                    ? "Creando..." 
                    : "Crear Pedido"
                  }
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
