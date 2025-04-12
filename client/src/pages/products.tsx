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
  DialogTitle, DialogTrigger 
} from "@/components/ui/dialog";
import { 
  Form, FormControl, FormDescription, FormField, 
  FormItem, FormLabel, FormMessage 
} from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertProductSchema } from "@shared/schema";
import { Package, Plus, RefreshCw, Search } from "lucide-react";

const productFormSchema = insertProductSchema.extend({
  barcodes: z.string().optional().transform(val => 
    val ? val.split(',').map(b => b.trim()) : []
  ),
  price: z.coerce.number().min(0, "El precio debe ser mayor o igual a 0"),
  cost: z.coerce.number().min(0, "El costo debe ser mayor o igual a 0").optional(),
  stock: z.coerce.number().min(0, "El stock debe ser mayor o igual a 0"),
  stockAlert: z.coerce.number().min(0, "La alerta de stock debe ser mayor o igual a 0").optional(),
});

type ProductFormValues = z.infer<typeof productFormSchema>;

export default function ProductsPage() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingProductId, setEditingProductId] = useState<number | null>(null);
  
  // Get products
  const { data: products, isLoading } = useQuery({
    queryKey: ["/api/products"],
    retry: false,
  });
  
  // Get suppliers for select dropdown
  const { data: suppliers } = useQuery({
    queryKey: ["/api/suppliers"],
    retry: false,
  });
  
  // Form definition
  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: "",
      description: "",
      baseUnit: "unidad",
      barcodes: "",
      price: 0,
      cost: 0,
      stock: 0,
      stockAlert: 0,
      isRefrigerated: false,
      isBulk: false,
    },
  });
  
  // Create product mutation
  const createProductMutation = useMutation({
    mutationFn: async (data: ProductFormValues) => {
      const res = await apiRequest("POST", "/api/products", data);
      return await res.json();
    },
    onSuccess: () => {
      toast({ title: "Producto creado correctamente" });
      form.reset();
      setIsDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
    },
    onError: (error) => {
      toast({
        title: "Error al crear el producto",
        description: (error as Error).message,
        variant: "destructive",
      });
    }
  });
  
  // Update product mutation
  const updateProductMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: ProductFormValues }) => {
      const res = await apiRequest("PUT", `/api/products/${id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      toast({ title: "Producto actualizado correctamente" });
      form.reset();
      setIsDialogOpen(false);
      setEditingProductId(null);
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
    },
    onError: (error) => {
      toast({
        title: "Error al actualizar el producto",
        description: (error as Error).message,
        variant: "destructive",
      });
    }
  });
  
  // Delete product mutation
  const deleteProductMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/products/${id}`);
      return await res.json();
    },
    onSuccess: () => {
      toast({ title: "Producto eliminado correctamente" });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
    },
    onError: (error) => {
      toast({
        title: "Error al eliminar el producto",
        description: (error as Error).message,
        variant: "destructive",
      });
    }
  });
  
  // Filtered products based on search
  const filteredProducts = searchQuery
    ? products?.filter((product: any) =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (product.description && product.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (product.barcodes && product.barcodes.some((barcode: string) => barcode.includes(searchQuery)))
      )
    : products;
  
  // Form submission handler
  const onSubmit = (data: ProductFormValues) => {
    if (editingProductId) {
      updateProductMutation.mutate({ id: editingProductId, data });
    } else {
      createProductMutation.mutate(data);
    }
  };
  
  // Edit product handler
  const handleEditProduct = (product: any) => {
    setEditingProductId(product.id);
    
    // Format data for form
    form.reset({
      name: product.name,
      description: product.description || "",
      baseUnit: product.baseUnit,
      barcodes: product.barcodes ? product.barcodes.join(", ") : "",
      price: parseFloat(product.price),
      cost: product.cost ? parseFloat(product.cost) : 0,
      stock: parseFloat(product.stock),
      stockAlert: product.stockAlert ? parseFloat(product.stockAlert) : 0,
      supplierId: product.supplierId,
      isRefrigerated: product.isRefrigerated,
      isBulk: product.isBulk,
      conversionRates: product.conversionRates,
    });
    
    setIsDialogOpen(true);
  };
  
  // Open dialog for new product
  const handleNewProduct = () => {
    setEditingProductId(null);
    form.reset({
      name: "",
      description: "",
      baseUnit: "unidad",
      barcodes: "",
      price: 0,
      cost: 0,
      stock: 0,
      stockAlert: 0,
      isRefrigerated: false,
      isBulk: false,
    });
    setIsDialogOpen(true);
  };
  
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title="Productos" />
        
        <main className="flex-1 overflow-auto p-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={18} />
              <Input
                placeholder="Buscar productos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 w-full"
              />
            </div>
            
            <div className="flex items-center gap-2 w-full md:w-auto">
              <Button variant="outline" className="w-full md:w-auto">
                <RefreshCw className="mr-2 h-4 w-4" />
                Actualizar Precios
              </Button>
              <Button onClick={handleNewProduct} className="w-full md:w-auto">
                <Plus className="mr-2 h-4 w-4" />
                Nuevo Producto
              </Button>
            </div>
          </div>
          
          <Card>
            <CardHeader className="px-6 py-4">
              <CardTitle>Catálogo de Productos</CardTitle>
            </CardHeader>
            
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Precio</TableHead>
                      <TableHead>Stock</TableHead>
                      <TableHead>Unidad</TableHead>
                      <TableHead>Proveedor</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center">
                          Cargando productos...
                        </TableCell>
                      </TableRow>
                    ) : filteredProducts && filteredProducts.length > 0 ? (
                      filteredProducts.map((product: any) => (
                        <TableRow key={product.id}>
                          <TableCell className="font-medium">{product.name}</TableCell>
                          <TableCell>${parseFloat(product.price).toFixed(2)}</TableCell>
                          <TableCell>{parseFloat(product.stock)}</TableCell>
                          <TableCell>{product.baseUnit}</TableCell>
                          <TableCell>
                            {product.supplier ? product.supplier.name : '-'}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {product.isRefrigerated && (
                                <Badge variant="secondary">Refrigerado</Badge>
                              )}
                              {product.isBulk && (
                                <Badge variant="outline">A granel</Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              onClick={() => handleEditProduct(product)}
                            >
                              Editar
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-10">
                          <div className="flex flex-col items-center justify-center text-center">
                            <Package className="h-12 w-12 text-muted-foreground mb-4" />
                            <h3 className="text-lg font-medium mb-2">
                              {searchQuery ? "No se encontraron productos" : "No hay productos registrados"}
                            </h3>
                            <p className="text-muted-foreground mb-4">
                              {searchQuery
                                ? `No hay resultados para "${searchQuery}"`
                                : "Comience agregando un nuevo producto"
                              }
                            </p>
                            {!searchQuery && (
                              <Button onClick={handleNewProduct}>
                                <Plus className="mr-2 h-4 w-4" />
                                Nuevo Producto
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
      
      {/* Create/Edit Product Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              {editingProductId ? "Editar Producto" : "Nuevo Producto"}
            </DialogTitle>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-6">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nombre del Producto</FormLabel>
                        <FormControl>
                          <Input placeholder="Ingrese nombre" {...field} />
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
                          <Textarea placeholder="Descripción del producto" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="barcodes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Códigos de Barras</FormLabel>
                        <FormControl>
                          <Input placeholder="Separados por comas" {...field} />
                        </FormControl>
                        <FormDescription>
                          Ingrese múltiples códigos separados por comas
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="supplierId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Proveedor</FormLabel>
                        <Select 
                          value={field.value?.toString()} 
                          onValueChange={(value) => field.onChange(value ? parseInt(value) : undefined)}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccionar proveedor" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="">Sin proveedor</SelectItem>
                            {suppliers?.map((supplier: any) => (
                              <SelectItem key={supplier.id} value={supplier.id.toString()}>
                                {supplier.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="price"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Precio de Venta</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.01" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="cost"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Costo</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.01" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="stock"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Stock Actual</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.01" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="stockAlert"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Alerta de Stock</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.01" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="baseUnit"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Unidad Base</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Seleccionar unidad" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="unidad">Unidad</SelectItem>
                              <SelectItem value="kg">Kilogramo</SelectItem>
                              <SelectItem value="g">Gramo</SelectItem>
                              <SelectItem value="l">Litro</SelectItem>
                              <SelectItem value="ml">Mililitro</SelectItem>
                              <SelectItem value="caja">Caja</SelectItem>
                              <SelectItem value="paquete">Paquete</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="flex flex-col space-y-4 mt-4">
                    <FormField
                      control={form.control}
                      name="isRefrigerated"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Producto Refrigerado</FormLabel>
                            <FormDescription>
                              Requiere almacenamiento en frío
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="isBulk"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Producto a Granel</FormLabel>
                            <FormDescription>
                              Se vende por peso o volumen
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </div>
              
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
                  disabled={createProductMutation.isPending || updateProductMutation.isPending}
                >
                  {(createProductMutation.isPending || updateProductMutation.isPending) 
                    ? "Guardando..." 
                    : editingProductId ? "Actualizar" : "Crear Producto"
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
