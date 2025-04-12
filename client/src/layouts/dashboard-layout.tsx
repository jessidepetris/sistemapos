import { useState } from "react";
import { Sidebar } from "@/components/ui/sidebar";
import { TopNavbar } from "@/components/ui/top-navbar";
import { useAuth } from "@/hooks/use-auth";
import { Redirect } from "wouter";

interface DashboardLayoutProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
}

export function DashboardLayout({ children, title, description }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, isLoading } = useAuth();
  
  if (isLoading) return null;
  if (!user) return <Redirect to="/auth" />;
  
  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
      />
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Navbar */}
        <TopNavbar onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
        
        {/* Main Content Wrapper */}
        <main className="flex-1 overflow-y-auto bg-neutral-50 p-4">
          {(title || description) && (
            <div className="mb-6">
              {title && <h1 className="text-2xl font-bold text-neutral-800">{title}</h1>}
              {description && <p className="text-sm text-neutral-800">{description}</p>}
            </div>
          )}
          
          {children}
        </main>
      </div>
    </div>
  );
}
