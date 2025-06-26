import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { ShoppingCart, User, Search, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/use-cart";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState } from "react";

type WebLayoutProps = {
  children: ReactNode;
};

export default function WebLayout({ children }: WebLayoutProps) {
  const [location] = useLocation();
  const { cart } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);

  const cartItemCount = cart?.totalItems || 0;

  const navLinks = [
    { href: "/catalogo", label: "Productos" },
    { href: "/categorias", label: "Categorías" },
    { href: "/ofertas", label: "Ofertas" },
    { href: "/contacto", label: "Contacto" },
  ];

  const isActive = (href: string) => location === href;

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-30 w-full border-b bg-background">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center">
            <Link href="/catalogo">
              <a className="flex items-center font-bold text-2xl text-primary">
                Punto Pastelero
              </a>
            </Link>
          </div>

          {/* Navegación desktop */}
          <nav className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href}>
                <a
                  className={`text-sm font-medium transition-colors hover:text-primary ${
                    isActive(link.href) ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  {link.label}
                </a>
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-4">
            <Link href="/buscar">
              <Button variant="ghost" size="icon" className="hidden sm:flex">
                <Search className="h-5 w-5" />
                <span className="sr-only">Buscar</span>
              </Button>
            </Link>
            
            <Link href="/mi-cuenta">
              <Button variant="ghost" size="icon" className="hidden sm:flex">
                <User className="h-5 w-5" />
                <span className="sr-only">Mi cuenta</span>
              </Button>
            </Link>

            <Link href="/carrito">
              <Button variant="ghost" size="icon" className="relative">
                <ShoppingCart className="h-5 w-5" />
                <span className="sr-only">Carrito</span>
                {cartItemCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary text-xs text-primary-foreground flex items-center justify-center">
                    {cartItemCount}
                  </span>
                )}
              </Button>
            </Link>

            {/* Menú móvil */}
            <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[240px]">
                <div className="flex flex-col py-4 gap-6">
                  {navLinks.map((link) => (
                    <Link key={link.href} href={link.href}>
                      <a
                        className={`text-sm font-medium transition-colors hover:text-primary ${
                          isActive(link.href) ? "text-primary" : "text-muted-foreground"
                        }`}
                        onClick={() => setMenuOpen(false)}
                      >
                        {link.label}
                      </a>
                    </Link>
                  ))}
                  <Link href="/mi-cuenta">
                    <a
                      className="text-sm font-medium transition-colors hover:text-primary text-muted-foreground"
                      onClick={() => setMenuOpen(false)}
                    >
                      Mi cuenta
                    </a>
                  </Link>
                  <Link href="/buscar">
                    <a
                      className="text-sm font-medium transition-colors hover:text-primary text-muted-foreground"
                      onClick={() => setMenuOpen(false)}
                    >
                      Buscar
                    </a>
                  </Link>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {children}
      </main>

      <footer className="border-t py-8 mt-auto">
        <div className="container flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <p className="text-sm text-muted-foreground">
              © 2025 Punto Pastelero. Todos los derechos reservados.
            </p>
          </div>
          <div className="flex gap-6">
            <Link href="/terminos">
              <a className="text-xs text-muted-foreground hover:text-primary">
                Términos y condiciones
              </a>
            </Link>
            <Link href="/privacidad">
              <a className="text-xs text-muted-foreground hover:text-primary">
                Política de privacidad
              </a>
            </Link>
            <Link href="/contacto">
              <a className="text-xs text-muted-foreground hover:text-primary">
                Contacto
              </a>
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
