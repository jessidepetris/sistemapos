import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2 } from "lucide-react";

// Schema para el formulario de compras
const purchaseFormSchema = z.object({
  supplierId: z.number({
    required_error: "Por favor seleccione un proveedor",
  }),
  paymentMethod: z.string({
    required_error: "Por favor seleccione un método de pago",
  }),
  documentType: z.string().default("remito"),
  invoiceNumber: z.string().optional(),
  notes: z.string().optional(),
  items: z.array(
    z.object({
      productId: z.number({
        required_error: "Por favor seleccione un producto",
      }),
      quantity: z.number({
        required_error: "La cantidad es requerida",
      }).min(0.01, "La cantidad debe ser mayor a 0"),
      cost: z.number({
        required_error: "El costo es requerido",
      }).min(0.01, "El costo debe ser mayor a 0"),
      unit: z.string().default("unidad"),
    })
  ).min(1, "Debe agregar al menos un producto"),
});

type PurchaseFormValues = z.infer<typeof purchaseFormSchema>;

interface PurchaseFormProps {
  purchase?: any;
  onSuccess: () => void;
}

export function PurchaseForm({ purchase, onSuccess }: PurchaseFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Obtener proveedores
  const { data: suppliers } = useQuery({
    queryKey: ["/api/suppliers"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/suppliers");
      if (!response.ok) throw new Error("Error al cargar proveedores");
      return response.json();
    },
  });

  // Obtener productos
  const { data: products } = useQuery({
    queryKey: ["/api/products"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/products");
      if (!response.ok) throw new Error("Error al cargar productos");
      return response.json();
    },
  });

  // Form definition
  const form = useForm<PurchaseFormValues>({
    resolver: zodResolver(purchaseFormSchema),
    defaultValues: {
      supplierId: purchase?.supplierId,
      paymentMethod: purchase?.paymentMethod || "",
      documentType: purchase?.documentType || "remito",
      invoiceNumber: purchase?.invoiceNumber || "",
      notes: purchase?.notes || "",
      items: purchase?.items?.map((item: { productId: number; quantity: string; cost: string; unit: string }) => ({
        productId: item.productId,
        quantity: parseFloat(item.quantity),
        cost: parseFloat(item.cost),
        unit: item.unit,
      })) || [{ productId: 0, quantity: 1, cost: 0.01, unit: "unidad" }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  // Create purchase mutation
  const createPurchaseMutation = useMutation({
    mutationFn: async (data: PurchaseFormValues) => {
      // Primero crear la compra
      const res = await apiRequest("POST", "/api/purchases", data);
      const purchase = await res.json();

      // Luego actualizar el costo de los productos
      await Promise.all(data.items.map(async (item) => {
        const product = products?.find((p: any) => p.id === item.productId);
        if (product && parseFloat(product.cost) !== item.cost) {
          await apiRequest("PUT", `/api/products/${item.productId}`, {
            cost: item.cost.toString()
          });
        }
      }));

      return purchase;
    },
    onSuccess: () => {
      toast({ title: "Compra creada correctamente" });
      form.reset();
      // Invalidar la caché de productos para que se actualice la lista
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      onSuccess();
    },
    onError: (error) => {
      toast({
        title: "Error al crear la compra",
        description: (error as Error).message,
        variant: "destructive",
      });
    }
  });

  // Update purchase mutation
  const updatePurchaseMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: PurchaseFormValues }) => {
      // Primero actualizar la compra
      const res = await apiRequest("PUT", `/api/purchases/${id}`, data);
      const purchase = await res.json();

      // Luego actualizar el costo de los productos
      await Promise.all(data.items.map(async (item) => {
        const product = products?.find((p: any) => p.id === item.productId);
        if (product && parseFloat(product.cost) !== item.cost) {
          await apiRequest("PUT", `/api/products/${item.productId}`, {
            cost: item.cost.toString()
          });
        }
      }));

      return purchase;
    },
    onSuccess: () => {
      toast({ title: "Compra actualizada correctamente" });
      // Invalidar la caché de productos para que se actualice la lista
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      onSuccess();
    },
    onError: (error) => {
      toast({
        title: "Error al actualizar la compra",
        description: (error as Error).message,
        variant: "destructive",
      });
    }
  });

  // Form submission handler
  const onSubmit = (data: PurchaseFormValues) => {
    // Calcular el total de la compra
    const total = data.items.reduce((sum, item) => {
      return sum + (item.quantity * item.cost);
    }, 0);

    // Preparar los datos para el servidor
    const purchaseData = {
      supplierId: data.supplierId,
      paymentMethod: data.paymentMethod,
      documentType: data.documentType,
      invoiceNumber: data.invoiceNumber || undefined,
      notes: data.notes || undefined,
      total: total,
      items: data.items.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
        cost: item.cost,
        unit: item.unit,
        total: item.quantity * item.cost
      }))
    };

    if (purchase) {
      updatePurchaseMutation.mutate({ id: purchase.id, data: purchaseData });
    } else {
      createPurchaseMutation.mutate(purchaseData);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="supplierId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Proveedor</FormLabel>
                <Select
                  onValueChange={(value) => field.onChange(parseInt(value))}
                  value={field.value?.toString()}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar proveedor" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {suppliers?.map((supplier: any) => (
                      <SelectItem key={supplier.id} value={supplier.id.toString()}>
                        {supplier.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="paymentMethod"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Método de Pago</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar método de pago" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="efectivo">Efectivo</SelectItem>
                    <SelectItem value="transferencia">Transferencia</SelectItem>
                    <SelectItem value="cheque">Cheque</SelectItem>
                    <SelectItem value="tarjeta">Tarjeta</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="documentType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo de Documento</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar tipo de documento" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="remito">Remito</SelectItem>
                    <SelectItem value="factura">Factura</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="invoiceNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Número de Documento</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Productos</CardTitle>
              <Button type="button" onClick={() => append({ productId: 0, quantity: 1, cost: 0.01, unit: "unidad" })}>
                <Plus className="mr-2 h-4 w-4" />
                Agregar Producto
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {fields.map((field, index) => (
                <div key={field.id} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                  <FormField
                    control={form.control}
                    name={`items.${index}.productId`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Producto</FormLabel>
                        <Select
                          onValueChange={(value) => {
                            const productId = parseInt(value);
                            field.onChange(productId);
                            // Autocompletar el costo con el último costo registrado del producto
                            const selectedProduct = products?.find((p: any) => p.id === productId);
                            if (selectedProduct && selectedProduct.cost) {
                              form.setValue(`items.${index}.cost`, parseFloat(selectedProduct.cost));
                            }
                          }}
                          value={field.value?.toString()}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccionar producto">
                                {products?.find((p: { id: number; name: string }) => p.id === field.value)?.name}
                              </SelectValue>
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {products?.map((product: any) => (
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

                  <FormField
                    control={form.control}
                    name={`items.${index}.quantity`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cantidad</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            step="0.01"
                            min="0.01"
                            {...field}
                            value={field.value || ""}
                            onChange={(e) => {
                              const value = parseFloat(e.target.value);
                              field.onChange(isNaN(value) ? 0 : value);
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`items.${index}.cost`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Costo</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            step="0.01"
                            min="0.01"
                            {...field}
                            value={field.value || ""}
                            onChange={(e) => {
                              const value = parseFloat(e.target.value);
                              field.onChange(isNaN(value) ? 0 : value);
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`items.${index}.unit`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Unidad</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccionar unidad" />
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

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => remove(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={onSuccess}>
            Cancelar
          </Button>
          <Button type="submit">
            {purchase ? "Actualizar Compra" : "Crear Compra"}
          </Button>
        </div>
      </form>
    </Form>
  );
} 
