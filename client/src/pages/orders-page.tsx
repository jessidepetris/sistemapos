import { useState } from "react";
import { DashboardLayout } from "@/layouts/dashboard-layout";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  Order, 
  OrderDetail, 
  Supplier, 
  Product, 
  insertOrderSchema,
  insertOrderDetailSchema
} from "@shared/schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  ClipboardList,
  Search,
  Plus,
  Edit,
  Check,
  Truck,
  Package,
  MoreHorizontal,
  RefreshCw,
  XCircle,
  CheckCircle,
  Clock,
  FileText,
  ShoppingCart,
  Trash2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Define a type for order item in the form
type OrderItemForm = {
  productId: number;
  quantity: string;
  unitPrice?: string;
  notes?: string;
};

// Create a schema for the form with order items
const orderFormSchema = z.object({
  supplierId: z.number({
    required_error: "Por favor seleccione un proveedor",
  }),
  notes: z.string().optional(),
  items: z.array(
    z.object({
      productId: z.number({
        required_error: "Por favor seleccione un producto",
      }),
      quantity: z.string().min(1, "La cantidad es requerida"),
      unitPrice: z.string().optional(),
      notes: z.string().optional(),
    })
  ).min(1, "Debe agregar al menos un producto"),
});

type OrderFormValues = z.infer<typeof orderFormSchema>;

export default function OrdersPage() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [orderItems, setOrderItems] = useState<OrderItemForm[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [viewOrderDetails, setViewOrderDetails] = useState<{
    order: Order;
    details: OrderDetail[];
  } | null>(null);

  // Fetch orders
  const { data: orders, isLoading } = useQuery<Order[]>({
    queryKey: ["/api/orders"],
  });

  // Fetch suppliers
  const { data: suppliers } = useQuery<Supplier[]>({
    queryKey: ["/api/suppliers"],
  });

  // Fetch products
  const { data: products } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  // Create order mutation
  const createOrderMutation = useMutation({
    mutationFn: async (data: { order: any; details: any[] }) => {
      const res = await apiRequest("POST", "/api/orders", data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Pedido creado",
        description: "El pedido ha sido creado exitosamente",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      setIsDialogOpen(false);
      setOrderItems([]);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Error al crear el pedido: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Update order status mutation
  const updateOrderStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const res = await apiRequest("PUT", `/api/orders/${id}/status`, { status });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Estado actualizado",
        description: "El estado del pedido ha sido actualizado exitosamente",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Error al actualizar el estado: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Fetch order details
  const fetchOrderDetails = async (orderId: number) => {
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        credentials: "include",
      });
      
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || res.statusText);
      }
      
      const data = await res.json();
      setViewOrderDetails(data);
    } catch (error) {
      toast({
        title: "Error",
        description: `Error al obtener detalles del pedido: ${error instanceof Error ? error.message : 'Error desconocido'}`,
        variant: "destructive",
      });
    }
  };

  // Setup form with react-hook-form
  const form = useForm<OrderFormValues>({
    resolver: zodResolver(orderFormSchema),
    defaultValues: {
      supplierId: undefined,
      notes: "",
      items: [],
    },
  });

  // Filter orders based on search query and status
  const filteredOrders = orders?.filter((order) => {
    const supplier = suppliers?.find((s) => s.id === order.supplierId);
    
    const matchesSearch =
      supplier?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (order.notes && order.notes.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesStatus =
      filterStatus === "all" || order.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  // Add a new item to the order
  const addOrderItem = () => {
    setOrderItems([
      ...orderItems,
      {
        productId: 0,
        quantity: "",
        unitPrice: "",
        notes: "",
      },
    ]);
  };

  // Remove an item from the order
  const removeOrderItem = (index: number) => {
    const newItems = [...orderItems];
    newItems.splice(index, 1);
    setOrderItems(newItems);
  };

  // Update an item in the order
  const updateOrderItem = (index: number, field: string, value: any) => {
    const newItems = [...orderItems];
    (newItems[index] as any)[field] = value;
    setOrderItems(newItems);
  };

  // Open dialog to create a new order
  const openNewOrderDialog = () => {
    form.reset({
      supplierId: undefined,
      notes: "",
      items: [],
    });
    setOrderItems([
      {
        productId: 0,
        quantity: "",
        unitPrice: "",
        notes: "",
      },
    ]);
    setIsDialogOpen(true);
  };

  // Handle form submission
  const onSubmit = (data: OrderFormValues) => {
    // Map form values to API data format
    const orderData = {
      supplierId: data.supplierId,
      notes: data.notes,
      // We're not setting status or total here, they'll be set on the server
    };
    
    // Map order items to API format
    const orderDetailsData = data.items.map((item) => ({
      productId: item.productId,
      quantity: item.quantity,
      unitPrice: item.unitPrice || undefined,
      notes: item.notes,
    }));
    
    createOrderMutation.mutate({
      order: orderData,
      details: orderDetailsData,
    });
  };

  // Update order status
  const handleStatusChange = (orderId: number, newStatus: string) => {
    updateOrderStatusMutation.mutate({
      id: orderId,
      status: newStatus,
    });
  };

  // Get status badge component
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="outline" className="border-orange-200 bg-orange-100 text-orange-700">
            <Clock className="h-3 w-3 mr-1" />
            Pendiente
          </Badge>
        );
      case "confirmed":
        return (
          <Badge variant="outline" className="border-blue-200 bg-blue-100 text-blue-700">
            <FileText className="h-3 w-3 mr-1" />
            Confirmado
          </Badge>
        );
      case "shipped":
        return (
          <Badge variant="outline" className="border-purple-200 bg-purple-100 text-purple-700">
            <Truck className="h-3 w-3 mr-1" />
            En Camino
          </Badge>
        );
      case "received":
        return (
          <Badge variant="outline" className="border-green-200 bg-green-100 text-green-700">
            <CheckCircle className="h-3 w-3 mr-1" />
            Recibido
          </Badge>
        );
      case "cancelled":
        return (
          <Badge variant="outline" className="border-red-200 bg-red-100 text-red-700">
            <XCircle className="h-3 w-3 mr-1" />
            Cancelado
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="border-gray-200 bg-gray-100 text-gray-700">
            {status}
          </Badge>
        );
    }
  };

  return (
    <DashboardLayout title="Pedidos" description="Gestión de pedidos a proveedores">
      <div className="mb-6 flex justify-between items-center">
        <div className="flex space-x-2 items-center">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-neutral-500" />
            <Input
              placeholder="Buscar pedidos..."
              className="pl-9 w-[300px]"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex space-x-2">
            <Button
              variant={filterStatus === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterStatus("all")}
            >
              Todos
            </Button>
            <Button
              variant={filterStatus === "pending" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterStatus("pending")}
            >
              Pendientes
            </Button>
            <Button
              variant={filterStatus === "confirmed" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterStatus("confirmed")}
            >
              Confirmados
            </Button>
            <Button
              variant={filterStatus === "received" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterStatus("received")}
            >
              Recibidos
            </Button>
          </div>
        </div>

        <Button onClick={openNewOrderDialog}>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Pedido
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Lista de Pedidos</CardTitle>
          <CardDescription>
            Total: {filteredOrders?.length || 0} pedidos
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-4">Cargando pedidos...</div>
          ) : filteredOrders && filteredOrders.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Proveedor</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-mono">#{order.id}</TableCell>
                    <TableCell className="font-medium">
                      {suppliers?.find((s) => s.id === order.supplierId)?.name || "-"}
                    </TableCell>
                    <TableCell>
                      {new Date(order.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {order.total ? `$${parseFloat(order.total.toString()).toFixed(2)}` : "-"}
                    </TableCell>
                    <TableCell>{getStatusBadge(order.status)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => fetchOrderDetails(order.id)}
                        >
                          <ClipboardList className="h-4 w-4" />
                        </Button>
                        
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            
                            {order.status === "pending" && (
                              <>
                                <DropdownMenuItem
                                  onClick={() => handleStatusChange(order.id, "confirmed")}
                                >
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  Confirmar Pedido
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleStatusChange(order.id, "cancelled")}
                                  className="text-red-600"
                                >
                                  <XCircle className="h-4 w-4 mr-2" />
                                  Cancelar Pedido
                                </DropdownMenuItem>
                              </>
                            )}
                            
                            {order.status === "confirmed" && (
                              <DropdownMenuItem
                                onClick={() => handleStatusChange(order.id, "shipped")}
                              >
                                <Truck className="h-4 w-4 mr-2" />
                                Marcar como Enviado
                              </DropdownMenuItem>
                            )}
                            
                            {order.status === "shipped" && (
                              <DropdownMenuItem
                                onClick={() => handleStatusChange(order.id, "received")}
                              >
                                <Check className="h-4 w-4 mr-2" />
                                Marcar como Recibido
                              </DropdownMenuItem>
                            )}
                            
                            {order.status !== "cancelled" && order.status !== "received" && (
                              <DropdownMenuItem
                                onClick={() => handleStatusChange(order.id, "cancelled")}
                                className="text-red-600"
                              >
                                <XCircle className="h-4 w-4 mr-2" />
                                Cancelar Pedido
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8">
              <ClipboardList className="h-12 w-12 mx-auto text-neutral-300 mb-2" />
              <h3 className="text-lg font-medium">No hay pedidos</h3>
              <p className="text-neutral-500 mb-4">
                No se encontraron pedidos con los filtros actuales
              </p>
              <Button onClick={openNewOrderDialog}>
                <Plus className="mr-2 h-4 w-4" />
                Crear Pedido
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* New Order Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nuevo Pedido</DialogTitle>
            <DialogDescription>
              Complete los datos para crear un nuevo pedido a proveedor
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-6 py-4"
            >
              <FormField
                control={form.control}
                name="supplierId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Proveedor</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(parseInt(value))}
                      defaultValue={field.value?.toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccione un proveedor" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {suppliers?.map((supplier) => (
                          <SelectItem
                            key={supplier.id}
                            value={supplier.id.toString()}
                          >
                            {supplier.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div>
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-base font-medium">Productos</h3>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addOrderItem}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Agregar Producto
                  </Button>
                </div>
                
                {orderItems.length === 0 ? (
                  <div className="text-center py-4 border rounded-md">
                    <p className="text-neutral-500">
                      No hay productos en el pedido
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orderItems.map((item, index) => (
                      <div
                        key={index}
                        className="grid grid-cols-12 gap-2 items-end border rounded-md p-3"
                      >
                        <div className="col-span-5">
                          <FormField
                            control={form.control}
                            name={`items.${index}.productId`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Producto</FormLabel>
                                <Select
                                  onValueChange={(value) => {
                                    field.onChange(parseInt(value));
                                    updateOrderItem(index, "productId", parseInt(value));
                                  }}
                                  defaultValue={field.value?.toString()}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Seleccione un producto" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {products?.map((product) => (
                                      <SelectItem
                                        key={product.id}
                                        value={product.id.toString()}
                                      >
                                        {product.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        <div className="col-span-2">
                          <FormField
                            control={form.control}
                            name={`items.${index}.quantity`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Cantidad</FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    step="0.001"
                                    placeholder="Cantidad"
                                    {...field}
                                    onChange={(e) => {
                                      field.onChange(e);
                                      updateOrderItem(index, "quantity", e.target.value);
                                    }}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        <div className="col-span-2">
                          <FormField
                            control={form.control}
                            name={`items.${index}.unitPrice`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Precio Un.</FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    step="0.01"
                                    placeholder="Opcional"
                                    {...field}
                                    onChange={(e) => {
                                      field.onChange(e);
                                      updateOrderItem(index, "unitPrice", e.target.value);
                                    }}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        <div className="col-span-2">
                          <FormField
                            control={form.control}
                            name={`items.${index}.notes`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Notas</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="Opcional"
                                    {...field}
                                    onChange={(e) => {
                                      field.onChange(e);
                                      updateOrderItem(index, "notes", e.target.value);
                                    }}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        <div className="col-span-1 h-full flex items-center justify-center">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeOrderItem(index)}
                            className="text-red-500"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                {form.formState.errors.items && (
                  <p className="text-sm font-medium text-red-500 mt-2">
                    {form.formState.errors.items.message}
                  </p>
                )}
              </div>

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notas</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Observaciones sobre el pedido"
                        {...field}
                      />
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
                  disabled={createOrderMutation.isPending}
                >
                  {createOrderMutation.isPending ? (
                    "Creando..."
                  ) : (
                    <>
                      Crear Pedido
                      <ClipboardList className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Order Details Dialog */}
      {viewOrderDetails && (
        <Dialog open={!!viewOrderDetails} onOpenChange={() => setViewOrderDetails(null)}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Detalles del Pedido #{viewOrderDetails.order.id}</DialogTitle>
              <DialogDescription>
                Información completa del pedido
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-neutral-500">Proveedor</h3>
                  <p className="text-base">
                    {suppliers?.find(s => s.id === viewOrderDetails.order.supplierId)?.name || "N/A"}
                  </p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-neutral-500">Fecha</h3>
                  <p className="text-base">
                    {new Date(viewOrderDetails.order.createdAt).toLocaleDateString()}
                  </p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-neutral-500">Estado</h3>
                  <p className="text-base">{getStatusBadge(viewOrderDetails.order.status)}</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-neutral-500">Total</h3>
                  <p className="text-base font-medium">
                    {viewOrderDetails.order.total 
                      ? `$${parseFloat(viewOrderDetails.order.total.toString()).toFixed(2)}` 
                      : "No especificado"}
                  </p>
                </div>
              </div>

              <div>
                <h3 className="text-base font-medium mb-2">Productos</h3>
                
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Producto</TableHead>
                      <TableHead className="text-right">Cantidad</TableHead>
                      <TableHead className="text-right">Precio Unitario</TableHead>
                      <TableHead>Notas</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {viewOrderDetails.details.map((detail) => (
                      <TableRow key={detail.id}>
                        <TableCell>
                          {products?.find(p => p.id === detail.productId)?.name || `Producto #${detail.productId}`}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {parseFloat(detail.quantity.toString()).toFixed(3)}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {detail.unitPrice 
                            ? `$${parseFloat(detail.unitPrice.toString()).toFixed(2)}` 
                            : "-"}
                        </TableCell>
                        <TableCell>{detail.notes || "-"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {viewOrderDetails.order.notes && (
                <div>
                  <h3 className="text-base font-medium mb-2">Notas</h3>
                  <p className="text-sm text-neutral-700 border rounded-md p-3">
                    {viewOrderDetails.order.notes}
                  </p>
                </div>
              )}

              {viewOrderDetails.order.status !== "cancelled" && viewOrderDetails.order.status !== "received" && (
                <div className="flex justify-between border-t pt-4">
                  <div>
                    <h3 className="text-base font-medium mb-2">Cambiar estado</h3>
                  </div>
                  <div className="flex space-x-2">
                    {viewOrderDetails.order.status === "pending" && (
                      <>
                        <Button
                          variant="outline"
                          onClick={() => {
                            handleStatusChange(viewOrderDetails.order.id, "confirmed");
                            setViewOrderDetails(null);
                          }}
                        >
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Confirmar
                        </Button>
                        <Button
                          variant="outline"
                          className="text-red-600 border-red-200 hover:bg-red-50"
                          onClick={() => {
                            handleStatusChange(viewOrderDetails.order.id, "cancelled");
                            setViewOrderDetails(null);
                          }}
                        >
                          <XCircle className="mr-2 h-4 w-4" />
                          Cancelar
                        </Button>
                      </>
                    )}
                    
                    {viewOrderDetails.order.status === "confirmed" && (
                      <Button
                        variant="outline"
                        onClick={() => {
                          handleStatusChange(viewOrderDetails.order.id, "shipped");
                          setViewOrderDetails(null);
                        }}
                      >
                        <Truck className="mr-2 h-4 w-4" />
                        Marcar como Enviado
                      </Button>
                    )}
                    
                    {viewOrderDetails.order.status === "shipped" && (
                      <Button
                        variant="outline"
                        className="text-green-600 border-green-200 hover:bg-green-50"
                        onClick={() => {
                          handleStatusChange(viewOrderDetails.order.id, "received");
                          setViewOrderDetails(null);
                        }}
                      >
                        <Check className="mr-2 h-4 w-4" />
                        Marcar como Recibido
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button
                variant="default"
                onClick={() => setViewOrderDetails(null)}
              >
                Cerrar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </DashboardLayout>
  );
}
