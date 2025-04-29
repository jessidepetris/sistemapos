import React, { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Folder, FolderPlus, FolderX, Edit, Trash2, X, Check, Plus, FileX } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { 
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription 
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from "@/components/ui/alert-dialog";

interface CategoryManagerProps {
  onSelectCategory?: (categoryId: number | null, categoryName: string) => void;
  selectedCategoryId?: number | null;
}

type Category = {
  id: number;
  name: string;
  description: string | null;
  imageUrl: string | null;
  parentId: number | null;
  displayOrder: number | null;
  active: boolean | null;
  // Campo virtual para la interfaz
  isExpanded?: boolean;
};

export function CategoryManager({ onSelectCategory, selectedCategoryId }: CategoryManagerProps) {
  const { toast } = useToast();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [categoryTree, setCategoryTree] = useState<Category[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<Set<number>>(new Set());
  const [currentCategory, setCurrentCategory] = useState<Category | null>(null);
  const [currentParentId, setCurrentParentId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    imageUrl: "",
    active: true,
    displayOrder: 0,
    slug: ""
  });
  
  // Fetch all categories
  const { data: categories = [], isLoading } = useQuery<Category[]>({
    queryKey: ["/api/product-categories"],
    queryFn: undefined, // Using the default fetcher
  });
  
  // Create category mutation
  const createCategoryMutation = useMutation({
    mutationFn: async (data: typeof formData & { parentId: number | null }) => {
      console.log('Enviando datos al servidor:', data);
      const res = await apiRequest("POST", "/api/product-categories", data);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || errorData.details?.slug || 'Error al crear la categoría');
      }
      return await res.json();
    },
    onSuccess: () => {
      toast({ title: "Categoría creada correctamente" });
      setIsAddDialogOpen(false);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ["/api/product-categories"] });
    },
    onError: (error) => {
      console.error('Error en la mutación:', error);
      toast({
        title: "Error al crear la categoría",
        description: error instanceof Error ? error.message : 'Error desconocido',
        variant: "destructive",
      });
    }
  });
  
  // Update category mutation
  const updateCategoryMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: Partial<typeof formData & { parentId: number | null }> }) => {
      const res = await apiRequest("PUT", `/api/product-categories/${id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      toast({ title: "Categoría actualizada correctamente" });
      setIsEditDialogOpen(false);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ["/api/product-categories"] });
    },
    onError: (error) => {
      toast({
        title: "Error al actualizar la categoría",
        description: (error as Error).message,
        variant: "destructive",
      });
    }
  });
  
  // Delete category mutation
  const deleteCategoryMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/product-categories/${id}`);
      return await res.json();
    },
    onSuccess: () => {
      toast({ title: "Categoría eliminada correctamente" });
      setIsDeleteDialogOpen(false);
      setCurrentCategory(null);
      queryClient.invalidateQueries({ queryKey: ["/api/product-categories"] });
    },
    onError: (error) => {
      toast({
        title: "Error al eliminar la categoría",
        description: (error as Error).message,
        variant: "destructive",
      });
    }
  });
  
  // Construir árbol de categorías
  useEffect(() => {
    if (Array.isArray(categories)) {
      // Ordenar categorías por displayOrder si está disponible, o por nombre
      const sortedCategories = [...categories].sort((a, b) => {
        if (a.displayOrder !== null && b.displayOrder !== null) {
          return a.displayOrder - b.displayOrder;
        }
        return a.name.localeCompare(b.name);
      });
      
      setCategoryTree(sortedCategories);
    }
  }, [categories]);
  
  const handleToggleExpand = (categoryId: number) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };
  
  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      imageUrl: "",
      active: true,
      displayOrder: 0,
      slug: ""
    });
    setCurrentParentId(null);
  };
  
  const handleAddCategory = (parentId: number | null = null) => {
    resetForm();
    setCurrentParentId(parentId);
    setIsAddDialogOpen(true);
  };
  
  const handleEditCategory = (category: Category) => {
    setCurrentCategory(category);
    setFormData({
      name: category.name,
      description: category.description || "",
      imageUrl: category.imageUrl || "",
      active: category.active === null ? true : category.active,
      displayOrder: category.displayOrder || 0,
      slug: ""
    });
    setCurrentParentId(category.parentId);
    setIsEditDialogOpen(true);
  };
  
  const handleDeleteCategory = (category: Category) => {
    setCurrentCategory(category);
    setIsDeleteDialogOpen(true);
  };
  
  const handleCreateCategory = () => {
    if (!formData.name) {
      toast({
        title: "Error",
        description: "El nombre es requerido",
        variant: "destructive",
      });
      return;
    }

    // Generar slug a partir del nombre si no se especifica
    const slug = formData.slug || formData.name.toLowerCase()
      .replace(/[áéíóúñü]/g, c => ({ á: 'a', é: 'e', í: 'i', ó: 'o', ú: 'u', ñ: 'n', ü: 'u' })[c] || c)
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    // Crear objeto de datos con el slug generado
    const categoryData = {
      ...formData,
      slug,
      parentId: currentParentId
    };

    // Mostrar los datos que se van a enviar
    console.log('Datos de la categoría a crear:', categoryData);

    createCategoryMutation.mutate(categoryData);
  };
  
  const handleUpdateCategory = () => {
    if (!currentCategory) return;
    
    updateCategoryMutation.mutate({
      id: currentCategory.id,
      data: {
        ...formData,
        parentId: currentParentId
      }
    });
  };
  
  const handleDeleteConfirm = () => {
    if (!currentCategory) return;
    deleteCategoryMutation.mutate(currentCategory.id);
  };
  
  const handleSelectCategory = (category: Category | null) => {
    if (onSelectCategory) {
      onSelectCategory(
        category ? category.id : null,
        category ? category.name : "Sin categoría"
      );
    }
  };
  
  // Función recursiva para renderizar el árbol de categorías
  const renderCategoryTree = (parentId: number | null = null, level: number = 0) => {
    const filteredCategories = categoryTree.filter(cat => cat.parentId === parentId);
    
    if (filteredCategories.length === 0) {
      return null;
    }
    
    return (
      <div className={`ml-${level > 0 ? '4' : '0'}`}>
        {filteredCategories.map(category => {
          const hasChildren = categoryTree.some(cat => cat.parentId === category.id);
          const isExpanded = expandedCategories.has(category.id);
          const isSelected = selectedCategoryId === category.id;
          
          return (
            <div key={category.id} className="mb-1">
              <div 
                className={`flex items-center p-2 rounded-md transition-colors ${
                  isSelected ? 'bg-primary/10 border border-primary/30' : 'hover:bg-accent'
                }`}
              >
                <div className="flex-1 flex items-center cursor-pointer" onClick={() => handleSelectCategory(category)}>
                  {hasChildren ? (
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-6 w-6 mr-1" 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleExpand(category.id);
                      }}
                    >
                      <Folder size={16} className={`transform transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                    </Button>
                  ) : (
                    <Folder size={16} className="mr-2 ml-1 text-muted-foreground" />
                  )}
                  <span className={`ml-1 ${category.active === false ? 'text-muted-foreground line-through' : ''}`}>
                    {category.name}
                  </span>
                  {category.active === false && (
                    <Badge variant="outline" className="ml-2 text-xs">Inactiva</Badge>
                  )}
                </div>
                
                <div className="flex items-center gap-1">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-7 w-7" 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAddCategory(category.id);
                    }}
                  >
                    <FolderPlus size={14} />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-7 w-7" 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditCategory(category);
                    }}
                  >
                    <Edit size={14} />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-7 w-7 text-destructive hover:text-destructive" 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteCategory(category);
                    }}
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              </div>
              
              {hasChildren && isExpanded && (
                <div className="ml-4 mt-1 pl-2 border-l-2 border-border">
                  {renderCategoryTree(category.id, level + 1)}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };
  
  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Categorías de Productos</h3>
        <Button onClick={() => handleAddCategory()} size="sm">
          <Plus size={16} className="mr-1" />
          Agregar Categoría
        </Button>
      </div>
      
      <Card className="flex-1 overflow-hidden">
        <CardHeader className="p-4 pb-2">
          <CardTitle className="text-md flex items-center">
            <Folder className="mr-2" size={18} />
            Estructura de categorías
          </CardTitle>
          <CardDescription>
            Gestione la jerarquía de categorías para organizar sus productos
          </CardDescription>
        </CardHeader>
        
        <CardContent className="p-4 pt-0">
          <ScrollArea className="h-[400px] pr-4">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <p>Cargando categorías...</p>
              </div>
            ) : categoryTree.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                <FolderX size={40} className="mb-2" />
                <p>No hay categorías definidas</p>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => handleAddCategory()} 
                  className="mt-2"
                >
                  <Plus size={14} className="mr-1" />
                  Crear categoría
                </Button>
              </div>
            ) : (
              <div className="mt-2">
                {/* Opción para "Sin categoría" */}
                <div 
                  className={`flex items-center p-2 rounded-md transition-colors mb-2 ${
                    selectedCategoryId === null ? 'bg-primary/10 border border-primary/30' : 'hover:bg-accent'
                  }`}
                  onClick={() => handleSelectCategory(null)}
                >
                  <FileX size={16} className="mr-2 text-muted-foreground" />
                  <span>Sin categoría</span>
                </div>
                
                {/* Árbol de categorías */}
                {renderCategoryTree()}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
      
      {/* Diálogo para agregar categoría */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Agregar nueva categoría</DialogTitle>
            <DialogDescription>
              {currentParentId 
                ? `Crear subcategoría en ${categories.find((c: Category) => c.id === currentParentId)?.name || "categoría padre"}`
                : "Crear categoría principal"
              }
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre</Label>
              <Input 
                id="name" 
                value={formData.name} 
                onChange={(e) => setFormData({...formData, name: e.target.value})}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="slug">Slug (URL amigable)</Label>
              <Input 
                id="slug" 
                value={formData.slug} 
                onChange={(e) => setFormData({...formData, slug: e.target.value})}
                placeholder="Se generará automáticamente"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Descripción</Label>
              <Textarea 
                id="description" 
                value={formData.description} 
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Descripción opcional"
                rows={3}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="imageUrl">URL de Imagen</Label>
              <Input 
                id="imageUrl" 
                value={formData.imageUrl} 
                onChange={(e) => setFormData({...formData, imageUrl: e.target.value})}
                placeholder="URL de imagen (opcional)"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="displayOrder">Orden de Visualización</Label>
              <Input 
                id="displayOrder" 
                type="number" 
                value={formData.displayOrder.toString()} 
                onChange={(e) => setFormData({...formData, displayOrder: parseInt(e.target.value) || 0})}
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch 
                id="active" 
                checked={formData.active} 
                onCheckedChange={(checked) => setFormData({...formData, active: checked})}
              />
              <Label htmlFor="active">Categoría activa</Label>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleCreateCategory} 
              disabled={!formData.name}
            >
              <Check size={16} className="mr-2" />
              Crear Categoría
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Diálogo para editar categoría */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Editar categoría</DialogTitle>
            <DialogDescription>
              {currentCategory?.name || ""}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Nombre</Label>
              <Input 
                id="edit-name" 
                value={formData.name} 
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="Nombre de la categoría"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-description">Descripción</Label>
              <Textarea 
                id="edit-description" 
                value={formData.description} 
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Descripción opcional"
                rows={3}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-imageUrl">URL de Imagen</Label>
              <Input 
                id="edit-imageUrl" 
                value={formData.imageUrl} 
                onChange={(e) => setFormData({...formData, imageUrl: e.target.value})}
                placeholder="URL de imagen (opcional)"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-displayOrder">Orden de Visualización</Label>
              <Input 
                id="edit-displayOrder" 
                type="number" 
                value={formData.displayOrder.toString()} 
                onChange={(e) => setFormData({...formData, displayOrder: parseInt(e.target.value) || 0})}
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch 
                id="edit-active" 
                checked={formData.active} 
                onCheckedChange={(checked) => setFormData({...formData, active: checked})}
              />
              <Label htmlFor="edit-active">Categoría activa</Label>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-parent">Categoría Padre</Label>
              <div className="flex items-center space-x-2">
                <select 
                  id="edit-parent"
                  className="w-full p-2 border rounded-md"
                  value={currentParentId === null ? "" : currentParentId}
                  onChange={(e) => setCurrentParentId(e.target.value === "" ? null : Number(e.target.value))}
                >
                  <option value="">Sin categoría padre</option>
                  {categories.filter((c: Category) => c.id !== currentCategory?.id)
                    .map((c: Category) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                </select>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleUpdateCategory} 
              disabled={!formData.name}
            >
              <Check size={16} className="mr-2" />
              Guardar Cambios
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Diálogo de confirmación para eliminar */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Confirma eliminar esta categoría?</AlertDialogTitle>
            <AlertDialogDescription>
              {currentCategory && (
                <>
                  Está a punto de eliminar la categoría <strong>{currentCategory.name}</strong>.
                  <br />
                  <br />
                  Esta acción no se puede deshacer. Si existen productos o subcategorías 
                  asignadas a esta categoría, la operación fallará.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive text-destructive-foreground">
              <Trash2 size={16} className="mr-2" />
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}