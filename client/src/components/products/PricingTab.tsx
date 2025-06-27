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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { formatCurrency } from "@/lib/utils";

type PricingTabProps = {
  form: UseFormReturn<any>;
  recalculatePrice: () => void;
  recalculateWholesalePrice: () => void;
};

export function PricingTab({ form, recalculatePrice, recalculateWholesalePrice }: PricingTabProps) {
  const currency = form.watch("currency") || "ARS";
  const costCurrency = form.watch("costCurrency") || "ARS";

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Configuración de Precios</CardTitle>
          <CardDescription>
            Configure los valores utilizados para calcular los precios finales (se actualizan automáticamente)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField
              control={form.control}
              name="costCurrency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Moneda del Costo</FormLabel>
                  <Select
                    onValueChange={(value) => {
                      field.onChange(value);
                      recalculatePrice();
                      recalculateWholesalePrice();
                    }}
                    defaultValue={field.value || "ARS"}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccione la moneda" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="ARS">Pesos Argentinos (ARS)</SelectItem>
                      <SelectItem value="USD">Dólares (USD)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="currency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Moneda de Venta</FormLabel>
                  <Select
                    onValueChange={(value) => {
                      field.onChange(value);
                      recalculatePrice();
                      recalculateWholesalePrice();
                    }}
                    defaultValue={field.value || "ARS"}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccione la moneda" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="ARS">Pesos Argentinos (ARS)</SelectItem>
                      <SelectItem value="USD">Dólares (USD)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="cost"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Costo ({costCurrency})</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      step="0.01"
                      min="0"
                      {...field} 
                      onChange={(e) => {
                        field.onChange(parseFloat(e.target.value));
                        recalculatePrice();
                        recalculateWholesalePrice();
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
              name="supplierDiscount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descuento Proveedor (%)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      step="0.01"
                      min="0"
                      max="100"
                      {...field} 
                      onChange={(e) => {
                        field.onChange(parseFloat(e.target.value));
                        // Actualizar precios automáticamente
                        recalculatePrice();
                        recalculateWholesalePrice();
                      }}
                    />
                  </FormControl>
                  <FormDescription>
                    Descuento aplicado al costo
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="unitsPerPack"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Unidades por Bulto</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="1"
                      min="1"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Cantidad de unidades que trae el bulto
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
                    <Select 
                      value={field.value}
                      onValueChange={(value) => {
                        field.onChange(value);
                        // Actualizar precios automáticamente
                        recalculatePrice();
                        recalculateWholesalePrice();
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar IVA" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">0%</SelectItem>
                        <SelectItem value="10.5">10.5%</SelectItem>
                        <SelectItem value="21">21%</SelectItem>
                      </SelectContent>
                    </Select>
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
                        // Actualizar precios automáticamente
                        recalculatePrice();
                        recalculateWholesalePrice();
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
          </div>
          
          <Separator className="my-4" />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Sección precio minorista */}
            <div className="space-y-4">
              <CardTitle className="text-md">Precio Minorista</CardTitle>
              
              <FormField
                control={form.control}
                name="profit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Margen de Ganancia Minorista (%)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.01"
                        min="0"
                        max="1000"
                        placeholder="55"
                        {...field} 
                        value={field.value !== undefined ? field.value : 55}
                        onChange={(e) => {
                          field.onChange(parseFloat(e.target.value));
                          // Actualizar precio automáticamente
                          recalculatePrice();
                        }}
                      />
                    </FormControl>
                    <FormDescription>
                      Porcentaje de beneficio sobre el costo para ventas minoristas
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
                    <FormLabel>Precio Final Minorista ({currency})</FormLabel>
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
                          className="font-semibold"
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
                      Precio final de venta al público: {formatCurrency(field.value || 0, currency)}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            {/* Sección precio mayorista */}
            <div className="space-y-4">
              <CardTitle className="text-md">Precio Mayorista</CardTitle>
              
              <FormField
                control={form.control}
                name="wholesaleProfit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Margen de Ganancia Mayorista (%)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.01"
                        min="0"
                        max="1000"
                        placeholder="35"
                        {...field} 
                        value={field.value !== undefined ? field.value : 35}
                        onChange={(e) => {
                          field.onChange(parseFloat(e.target.value));
                          // Actualizar precio automáticamente
                          recalculateWholesalePrice();
                        }}
                      />
                    </FormControl>
                    <FormDescription>
                      Porcentaje de beneficio sobre el costo para ventas mayoristas
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="wholesalePrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Precio Final Mayorista ({currency})</FormLabel>
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
                          className="font-semibold"
                        />
                      </FormControl>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={recalculateWholesalePrice}
                        className="shrink-0"
                      >
                        <RefreshCcw className="h-4 w-4 mr-2" />
                        Actualizar
                      </Button>
                    </div>
                    <FormDescription>
                      Precio final para clientes mayoristas: {formatCurrency(field.value || 0, currency)}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
