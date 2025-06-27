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
import { ProductLabel } from "../printing/ProductLabel";
import { LabelPreview } from "../printing/LabelPreview";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type BarcodesTabProps = {
  form: UseFormReturn<any>;
  barcodesList: string[];
  setBarcodesList: React.Dispatch<React.SetStateAction<string[]>>;
};

export function BarcodesTab({ form, barcodesList, setBarcodesList }: BarcodesTabProps) {
  const { toast } = useToast();
  const [newBarcode, setNewBarcode] = useState("");
  const [labelWidth, setLabelWidth] = useState(40);
  const [labelHeight, setLabelHeight] = useState(30);
  const [labelShape, setLabelShape] = useState<'rectangle' | 'rounded' | 'circle'>('rectangle');

  const addBarcode = () => {
    if (!newBarcode) {
      toast({
        title: "Dato incompleto",
        description: "Debe ingresar un código de barras",
        variant: "destructive",
      });
      return;
    }

    if (barcodesList.includes(newBarcode)) {
      toast({
        title: "Código duplicado",
        description: "Este código de barras ya existe",
        variant: "destructive",
      });
      return;
    }

    const newBarcodesList = [...barcodesList, newBarcode];
    setBarcodesList(newBarcodesList);
    form.setValue("barcodes", newBarcodesList.join(", "));
    setNewBarcode("");
  };

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
            <Button type="button" onClick={addBarcode}>
              <Plus className="mr-2 h-4 w-4" />
              Agregar
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            <Input
              type="number"
              className="w-24"
              value={labelWidth}
              onChange={(e) => setLabelWidth(parseInt(e.target.value) || 0)}
              placeholder="Ancho (mm)"
            />
            <Input
              type="number"
              className="w-24"
              value={labelHeight}
              onChange={(e) => setLabelHeight(parseInt(e.target.value) || 0)}
              placeholder="Alto (mm)"
            />
            <Select value={labelShape} onValueChange={(v) => setLabelShape(v as 'rectangle' | 'rounded' | 'circle')}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Forma" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="rectangle">Rectangular</SelectItem>
                <SelectItem value="rounded">Redondeada</SelectItem>
                <SelectItem value="circle">Circular</SelectItem>
              </SelectContent>
            </Select>
            <LabelPreview
              description={form.watch('name') || ''}
              barcode={newBarcode || barcodesList[0] || '0000000000000'}
              width={labelWidth}
              height={labelHeight}
              borderRadius={
                labelShape === 'rounded'
                  ? '3mm'
                  : labelShape === 'circle'
                  ? '50%'
                  : '0'
              }
            />
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
                    <div className="flex gap-2">
                      <ProductLabel
                        description={form.watch('name') || ''}
                        barcode={barcode}
                        width={labelWidth}
                        height={labelHeight}
                        borderRadius={
                          labelShape === 'rounded'
                            ? '3mm'
                            : labelShape === 'circle'
                            ? '50%'
                            : '0'
                        }
                        variant="ghost"
                        size="icon"
                        label=""
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeBarcode(index)}
                      >
                        <Trash size={16} className="text-destructive" />
                      </Button>
                    </div>
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

