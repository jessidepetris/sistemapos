import React from "react";
import { AlertCircle, BarChart, CheckCircle, DollarSign, Package, Receipt, ShoppingCart, TrendingUp, Users, CircleAlert } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import StatCard from "@/components/ui/stat-card";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export default function Dashboard() {
  const { user } = useAuth();
  
  // Fetch dashboard data
  const { data: stats, isLoading: isLoadingStats } = useQuery({
    queryKey: ["/api/dashboard/stats"],
    retry: false,
  });

  const { data: recentSales, isLoading: isLoadingRecentSales } = useQuery({
    queryKey: ["/api/dashboard/recent-sales"],
    retry: false,
  });

  const { data: inventoryAlerts, isLoading: isLoadingInventoryAlerts } = useQuery({
    queryKey: ["/api/dashboard/inventory-alerts"],
    retry: false,
  });

  const { data: recentActivity, isLoading: isLoadingRecentActivity } = useQuery({
    queryKey: ["/api/dashboard/recent-activity"],
    retry: false,
  });

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title="Panel Principal" />
        
        <main className="flex-1 overflow-y-auto p-6">
          {/* Dashboard stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <StatCard
              title="Ventas Hoy"
              value={stats?.todaySales?.total || "$0"}
              change={stats?.todaySales?.change || "0%"}
              trend={stats?.todaySales?.trend || "neutral"}
              icon={<DollarSign className="h-5 w-5" />}
              color="blue"
            />
            
            <StatCard
              title="Transacciones"
              value={stats?.transactions?.count || "0"}
              change={stats?.transactions?.change || "0%"}
              trend={stats?.transactions?.trend || "neutral"}
              icon={<Receipt className="h-5 w-5" />}
              color="indigo"
            />
            
            <StatCard
              title="Productos Bajos"
              value={stats?.lowStock?.count || "0"}
              change=""
              trend="neutral"
              icon={<Package className="h-5 w-5" />}
              color="yellow"
              alert={stats?.lowStock?.count > 0}
            />
            
            <StatCard
              title="Clientes Nuevos"
              value={stats?.newCustomers?.count || "0"}
              change=""
              trend="neutral"
              icon={<Users className="h-5 w-5" />}
              color="green"
            />
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recent sales */}
            <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-slate-200">
              <div className="p-4 border-b border-slate-200 flex items-center justify-between">
                <h3 className="font-medium">Ventas Recientes</h3>
                <Button variant="link" className="text-sm" onClick={() => window.location.href = "/invoices"}>Ver Todas</Button>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-50 text-left">
                      <th className="p-4 text-xs font-medium text-slate-500">ID</th>
                      <th className="p-4 text-xs font-medium text-slate-500">CLIENTE</th>
                      <th className="p-4 text-xs font-medium text-slate-500">PRODUCTOS</th>
                      <th className="p-4 text-xs font-medium text-slate-500">TOTAL</th>
                      <th className="p-4 text-xs font-medium text-slate-500">FECHA</th>
                      <th className="p-4 text-xs font-medium text-slate-500">ESTADO</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoadingRecentSales ? (
                      <tr>
                        <td colSpan={6} className="p-4 text-center">Cargando ventas recientes...</td>
                      </tr>
                    ) : recentSales && recentSales.length > 0 ? (
                      recentSales.map((sale: any) => (
                        <tr key={sale.id} className="border-t border-slate-200 hover:bg-slate-50">
                          <td className="p-4 text-sm font-mono">#{sale.id}</td>
                          <td className="p-4 text-sm">{sale.customer}</td>
                          <td className="p-4 text-sm">{sale.items} productos</td>
                          <td className="p-4 text-sm font-medium">${sale.total.toFixed(2)}</td>
                          <td className="p-4 text-sm text-slate-500">{new Date(sale.timestamp).toLocaleString()}</td>
                          <td className="p-4">
                            <Badge variant={sale.status === 'completed' ? 'success' : sale.status === 'pending' ? 'warning' : 'default'}>
                              {sale.status === 'completed' ? 'Completado' : 
                               sale.status === 'pending' ? 'Pendiente' : 
                               sale.status === 'processing' ? 'En proceso' : sale.status}
                            </Badge>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="p-4 text-center">No hay ventas recientes</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              
              <div className="p-4 border-t border-slate-200 text-center">
                <Button variant="ghost" className="text-sm text-slate-500">Cargar más ventas</Button>
              </div>
            </div>
            
            {/* Inventory alerts and activity */}
            <div className="lg:col-span-1 space-y-6">
              {/* Inventory alerts */}
              <Card>
                <div className="p-4 border-b border-slate-200 flex items-center justify-between">
                  <h3 className="font-medium">Alertas de Inventario</h3>
                  <Button variant="link" className="text-sm" onClick={() => window.location.href = "/products"}>Ver Todas</Button>
                </div>
                
                <CardContent className="p-4 space-y-4">
                  {isLoadingInventoryAlerts ? (
                    <p className="text-center">Cargando alertas...</p>
                  ) : inventoryAlerts && inventoryAlerts.length > 0 ? (
                    inventoryAlerts.map((alert: any) => (
                      <div key={alert.id} className="border-b border-slate-100 pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-start gap-3">
                            <div className={`p-2 rounded-full ${alert.level === 'critical' ? 'bg-red-100 text-red-600' : 'bg-yellow-100 text-yellow-600'} mt-1`}>
                              {alert.level === 'critical' ? <AlertCircle className="h-4 w-4" /> : <CircleAlert className="h-4 w-4" />}
                            </div>
                            <div>
                              <p className="text-sm font-medium">{alert.product}</p>
                              <p className="text-xs text-slate-500">Stock bajo: {alert.stock} {alert.unit}</p>
                            </div>
                          </div>
                          <Button variant="outline" size="sm" className="text-xs" 
                              onClick={() => window.location.href = "/orders"}>
                            Pedir
                          </Button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-sm text-slate-500">No hay alertas de inventario</p>
                  )}
                </CardContent>
              </Card>
              
              {/* Recent activity */}
              <Card>
                <div className="p-4 border-b border-slate-200">
                  <h3 className="font-medium">Actividad Reciente</h3>
                </div>
                
                <CardContent className="p-4 space-y-4">
                  {isLoadingRecentActivity ? (
                    <p className="text-center">Cargando actividad...</p>
                  ) : recentActivity && recentActivity.length > 0 ? (
                    recentActivity.map((activity: any) => (
                      <div key={activity.id} className="flex items-start gap-3">
                        <div className={`p-2 rounded-full ${
                          activity.type === 'sale' ? 'bg-blue-100 text-blue-600' :
                          activity.type === 'inventory' ? 'bg-green-100 text-green-600' :
                          activity.type === 'price' ? 'bg-purple-100 text-purple-600' :
                          'bg-orange-100 text-orange-600'
                        } mt-1`}>
                          {activity.type === 'sale' ? <Receipt className="h-4 w-4" /> :
                           activity.type === 'inventory' ? <Package className="h-4 w-4" /> :
                           activity.type === 'price' ? <DollarSign className="h-4 w-4" /> :
                           <Users className="h-4 w-4" />}
                        </div>
                        <div>
                          <p className="text-sm">
                            <span className="font-medium">{activity.user}</span> {activity.action}
                          </p>
                          <p className="text-xs text-slate-500">{activity.timeAgo}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-sm text-slate-500">No hay actividad reciente</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
          
          {/* Quick actions */}
          <div className="mt-6">
            <h3 className="text-lg font-medium mb-4">Acciones Rápidas</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <Card className="p-4 hover:shadow-md transition-shadow flex flex-col items-center justify-center text-center cursor-pointer"
                onClick={() => window.location.href = "/pos"}>
                <ShoppingCart className="text-primary text-2xl mb-2" />
                <span className="text-sm font-medium">Nueva Venta</span>
              </Card>
              
              <Card className="p-4 hover:shadow-md transition-shadow flex flex-col items-center justify-center text-center cursor-pointer"
                onClick={() => window.location.href = "/products"}>
                <Package className="text-primary text-2xl mb-2" />
                <span className="text-sm font-medium">Nuevo Producto</span>
              </Card>
              
              <Card className="p-4 hover:shadow-md transition-shadow flex flex-col items-center justify-center text-center cursor-pointer"
                onClick={() => window.location.href = "/customers"}>
                <Users className="text-primary text-2xl mb-2" />
                <span className="text-sm font-medium">Nuevo Cliente</span>
              </Card>
              
              <Card className="p-4 hover:shadow-md transition-shadow flex flex-col items-center justify-center text-center cursor-pointer"
                onClick={() => window.location.href = "/suppliers"}>
                <TrendingUp className="text-primary text-2xl mb-2" />
                <span className="text-sm font-medium">Nuevo Proveedor</span>
              </Card>
              
              <Card className="p-4 hover:shadow-md transition-shadow flex flex-col items-center justify-center text-center cursor-pointer"
                onClick={() => window.location.href = "/credit-notes"}>
                <Receipt className="text-primary text-2xl mb-2" />
                <span className="text-sm font-medium">Notas Crédito/Débito</span>
              </Card>
              
              <Card className="p-4 hover:shadow-md transition-shadow flex flex-col items-center justify-center text-center cursor-pointer"
                onClick={() => window.location.href = "/accounts"}>
                <BarChart className="text-primary text-2xl mb-2" />
                <span className="text-sm font-medium">Cuentas Corrientes</span>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
