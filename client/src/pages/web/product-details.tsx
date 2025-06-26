import { useState, useEffect, useMemo } from "react";
import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import CatalogLayout from "./catalog-layout";
import { useCart } from "@/hooks/use-cart";
import { useToast } from "@/hooks/use-toast";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ChevronLeft, ShoppingCart, Refrigerator } from "lucide-react";

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

export default function ProductDetailsPage() {
  const { productId } = useParams();
  const { toast } = useToast();
  const { addToCartMutation } = useCart();
  const [quantity, setQuantity] = useState("1");
  const [selectedUnit, setSelectedUnit] = useState("");

  // Obtener detalles del producto
  const { data: product, isLoading } = useQuery({
    queryKey: [`/api/web/products/${productId}`],
    queryFn: async () => {
      try {
        // Usar el nuevo endpoint específico para detalles del producto
        const res = await fetch(`/api/web/products/${productId}`);
        if (!res.ok) {
          const error = await res.json();
          throw new Error(error.message || "Error al cargar producto");
        }
        
        const product = await res.json();
        console.log("Producto obtenido:", product); // Para depuración
        
        return product;
      } catch (error) {
        console.error("Error al cargar producto:", error);
        return null;
      }
    }
  });

  // Determinar unidades disponibles
  const availableUnits = useMemo(() => {
    if (!product) return [];
    
    console.log("Producto:", product);
    console.log("Tasas de conversión:", product.conversionRates);
    
    const units = [
      product.baseUnit,
      ...(product.conversionRates 
        ? Object.keys(product.conversionRates as Record<string, any>)
        : [])
    ];
    
    console.log("Unidades disponibles:", units);
    return units;
  }, [product]);

  // Establecer unidad por defecto
  useEffect(() => {
    if (product && !selectedUnit) {
      setSelectedUnit(product.baseUnit);
    }
  }, [product, selectedUnit]);

  // Calcular precio según la unidad seleccionada
  const getPrice = () => {
    if (!product) return 0;
    
    if (selectedUnit === product.baseUnit) {
      return parseFloat(product.price);
    }
    
    if (product.conversionRates && product.conversionRates[selectedUnit]) {
      return parseFloat(product.conversionRates[selectedUnit].price);
    }
    
    return parseFloat(product.price);
  };

  // Agregar al carrito
  const handleAddToCart = () => {
    if (!product) return;
    
    addToCartMutation.mutate({
      productId: product.id,
      quantity,
      unit: selectedUnit || product.baseUnit,
    }, {
      onSuccess: () => {
        toast({
          title: "Producto agregado",
          description: `${product.name} ha sido agregado al carrito`,
        });
      }
    });
  };

  if (isLoading) {
    return (
      <CatalogLayout>
        <div className="container mx-auto px-4 py-12 flex justify-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>
      </CatalogLayout>
    );
  }

  if (!product) {
    return (
      <CatalogLayout>
        <div className="container mx-auto px-4 py-12">
          <div className="text-center py-12">
            <h2 className="text-2xl font-semibold mb-2">Producto no encontrado</h2>
            <p className="text-muted-foreground mb-6">
              El producto que estás buscando no existe o no está disponible.
            </p>
            <Link href="/web/products">
              <Button>Ver todos los productos</Button>
            </Link>
          </div>
        </div>
      </CatalogLayout>
    );
  }

  return (
    <CatalogLayout>
      <div className="container mx-auto px-4 py-12">
        {/* Breadcrumbs */}
        <Breadcrumb className="mb-6 flex items-center">
          <BreadcrumbItem className="inline-flex items-center">
            <BreadcrumbLink href="/web">Inicio</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator className="mx-2" />
          <BreadcrumbItem className="inline-flex items-center">
            <BreadcrumbLink href="/web/products">Productos</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator className="mx-2" />
          <BreadcrumbItem className="inline-flex items-center">
            <BreadcrumbLink className="text-ellipsis overflow-hidden">{product.name}</BreadcrumbLink>
          </BreadcrumbItem>
        </Breadcrumb>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Imagen del producto */}
          <div className="overflow-hidden rounded-lg bg-gray-100 border">
            <img
              src={product.imageUrl || `https://placehold.co/600x600/e2e8f0/1e293b?text=${product.name}`}
              alt={product.name}
              className="h-full w-full object-cover"
            />
          </div>

          {/* Detalles del producto */}
          <div className="space-y-6">
            <div>
              <Link href="/web/products">
                <Button variant="link" className="p-0 h-auto text-muted-foreground mb-2">
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Volver a productos
                </Button>
              </Link>
              <h1 className="text-3xl font-bold">{product.name}</h1>
              
              <div className="flex items-center gap-2 mt-2">
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

            <div className="text-lg font-semibold">
              ${getPrice().toFixed(2)} / {selectedUnit || product.baseUnit}
            </div>

            <div className="text-gray-700">
              {product.description || "Sin descripción disponible para este producto."}
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Opciones de compra</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Selector de unidad */}
                {availableUnits.length > 1 && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Presentación:</label>
                    <Select
                      value={selectedUnit}
                      onValueChange={setSelectedUnit}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar unidad" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableUnits.map((unit) => (
                          <SelectItem key={unit} value={unit}>
                            {unit}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Selector de cantidad */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Cantidad:</label>
                  <Select
                    value={quantity}
                    onValueChange={setQuantity}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Cantidad" />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5, 10, 15, 20].map((q) => (
                        <SelectItem key={q} value={q.toString()}>
                          {q}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Botón de agregar al carrito */}
                <Button
                  className="w-full mt-4"
                  onClick={handleAddToCart}
                  disabled={!product.inStock || addToCartMutation.isPending}
                >
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Agregar al carrito
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </CatalogLayout>
  );
}
