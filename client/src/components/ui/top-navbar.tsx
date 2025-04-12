import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Bell, HelpCircle, Search, Menu } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

interface TopNavbarProps {
  onMenuClick: () => void;
}

export function TopNavbar({ onMenuClick }: TopNavbarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const { user } = useAuth();
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Implement search functionality
    console.log("Searching for:", searchQuery);
  };
  
  return (
    <header className="bg-white border-b border-neutral-100 sticky top-0 z-10">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center">
          {/* Mobile menu button */}
          <Button 
            id="mobile-menu-button" 
            variant="ghost" 
            className="md:hidden mr-3 text-neutral-800 hover:text-primary-600 p-1"
            onClick={onMenuClick}
          >
            <Menu size={24} />
          </Button>
          
          {/* Search form */}
          <form onSubmit={handleSearch} className="relative">
            <Input
              type="text"
              placeholder="Buscar..."
              className="bg-neutral-50 border border-neutral-100 pl-9 pr-4 py-2 text-sm w-64 focus:outline-none"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-neutral-800" />
          </form>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Notifications */}
          <Button variant="ghost" className="relative text-neutral-800 hover:text-primary-600 p-1">
            <Bell size={20} />
            <span className="absolute -top-1 -right-1 bg-secondary-600 text-white text-xs w-4 h-4 flex items-center justify-center rounded-full">3</span>
          </Button>
          
          {/* Help */}
          <Button variant="ghost" className="text-neutral-800 hover:text-primary-600 p-1">
            <HelpCircle size={20} />
          </Button>
          
          {/* User menu (mobile) */}
          <div className="md:hidden relative">
            <Button variant="ghost" className="p-0">
              <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-600">
                {user?.fullName?.charAt(0) || 'U'}
              </div>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
