import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Loader2, Download, TrendingUp, Banknote, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { BarChart, LineChart } from "@/components/ui/chart";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface ProfitReportProps {
  dateRange: {
    startDate: Date | null;
    endDate: Date | null;
  };
}

export function ProfitReport({ dateRange }: ProfitReportProps) {
  const { toast } = useToast();

  // Obtener datos del reporte de ganancias
  const { data: profitData, isLoading: isLoadingProfit } = useQuery({
    queryKey: ["/api/reports/profit", dateRange],
    queryFn: async () => {
      try {
        const startParam = dateRange.startDate ? `startDate=${dateRange.startDate.toISOString()}` : '';
        const endParam = dateRange.endDate ? `endDate=${dateRange.endDate.toISOString()}` : '';
        const params = [startParam, endParam].filter(Boolean).join('&');
        const url = `/api/reports/profit${params ? '?' + params : ''}`;
        const res = await fetch(url);
        return res.json();
      } catch (error) {
        console.error("Error al cargar datos de ganancias:", error);
        return { summary: { dailySales: [] }, salesDetails: [] };
      }
    },
    retry: false,
  });

  // Obtener datos de productos más rentables
  const { data: profitableProductsData, isLoading: isLoadingProfitableProducts } = useQuery({
    queryKey: ["/api/reports/profitable-products", dateRange],
    queryFn: async () => {
      try {
        const startParam = dateRange.startDate ? `startDate=${dateRange.startDate.toISOString()}` : '';
        const endParam = dateRange.endDate ? `endDate=${dateRange.endDate.toISOString()}` : '';
        const params = [startParam, endParam].filter(Boolean).join('&');
        const url = `/api/reports/profitable-products${params ? '?' + params : ''}`;
        const res = await fetch(url);
        return res.json();
      } catch (error) {
        console.error("Error al cargar datos de productos rentables:", error);
        return [];
      }
    },
    retry: false,
  });

  // Formatear datos para gráfico de barras de productos más rentables
  const productBarChartData = profitableProductsData && Array.isArray(profitableProductsData)
    ? {
        labels: profitableProductsData.slice(0, 10).map((product: any) => product.name),
        datasets: [
          {
            label: "Ganancia",
            data: profitableProductsData.slice(0, 10).map((product: any) => parseFloat(product.totalProfit.toFixed(2))),
            backgroundColor: "#10b981", // Verde para ganancias
          },
        ],
      }
    : null;

  // Formatear datos para gráfico de línea de ganancias diarias
  const dailyProfitChartData = profitData?.summary?.dailySales && Array.isArray(profitData.summary.dailySales)
    ? {
        labels: profitData.summary.dailySales.map((day: any) => day.date),
        datasets: [
          {
            label: "Ingresos",
            data: profitData.summary.dailySales.map((day: any) => parseFloat(day.revenue.toFixed(2))),
            borderColor: "#3b82f6", // Azul
          },
          {
            label: "Costos",
            data: profitData.summary.dailySales.map((day: any) => parseFloat(day.cost.toFixed(2))),
            borderColor: "#ef4444", // Rojo
          },
          {
            label: "Ganancias",
            data: profitData.summary.dailySales.map((day: any) => parseFloat(day.profit.toFixed(2))),
            borderColor: "#10b981", // Verde
          },
        ],
      }
    : null;

  // Manejar exportación del reporte
  const handleExportReport = () => {
    if (profitData && profitData.salesDetails.length > 0) {
      // Crear encabezados para CSV
      const headers = [
        "ID Venta", 
        "Fecha", 
        "Cliente", 
        "Costo Total", 
        "Venta Total", 
        "Ganancia Total", 
        "Margen (%)"
      ];
      
      // Crear contenido CSV
      let csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n";
      
      // Agregar filas
      profitData.salesDetails.forEach((sale: any) => {
        const row = [
          sale.id,
          new Date(sale.date).toLocaleDateString(),
          `"${sale.customer.replace(/"/g, '""')}"`, // Escapar comillas en CSV
          sale.totalCost.toFixed(2),
          sale.totalSell.toFixed(2),
          sale.totalProfit.toFixed(2),
          sale.profitMargin.toFixed(2),
        ];
        csvContent += row.join(",") + "\n";
      });
      
      // Crear enlace de descarga
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `reporte_ganancias_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      
      // Iniciar descarga
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "Exportación completada",
        description: "El reporte de ganancias ha sido descargado",
      });
    } else {
      toast({
        title: "No hay datos para exportar",
        description: "Seleccione un rango de fechas con datos",
        variant: "destructive",
      });
    }
  };

  if (isLoadingProfit || isLoadingProfitableProducts) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Resumen del Período */}
      {profitData && profitData.summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Ventas Totales</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{profitData.summary.totalSales || 0}</div>
              <p className="text-xs text-muted-foreground">
                Desde {format(new Date(profitData.summary.periodStart || new Date()), 'dd/MM/yyyy')} 
                hasta {format(new Date(profitData.summary.periodEnd || new Date()), 'dd/MM/yyyy')}
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Ingresos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${(profitData.summary.totalRevenue || 0).toFixed(2)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                <span className="inline-flex items-center text-green-500">
                  <Banknote className="h-3 w-3 mr-1" />
                  Valor total de ventas
                </span>
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Ganancias</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${(profitData.summary.totalProfit || 0).toFixed(2)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                <span className="inline-flex items-center text-green-500">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  Ganancia neta del período
                </span>
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Margen Promedio</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{(profitData.summary.averageProfitMargin || 0).toFixed(2)}%</div>
              <p className="text-xs text-muted-foreground mt-1">
                <span className="inline-flex items-center text-green-500">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  Margen de ganancia promedio
                </span>
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="flex justify-end">
        <Button onClick={handleExportReport}>
          <Download className="mr-2 h-4 w-4" />
          Exportar Reporte
        </Button>
      </div>

      <Tabs defaultValue="charts" className="w-full">
        <div className="border-b mb-4">
          <TabsList className="w-full justify-start">
            <TabsTrigger value="charts" className="flex items-center">
              <TrendingUp className="mr-2 h-4 w-4" />
              Gráficos
            </TabsTrigger>
            <TabsTrigger value="tables" className="flex items-center">
              <FileText className="mr-2 h-4 w-4" />
              Tablas
            </TabsTrigger>
          </TabsList>
        </div>
        
        <TabsContent value="charts" className="space-y-6">
          {/* Gráfico de Ganancias Diarias */}
          <Card>
            <CardHeader>
              <CardTitle>Ganancias Diarias</CardTitle>
              <CardDescription>
                Evolución de ingresos, costos y ganancias durante el período seleccionado
              </CardDescription>
            </CardHeader>
            <CardContent className="h-96">
              {dailyProfitChartData ? (
                <LineChart
                  data={dailyProfitChartData}
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-muted-foreground">No hay datos disponibles</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Gráfico de Productos Más Rentables */}
          <Card>
            <CardHeader>
              <CardTitle>Top 10 Productos Más Rentables</CardTitle>
              <CardDescription>
                Productos que generan mayor ganancia en el período seleccionado
              </CardDescription>
            </CardHeader>
            <CardContent className="h-96">
              {productBarChartData ? (
                <BarChart
                  data={productBarChartData}
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-muted-foreground">No hay datos disponibles</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="tables" className="space-y-6">
          {/* Tabla de Ventas con Detalles de Ganancias */}
          <Card>
            <CardHeader>
              <CardTitle>Detalles de Ventas y Ganancias</CardTitle>
              <CardDescription>
                Análisis detallado de ventas, costos y márgenes de ganancia
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead className="text-right">Costo</TableHead>
                    <TableHead className="text-right">Venta</TableHead>
                    <TableHead className="text-right">Ganancia</TableHead>
                    <TableHead className="text-right">Margen</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {profitData && profitData.salesDetails && Array.isArray(profitData.salesDetails) && profitData.salesDetails.length > 0 ? (
                    profitData.salesDetails.map((sale: any) => (
                      <TableRow key={sale.id}>
                        <TableCell>{sale.id}</TableCell>
                        <TableCell>{format(new Date(sale.date || new Date()), 'dd/MM/yyyy')}</TableCell>
                        <TableCell>{sale.customer || "Cliente sin nombre"}</TableCell>
                        <TableCell className="text-right">${(sale.totalCost || 0).toFixed(2)}</TableCell>
                        <TableCell className="text-right">${(sale.totalSell || 0).toFixed(2)}</TableCell>
                        <TableCell className="text-right font-medium">
                          <span className={(sale.totalProfit || 0) >= 0 ? "text-green-600" : "text-red-600"}>
                            ${(sale.totalProfit || 0).toFixed(2)}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge variant={(sale.profitMargin || 0) >= 20 ? "default" : ((sale.profitMargin || 0) >= 10 ? "secondary" : "destructive")}>
                            {(sale.profitMargin || 0).toFixed(2)}%
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-4">
                        No hay datos disponibles
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Tabla de Productos Más Rentables */}
          <Card>
            <CardHeader>
              <CardTitle>Productos Más Rentables</CardTitle>
              <CardDescription>
                Análisis detallado de productos por ganancia y margen
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Producto</TableHead>
                    <TableHead className="text-right">Cantidad</TableHead>
                    <TableHead className="text-right">Costo Total</TableHead>
                    <TableHead className="text-right">Venta Total</TableHead>
                    <TableHead className="text-right">Ganancia</TableHead>
                    <TableHead className="text-right">Margen</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {profitableProductsData && Array.isArray(profitableProductsData) && profitableProductsData.length > 0 ? (
                    profitableProductsData.map((product: any) => (
                      <TableRow key={product.id}>
                        <TableCell className="font-medium">{product.name || "Producto sin nombre"}</TableCell>
                        <TableCell className="text-right">{(product.totalQuantity || 0).toFixed(2)}</TableCell>
                        <TableCell className="text-right">${(product.totalCost || 0).toFixed(2)}</TableCell>
                        <TableCell className="text-right">${(product.totalRevenue || 0).toFixed(2)}</TableCell>
                        <TableCell className="text-right font-medium">
                          <span className={(product.totalProfit || 0) >= 0 ? "text-green-600" : "text-red-600"}>
                            ${(product.totalProfit || 0).toFixed(2)}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge variant={(product.profitMargin || 0) >= 20 ? "default" : ((product.profitMargin || 0) >= 10 ? "secondary" : "destructive")}>
                            {(product.profitMargin || 0).toFixed(2)}%
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-4">
                        No hay datos disponibles
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 
