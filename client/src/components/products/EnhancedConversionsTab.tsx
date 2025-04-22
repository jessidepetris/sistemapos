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
import { Plus, Trash, Barcode } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

// Tipo para las conversiones mejoradas que incluyen código de barras
type EnhancedConversion = {
  unit: string;
  factor: number;
  barcode?: string;
  description?: string;
};

type EnhancedConversionsTabProps = {
  form: UseFormReturn<any>;
  conversionRates: EnhancedConversion[];
  setConversionRates: React.Dispatch<React.SetStateAction<EnhancedConversion[]>>;
};

export function EnhancedConversionsTab({ 
  form, 
  conversionRates, 
  setConversionRates 
}: EnhancedConversionsTabProps) {
  const { toast } = useToast();
  const [newUnit, setNewUnit] = useState<string>("");
  const [newFactor, setNewFactor] = useState<number>(0);
  const [newBarcode, setNewBarcode] = useState<string>("");
  const [newDescription, setNewDescription] = useState<string>("");

  // Agregar una nueva conversión
  const addConversionRate = () => {
    if (!newUnit || !newFactor) {
      toast({
        title: "Datos incompletos",
        description: "Debe ingresar al menos la unidad y el factor de conversión",
        variant: "destructive",
      });
      return;
    }
    
    // Verificar que la unidad no exista ya
    const exists = conversionRates.some(cr => cr.unit.toLowerCase() === newUnit.toLowerCase());
    if (exists) {
      toast({
        title: "Unidad duplicada",
        description: "Ya existe una conversión para esta unidad",
        variant: "destructive",
      });
      return;
    }

    // Verificar que el código de barras no exista ya
    if (newBarcode) {
      const barcodeExists = conversionRates.some(cr => cr.barcode === newBarcode);
      if (barcodeExists) {
        toast({
          title: "Código de barras duplicado",
          description: "Este código de barras ya está asignado a otra presentación",
          variant: "destructive",
        });
        return;
      }
    }
    
    // Agregar a la lista de conversiones
    const newConversion: EnhancedConversion = { 
      unit: newUnit, 
      factor: newFactor,
      barcode: newBarcode || undefined,
      description: newDescription || undefined
    };
    
    const newConversionRates = [...conversionRates, newConversion];
    setConversionRates(newConversionRates);
    
    // Actualizar el valor en el formulario
    form.setValue("conversionRates", newConversionRates);
    
    // Limpiar los campos
    setNewUnit("");
    setNewFactor(0);
    setNewBarcode("");
    setNewDescription("");
  };
  
  // Remover una conversión
  const removeConversionRate = (indexToRemove: number) => {
    const newConversionRates = conversionRates.filter((_, index) => index !== indexToRemove);
    setConversionRates(newConversionRates);
    form.setValue("conversionRates", newConversionRates);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Presentaciones de Venta</CardTitle>
          <CardDescription>
            Configure las diferentes presentaciones para productos a granel con sus códigos de barras y factores de conversión
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <FormLabel>Unidad</FormLabel>
              <Select value={newUnit} onValueChange={setNewUnit}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar unidad" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="kg">Kilogramo</SelectItem>
                  <SelectItem value="g">Gramo</SelectItem>
                  <SelectItem value="lb">Libra</SelectItem>
                  <SelectItem value="oz">Onza</SelectItem>
                  <SelectItem value="l">Litro</SelectItem>
                  <SelectItem value="ml">Mililitro</SelectItem>
                  <SelectItem value="unidad">Unidad</SelectItem>
                  <SelectItem value="docena">Docena</SelectItem>
                  <SelectItem value="500g">500 gramos</SelectItem>
                  <SelectItem value="250g">250 gramos</SelectItem>
                  <SelectItem value="100g">100 gramos</SelectItem>
                  <SelectItem value="50g">50 gramos</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <FormLabel>Factor de Conversión</FormLabel>
              <Input 
                type="number" 
                step="0.000001" 
                min="0.000001"
                value={newFactor}
                onChange={(e) => setNewFactor(parseFloat(e.target.value))}
                placeholder="Ej: 1 para 1kg, 0.5 para 500g, 0.25 para 250g"
              />
              <FormDescription>
                Cuántas unidades base equivalen a 1 de esta presentación
              </FormDescription>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <FormLabel>Código de Barras</FormLabel>
              <div className="flex items-center space-x-2">
                <Barcode className="text-muted-foreground" size={20} />
                <Input 
                  value={newBarcode}
                  onChange={(e) => setNewBarcode(e.target.value)}
                  placeholder="Código único para esta presentación"
                />
              </div>
              <FormDescription>
                Código de barras específico para esta presentación
              </FormDescription>
            </div>
            
            <div>
              <FormLabel>Descripción</FormLabel>
              <Input 
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder="Ej: Paquete de 500g, Bolsa de 1kg"
              />
              <FormDescription>
                Descripción de la presentación para facturas e inventario
              </FormDescription>
            </div>
          </div>
          
          <div className="flex justify-end">
            <Button
              type="button"
              onClick={addConversionRate}
              className="w-full md:w-auto"
            >
              <Plus className="mr-2 h-4 w-4" />
              Agregar Presentación
            </Button>
          </div>
          
          <div className="mt-6">
            <h4 className="text-sm font-medium mb-3">Presentaciones Configuradas:</h4>
            {conversionRates.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                No hay presentaciones configuradas
              </div>
            ) : (
              <div className="space-y-2">
                {conversionRates.map((conversion, index) => (
                  <div 
                    key={index} 
                    className="flex items-center justify-between p-4 border rounded-md"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center">
                        <span className="font-medium text-lg">{conversion.unit}</span>
                        <span className="mx-2 text-muted-foreground">=</span>
                        <span>{conversion.factor} {form.getValues("baseUnit") || "unidades"}</span>
                      </div>
                      
                      {conversion.barcode && (
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Barcode size={14} className="mr-1" />
                          <span className="font-mono">{conversion.barcode}</span>
                        </div>
                      )}
                      
                      {conversion.description && (
                        <div className="text-sm text-muted-foreground">
                          {conversion.description}
                        </div>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeConversionRate(index)}
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