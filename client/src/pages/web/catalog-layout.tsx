import { ReactNode, useState } from "react";
import { Link } from "wouter";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ShoppingCart, User, Search, Menu, X } from "lucide-react";
import { useCart } from "@/hooks/use-cart";
import { useWebAuth } from "@/hooks/use-web-auth";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";

interface CatalogLayoutProps {
  children: ReactNode;
}

export default function CatalogLayout({ children }: CatalogLayoutProps) {
  const { user, logoutMutation } = useWebAuth();
  const { totalItems } = useCart();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center">
          <div className="mr-4 hidden md:flex">
            <div className="mr-6 flex items-center space-x-2">
              <Link href="/web" className="font-bold text-xl">
                Punto Pastelero
              </Link>
            </div>
            <nav className="flex items-center space-x-6 text-sm font-medium">
              <Link href="/web" className="transition-colors hover:text-primary">
                Inicio
              </Link>
              <Link href="/web/products" className="transition-colors hover:text-primary">
                Productos
              </Link>
              <Link href="/web/categories" className="transition-colors hover:text-primary">
                Categorías
              </Link>
              <Link href="/web/about" className="transition-colors hover:text-primary">
                Acerca de
              </Link>
              <Link href="/web/contact" className="transition-colors hover:text-primary">
                Contacto
              </Link>
            </nav>
          </div>

          {/* Mobile menu button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
            <span className="sr-only">Toggle menu</span>
          </Button>

          {/* Logo for mobile */}
          <Link href="/web" className="md:hidden ml-2 font-bold">
            Punto Pastelero
          </Link>

          {/* Right side items */}
          <div className="flex flex-1 items-center justify-end space-x-4">
            <div className="w-full flex-1 md:w-auto md:flex-none">
              <Button variant="ghost" size="icon" className="mr-2">
                <Search className="h-5 w-5" />
                <span className="sr-only">Buscar</span>
              </Button>
            </div>
            <nav className="flex items-center space-x-2">
              <div className="relative">
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => setLocation('/web/cart')}
                >
                  <ShoppingCart className="h-5 w-5" />
                  {totalItems > 0 && (
                    <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary text-white text-xs flex items-center justify-center">
                      {totalItems}
                    </span>
                  )}
                  <span className="sr-only">Carrito</span>
                </Button>
              </div>
              
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <User className="h-5 w-5" />
                      <span className="sr-only">Mi cuenta</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link href="/web/account" className="w-full">
                        Mi cuenta
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/web/orders" className="w-full">
                        Mis pedidos
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => logoutMutation.mutate()}>
                      Cerrar sesión
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/web/login">
                    Iniciar sesión
                  </Link>
                </Button>
              )}
            </nav>
          </div>
        </div>
      </header>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 top-16 z-50 grid h-[calc(100vh-4rem)] grid-flow-row auto-rows-max overflow-auto p-6 pb-32 shadow-md animate-in slide-in-from-bottom-80 md:hidden">
          <div className="relative z-20 rounded-md bg-popover p-4 text-popover-foreground shadow-md">
            <nav className="grid gap-2">
              <Link href="/web" className="flex w-full items-center py-2 text-lg font-semibold">
                Inicio
              </Link>
              <Link href="/web/products" className="flex w-full items-center py-2 text-lg font-semibold">
                Productos
              </Link>
              <Link href="/web/categories" className="flex w-full items-center py-2 text-lg font-semibold">
                Categorías
              </Link>
              <Link href="/web/about" className="flex w-full items-center py-2 text-lg font-semibold">
                Acerca de
              </Link>
              <Link href="/web/contact" className="flex w-full items-center py-2 text-lg font-semibold">
                Contacto
              </Link>
            </nav>
          </div>
        </div>
      )}

      {/* Main content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t py-6 md:py-10">
        <div className="container flex flex-col items-center justify-between gap-4 md:flex-row">
          <div className="flex flex-col items-center gap-4 md:flex-row md:gap-6">
            <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
              &copy; {new Date().getFullYear()} Punto Pastelero. Todos los derechos reservados.
            </p>
          </div>
          <div className="flex gap-4">
            <Link href="/web/terms" className="text-sm text-muted-foreground underline underline-offset-4">
              Términos
            </Link>
            <Link href="/web/privacy" className="text-sm text-muted-foreground underline underline-offset-4">
              Privacidad
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}