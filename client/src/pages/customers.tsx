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

const customerFormSchema = insertCustomerSchema.extend({});

type CustomerFormValues = z.infer<typeof customerFormSchema>;

export default function CustomersPage() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingCustomer, setEditingCustomer] = useState<number | null>(null);

  // Get customers
  const { data: customers, isLoading } = useQuery({
    queryKey: ["/api/customers"],
    retry: false,
  });

  // Form definition
  const form = useForm<CustomerFormValues>({
    resolver: zodResolver(customerFormSchema),
    defaultValues: {
      name: "",
      phone: "",
      email: "",
      address: "",
      notes: "",
      hasAccount: false,
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
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
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
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
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
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
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
        (customer.address && customer.address.toLowerCase().includes(searchQuery.toLowerCase()))
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
    form.reset({
      name: customer.name,
      phone: customer.phone || "",
      email: customer.email || "",
      address: customer.address || "",
      notes: customer.notes || "",
      hasAccount: customer.hasAccount || false,
    });
    setIsDialogOpen(true);
  };

  // New customer handler
  const handleNewCustomer = () => {
    setEditingCustomer(null);
    form.reset({
      name: "",
      phone: "",
      email: "",
      address: "",
      notes: "",
      hasAccount: false,
    });
    setIsDialogOpen(true);
  };

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
                      <TableHead>Nombre</TableHead>
                      <TableHead>Teléfono</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Dirección</TableHead>
                      <TableHead>Cuenta</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center">
                          <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                        </TableCell>
                      </TableRow>
                    ) : filteredCustomers && filteredCustomers.length > 0 ? (
                      filteredCustomers.map((customer: any) => (
                        <TableRow key={customer.id}>
                          <TableCell className="font-medium">{customer.name}</TableCell>
                          <TableCell>{customer.phone || "-"}</TableCell>
                          <TableCell>{customer.email || "-"}</TableCell>
                          <TableCell className="max-w-xs truncate">{customer.address || "-"}</TableCell>
                          <TableCell>
                            {customer.hasAccount ? (
                              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                Cuenta Corriente
                              </Badge>
                            ) : "-"}
                          </TableCell>
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
                        <TableCell colSpan={6} className="text-center py-10">
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
        <DialogContent>
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
