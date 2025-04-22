import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardDescription,
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  Loader2, 
  Plus, 
  PenSquare, 
  Trash2, 
  Calendar as CalendarIcon, 
  Truck,
  User,
  MapPin,
  Package,
  CheckCircle2,
  XCircle,
  History,
  Clock,
  Route,
  Filter,
  RotateCw,
  Search,
  Phone
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

// Definición del esquema de Entrega
const deliverySchema = z.object({
  customerId: z.number({ required_error: "El cliente es requerido" }),
  address: z.string().min(1, "La dirección es requerida"),
  scheduledDate: z.date({ required_error: "La fecha es requerida" }),
  scheduledTimeRange: z.string().min(1, "El horario es requerido"),
  driverId: z.number().optional(),
  vehicleId: z.number().optional(),
  routeId: z.number().optional(),
  orderId: z.number().optional(),
  saleId: z.number().optional(),
  status: z.string().default("pending"),
  priority: z.string().default("normal"),
  notes: z.string().optional(),
  contactPhone: z.string().optional(),
  contactName: z.string().optional(),
  totalItems: z.string().optional(),
  totalWeight: z.string().optional(),
  requiresSignature: z.boolean().default(false),
  refrigerated: z.boolean().default(false)
});

type Delivery = z.infer<typeof deliverySchema> & {
  id: number;
  userId: number;
  trackingCode: string;
  customer?: any;
  driver?: any;
  vehicle?: any;
  route?: any;
  events?: any[];
  estimatedDeliveryTime?: Date;
  actualDeliveryTime?: Date;
};

type Customer = {
  id: number;
  name: string;
  phone?: string | null;
  address?: string | null;
  email?: string | null;
};

type DeliveryRoute = {
  id: number;
  name: string;
  zoneId: number;
  active: boolean;
};

type Vehicle = {
  id: number;
  name: string;
  type: string;
  active: boolean;
};

type Driver = {
  id: number;
  username: string;
  fullName: string;
  role: string;
};

type Sale = {
  id: number;
  customer?: Customer;
  total: string;
  timestamp: Date;
};

type Order = {
  id: number;
  customer?: Customer;
  total: string;
  timestamp: Date;
};

export default function DeliveriesTab() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedDelivery, setSelectedDelivery] = useState<Delivery | null>(null);
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Obtener lista de entregas
  const { data: deliveries, isLoading: isLoadingDeliveries } = useQuery<Delivery[]>({
    queryKey: ["/api/deliveries"],
    queryFn: async () => {
      const response = await fetch("/api/deliveries");
      if (!response.ok) {
        throw new Error("Error al cargar entregas");
      }
      return response.json();
    }
  });

  // Obtener lista de clientes
  const { data: customers, isLoading: isLoadingCustomers } = useQuery<Customer[]>({
    queryKey: ["/api/customers"],
    queryFn: async () => {
      const response = await fetch("/api/customers");
      if (!response.ok) {
        throw new Error("Error al cargar clientes");
      }
      return response.json();
    }
  });

  // Obtener conductores
  const { data: drivers, isLoading: isLoadingDrivers } = useQuery<Driver[]>({
    queryKey: ["/api/users"],
    queryFn: async () => {
      const response = await fetch("/api/users");
      if (!response.ok) {
        throw new Error("Error al cargar usuarios");
      }
      const users = await response.json();
      return users.filter((user: Driver) => user.role === "driver" || user.role === "admin");
    }
  });

  // Obtener vehículos
  const { data: vehicles, isLoading: isLoadingVehicles } = useQuery<Vehicle[]>({
    queryKey: ["/api/vehicles"],
    queryFn: async () => {
      const response = await fetch("/api/vehicles");
      if (!response.ok) {
        throw new Error("Error al cargar vehículos");
      }
      return response.json();
    }
  });

  // Obtener rutas
  const { data: routes, isLoading: isLoadingRoutes } = useQuery<DeliveryRoute[]>({
    queryKey: ["/api/delivery-routes"],
    queryFn: async () => {
      const response = await fetch("/api/delivery-routes");
      if (!response.ok) {
        throw new Error("Error al cargar rutas");
      }
      return response.json();
    }
  });

  // Form para crear/editar entrega
  const form = useForm<z.infer<typeof deliverySchema>>({
    resolver: zodResolver(deliverySchema),
    defaultValues: {
      status: "pending",
      priority: "normal",
      requiresSignature: false,
      refrigerated: false,
      scheduledDate: new Date(),
      scheduledTimeRange: "",
      address: "",
    }
  });

  // Form para actualizar estado
  const statusForm = useForm({
    defaultValues: {
      status: "pending",
      notes: ""
    }
  });

  // Filtrar entregas activas
  const activeVehicles = useMemo(() => {
    if (!vehicles) return [];
    return vehicles.filter(vehicle => vehicle.active);
  }, [vehicles]);

  const activeRoutes = useMemo(() => {
    if (!routes) return [];
    return routes.filter(route => route.active);
  }, [routes]);

  // Filtrar entregas según el estado seleccionado y término de búsqueda
  const filteredDeliveries = useMemo(() => {
    if (!deliveries) return [];

    let filtered = deliveries;

    // Filtrar por estado
    if (filterStatus !== "all") {
      filtered = filtered.filter(delivery => delivery.status === filterStatus);
    }

    // Filtrar por término de búsqueda
    if (searchTerm.trim() !== "") {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(delivery => 
        (delivery.trackingCode && delivery.trackingCode.toLowerCase().includes(searchLower)) ||
        (delivery.customer?.name && delivery.customer.name.toLowerCase().includes(searchLower)) ||
        (delivery.address && delivery.address.toLowerCase().includes(searchLower)) ||
        (delivery.contactName && delivery.contactName.toLowerCase().includes(searchLower)) ||
        (delivery.contactPhone && delivery.contactPhone.includes(searchLower))
      );
    }

    return filtered;
  }, [deliveries, filterStatus, searchTerm]);

  // Mutaciones para CRUD
  const createDeliveryMutation = useMutation({
    mutationFn: async (data: z.infer<typeof deliverySchema>) => {
      const response = await apiRequest("POST", "/api/deliveries", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Entrega creada",
        description: "La entrega ha sido creada exitosamente",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/deliveries"] });
      setIsCreateOpen(false);
      form.reset({
        status: "pending",
        priority: "normal",
        requiresSignature: false,
        refrigerated: false,
        scheduledDate: new Date(),
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Error al crear entrega: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  const updateDeliveryMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: z.infer<typeof deliverySchema> }) => {
      const response = await apiRequest("PUT", `/api/deliveries/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Entrega actualizada",
        description: "La entrega ha sido actualizada exitosamente",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/deliveries"] });
      setIsEditOpen(false);
      setSelectedDelivery(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Error al actualizar entrega: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status, notes }: { id: number; status: string; notes?: string }) => {
      const response = await apiRequest("POST", `/api/deliveries/${id}/status`, { 
        status,
        notes
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Estado actualizado",
        description: "El estado de la entrega ha sido actualizado",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/deliveries"] });
      if (selectedDelivery) {
        // Refrescar los detalles de la entrega seleccionada
        fetch(`/api/deliveries/${selectedDelivery.id}`)
          .then(res => res.json())
          .then(data => setSelectedDelivery(data));
      }
      statusForm.reset({
        status: "pending",
        notes: ""
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Error al actualizar estado: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  const deleteDeliveryMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/deliveries/${id}`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Entrega eliminada",
        description: "La entrega ha sido cancelada exitosamente",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/deliveries"] });
      setIsDetailsOpen(false);
      setSelectedDelivery(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Error al cancelar entrega: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  // Manejadores
  const onCreateSubmit = (data: z.infer<typeof deliverySchema>) => {
    createDeliveryMutation.mutate(data);
  };

  const onEditSubmit = (data: z.infer<typeof deliverySchema>) => {
    if (!selectedDelivery) return;
    updateDeliveryMutation.mutate({ id: selectedDelivery.id, data });
  };

  const handleUpdateStatus = (newStatus: string) => {
    if (!selectedDelivery) return;
    
    const notes = statusForm.getValues().notes;
    updateStatusMutation.mutate({ 
      id: selectedDelivery.id, 
      status: newStatus,
      notes
    });
  };

  const handleViewDetails = (delivery: Delivery) => {
    setSelectedDelivery(delivery);
    setIsDetailsOpen(true);
  };

  const handleEdit = (delivery: Delivery) => {
    setSelectedDelivery(delivery);
    
    // Rellenar el formulario con los datos de la entrega
    form.reset({
      customerId: delivery.customerId,
      address: delivery.address || "",
      scheduledDate: new Date(delivery.scheduledDate),
      scheduledTimeRange: delivery.scheduledTimeRange || "",
      driverId: delivery.driverId,
      vehicleId: delivery.vehicleId,
      routeId: delivery.routeId,
      orderId: delivery.orderId,
      saleId: delivery.saleId,
      status: delivery.status,
      priority: delivery.priority || "normal",
      notes: delivery.notes || "",
      contactPhone: delivery.contactPhone || "",
      contactName: delivery.contactName || "",
      totalItems: delivery.totalItems || "",
      totalWeight: delivery.totalWeight || "",
      requiresSignature: delivery.requiresSignature || false,
      refrigerated: delivery.refrigerated || false
    });
    
    setIsEditOpen(true);
  };

  const handleDelete = (id: number) => {
    deleteDeliveryMutation.mutate(id);
  };

  // Función para renderizar el badge de estado
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            Pendiente
          </Badge>
        );
      case "assigned":
        return (
          <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
            Asignada
          </Badge>
        );
      case "in_transit":
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
            En Tránsito
          </Badge>
        );
      case "delivered":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            Entregada
          </Badge>
        );
      case "failed":
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
            Fallida
          </Badge>
        );
      case "cancelled":
        return (
          <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
            Cancelada
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">{status}</Badge>
        );
    }
  };

  // Función para renderizar el badge de prioridad
  const renderPriorityBadge = (priority: string) => {
    switch (priority) {
      case "high":
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
            Alta
          </Badge>
        );
      case "normal":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            Normal
          </Badge>
        );
      case "low":
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            Baja
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">{priority}</Badge>
        );
    }
  };

  // Renderizado condicional
  if (isLoadingDeliveries || isLoadingCustomers || isLoadingDrivers || isLoadingVehicles || isLoadingRoutes) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Entregas</h2>
          <p className="text-muted-foreground">
            Gestiona las entregas a clientes
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar entregas..."
              className="pl-8 w-full md:w-64"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-1">
                <Plus className="h-4 w-4" /> Nueva Entrega
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl">
              <DialogHeader>
                <DialogTitle>Crear Nueva Entrega</DialogTitle>
                <DialogDescription>
                  Programa una nueva entrega para un cliente
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onCreateSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <FormField
                        control={form.control}
                        name="customerId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Cliente</FormLabel>
                            <Select 
                              onValueChange={(value) => field.onChange(parseInt(value))} 
                              defaultValue={field.value?.toString()}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecciona un cliente" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {customers && customers.map(customer => (
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
                        name="address"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Dirección de Entrega</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Dirección completa de entrega" 
                                {...field}
                                value={field.value || ""}
                                className="resize-none"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="contactName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Contacto</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="Nombre de contacto" 
                                  {...field}
                                  value={field.value || ""}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="contactPhone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Teléfono</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="Número de teléfono" 
                                  {...field}
                                  value={field.value || ""}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <FormField
                        control={form.control}
                        name="scheduledDate"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel>Fecha de Entrega</FormLabel>
                            <Popover>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant={"outline"}
                                    className="w-full pl-3 text-left font-normal"
                                  >
                                    {field.value ? (
                                      format(field.value, "PPP", { locale: es })
                                    ) : (
                                      <span>Selecciona una fecha</span>
                                    )}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                  mode="single"
                                  selected={field.value}
                                  onSelect={field.onChange}
                                  initialFocus
                                  locale={es}
                                />
                              </PopoverContent>
                            </Popover>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="scheduledTimeRange"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Rango Horario</FormLabel>
                            <Select 
                              onValueChange={field.onChange} 
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecciona un horario" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="mañana">Mañana (8:00 - 12:00)</SelectItem>
                                <SelectItem value="tarde">Tarde (13:00 - 17:00)</SelectItem>
                                <SelectItem value="completo">Día completo (8:00 - 17:00)</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="space-y-4">
                      <FormField
                        control={form.control}
                        name="priority"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Prioridad</FormLabel>
                            <Select 
                              onValueChange={field.onChange} 
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecciona la prioridad" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="low">Baja</SelectItem>
                                <SelectItem value="normal">Normal</SelectItem>
                                <SelectItem value="high">Alta</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="totalItems"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Cantidad de Ítems</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  placeholder="Ej: 5" 
                                  {...field}
                                  value={field.value || ""}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="totalWeight"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Peso Total (kg)</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="Ej: 8.5" 
                                  {...field}
                                  value={field.value || ""}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <div className="grid grid-cols-1 gap-4">
                        <FormField
                          control={form.control}
                          name="driverId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Conductor (opcional)</FormLabel>
                              <Select 
                                onValueChange={(value) => field.onChange(parseInt(value))} 
                                defaultValue={field.value?.toString()}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Selecciona un conductor" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="none">Sin asignar</SelectItem>
                                  {drivers && drivers.map(driver => (
                                    <SelectItem key={driver.id} value={driver.id.toString()}>
                                      {driver.fullName || driver.username}
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
                          name="vehicleId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Vehículo (opcional)</FormLabel>
                              <Select 
                                onValueChange={(value) => field.onChange(parseInt(value))} 
                                defaultValue={field.value?.toString()}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Selecciona un vehículo" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="none">Sin asignar</SelectItem>
                                  {activeVehicles.map(vehicle => (
                                    <SelectItem key={vehicle.id} value={vehicle.id.toString()}>
                                      {vehicle.name}
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
                              <FormLabel>Ruta (opcional)</FormLabel>
                              <Select 
                                onValueChange={(value) => field.onChange(parseInt(value))} 
                                defaultValue={field.value?.toString()}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Selecciona una ruta" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="none">Sin asignar</SelectItem>
                                  {activeRoutes.map(route => (
                                    <SelectItem key={route.id} value={route.id.toString()}>
                                      {route.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <FormField
                        control={form.control}
                        name="notes"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Notas de Entrega</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Instrucciones especiales para la entrega" 
                                className="resize-none" 
                                {...field}
                                value={field.value || ""}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="requiresSignature"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4">
                          <FormControl>
                            <input
                              type="checkbox"
                              checked={field.value}
                              onChange={field.onChange}
                              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Requiere Firma</FormLabel>
                            <FormDescription>
                              El cliente debe firmar al recibir
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="refrigerated"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4">
                          <FormControl>
                            <input
                              type="checkbox"
                              checked={field.value}
                              onChange={field.onChange}
                              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Requiere Refrigeración</FormLabel>
                            <FormDescription>
                              Los productos necesitan refrigeración
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />
                  </div>
                  <DialogFooter>
                    <Button 
                      type="submit" 
                      disabled={createDeliveryMutation.isPending}
                    >
                      {createDeliveryMutation.isPending && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Crear Entrega
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filtros de estado */}
      <div className="mb-6">
        <div className="flex flex-wrap gap-2">
          <Button 
            variant={filterStatus === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterStatus("all")}
          >
            Todas
          </Button>
          <Button 
            variant={filterStatus === "pending" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterStatus("pending")}
          >
            Pendientes
          </Button>
          <Button 
            variant={filterStatus === "assigned" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterStatus("assigned")}
          >
            Asignadas
          </Button>
          <Button 
            variant={filterStatus === "in_transit" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterStatus("in_transit")}
          >
            En Tránsito
          </Button>
          <Button 
            variant={filterStatus === "delivered" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterStatus("delivered")}
          >
            Entregadas
          </Button>
          <Button 
            variant={filterStatus === "failed" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterStatus("failed")}
          >
            Fallidas
          </Button>
          <Button 
            variant={filterStatus === "cancelled" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterStatus("cancelled")}
          >
            Canceladas
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="ml-auto"
            onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/deliveries"] })}
            title="Actualizar"
          >
            <RotateCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Tabla de entregas */}
      <Card>
        <CardHeader>
          <CardTitle>
            Entregas {filterStatus !== "all" ? `- ${filterStatus.charAt(0).toUpperCase() + filterStatus.slice(1)}` : ""}
          </CardTitle>
          <CardDescription>
            Lista de entregas programadas y su estado actual
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Fecha Programada</TableHead>
                <TableHead>Prioridad</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDeliveries.length > 0 ? (
                filteredDeliveries.map((delivery) => (
                  <TableRow key={delivery.id} className="cursor-pointer" onClick={() => handleViewDetails(delivery)}>
                    <TableCell>
                      <div className="font-medium">
                        {delivery.trackingCode}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span>{delivery.customer?.name || "Cliente sin especificar"}</span>
                        {delivery.contactName && (
                          <span className="text-xs text-muted-foreground">
                            Contacto: {delivery.contactName}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span>
                          {format(new Date(delivery.scheduledDate), "dd/MM/yyyy")}
                        </span>
                        {delivery.scheduledTimeRange && (
                          <span className="text-xs text-muted-foreground">
                            {delivery.scheduledTimeRange === "mañana" ? "Mañana (8-12h)" : 
                             delivery.scheduledTimeRange === "tarde" ? "Tarde (13-17h)" : 
                             "Día completo (8-17h)"}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {renderPriorityBadge(delivery.priority || "normal")}
                    </TableCell>
                    <TableCell>
                      {renderStatusBadge(delivery.status)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEdit(delivery);
                          }}
                        >
                          <PenSquare className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="text-red-500"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                            <AlertDialogHeader>
                              <AlertDialogTitle>¿Cancelar esta entrega?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Esta acción marca la entrega como cancelada. ¿Deseas continuar?
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Volver</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => handleDelete(delivery.id)}
                                className="bg-red-500 hover:bg-red-600"
                              >
                                Cancelar Entrega
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                    No hay entregas {filterStatus !== "all" ? `con estado "${filterStatus}"` : ""}{searchTerm ? ` que coincidan con "${searchTerm}"` : ""}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Diálogo de detalles de entrega */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-3xl">
          {selectedDelivery && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center justify-between">
                  <span>Entrega #{selectedDelivery.id} - {selectedDelivery.trackingCode}</span>
                  {renderStatusBadge(selectedDelivery.status)}
                </DialogTitle>
                <DialogDescription>
                  Detalles y seguimiento de la entrega
                </DialogDescription>
              </DialogHeader>
              
              <Tabs defaultValue="details">
                <TabsList className="w-full mb-4">
                  <TabsTrigger value="details">Detalles</TabsTrigger>
                  <TabsTrigger value="tracking">Seguimiento</TabsTrigger>
                  <TabsTrigger value="actions">Acciones</TabsTrigger>
                </TabsList>
                
                <TabsContent value="details" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-2">Información de Cliente</h3>
                      <div className="space-y-2">
                        <div className="flex items-start space-x-3">
                          <User className="h-4 w-4 mt-0.5" />
                          <div>
                            <p className="font-medium">{selectedDelivery.customer?.name || "Cliente no especificado"}</p>
                            {selectedDelivery.contactName && <p className="text-sm">{selectedDelivery.contactName}</p>}
                          </div>
                        </div>
                        
                        {selectedDelivery.contactPhone && (
                          <div className="flex items-start space-x-3">
                            <Phone className="h-4 w-4 mt-0.5" />
                            <p>{selectedDelivery.contactPhone}</p>
                          </div>
                        )}
                        
                        <div className="flex items-start space-x-3">
                          <MapPin className="h-4 w-4 mt-0.5" />
                          <p>{selectedDelivery.address || "Sin dirección"}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-2">Información de Entrega</h3>
                      <div className="space-y-2">
                        <div className="flex items-start space-x-3">
                          <CalendarIcon className="h-4 w-4 mt-0.5" />
                          <div>
                            <p>Programada: {format(new Date(selectedDelivery.scheduledDate), "PPP", { locale: es })}</p>
                            <p className="text-sm">{selectedDelivery.scheduledTimeRange === "mañana" ? "Mañana (8-12h)" : 
                               selectedDelivery.scheduledTimeRange === "tarde" ? "Tarde (13-17h)" : 
                               "Día completo (8-17h)"}</p>
                          </div>
                        </div>
                        
                        {selectedDelivery.driverId && selectedDelivery.driver && (
                          <div className="flex items-start space-x-3">
                            <User className="h-4 w-4 mt-0.5" />
                            <div>
                              <p>Conductor: {selectedDelivery.driver.fullName || selectedDelivery.driver.username}</p>
                            </div>
                          </div>
                        )}
                        
                        {selectedDelivery.vehicleId && selectedDelivery.vehicle && (
                          <div className="flex items-start space-x-3">
                            <Truck className="h-4 w-4 mt-0.5" />
                            <p>Vehículo: {selectedDelivery.vehicle.name}</p>
                          </div>
                        )}
                        
                        {selectedDelivery.routeId && selectedDelivery.route && (
                          <div className="flex items-start space-x-3">
                            <Route className="h-4 w-4 mt-0.5" />
                            <p>Ruta: {selectedDelivery.route.name}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="border rounded-md p-4">
                    <h3 className="text-sm font-medium mb-2">Detalles Adicionales</h3>
                    <dl className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                      <div>
                        <dt className="text-muted-foreground">Prioridad</dt>
                        <dd>{renderPriorityBadge(selectedDelivery.priority || "normal")}</dd>
                      </div>
                      
                      {selectedDelivery.totalItems && (
                        <div>
                          <dt className="text-muted-foreground">Cantidad Ítems</dt>
                          <dd>{selectedDelivery.totalItems}</dd>
                        </div>
                      )}
                      
                      {selectedDelivery.totalWeight && (
                        <div>
                          <dt className="text-muted-foreground">Peso Total</dt>
                          <dd>{selectedDelivery.totalWeight} kg</dd>
                        </div>
                      )}
                      
                      {selectedDelivery.requiresSignature != null && (
                        <div>
                          <dt className="text-muted-foreground">Requiere Firma</dt>
                          <dd>{selectedDelivery.requiresSignature ? "Sí" : "No"}</dd>
                        </div>
                      )}
                      
                      {selectedDelivery.refrigerated != null && (
                        <div>
                          <dt className="text-muted-foreground">Refrigeración</dt>
                          <dd>{selectedDelivery.refrigerated ? "Sí" : "No"}</dd>
                        </div>
                      )}
                    </dl>
                  </div>
                  
                  {selectedDelivery.notes && (
                    <div className="border rounded-md p-4">
                      <h3 className="text-sm font-medium mb-2">Notas de Entrega</h3>
                      <p className="text-sm">{selectedDelivery.notes}</p>
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="tracking">
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium">Historial de Eventos</h3>
                    
                    {selectedDelivery.events && selectedDelivery.events.length > 0 ? (
                      <div className="space-y-4">
                        {selectedDelivery.events.map((event, index) => (
                          <div key={event.id} className="border rounded-md p-3">
                            <div className="flex justify-between items-start mb-2">
                              <div className="flex items-center gap-2">
                                {event.eventType === "status_change" && <History className="h-4 w-4" />}
                                <h4 className="font-medium text-sm">{event.description}</h4>
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {format(new Date(event.timestamp), "dd/MM/yyyy HH:mm")}
                              </div>
                            </div>
                            {event.user && (
                              <p className="text-xs text-muted-foreground">
                                Por: {event.user.fullName || event.user.username}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-sm py-4">No hay eventos registrados para esta entrega</p>
                    )}
                  </div>
                </TabsContent>
                
                <TabsContent value="actions">
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-sm font-medium mb-3">Actualizar Estado</h3>
                      <form className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <Select
                            onValueChange={(value) => statusForm.setValue("status", value)}
                            defaultValue={selectedDelivery.status}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecciona estado" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Pendiente</SelectItem>
                              <SelectItem value="assigned">Asignada</SelectItem>
                              <SelectItem value="in_transit">En Tránsito</SelectItem>
                              <SelectItem value="delivered">Entregada</SelectItem>
                              <SelectItem value="failed">Fallida</SelectItem>
                              <SelectItem value="cancelled">Cancelada</SelectItem>
                            </SelectContent>
                          </Select>
                          
                          <Button
                            onClick={() => handleUpdateStatus(statusForm.getValues().status)}
                            disabled={updateStatusMutation.isPending}
                          >
                            {updateStatusMutation.isPending && (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            )}
                            Actualizar Estado
                          </Button>
                        </div>
                        
                        <Textarea
                          placeholder="Notas sobre el cambio de estado (opcional)"
                          onChange={(e) => statusForm.setValue("notes", e.target.value)}
                          className="resize-none"
                        />
                      </form>
                    </div>
                    
                    <div className="border-t pt-4">
                      <h3 className="text-sm font-medium mb-3">Acciones Adicionales</h3>
                      <div className="flex flex-wrap gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleEdit(selectedDelivery)}
                        >
                          <PenSquare className="h-4 w-4 mr-2" /> Editar Entrega
                        </Button>
                        
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="text-red-500 border-red-200"
                            >
                              <Trash2 className="h-4 w-4 mr-2" /> Cancelar Entrega
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>¿Cancelar esta entrega?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Esta acción marca la entrega como cancelada. ¿Deseas continuar?
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Volver</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => handleDelete(selectedDelivery.id)}
                                className="bg-red-500 hover:bg-red-600"
                              >
                                Cancelar Entrega
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
              
              <DialogFooter className="justify-start mt-4">
                <Button variant="outline" onClick={() => setIsDetailsOpen(false)}>
                  Cerrar
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de edición */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Editar Entrega</DialogTitle>
            <DialogDescription>
              Actualiza los detalles de la entrega
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onEditSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="customerId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cliente</FormLabel>
                        <Select 
                          onValueChange={(value) => field.onChange(parseInt(value))} 
                          defaultValue={field.value?.toString()}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecciona un cliente" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {customers && customers.map(customer => (
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
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Dirección de Entrega</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Dirección completa de entrega" 
                            {...field}
                            value={field.value || ""}
                            className="resize-none"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="contactName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Contacto</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Nombre de contacto" 
                              {...field}
                              value={field.value || ""}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="contactPhone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Teléfono</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Número de teléfono" 
                              {...field}
                              value={field.value || ""}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="scheduledDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Fecha de Entrega</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={"outline"}
                                className="w-full pl-3 text-left font-normal"
                              >
                                {field.value ? (
                                  format(field.value, "PPP", { locale: es })
                                ) : (
                                  <span>Selecciona una fecha</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              initialFocus
                              locale={es}
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="scheduledTimeRange"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Rango Horario</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecciona un horario" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="mañana">Mañana (8:00 - 12:00)</SelectItem>
                            <SelectItem value="tarde">Tarde (13:00 - 17:00)</SelectItem>
                            <SelectItem value="completo">Día completo (8:00 - 17:00)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="priority"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Prioridad</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecciona la prioridad" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="low">Baja</SelectItem>
                            <SelectItem value="normal">Normal</SelectItem>
                            <SelectItem value="high">Alta</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="totalItems"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Cantidad de Ítems</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="Ej: 5" 
                              {...field}
                              value={field.value || ""}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="totalWeight"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Peso Total (kg)</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Ej: 8.5" 
                              {...field}
                              value={field.value || ""}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="grid grid-cols-1 gap-4">
                    <FormField
                      control={form.control}
                      name="driverId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Conductor (opcional)</FormLabel>
                          <Select 
                            onValueChange={(value) => field.onChange(value ? parseInt(value) : undefined)} 
                            defaultValue={field.value?.toString()}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecciona un conductor" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="none">Sin asignar</SelectItem>
                              {drivers && drivers.map(driver => (
                                <SelectItem key={driver.id} value={driver.id.toString()}>
                                  {driver.fullName || driver.username}
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
                      name="vehicleId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Vehículo (opcional)</FormLabel>
                          <Select 
                            onValueChange={(value) => field.onChange(value ? parseInt(value) : undefined)} 
                            defaultValue={field.value?.toString()}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecciona un vehículo" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="none">Sin asignar</SelectItem>
                              {activeVehicles.map(vehicle => (
                                <SelectItem key={vehicle.id} value={vehicle.id.toString()}>
                                  {vehicle.name}
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
                          <FormLabel>Ruta (opcional)</FormLabel>
                          <Select 
                            onValueChange={(value) => field.onChange(value ? parseInt(value) : undefined)} 
                            defaultValue={field.value?.toString()}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecciona una ruta" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="none">Sin asignar</SelectItem>
                              {activeRoutes.map(route => (
                                <SelectItem key={route.id} value={route.id.toString()}>
                                  {route.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notas de Entrega</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Instrucciones especiales para la entrega" 
                            className="resize-none" 
                            {...field}
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="requiresSignature"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <input
                          type="checkbox"
                          checked={field.value}
                          onChange={field.onChange}
                          className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Requiere Firma</FormLabel>
                        <FormDescription>
                          El cliente debe firmar al recibir
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="refrigerated"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <input
                          type="checkbox"
                          checked={field.value}
                          onChange={field.onChange}
                          className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Requiere Refrigeración</FormLabel>
                        <FormDescription>
                          Los productos necesitan refrigeración
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
              </div>
              <DialogFooter>
                <Button 
                  type="submit" 
                  disabled={updateDeliveryMutation.isPending}
                >
                  {updateDeliveryMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Guardar Cambios
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}