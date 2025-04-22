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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type BarcodesTabProps = {
  form: UseFormReturn<any>;
  barcodesList: string[];
  setBarcodesList: React.Dispatch<React.SetStateAction<string[]>>;
};

export function BarcodesTab({ form, barcodesList, setBarcodesList }: BarcodesTabProps) {
  const { toast } = useToast();
  const [newBarcode, setNewBarcode] = useState("");

  // Agregar un código de barras
  const addBarcode = () => {
    if (!newBarcode) {
      toast({
        title: "Dato incompleto",
        description: "Debe ingresar un código de barras",
        variant: "destructive",
      });
      return;
    }
    
    // Verificar que no exista ya
    if (barcodesList.includes(newBarcode)) {
      toast({
        title: "Código duplicado",
        description: "Este código de barras ya existe",
        variant: "destructive",
      });
      return;
    }
    
    // Agregar a la lista
    const newBarcodesList = [...barcodesList, newBarcode];
    setBarcodesList(newBarcodesList);
    
    // Actualizar el valor en el formulario como string separado por comas
    form.setValue("barcodes", newBarcodesList.join(", "));
    
    // Limpiar el campo
    setNewBarcode("");
  };
  
  // Remover un código de barras
  const removeBarcode = (indexToRemove: number) => {
    const newBarcodesList = barcodesList.filter((_, index) => index !== indexToRemove);
    setBarcodesList(newBarcodesList);
    form.setValue("barcodes", newBarcodesList.join(", "));
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Códigos de Barras</CardTitle>
          <CardDescription>
            Añada múltiples códigos de barras para este producto
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex space-x-2">
            <Input
              placeholder="Ingrese el código de barras"
              value={newBarcode}
              onChange={(e) => setNewBarcode(e.target.value)}
              className="flex-1"
            />
            <Button
              type="button"
              onClick={addBarcode}
            >
              <Plus className="mr-2 h-4 w-4" />
              Agregar
            </Button>
          </div>
          
          <div className="mt-4">
            <h4 className="text-sm font-medium mb-3">Códigos de Barras Registrados:</h4>
            {barcodesList.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                No hay códigos de barras registrados
              </div>
            ) : (
              <div className="space-y-2">
                {barcodesList.map((barcode, index) => (
                  <div 
                    key={index} 
                    className="flex items-center justify-between p-3 border rounded-md"
                  >
                    <span className="font-mono">{barcode}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeBarcode(index)}
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