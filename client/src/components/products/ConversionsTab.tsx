import React from "react";
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

type ConversionsTabProps = {
  form: UseFormReturn<any>;
  conversionRates: Array<{ unit: string; factor: number }>;
  setConversionRates: React.Dispatch<React.SetStateAction<Array<{ unit: string; factor: number }>>>;
};

export function ConversionsTab({ 
  form, 
  conversionRates, 
  setConversionRates 
}: ConversionsTabProps) {
  const { toast } = useToast();

  // Agregar una nueva conversión
  const addConversionRate = () => {
    const unit = form.getValues("conversionUnit");
    const factor = form.getValues("conversionFactor");
    
    if (!unit || !factor) {
      toast({
        title: "Datos incompletos",
        description: "Debe ingresar la unidad y el factor de conversión",
        variant: "destructive",
      });
      return;
    }
    
    // Verificar que la unidad no exista ya
    const exists = conversionRates.some(cr => cr.unit.toLowerCase() === unit.toLowerCase());
    if (exists) {
      toast({
        title: "Unidad duplicada",
        description: "Ya existe una conversión para esta unidad",
        variant: "destructive",
      });
      return;
    }
    
    // Agregar a la lista de conversiones
    const newConversionRates = [...conversionRates, { unit, factor }];
    setConversionRates(newConversionRates);
    
    // Actualizar el valor en el formulario
    form.setValue("conversionRates", newConversionRates);
    
    // Limpiar los campos
    form.setValue("conversionUnit", "");
    form.setValue("conversionFactor", 0);
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
          <CardTitle>Conversiones de Unidades</CardTitle>
          <CardDescription>
            Configure las conversiones para productos a granel
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField
              control={form.control}
              name="conversionUnit"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Unidad</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || ""}>
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
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="conversionFactor"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Factor de Conversión</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      step="0.000001" 
                      min="0.000001"
                      {...field} 
                      onChange={(e) => {
                        field.onChange(parseFloat(e.target.value));
                      }}
                    />
                  </FormControl>
                  <FormDescription>
                    Cuántas unidades base equivalen a 1 de esta unidad
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="flex items-end">
              <Button
                type="button"
                onClick={addConversionRate}
                className="w-full"
              >
                <Plus className="mr-2 h-4 w-4" />
                Agregar Conversión
              </Button>
            </div>
          </div>
          
          <div className="mt-6">
            <h4 className="text-sm font-medium mb-3">Conversiones Configuradas:</h4>
            {conversionRates.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                No hay conversiones configuradas
              </div>
            ) : (
              <div className="space-y-2">
                {conversionRates.map((conversion, index) => (
                  <div 
                    key={index} 
                    className="flex items-center justify-between p-3 border rounded-md"
                  >
                    <div>
                      <span className="font-medium">1 {conversion.unit}</span>
                      <span className="mx-2">=</span>
                      <span>{conversion.factor} {form.getValues("baseUnit") || "unidades"}</span>
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