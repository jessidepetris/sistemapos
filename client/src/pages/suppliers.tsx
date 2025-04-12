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
import { insertSupplierSchema } from "@shared/schema";
import { Loader2, Plus, Search, Truck } from "lucide-react";

const supplierFormSchema = insertSupplierSchema.extend({});

type SupplierFormValues = z.infer<typeof supplierFormSchema>;

export default function SuppliersPage() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingSupplier, setEditingSupplier] = useState<number | null>(null);

  // Get suppliers
  const { data: suppliers, isLoading } = useQuery({
    queryKey: ["/api/suppliers"],
    retry: false,
  });

  // Form definition
  const form = useForm<SupplierFormValues>({
    resolver: zodResolver(supplierFormSchema),
    defaultValues: {
      name: "",
      contactName: "",
      phone: "",
      email: "",
      address: "",
      notes: "",
    },
  });

  // Create supplier mutation
  const createSupplierMutation = useMutation({
    mutationFn: async (data: SupplierFormValues) => {
      const res = await apiRequest("POST", "/api/suppliers", data);
      return await res.json();
    },
    onSuccess: () => {
      toast({ title: "Proveedor creado correctamente" });
      form.reset();
      setIsDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/suppliers"] });
    },
    onError: (error) => {
      toast({
        title: "Error al crear el proveedor",
        description: (error as Error).message,
        variant: "destructive",
      });
    }
  });

  // Update supplier mutation
  const updateSupplierMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: SupplierFormValues }) => {
      const res = await apiRequest("PUT", `/api/suppliers/${id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      toast({ title: "Proveedor actualizado correctamente" });
      form.reset();
      setIsDialogOpen(false);
      setEditingSupplier(null);
      queryClient.invalidateQueries({ queryKey: ["/api/suppliers"] });
    },
    onError: (error) => {
      toast({
        title: "Error al actualizar el proveedor",
        description: (error as Error).message,
        variant: "destructive",
      });
    }
  });

  // Delete supplier mutation
  const deleteSupplierMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/suppliers/${id}`);
      return await res.json();
    },
    onSuccess: () => {
      toast({ title: "Proveedor eliminado correctamente" });
      queryClient.invalidateQueries({ queryKey: ["/api/suppliers"] });
    },
    onError: (error) => {
      toast({
        title: "Error al eliminar el proveedor",
        description: (error as Error).message,
        variant: "destructive",
      });
    }
  });

  // Filtered suppliers based on search
  const filteredSuppliers = searchQuery
    ? suppliers?.filter((supplier: any) =>
        supplier.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (supplier.contactName && supplier.contactName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (supplier.phone && supplier.phone.includes(searchQuery)) ||
        (supplier.email && supplier.email.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : suppliers;

  // Form submission handler
  const onSubmit = (data: SupplierFormValues) => {
    if (editingSupplier) {
      updateSupplierMutation.mutate({ id: editingSupplier, data });
    } else {
      createSupplierMutation.mutate(data);
    }
  };

  // Edit supplier handler
  const handleEditSupplier = (supplier: any) => {
    setEditingSupplier(supplier.id);
    form.reset({
      name: supplier.name,
      contactName: supplier.contactName || "",
      phone: supplier.phone || "",
      email: supplier.email || "",
      address: supplier.address || "",
      notes: supplier.notes || "",
    });
    setIsDialogOpen(true);
  };

  // New supplier handler
  const handleNewSupplier = () => {
    setEditingSupplier(null);
    form.reset({
      name: "",
      contactName: "",
      phone: "",
      email: "",
      address: "",
      notes: "",
    });
    setIsDialogOpen(true);
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title="Proveedores" />
        
        <main className="flex-1 overflow-auto p-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={18} />
              <Input
                placeholder="Buscar proveedores..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 w-full"
              />
            </div>
            
            <Button onClick={handleNewSupplier} className="w-full md:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Proveedor
            </Button>
          </div>
          
          <Card>
            <CardHeader className="px-6 py-4">
              <CardTitle>Lista de Proveedores</CardTitle>
            </CardHeader>
            
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Contacto</TableHead>
                      <TableHead>Teléfono</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Dirección</TableHead>
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
                    ) : filteredSuppliers && filteredSuppliers.length > 0 ? (
                      filteredSuppliers.map((supplier: any) => (
                        <TableRow key={supplier.id}>
                          <TableCell className="font-medium">{supplier.name}</TableCell>
                          <TableCell>{supplier.contactName || "-"}</TableCell>
                          <TableCell>{supplier.phone || "-"}</TableCell>
                          <TableCell>{supplier.email || "-"}</TableCell>
                          <TableCell className="max-w-xs truncate">{supplier.address || "-"}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              onClick={() => handleEditSupplier(supplier)}
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
                            <Truck className="h-12 w-12 text-muted-foreground mb-4" />
                            <h3 className="text-lg font-medium mb-2">
                              {searchQuery ? "No se encontraron proveedores" : "No hay proveedores registrados"}
                            </h3>
                            <p className="text-muted-foreground mb-4">
                              {searchQuery
                                ? `No hay resultados para "${searchQuery}"`
                                : "Comience agregando un nuevo proveedor"
                              }
                            </p>
                            {!searchQuery && (
                              <Button onClick={handleNewSupplier}>
                                <Plus className="mr-2 h-4 w-4" />
                                Nuevo Proveedor
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
      
      {/* Create/Edit Supplier Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingSupplier ? "Editar Proveedor" : "Nuevo Proveedor"}
            </DialogTitle>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre del Proveedor</FormLabel>
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
                  name="contactName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre de Contacto</FormLabel>
                      <FormControl>
                        <Input placeholder="Nombre del contacto" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
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
              </div>
              
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
                  disabled={createSupplierMutation.isPending || updateSupplierMutation.isPending}
                >
                  {(createSupplierMutation.isPending || updateSupplierMutation.isPending) 
                    ? "Guardando..." 
                    : editingSupplier ? "Actualizar" : "Crear Proveedor"
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
