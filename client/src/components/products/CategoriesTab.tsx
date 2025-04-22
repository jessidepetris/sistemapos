import React, { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { UseFormReturn } from "react-hook-form";
import {
  Card,
  CardContent
} from "@/components/ui/card";
import {
  FormField,
  FormItem,
  FormLabel
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tag, Plus, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface CategoriesTabProps {
  form: UseFormReturn<any>;
  productId: number | null;
}

type Category = {
  id: number;
  name: string;
  description: string | null;
  imageUrl: string | null;
  parentId: number | null;
  displayOrder: number | null;
  active: boolean | null;
};

export function CategoriesTab({ form, productId }: CategoriesTabProps) {
  const { toast } = useToast();
  const [selectedCategories, setSelectedCategories] = useState<Category[]>([]);

  // Obtener categorías
  const { data: categories, isLoading: isLoadingCategories } = useQuery({
    queryKey: ["/api/categories"],
    queryFn: undefined,
  });

  // Obtener categorías asociadas al producto si estamos editando
  const { data: productCategories, isLoading: isLoadingProductCategories } = useQuery({
    queryKey: ["/api/products", productId, "categories"],
    queryFn: productId 
      ? async () => {
          const res = await apiRequest("GET", `/api/products/${productId}/categories`);
          return await res.json();
        }
      : () => Promise.resolve([]),
    enabled: !!productId,
  });

  // Mutation para asociar categorías
  const assignCategoryMutation = useMutation({
    mutationFn: async ({ productId, categoryId }: { productId: number, categoryId: number }) => {
      const res = await apiRequest(
        "POST", 
        `/api/products/${productId}/categories/${categoryId}`
      );
      return await res.json();
    },
    onSuccess: () => {
      toast({ title: "Categoría asignada correctamente" });
      queryClient.invalidateQueries({ queryKey: ["/api/products", productId, "categories"] });
    },
    onError: (error) => {
      toast({
        title: "Error al asignar categoría",
        description: (error as Error).message,
        variant: "destructive",
      });
    }
  });

  // Mutation para quitar asociación de categorías
  const removeCategoryMutation = useMutation({
    mutationFn: async ({ productId, categoryId }: { productId: number, categoryId: number }) => {
      const res = await apiRequest(
        "DELETE", 
        `/api/products/${productId}/categories/${categoryId}`
      );
      return await res.json();
    },
    onSuccess: () => {
      toast({ title: "Categoría eliminada correctamente" });
      queryClient.invalidateQueries({ queryKey: ["/api/products", productId, "categories"] });
    },
    onError: (error) => {
      toast({
        title: "Error al eliminar categoría",
        description: (error as Error).message,
        variant: "destructive",
      });
    }
  });

  // Actualizar estado local cuando se carguen las categorías del producto
  useEffect(() => {
    if (productCategories && Array.isArray(productCategories)) {
      const selectedCats = productCategories.map((cat: Category) => ({
        id: cat.id,
        name: cat.name,
        description: cat.description,
        imageUrl: cat.imageUrl,
        parentId: cat.parentId,
        displayOrder: cat.displayOrder,
        active: cat.active
      }));
      
      setSelectedCategories(selectedCats);
      
      // Actualizar el valor en el formulario
      const categoryIds = selectedCats.map(cat => cat.id);
      form.setValue("categoryIds", categoryIds);
    }
  }, [productCategories, form]);

  // Función para añadir una categoría al producto
  const handleAddCategory = (category: Category) => {
    if (productId) {
      // Producto existente: usar la API
      assignCategoryMutation.mutate({ productId, categoryId: category.id });
    } else {
      // Nuevo producto: actualizar localmente
      if (!selectedCategories.some(cat => cat.id === category.id)) {
        const newSelectedCategories = [...selectedCategories, category];
        setSelectedCategories(newSelectedCategories);
        
        // Actualizar el valor en el formulario
        const categoryIds = newSelectedCategories.map(cat => cat.id);
        form.setValue("categoryIds", categoryIds);
      }
    }
  };

  // Función para quitar una categoría del producto
  const handleRemoveCategory = (categoryId: number) => {
    if (productId) {
      // Producto existente: usar la API
      removeCategoryMutation.mutate({ productId, categoryId });
    } else {
      // Nuevo producto: actualizar localmente
      const newSelectedCategories = selectedCategories.filter(cat => cat.id !== categoryId);
      setSelectedCategories(newSelectedCategories);
      
      // Actualizar el valor en el formulario
      const categoryIds = newSelectedCategories.map(cat => cat.id);
      form.setValue("categoryIds", categoryIds);
    }
  };

  // Función para verificar si una categoría ya está seleccionada
  const isCategorySelected = (categoryId: number) => {
    return selectedCategories.some(cat => cat.id === categoryId);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6">
          <FormField
            control={form.control}
            name="categoryIds"
            render={() => (
              <FormItem>
                <FormLabel>Categorías asignadas</FormLabel>
                <div className="flex flex-wrap gap-2 min-h-[40px] p-2 border rounded-md">
                  {selectedCategories.length === 0 ? (
                    <div className="text-muted-foreground text-sm">Sin categorías asignadas</div>
                  ) : (
                    selectedCategories.map(category => (
                      <Badge key={category.id} className="flex items-center gap-1 px-3 py-1.5">
                        <Tag size={14} />
                        {category.name}
                        <button 
                          type="button" 
                          onClick={() => handleRemoveCategory(category.id)} 
                          className="ml-1 hover:text-destructive"
                        >
                          <X size={14} />
                        </button>
                      </Badge>
                    ))
                  )}
                </div>
              </FormItem>
            )}
          />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <h3 className="text-lg font-medium mb-4">Categorías disponibles</h3>
          
          {isLoadingCategories ? (
            <div className="text-center py-4">Cargando categorías...</div>
          ) : Array.isArray(categories) && categories.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              {categories.map((category: Category) => (
                <Button
                  key={category.id}
                  type="button"
                  variant={isCategorySelected(category.id) ? "secondary" : "outline"}
                  className="justify-start"
                  onClick={() => handleAddCategory(category)}
                  disabled={isCategorySelected(category.id)}
                >
                  <div className="flex items-center">
                    {!isCategorySelected(category.id) && <Plus size={16} className="mr-2" />}
                    <Tag size={16} className="mr-2" />
                    <span className="truncate">{category.name}</span>
                  </div>
                </Button>
              ))}
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-muted-foreground">No hay categorías disponibles.</p>
              <p className="mt-2">
                <a 
                  href="/categories" 
                  className="text-primary hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Gestionar categorías
                </a>
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}