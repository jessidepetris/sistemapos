import React, { useState, useEffect } from "react";
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertProductSchema } from "@shared/schema";
import { Package, Plus, RefreshCw, Search, X, BarChart, Thermometer, Scale, Calculator } from "lucide-react";

// Define a schema for unit conversions
const conversionRateSchema = z.object({
  unit: z.string(),
  factor: z.coerce.number().positive("El factor debe ser mayor que 0"),
});

// Define schema for component products
const componentSchema = z.object({
  productId: z.number(),
  quantity: z.coerce.number().positive("La cantidad debe ser mayor que 0"),
  unit: z.string(),
  productName: z.string().optional(), // Solo para mostrar en la UI
});

// Extend the product schema to include a better structure for conversions
const productFormSchema = insertProductSchema.extend({
  // Transform comma-separated string to array for barcodes
  barcodes: z.string().optional().transform(val => 
    val ? val.split(',').map(b => b.trim()).filter(Boolean) : []
  ),
  // Form validation for numeric fields
  price: z.coerce.number().min(0, "El precio debe ser mayor o igual a 0"),
  cost: z.coerce.number().min(0, "El costo debe ser mayor o igual a 0").optional(),
  stock: z.coerce.number().min(0, "El stock debe ser mayor o igual a 0"),
  stockAlert: z.coerce.number().min(0, "La alerta de stock debe ser mayor o igual a 0").optional(),
  
  // Nuevos campos
  category: z.string().optional(),
  imageUrl: z.string().optional(),
  supplierCode: z.string().optional(),
  
  // Campos para cálculo automático del precio
  iva: z.coerce.number().min(0).default(21),
  shipping: z.coerce.number().min(0).default(0),
  profit: z.coerce.number().min(0).default(30),
  
  // For bulk products, we need to manage conversion rates
  // This will be transformed before submission
  conversionRates: z.preprocess(
    (val) => typeof val === 'string' ? JSON.parse(val || '[]') : val,
    z.array(conversionRateSchema).optional()
  ),
  
  // Fields to add individual conversion rates via the form
  conversionUnit: z.string().optional(),
  conversionFactor: z.coerce.number().optional(),
  
  // Para productos compuestos
  components: z.array(componentSchema).optional(),
  
  // Campos para agregar un componente individual via formulario
  componentProductId: z.number().optional(),
  componentQuantity: z.coerce.number().optional(),
  componentUnit: z.string().optional(),
});

type ProductFormValues = z.infer<typeof productFormSchema>;

export default function ProductsPage() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingProductId, setEditingProductId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState("general");
  const [conversionRates, setConversionRates] = useState<Array<{unit: string, factor: number}>>([]);
  const [barcodesList, setBarcodesList] = useState<string[]>([]);
  const [componentsList, setComponentsList] = useState<Array<{
    productId: number;
    productName: string;
    quantity: string;
    unit: string;
  }>>([]);

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
  
  // Función para calcular el precio de venta basado en costo, IVA, flete y ganancia
  const calculateSellingPrice = () => {
    const cost = form.getValues("cost") || 0;
    const ivaRate = form.getValues("iva") || 0;
    const shippingRate = form.getValues("shipping") || 0;
    const profitRate = form.getValues("profit") || 0;
    
    // Cálculo del precio
    const costWithIva = cost * (1 + (ivaRate / 100));
    const costWithShipping = costWithIva * (1 + (shippingRate / 100));
    const finalPrice = costWithShipping * (1 + (profitRate / 100));
    
    // Redondeo a 2 decimales
    const roundedPrice = Math.round(finalPrice * 100) / 100;
    
    // Actualizar el formulario
    form.setValue("price", roundedPrice);
  };

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
      iva: 21,        // 21% por defecto
      shipping: 0,     // 0% por defecto
      profit: 30,      // 30% por defecto
      isRefrigerated: false,
      isBulk: false,
      isComposite: false,
      category: "",
      imageUrl: "",
      supplierCode: "",
      conversionRates: [],
      conversionUnit: "",
      conversionFactor: 0,
      components: [],
      componentProductId: undefined,
      componentQuantity: 0,
      componentUnit: "unidad",
    },
  });
  
  // Handle changes to isBulk to show/hide conversion rates fields
  const watchIsBulk = form.watch("isBulk");
  
  // Add a new conversion rate
  const addConversionRate = () => {
    const unit = form.getValues("conversionUnit");
    const factor = form.getValues("conversionFactor");
    
    if (!unit || !factor) {
      toast({
        title: "Datos incompletos",
        description: "Debe ingresar la unidad y el factor de conversión",
        variant: "destructive",
      });
      return;
    }
    
    // Check if unit already exists
    const exists = conversionRates.some(cr => cr.unit.toLowerCase() === unit.toLowerCase());
    if (exists) {
      toast({
        title: "Unidad duplicada",
        description: "Ya existe una conversión para esta unidad",
        variant: "destructive",
      });
      return;
    }
    
    // Add to conversions array
    const newConversionRates = [...conversionRates, { unit, factor }];
    setConversionRates(newConversionRates);
    
    // Update form value
    form.setValue("conversionRates", newConversionRates);
    
    // Clear input fields
    form.setValue("conversionUnit", "");
    form.setValue("conversionFactor", 0);
  };
  
  // Remove a conversion rate
  const removeConversionRate = (indexToRemove: number) => {
    const newConversionRates = conversionRates.filter((_, index) => index !== indexToRemove);
    setConversionRates(newConversionRates);
    form.setValue("conversionRates", newConversionRates);
  };
  
  // Función para agregar un componente al producto compuesto
  const addComponent = () => {
    const productId = form.getValues("componentProductId");
    const quantity = form.getValues("componentQuantity");
    const unit = form.getValues("componentUnit");
    
    if (!productId || !quantity || !unit) {
      toast({
        title: "Datos incompletos",
        description: "Debe seleccionar un producto, cantidad y unidad",
        variant: "destructive",
      });
      return;
    }
    
    // Buscar el producto en la lista de productos
    const selectedProduct = products?.find((p: any) => p.id === productId);
    if (!selectedProduct) {
      toast({
        title: "Producto no encontrado",
        description: "El producto seleccionado no existe",
        variant: "destructive",
      });
      return;
    }
    
    // Verificar que no se esté agregando el mismo producto como componente
    if (editingProductId && editingProductId === productId) {
      toast({
        title: "Operación inválida",
        description: "No puede agregar el mismo producto como componente",
        variant: "destructive",
      });
      return;
    }
    
    // Verificar que el componente no exista ya
    const exists = componentsList.some(c => c.productId === productId);
    if (exists) {
      toast({
        title: "Componente duplicado",
        description: "Este producto ya ha sido agregado como componente",
        variant: "destructive",
      });
      return;
    }
    
    // Añadir a la lista de componentes
    const newComponent = {
      productId,
      productName: selectedProduct.name,
      quantity,
      unit
    };
    const newComponentsList = [...componentsList, newComponent];
    setComponentsList(newComponentsList);
    
    // Actualizar el valor en el formulario
    form.setValue("components", newComponentsList);
    
    // Limpiar los campos
    form.setValue("componentProductId", undefined);
    form.setValue("componentQuantity", 0);
    form.setValue("componentUnit", "unidad");
  };
  
  // Remover un componente
  const removeComponent = (indexToRemove: number) => {
    const newComponentsList = componentsList.filter((_, index) => index !== indexToRemove);
    setComponentsList(newComponentsList);
    form.setValue("components", newComponentsList);
  };
  
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
    
    // Inicializar las conversiones desde el producto
    const productConversions = product.conversionRates 
      ? (typeof product.conversionRates === 'string' 
          ? JSON.parse(product.conversionRates) 
          : product.conversionRates)
      : [];
    
    setConversionRates(productConversions);
    
    // Inicializar la lista de códigos de barras
    const productBarcodes = product.barcodes || [];
    setBarcodesList(productBarcodes);
    
    // Inicializar la lista de componentes para productos compuestos
    let productComponents: any[] = [];
    if (product.isComposite && product.components) {
      const components = typeof product.components === 'string'
        ? JSON.parse(product.components)
        : product.components;
      
      productComponents = components;
      setComponentsList(components);
    }
    
    // Format data for form
    form.reset({
      name: product.name,
      description: product.description || "",
      baseUnit: product.baseUnit,
      barcodes: product.barcodes ? product.barcodes.join(", ") : "",
      price: parseFloat(product.price),
      cost: product.cost ? parseFloat(product.cost) : 0,
      iva: product.iva || 21,
      shipping: product.shipping || 0,
      profit: product.profit || 30,
      stock: parseFloat(product.stock),
      stockAlert: product.stockAlert ? parseFloat(product.stockAlert) : 0,
      supplierId: product.supplierId,
      supplierCode: product.supplierCode || "",
      category: product.category || "",
      imageUrl: product.imageUrl || "",
      isRefrigerated: product.isRefrigerated,
      isBulk: product.isBulk,
      isComposite: product.isComposite || false,
      conversionRates: productConversions,
      conversionUnit: "",
      conversionFactor: 0,
      components: productComponents,
      componentProductId: undefined,
      componentQuantity: 0,
      componentUnit: "unidad",
    });
    
    setIsDialogOpen(true);
  };
  
  // Open dialog for new product
  const handleNewProduct = () => {
    setEditingProductId(null);
    
    // Limpiar variables de estado
    setConversionRates([]);
    setBarcodesList([]);
    setComponentsList([]);
    setActiveTab("general");
    
    // Reiniciar el formulario
    form.reset({
      name: "",
      description: "",
      baseUnit: "unidad",
      barcodes: "",
      price: 0,
      cost: 0,
      stock: 0,
      stockAlert: 0,
      iva: 21,        // 21% por defecto
      shipping: 0,     // 0% por defecto
      profit: 30,      // 30% por defecto
      isRefrigerated: false,
      isBulk: false,
      isComposite: false,
      category: "",
      imageUrl: "",
      supplierCode: "",
      conversionRates: [],
      conversionUnit: "",
      conversionFactor: 0,
      components: [],
      componentProductId: undefined,
      componentQuantity: 0,
      componentUnit: "unidad",
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
                              {product.isComposite && (
                                <Badge variant="default">Combo</Badge>
                              )}
                              {product.category && (
                                <Badge variant="outline" className="bg-primary/10">
                                  {product.category}
                                </Badge>
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
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingProductId ? "Editar Producto" : "Nuevo Producto"}
            </DialogTitle>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              
              <Tabs defaultValue="general" value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid grid-cols-5 mb-4">
                  <TabsTrigger value="general" className="flex items-center gap-2">
                    <Package size={16} />
                    General
                  </TabsTrigger>
                  <TabsTrigger value="attributes" className="flex items-center gap-2">
                    <BarChart size={16} />
                    Atributos
                  </TabsTrigger>
                  <TabsTrigger value="barcodes" className="flex items-center gap-2">
                    <BarChart size={16} />
                    Códigos
                  </TabsTrigger>
                  <TabsTrigger value="conversions" className="flex items-center gap-2" disabled={!watchIsBulk}>
                    <Scale size={16} />
                    Conversiones
                  </TabsTrigger>
                  <TabsTrigger value="components" className="flex items-center gap-2" disabled={!form.watch("isComposite")}>
                    <Package size={16} />
                    Componentes
                  </TabsTrigger>
                </TabsList>
                
                {/* Pestaña de Información General */}
                <TabsContent value="general" className="space-y-6">
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
                              <Textarea placeholder="Descripción del producto" {...field as any} />
                            </FormControl>
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
                              onValueChange={(value) => field.onChange(value !== "none" ? parseInt(value) : undefined)}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Seleccionar proveedor" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="none">Sin proveedor</SelectItem>
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
                      <div className="space-y-4">
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
                                  {...field} 
                                  onChange={(e) => {
                                    field.onChange(e);
                                    calculateSellingPrice();
                                  }}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="grid grid-cols-3 gap-4">
                          <FormField
                            control={form.control}
                            name="iva"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>IVA</FormLabel>
                                <Select 
                                  value={field.value?.toString()} 
                                  onValueChange={(value) => {
                                    field.onChange(parseFloat(value));
                                    calculateSellingPrice();
                                  }}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Seleccionar tasa" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="0">0%</SelectItem>
                                    <SelectItem value="10.5">10.5%</SelectItem>
                                    <SelectItem value="21">21%</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="shipping"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Flete (%)</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="number" 
                                    step="0.01" 
                                    placeholder="0" 
                                    {...field} 
                                    onChange={(e) => {
                                      field.onChange(e);
                                      calculateSellingPrice();
                                    }}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="profit"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Ganancia (%)</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="number" 
                                    step="0.01" 
                                    placeholder="30" 
                                    {...field} 
                                    onChange={(e) => {
                                      field.onChange(e);
                                      calculateSellingPrice();
                                    }}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        <FormField
                          control={form.control}
                          name="price"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="flex items-center justify-between">
                                <span>Precio de Venta Final</span>
                                <Button 
                                  type="button" 
                                  variant="outline" 
                                  size="sm" 
                                  onClick={calculateSellingPrice}
                                  className="h-8"
                                >
                                  <Calculator className="h-4 w-4 mr-2" />
                                  Recalcular
                                </Button>
                              </FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  step="0.01" 
                                  {...field} 
                                  className="text-lg font-semibold" 
                                />
                              </FormControl>
                              <FormDescription>
                                Precio calculado en base a costo, impuestos y ganancia
                              </FormDescription>
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
                                <FormLabel className="flex items-center gap-2">
                                  <Thermometer size={16} className="text-blue-500" />
                                  Producto Refrigerado
                                </FormLabel>
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
                                  onCheckedChange={(checked) => {
                                    field.onChange(checked);
                                    if (!checked) {
                                      // Si se desmarca, limpiamos las conversiones
                                      setConversionRates([]);
                                      form.setValue("conversionRates", []);
                                      
                                      // Si estamos en la pestaña de conversiones, cambiar a general
                                      if (activeTab === "conversions") {
                                        setActiveTab("general");
                                      }
                                    }
                                  }}
                                />
                              </FormControl>
                              <div className="space-y-1 leading-none">
                                <FormLabel className="flex items-center gap-2">
                                  <Scale size={16} className="text-amber-500" />
                                  Producto a Granel
                                </FormLabel>
                                <FormDescription>
                                  Se vende por peso o volumen en diferentes unidades
                                </FormDescription>
                              </div>
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  </div>
                </TabsContent>
                
                {/* Pestaña de Códigos de Barras */}
                <TabsContent value="barcodes" className="space-y-6">
                  <div className="flex flex-col space-y-4">
                    <h3 className="text-lg font-medium">Códigos de Barras</h3>
                    <p className="text-sm text-muted-foreground">
                      Agregue múltiples códigos de barras para el producto. Útil para productos con diferentes presentaciones o empaques.
                    </p>
                    
                    <FormField
                      control={form.control}
                      name="barcodes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Códigos de Barras</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Separados por comas" 
                              {...field} 
                              onChange={(e) => {
                                field.onChange(e);
                                // Actualizar la lista visual de códigos
                                const codes = e.target.value.split(',').map(b => b.trim()).filter(Boolean);
                                setBarcodesList(codes);
                              }}
                            />
                          </FormControl>
                          <FormDescription>
                            Ingrese múltiples códigos separados por comas
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    {/* Vista previa de los códigos de barras */}
                    {barcodesList.length > 0 && (
                      <div className="mt-4">
                        <h4 className="text-sm font-medium mb-2">Códigos ingresados:</h4>
                        <div className="flex flex-wrap gap-2">
                          {barcodesList.map((code, index) => (
                            <Badge key={index} variant="outline" className="px-3 py-1 flex items-center gap-2">
                              <BarChart size={14} />
                              {code}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </TabsContent>
                
                {/* Pestaña de Conversiones de Unidades (solo visible si es producto a granel) */}
                <TabsContent value="conversions" className="space-y-6">
                  <div className="flex flex-col space-y-4">
                    <h3 className="text-lg font-medium">Conversiones de Unidades</h3>
                    <p className="text-sm text-muted-foreground">
                      Configure las conversiones entre la unidad base y otras unidades de venta. Por ejemplo, de kg a gramos, onzas, etc.
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name="conversionUnit"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Unidad de Conversión</FormLabel>
                            <FormControl>
                              <Input placeholder="ej. gramos, onzas" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="conversionFactor"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Factor de Conversión</FormLabel>
                            <FormControl>
                              <Input type="number" step="0.001" placeholder="ej. 1000" {...field} />
                            </FormControl>
                            <FormDescription>
                              1 {form.watch("baseUnit")} = X {form.watch("conversionUnit")}
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="flex items-end">
                        <Button 
                          type="button" 
                          onClick={addConversionRate}
                          className="w-full"
                        >
                          <Plus size={16} className="mr-2" />
                          Agregar Conversión
                        </Button>
                      </div>
                    </div>
                    
                    {/* Lista de conversiones agregadas */}
                    {conversionRates.length > 0 && (
                      <div className="mt-4 border rounded-md p-4">
                        <h4 className="text-sm font-medium mb-2">Conversiones configuradas:</h4>
                        <div className="space-y-2">
                          {conversionRates.map((conv, index) => (
                            <div key={index} className="flex items-center justify-between p-2 bg-muted rounded-md">
                              <span>
                                1 {form.watch("baseUnit")} = {conv.factor} {conv.unit}
                              </span>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeConversionRate(index)}
                              >
                                <X size={16} className="text-destructive" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </TabsContent>
                
                <TabsContent value="attributes" className="space-y-6">
                  <div className="flex flex-col space-y-4">
                    <h3 className="text-lg font-medium">Atributos del Producto</h3>
                    <p className="text-sm text-muted-foreground">
                      Configure atributos adicionales como categoría, código de proveedor y más.
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="category"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Categoría</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Ej: Panadería, Chocolates, etc." 
                                {...field} 
                              />
                            </FormControl>
                            <FormDescription>
                              Categoría a la que pertenece este producto
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="supplierCode"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Código de Proveedor</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Código usado por el proveedor" 
                                {...field} 
                              />
                            </FormControl>
                            <FormDescription>
                              Útil para actualización masiva de precios
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="imageUrl"
                        render={({ field }) => (
                          <FormItem className="col-span-2">
                            <FormLabel>URL de Imagen</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="https://ejemplo.com/imagen.jpg" 
                                {...field} 
                              />
                            </FormControl>
                            <FormDescription>
                              URL de la imagen del producto (opcional)
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="mt-4">
                      <FormField
                        control={form.control}
                        name="isComposite"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={(checked) => {
                                  field.onChange(checked);
                                  if (!checked) {
                                    // Si se desmarca, limpiamos los componentes
                                    setComponentsList([]);
                                    form.setValue("components", []);
                                    
                                    // Si estamos en la pestaña de componentes, cambiar a general
                                    if (activeTab === "components") {
                                      setActiveTab("attributes");
                                    }
                                  }
                                }}
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel className="flex items-center gap-2">
                                <Package size={16} className="text-primary" />
                                Producto Compuesto / Combo
                              </FormLabel>
                              <FormDescription>
                                Marque si este producto se compone de otros productos
                              </FormDescription>
                            </div>
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="components" className="space-y-6">
                  <div className="flex flex-col space-y-4">
                    <h3 className="text-lg font-medium">Componentes del Producto</h3>
                    <p className="text-sm text-muted-foreground">
                      Configure los productos que componen este combo o producto compuesto
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="md:col-span-2">
                        <FormField
                          control={form.control}
                          name="componentProductId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Producto</FormLabel>
                              <Select 
                                value={field.value?.toString()} 
                                onValueChange={(value) => field.onChange(value !== "none" ? parseInt(value) : undefined)}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Seleccionar producto" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {products?.filter((p: any) => !p.isComposite && (!editingProductId || p.id !== editingProductId)).map((product: any) => (
                                    <SelectItem key={product.id} value={product.id.toString()}>
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
                      
                      <FormField
                        control={form.control}
                        name="componentQuantity"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Cantidad</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                step="0.01" 
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="flex items-end">
                        <Button
                          type="button"
                          onClick={addComponent}
                          className="w-full"
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Agregar
                        </Button>
                      </div>
                    </div>
                    
                    {/* Lista de componentes agregados */}
                    {componentsList.length > 0 && (
                      <div className="mt-4 border rounded-md p-4">
                        <h4 className="text-sm font-medium mb-2">Componentes agregados:</h4>
                        <div className="space-y-2">
                          {componentsList.map((component, index) => (
                            <div key={index} className="flex items-center justify-between p-2 bg-muted rounded-md">
                              <span>
                                {component.productName} - {component.quantity} {component.unit}
                              </span>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeComponent(index)}
                              >
                                <X size={16} className="text-destructive" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
              
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
