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
  DialogTitle
} from "@/components/ui/dialog";
import { 
  Form
} from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertProductSchema } from "@shared/schema";
import { Package, Plus, RefreshCw, Search, Thermometer, Scale, Calculator } from "lucide-react";

// Importación de los componentes de pestañas
import { GeneralTab } from "@/components/products/GeneralTab";
import { PricingTab } from "@/components/products/PricingTab";
import { BarcodesTab } from "@/components/products/BarcodesTab";
import { ConversionsTab } from "@/components/products/ConversionsTab";
import { ComponentsTab } from "@/components/products/ComponentsTab";

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
    quantity: number;
    unit: string;
  }>>([]);

  // Fetch products
  const { data: products, isLoading } = useQuery({
    queryKey: ["/api/products"],
    queryFn: undefined,
  });
  
  // Fetch suppliers for the dropdown
  const { data: suppliers } = useQuery({
    queryKey: ["/api/suppliers"],
    queryFn: undefined,
  });
  
  // Calculate selling price based on cost, iva, shipping, and profit
  const recalculatePrice = () => {
    const cost = form.getValues("cost") || 0;
    const iva = form.getValues("iva") || 21;
    const shipping = form.getValues("shipping") || 0;
    const profit = form.getValues("profit") || 30;
    
    // Cálculo del precio: costo + IVA + envío + margen de ganancia
    const costWithIva = cost * (1 + iva / 100);
    const costWithIvaAndShipping = costWithIva * (1 + shipping / 100);
    const sellingPrice = costWithIvaAndShipping * (1 + profit / 100);
    
    // Redondear a 2 decimales
    const roundedPrice = Math.round(sellingPrice * 100) / 100;
    
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
  const watchIsComposite = form.watch("isComposite");
  
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
          
          <div className="bg-background rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead>Precio</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Proveedor</TableHead>
                  <TableHead>Características</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      Cargando productos...
                    </TableCell>
                  </TableRow>
                ) : filteredProducts?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      No hay productos para mostrar
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredProducts?.map((product: any) => (
                    <TableRow key={product.id}>
                      <TableCell className="font-medium">
                        <div className="flex flex-col">
                          <span>{product.name}</span>
                          {product.isComposite && product.components && (
                            <div className="text-xs text-muted-foreground mt-1">
                              <span className="font-semibold">Componentes:</span>{" "}
                              {typeof product.components === 'string' 
                                ? JSON.parse(product.components).map((c: any) => c.productName).join(", ")
                                : product.components.map((c: any) => c.productName).join(", ")
                              }
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{product.category || "-"}</TableCell>
                      <TableCell>${parseFloat(product.price).toFixed(2)}</TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <span className={`${parseFloat(product.stock) <= (parseFloat(product.stockAlert) || 0) ? "text-destructive font-semibold" : ""}`}>
                            {parseFloat(product.stock).toFixed(2)} {product.baseUnit}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>{product.supplierCode || "-"}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {product.isRefrigerated && (
                            <Badge variant="secondary" className="text-blue-500 border-blue-200 bg-blue-100">
                              <Thermometer size={14} className="mr-1" />
                              Refrigerado
                            </Badge>
                          )}
                          {product.isBulk && (
                            <Badge variant="secondary" className="text-amber-500 border-amber-200 bg-amber-100">
                              <Scale size={14} className="mr-1" />
                              Granel
                            </Badge>
                          )}
                          {product.isComposite && (
                            <Badge variant="secondary" className="text-purple-500 border-purple-200 bg-purple-100">
                              <Package size={14} className="mr-1" />
                              Compuesto
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditProduct(product)}
                        >
                          Editar
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </main>
      </div>
      
      {/* Dialog for creating/editing products */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingProductId ? "Editar Producto" : "Nuevo Producto"}
            </DialogTitle>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <Tabs
                defaultValue="general"
                value={activeTab}
                onValueChange={setActiveTab}
                className="w-full"
              >
                <TabsList className="w-full justify-start mb-4">
                  <TabsTrigger value="general" className="flex items-center gap-2">
                    <Package size={16} />
                    General
                  </TabsTrigger>
                  <TabsTrigger value="pricing" className="flex items-center gap-2">
                    <Calculator size={16} />
                    Precios
                  </TabsTrigger>
                  <TabsTrigger value="barcodes" className="flex items-center gap-2">
                    <Search size={16} />
                    Códigos
                  </TabsTrigger>
                  <TabsTrigger value="conversions" className="flex items-center gap-2" disabled={!watchIsBulk}>
                    <Scale size={16} />
                    Conversiones
                  </TabsTrigger>
                  <TabsTrigger value="components" className="flex items-center gap-2" disabled={!watchIsComposite}>
                    <Package size={16} />
                    Componentes
                  </TabsTrigger>
                </TabsList>
                
                {/* Pestaña de Información General */}
                <TabsContent value="general">
                  <GeneralTab form={form} suppliers={suppliers || []} />
                </TabsContent>
                
                {/* Pestaña de Precios */}
                <TabsContent value="pricing">
                  <PricingTab form={form} recalculatePrice={recalculatePrice} />
                </TabsContent>
                
                {/* Pestaña de Códigos de Barras */}
                <TabsContent value="barcodes">
                  <BarcodesTab 
                    form={form} 
                    barcodesList={barcodesList} 
                    setBarcodesList={setBarcodesList} 
                  />
                </TabsContent>
                
                {/* Pestaña de Conversiones (para productos a granel) */}
                <TabsContent value="conversions">
                  <ConversionsTab 
                    form={form} 
                    conversionRates={conversionRates} 
                    setConversionRates={setConversionRates} 
                  />
                </TabsContent>
                
                {/* Pestaña de Componentes (para productos compuestos) */}
                <TabsContent value="components">
                  <ComponentsTab 
                    form={form} 
                    products={products || []} 
                    componentsList={componentsList} 
                    setComponentsList={setComponentsList}
                    editingProductId={editingProductId}
                  />
                </TabsContent>
              </Tabs>
              
              <DialogFooter className="flex justify-between">
                <Button 
                  type="button" 
                  variant="destructive" 
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingProductId ? "Actualizar Producto" : "Crear Producto"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}