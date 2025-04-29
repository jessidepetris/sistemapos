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
  CardFooter,
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
import { Loader2, Plus, PenSquare, Trash2, Calendar as CalendarIcon, Truck, User, RotateCw } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

// Definición del esquema de Asignación de Ruta
const routeAssignmentSchema = z.object({
  date: z.date({ required_error: "La fecha es requerida" }),
  driverId: z.number({ required_error: "El conductor es requerido" }),
  vehicleId: z.number({ required_error: "El vehículo es requerido" }),
  routeId: z.number({ required_error: "La ruta es requerida" }),
  status: z.string().default("scheduled"),
  notes: z.string().optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional()
});

type RouteAssignment = z.infer<typeof routeAssignmentSchema> & {
  id: number;
  driver?: any;
  vehicle?: any;
  route?: any;
};

type DeliveryRoute = {
  id: number;
  name: string;
  zoneId: number;
  active: boolean;
  zone?: {
    name: string;
  };
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

export default function RouteAssignmentsTab() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<RouteAssignment | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const { toast } = useToast();
  const reactQueryClient = useQueryClient();

  // Obtener lista de asignaciones para la fecha seleccionada
  const { data: assignments, isLoading: isLoadingAssignments } = useQuery<RouteAssignment[]>({
    queryKey: ["/api/route-assignments", selectedDate],
    queryFn: async () => {
      const dateStr = selectedDate.toISOString().split('T')[0];
      const response = await fetch(`/api/route-assignments?date=${dateStr}`);
      if (!response.ok) {
        throw new Error("Error al cargar asignaciones de ruta");
      }
      return response.json();
    }
  });

  // Obtener lista de rutas para el selector
  const { data: routes, isLoading: isLoadingRoutes } = useQuery<DeliveryRoute[]>({
    queryKey: ["/api/delivery-routes"],
    queryFn: async () => {
      const response = await fetch("/api/delivery-routes");
      if (!response.ok) {
        throw new Error("Error al cargar rutas de entrega");
      }
      return response.json();
    }
  });

  // Obtener lista de vehículos para el selector
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

  // Obtener lista de conductores para el selector
  const { data: users, isLoading: isLoadingUsers } = useQuery<Driver[]>({
    queryKey: ["/api/users"],
    queryFn: async () => {
      const response = await fetch("/api/users");
      if (!response.ok) {
        throw new Error("Error al cargar usuarios");
      }
      return response.json();
    }
  });

  // Form para crear/editar asignación
  const form = useForm<z.infer<typeof routeAssignmentSchema>>({
    resolver: zodResolver(routeAssignmentSchema),
    defaultValues: {
      date: new Date(),
      driverId: undefined,
      vehicleId: undefined,
      routeId: undefined,
      status: "scheduled",
      notes: "",
      startTime: "",
      endTime: ""
    }
  });

  // Filtrar sólo conductores (role: driver) y rutas y vehículos activos
  const drivers = useMemo(() => {
    if (!users) return [];
    return users.filter(user => user.role === "driver" || user.role === "admin");
  }, [users]);

  const activeVehicles = useMemo(() => {
    if (!vehicles) return [];
    return vehicles.filter(vehicle => vehicle.active);
  }, [vehicles]);

  const activeRoutes = useMemo(() => {
    if (!routes) return [];
    return routes.filter(route => route.active);
  }, [routes]);

  // Mutaciones para CRUD
  const createAssignmentMutation = useMutation({
    mutationFn: async (data: z.infer<typeof routeAssignmentSchema>) => {
      const response = await apiRequest("POST", "/api/route-assignments", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Asignación creada",
        description: "La asignación de ruta ha sido creada exitosamente",
      });
      reactQueryClient.invalidateQueries({ queryKey: ["/api/route-assignments"] });
      setIsCreateOpen(false);
      form.reset({
        date: new Date(),
        status: "scheduled"
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Error al crear asignación: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  const updateAssignmentMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: z.infer<typeof routeAssignmentSchema> }) => {
      const response = await apiRequest("PUT", `/api/route-assignments/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Asignación actualizada",
        description: "La asignación de ruta ha sido actualizada exitosamente",
      });
      reactQueryClient.invalidateQueries({ queryKey: ["/api/route-assignments"] });
      setIsEditOpen(false);
      setSelectedAssignment(null);
      form.reset({
        date: new Date(),
        status: "scheduled"
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Error al actualizar asignación: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  const deleteAssignmentMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/route-assignments/${id}`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Asignación eliminada",
        description: "La asignación de ruta ha sido eliminada exitosamente",
      });
      reactQueryClient.invalidateQueries({ queryKey: ["/api/route-assignments"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Error al eliminar asignación: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  // Manejadores
  const onCreateSubmit = (data: z.infer<typeof routeAssignmentSchema>) => {
    createAssignmentMutation.mutate(data);
  };

  const onEditSubmit = (data: z.infer<typeof routeAssignmentSchema>) => {
    if (!selectedAssignment) return;
    updateAssignmentMutation.mutate({ id: selectedAssignment.id, data });
  };

  const handleEdit = (assignment: RouteAssignment) => {
    setSelectedAssignment(assignment);
    form.reset({
      date: new Date(assignment.date),
      driverId: assignment.driverId,
      vehicleId: assignment.vehicleId,
      routeId: assignment.routeId,
      status: assignment.status,
      notes: assignment.notes ?? "",
      startTime: assignment.startTime ?? "",
      endTime: assignment.endTime ?? ""
    });
    setIsEditOpen(true);
  };

  const handleDelete = (id: number) => {
    deleteAssignmentMutation.mutate(id);
  };

  // Función para mostrar el estado con badge
  const renderStatus = (status: string) => {
    switch (status) {
      case "scheduled":
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            Programada
          </Badge>
        );
      case "in_progress":
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
            En Progreso
          </Badge>
        );
      case "completed":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            Completada
          </Badge>
        );
      case "cancelled":
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
            Cancelada
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">{status}</Badge>
        );
    }
  };

  // Renderizado condicional
  if (isLoadingAssignments || isLoadingRoutes || isLoadingVehicles || isLoadingUsers) {
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
          <h2 className="text-2xl font-bold tracking-tight">Asignaciones de Ruta</h2>
          <p className="text-muted-foreground">
            Gestiona las asignaciones diarias de rutas a conductores y vehículos
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="justify-start text-left font-normal w-full sm:w-[240px]"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {format(selectedDate, "PPP", { locale: es })}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                initialFocus
                locale={es}
              />
            </PopoverContent>
          </Popover>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-1">
                <Plus className="h-4 w-4" /> Crear Asignación
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Crear Asignación de Ruta</DialogTitle>
                <DialogDescription>
                  Asigna una ruta a un conductor y vehículo para una fecha específica
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onCreateSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="date"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Fecha de Asignación</FormLabel>
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
                              disabled={(date) => {
                                // No permitir fechas pasadas
                                const today = new Date();
                                today.setHours(0, 0, 0, 0);
                                return date < today;
                              }}
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
                    name="driverId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Conductor</FormLabel>
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
                            {drivers.map(driver => (
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
                        <FormLabel>Vehículo</FormLabel>
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
                        <FormLabel>Ruta</FormLabel>
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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="startTime"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Hora Inicio</FormLabel>
                          <FormControl>
                            <Input 
                              type="time" 
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
                      name="endTime"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Hora Fin</FormLabel>
                          <FormControl>
                            <Input 
                              type="time" 
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
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notas</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Instrucciones o notas adicionales" 
                            className="resize-none" 
                            {...field}
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <DialogFooter>
                    <Button 
                      type="submit" 
                      disabled={createAssignmentMutation.isPending}
                    >
                      {createAssignmentMutation.isPending && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Crear Asignación
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Tabla de asignaciones */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Asignaciones para {format(selectedDate, "PPP", { locale: es })}</span>
            <Button
              variant="outline"
              size="icon"
              onClick={() => reactQueryClient.invalidateQueries({ queryKey: ["/api/route-assignments"] })}
              title="Actualizar"
            >
              <RotateCw className="h-4 w-4" />
            </Button>
          </CardTitle>
          <CardDescription>
            Lista de rutas asignadas a conductores y vehículos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Conductor</TableHead>
                <TableHead>Vehículo</TableHead>
                <TableHead>Ruta</TableHead>
                <TableHead>Horario</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assignments && assignments.length > 0 ? (
                assignments.map((assignment) => (
                  <TableRow key={assignment.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-primary" />
                        {assignment.driver?.fullName || assignment.driver?.username || "-"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Truck className="h-4 w-4 text-muted-foreground" />
                        {assignment.vehicle?.name || "-"}
                      </div>
                    </TableCell>
                    <TableCell>{assignment.route?.name || "-"}</TableCell>
                    <TableCell>
                      {assignment.startTime && assignment.endTime ? (
                        `${assignment.startTime} - ${assignment.endTime}`
                      ) : (
                        "No especificado"
                      )}
                    </TableCell>
                    <TableCell>
                      {renderStatus(assignment.status)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleEdit(assignment)}
                        >
                          <PenSquare className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-red-500">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Esta acción no se puede deshacer. La asignación será eliminada permanentemente.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => handleDelete(assignment.id)}
                                className="bg-red-500 hover:bg-red-600"
                              >
                                Eliminar
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
                    No hay asignaciones de ruta programadas para esta fecha
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Modal de edición */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Asignación de Ruta</DialogTitle>
            <DialogDescription>
              Actualiza los detalles de la asignación
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onEditSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Fecha de Asignación</FormLabel>
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
                name="driverId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Conductor</FormLabel>
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
                        {drivers.map(driver => (
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
                    <FormLabel>Vehículo</FormLabel>
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
                    <FormLabel>Ruta</FormLabel>
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
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estado</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona un estado" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="scheduled">Programada</SelectItem>
                        <SelectItem value="in_progress">En Progreso</SelectItem>
                        <SelectItem value="completed">Completada</SelectItem>
                        <SelectItem value="cancelled">Cancelada</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="startTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Hora Inicio</FormLabel>
                      <FormControl>
                        <Input 
                          type="time" 
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
                  name="endTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Hora Fin</FormLabel>
                      <FormControl>
                        <Input 
                          type="time" 
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
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notas</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Instrucciones o notas adicionales" 
                        className="resize-none" 
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button 
                  type="submit" 
                  disabled={updateAssignmentMutation.isPending}
                >
                  {updateAssignmentMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Actualizar Asignación
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}