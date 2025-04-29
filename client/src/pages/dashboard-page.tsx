import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { DashboardLayout } from "@/layouts/dashboard-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowUp,
  ArrowDown,
  DollarSign,
  Package,
  Users,
  AlertTriangle,
  ScanBarcode,
  PackageOpen,
  UserPlus,
  LineChart,
  Snowflake
} from "lucide-react";
import { Product, Sale, Customer } from "@shared/schema";

export default function DashboardPage() {
  // Fetch dashboard data
  const { 
    data: lowStockProducts, 
    isLoading: isLoadingLowStock 
  } = useQuery<Product[]>({
    queryKey: ["/api/products/low-stock"],
  });
  
  // Fetch recent sales
  const { 
    data: recentSales, 
    isLoading: isLoadingRecentSales 
  } = useQuery<Sale[]>({
    queryKey: ["/api/sales/recent"],
  });
  
  // Fetch dashboard stats
  const {
    data: dashboardStats,
    isLoading: isLoadingStats
  } = useQuery<{
    todaySales?: {
      total: string;
      trend: "up" | "down" | "neutral";
      change: string;
    };
    transactions?: {
      count: string;
      trend: "up" | "down" | "neutral";
      change: string;
    };
    lowStock?: {
      count: string;
    };
  }>({
    queryKey: ["/api/dashboard/stats"],
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    staleTime: 30000 // Considerar los datos obsoletos después de 30 segundos
  });
  
  return (
    <DashboardLayout
      title="Dashboard"
      description="Resumen del sistema"
    >
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 gap-4 mb-6">
        <StatCard 
          title="Ventas de Hoy"
          value={dashboardStats?.todaySales?.total || "$0"}
          changeType={dashboardStats?.todaySales?.trend === "up" ? "increase" : dashboardStats?.todaySales?.trend === "down" ? "decrease" : "neutral"}
          changeValue={dashboardStats?.todaySales?.change || "0%"}
          changeLabel="vs. ayer"
          icon={<DollarSign className="h-5 w-5" />}
          color="primary"
        />
        
        <StatCard 
          title="Productos Vendidos"
          value={dashboardStats?.transactions?.count || "0"}
          changeType={dashboardStats?.transactions?.trend === "up" ? "increase" : dashboardStats?.transactions?.trend === "down" ? "decrease" : "neutral"}
          changeValue={dashboardStats?.transactions?.change || "0%"}
          changeLabel="vs. ayer"
          icon={<Package className="h-5 w-5" />}
          color="secondary"
        />
        
        <StatCard 
          title="Stock Bajo"
          value={dashboardStats?.lowStock?.count || lowStockProducts ? lowStockProducts.length.toString() : "0"}
          changeType="neutral"
          changeValue=""
          changeLabel="productos"
          icon={<AlertTriangle className="h-5 w-5" />}
          color="red"
        />
      </div>
      
      {/* Recent Sales & Low Stock */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Recent Sales Table */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-neutral-100 overflow-hidden">
          <div className="p-4 border-b border-neutral-100 flex justify-between items-center">
            <h2 className="font-semibold text-neutral-800">Ventas Recientes</h2>
            <Button variant="link" size="sm" asChild>
              <Link href="/reports">Ver Todas</Link>
            </Button>
          </div>
          <div className="overflow-x-auto">
            {isLoadingRecentSales ? (
              <RecentSalesSkeleton />
            ) : (
              <RecentSalesTable sales={recentSales || []} />
            )}
          </div>
        </div>
        
        {/* Low Stock List */}
        <div className="bg-white rounded-lg shadow-sm border border-neutral-100 overflow-hidden">
          <div className="p-4 border-b border-neutral-100 flex justify-between items-center">
            <h2 className="font-semibold text-neutral-800">Productos con Stock Bajo</h2>
            <Button variant="link" size="sm" asChild>
              <Link href="/products">Ver Todos</Link>
            </Button>
          </div>
          <div className="overflow-y-auto max-h-80">
            {isLoadingLowStock ? (
              <LowStockSkeleton />
            ) : (
              <LowStockList products={lowStockProducts || []} />
            )}
          </div>
        </div>
      </div>
      
      {/* Quick Access Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <QuickAccessCard 
          title="Nueva Venta"
          description="Crear una nueva transacción de venta"
          icon={<ScanBarcode className="h-6 w-6" />}
          path="/pos"
          color="primary"
        />
        
        <QuickAccessCard 
          title="Añadir Producto"
          description="Agregar un nuevo producto al catálogo"
          icon={<PackageOpen className="h-6 w-6" />}
          path="/products"
          color="secondary"
        />
        
        <QuickAccessCard 
          title="Nuevo Cliente"
          description="Registrar un nuevo cliente en el sistema"
          icon={<UserPlus className="h-6 w-6" />}
          path="/customers"
          color="green"
        />
        
        <QuickAccessCard 
          title="Reportes"
          description="Acceder a informes y estadísticas"
          icon={<LineChart className="h-6 w-6" />}
          path="/reports"
          color="blue"
        />
      </div>
    </DashboardLayout>
  );
}

// Stat Card Component
interface StatCardProps {
  title: string;
  value: string;
  changeType: "increase" | "decrease" | "neutral";
  changeValue: string;
  changeLabel: string;
  icon: React.ReactNode;
  color: "primary" | "secondary" | "green" | "red";
}

function StatCard({ title, value, changeType, changeValue, changeLabel, icon, color }: StatCardProps) {
  const colorMap = {
    primary: "bg-primary-100 text-primary-600",
    secondary: "bg-secondary-100 text-secondary-600",
    green: "bg-green-100 text-green-600",
    red: "bg-red-100 text-red-600"
  };
  
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-neutral-800 mb-1">{title}</p>
            <p className="text-2xl font-semibold font-mono">{value}</p>
          </div>
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${colorMap[color]}`}>
            {icon}
          </div>
        </div>
        <div className="flex items-center mt-3 text-xs">
          <span className={`flex items-center ${changeType === 'increase' ? 'text-green-600' : changeType === 'decrease' ? 'text-red-600' : 'text-neutral-800'}`}>
            {changeType === 'increase' ? (
              <ArrowUp className="mr-1 h-3 w-3" />
            ) : changeType === 'decrease' ? (
              <ArrowDown className="mr-1 h-3 w-3" />
            ) : null}
            {changeValue}
          </span>
          <span className="ml-2 text-neutral-800">{changeLabel}</span>
        </div>
      </CardContent>
    </Card>
  );
}

// Recent Sales Table Component
function RecentSalesTable({ sales }: { sales: Sale[] }) {
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="bg-neutral-50">
          <th className="px-4 py-3 text-left font-medium text-neutral-800">Nº</th>
          <th className="px-4 py-3 text-left font-medium text-neutral-800">Cliente</th>
          <th className="px-4 py-3 text-left font-medium text-neutral-800">Productos</th>
          <th className="px-4 py-3 text-right font-medium text-neutral-800">Total</th>
          <th className="px-4 py-3 text-center font-medium text-neutral-800">Estado</th>
        </tr>
      </thead>
      <tbody>
        {sales.length > 0 ? (
          sales.map((sale) => (
            <tr key={sale.id} className="border-b border-neutral-100 last:border-0">
              <td className="px-4 py-3 font-mono">#{sale.receiptNumber}</td>
              <td className="px-4 py-3">Cliente #{sale.customerId || "N/A"}</td>
              <td className="px-4 py-3">- items</td>
              <td className="px-4 py-3 text-right font-mono">${parseFloat(sale.total.toString()).toFixed(2)}</td>
              <td className="px-4 py-3">
                <span className={`inline-flex items-center justify-center px-2 py-1 text-xs rounded-full ${
                  sale.status === 'completed' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-orange-100 text-orange-800'
                }`}>
                  {sale.status === 'completed' ? 'Completado' : 'Pendiente'}
                </span>
              </td>
            </tr>
          ))
        ) : (
          <tr>
            <td colSpan={5} className="px-4 py-6 text-center text-neutral-600">
              No hay ventas recientes
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
}

// Low Stock List Component
function LowStockList({ products }: { products: Product[] }) {
  return (
    <ul className="divide-y divide-neutral-100">
      {products.length > 0 ? (
        products.map((product) => (
          <li key={product.id} className="p-4">
            <div className="flex items-center">
              <div className={`h-10 w-10 ${product.isRefrigerated ? 'bg-blue-100' : 'bg-neutral-100'} rounded-md flex items-center justify-center ${
                product.isRefrigerated ? 'text-blue-500' : 'text-neutral-800'
              }`}>
                {product.isRefrigerated ? (
                  <Snowflake className="h-5 w-5" />
                ) : (
                  <Package className="h-5 w-5" />
                )}
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm font-medium text-neutral-800">{product.name}</p>
                <div className="flex items-center mt-1">
                  <div className="text-xs text-neutral-800">
                    Stock: <span className="font-medium text-red-600">{product.stock.toString()}</span>
                  </div>
                  <div className="mx-2 w-1 h-1 rounded-full bg-neutral-300"></div>
                  <div className="text-xs text-neutral-800">
                    Mínimo: <span className="font-medium">{product.minStock?.toString() || '0'}</span>
                  </div>
                </div>
              </div>
              <Button size="sm">
                Reponer
              </Button>
            </div>
          </li>
        ))
      ) : (
        <li className="p-6 text-center text-neutral-600">
          No hay productos con stock bajo
        </li>
      )}
    </ul>
  );
}

// Quick Access Card Component
interface QuickAccessCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  path: string;
  color: "primary" | "secondary" | "green" | "blue";
}

function QuickAccessCard({ title, description, icon, path, color }: QuickAccessCardProps) {
  const colorMap = {
    primary: "bg-primary-100 text-primary-600",
    secondary: "bg-secondary-100 text-secondary-600",
    green: "bg-green-100 text-green-600",
    blue: "bg-blue-100 text-blue-600"
  };
  
  return (
    <Link href={path}>
      <a className="bg-white rounded-lg shadow-sm p-5 border border-neutral-100 flex flex-col items-center justify-center hover:shadow-md transition-shadow cursor-pointer">
        <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 ${colorMap[color]}`}>
          {icon}
        </div>
        <h3 className="font-medium text-neutral-800 mb-1">{title}</h3>
        <p className="text-xs text-neutral-800 text-center">{description}</p>
      </a>
    </Link>
  );
}

// Skeleton loaders
function RecentSalesSkeleton() {
  return (
    <div className="px-4 py-2">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="py-3 flex items-center justify-between border-b border-neutral-100 last:border-0">
          <div className="flex items-center gap-4">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-32" />
          </div>
          <div className="flex items-center gap-4">
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

function LowStockSkeleton() {
  return (
    <div className="p-4 space-y-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-md" />
          <div className="flex-1">
            <Skeleton className="h-4 w-40 mb-2" />
            <Skeleton className="h-3 w-32" />
          </div>
          <Skeleton className="h-8 w-20 rounded" />
        </div>
      ))}
    </div>
  );
}
