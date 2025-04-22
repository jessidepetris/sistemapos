import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Loader2, Plus, PenSquare, Trash2, RouteIcon, Clock, MapPinIcon } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

// Definición del esquema de Ruta de Entrega
const deliveryRouteSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  description: z.string().optional(),
  zoneId: z.number({ required_error: "La zona es requerida" }),
  active: z.boolean().default(true),
  estimatedDuration: z.string().optional(), // En minutos
  distance: z.string().optional(), // En km
});

type DeliveryRoute = z.infer<typeof deliveryRouteSchema> & {
  id: number;
  optimizedPath?: any;
};

type DeliveryZone = {
  id: number;
  name: string;
  active: boolean;
};

export default function DeliveryRoutesTab() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState<DeliveryRoute | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Obtener lista de rutas
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

  // Obtener lista de zonas para el selector
  const { data: zones, isLoading: isLoadingZones } = useQuery<DeliveryZone[]>({
    queryKey: ["/api/delivery-zones"],
    queryFn: async () => {
      const response = await fetch("/api/delivery-zones");
      if (!response.ok) {
        throw new Error("Error al cargar zonas de entrega");
      }
      return response.json();
    }
  });

  // Form para crear/editar ruta
  const form = useForm<z.infer<typeof deliveryRouteSchema>>({
    resolver: zodResolver(deliveryRouteSchema),
    defaultValues: {
      name: "",
      description: "",
      zoneId: undefined,
      active: true,
      estimatedDuration: "",
      distance: ""
    }
  });

  // Filtrar sólo zonas activas
  const activeZones = useMemo(() => {
    if (!zones) return [];
    return zones.filter(zone => zone.active);
  }, [zones]);

  // Mutaciones para CRUD
  const createRouteMutation = useMutation({
    mutationFn: async (data: z.infer<typeof deliveryRouteSchema>) => {
      const response = await apiRequest("POST", "/api/delivery-routes", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Ruta creada",
        description: "La ruta de entrega ha sido creada exitosamente",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/delivery-routes"] });
      setIsCreateOpen(false);
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Error al crear ruta: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  const updateRouteMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: z.infer<typeof deliveryRouteSchema> }) => {
      const response = await apiRequest("PUT", `/api/delivery-routes/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Ruta actualizada",
        description: "La ruta de entrega ha sido actualizada exitosamente",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/delivery-routes"] });
      setIsEditOpen(false);
      setSelectedRoute(null);
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Error al actualizar ruta: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  const deleteRouteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/delivery-routes/${id}`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Ruta eliminada",
        description: "La ruta de entrega ha sido eliminada exitosamente",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/delivery-routes"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Error al eliminar ruta: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  // Manejadores
  const onCreateSubmit = (data: z.infer<typeof deliveryRouteSchema>) => {
    createRouteMutation.mutate(data);
  };

  const onEditSubmit = (data: z.infer<typeof deliveryRouteSchema>) => {
    if (!selectedRoute) return;
    updateRouteMutation.mutate({ id: selectedRoute.id, data });
  };

  const handleEdit = (route: DeliveryRoute) => {
    setSelectedRoute(route);
    form.reset({
      name: route.name,
      description: route.description ?? "",
      zoneId: route.zoneId,
      active: route.active ?? true,
      estimatedDuration: route.estimatedDuration?.toString() ?? "",
      distance: route.distance ?? ""
    });
    setIsEditOpen(true);
  };

  const handleDelete = (id: number) => {
    deleteRouteMutation.mutate(id);
  };

  // Obtener el nombre de la zona por ID
  const getZoneName = (zoneId?: number | null) => {
    if (!zoneId || !zones) return "-";
    const zone = zones.find(z => z.id === zoneId);
    return zone ? zone.name : "-";
  };

  // Renderizado condicional
  if (isLoadingRoutes || isLoadingZones) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Rutas de Entrega</h2>
          <p className="text-muted-foreground">
            Gestiona las rutas específicas para cada zona de entrega
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-1">
              <Plus className="h-4 w-4" /> Agregar Ruta
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Agregar Ruta de Entrega</DialogTitle>
              <DialogDescription>
                Completa los datos para registrar una nueva ruta de entrega
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onCreateSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre</FormLabel>
                      <FormControl>
                        <Input placeholder="Nombre de la ruta" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="zoneId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Zona</FormLabel>
                      <Select 
                        onValueChange={(value) => field.onChange(parseInt(value))} 
                        defaultValue={field.value?.toString()}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona una zona" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {activeZones.map(zone => (
                            <SelectItem key={zone.id} value={zone.id.toString()}>
                              {zone.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        La zona geográfica a la que pertenece esta ruta
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descripción</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Descripción o detalles de la ruta" 
                          className="resize-none" 
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="estimatedDuration"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Duración Estimada (minutos)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="Ej: 45" 
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
                    name="distance"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Distancia (km)</FormLabel>
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
                <FormField
                  control={form.control}
                  name="active"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Activa</FormLabel>
                        <FormDescription>
                          Disponible para asignar entregas
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button 
                    type="submit" 
                    disabled={createRouteMutation.isPending}
                  >
                    {createRouteMutation.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Guardar Ruta
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Tabla de rutas */}
      <Card>
        <CardHeader>
          <CardTitle>Rutas de Entrega</CardTitle>
          <CardDescription>
            Lista de rutas disponibles para la asignación de entregas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Zona</TableHead>
                <TableHead>Duración</TableHead>
                <TableHead>Distancia</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {routes && routes.length > 0 ? (
                routes.map((route) => (
                  <TableRow key={route.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <RouteIcon className="h-4 w-4 text-primary" />
                        {route.name}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <MapPinIcon className="h-4 w-4 text-muted-foreground" />
                        {getZoneName(route.zoneId)}
                      </div>
                    </TableCell>
                    <TableCell>
                      {route.estimatedDuration ? (
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          {route.estimatedDuration} min
                        </div>
                      ) : "-"}
                    </TableCell>
                    <TableCell>{route.distance ? `${route.distance} km` : "-"}</TableCell>
                    <TableCell>
                      {route.active ? (
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          Activa
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
                          Inactiva
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleEdit(route)}
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
                                Esta acción no se puede deshacer. La ruta {route.name} será eliminada permanentemente.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => handleDelete(route.id)}
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
                    No hay rutas de entrega registradas
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
            <DialogTitle>Editar Ruta de Entrega</DialogTitle>
            <DialogDescription>
              Actualiza la información de la ruta
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onEditSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre</FormLabel>
                    <FormControl>
                      <Input placeholder="Nombre de la ruta" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="zoneId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Zona</FormLabel>
                    <Select 
                      onValueChange={(value) => field.onChange(parseInt(value))} 
                      defaultValue={field.value?.toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona una zona" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {activeZones.map(zone => (
                          <SelectItem key={zone.id} value={zone.id.toString()}>
                            {zone.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      La zona geográfica a la que pertenece esta ruta
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descripción</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Descripción o detalles de la ruta" 
                        className="resize-none" 
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="estimatedDuration"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Duración Estimada (minutos)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="Ej: 45" 
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
                  name="distance"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Distancia (km)</FormLabel>
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
              <FormField
                control={form.control}
                name="active"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Activa</FormLabel>
                      <FormDescription>
                        Disponible para asignar entregas
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button 
                  type="submit" 
                  disabled={updateRouteMutation.isPending}
                >
                  {updateRouteMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Actualizar Ruta
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}