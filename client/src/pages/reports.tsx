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
  const [dateRange, setDateRange] = useState({ startDate: null, endDate: null });
  
  // Get sales data
  const { data: salesData, isLoading: isLoadingSales } = useQuery({
    queryKey: ["/api/sales"],
    retry: false,
  });
  
  // Handle export report
  const handleExportReport = () => {
    toast({
      title: "Exportación iniciada",
      description: "El reporte será descargado en breve",
    });
  };
  
  // Mock chart data (this would be calculated from real data in a production app)
  const salesByDayData = {
    labels: ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"],
    datasets: [
      {
        label: "Ventas por día",
        data: [4500, 3200, 5100, 4800, 7600, 8200, 6500],
        backgroundColor: "hsl(var(--chart-1))",
      },
    ],
  };
  
  const salesByCategoryData = {
    labels: ["Lácteos", "Pastelería", "Chocolate", "Harinas", "Otros"],
    datasets: [
      {
        label: "Ventas por categoría",
        data: [35, 25, 15, 10, 15],
        backgroundColor: [
          "hsl(var(--chart-1))",
          "hsl(var(--chart-2))",
          "hsl(var(--chart-3))",
          "hsl(var(--chart-4))",
          "hsl(var(--chart-5))",
        ],
        borderColor: ["#ffffff"],
        borderWidth: 1,
      },
    ],
  };
  
  const salesTrendData = {
    labels: ["Ene", "Feb", "Mar", "Abr", "May", "Jun"],
    datasets: [
      {
        label: "Ventas 2023",
        data: [65000, 59000, 80000, 81000, 56000, 85000],
        borderColor: "hsl(var(--chart-1))",
        backgroundColor: "transparent",
        tension: 0.2,
      },
    ],
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
                  <CardTitle>Datos Detallados</CardTitle>
                  <CardDescription>
                    Vista tabular de los datos del reporte
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center p-10 text-muted-foreground">
                    <p>Funcionalidad en desarrollo</p>
                    <p className="text-sm">Los reportes tabulares estarán disponibles próximamente</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
}
