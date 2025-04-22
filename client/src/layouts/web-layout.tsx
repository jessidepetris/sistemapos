import { ReactNode, useState } from "react";
import { Link, useLocation } from "wouter";
import { useWebAuth } from "@/hooks/use-web-auth";
import { useCart } from "@/hooks/use-cart";
import {
  ShoppingCart,
  Menu,
  X,
  User,
  Home,
  ShoppingBag,
  LogOut,
  Tag,
  Phone,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";

interface WebLayoutProps {
  children: ReactNode;
}

export default function WebLayout({ children }: WebLayoutProps) {
  const [location] = useLocation();
  const { user, logoutMutation } = useWebAuth();
  const { cart } = useCart();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const itemCount = cart?.totalItems || 0;

  const handleLogout = () => {
    logoutMutation.mutate(undefined);
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          {/* Logo */}
          <Link href="/web">
            <a className="flex items-center">
              <span className="text-xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                Punto Pastelero
              </span>
            </a>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            <Link href="/web">
              <a className={`text-sm font-medium transition-colors hover:text-primary ${location === "/web" ? "text-primary" : "text-gray-600"}`}>
                Inicio
              </a>
            </Link>
            <Link href="/web/products">
              <a className={`text-sm font-medium transition-colors hover:text-primary ${location === "/web/products" ? "text-primary" : "text-gray-600"}`}>
                Productos
              </a>
            </Link>
            <a href="tel:+5493511234567" className="text-sm font-medium text-gray-600 transition-colors hover:text-primary flex items-center">
              <Phone className="h-4 w-4 mr-1" />
              Contacto
            </a>
          </nav>

          {/* User and Cart Actions */}
          <div className="flex items-center space-x-2">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="hidden md:flex">
                    <User className="h-4 w-4 mr-2" />
                    {user.name ? user.name.split(' ')[0] : 'Mi cuenta'}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link href="/web/account">
                      <a className="flex items-center cursor-pointer">
                        <User className="h-4 w-4 mr-2" />
                        Mi Cuenta
                      </a>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/web/orders">
                      <a className="flex items-center cursor-pointer">
                        <ShoppingBag className="h-4 w-4 mr-2" />
                        Mis Pedidos
                      </a>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                    <LogOut className="h-4 w-4 mr-2" />
                    Cerrar Sesión
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button variant="ghost" size="sm" className="hidden md:flex" asChild>
                <Link href="/web/login">
                  <a>Iniciar Sesión</a>
                </Link>
              </Button>
            )}

            <Button variant="ghost" size="sm" className="relative" asChild>
              <Link href="/web/cart">
                <a>
                  <ShoppingCart className="h-5 w-5" />
                  {itemCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-primary text-white w-5 h-5 rounded-full text-xs flex items-center justify-center">
                      {itemCount}
                    </span>
                  )}
                </a>
              </Link>
            </Button>

            {/* Mobile Menu Button */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm" className="md:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <Link href="/web">
                      <a onClick={() => setMobileMenuOpen(false)} className="flex items-center">
                        <span className="text-xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                          Punto Pastelero
                        </span>
                      </a>
                    </Link>
                    <Button variant="ghost" size="sm" onClick={() => setMobileMenuOpen(false)}>
                      <X className="h-5 w-5" />
                    </Button>
                  </div>

                  <nav className="flex flex-col space-y-4">
                    <SheetClose asChild>
                      <Link href="/web">
                        <a className="flex items-center py-2 text-base font-medium">
                          <Home className="h-5 w-5 mr-3" />
                          Inicio
                        </a>
                      </Link>
                    </SheetClose>
                    <SheetClose asChild>
                      <Link href="/web/products">
                        <a className="flex items-center py-2 text-base font-medium">
                          <Tag className="h-5 w-5 mr-3" />
                          Productos
                        </a>
                      </Link>
                    </SheetClose>
                    <SheetClose asChild>
                      <Link href="/web/cart">
                        <a className="flex items-center py-2 text-base font-medium">
                          <ShoppingCart className="h-5 w-5 mr-3" />
                          Carrito
                          {itemCount > 0 && (
                            <span className="ml-3 bg-primary text-white w-5 h-5 rounded-full text-xs flex items-center justify-center">
                              {itemCount}
                            </span>
                          )}
                        </a>
                      </Link>
                    </SheetClose>
                    {user ? (
                      <>
                        <SheetClose asChild>
                          <Link href="/web/account">
                            <a className="flex items-center py-2 text-base font-medium">
                              <User className="h-5 w-5 mr-3" />
                              Mi Cuenta
                            </a>
                          </Link>
                        </SheetClose>
                        <SheetClose asChild>
                          <Link href="/web/orders">
                            <a className="flex items-center py-2 text-base font-medium">
                              <ShoppingBag className="h-5 w-5 mr-3" />
                              Mis Pedidos
                            </a>
                          </Link>
                        </SheetClose>
                        <button 
                          onClick={() => {
                            handleLogout();
                            setMobileMenuOpen(false);
                          }}
                          className="flex items-center py-2 text-base font-medium text-red-600"
                        >
                          <LogOut className="h-5 w-5 mr-3" />
                          Cerrar Sesión
                        </button>
                      </>
                    ) : (
                      <SheetClose asChild>
                        <Link href="/web/login">
                          <a className="flex items-center py-2 text-base font-medium">
                            <User className="h-5 w-5 mr-3" />
                            Iniciar Sesión
                          </a>
                        </Link>
                      </SheetClose>
                    )}
                  </nav>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-gray-50 border-t mt-8">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-4">Punto Pastelero</h3>
              <p className="text-gray-600 text-sm">
                Productos de pastelería de alta calidad para profesionales y aficionados.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Enlaces Rápidos</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/web">
                    <a className="text-gray-600 hover:text-primary">Inicio</a>
                  </Link>
                </li>
                <li>
                  <Link href="/web/products">
                    <a className="text-gray-600 hover:text-primary">Productos</a>
                  </Link>
                </li>
                {user && (
                  <>
                    <li>
                      <Link href="/web/orders">
                        <a className="text-gray-600 hover:text-primary">Mis Pedidos</a>
                      </Link>
                    </li>
                    <li>
                      <Link href="/web/account">
                        <a className="text-gray-600 hover:text-primary">Mi Cuenta</a>
                      </Link>
                    </li>
                  </>
                )}
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Contacto</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>Av. Colón 1234, Córdoba</li>
                <li>Tel: (351) 123-4567</li>
                <li>Email: ventas@puntopastelero.com</li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-6 border-t border-gray-200 text-center text-sm text-gray-600">
            <p>&copy; {new Date().getFullYear()} Punto Pastelero. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}