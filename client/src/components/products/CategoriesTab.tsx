import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { UseFormReturn } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Folder, Tag, PlusCircle, X } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogTitle, DialogHeader } from "@/components/ui/dialog";
import { CategoryManager } from "@/components/categories/CategoryManager";

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
};

export function CategoriesTab({ form, productId }: CategoriesTabProps) {
  const [categorySelectorOpen, setCategorySelectorOpen] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<
    { id: number; name: string }[]
  >([]);
  
  // Obtener categorías actuales del producto
  const { data: productCategories, isLoading: loadingProductCategories } = useQuery({
    queryKey: ["/api/products", productId, "categories"],
    queryFn: undefined,
    enabled: !!productId, // Solo ejecutar si hay un productId
  });
  
  // Actualizar la lista de categorías seleccionadas cuando cambie el producto
  useEffect(() => {
    if (productCategories && Array.isArray(productCategories)) {
      const categories = productCategories.map((cat: Category) => ({
        id: cat.id,
        name: cat.name
      }));
      setSelectedCategories(categories);
    } else {
      setSelectedCategories([]);
    }
  }, [productCategories]);
  
  const handleSelectCategory = (categoryId: number | null, categoryName: string) => {
    if (categoryId === null) {
      return; // Ignorar la opción "Sin categoría"
    }
    
    // Verificar si la categoría ya está seleccionada
    const alreadySelected = selectedCategories.some(cat => cat.id === categoryId);
    
    if (!alreadySelected) {
      const newCategories = [
        ...selectedCategories, 
        { id: categoryId, name: categoryName }
      ];
      setSelectedCategories(newCategories);
      form.setValue("categoryIds", newCategories.map(cat => cat.id));
    }
    
    setCategorySelectorOpen(false);
  };
  
  const handleRemoveCategory = (categoryId: number) => {
    const newCategories = selectedCategories.filter(cat => cat.id !== categoryId);
    setSelectedCategories(newCategories);
    form.setValue("categoryIds", newCategories.map(cat => cat.id));
  };
  
  return (
    <div className="space-y-4 py-2 pb-4">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-base">Categorías asignadas</Label>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setCategorySelectorOpen(true)}
          >
            <PlusCircle size={16} className="mr-2" />
            Asignar categoría
          </Button>
        </div>
        
        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-md flex items-center">
              <Tag size={16} className="mr-2" />
              Categorías del producto
            </CardTitle>
            <CardDescription>
              El producto será mostrado en estas categorías
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            {loadingProductCategories ? (
              <div className="py-4 text-center text-muted-foreground">
                Cargando categorías...
              </div>
            ) : selectedCategories.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground border border-dashed rounded-md">
                <Folder size={24} className="mx-auto mb-2 opacity-50" />
                <p>Producto sin categorías asignadas</p>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="mt-2" 
                  onClick={() => setCategorySelectorOpen(true)}
                >
                  <PlusCircle size={14} className="mr-1" />
                  Asignar a una categoría
                </Button>
              </div>
            ) : (
              <ScrollArea className="h-[200px]">
                <div className="space-y-2 pr-4">
                  {selectedCategories.map(category => (
                    <div 
                      key={category.id} 
                      className="flex items-center justify-between p-2 pl-3 bg-accent/50 rounded-md"
                    >
                      <div className="flex items-center">
                        <Folder size={16} className="mr-2 text-muted-foreground" />
                        <span>{category.name}</span>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-muted-foreground hover:text-destructive" 
                        onClick={() => handleRemoveCategory(category.id)}
                      >
                        <X size={14} />
                      </Button>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Diálogo para selector de categorías */}
      <Dialog open={categorySelectorOpen} onOpenChange={setCategorySelectorOpen}>
        <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>Seleccionar categoría</DialogTitle>
          </DialogHeader>
          
          <div className="py-4 h-[70vh] overflow-hidden">
            <CategoryManager 
              onSelectCategory={handleSelectCategory} 
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}