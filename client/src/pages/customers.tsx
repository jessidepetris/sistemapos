import React, { useState, useEffect } from "react";
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
  DialogTitle
} from "@/components/ui/dialog";
import {
  Form, FormControl, FormField,
  FormItem, FormLabel, FormMessage
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertCustomerSchema } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Plus, Search, Users } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { provincias, localidadesPorProvincia } from "@/lib/argentina-data";

const customerFormSchema = insertCustomerSchema.extend({});

type CustomerFormValues = z.infer<typeof customerFormSchema>;

export default function CustomersPage() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingCustomer, setEditingCustomer] = useState<number | null>(null);
  const [selectedProvinciaId, setSelectedProvinciaId] = useState<string | null>(null);
  const [availableLocalidades, setAvailableLocalidades] = useState<{ id: string, nombre: string }[]>([]);

  // Get customers
  const { data: customers, isLoading } = useQuery({
    queryKey: ["/api/customers"],
    retry: false,
  });
  
  // Get users for seller selection
  const { data: users } = useQuery({
    queryKey: ["/api/users"],
    retry: false,
  });
  
  // Update localidades when provincia changes
  useEffect(() => {
    if (selectedProvinciaId) {
      const localidades = localidadesPorProvincia[selectedProvinciaId] || [];
      setAvailableLocalidades(localidades);
    } else {
      setAvailableLocalidades([]);
    }
  }, [selectedProvinciaId]);

  // Form definition
  const form = useForm<CustomerFormValues>({
    resolver: zodResolver(customerFormSchema),
    defaultValues: {
      name: "",
      phone: "",
      email: "",
      address: "",
      city: "",
      province: "",
      notes: "",
      hasAccount: false,
      sellerId: 0,
      invoiceType: "remito",
    },
  });

  // Create customer mutation
  const createCustomerMutation = useMutation({
    mutationFn: async (data: CustomerFormValues) => {
      const res = await apiRequest("POST", "/api/customers", data);
      return await res.json();
    },
    onSuccess: () => {
      toast({ title: "Cliente creado correctamente" });
      form.reset();
      setIsDialogOpen(false);
      reactQueryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      reactQueryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
    },
    onError: (error) => {
      toast({
        title: "Error al crear el cliente",
        description: (error as Error).message,
        variant: "destructive",
      });
    }
  });

  // Update customer mutation
  const updateCustomerMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: CustomerFormValues }) => {
      const res = await apiRequest("PUT", `/api/customers/${id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      toast({ title: "Cliente actualizado correctamente" });
      form.reset();
      setIsDialogOpen(false);
      setEditingCustomer(null);
      reactQueryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      reactQueryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
    },
    onError: (error) => {
      toast({
        title: "Error al actualizar el cliente",
        description: (error as Error).message,
        variant: "destructive",
      });
    }
  });

  // Delete customer mutation
  const deleteCustomerMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/customers/${id}`);
      return await res.json();
    },
    onSuccess: () => {
      toast({ title: "Cliente eliminado correctamente" });
      reactQueryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      reactQueryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
    },
    onError: (error) => {
      toast({
        title: "Error al eliminar el cliente",
        description: (error as Error).message,
        variant: "destructive",
      });
    }
  });

  // Filtered customers based on search
  const filteredCustomers = searchQuery
    ? customers?.filter((customer: any) =>
        customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (customer.phone && customer.phone.includes(searchQuery)) ||
        (customer.email && customer.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (customer.address && customer.address.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (customer.city && customer.city.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (customer.province && customer.province.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : customers;

  // Form submission handler
  const onSubmit = (data: CustomerFormValues) => {
    if (editingCustomer) {
      updateCustomerMutation.mutate({ id: editingCustomer, data });
    } else {
      createCustomerMutation.mutate(data);
    }
  };

  // Edit customer handler
  const handleEditCustomer = (customer: any) => {
    setEditingCustomer(customer.id);
    
    // Buscar el ID de la provincia basado en el nombre
    const provinciaId = provincias.find(p => p.nombre === customer.province)?.id || null;
    setSelectedProvinciaId(provinciaId);
    
    // Si tenemos la provincia, cargamos sus localidades
    if (provinciaId) {
      setAvailableLocalidades(localidadesPorProvincia[provinciaId] || []);
    }
    
    form.reset({
      name: customer.name,
      phone: customer.phone || "",
      email: customer.email || "",
      address: customer.address || "",
      city: customer.city || "",
      province: customer.province || "",
      notes: customer.notes || "",
      hasAccount: customer.hasAccount || false,
      sellerId: customer.sellerId || 0,
      invoiceType: customer.invoiceType || "remito",
    });
    
    setIsDialogOpen(true);
  };

  // New customer handler
  const handleNewCustomer = () => {
    setEditingCustomer(null);
    setSelectedProvinciaId(null);
    setAvailableLocalidades([]);
    
    form.reset({
      name: "",
      phone: "",
      email: "",
      address: "",
      city: "",
      province: "",
      notes: "",
      hasAccount: false,
      sellerId: 0,
      invoiceType: "remito",
    });
    
    setIsDialogOpen(true);
  };

  // Get seller name from ID
  const getSellerName = (sellerId: number) => {
    if (!users) return "-";
    const seller = users.find((user: any) => user.id === sellerId);
    return seller ? seller.fullName : "-";
  };

  const reactQueryClient = useQueryClient();

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title="Clientes" />
        
        <main className="flex-1 overflow-auto p-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={18} />
              <Input
                placeholder="Buscar clientes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 w-full"
              />
            </div>
            
            <Button onClick={handleNewCustomer} className="w-full md:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Cliente
            </Button>
          </div>
          
          <Card>
            <CardHeader className="px-6 py-4">
              <CardTitle>Lista de Clientes</CardTitle>
            </CardHeader>
            
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>N°</TableHead>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Teléfono</TableHead>
                      <TableHead>Dirección</TableHead>
                      <TableHead>Localidad</TableHead>
                      <TableHead>Provincia</TableHead>
                      <TableHead>Cuenta</TableHead>
                      <TableHead>Vendedor</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center">
                          <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                        </TableCell>
                      </TableRow>
                    ) : filteredCustomers && filteredCustomers.length > 0 ? (
                      filteredCustomers.map((customer: any) => (
                        <TableRow key={customer.id}>
                          <TableCell className="font-mono">{customer.id}</TableCell>
                          <TableCell className="font-medium">{customer.name}</TableCell>
                          <TableCell>{customer.phone || "-"}</TableCell>
                          <TableCell>{customer.address || "-"}</TableCell>
                          <TableCell>{customer.city || "-"}</TableCell>
                          <TableCell>{customer.province || "-"}</TableCell>
                          <TableCell>
                            {customer.hasAccount ? (
                              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                Cuenta Corriente
                              </Badge>
                            ) : "-"}
                          </TableCell>
                          <TableCell>{customer.sellerId ? getSellerName(customer.sellerId) : "-"}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              onClick={() => handleEditCustomer(customer)}
                            >
                              Editar
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center py-10">
                          <div className="flex flex-col items-center justify-center text-center">
                            <Users className="h-12 w-12 text-muted-foreground mb-4" />
                            <h3 className="text-lg font-medium mb-2">
                              {searchQuery ? "No se encontraron clientes" : "No hay clientes registrados"}
                            </h3>
                            <p className="text-muted-foreground mb-4">
                              {searchQuery
                                ? `No hay resultados para "${searchQuery}"`
                                : "Comience agregando un nuevo cliente"
                              }
                            </p>
                            {!searchQuery && (
                              <Button onClick={handleNewCustomer}>
                                <Plus className="mr-2 h-4 w-4" />
                                Nuevo Cliente
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
      
      {/* Create/Edit Customer Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {editingCustomer ? "Editar Cliente" : "Nuevo Cliente"}
            </DialogTitle>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre del Cliente</FormLabel>
                    <FormControl>
                      <Input placeholder="Ingrese nombre" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Teléfono</FormLabel>
                      <FormControl>
                        <Input placeholder="Número de teléfono" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input placeholder="Correo electrónico" type="email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dirección</FormLabel>
                    <FormControl>
                      <Input placeholder="Dirección" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="province"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Provincia</FormLabel>
                      <Select 
                        onValueChange={(value) => {
                          field.onChange(value ? provincias.find(p => p.id === value)?.nombre || "" : "");
                          setSelectedProvinciaId(value);
                        }}
                        value={provincias.find(p => p.nombre === field.value)?.id || ""}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccione provincia" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {provincias.map((provincia) => (
                            <SelectItem key={provincia.id} value={provincia.id}>
                              {provincia.nombre}
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
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Localidad</FormLabel>
                      <Select 
                        onValueChange={(value) => {
                          field.onChange(value ? availableLocalidades.find(l => l.id === value)?.nombre || "" : "");
                        }}
                        value={availableLocalidades.find(l => l.nombre === field.value)?.id || ""}
                        disabled={!selectedProvinciaId || availableLocalidades.length === 0}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccione localidad" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {availableLocalidades.map((localidad) => (
                            <SelectItem key={localidad.id} value={localidad.id}>
                              {localidad.nombre}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="sellerId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Vendedor</FormLabel>
                      <Select 
                        onValueChange={(value) => field.onChange(value ? parseInt(value) : undefined)}
                        value={field.value?.toString()}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccione un vendedor" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="0">Sin vendedor asignado</SelectItem>
                          {users?.map((user: any) => (
                            <SelectItem key={user.id} value={user.id.toString()}>
                              {user.fullName}
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
                  name="invoiceType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de Facturación</FormLabel>
                      <Select 
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Tipo de facturación" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="remito">Remito</SelectItem>
                          <SelectItem value="factura_c">Factura C</SelectItem>
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
                    <FormLabel>Notas</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Notas o comentarios adicionales" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="hasAccount"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Cuenta Corriente</FormLabel>
                      <p className="text-sm text-muted-foreground">
                        Habilitar cuenta corriente para este cliente
                      </p>
                    </div>
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
                  disabled={createCustomerMutation.isPending || updateCustomerMutation.isPending}
                >
                  {(createCustomerMutation.isPending || updateCustomerMutation.isPending) 
                    ? "Guardando..." 
                    : editingCustomer ? "Actualizar" : "Crear Cliente"
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
