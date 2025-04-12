import React, { useState } from "react";
import { UseFormReturn } from "react-hook-form";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type ComponentsTabProps = {
  form: UseFormReturn<any>;
  products: any[];
  componentsList: {
    productId: number;
    productName: string;
    quantity: number;
    unit: string;
  }[];
  setComponentsList: React.Dispatch<React.SetStateAction<{
    productId: number;
    productName: string;
    quantity: number;
    unit: string;
  }[]>>;
  editingProductId: number | null;
};

export function ComponentsTab({
  form,
  products,
  componentsList,
  setComponentsList,
  editingProductId
}: ComponentsTabProps) {
  const { toast } = useToast();

  // Agregar componente
  const addComponent = () => {
    const productId = form.getValues("componentProductId");
    const quantity = form.getValues("componentQuantity");
    const unit = form.getValues("componentUnit");
    
    if (!productId || !quantity || !unit) {
      toast({
        title: "Datos incompletos",
        description: "Debe seleccionar un producto, cantidad y unidad",
        variant: "destructive",
      });
      return;
    }
    
    // Buscar el producto en la lista de productos
    const selectedProduct = products?.find((p) => p.id === productId);
    if (!selectedProduct) {
      toast({
        title: "Producto no encontrado",
        description: "El producto seleccionado no existe",
        variant: "destructive",
      });
      return;
    }
    
    // Verificar que no se esté agregando el mismo producto como componente
    if (editingProductId && editingProductId === productId) {
      toast({
        title: "Operación inválida",
        description: "No puede agregar el mismo producto como componente",
        variant: "destructive",
      });
      return;
    }
    
    // Verificar que el componente no exista ya
    const exists = componentsList.some(c => c.productId === productId);
    if (exists) {
      toast({
        title: "Componente duplicado",
        description: "Este producto ya ha sido agregado como componente",
        variant: "destructive",
      });
      return;
    }
    
    // Añadir a la lista de componentes
    const newComponent = {
      productId,
      productName: selectedProduct.name,
      quantity: parseFloat(quantity),
      unit
    };
    const newComponentsList = [...componentsList, newComponent];
    setComponentsList(newComponentsList);
    
    // Actualizar el valor en el formulario
    form.setValue("components", newComponentsList);
    
    // Limpiar los campos
    form.setValue("componentProductId", undefined);
    form.setValue("componentQuantity", 0);
    form.setValue("componentUnit", "unidad");
  };
  
  // Remover un componente
  const removeComponent = (indexToRemove: number) => {
    const newComponentsList = componentsList.filter((_, index) => index !== indexToRemove);
    setComponentsList(newComponentsList);
    form.setValue("components", newComponentsList);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Componentes del Producto</CardTitle>
          <CardDescription>
            Configure los productos que componen este combo o producto compuesto
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <FormField
                control={form.control}
                name="componentProductId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Producto</FormLabel>
                    <Select 
                      value={field.value?.toString()} 
                      onValueChange={(value) => field.onChange(value !== "none" ? parseInt(value) : undefined)}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar producto" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {products?.filter((p) => !p.isComposite && (!editingProductId || p.id !== editingProductId)).map((product) => (
                          <SelectItem key={product.id} value={product.id.toString()}>
                            {product.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="componentQuantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cantidad</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      step="0.01" 
                      min="0.01"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="componentUnit"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Unidad</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Unidad" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="unidad">Unidad</SelectItem>
                      <SelectItem value="kg">Kilogramo</SelectItem>
                      <SelectItem value="g">Gramo</SelectItem>
                      <SelectItem value="l">Litro</SelectItem>
                      <SelectItem value="ml">Mililitro</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          <div className="flex justify-end">
            <Button
              type="button"
              onClick={addComponent}
              className="w-full md:w-auto"
            >
              <Plus className="mr-2 h-4 w-4" />
              Agregar Componente
            </Button>
          </div>
          
          <div className="mt-6">
            <h4 className="text-sm font-medium mb-3">Componentes del Producto:</h4>
            {componentsList.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                No hay componentes agregados
              </div>
            ) : (
              <div className="space-y-2">
                {componentsList.map((component, index) => (
                  <div 
                    key={index} 
                    className="flex items-center justify-between p-3 border rounded-md"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{component.productName}</span>
                      <span className="text-muted-foreground">
                        {component.quantity} {component.unit}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeComponent(index)}
                    >
                      <Trash size={16} className="text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}