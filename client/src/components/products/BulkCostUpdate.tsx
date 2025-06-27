import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/api";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ExternalLink, Upload } from "lucide-react";
import Papa from "papaparse";

interface Category {
  id: number;
  name: string;
}

interface Supplier {
  id: number;
  name: string;
}

export function BulkCostUpdate() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("percentage");
  const [percentage, setPercentage] = useState<number | undefined>();
  const [categoryId, setCategoryId] = useState<string>("");
  const [supplierId, setSupplierId] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [fileSupplier, setFileSupplier] = useState<string>("");
  const [filePreview, setFilePreview] = useState<Array<any>>([]);
  const [hasHeaders, setHasHeaders] = useState(true);

  // Obtener categorías para el filtro
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/product-categories"],
    retry: false,
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/product-categories");
      return response.json();
    }
  });

  // Obtener proveedores para el filtro
  const { data: suppliers = [] } = useQuery<Supplier[]>({
    queryKey: ["/api/suppliers"],
    retry: false,
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/suppliers");
      return response.json();
    }
  });

  // Actualizar por porcentaje
  const handleUpdateByPercentage = async () => {
    if (percentage === undefined) {
      toast({
        title: "Error",
        description: "Debe ingresar un porcentaje válido",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);
      const data = {
        percentage,
        filterByCategoryId: categoryId && categoryId !== "all" ? parseInt(categoryId) : undefined,
        filterBySupplierId: supplierId && supplierId !== "all" ? parseInt(supplierId) : undefined,
        lastUpdated: new Date()
      };

      const res = await apiRequest("POST", "/api/products/update-cost-by-percentage", data);
      const result = await res.json();

      if (result.error) {
        throw new Error(result.message || result.error);
      }

      toast({
        title: "Actualización exitosa",
        description: result.message,
      });

      // Invalidar todas las consultas relacionadas con productos
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["/api/products"] }),
        queryClient.invalidateQueries({ queryKey: ["/api/products", "list"] }),
        queryClient.invalidateQueries({ queryKey: ["/api/products", "details"] }),
        queryClient.refetchQueries({ queryKey: ["/api/products"] })
      ]);

      // Actualizar el estado local con los productos actualizados
      if (result.updatedProducts) {
        result.updatedProducts.forEach((updatedProduct: any) => {
          if (updatedProduct && updatedProduct.id) {
            queryClient.setQueryData(
              ["/api/products", updatedProduct.id],
              (oldData: any) => ({
                ...oldData,
                ...updatedProduct,
                lastUpdated: updatedProduct.lastUpdated || new Date().toISOString()
              })
            );
          }
        });
      }

      // Limpiar los campos después de la actualización exitosa
      setPercentage(undefined);
      setCategoryId("all");
      setSupplierId("all");
    } catch (error) {
      toast({
        title: "Error",
        description: (error as Error).message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Manejar carga de archivo CSV
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      
      // Previsualizar archivo
      Papa.parse(selectedFile, {
        header: hasHeaders,
        skipEmptyLines: true,
        preview: 10, // Aumentar a 10 filas para mejor previsualización
        complete: (results) => {
          // Validar estructura del archivo
          const headers = hasHeaders ? Object.keys(results.data[0] || {}) : [];
          const requiredColumns = ['supplierCode', 'cost'];
          const hasRequiredColumns = hasHeaders 
            ? requiredColumns.every(col => headers.includes(col) || 
                                         headers.includes(col.toLowerCase()) ||
                                         headers.includes(col.toUpperCase()))
            : true;

          if (hasHeaders && !hasRequiredColumns) {
            toast({
              title: "Error en el archivo",
              description: "El archivo debe contener las columnas 'supplierCode' y 'cost'",
              variant: "destructive",
            });
            setFile(null);
            setFilePreview([]);
            return;
          }

          // Validar datos numéricos
          const invalidRows = results.data.filter((row: any) => {
            const cost = hasHeaders 
              ? parseFloat(row.cost || row.costo || row.precio)
              : parseFloat(row[1]);
            return isNaN(cost) || cost < 0;
          });

          if (invalidRows.length > 0) {
            toast({
              title: "Advertencia",
              description: `Se encontraron ${invalidRows.length} filas con costos inválidos`,
              variant: "warning",
            });
          }

          setFilePreview(results.data);
        },
        error: (error) => {
          toast({
            title: "Error al procesar archivo",
            description: error.message,
            variant: "destructive",
          });
          setFile(null);
          setFilePreview([]);
        }
      });
    }
  };

  // Actualizar por archivo
  const handleUpdateByFile = async () => {
    if (!file) {
      toast({
        title: "Error",
        description: "Debe seleccionar un archivo",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);
      
      // Parsear el archivo CSV
      Papa.parse(file, {
        header: hasHeaders,
        skipEmptyLines: true,
        complete: async (results) => {
          // Mapear los datos del CSV a la estructura esperada por la API
          const productUpdates = results.data.map((row: any) => {
            // Si tiene encabezados, usar nombres de columnas, si no, usar índices
            const supplierCode = hasHeaders ? row.supplierCode || row.codigo : row[0];
            const newCost = hasHeaders 
              ? parseFloat(row.cost || row.costo || row.precio) 
              : parseFloat(row[1]);
            
            return {
              supplierCode,
              newCost: isNaN(newCost) ? null : newCost
            };
          }).filter((item: any) => item.supplierCode && item.newCost !== null);
          
          if (productUpdates.length === 0) {
            toast({
              title: "Error",
              description: "No se encontraron datos válidos en el archivo",
              variant: "destructive",
            });
            setIsLoading(false);
            return;
          }
          
          const data = {
            products: productUpdates,
            supplierId: fileSupplier && fileSupplier !== "all" ? parseInt(fileSupplier) : undefined,
            keepCurrentPrices: false, // Por defecto, recalcular precios
            lastUpdated: new Date()
          };
          
          const res = await apiRequest("POST", "/api/products/update-cost-by-file", data);
          const result = await res.json();
          
          if (result.error) {
            throw new Error(result.message || result.error);
          }
          
          // Mostrar resumen de la actualización
          toast({
            title: "Actualización completada",
            description: (
              <div>
                <p>Productos actualizados: {result.results.success}</p>
                {result.results.errors.length > 0 && (
                  <p>Errores: {result.results.errors.length}</p>
                )}
              </div>
            ),
          });
          
          // Mostrar detalles de errores si los hay
          if (result.results.errors.length > 0) {
            console.log("Errores en la actualización:", result.results.errors);
            // Aquí podríamos mostrar un modal con los errores detallados
          }
          
          // Forzar una actualización completa de los datos de productos
          await Promise.all([
            queryClient.invalidateQueries({ queryKey: ["/api/products"] }),
            queryClient.invalidateQueries({ queryKey: ["/api/products", "list"] }),
            queryClient.invalidateQueries({ queryKey: ["/api/products", "details"] }),
            queryClient.refetchQueries({ queryKey: ["/api/products"] })
          ]);

          // Actualizar el estado local con los productos actualizados
          if (result.results?.updatedProducts) {
            result.results.updatedProducts.forEach((updatedProduct: any) => {
              if (updatedProduct && updatedProduct.id) {
                queryClient.setQueryData(
                  ["/api/products", updatedProduct.id],
                  (oldData: any) => ({
                    ...oldData,
                    ...updatedProduct,
                    lastUpdated: updatedProduct.lastUpdated || new Date().toISOString()
                  })
                );
              }
            });
          }
          
          // Limpiar el archivo y la vista previa
          setFile(null);
          setFilePreview([]);
          setFileSupplier("all");
          
          setIsLoading(false);
        },
        error: (error) => {
          toast({
            title: "Error al procesar archivo",
            description: error.message,
            variant: "destructive",
          });
          setIsLoading(false);
        }
      });
    } catch (error) {
      toast({
        title: "Error",
        description: (error as Error).message,
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  const handleDownloadTemplate = () => {
    // Crear contenido del CSV
    const csvContent = "supplierCode,cost\nABC123,100.50\nDEF456,75.25\nGHI789,200.00";
    
    // Crear blob y URL
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    // Crear enlace temporal y simular click
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'plantilla_actualizacion_costos.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Actualización Masiva de Costos</CardTitle>
        <CardDescription>
          Actualice el precio de costo de múltiples productos a la vez
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="percentage">Por Porcentaje</TabsTrigger>
            <TabsTrigger value="file">Por Archivo</TabsTrigger>
          </TabsList>
          
          <TabsContent value="percentage" className="space-y-4 mt-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="percentage">Porcentaje de Aumento</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="percentage"
                    type="number"
                    step="0.01"
                    placeholder="10.5"
                    value={percentage === undefined ? "" : percentage}
                    onChange={(e) => setPercentage(e.target.value ? parseFloat(e.target.value) : undefined)}
                  />
                  <span>%</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Valores positivos aumentan el costo, negativos lo disminuyen
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="category">Filtrar por Categoría (opcional)</Label>
                  <Select value={categoryId} onValueChange={setCategoryId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todas las categorías" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas las categorías</SelectItem>
                      {categories?.map((category: any) => (
                        <SelectItem key={category.id} value={category.id.toString()}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="supplier">Filtrar por Proveedor (opcional)</Label>
                  <Select value={supplierId} onValueChange={setSupplierId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todos los proveedores" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos los proveedores</SelectItem>
                      {suppliers?.map((supplier: any) => (
                        <SelectItem key={supplier.id} value={supplier.id.toString()}>
                          {supplier.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <Button 
                onClick={handleUpdateByPercentage} 
                disabled={isLoading || percentage === undefined}
                className="w-full"
              >
                {isLoading ? "Actualizando..." : "Actualizar Costos"}
              </Button>
            </div>
          </TabsContent>
          
          <TabsContent value="file" className="space-y-4 mt-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="fileSupplier">Filtrar por Proveedor (opcional)</Label>
                <Select value={fileSupplier} onValueChange={setFileSupplier}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos los proveedores" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los proveedores</SelectItem>
                    {suppliers?.map((supplier: any) => (
                      <SelectItem key={supplier.id} value={supplier.id.toString()}>
                        {supplier.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="fileUpload">Archivo CSV/Excel</Label>
                <div className="border rounded-md p-4 mt-1">
                  <input
                    id="fileUpload"
                    type="file"
                    accept=".csv, .xlsx, .xls"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <Label
                    htmlFor="fileUpload"
                    className="flex flex-col items-center gap-2 cursor-pointer"
                  >
                    <Upload className="h-8 w-8 text-muted-foreground" />
                    <span className="text-sm font-medium">
                      {file ? file.name : "Seleccionar archivo"}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      El archivo debe contener columnas para código de proveedor y costo
                    </span>
                  </Label>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="hasHeaders"
                  checked={hasHeaders}
                  onChange={(e) => setHasHeaders(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <Label htmlFor="hasHeaders" className="text-sm">
                  El archivo tiene encabezados
                </Label>
              </div>
              
              {filePreview.length > 0 && (
                <div className="rounded-md border overflow-hidden">
                  <div className="text-sm font-medium p-2 bg-muted">
                    Vista previa del archivo
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          {hasHeaders 
                            ? Object.keys(filePreview[0]).map((key) => (
                                <th key={key} className="p-2 text-left">
                                  {key}
                                </th>
                              ))
                            : Array.from({ length: Object.keys(filePreview[0]).length }).map((_, i) => (
                                <th key={i} className="p-2 text-left">
                                  Columna {i + 1}
                                </th>
                              ))
                          }
                        </tr>
                      </thead>
                      <tbody>
                        {filePreview.map((row, rowIndex) => (
                          <tr key={rowIndex} className="border-b">
                            {Object.values(row).map((value: any, colIndex) => (
                              <td key={colIndex} className="p-2">
                                {value}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              
              <div className="text-xs text-muted-foreground">
                <span className="font-medium">Formato esperado:</span> El archivo debe contener una columna con el código
                de proveedor y otra con el nuevo costo.
                <button 
                  onClick={handleDownloadTemplate} 
                  className="text-primary flex items-center mt-1 gap-1 hover:underline"
                >
                  <ExternalLink className="h-3 w-3" />
                  Descargar plantilla
                </button>
              </div>
              
              <Button 
                onClick={handleUpdateByFile} 
                disabled={isLoading || !file}
                className="w-full"
              >
                {isLoading ? "Actualizando..." : "Actualizar Costos"}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
} 
