import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useMobile } from "@/hooks/use-mobile";
import {
  LayoutDashboard,
  Store,
  Package,
  Users,
  Truck,
  ClipboardList,
  BarChart3,
  UserCog,
  Settings,
  LogOut
} from "lucide-react";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const menuItems = [
  { path: "/", icon: <LayoutDashboard size={18} />, label: "Dashboard" },
  { path: "/pos", icon: <Store size={18} />, label: "Punto de Venta" },
  { path: "/products", icon: <Package size={18} />, label: "Productos" },
  { path: "/customers", icon: <Users size={18} />, label: "Clientes" },
  { path: "/suppliers", icon: <Truck size={18} />, label: "Proveedores" },
  { path: "/orders", icon: <ClipboardList size={18} />, label: "Pedidos" },
  { path: "/reports", icon: <BarChart3 size={18} />, label: "Reportes" },
  { path: "/users", icon: <UserCog size={18} />, label: "Usuarios" },
  { path: "/settings", icon: <Settings size={18} />, label: "Configuración" }
];

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();
  const isMobile = useMobile();
  
  // Close sidebar on location change on mobile
  useEffect(() => {
    if (isMobile && isOpen) {
      onClose();
    }
  }, [location, isMobile, isOpen, onClose]);
  
  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const sidebar = document.getElementById("sidebar");
      const mobileMenuButton = document.getElementById("mobile-menu-button");
      
      if (isMobile && 
          isOpen && 
          sidebar && 
          !sidebar.contains(e.target as Node) && 
          mobileMenuButton && 
          !mobileMenuButton.contains(e.target as Node)) {
        onClose();
      }
    };
    
    document.addEventListener("click", handleClickOutside);
    
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [isMobile, isOpen, onClose]);
  
  const handleLogout = () => {
    logoutMutation.mutate();
  };
  
  const sidebarClass = isMobile
    ? `fixed inset-0 z-50 ${isOpen ? "flex" : "hidden"} flex-col w-64 bg-white border-r border-neutral-100 shadow-sm`
    : "hidden md:flex flex-col w-64 bg-white border-r border-neutral-100 shadow-sm";
  
  return (
    <aside id="sidebar" className={sidebarClass}>
      <div className="p-4 border-b border-neutral-100 flex items-center justify-center">
        <h1 className="text-xl font-semibold text-primary-600">POS System</h1>
      </div>
      
      {/* User Info */}
      <div className="p-4 border-b border-neutral-100">
        <div className="flex items-center">
          <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-600">
            <UserCog size={20} />
          </div>
          <div className="ml-3">
            <p className="font-medium text-sm">{user?.fullName || 'Usuario'}</p>
            <p className="text-xs text-neutral-800">{user?.role === 'admin' ? 'Administrador' : 'Empleado'}</p>
          </div>
        </div>
      </div>
      
      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-1 px-3">
          {menuItems.map((item) => {
            const isActive = location === item.path;
            return (
              <li key={item.path}>
                <Link href={item.path}>
                  <a className={`sidebar-item ${isActive ? 'active' : ''} flex items-center px-3 py-2 rounded-md text-sm hover:bg-neutral-50 text-neutral-800 hover:text-primary-600 ${isActive ? 'bg-neutral-50 text-primary-600' : ''}`}>
                    <span className="w-5 text-center">{item.icon}</span>
                    <span className="ml-3">{item.label}</span>
                  </a>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      
      <div className="p-4 border-t border-neutral-100">
        <Button 
          variant="default" 
          className="w-full flex items-center justify-center"
          onClick={handleLogout}
          disabled={logoutMutation.isPending}
        >
          <LogOut size={16} className="mr-2" />
          Cerrar Sesión
        </Button>
      </div>
    </aside>
  );
}
