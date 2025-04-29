import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
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
import { Tag, Plus, X, ChevronDown, ChevronRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Category {
  id: number;
  name: string;
  description: string | null;
  imageUrl: string | null;
  parentId: number | null;
  displayOrder: number;
  active: boolean;
  children?: Category[];
}

interface CategoriesTabProps {
  form: UseFormReturn<any>;
  productId?: number;
}

export function CategoriesTab({ form, productId }: CategoriesTabProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [expandedCategories, setExpandedCategories] = useState<number[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<Category[]>([]);

  // Obtener todas las categorías
  const { data: categories, isLoading: isLoadingCategories } = useQuery({
    queryKey: ["/api/product-categories"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/product-categories");
      if (!response.ok) throw new Error("Error al cargar categorías");
      return response.json();
    },
  });

  // Obtener categorías del producto si existe
  const { data: productCategories } = useQuery({
    queryKey: ["/api/products", productId, "categories"],
    queryFn: async () => {
      if (!productId) return [];
      const response = await apiRequest("GET", `/api/products/${productId}/categories`);
      if (!response.ok) throw new Error("Error al cargar categorías del producto");
      return response.json();
    },
    enabled: !!productId,
  });

  // Construir árbol de categorías
  const buildCategoryTree = (categories: Category[]): Category[] => {
    const categoryMap = new Map<number, Category>();
    const rootCategories: Category[] = [];

    categories.forEach(category => {
      categoryMap.set(category.id, { ...category, children: [] });
    });

    categories.forEach(category => {
      const categoryWithChildren = categoryMap.get(category.id);
      if (category.parentId === null) {
        rootCategories.push(categoryWithChildren!);
      } else {
        const parent = categoryMap.get(category.parentId);
        if (parent) {
          parent.children!.push(categoryWithChildren!);
        }
      }
    });

    return rootCategories;
  };

  // Mutación para asignar categoría
  const assignCategoryMutation = useMutation({
    mutationFn: async ({ productId, categoryId }: { productId: number; categoryId: number }) => {
      const response = await apiRequest(
        "POST",
        `/api/products/${productId}/categories/${categoryId}`
      );
      if (!response.ok) throw new Error("Error al asignar categoría");
      return response.json();
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
    },
  });

  // Mutación para quitar categoría
  const removeCategoryMutation = useMutation({
    mutationFn: async ({ productId, categoryId }: { productId: number; categoryId: number }) => {
      const response = await apiRequest(
        "DELETE",
        `/api/products/${productId}/categories/${categoryId}`
      );
      if (!response.ok) throw new Error("Error al quitar categoría");
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Categoría quitada correctamente" });
      queryClient.invalidateQueries({ queryKey: ["/api/products", productId, "categories"] });
    },
    onError: (error) => {
      toast({
        title: "Error al quitar categoría",
        description: (error as Error).message,
        variant: "destructive",
      });
    },
  });

  // Actualizar categorías seleccionadas cuando se cargan las del producto
  useEffect(() => {
    if (productCategories && Array.isArray(productCategories)) {
      setSelectedCategories(productCategories);
      const categoryIds = productCategories.map(cat => cat.id);
      form.setValue("categoryIds", categoryIds);
    }
  }, [productCategories, form]);

  const toggleCategory = (categoryId: number) => {
    setExpandedCategories(prev =>
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const handleAddCategory = (category: Category) => {
    if (productId) {
      assignCategoryMutation.mutate({ productId, categoryId: category.id });
    } else {
      if (!selectedCategories.some(cat => cat.id === category.id)) {
        const newSelectedCategories = [...selectedCategories, category];
        setSelectedCategories(newSelectedCategories);
        const categoryIds = newSelectedCategories.map(cat => cat.id);
        form.setValue("categoryIds", categoryIds);
      }
    }
  };

  const handleRemoveCategory = (categoryId: number) => {
    if (productId) {
      removeCategoryMutation.mutate({ productId, categoryId });
    } else {
      const newSelectedCategories = selectedCategories.filter(cat => cat.id !== categoryId);
      setSelectedCategories(newSelectedCategories);
      const categoryIds = newSelectedCategories.map(cat => cat.id);
      form.setValue("categoryIds", categoryIds);
    }
  };

  const isCategorySelected = (categoryId: number) => {
    return selectedCategories.some(cat => cat.id === categoryId);
  };

  const renderCategoryItem = (category: Category, level: number = 0) => {
    const isExpanded = expandedCategories.includes(category.id);
    const hasChildren = category.children && category.children.length > 0;
    const isSelected = isCategorySelected(category.id);

    return (
      <div key={category.id} style={{ marginLeft: `${level * 20}px` }}>
        <div className="flex items-center py-1">
          {hasChildren && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => toggleCategory(category.id)}
              className="h-6 w-6"
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>
          )}
          <Button
            variant={isSelected ? "secondary" : "ghost"}
            className="flex-1 justify-start"
            onClick={() => isSelected ? handleRemoveCategory(category.id) : handleAddCategory(category)}
          >
            <Tag className="h-4 w-4 mr-2" />
            <span className="truncate">{category.name}</span>
          </Button>
        </div>
        {isExpanded && hasChildren && (
          <div className="ml-6">
            {category.children!.map(child => renderCategoryItem(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  if (isLoadingCategories) {
    return <div className="text-center py-4">Cargando categorías...</div>;
  }

  const categoryTree = buildCategoryTree(categories || []);

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="pt-6">
          <h3 className="text-lg font-medium mb-4">Categorías seleccionadas</h3>
          {selectedCategories.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {selectedCategories.map(category => (
                <Button
                  key={category.id}
                  variant="secondary"
                  size="sm"
                  onClick={() => handleRemoveCategory(category.id)}
                >
                  <Tag className="h-4 w-4 mr-2" />
                  {category.name}
                  <Plus className="h-4 w-4 ml-2 rotate-45" />
                </Button>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">No hay categorías seleccionadas</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <h3 className="text-lg font-medium mb-4">Categorías disponibles</h3>
          {categoryTree.length > 0 ? (
            <div className="space-y-1">
              {categoryTree.map(category => renderCategoryItem(category))}
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