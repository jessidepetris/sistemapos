import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import CatalogLayout from "./catalog-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardFooter,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { useCart } from "@/hooks/use-cart";
import { useToast } from "@/hooks/use-toast";
import { Search, Filter, Refrigerator } from "lucide-react";

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
  isDiscontinued: boolean;
  stock: number;
}

export default function WebProductsPage() {
  const { toast } = useToast();
  const { addToCartMutation } = useCart();
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [showOutOfStock, setShowOutOfStock] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const productsPerPage = 12;

  // Obtener productos
  const { data: products, isLoading: isLoadingProducts } = useQuery({
    queryKey: ['/api/web/products', showOutOfStock],
    queryFn: async () => {
      const url = `/api/web/products${showOutOfStock ? '?showOutOfStock=true' : ''}`;
      const res = await fetch(url);
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
        // Si falla, devolver categorías vacías
        return [];
      }
    }
  });

  // Lista única de categorías de productos (para usar si falla la API de categorías)
  const productCategories = products 
    ? Array.from(new Set(products.map(p => p.category).filter(Boolean)))
    : [];

  // Filtrar productos
  const filteredProducts = products?.filter(product => {
    // Filtrar por término de búsqueda
    const matchesSearch = searchTerm === "" || 
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.description && product.description.toLowerCase().includes(searchTerm.toLowerCase()));
    
    // Filtrar por categoría
    const matchesCategory = !categoryFilter || product.category === categoryFilter;
    
    return matchesSearch && matchesCategory;
  });

  // Paginar productos
  const indexOfLastProduct = currentPage * productsPerPage;
  const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
  const currentProducts = filteredProducts?.slice(indexOfFirstProduct, indexOfLastProduct);
  const totalPages = filteredProducts ? Math.ceil(filteredProducts.length / productsPerPage) : 0;

  // Resetear página cuando cambia filtro o búsqueda
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, categoryFilter]);

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

  // Generar paginación
  const renderPagination = () => {
    const items = [];
    
    // Si no hay suficientes páginas, mostrar todas
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) {
        items.push(
          <PaginationItem key={i}>
            <PaginationLink
              isActive={i === currentPage}
              onClick={() => setCurrentPage(i)}
            >
              {i}
            </PaginationLink>
          </PaginationItem>
        );
      }
    } else {
      // Siempre mostrar la primera página
      items.push(
        <PaginationItem key={1}>
          <PaginationLink
            isActive={1 === currentPage}
            onClick={() => setCurrentPage(1)}
          >
            1
          </PaginationLink>
        </PaginationItem>
      );
      
      // Si la página actual es > 3, mostrar ellipsis
      if (currentPage > 3) {
        items.push(
          <PaginationItem key="ellipsis1">
            <PaginationLink isActive={false}>...</PaginationLink>
          </PaginationItem>
        );
      }
      
      // Mostrar páginas alrededor de la página actual
      const startPage = Math.max(2, currentPage - 1);
      const endPage = Math.min(totalPages - 1, currentPage + 1);
      
      for (let i = startPage; i <= endPage; i++) {
        items.push(
          <PaginationItem key={i}>
            <PaginationLink
              isActive={i === currentPage}
              onClick={() => setCurrentPage(i)}
            >
              {i}
            </PaginationLink>
          </PaginationItem>
        );
      }
      
      // Si la página actual es < totalPages - 2, mostrar ellipsis
      if (currentPage < totalPages - 2) {
        items.push(
          <PaginationItem key="ellipsis2">
            <PaginationLink isActive={false}>...</PaginationLink>
          </PaginationItem>
        );
      }
      
      // Siempre mostrar la última página
      items.push(
        <PaginationItem key={totalPages}>
          <PaginationLink
            isActive={totalPages === currentPage}
            onClick={() => setCurrentPage(totalPages)}
          >
            {totalPages}
          </PaginationLink>
        </PaginationItem>
      );
    }
    
    return items;
  };

  return (
    <CatalogLayout>
      <div className="container mx-auto px-4 py-10">
        <h1 className="text-3xl font-bold mb-6">Productos</h1>
        
        {/* Filtros y búsqueda */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {/* Búsqueda */}
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Buscar productos..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          
          {/* Filtro por categoría */}
          <div>
            <Select
              value={categoryFilter || ""}
              onValueChange={(value) => setCategoryFilter(value || null)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todas las categorías" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las categorías</SelectItem>
                {categories?.length > 0 
                  ? categories.map((category: any) => (
                      <SelectItem key={category.id} value={category.name || `category-${category.id}`}>
                        {category.name || `Categoría ${category.id}`}
                      </SelectItem>
                    ))
                  : productCategories.map((category) => (
                      <SelectItem key={category} value={category || "sin-categoria"}>
                        {category || "Sin categoría"}
                      </SelectItem>
                    ))
                }
              </SelectContent>
            </Select>
          </div>
          
          {/* Mostrar sin stock */}
          <div className="flex items-center space-x-2">
            <Button 
              variant={showOutOfStock ? "default" : "outline"} 
              onClick={() => setShowOutOfStock(!showOutOfStock)}
              className="w-full"
            >
              <Filter className="mr-2 h-4 w-4" />
              {showOutOfStock ? "Ocultar sin stock" : "Mostrar sin stock"}
            </Button>
          </div>
        </div>
        
        {/* Resultados */}
        {isLoadingProducts ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
          </div>
        ) : currentProducts?.length === 0 ? (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
              <Search className="h-6 w-6 text-muted-foreground" />
            </div>
            <h2 className="text-2xl font-semibold mb-2">No se encontraron productos</h2>
            <p className="text-muted-foreground">
              Intenta cambiar los filtros o el término de búsqueda
            </p>
          </div>
        ) : (
          <div>
            {/* Resultados de la búsqueda */}
            <div className="text-sm text-muted-foreground mb-4">
              Mostrando {currentProducts?.length} de {filteredProducts?.length} productos
            </div>
            
            {/* Grid de productos */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {currentProducts?.map((product) => (
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
                      <div className="flex items-center gap-2 mb-2">
                        {!product.inStock && (
                          <Badge variant="outline" className="text-red-500 border-red-200">
                            Agotado
                          </Badge>
                        )}
                        {product.isDiscontinued && product.inStock && (
                          <Badge variant="outline" className="text-orange-500 border-orange-200">
                            Últimas unidades
                          </Badge>
                        )}
                        {product.isRefrigerated && (
                          <Badge variant="outline" className="text-blue-500 border-blue-200">
                            <Refrigerator className="h-3 w-3 mr-1" />
                            Refrigerado
                          </Badge>
                        )}
                        {product.category && (
                          <Badge variant="secondary">{product.category}</Badge>
                        )}
                      </div>
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
            
            {/* Paginación */}
            {totalPages > 1 && (
              <Pagination className="mt-8">
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious 
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      isActive={currentPage !== 1} 
                    />
                  </PaginationItem>
                  
                  {renderPagination()}
                  
                  <PaginationItem>
                    <PaginationNext 
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      isActive={currentPage !== totalPages} 
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            )}
          </div>
        )}
      </div>
    </CatalogLayout>
  );
}
