import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { quotationService } from "../services/quotationService";
import { QuotationFormData } from "../types/quotation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import { Textarea } from "@/components/ui/textarea";
import { DatePicker } from "@/components/ui/date-picker";
import { apiRequest } from "@/lib/queryClient";

// Schema para el formulario de presupuesto
const quotationFormSchema = z.object({
  clientId: z.number({
    required_error: "Por favor seleccione un cliente",
  }),
  dateValidUntil: z.date({
    required_error: "Por favor seleccione una fecha de validez",
  }),
  notes: z.string().optional(),
  items: z.array(
    z.object({
      productId: z.number({
        required_error: "Por favor seleccione un producto",
      }),
      quantity: z.number({
        required_error: "La cantidad es requerida",
      }).min(0.01, "La cantidad debe ser mayor a 0"),
      unitPrice: z.number({
        required_error: "El precio unitario es requerido",
      }).min(0.01, "El precio debe ser mayor a 0"),
      subtotal: z.number(),
    })
  ).min(1, "Debe agregar al menos un producto"),
});

type QuotationFormValues = z.infer<typeof quotationFormSchema>;

export default function QuotationFormPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  // Fetch clients
  const { data: clients } = useQuery({
    queryKey: ["/api/customers"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/customers");
      return await res.json();
    },
  });

  // Fetch products
  const { data: products } = useQuery({
    queryKey: ["/api/products"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/products");
      return await res.json();
    },
  });

  const form = useForm<QuotationFormValues>({
    resolver: zodResolver(quotationFormSchema),
    defaultValues: {
      clientId: 0,
      dateValidUntil: new Date(),
      notes: "",
      items: [],
    },
  });

  const onSubmit = async (data: QuotationFormValues) => {
    setLoading(true);
    try {
      await quotationService.createQuotation({
        clientId: data.clientId,
        dateValidUntil: data.dateValidUntil.toISOString(),
        notes: data.notes,
        items: data.items.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          subtotal: item.subtotal,
        })),
      });
      toast({
        title: "Presupuesto creado",
        description: "El presupuesto se ha creado correctamente",
      });
      navigate("/quotations");
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al crear el presupuesto",
        variant: "destructive",
      });
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = () => {
    const items = form.getValues("items");
    form.setValue("items", [
      ...items,
      {
        productId: 0,
        quantity: 1,
        unitPrice: 0,
        subtotal: 0,
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    const items = form.getValues("items");
    form.setValue("items", items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: keyof typeof item, value: string) => {
    const items = form.getValues("items");
    const item = { ...items[index] };

    if (field === "quantity" || field === "unitPrice") {
      const numValue = parseFloat(value);
      item[field] = numValue;
      item.subtotal = item.quantity * item.unitPrice;
    } else {
      item[field] = parseInt(value);
    }

    items[index] = item;
    form.setValue("items", items);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Nuevo Presupuesto</h1>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Información del Presupuesto</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="clientId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cliente</FormLabel>
                    <Select
                      value={field.value?.toString()}
                      onValueChange={(value) => field.onChange(parseInt(value))}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar cliente" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {clients?.map((client: any) => (
                          <SelectItem key={client.id} value={client.id.toString()}>
                            {client.name}
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
                name="dateValidUntil"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Válido hasta</FormLabel>
                    <FormControl>
                      <DatePicker
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="Seleccionar fecha de validez"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notas</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Observaciones sobre el presupuesto"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Items del Presupuesto</CardTitle>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddItem}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar Item
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {form.watch("items").map((item, index) => (
                <div key={index} className="grid grid-cols-5 gap-4 mb-4">
                  <FormField
                    control={form.control}
                    name={`items.${index}.productId`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Producto</FormLabel>
                        <Select
                          value={field.value?.toString()}
                          onValueChange={(value) => {
                            field.onChange(parseInt(value));
                            handleItemChange(index, "productId", value);
                          }}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccionar producto" />
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
                            {...field}
                            onChange={(e) => {
                              field.onChange(e);
                              handleItemChange(index, "quantity", e.target.value);
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`items.${index}.unitPrice`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Precio Unitario</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            onChange={(e) => {
                              field.onChange(e);
                              handleItemChange(index, "unitPrice", e.target.value);
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`items.${index}.subtotal`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Subtotal</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            readOnly
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex items-end">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveItem(index)}
                      className="text-red-500"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/quotations")}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading}
            >
              {loading ? "Guardando..." : "Guardar"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
} 