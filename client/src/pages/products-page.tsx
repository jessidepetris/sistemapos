import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api";
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
  DialogTitle, DialogDescription
} from "@/components/ui/dialog";
import { Form } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { insertProductSchema } from "../../../shared/schema";
import { Package, Plus, RefreshCw, Search, Thermometer, Scale, Calculator, Tag, Edit, Trash2 } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

// Importación de los componentes de pestañas
import { GeneralTab } from "@/components/products/GeneralTab";
import { PricingTab } from "@/components/products/PricingTab";
import { BarcodesTab } from "@/components/products/BarcodesTab";
import { EnhancedConversionsTab } from "@/components/products/EnhancedConversionsTab";
import { ComponentsTab } from "@/components/products/ComponentsTab";
import { CategoriesTab } from "@/components/products/CategoriesTab";
import { BulkCostUpdate } from "@/components/products/BulkCostUpdate";

// Define a schema for unit conversions with barcodes
const conversionRateSchema = z.object({
  unit: z.string(),
  factor: z.coerce.number().positive("El factor debe ser mayor que 0"),
  barcode: z.string().optional(),
  description: z.string().optional(),
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
  barcodes: z.preprocess(
    (val) => typeof val === 'string' && val ? 
      val.split(',').map((b: string) => b.trim()).filter(Boolean) : [],
    z.array(z.string().optional())
  ),
  // Form validation for numeric fields
  price: z.coerce.number().min(0, "El precio debe ser mayor o igual a 0"),
  wholesalePrice: z.coerce.number().min(0, "El precio mayorista debe ser mayor o igual a 0"),
  cost: z.coerce.number().min(0, "El costo debe ser mayor o igual a 0").optional(),
  stock: z.coerce.number().min(0, "El stock debe ser mayor o igual a 0"),
  stockAlert: z.coerce.number().min(0, "La alerta de stock debe ser mayor o igual a 0").optional(),
  
  // Nuevos campos
  category: z.string().optional(),
  categoryIds: z.array(z.number()).optional(),
  imageUrl: z.string().optional(),
  supplierCode: z.string().optional(),
  location: z.string().optional(),
  
  // Campos para cálculo automático del precio
  iva: z.enum(["0", "10.5", "21"]).transform(val => parseFloat(val)).default("21"),
  shipping: z.coerce.number().min(0).default(0),
  profit: z.coerce.number().min(0).default(55),
  wholesaleProfit: z.coerce.number().min(0).default(35),
  supplierDiscount: z.coerce.number().min(0).max(100).optional().default(0),
  
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

  // Campo para marcar productos discontinuados
  isDiscontinued: z.boolean().default(false),
});

type ProductFormValues = z.infer<typeof productFormSchema>;

export default function ProductsPage() {
  const { toast } = useToast();
  const reactQueryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isBulkUpdateDialogOpen, setIsBulkUpdateDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingProductId, setEditingProductId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState("general");
  const [conversionRates, setConversionRates] = useState<Array<{
    unit: string, 
    factor: number,
    barcode?: string,
    description?: string
  }>>([]);
  const [barcodesList, setBarcodesList] = useState<string[]>([]);
  const [componentsList, setComponentsList] = useState<Array<{
    productId: number;
    productName: string;
    quantity: number;
    unit: string;
  }>>([]);
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [showOutOfStock, setShowOutOfStock] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);

  // Fetch products
  const { data: products, isLoading } = useQuery({
    queryKey: ["/api/products"],
    queryFn: undefined,
    refetchInterval: 30000, // Refresca cada 30 segundos
    refetchOnWindowFocus: true, // Refresca cuando la ventana recupera el foco
  });
  
  // Fetch suppliers for the dropdown
  const { data: suppliers } = useQuery({
    queryKey: ["/api/suppliers"],
    queryFn: undefined,
  });
  
  // Obtener todas las categorías
  const { data: categories } = useQuery({
    queryKey: ["/api/product-categories"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/product-categories");
      if (!response.ok) throw new Error("Error al cargar categorías");
      return response.json();
    },
  });

  // Crear mapa de IDs a nombres de categorías
  const categoryMap = React.useMemo(() => {
    const map = new Map<string, string>();
    categories?.forEach((category: any) => {
      map.set(category.id.toString(), category.name);
    });
    return map;
  }, [categories]);

  // Función para calcular el costo de un producto compuesto basado en sus componentes
  const calculateCompositeCost = () => {
    // Si no es un producto compuesto o no hay componentes, retornar
    const isComposite = form.getValues("isComposite");
    if (!isComposite || componentsList.length === 0) {
      return null;
    }
    
    // Calculamos el costo sumando el costo de cada componente * su cantidad
    let totalCost = 0;
    
    componentsList.forEach(component => {
      // Buscar el producto componente para obtener su costo
      const componentProduct = products?.find((p: any) => p.id === component.productId);
      if (componentProduct && componentProduct.cost) {
        // Multiplicar el costo por la cantidad
        totalCost += (parseFloat(componentProduct.cost) * parseFloat(component.quantity));
      }
    });
    
    // Redondeo a 2 decimales
    return Math.round(totalCost * 100) / 100;
  };

  // Recalcular el precio de venta basado en costo, IVA, flete y ganancia
  const recalculatePrice = () => {
    let cost = form.getValues("cost") || 0;
    const isComposite = form.getValues("isComposite");
    const costCurrency = form.getValues("costCurrency") || "ARS";
    const currency = form.getValues("currency") || "ARS";
    
    // Si es un producto compuesto, calculamos su costo basado en componentes
    if (isComposite && componentsList.length > 0) {
      const compositeCost = calculateCompositeCost();
      if (compositeCost !== null) {
        cost = compositeCost;
        // Actualizamos el campo de costo en el formulario
        form.setValue("cost", compositeCost);
      }
    }
    
    // Aplicar descuento del proveedor al costo si existe
    const supplierDiscount = form.getValues("supplierDiscount") || 0;
    if (supplierDiscount > 0) {
      cost = cost * (1 - (supplierDiscount / 100));
      // Redondeo a 2 decimales del costo con descuento
      cost = Math.round(cost * 100) / 100;
    }
    
    // Convertir el costo a la moneda de venta si es necesario
    if (costCurrency !== currency) {
      // TODO: Implementar la conversión de moneda usando una API de tipo de cambio
      // Por ahora asumimos una tasa fija de 1000 ARS = 1 USD
      const exchangeRate = costCurrency === "USD" ? 1000 : 1/1000;
      cost = cost * exchangeRate;
    }
    
    const ivaValue = form.getValues("iva") || "21";
    const ivaRate = parseFloat(ivaValue);
    const shippingRate = form.getValues("shipping") || 0;
    const profitRate = form.getValues("profit") || 55;
    
    // Cálculo del precio
    const costWithIva = cost * (1 + (ivaRate / 100));
    const costWithShipping = costWithIva * (1 + (shippingRate / 100));
    const finalPrice = costWithShipping * (1 + (profitRate / 100));
    
    // Redondeo a 2 decimales
    const roundedPrice = Math.round(finalPrice * 100) / 100;
    
    // Actualizar el formulario
    form.setValue("price", roundedPrice);
  };

  // Recalcular el precio mayorista basado en costo, IVA, flete y ganancia mayorista
  const recalculateWholesalePrice = () => {
    let cost = form.getValues("cost") || 0;
    const isComposite = form.getValues("isComposite");
    const costCurrency = form.getValues("costCurrency") || "ARS";
    const currency = form.getValues("currency") || "ARS";
    
    // Si es un producto compuesto, calculamos su costo basado en componentes
    if (isComposite && componentsList.length > 0) {
      const compositeCost = calculateCompositeCost();
      if (compositeCost !== null) {
        cost = compositeCost;
        // No necesitamos actualizar el formulario aquí porque recalculatePrice ya lo haría
      }
    }
    
    // Aplicar descuento del proveedor al costo si existe
    const supplierDiscount = form.getValues("supplierDiscount") || 0;
    if (supplierDiscount > 0) {
      cost = cost * (1 - (supplierDiscount / 100));
      // Redondeo a 2 decimales del costo con descuento
      cost = Math.round(cost * 100) / 100;
    }
    
    // Convertir el costo a la moneda de venta si es necesario
    if (costCurrency !== currency) {
      // TODO: Implementar la conversión de moneda usando una API de tipo de cambio
      // Por ahora asumimos una tasa fija de 1000 ARS = 1 USD
      const exchangeRate = costCurrency === "USD" ? 1000 : 1/1000;
      cost = cost * exchangeRate;
    }
    
    const ivaValue = form.getValues("iva") || "21";
    const ivaRate = parseFloat(ivaValue);
    const shippingRate = form.getValues("shipping") || 0;
    const wholesaleProfitRate = form.getValues("wholesaleProfit") || 35;
    
    // Cálculo del precio mayorista
    const costWithIva = cost * (1 + (ivaRate / 100));
    const costWithShipping = costWithIva * (1 + (shippingRate / 100));
    const finalWholesalePrice = costWithShipping * (1 + (wholesaleProfitRate / 100));
    
    // Redondeo a 2 decimales
    const roundedWholesalePrice = Math.round(finalWholesalePrice * 100) / 100;
    
    // Actualizar el formulario
    form.setValue("wholesalePrice", roundedWholesalePrice);
  };

  // Form definition
  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: "",
      description: "",
      baseUnit: "unidad",
      barcodes: "", // Entrada como string que se convertirá a array
      price: 0,
      wholesalePrice: 0,
      cost: 0,
      stock: 0,
      stockAlert: 0,
      iva: "21",        // 21% por defecto
      shipping: 0,     // 0% por defecto
      profit: 55,      // 55% por defecto
      wholesaleProfit: 35, // 35% por defecto para mayoristas
      isRefrigerated: false,
      isBulk: false,
      isComposite: false,
      active: true,    // Activo por defecto
      webVisible: false, // No visible en web por defecto
      category: "",
      categoryIds: [],
      imageUrl: "",
      supplierCode: "",
      location: "",    // Ubicación vacía por defecto
      conversionRates: [] as any[], // Array para conversiones mejoradas con códigos de barras
      conversionUnit: "",
      conversionFactor: 0,
      components: [] as any[], // Array para componentes de productos compuestos
      componentProductId: undefined,
      componentQuantity: 0,
      componentUnit: "unidad",
      isDiscontinued: false,
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
    onMutate: async (newProduct) => {
      // Cancelar cualquier refresco pendiente para evitar sobrescribir nuestra actualización optimista
      await reactQueryClient.cancelQueries({ queryKey: ["/api/products"] });

      // Guardar el estado anterior
      const previousProducts = reactQueryClient.getQueryData(["/api/products"]);

      // Actualizar la caché de manera optimista
      reactQueryClient.setQueryData(["/api/products"], (old: any) => {
        const optimisticProduct = {
          ...newProduct,
          id: Date.now(), // ID temporal
          createdAt: new Date().toISOString(),
        };
        return Array.isArray(old) ? [...old, optimisticProduct] : [optimisticProduct];
      });

      return { previousProducts };
    },
    onError: (err, newProduct, context: any) => {
      // Si hay un error, revertir a los datos anteriores
      reactQueryClient.setQueryData(["/api/products"], context.previousProducts);
      toast({
        title: "Error al crear el producto",
        description: (err as Error).message,
        variant: "destructive",
      });
    },
    onSuccess: () => {
      toast({ title: "Producto creado correctamente" });
      form.reset();
      setIsDialogOpen(false);
      // Refrescar los datos para asegurarnos de tener la información más actualizada del servidor
      reactQueryClient.invalidateQueries({ queryKey: ["/api/products"] });
    }
  });
  
  // Update product mutation
  const updateProductMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: ProductFormValues }) => {
      const res = await apiRequest("PUT", `/api/products/${id}`, data);
      return await res.json();
    },
    onMutate: async ({ id, data }) => {
      await reactQueryClient.cancelQueries({ queryKey: ["/api/products"] });
      
      const previousProducts = reactQueryClient.getQueryData(["/api/products"]);
      
      reactQueryClient.setQueryData(["/api/products"], (old: any) => {
        if (!Array.isArray(old)) return old;
        return old.map((product) => 
          product.id === id ? { 
            ...product, 
            ...data,
            lastUpdated: new Date() // Mantener como Date en lugar de convertir a ISO string
          } : product
        );
      });
      
      return { previousProducts };
    },
    onError: (err, variables, context: any) => {
      reactQueryClient.setQueryData(["/api/products"], context.previousProducts);
      toast({
        title: "Error al actualizar el producto",
        description: (err as Error).message,
        variant: "destructive",
      });
    },
    onSuccess: () => {
      toast({ title: "Producto actualizado correctamente" });
      form.reset();
      setIsDialogOpen(false);
      setEditingProductId(null);
      reactQueryClient.invalidateQueries({ queryKey: ["/api/products"] });
    }
  });
  
  // Delete product mutation
  const deleteProductMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/products/${id}`);
      return await res.json();
    },
    onMutate: async (deletedId) => {
      await reactQueryClient.cancelQueries({ queryKey: ["/api/products"] });
      
      const previousProducts = reactQueryClient.getQueryData(["/api/products"]);
      
      reactQueryClient.setQueryData(["/api/products"], (old: any) => {
        if (!Array.isArray(old)) return old;
        return old.filter((product) => product.id !== deletedId);
      });
      
      return { previousProducts };
    },
    onError: (err, variables, context: any) => {
      reactQueryClient.setQueryData(["/api/products"], context.previousProducts);
      toast({
        title: "Error al eliminar el producto",
        description: (err as Error).message,
        variant: "destructive",
      });
    },
    onSuccess: () => {
      toast({ title: "Producto eliminado correctamente" });
      setIsDeleteDialogOpen(false);
      reactQueryClient.invalidateQueries({ queryKey: ["/api/products"] });
    }
  });
  
  // Filtered products based on search
  const filteredProducts = searchQuery && Array.isArray(products)
    ? products.filter((product: any) =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (product.description && product.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (product.barcodes && Array.isArray(product.barcodes) && product.barcodes.some((barcode: string) => barcode.includes(searchQuery)))
      )
    : products;
  
  // Form submission handler
  const handleSubmit = (data: ProductFormValues) => {
    if (editingProductId) {
      // No incluir lastUpdated en los datos que se envían al servidor
      // Se actualizará automáticamente en el backend
      updateProductMutation.mutate({ id: editingProductId, data });
    } else {
      createProductMutation.mutate(data);
    }
  };
  
  // Edit product handler
  const handleEditProduct = (product: any) => {
    setEditingProductId(product.id);
    
    // Preparar listas para componentes y conversiones
    const productComponents = product.components ? product.components : [];
    setComponentsList(productComponents);
    
    // Preparar conversiones
    const productConversions = product.conversionRates ? product.conversionRates : [];
    setConversionRates(productConversions);
    
    // Preparar códigos de barras
    const productBarcodes = product.barcodes || [];
    setBarcodesList(productBarcodes);
    
    // Establecer pestaña activa
    setActiveTab("general");
    
    // Format data for form
    form.reset({
      name: product.name,
      description: product.description || "",
      baseUnit: product.baseUnit,
      barcodes: product.barcodes ? product.barcodes.join(", ") : "",
      price: parseFloat(product.price),
      wholesalePrice: product.wholesalePrice ? parseFloat(product.wholesalePrice) : 0,
      cost: product.cost ? parseFloat(product.cost) : 0,
      stock: parseFloat(product.stock),
      stockAlert: product.stockAlert ? parseFloat(product.stockAlert) : 0,
      iva: product.iva ? product.iva.toString() : "21",
      shipping: product.shipping || 0,
      profit: product.profit || 55,
      wholesaleProfit: product.wholesaleProfit || 35,
      supplierDiscount: product.supplierDiscount || 0,
      supplierId: product.supplierId,
      supplierCode: product.supplierCode || "",
      category: product.category || "",
      categoryIds: product.categoryIds || [],
      imageUrl: product.imageUrl || "",
      isRefrigerated: product.isRefrigerated,
      isBulk: product.isBulk,
      isComposite: product.isComposite || false,
      active: product.active !== undefined ? product.active : true,
      webVisible: product.webVisible || false,
      isDiscontinued: product.isDiscontinued || false,
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
      barcodes: "", // Entrada como string que se convertirá a array
      price: 0,
      wholesalePrice: 0,
      cost: 0,
      stock: 0,
      stockAlert: 0,
      iva: "21",        // 21% por defecto
      shipping: 0,     // 0% por defecto
      profit: 55,      // 55% por defecto
      wholesaleProfit: 35, // 35% por defecto para mayoristas
      isRefrigerated: false,
      isBulk: false,
      isComposite: false,
      active: true,    // Activo por defecto
      webVisible: false, // No visible en web por defecto
      isDiscontinued: false, // No discontinuado por defecto
      category: "",
      categoryIds: [],
      imageUrl: "",
      supplierCode: "",
      location: "",    // Ubicación vacía por defecto
      conversionRates: [] as any[], // Array para conversiones mejoradas con códigos de barras
      conversionUnit: "",
      conversionFactor: 0,
      components: [] as any[], // Array para componentes de productos compuestos
      componentProductId: undefined,
      componentQuantity: 0,
      componentUnit: "unidad",
    });
    setIsDialogOpen(true);
  };

  const handleDeleteClick = (product: any) => {
    setProductToDelete(product);
    setIsDeleteDialogOpen(true);
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
              <Button 
                variant="outline"
                onClick={() => setIsBulkUpdateDialogOpen(true)}
              >
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
                  <TableHead>Precio Minorista</TableHead>
                  <TableHead>Precio Mayorista</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Ubicación</TableHead>
                  <TableHead>Proveedor</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Características</TableHead>
                  <TableHead>Última Actualización</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={11} className="text-center">
                      Cargando productos...
                    </TableCell>
                  </TableRow>
                ) : filteredProducts && filteredProducts.length > 0 ? (
                  filteredProducts.map((product: any) => (
                    <TableRow key={product.id}>
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell>{product.category || '-'}</TableCell>
                      <TableCell>${parseFloat(product.price).toFixed(2)}</TableCell>
                      <TableCell>${product.wholesalePrice ? parseFloat(product.wholesalePrice).toFixed(2) : '-'}</TableCell>
                      <TableCell>{parseFloat(product.stock)}</TableCell>
                      <TableCell>{product.location || '-'}</TableCell>
                      <TableCell>
                        {product.supplier ? product.supplier.name : '-'}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {product.active ? (
                            <Badge variant="secondary" className="text-green-600 border-green-200 bg-green-100">
                              Activo
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="text-gray-600 border-gray-200 bg-gray-100">
                              Inactivo
                            </Badge>
                          )}
                          {product.webVisible && (
                            <Badge variant="secondary" className="text-blue-600 border-blue-200 bg-blue-100">
                              Web
                            </Badge>
                          )}
                          {product.isDiscontinued && (
                            <Badge variant="secondary" className="text-orange-600 border-orange-200 bg-orange-100">
                              Discontinuado
                            </Badge>
                          )}
                        </div>
                      </TableCell>
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
                      <TableCell>
                        {product.lastUpdated ? new Date(product.lastUpdated).toLocaleString() : "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditProduct(product)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteClick(product)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={11} className="text-center py-8">
                      No hay productos para mostrar
                    </TableCell>
                  </TableRow>
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
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
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
                  <TabsTrigger value="categories" className="flex items-center gap-2">
                    <Tag size={16} />
                    Categorías
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
                  <GeneralTab 
                    form={form} 
                    suppliers={Array.isArray(suppliers) ? suppliers : []} 
                    onTabChange={setActiveTab}
                  />
                </TabsContent>
                
                {/* Pestaña de Precios */}
                <TabsContent value="pricing">
                  <PricingTab 
                    form={form} 
                    recalculatePrice={recalculatePrice} 
                    recalculateWholesalePrice={recalculateWholesalePrice}
                  />
                </TabsContent>
                
                {/* Pestaña de Códigos de Barras */}
                <TabsContent value="barcodes">
                  <BarcodesTab 
                    form={form} 
                    barcodesList={barcodesList} 
                    setBarcodesList={setBarcodesList} 
                  />
                </TabsContent>
                
                {/* Pestaña de Categorías */}
                <TabsContent value="categories">
                  <CategoriesTab 
                    form={form}
                    productId={editingProductId}
                  />
                </TabsContent>
                
                {/* Pestaña de Conversiones (para productos a granel) */}
                <TabsContent value="conversions">
                  <EnhancedConversionsTab 
                    form={form} 
                    conversionRates={conversionRates} 
                    setConversionRates={setConversionRates} 
                  />
                </TabsContent>
                
                {/* Pestaña de Componentes (para productos compuestos) */}
                <TabsContent value="components">
                  <ComponentsTab 
                    form={form} 
                    products={Array.isArray(products) ? products : []} 
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

      {/* Diálogo de confirmación de eliminación */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente el producto "{productToDelete?.name}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (productToDelete) {
                  deleteProductMutation.mutate(productToDelete.id);
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog for bulk cost updates */}
      <Dialog open={isBulkUpdateDialogOpen} onOpenChange={setIsBulkUpdateDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Actualización Masiva de Precios</DialogTitle>
          </DialogHeader>
          <BulkCostUpdate />
        </DialogContent>
      </Dialog>
    </div>
  );
}
