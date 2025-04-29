import { useState } from "react";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { useAuth } from "@/hooks/use-auth";
import { Redirect } from "wouter";
import { useIsMobile, useBreakpoint } from "@/hooks/use-mobile";

interface DashboardLayoutProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
}

export function DashboardLayout({ children, title, description }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, isLoading } = useAuth();
  const isMobile = useIsMobile();
  const isTablet = useBreakpoint('lg');
  
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };
  
  if (isLoading) return null;
  if (!user) return <Redirect to="/auth" />;
  
  return (
    <div className="flex h-screen overflow-hidden bg-neutral-50">
      {/* Sidebar */}
      <Sidebar />
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Navbar */}
        <Header title={title || 'Dashboard'} onMenuClick={toggleSidebar} />
        
        {/* Main Content Wrapper */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {(title || description) && (
            <div className="mb-4 md:mb-6">
              {title && <h1 className="text-xl md:text-2xl font-bold text-neutral-800">{title}</h1>}
              {description && <p className="text-sm text-neutral-600 mt-1">{description}</p>}
            </div>
          )}
          
          <div className="w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
