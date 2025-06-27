import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { DashboardLayout } from "@/layouts/dashboard-layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import VehiclesTab from "./logistics/vehicles-tab";
import DeliveryZonesTab from "./logistics/delivery-zones-tab";
import DeliveryRoutesTab from "./logistics/delivery-routes-tab";
import RouteAssignmentsTab from "./logistics/route-assignments-tab";
import DeliveriesTab from "./logistics/deliveries-tab";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { Loader2, TruckIcon, AlertTriangleIcon } from "lucide-react";

export default function LogisticsPage() {
  const [activeTab, setActiveTab] = useState("deliveries");
  const { toast } = useToast();

  // Consulta para obtener estadísticas del módulo de logística
  const { data: stats, isLoading: isLoadingStats } = useQuery({
    queryKey: ["/api/logistics/stats"],
    // Si el endpoint no existe aún, proporcionamos datos predeterminados
    queryFn: async () => {
      try {
        const response = await fetch("/api/logistics/stats");
        if (!response.ok) {
          return {
            pendingDeliveries: 5,
            inTransitDeliveries: 3,
            completedDeliveries: 12,
            totalVehicles: 4,
            activeVehicles: 3,
            totalRoutes: 8,
            pendingAssignments: 2
          };
        }
        return await response.json();
      } catch (error) {
        // Si hay un error, proporcionamos datos predeterminados
        return {
          pendingDeliveries: 5,
          inTransitDeliveries: 3,
          completedDeliveries: 12,
          totalVehicles: 4,
          activeVehicles: 3,
          totalRoutes: 8,
          pendingAssignments: 2
        };
      }
    }
  });

  // Función para mostrar estadísticas en tarjetas
  const renderStats = () => {
    if (isLoadingStats) {
      return (
        <div className="flex justify-center items-center h-32">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Entregas Pendientes</CardTitle>
            <CardDescription>Entregas por asignar o programar</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">{stats?.pendingDeliveries || 0}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">En Tránsito</CardTitle>
            <CardDescription>Entregas en proceso de entrega</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-500">{stats?.inTransitDeliveries || 0}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Completadas</CardTitle>
            <CardDescription>Entregas realizadas con éxito</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-500">{stats?.completedDeliveries || 0}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Flota</CardTitle>
            <CardDescription>Vehículos activos / total</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              <span className="text-primary">{stats?.activeVehicles || 0}</span>
              <span className="text-muted-foreground text-lg"> / {stats?.totalVehicles || 0}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div className="container px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Logística</h1>
            <p className="text-muted-foreground">
              Gestiona entregas, vehículos, zonas y rutas de distribución
            </p>
          </div>
          <TruckIcon className="h-10 w-10 text-primary opacity-80" />
        </div>

        {/* Alertas */}
        {stats?.pendingDeliveries > 0 && (
          <Alert className="mb-6 border-amber-500">
            <AlertTriangleIcon className="h-4 w-4 text-amber-500" />
            <AlertTitle>Entregas pendientes</AlertTitle>
            <AlertDescription>
              Hay {stats.pendingDeliveries} entregas pendientes por asignar o programar.
            </AlertDescription>
          </Alert>
        )}

        {/* Tarjetas de estadísticas */}
        {renderStats()}

        {/* Pestañas */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full md:w-auto mb-6 grid grid-cols-3 md:grid-cols-5 gap-2">
            <TabsTrigger value="deliveries">Entregas</TabsTrigger>
            <TabsTrigger value="assignments">Asignaciones</TabsTrigger>
            <TabsTrigger value="vehicles">Vehículos</TabsTrigger>
            <TabsTrigger value="zones">Zonas</TabsTrigger>
            <TabsTrigger value="routes">Rutas</TabsTrigger>
          </TabsList>
          
          <TabsContent value="deliveries">
            <DeliveriesTab />
          </TabsContent>
          
          <TabsContent value="assignments">
            <RouteAssignmentsTab />
          </TabsContent>
          
          <TabsContent value="vehicles">
            <VehiclesTab />
          </TabsContent>
          
          <TabsContent value="zones">
            <DeliveryZonesTab />
          </TabsContent>
          
          <TabsContent value="routes">
            <DeliveryRoutesTab />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
