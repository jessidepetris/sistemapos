import { useState } from "react";
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
import { Loader2, Plus, PenSquare, Trash2, MapPinIcon, Clock, Calendar } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

// Definición del esquema de Zona de Entrega
const deliveryZoneSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  description: z.string().optional(),
  active: z.boolean().default(true),
  estimatedDeliveryTime: z.string().optional(), // En minutos
  deliveryDays: z.array(z.string()).optional()
});

type DeliveryZone = z.infer<typeof deliveryZoneSchema> & {
  id: number;
  coordinates?: any;
};

export default function DeliveryZonesTab() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedZone, setSelectedZone] = useState<DeliveryZone | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Obtener lista de zonas
  const { data: zones, isLoading } = useQuery<DeliveryZone[]>({
    queryKey: ["/api/delivery-zones"],
    queryFn: async () => {
      const response = await fetch("/api/delivery-zones");
      if (!response.ok) {
        throw new Error("Error al cargar zonas de entrega");
      }
      return response.json();
    }
  });

  // Form para crear/editar zona
  const form = useForm<z.infer<typeof deliveryZoneSchema>>({
    resolver: zodResolver(deliveryZoneSchema),
    defaultValues: {
      name: "",
      description: "",
      active: true,
      estimatedDeliveryTime: "",
      deliveryDays: []
    }
  });

  // Mutaciones para CRUD
  const createZoneMutation = useMutation({
    mutationFn: async (data: z.infer<typeof deliveryZoneSchema>) => {
      const response = await apiRequest("POST", "/api/delivery-zones", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Zona creada",
        description: "La zona de entrega ha sido creada exitosamente",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/delivery-zones"] });
      setIsCreateOpen(false);
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Error al crear zona: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  const updateZoneMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: z.infer<typeof deliveryZoneSchema> }) => {
      const response = await apiRequest("PUT", `/api/delivery-zones/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Zona actualizada",
        description: "La zona de entrega ha sido actualizada exitosamente",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/delivery-zones"] });
      setIsEditOpen(false);
      setSelectedZone(null);
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Error al actualizar zona: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  const deleteZoneMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/delivery-zones/${id}`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Zona eliminada",
        description: "La zona de entrega ha sido eliminada exitosamente",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/delivery-zones"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Error al eliminar zona: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  // Manejadores
  const onCreateSubmit = (data: z.infer<typeof deliveryZoneSchema>) => {
    createZoneMutation.mutate(data);
  };

  const onEditSubmit = (data: z.infer<typeof deliveryZoneSchema>) => {
    if (!selectedZone) return;
    updateZoneMutation.mutate({ id: selectedZone.id, data });
  };

  const handleEdit = (zone: DeliveryZone) => {
    setSelectedZone(zone);
    form.reset({
      name: zone.name,
      description: zone.description ?? "",
      active: zone.active ?? true,
      estimatedDeliveryTime: zone.estimatedDeliveryTime?.toString() ?? "",
      deliveryDays: zone.deliveryDays ?? []
    });
    setIsEditOpen(true);
  };

  const handleDelete = (id: number) => {
    deleteZoneMutation.mutate(id);
  };

  // Función para renderizar los días de entrega
  const renderDeliveryDays = (days?: string[]) => {
    if (!days || days.length === 0) return "Todos los días";
    
    // Lógica para mostrar días de forma legible
    const dayNames: Record<string, string> = {
      "monday": "Lun",
      "tuesday": "Mar",
      "wednesday": "Mié",
      "thursday": "Jue",
      "friday": "Vie",
      "saturday": "Sáb",
      "sunday": "Dom"
    };
    
    return days.map(day => dayNames[day] || day).join(", ");
  };

  // Renderizado condicional
  if (isLoading) {
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
          <h2 className="text-2xl font-bold tracking-tight">Zonas de Entrega</h2>
          <p className="text-muted-foreground">
            Gestiona las zonas geográficas para entregas
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-1">
              <Plus className="h-4 w-4" /> Agregar Zona
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Agregar Zona de Entrega</DialogTitle>
              <DialogDescription>
                Completa los datos para registrar una nueva zona de entrega
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
                        <Input placeholder="Nombre de la zona" {...field} />
                      </FormControl>
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
                          placeholder="Descripción o detalles de la zona" 
                          className="resize-none" 
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
                  name="estimatedDeliveryTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tiempo Estimado de Entrega (minutos)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="Ej: 30" 
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
                    disabled={createZoneMutation.isPending}
                  >
                    {createZoneMutation.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Guardar Zona
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Tabla de zonas */}
      <Card>
        <CardHeader>
          <CardTitle>Zonas de Entrega</CardTitle>
          <CardDescription>
            Lista de zonas geográficas para la asignación de rutas y entregas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Descripción</TableHead>
                <TableHead>Tiempo Estimado</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {zones && zones.length > 0 ? (
                zones.map((zone) => (
                  <TableRow key={zone.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <MapPinIcon className="h-4 w-4 text-primary" />
                        {zone.name}
                      </div>
                    </TableCell>
                    <TableCell>{zone.description || "-"}</TableCell>
                    <TableCell>
                      {zone.estimatedDeliveryTime ? (
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          {zone.estimatedDeliveryTime} minutos
                        </div>
                      ) : "-"}
                    </TableCell>
                    <TableCell>
                      {zone.active ? (
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
                          onClick={() => handleEdit(zone)}
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
                                Esta acción no se puede deshacer. La zona {zone.name} será eliminada permanentemente.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => handleDelete(zone.id)}
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
                  <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                    No hay zonas de entrega registradas
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
            <DialogTitle>Editar Zona de Entrega</DialogTitle>
            <DialogDescription>
              Actualiza la información de la zona
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
                      <Input placeholder="Nombre de la zona" {...field} />
                    </FormControl>
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
                        placeholder="Descripción o detalles de la zona" 
                        className="resize-none" 
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
                name="estimatedDeliveryTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tiempo Estimado de Entrega (minutos)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="Ej: 30" 
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
                  disabled={updateZoneMutation.isPending}
                >
                  {updateZoneMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Actualizar Zona
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}