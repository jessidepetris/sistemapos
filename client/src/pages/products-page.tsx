import { useState } from "react";
import { DashboardLayout } from "@/layouts/dashboard-layout";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Product, Category, Supplier, insertProductSchema } from "@shared/schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
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
  DialogTrigger,
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
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
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
import {
  Package,
  Plus,
  Edit,
  Trash2,
  Search,
  Filter,
  RefreshCcw,
  Barcode,
  Snowflake,
  Weight,
} from "lucide-react";

// Extend the insertProductSchema with client-side validation
const productFormSchema = insertProductSchema.extend({
  // Make barcodes a string for form input, will be parsed later
  barcodes: z.string().optional(),
  // Add a UI-only field for more elegant conversion factor handling
  hasConversion: z.boolean().optional(),
}).omit({ barcodes: true }).merge(
  z.object({
    barcodesString: z.string().optional(),
  })
);

type ProductFormValues = z.infer<typeof productFormSchema>;

export default function ProductsPage() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isUpdateMode, setIsUpdateMode] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<Product | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState<number | "all">("all");
  const [isUpdatePriceDialogOpen, setIsUpdatePriceDialogOpen] = useState(false);
  const [priceUpdateData, setPriceUpdateData] = useState({
    supplierId: 0,
    percentage: 0,
  });

  // Fetch products
  const { data: products, isLoading } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  // Fetch categories
  const { data: categories } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  // Fetch suppliers
  const { data: suppliers } = useQuery<Supplier[]>({
    queryKey: ["/api/suppliers"],
  });

  // Create product mutation
  const createProductMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/products", data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Producto creado",
        description: "El producto ha sido creado exitosamente",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      setIsDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Error al crear el producto: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Update product mutation
  const updateProductMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const res = await apiRequest("PUT", `/api/products/${id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Producto actualizado",
        description: "El producto ha sido actualizado exitosamente",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      setIsDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Error al actualizar el producto: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Delete product mutation
  const deleteProductMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/products/${id}`);
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Error al eliminar el producto");
      }
      return true;
    },
    onSuccess: () => {
      toast({
        title: "Producto eliminado",
        description: "El producto ha sido eliminado exitosamente",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Error al eliminar el producto: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Mass price update mutation
  const updatePricesMutation = useMutation({
    mutationFn: async (data: { supplierId: number; percentage: number }) => {
      const res = await apiRequest("POST", "/api/products/update-prices", data);
      return await res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Precios actualizados",
        description: data.message,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      setIsUpdatePriceDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Error al actualizar precios: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Setup form with react-hook-form
  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: "",
      description: "",
      sku: "",
      price: "",
      cost: "",
      stock: "0",
      minStock: "0",
      unit: "unidad",
      isRefrigerated: false,
      isBulk: false,
      barcodesString: "",
      hasConversion: false,
      conversionFactor: "",
      secondaryUnit: "",
    },
  });

  // Filter products based on search query and category
  const filteredProducts = products?.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      filterCategory === "all" || product.categoryId === filterCategory;

    return matchesSearch && matchesCategory;
  });

  // Open dialog to add new product
  const openNewProductDialog = () => {
    setIsUpdateMode(false);
    setCurrentProduct(null);
    form.reset({
      name: "",
      description: "",
      sku: "",
      price: "",
      cost: "",
      stock: "0",
      minStock: "0",
      unit: "unidad",
      isRefrigerated: false,
      isBulk: false,
      barcodesString: "",
      hasConversion: false,
      conversionFactor: "",
      secondaryUnit: "",
    });
    setIsDialogOpen(true);
  };

  // Open dialog to edit product
  const openEditProductDialog = (product: Product) => {
    setIsUpdateMode(true);
    setCurrentProduct(product);
    form.reset({
      name: product.name,
      description: product.description || "",
      sku: product.sku,
      price: product.price.toString(),
      cost: product.cost?.toString() || "",
      stock: product.stock.toString(),
      minStock: product.minStock?.toString() || "0",
      unit: product.unit,
      isRefrigerated: product.isRefrigerated,
      isBulk: product.isBulk,
      barcodesString: product.barcodes ? product.barcodes.join(", ") : "",
      hasConversion: !!product.conversionFactor,
      conversionFactor: product.conversionFactor?.toString() || "",
      secondaryUnit: product.secondaryUnit || "",
      categoryId: product.categoryId,
      supplierId: product.supplierId,
    });
    setIsDialogOpen(true);
  };

  // Handle form submission
  const onSubmit = (data: ProductFormValues) => {
    // Convert barcodesString to array
    const barcodes = data.barcodesString
      ? data.barcodesString.split(",").map((b) => b.trim())
      : [];

    // Prepare data for API
    const apiData = {
      ...data,
      barcodes,
    };

    // Remove UI-only field
    delete apiData.hasConversion;
    delete apiData.barcodesString;

    // Clear conversionFactor and secondaryUnit if hasConversion is false
    if (!form.getValues("hasConversion")) {
      apiData.conversionFactor = undefined;
      apiData.secondaryUnit = undefined;
    }

    if (isUpdateMode && currentProduct) {
      updateProductMutation.mutate({
        id: currentProduct.id,
        data: apiData,
      });
    } else {
      createProductMutation.mutate(apiData);
    }
  };

  // Handle mass price update
  const handlePriceUpdate = () => {
    updatePricesMutation.mutate(priceUpdateData);
  };

  return (
    <DashboardLayout title="Productos" description="Gestión de productos">
      <div className="mb-6 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-neutral-500" />
            <Input
              placeholder="Buscar productos..."
              className="pl-9 w-[300px]"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <Select
            value={filterCategory.toString()}
            onValueChange={(value) =>
              setFilterCategory(value === "all" ? "all" : parseInt(value))
            }
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filtrar por categoría" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las categorías</SelectItem>
              {categories?.map((category) => (
                <SelectItem key={category.id} value={category.id.toString()}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex space-x-2">
          <Button
            variant="outline"
            onClick={() => setIsUpdatePriceDialogOpen(true)}
          >
            <RefreshCcw className="mr-2 h-4 w-4" />
            Actualizar Precios
          </Button>
          <Button onClick={openNewProductDialog}>
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Producto
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Lista de Productos</CardTitle>
          <CardDescription>
            Total: {filteredProducts?.length || 0} productos
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-4">Cargando productos...</div>
          ) : filteredProducts && filteredProducts.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Producto</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead className="text-right">Precio</TableHead>
                  <TableHead className="text-right">Stock</TableHead>
                  <TableHead className="text-center">Características</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell>{product.sku}</TableCell>
                    <TableCell>
                      {categories?.find((c) => c.id === product.categoryId)
                        ?.name || "-"}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      ${parseFloat(product.price.toString()).toFixed(2)}
                    </TableCell>
                    <TableCell
                      className={`text-right font-mono ${
                        parseFloat(product.stock.toString()) <
                        parseFloat(product.minStock?.toString() || "0")
                          ? "text-red-600 font-semibold"
                          : ""
                      }`}
                    >
                      {parseFloat(product.stock.toString()).toFixed(2)}{" "}
                      {product.unit}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex justify-center space-x-1">
                        {product.isRefrigerated && (
                          <Badge
                            variant="secondary"
                            className="bg-blue-100 text-blue-800"
                          >
                            <Snowflake className="h-3 w-3 mr-1" />
                            Refrigerado
                          </Badge>
                        )}
                        {product.isBulk && (
                          <Badge
                            variant="secondary"
                            className="bg-green-100 text-green-800"
                          >
                            <Weight className="h-3 w-3 mr-1" />
                            Granel
                          </Badge>
                        )}
                        {product.barcodes && product.barcodes.length > 0 && (
                          <Badge
                            variant="secondary"
                            className="bg-neutral-100 text-neutral-800"
                          >
                            <Barcode className="h-3 w-3 mr-1" />
                            {product.barcodes.length}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditProductDialog(product)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                ¿Eliminar producto?
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                Esta acción no se puede deshacer. ¿Está seguro de
                                eliminar el producto "{product.name}"?
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() =>
                                  deleteProductMutation.mutate(product.id)
                                }
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
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8">
              <Package className="h-12 w-12 mx-auto text-neutral-300 mb-2" />
              <h3 className="text-lg font-medium">No hay productos</h3>
              <p className="text-neutral-500 mb-4">
                No se encontraron productos con los filtros actuales
              </p>
              <Button onClick={openNewProductDialog}>
                <Plus className="mr-2 h-4 w-4" />
                Agregar Producto
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Product Form Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isUpdateMode ? "Editar Producto" : "Nuevo Producto"}
            </DialogTitle>
            <DialogDescription>
              {isUpdateMode
                ? "Actualice los datos del producto"
                : "Complete los datos para crear un nuevo producto"}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-6 py-4"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre del Producto</FormLabel>
                      <FormControl>
                        <Input placeholder="Nombre" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="sku"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>SKU</FormLabel>
                      <FormControl>
                        <Input placeholder="SKU" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descripción</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Descripción del producto"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Precio de Venta</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="Precio"
                          {...field}
                        />
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
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="Costo"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="stock"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Stock Actual</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.001"
                          placeholder="Stock"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="minStock"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Stock Mínimo</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.001"
                          placeholder="Stock Mínimo"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="unit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Unidad</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccione una unidad" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="unidad">Unidad</SelectItem>
                          <SelectItem value="kg">Kilogramo</SelectItem>
                          <SelectItem value="g">Gramo</SelectItem>
                          <SelectItem value="l">Litro</SelectItem>
                          <SelectItem value="ml">Mililitro</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="categoryId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Categoría</FormLabel>
                      <Select
                        onValueChange={(value) => field.onChange(parseInt(value))}
                        defaultValue={
                          field.value ? field.value.toString() : undefined
                        }
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccione una categoría" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categories?.map((category) => (
                            <SelectItem
                              key={category.id}
                              value={category.id.toString()}
                            >
                              {category.name}
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
                name="supplierId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Proveedor</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(parseInt(value))}
                      defaultValue={
                        field.value ? field.value.toString() : undefined
                      }
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

              <FormField
                control={form.control}
                name="barcodesString"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Códigos de Barras</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Códigos de barras separados por coma"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Ingrese los códigos de barras separados por coma
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="isRefrigerated"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Refrigerado</FormLabel>
                        <FormDescription>
                          Marque si el producto requiere refrigeración
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="isBulk"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">A Granel</FormLabel>
                        <FormDescription>
                          Marque si el producto se vende a granel
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="hasConversion"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">
                        Conversión de Unidades
                      </FormLabel>
                      <FormDescription>
                        Habilite si el producto requiere conversión entre
                        unidades
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              {form.watch("hasConversion") && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="conversionFactor"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Factor de Conversión</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.001"
                            placeholder="Factor"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Ej: 0.001 para convertir de g a kg
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="secondaryUnit"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Unidad Secundaria</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccione una unidad" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="unidad">Unidad</SelectItem>
                            <SelectItem value="kg">Kilogramo</SelectItem>
                            <SelectItem value="g">Gramo</SelectItem>
                            <SelectItem value="l">Litro</SelectItem>
                            <SelectItem value="ml">Mililitro</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit">
                  {isUpdateMode ? "Actualizar" : "Crear"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Price Update Dialog */}
      <Dialog
        open={isUpdatePriceDialogOpen}
        onOpenChange={setIsUpdatePriceDialogOpen}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Actualización Masiva de Precios</DialogTitle>
            <DialogDescription>
              Actualice los precios de los productos por proveedor
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Proveedor</label>
              <Select
                onValueChange={(value) =>
                  setPriceUpdateData({
                    ...priceUpdateData,
                    supplierId: parseInt(value),
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione un proveedor" />
                </SelectTrigger>
                <SelectContent>
                  {suppliers?.map((supplier) => (
                    <SelectItem key={supplier.id} value={supplier.id.toString()}>
                      {supplier.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                Porcentaje de Aumento/Descuento
              </label>
              <div className="flex items-center">
                <Input
                  type="number"
                  step="0.1"
                  placeholder="Porcentaje"
                  value={priceUpdateData.percentage}
                  onChange={(e) =>
                    setPriceUpdateData({
                      ...priceUpdateData,
                      percentage: parseFloat(e.target.value),
                    })
                  }
                />
                <span className="ml-2">%</span>
              </div>
              <p className="text-xs text-neutral-500">
                Use valores positivos para aumentos y negativos para descuentos
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsUpdatePriceDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              onClick={handlePriceUpdate}
              disabled={!priceUpdateData.supplierId || updatePricesMutation.isPending}
            >
              {updatePricesMutation.isPending
                ? "Actualizando..."
                : "Actualizar Precios"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
