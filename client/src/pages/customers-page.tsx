import { useState } from "react";
import { DashboardLayout } from "@/layouts/dashboard-layout";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Customer, insertCustomerSchema } from "../../../shared/schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Users,
  Search,
  Plus,
  Edit,
  Trash2,
  CreditCard,
  UserPlus,
  CheckCircle,
  XCircle,
} from "lucide-react";

// Extend the customer schema for client-side validation
const customerFormSchema = insertCustomerSchema.extend({
  // Add additional validations
  email: z.string().email({ message: "Email inválido" }).optional().or(z.literal("")),
  phone: z.string().min(6, { message: "Teléfono debe tener al menos 6 caracteres" }).optional().or(z.literal("")),
  creditLimit: z.coerce.number().min(0, "El límite de crédito debe ser mayor o igual a 0").optional(),
}).extend({
  hasCurrentAccount: z.boolean().default(true), // Habilitar cuenta corriente por defecto
  currentBalance: z.string().default("0"), // Saldo inicial en 0
});

type CustomerFormValues = z.infer<typeof customerFormSchema>;

export default function CustomersPage() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isUpdateMode, setIsUpdateMode] = useState(false);
  const [currentCustomer, setCurrentCustomer] = useState<Customer | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterHasAccount, setFilterHasAccount] = useState<boolean | "all">("all");

  // Fetch customers
  const { data: customers, isLoading } = useQuery<Customer[]>({
    queryKey: ["/api/customers"],
  });

  // Create customer mutation
  const createCustomerMutation = useMutation({
    mutationFn: async (data: CustomerFormValues) => {
      const res = await apiRequest("POST", "/api/customers", data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Cliente creado",
        description: "El cliente ha sido creado exitosamente",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      setIsDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Error al crear el cliente: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Update customer mutation
  const updateCustomerMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: CustomerFormValues }) => {
      const res = await apiRequest("PUT", `/api/customers/${id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Cliente actualizado",
        description: "El cliente ha sido actualizado exitosamente",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      setIsDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Error al actualizar el cliente: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Setup form with react-hook-form
  const form = useForm<CustomerFormValues>({
    resolver: zodResolver(customerFormSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      address: "",
      documentId: "",
      hasCurrentAccount: true, // Habilitar cuenta corriente por defecto
      currentBalance: "0", // Saldo inicial en 0
      notes: "",
    },
  });

  // Filter customers based on search query and account status
  const filteredCustomers = customers?.filter((customer) => {
    const matchesSearch =
      customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (customer.email && customer.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (customer.phone && customer.phone.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (customer.documentId && customer.documentId.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesAccountFilter =
      filterHasAccount === "all" ||
      customer.hasCurrentAccount === filterHasAccount;

    return matchesSearch && matchesAccountFilter;
  });

  // Open dialog to add new customer
  const openNewCustomerDialog = () => {
    setIsUpdateMode(false);
    setCurrentCustomer(null);
    form.reset({
      name: "",
      email: "",
      phone: "",
      address: "",
      documentId: "",
      hasCurrentAccount: true, // Habilitar cuenta corriente por defecto
      currentBalance: "0", // Saldo inicial en 0
      notes: "",
    });
    setIsDialogOpen(true);
  };

  // Open dialog to edit customer
  const openEditCustomerDialog = (customer: Customer) => {
    setIsUpdateMode(true);
    setCurrentCustomer(customer);
    form.reset({
      name: customer.name,
      email: customer.email || "",
      phone: customer.phone || "",
      address: customer.address || "",
      documentId: customer.documentId || "",
      hasCurrentAccount: customer.hasCurrentAccount,
      currentBalance: customer.currentBalance.toString(),
      notes: customer.notes || "",
    });
    setIsDialogOpen(true);
  };

  // Handle form submission
  const onSubmit = (data: CustomerFormValues) => {
    if (isUpdateMode && currentCustomer) {
      updateCustomerMutation.mutate({
        id: currentCustomer.id,
        data: {
          ...data,
          hasCurrentAccount: true, // Forzar cuenta corriente habilitada
        },
      });
    } else {
      createCustomerMutation.mutate({
        ...data,
        hasCurrentAccount: true, // Forzar cuenta corriente habilitada
      });
    }
  };

  return (
    <DashboardLayout title="Clientes" description="Gestión de clientes">
      <div className="mb-6 flex justify-between items-center">
        <div className="flex space-x-2 items-center">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-neutral-500" />
            <Input
              placeholder="Buscar clientes..."
              className="pl-9 w-[300px]"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex space-x-2">
            <Button
              variant={filterHasAccount === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterHasAccount("all")}
            >
              Todos
            </Button>
            <Button
              variant={filterHasAccount === true ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterHasAccount(true)}
            >
              Con Cuenta Corriente
            </Button>
            <Button
              variant={filterHasAccount === false ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterHasAccount(false)}
            >
              Sin Cuenta Corriente
            </Button>
          </div>
        </div>

        <Button onClick={openNewCustomerDialog}>
          <UserPlus className="mr-2 h-4 w-4" />
          Nuevo Cliente
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Lista de Clientes</CardTitle>
          <CardDescription>
            Total: {filteredCustomers?.length || 0} clientes
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-4">Cargando clientes...</div>
          ) : filteredCustomers && filteredCustomers.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Contacto</TableHead>
                  <TableHead>Documento</TableHead>
                  <TableHead>Cuenta Corriente</TableHead>
                  <TableHead className="text-right">Saldo</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCustomers.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell className="font-medium">{customer.name}</TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {customer.email && (
                          <div className="text-xs">{customer.email}</div>
                        )}
                        {customer.phone && (
                          <div className="text-xs">{customer.phone}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{customer.documentId || "-"}</TableCell>
                    <TableCell>
                      <Badge variant={customer.hasCurrentAccount ? "default" : "secondary"}>
                        {customer.hasCurrentAccount ? "Con Cuenta" : "Sin Cuenta"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <span
                        className={`font-mono ${
                          parseFloat(customer.currentBalance.toString()) > 0
                            ? "text-red-600"
                            : parseFloat(customer.currentBalance.toString()) < 0
                            ? "text-green-600"
                            : ""
                        }`}
                      >
                        ${Math.abs(parseFloat(customer.currentBalance.toString())).toFixed(2)}
                        {parseFloat(customer.currentBalance.toString()) !== 0 && (
                          <span className="ml-1 text-xs">
                            {parseFloat(customer.currentBalance.toString()) > 0
                              ? "debe"
                              : "a favor"}
                          </span>
                        )}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditCustomerDialog(customer)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                ¿Eliminar cliente?
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                Esta acción no se puede deshacer. ¿Está seguro de
                                eliminar el cliente "{customer.name}"?
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction className="bg-red-500 hover:bg-red-600">
                                Eliminar
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8">
              <Users className="h-12 w-12 mx-auto text-neutral-300 mb-2" />
              <h3 className="text-lg font-medium">No hay clientes</h3>
              <p className="text-neutral-500 mb-4">
                No se encontraron clientes con los filtros actuales
              </p>
              <Button onClick={openNewCustomerDialog}>
                <UserPlus className="mr-2 h-4 w-4" />
                Agregar Cliente
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Customer Form Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {isUpdateMode ? "Editar Cliente" : "Nuevo Cliente"}
            </DialogTitle>
            <DialogDescription>
              {isUpdateMode
                ? "Actualice los datos del cliente"
                : "Complete los datos para crear un nuevo cliente"}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-6 py-4"
            >
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre Completo</FormLabel>
                    <FormControl>
                      <Input placeholder="Nombre y apellido" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input placeholder="ejemplo@correo.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Teléfono</FormLabel>
                      <FormControl>
                        <Input placeholder="Teléfono" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="documentId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Documento de Identidad</FormLabel>
                      <FormControl>
                        <Input placeholder="DNI / CUIT / CUIL" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="province"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Provincia</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccione una provincia" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Buenos Aires">Buenos Aires</SelectItem>
                          <SelectItem value="CABA">Ciudad Autónoma de Buenos Aires</SelectItem>
                          <SelectItem value="Catamarca">Catamarca</SelectItem>
                          <SelectItem value="Chaco">Chaco</SelectItem>
                          <SelectItem value="Chubut">Chubut</SelectItem>
                          <SelectItem value="Córdoba">Córdoba</SelectItem>
                          <SelectItem value="Corrientes">Corrientes</SelectItem>
                          <SelectItem value="Entre Ríos">Entre Ríos</SelectItem>
                          <SelectItem value="Formosa">Formosa</SelectItem>
                          <SelectItem value="Jujuy">Jujuy</SelectItem>
                          <SelectItem value="La Pampa">La Pampa</SelectItem>
                          <SelectItem value="La Rioja">La Rioja</SelectItem>
                          <SelectItem value="Mendoza">Mendoza</SelectItem>
                          <SelectItem value="Misiones">Misiones</SelectItem>
                          <SelectItem value="Neuquén">Neuquén</SelectItem>
                          <SelectItem value="Río Negro">Río Negro</SelectItem>
                          <SelectItem value="Salta">Salta</SelectItem>
                          <SelectItem value="San Juan">San Juan</SelectItem>
                          <SelectItem value="San Luis">San Luis</SelectItem>
                          <SelectItem value="Santa Cruz">Santa Cruz</SelectItem>
                          <SelectItem value="Santa Fe">Santa Fe</SelectItem>
                          <SelectItem value="Santiago del Estero">Santiago del Estero</SelectItem>
                          <SelectItem value="Tierra del Fuego">Tierra del Fuego</SelectItem>
                          <SelectItem value="Tucumán">Tucumán</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Localidad</FormLabel>
                      <FormControl>
                        <Input placeholder="Ingrese la localidad" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Dirección</FormLabel>
                      <FormControl>
                        <Input placeholder="Dirección" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="hasCurrentAccount"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">
                        Cuenta Corriente
                      </FormLabel>
                      <FormDescription>
                        Habilitar cuenta corriente para este cliente
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              {(form.watch("hasCurrentAccount") || isUpdateMode) && (
                <FormField
                  control={form.control}
                  name="currentBalance"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Saldo Actual</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="Saldo"
                          {...field}
                          disabled={!isUpdateMode}
                        />
                      </FormControl>
                      <FormDescription>
                        {isUpdateMode
                          ? "Actualice el saldo manualmente si es necesario"
                          : "El saldo inicial es 0"}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notas</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Observaciones sobre el cliente"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="creditLimit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Límite de Crédito</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" min="0" {...field} />
                    </FormControl>
                    <FormDescription>
                      Monto máximo que el cliente puede adeudar (0 para sin límite)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit">
                  {isUpdateMode ? "Actualizar" : "Crear"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
