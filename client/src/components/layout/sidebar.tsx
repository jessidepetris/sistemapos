import { useEffect, useState } from "react";
import { useLocation, Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import {
  BarChart,
  CreditCard,
  FileText,
  Home,
  LogOut,
  Package,
  Settings,
  ShoppingCart,
  Truck,
  Users,
  DollarSign,
  ClipboardList,
  FileEdit
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

interface SidebarLinkProps {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  currentPath: string;
  onClick?: () => void;
}

const SidebarLink = ({ href, icon, children, currentPath, onClick }: SidebarLinkProps) => {
  const isActive = currentPath === href;
  
  return (
    <Link href={href}>
      <div
        className={cn(
          "flex items-center gap-3 px-4 py-2 text-sm hover:bg-slate-50 transition-colors pl-6 cursor-pointer",
          isActive && "bg-primary/10 text-primary border-l-3 border-primary"
        )}
        onClick={onClick}
      >
        <span className={cn("text-slate-400", isActive && "text-primary")}>
          {icon}
        </span>
        <span>{children}</span>
      </div>
    </Link>
  );
};

export default function Sidebar() {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();
  const isMobile = useIsMobile();
  const [isOpen, setIsOpen] = useState(false);

  // Close sidebar on navigation in mobile
  useEffect(() => {
    if (isMobile) {
      setIsOpen(false);
    } else {
      setIsOpen(true);
    }
  }, [location, isMobile]);

  const closeSidebar = () => {
    if (isMobile) {
      setIsOpen(false);
    }
  };

  const handleLogout = () => {
    logoutMutation.mutate();
  };
  
  if (!user) return null;

  return (
    <>
      {/* Mobile overlay */}
      {isMobile && isOpen && (
        <div 
          className="fixed inset-0 bg-black/30 z-40"
          onClick={() => setIsOpen(false)}
        ></div>
      )}
      
      <div 
        className={cn(
          "bg-white shadow-md h-full flex-shrink-0 z-50",
          isMobile ? "fixed w-64" : "w-64",
          isMobile && !isOpen && "hidden"
        )}
      >
        <div className="p-4 border-b border-slate-200">
          <h1 className="font-semibold text-xl text-primary">Punto Pastelero</h1>
        </div>
        
        {/* User info */}
        <div className="p-4 border-b border-slate-200 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <p className="font-medium">{user.fullName}</p>
            <p className="text-xs text-slate-500 capitalize">{user.role}</p>
          </div>
        </div>
        
        {/* Navigation */}
        <nav className="py-2">
          <div className="px-4 py-2 text-xs font-semibold text-slate-500">PRINCIPAL</div>
          <SidebarLink href="/" icon={<Home className="h-4 w-4" />} currentPath={location} onClick={closeSidebar}>
            Panel Principal
          </SidebarLink>
          <SidebarLink href="/pos" icon={<ShoppingCart className="h-4 w-4" />} currentPath={location} onClick={closeSidebar}>
            Punto de Venta
          </SidebarLink>
          
          <div className="px-4 py-2 text-xs font-semibold text-slate-500 mt-2">INVENTARIO</div>
          <SidebarLink href="/products" icon={<Package className="h-4 w-4" />} currentPath={location} onClick={closeSidebar}>
            Productos
          </SidebarLink>
          <SidebarLink href="/suppliers" icon={<Truck className="h-4 w-4" />} currentPath={location} onClick={closeSidebar}>
            Proveedores
          </SidebarLink>
          
          <div className="px-4 py-2 text-xs font-semibold text-slate-500 mt-2">CLIENTES</div>
          <SidebarLink href="/customers" icon={<Users className="h-4 w-4" />} currentPath={location} onClick={closeSidebar}>
            Clientes
          </SidebarLink>
          <SidebarLink href="/accounts" icon={<CreditCard className="h-4 w-4" />} currentPath={location} onClick={closeSidebar}>
            Cuentas Corrientes
          </SidebarLink>
          
          <div className="px-4 py-2 text-xs font-semibold text-slate-500 mt-2">DOCUMENTOS</div>
          <SidebarLink href="/invoices" icon={<FileText className="h-4 w-4" />} currentPath={location} onClick={closeSidebar}>
            Remitos
          </SidebarLink>
          <SidebarLink href="/orders" icon={<ClipboardList className="h-4 w-4" />} currentPath={location} onClick={closeSidebar}>
            Pedidos
          </SidebarLink>
          <SidebarLink href="/credit-notes" icon={<FileEdit className="h-4 w-4" />} currentPath={location} onClick={closeSidebar}>
            Notas de Crédito/Débito
          </SidebarLink>
          
          <div className="px-4 py-2 text-xs font-semibold text-slate-500 mt-2">ADMINISTRACIÓN</div>
          <SidebarLink href="/reports" icon={<BarChart className="h-4 w-4" />} currentPath={location} onClick={closeSidebar}>
            Reportes
          </SidebarLink>
          <SidebarLink href="/users" icon={<Users className="h-4 w-4" />} currentPath={location} onClick={closeSidebar}>
            Usuarios
          </SidebarLink>
          <SidebarLink href="/settings" icon={<Settings className="h-4 w-4" />} currentPath={location} onClick={closeSidebar}>
            Configuración
          </SidebarLink>
        </nav>
        
        <div className="p-4 mt-auto border-t border-slate-200">
          <Button 
            variant="outline" 
            className="w-full" 
            onClick={handleLogout}
            disabled={logoutMutation.isPending}
          >
            <LogOut className="mr-2 h-4 w-4" />
            {logoutMutation.isPending ? "Cerrando sesión..." : "Cerrar Sesión"}
          </Button>
        </div>
      </div>
      
      {/* Mobile toggle button */}
      {isMobile && (
        <button 
          className="fixed bottom-4 right-4 p-3 bg-primary text-white rounded-full shadow-lg z-50"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? (
            <span className="h-6 w-6">×</span>
          ) : (
            <ShoppingCart className="h-5 w-5" />
          )}
        </button>
      )}
    </>
  );
}
