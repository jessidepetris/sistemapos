import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ChevronDown, ChevronRight, Edit, Plus, Trash2 } from "lucide-react";
import { DashboardLayout } from "@/layouts/dashboard-layout";

interface Category {
  id: number;
  name: string;
  description: string | null;
  imageUrl: string | null;
  parentId: number | null;
  displayOrder: number;
  active: boolean;
  children?: Category[];
  slug: string;
}

export default function CategoriesPage() {
  const { toast } = useToast();
  const reactQueryClient = useQueryClient();
  const [expandedCategories, setExpandedCategories] = useState<number[]>([]);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [newCategory, setNewCategory] = useState<Partial<Category>>({
    name: "",
    description: "",
    parentId: null,
    displayOrder: 0,
    active: true,
    slug: ""
  });

  // Obtener todas las categorías
  const { data: categories, isLoading } = useQuery({
    queryKey: ["/api/product-categories"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/product-categories");
      if (!response.ok) throw new Error("Error al cargar categorías");
      return response.json();
    },
  });

  // Construir árbol de categorías
  const buildCategoryTree = (categories: Category[]): Category[] => {
    const categoryMap = new Map<number, Category>();
    const rootCategories: Category[] = [];

    // Primero, crear un mapa de todas las categorías
    categories.forEach(category => {
      categoryMap.set(category.id, { ...category, children: [] });
    });

    // Luego, construir la jerarquía
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

  // Mutación para crear categoría
  const createCategoryMutation = useMutation({
    mutationFn: async (category: Partial<Category>) => {
      // Generar slug a partir del nombre si no se especifica
      const slug = category.slug || category.name
        ?.toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");

      const categoryData = {
        ...category,
        slug
      };

      const response = await apiRequest("POST", "/api/product-categories", categoryData);
      if (!response.ok) throw new Error("Error al crear categoría");
      return response.json();
    },
    onSuccess: () => {
      reactQueryClient.invalidateQueries({ queryKey: ["/api/product-categories"] });
      toast({ title: "Categoría creada correctamente" });
      setNewCategory({
        name: "",
        description: "",
        parentId: null,
        displayOrder: 0,
        active: true,
        slug: ""
      });
    },
    onError: (error) => {
      toast({
        title: "Error al crear categoría",
        description: (error as Error).message,
        variant: "destructive",
      });
    },
  });

  // Mutación para actualizar categoría
  const updateCategoryMutation = useMutation({
    mutationFn: async ({ id, category }: { id: number; category: Partial<Category> }) => {
      const response = await apiRequest("PUT", `/api/product-categories/${id}`, category);
      if (!response.ok) throw new Error("Error al actualizar categoría");
      return response.json();
    },
    onSuccess: () => {
      reactQueryClient.invalidateQueries({ queryKey: ["/api/product-categories"] });
      toast({ title: "Categoría actualizada correctamente" });
      setEditingCategory(null);
    },
    onError: (error) => {
      toast({
        title: "Error al actualizar categoría",
        description: (error as Error).message,
        variant: "destructive",
      });
    },
  });

  // Mutación para eliminar categoría
  const deleteCategoryMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/product-categories/${id}`);
      if (!response.ok) throw new Error("Error al eliminar categoría");
      return response.json();
    },
    onSuccess: () => {
      reactQueryClient.invalidateQueries({ queryKey: ["/api/product-categories"] });
      toast({ title: "Categoría eliminada correctamente" });
    },
    onError: (error) => {
      toast({
        title: "Error al eliminar categoría",
        description: (error as Error).message,
        variant: "destructive",
      });
    },
  });

  const toggleCategory = (categoryId: number) => {
    setExpandedCategories(prev =>
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const renderCategoryRow = (category: Category, level: number = 0): JSX.Element => {
    const isExpanded = expandedCategories.includes(category.id);
    const hasChildren = category.children && category.children.length > 0;

    return (
      <>
        <TableRow>
          <TableCell style={{ paddingLeft: `${level * 20}px` }}>
            <div className="flex items-center">
              {hasChildren && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => toggleCategory(category.id)}
                >
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </Button>
              )}
              <span>{category.name}</span>
            </div>
          </TableCell>
          <TableCell>{category.description || "-"}</TableCell>
          <TableCell>{category.displayOrder}</TableCell>
          <TableCell>
            <span className={`px-2 py-1 rounded-full text-xs ${
              category.active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
            }`}>
              {category.active ? "Activa" : "Inactiva"}
            </span>
          </TableCell>
          <TableCell className="text-right">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setEditingCategory(category)}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => deleteCategoryMutation.mutate(category.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </TableCell>
        </TableRow>
        {isExpanded && hasChildren && category.children!.map((child: Category): JSX.Element =>
          renderCategoryRow(child, level + 1)
        )}
      </>
    );
  };

  if (isLoading) {
    return <div>Cargando categorías...</div>;
  }

  const categoryTree = buildCategoryTree(categories || []);

  return (
    <DashboardLayout
      title="Gestión de Categorías"
      description="Organiza tus productos en categorías"
    >
      <div className="container py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Gestión de Categorías</h1>
          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Nueva Categoría
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nueva Categoría</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Nombre
                  </label>
                  <Input
                    value={newCategory.name}
                    onChange={(e) =>
                      setNewCategory({ ...newCategory, name: e.target.value })
                    }
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Slug (URL amigable)
                  </label>
                  <Input
                    value={newCategory.slug}
                    onChange={(e) =>
                      setNewCategory({ ...newCategory, slug: e.target.value })
                    }
                    placeholder="Se generará automáticamente"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Descripción
                  </label>
                  <Textarea
                    value={newCategory.description || ""}
                    onChange={(e) =>
                      setNewCategory({ ...newCategory, description: e.target.value })
                    }
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Orden de visualización
                  </label>
                  <Input
                    type="number"
                    value={newCategory.displayOrder}
                    onChange={(e) =>
                      setNewCategory({
                        ...newCategory,
                        displayOrder: parseInt(e.target.value) || 0,
                      })
                    }
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="active"
                    checked={newCategory.active}
                    onChange={(e) => setNewCategory({ ...newCategory, active: e.target.checked })}
                    className="mr-2"
                  />
                  <label htmlFor="active">Activa</label>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Categoría Padre</label>
                  <select
                    className="w-full p-2 border rounded"
                    value={newCategory.parentId || ""}
                    onChange={(e) => setNewCategory({ ...newCategory, parentId: e.target.value ? Number(e.target.value) : null })}
                  >
                    <option value="">Ninguna (Categoría Principal)</option>
                    {categories?.map((cat: Category) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                <Button
                  onClick={() => createCategoryMutation.mutate(newCategory)}
                  className="w-full"
                >
                  Crear Categoría
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Lista de Categorías</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead>Orden</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categoryTree.map(category => renderCategoryRow(category))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {editingCategory && (
          <Dialog open={!!editingCategory} onOpenChange={() => setEditingCategory(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Editar Categoría</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Nombre</label>
                  <Input
                    value={editingCategory.name}
                    onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Descripción</label>
                  <Textarea
                    value={editingCategory.description || ""}
                    onChange={(e) => setEditingCategory({ ...editingCategory, description: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Categoría Padre</label>
                  <select
                    className="w-full p-2 border rounded"
                    value={editingCategory.parentId || ""}
                    onChange={(e) => setEditingCategory({ ...editingCategory, parentId: e.target.value ? Number(e.target.value) : null })}
                  >
                    <option value="">Ninguna (Categoría Principal)</option>
                    {categories
                      ?.filter((cat: Category) => cat.id !== editingCategory.id)
                      .map((cat: Category) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Orden de Visualización</label>
                  <Input
                    type="number"
                    value={editingCategory.displayOrder}
                    onChange={(e) => setEditingCategory({ ...editingCategory, displayOrder: Number(e.target.value) })}
                  />
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="active"
                    checked={editingCategory.active}
                    onChange={(e) => setEditingCategory({ ...editingCategory, active: e.target.checked })}
                    className="mr-2"
                  />
                  <label htmlFor="active">Activa</label>
                </div>
                <Button
                  onClick={() => updateCategoryMutation.mutate({ id: editingCategory.id, category: editingCategory })}
                  className="w-full"
                >
                  Actualizar Categoría
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </DashboardLayout>
  );
}
