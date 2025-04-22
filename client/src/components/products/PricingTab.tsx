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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { RefreshCcw } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type PricingTabProps = {
  form: UseFormReturn<any>;
  recalculatePrice: () => void;
};

export function PricingTab({ form, recalculatePrice }: PricingTabProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Configuración de Precios</CardTitle>
          <CardDescription>
            Configure los valores utilizados para calcular el precio final (se actualiza automáticamente)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField
              control={form.control}
              name="cost"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Costo ($)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      step="0.01"
                      min="0"
                      {...field} 
                      onChange={(e) => {
                        field.onChange(parseFloat(e.target.value));
                        // Actualizar precio automáticamente
                        recalculatePrice();
                      }}
                    />
                  </FormControl>
                  <FormDescription>
                    Costo de adquisición
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="iva"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>IVA (%)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      step="0.01"
                      min="0"
                      max="100"
                      {...field} 
                      onChange={(e) => {
                        field.onChange(parseFloat(e.target.value));
                        // Actualizar precio automáticamente
                        recalculatePrice();
                      }}
                    />
                  </FormControl>
                  <FormDescription>
                    Impuesto al valor agregado
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="shipping"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Logística (%)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      step="0.01"
                      min="0"
                      max="100"
                      {...field} 
                      onChange={(e) => {
                        field.onChange(parseFloat(e.target.value));
                        // Actualizar precio automáticamente
                        recalculatePrice();
                      }}
                    />
                  </FormControl>
                  <FormDescription>
                    Costo adicional por transporte
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="profit"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Margen de Ganancia (%)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      step="0.01"
                      min="0"
                      max="1000"
                      {...field} 
                      onChange={(e) => {
                        field.onChange(parseFloat(e.target.value));
                        // Actualizar precio automáticamente
                        recalculatePrice();
                      }}
                    />
                  </FormControl>
                  <FormDescription>
                    Porcentaje de beneficio sobre el costo
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Precio Final ($)</FormLabel>
                  <div className="flex space-x-2">
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.01"
                        min="0"
                        {...field} 
                        onChange={(e) => {
                          field.onChange(parseFloat(e.target.value));
                        }}
                      />
                    </FormControl>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={recalculatePrice}
                      className="shrink-0"
                    >
                      <RefreshCcw className="h-4 w-4 mr-2" />
                      Actualizar
                    </Button>
                  </div>
                  <FormDescription>
                    Precio final de venta al público
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}