import { useState } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import CatalogLayout from "./catalog-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCart } from "@/hooks/use-cart";
import { useToast } from "@/hooks/use-toast";

// Interfaz para los productos
interface Product {
  id: number;
  name: string;
  description: string | null;
  price: string;
  imageUrl: string | null;
  category: string | null;
  inStock: boolean;
  isRefrigerated: boolean;
  baseUnit: string;
  conversionRates: Record<string, { factor: string; price: string }> | null;
}

export default function WebHomePage() {
  const { toast } = useToast();
  const { addToCartMutation } = useCart();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Obtener productos
  const { data: products, isLoading: isLoadingProducts } = useQuery({
    queryKey: ['/api/web/products'],
    queryFn: async () => {
      const res = await fetch('/api/web/products');
      if (!res.ok) throw new Error("Error al cargar productos");
      return await res.json() as Product[];
    }
  });

  // Obtener categorías
  const { data: categories, isLoading: isLoadingCategories } = useQuery({
    queryKey: ['/api/web/categories'],
    queryFn: async () => {
      try {
        const res = await fetch('/api/web/categories');
        if (!res.ok) throw new Error("Error al cargar categorías");
        return await res.json();
      } catch (error) {
        // Si falla, devolver categorías mock
        return [];
      }
    }
  });

  // Agregar al carrito
  const addToCart = (product: Product) => {
    addToCartMutation.mutate({
      productId: product.id,
      quantity: "1", // Por defecto 1 unidad
      unit: product.baseUnit,
    }, {
      onSuccess: () => {
        toast({
          title: "Producto agregado",
          description: `${product.name} ha sido agregado al carrito`,
        });
      }
    });
  };

  // Filtrar productos por categoría
  const filteredProducts = selectedCategory
    ? products?.filter(p => p.category === selectedCategory)
    : products;

  // Productos destacados (últimos 4)
  const featuredProducts = products?.slice(0, 4);

  return (
    <CatalogLayout>
      {/* Hero section */}
      <section className="w-full py-12 md:py-24 lg:py-32 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800">
        <div className="container px-4 md:px-6">
          <div className="grid gap-6 lg:grid-cols-2 lg:gap-12 xl:grid-cols-2">
            <div className="flex flex-col justify-center space-y-4">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none">
                  Los mejores productos para tu pastelería
                </h1>
                <p className="max-w-[600px] text-gray-500 md:text-xl dark:text-gray-400">
                  Descubre nuestra amplia selección de ingredientes de alta calidad para tus creaciones.
                  Compra online y recibe tus pedidos en la puerta de tu negocio.
                </p>
              </div>
              <div className="flex flex-col gap-2 min-[400px]:flex-row">
                <Link href="/web/products">
                  <Button size="lg" className="px-8">
                    Ver catálogo
                  </Button>
                </Link>
                <Link href="/web/about">
                  <Button variant="outline" size="lg" className="px-8">
                    Conócenos
                  </Button>
                </Link>
              </div>
            </div>
            <div className="flex items-center justify-center">
              <img
                alt="Hero"
                className="mx-auto aspect-video overflow-hidden rounded-xl object-cover object-center sm:w-full"
                height="550"
                src="https://images.unsplash.com/photo-1483695028939-5bb13f8648b0?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                width="550"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="w-full py-12 md:py-24 lg:py-32">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">
                Productos destacados
              </h2>
              <p className="max-w-[900px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-400">
                Descubre los ingredientes más populares para tus preparaciones
              </p>
            </div>
          </div>
          
          {isLoadingProducts ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
            </div>
          ) : (
            <div className="mx-auto grid max-w-sm items-start gap-8 sm:max-w-4xl sm:grid-cols-2 md:gap-12 lg:max-w-5xl lg:grid-cols-3 xl:max-w-6xl xl:grid-cols-4">
              {featuredProducts?.map((product) => (
                <Card key={product.id} className="overflow-hidden">
                  <div className="aspect-square overflow-hidden">
                    <img
                      src={product.imageUrl || "https://placehold.co/400x400/e2e8f0/1e293b?text=" + product.name}
                      alt={product.name}
                      className="h-full w-full object-cover transition-all hover:scale-105"
                      width={300}
                      height={300}
                    />
                  </div>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="line-clamp-1">{product.name}</CardTitle>
                      {!product.inStock && (
                        <Badge variant="outline" className="ml-2 text-red-500 border-red-200">
                          Agotado
                        </Badge>
                      )}
                      {product.isRefrigerated && (
                        <Badge variant="outline" className="ml-2 text-blue-500 border-blue-200">
                          Refrigerado
                        </Badge>
                      )}
                    </div>
                    <div className="line-clamp-2 text-sm text-gray-500 mt-2">
                      {product.description || "Sin descripción"}
                    </div>
                    <div className="mt-4 flex items-center justify-between">
                      <div className="font-semibold">
                        ${parseFloat(product.price).toFixed(2)} / {product.baseUnit}
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="p-4 pt-0 flex justify-between">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => addToCart(product)}
                      disabled={!product.inStock || addToCartMutation.isPending}
                    >
                      Agregar al carrito
                    </Button>
                    <Link href={`/web/products/${product.id}`}>
                      <Button variant="ghost" size="sm">
                        Ver detalles
                      </Button>
                    </Link>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
          
          <div className="flex justify-center mt-12">
            <Link href="/web/products">
              <Button variant="outline" className="rounded-full">
                Ver todos los productos
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="w-full py-12 md:py-24 lg:py-32 bg-muted/50">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">
                Categorías
              </h2>
              <p className="max-w-[900px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-400">
                Explora nuestras categorías para encontrar lo que necesitas
              </p>
            </div>
          </div>
          
          {isLoadingCategories || categories?.length === 0 ? (
            <div className="mt-12 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              <Card className="text-center">
                <CardContent className="p-6">
                  <div className="mb-4 rounded-full bg-primary/20 p-6 inline-block">
                    <svg className="h-10 w-10 text-primary" fill="none" height="24" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg">
                      <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
                      <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
                    </svg>
                  </div>
                  <h3 className="font-bold">Chocolates</h3>
                </CardContent>
              </Card>
              
              <Card className="text-center">
                <CardContent className="p-6">
                  <div className="mb-4 rounded-full bg-primary/20 p-6 inline-block">
                    <svg className="h-10 w-10 text-primary" fill="none" height="24" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 13V2l8 4-8 4" />
                      <path d="M20.55 10.23A9 9 0 1 1 8 4.94" />
                      <path d="M8 10a5 5 0 1 0 8.9 2.02" />
                    </svg>
                  </div>
                  <h3 className="font-bold">Harinas</h3>
                </CardContent>
              </Card>
              
              <Card className="text-center">
                <CardContent className="p-6">
                  <div className="mb-4 rounded-full bg-primary/20 p-6 inline-block">
                    <svg className="h-10 w-10 text-primary" fill="none" height="24" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg">
                      <path d="M6.3 20.3a2.4 2.4 0 0 0 3.4 0L12 18l-6-6-2.3 2.3a2.4 2.4 0 0 0 0 3.4Z" />
                      <path d="m2 22 3-3" />
                      <path d="M7.5 13.5 10 11" />
                      <path d="M10.5 16.5 13 14" />
                      <path d="m18 3-4 4h-2" />
                      <path d="m21 6-4 4" />
                      <path d="M3.5 8.5 5 7" />
                      <path d="m1 12 5-5" />
                    </svg>
                  </div>
                  <h3 className="font-bold">Decoración</h3>
                </CardContent>
              </Card>
              
              <Card className="text-center">
                <CardContent className="p-6">
                  <div className="mb-4 rounded-full bg-primary/20 p-6 inline-block">
                    <svg className="h-10 w-10 text-primary" fill="none" height="24" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg">
                      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                      <path d="M14 2v6h6" />
                      <path d="M8 13h2" />
                      <path d="M8 17h2" />
                      <path d="M14 13h2" />
                      <path d="M14 17h2" />
                    </svg>
                  </div>
                  <h3 className="font-bold">Moldes</h3>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="mt-12 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {categories.map((category: any) => (
                <Link key={category.id} href={`/web/categories/${category.id}`}>
                  <Card className="text-center cursor-pointer hover:shadow-md transition-all">
                    <CardContent className="p-6">
                      {category.imageUrl ? (
                        <div className="mb-4 h-16 w-16 mx-auto rounded-full overflow-hidden">
                          <img 
                            src={category.imageUrl} 
                            alt={category.name} 
                            className="h-full w-full object-cover" 
                          />
                        </div>
                      ) : (
                        <div className="mb-4 rounded-full bg-primary/20 p-6 inline-block">
                          <svg className="h-10 w-10 text-primary" fill="none" height="24" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg">
                            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                          </svg>
                        </div>
                      )}
                      <h3 className="font-bold">{category.name}</h3>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Benefits section */}
      <section className="w-full py-12 md:py-24 lg:py-32">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">
                ¿Por qué elegirnos?
              </h2>
              <p className="max-w-[900px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-400">
                Descubre las ventajas de comprar con nosotros
              </p>
            </div>
          </div>
          <div className="mx-auto grid max-w-sm gap-4 sm:max-w-4xl sm:grid-cols-2 md:gap-8 lg:max-w-5xl lg:grid-cols-3 mt-8">
            <Card className="flex flex-col items-center text-center">
              <CardContent className="flex flex-col items-center space-y-4 p-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <svg
                    className="h-6 w-6 text-primary"
                    fill="none"
                    height="24"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    width="24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M12 8a3 3 0 0 0-6 0c0 .549.171 1.057.459 1.471" />
                    <path d="M6 10h.01" />
                    <path d="M4 12c-1.858.871-4 1.5-4 4 0 1.195.576 2 2 2s4-1 6-1 4.5 1 6 1 2-.805 2-2c0-2.476-2.005-3.098-3.75-3.935" />
                    <path d="M6 20c0-1.5 1-2 1-2" />
                    <path d="M22 12c0-5.5-4.5-10-10-10" />
                    <path d="M18.5 19.5c-1-1-1-6-3-8.5" />
                    <path d="M8.5 19.5c1-1 1-6 3-8.5" />
                    <path d="M12 12a3 3 0 0 0 0-6" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold">Productos frescos</h3>
                <p className="text-gray-500 dark:text-gray-400">
                  Todos nuestros ingredientes son seleccionados cuidadosamente para asegurar la mejor calidad.
                </p>
              </CardContent>
            </Card>
            <Card className="flex flex-col items-center text-center">
              <CardContent className="flex flex-col items-center space-y-4 p-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <svg
                    className="h-6 w-6 text-primary"
                    fill="none"
                    height="24"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    width="24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold">Entrega rápida</h3>
                <p className="text-gray-500 dark:text-gray-400">
                  Entregas programadas y puntuales para que nunca te falte nada en tu negocio.
                </p>
              </CardContent>
            </Card>
            <Card className="flex flex-col items-center text-center">
              <CardContent className="flex flex-col items-center space-y-4 p-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <svg
                    className="h-6 w-6 text-primary"
                    fill="none"
                    height="24"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    width="24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold">Calidad garantizada</h3>
                <p className="text-gray-500 dark:text-gray-400">
                  Trabajamos con las mejores marcas para ofrecerte productos de primera calidad.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </CatalogLayout>
  );
}