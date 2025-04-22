import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { BarChart, PieChart, LineChart } from "@/components/ui/chart";
import { BarChart3, Download, FileText, LineChart as LineChartIcon, PieChart as PieChartIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function ReportsPage() {
  const { toast } = useToast();
  const [reportType, setReportType] = useState("sales");
  const [dateRange, setDateRange] = useState<{ startDate: Date | null, endDate: Date | null }>({ startDate: null, endDate: null });
  
  // Get sales data for reference
  const { data: salesData } = useQuery({
    queryKey: ["/api/sales"],
    retry: false,
  });

  // Get report data
  const { data: salesByDayData, isLoading: isLoadingSalesByDay } = useQuery({
    queryKey: ["/api/reports/sales-by-day", dateRange],
    queryFn: async () => {
      const startParam = dateRange.startDate ? `startDate=${dateRange.startDate.toISOString()}` : '';
      const endParam = dateRange.endDate ? `endDate=${dateRange.endDate.toISOString()}` : '';
      const params = [startParam, endParam].filter(Boolean).join('&');
      const url = `/api/reports/sales-by-day${params ? '?' + params : ''}`;
      const res = await fetch(url);
      return res.json();
    },
    retry: false,
  });
  
  const { data: salesByCategoryData, isLoading: isLoadingSalesByCategory } = useQuery({
    queryKey: ["/api/reports/sales-by-category", dateRange],
    queryFn: async () => {
      const startParam = dateRange.startDate ? `startDate=${dateRange.startDate.toISOString()}` : '';
      const endParam = dateRange.endDate ? `endDate=${dateRange.endDate.toISOString()}` : '';
      const params = [startParam, endParam].filter(Boolean).join('&');
      const url = `/api/reports/sales-by-category${params ? '?' + params : ''}`;
      const res = await fetch(url);
      return res.json();
    },
    retry: false,
  });
  
  const { data: salesTrendData, isLoading: isLoadingSalesTrend } = useQuery({
    queryKey: ["/api/reports/sales-trend", dateRange],
    queryFn: async () => {
      const startParam = dateRange.startDate ? `startDate=${dateRange.startDate.toISOString()}` : '';
      const endParam = dateRange.endDate ? `endDate=${dateRange.endDate.toISOString()}` : '';
      const params = [startParam, endParam].filter(Boolean).join('&');
      const url = `/api/reports/sales-trend${params ? '?' + params : ''}`;
      const res = await fetch(url);
      return res.json();
    },
    retry: false,
  });
  
  const { data: inventoryStatusData, isLoading: isLoadingInventoryStatus } = useQuery({
    queryKey: ["/api/reports/inventory-status"],
    retry: false,
  });
  
  const { data: salesDetailData, isLoading: isLoadingSalesDetail } = useQuery({
    queryKey: ["/api/reports/sales-detail", dateRange],
    queryFn: async () => {
      const startParam = dateRange.startDate ? `startDate=${dateRange.startDate.toISOString()}` : '';
      const endParam = dateRange.endDate ? `endDate=${dateRange.endDate.toISOString()}` : '';
      const params = [startParam, endParam].filter(Boolean).join('&');
      const url = `/api/reports/sales-detail${params ? '?' + params : ''}`;
      const res = await fetch(url);
      return res.json();
    },
    retry: false,
  });
  
  // Handle export report
  const handleExportReport = () => {
    // Create a CSV string for sales detail
    if (salesDetailData && salesDetailData.length > 0) {
      const headers = ["ID", "Fecha", "Cliente", "Total", "Artículos", "Estado"];
      
      // Create CSV content
      let csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n";
      
      // Add rows
      salesDetailData.forEach((sale: any) => {
        const row = [
          sale.id,
          sale.date,
          `"${sale.customer.replace(/"/g, '""')}"`, // Escape quotes in CSV
          sale.total,
          sale.items,
          sale.status
        ];
        csvContent += row.join(",") + "\n";
      });
      
      // Create download link
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `reporte_ventas_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      
      // Trigger download
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "Exportación completada",
        description: "El reporte ha sido descargado",
      });
    } else {
      toast({
        title: "No hay datos para exportar",
        description: "Seleccione un rango de fechas con datos",
        variant: "destructive",
      });
    }
  };
  
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title="Reportes" />
        
        <main className="flex-1 overflow-auto p-6">
          <Card className="mb-6">
            <CardHeader className="pb-3">
              <CardTitle>Filtros del Reporte</CardTitle>
              <CardDescription>
                Seleccione el tipo de reporte y el período de tiempo
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Tipo de Reporte</label>
                  <Select value={reportType} onValueChange={setReportType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sales">Ventas</SelectItem>
                      <SelectItem value="products">Productos</SelectItem>
                      <SelectItem value="customers">Clientes</SelectItem>
                      <SelectItem value="inventory">Inventario</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-1 block">Fecha Inicio</label>
                  <DatePicker 
                    value={dateRange.startDate}
                    onChange={(date) => setDateRange({ ...dateRange, startDate: date })}
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-1 block">Fecha Fin</label>
                  <DatePicker 
                    value={dateRange.endDate}
                    onChange={(date) => setDateRange({ ...dateRange, endDate: date })}
                  />
                </div>
                
                <div className="flex items-end">
                  <Button className="w-full" onClick={handleExportReport}>
                    <Download className="mr-2 h-4 w-4" />
                    Exportar Reporte
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Tabs defaultValue="charts" className="w-full">
            <div className="border-b mb-4">
              <TabsList className="w-full justify-start">
                <TabsTrigger value="charts" className="flex items-center">
                  <BarChart3 className="mr-2 h-4 w-4" />
                  Gráficos
                </TabsTrigger>
                <TabsTrigger value="tables" className="flex items-center">
                  <FileText className="mr-2 h-4 w-4" />
                  Tablas
                </TabsTrigger>
              </TabsList>
            </div>
            
            <TabsContent value="charts" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">Ventas por Día</CardTitle>
                      <BarChart3 className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <BarChart data={salesByDayData} />
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">Ventas por Categoría</CardTitle>
                      <PieChartIcon className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <PieChart data={salesByCategoryData} />
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">Tendencia de Ventas</CardTitle>
                    <LineChartIcon className="h-4 w-4 text-muted-foreground" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <LineChart data={salesTrendData} />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="tables" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Datos Detallados de Ventas</CardTitle>
                  <CardDescription>
                    Listado detallado de ventas en el período seleccionado
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoadingSalesDetail ? (
                    <div className="flex justify-center items-center h-60">
                      <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
                    </div>
                  ) : salesDetailData && salesDetailData.length > 0 ? (
                    <div className="border rounded-md overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="bg-muted">
                              <th className="py-3 px-4 text-left font-medium text-sm">ID</th>
                              <th className="py-3 px-4 text-left font-medium text-sm">Fecha</th>
                              <th className="py-3 px-4 text-left font-medium text-sm">Cliente</th>
                              <th className="py-3 px-4 text-left font-medium text-sm">Total</th>
                              <th className="py-3 px-4 text-left font-medium text-sm">Artículos</th>
                              <th className="py-3 px-4 text-left font-medium text-sm">Estado</th>
                            </tr>
                          </thead>
                          <tbody>
                            {salesDetailData.map((sale: any) => (
                              <tr key={sale.id} className="border-t hover:bg-muted/50">
                                <td className="py-3 px-4">{sale.id}</td>
                                <td className="py-3 px-4">{sale.date}</td>
                                <td className="py-3 px-4">{sale.customer}</td>
                                <td className="py-3 px-4">${sale.total}</td>
                                <td className="py-3 px-4">{sale.items}</td>
                                <td className="py-3 px-4">
                                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                    sale.status === 'completed' 
                                      ? 'bg-green-100 text-green-800' 
                                      : sale.status === 'pending' 
                                        ? 'bg-yellow-100 text-yellow-800' 
                                        : 'bg-gray-100 text-gray-800'
                                  }`}>
                                    {sale.status === 'completed' ? 'Completada' : 
                                     sale.status === 'pending' ? 'Pendiente' : 
                                     sale.status === 'cancelled' ? 'Cancelada' : 
                                     sale.status}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center p-10 text-muted-foreground">
                      <p>No hay datos para mostrar</p>
                      <p className="text-sm">Seleccione un rango de fechas diferente o verifique que existan ventas</p>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              {reportType === "inventory" && (
                <Card>
                  <CardHeader>
                    <CardTitle>Estado del Inventario</CardTitle>
                    <CardDescription>
                      Resumen del estado actual del inventario
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isLoadingInventoryStatus ? (
                      <div className="flex justify-center items-center h-60">
                        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
                      </div>
                    ) : inventoryStatusData ? (
                      <div className="h-80">
                        <PieChart data={inventoryStatusData} />
                      </div>
                    ) : (
                      <div className="text-center p-10 text-muted-foreground">
                        <p>No hay datos de inventario disponibles</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
}
