import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader,
  DialogTitle, DialogDescription
} from "@/components/ui/dialog";
import {
  Form, FormControl, FormField,
  FormItem, FormLabel, FormMessage
} from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertNoteSchema } from "@shared/schema";
import { Calendar, Eye, FileEdit, Plus, Search, Printer, ExternalLink } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/use-auth";
import { Link } from "wouter";

const noteFormSchema = insertNoteSchema.extend({
  amount: z.coerce.number().min(0.01, "El monto debe ser mayor a 0"),
  type: z.enum(["credit", "debit"]),
  reason: z.string().min(1, "La razón es requerida"),
});

type NoteFormValues = z.infer<typeof noteFormSchema>;

export default function CreditNotesPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [dateRange, setDateRange] = useState({ startDate: null, endDate: null });
  const [selectedNote, setSelectedNote] = useState<any | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [noteType, setNoteType] = useState<"credit" | "debit">("credit");
  
  // Get notes
  const { data: notes, isLoading } = useQuery({
    queryKey: ["/api/notes"],
    retry: false,
  });
  
  // Get customers
  const { data: customers } = useQuery({
    queryKey: ["/api/customers"],
    retry: false,
  });
  
  // Get customer accounts
  const { data: customersAccounts } = useQuery({
    queryKey: ["/api/accounts"],
    retry: false,
  });
  
  // Get sales for reference
  const { data: sales } = useQuery({
    queryKey: ["/api/sales"],
    retry: false,
  });
  
  // Form definition
  const form = useForm<NoteFormValues>({
    resolver: zodResolver(noteFormSchema),
    defaultValues: {
      customerId: undefined,
      type: "credit",
      amount: 0,
      reason: "",
      notes: "",
    },
  });
  
  // Create note mutation
  const createNoteMutation = useMutation({
    mutationFn: async (data: NoteFormValues) => {
      const res = await apiRequest("POST", "/api/notes", data);
      return await res.json();
    },
    onSuccess: (response) => {
      toast({ 
        title: "Nota creada correctamente",
        description: `La nota de ${noteType === "credit" ? "crédito" : "débito"} ha sido registrada`
      });
      
      // Si se creó una transacción en la cuenta corriente, mostrar mensaje adicional
      if (response.accountTransaction) {
        const transactionType = noteType === "credit" ? "crédito" : "débito";
        toast({ 
          title: "Cuenta corriente actualizada",
          description: `Se ha registrado un movimiento de ${transactionType} en la cuenta del cliente`,
        });
        
        // Actualizar cuentas corrientes además de notas
        queryClient.invalidateQueries({ queryKey: ["/api/accounts"] });
        queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      }
      
      form.reset();
      setIsDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/notes"] });
    },
    onError: (error) => {
      toast({
        title: "Error al crear la nota",
        description: (error as Error).message,
        variant: "destructive",
      });
    }
  });
  
  // Date formatting
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };
  
  // Filtered notes
  const filteredNotes = notes
    ? notes.filter((note: any) => {
        // Filter by search query
        const matchesSearch = !searchQuery || 
          note.id.toString().includes(searchQuery) || 
          (note.customer?.name && note.customer.name.toLowerCase().includes(searchQuery.toLowerCase()));
        
        // Filter by date range
        let matchesDateRange = true;
        if (dateRange.startDate) {
          matchesDateRange = new Date(note.timestamp) >= new Date(dateRange.startDate);
        }
        if (dateRange.endDate && matchesDateRange) {
          matchesDateRange = new Date(note.timestamp) <= new Date(dateRange.endDate);
        }
        
        return matchesSearch && matchesDateRange;
      })
    : [];
  
  // View note details
  const handleViewNote = (note: any) => {
    setSelectedNote(note);
    setIsDetailDialogOpen(true);
  };
  
  // Open create dialog with specific type
  const handleOpenCreateDialog = (type: "credit" | "debit") => {
    setNoteType(type);
    form.reset({
      customerId: undefined,
      type,
      amount: 0,
      reason: "",
      notes: "",
    });
    setIsDialogOpen(true);
  };
  
  // Form submission handler
  const onSubmit = (data: NoteFormValues) => {
    if (!user) return;
    
    // Verificaciones adicionales
    if (data.reason === "Otro" && !data.notes) {
      toast({
        title: "Información incompleta",
        description: "Debe especificar el motivo en el campo de notas adicionales",
        variant: "destructive",
      });
      return;
    }
    
    // Si es una nota de débito y está asociada a un cliente con cuenta corriente,
    // verificar el impacto en el saldo disponible
    if (data.type === "debit" && data.customerId) {
      const customer = customers?.find((c: any) => c.id === data.customerId);
      const account = customer?.hasAccount ? 
        (customersAccounts?.find((acc: any) => acc.customerId === data.customerId)) : null;
      
      if (account && account.balance) {
        const newBalance = parseFloat(account.balance) - data.amount;
        
        // Si supera el límite, mostrar confirmación
        if (account.hasLimit && account.creditLimit && newBalance < -parseFloat(account.creditLimit)) {
          if (!confirm(`Esta operación excederá el límite de crédito del cliente (${account.creditLimit}). ¿Desea continuar?`)) {
            return;
          }
        }
      }
    }
    
    // Procesar la solicitud
    createNoteMutation.mutate({
      ...data,
      userId: user.id,
    });
  };
  
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title="Notas de Crédito y Débito" />
        
        <main className="flex-1 overflow-auto p-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={18} />
              <Input
                placeholder="Buscar por número o cliente..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 w-full"
              />
            </div>
            
            <div className="flex items-center gap-2 w-full md:w-auto">
              <Button 
                variant="outline" 
                onClick={() => handleOpenCreateDialog("credit")}
                className="w-full md:w-auto"
              >
                <Plus className="mr-2 h-4 w-4" />
                Nota de Crédito
              </Button>
              <Button 
                onClick={() => handleOpenCreateDialog("debit")}
                className="w-full md:w-auto"
              >
                <Plus className="mr-2 h-4 w-4" />
                Nota de Débito
              </Button>
            </div>
          </div>
          
          <Card>
            <CardHeader className="px-6 py-4">
              <div className="flex justify-between items-center">
                <CardTitle>Notas de Crédito y Débito</CardTitle>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>Filtrar por fecha:</span>
                  <DatePicker 
                    placeholder="Desde" 
                    value={dateRange.startDate}
                    onChange={(date) => setDateRange({...dateRange, startDate: date})}
                  />
                  <span>-</span>
                  <DatePicker 
                    placeholder="Hasta" 
                    value={dateRange.endDate}
                    onChange={(date) => setDateRange({...dateRange, endDate: date})}
                  />
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="p-0">
              <Tabs defaultValue="all">
                <div className="border-b px-6">
                  <TabsList className="w-auto">
                    <TabsTrigger value="all">Todas</TabsTrigger>
                    <TabsTrigger value="credit">Crédito</TabsTrigger>
                    <TabsTrigger value="debit">Débito</TabsTrigger>
                  </TabsList>
                </div>
                
                <TabsContent value="all" className="m-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Número</TableHead>
                          <TableHead>Tipo</TableHead>
                          <TableHead>Cliente</TableHead>
                          <TableHead>Fecha</TableHead>
                          <TableHead>Motivo</TableHead>
                          <TableHead>Monto</TableHead>
                          <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {isLoading ? (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center py-10">
                              Cargando notas...
                            </TableCell>
                          </TableRow>
                        ) : filteredNotes.length > 0 ? (
                          filteredNotes.map((note: any) => (
                            <TableRow key={note.id}>
                              <TableCell className="font-medium">#{note.id}</TableCell>
                              <TableCell>
                                <Badge 
                                  variant={note.type === "credit" ? "default" : "secondary"} 
                                  className={
                                    note.type === "credit" 
                                      ? "bg-green-100 text-green-800" 
                                      : "bg-blue-100 text-blue-800"
                                  }
                                >
                                  {note.type === "credit" ? "Crédito" : "Débito"}
                                </Badge>
                              </TableCell>
                              <TableCell>{note.customer?.name || "Sin cliente"}</TableCell>
                              <TableCell>{formatDate(note.timestamp)}</TableCell>
                              <TableCell className="max-w-xs truncate">{note.reason}</TableCell>
                              <TableCell>${parseFloat(note.amount).toFixed(2)}</TableCell>
                              <TableCell className="text-right">
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => handleViewNote(note)}
                                >
                                  <Eye className="h-4 w-4 mr-1" />
                                  Ver
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center py-10">
                              <div className="flex flex-col items-center justify-center text-center">
                                <FileEdit className="h-12 w-12 text-muted-foreground mb-4" />
                                <h3 className="text-lg font-medium mb-2">
                                  {searchQuery || dateRange.startDate || dateRange.endDate
                                    ? "No se encontraron notas con los filtros aplicados"
                                    : "No hay notas registradas"
                                  }
                                </h3>
                                <p className="text-muted-foreground mb-4">
                                  {searchQuery || dateRange.startDate || dateRange.endDate
                                    ? "Intente con otros criterios de búsqueda"
                                    : "Comience creando una nueva nota"
                                  }
                                </p>
                                {!searchQuery && !dateRange.startDate && !dateRange.endDate && (
                                  <div className="flex gap-2">
                                    <Button 
                                      variant="outline" 
                                      onClick={() => handleOpenCreateDialog("credit")}
                                    >
                                      Nota de Crédito
                                    </Button>
                                    <Button 
                                      onClick={() => handleOpenCreateDialog("debit")}
                                    >
                                      Nota de Débito
                                    </Button>
                                  </div>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </TabsContent>
                
                <TabsContent value="credit" className="m-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Número</TableHead>
                          <TableHead>Cliente</TableHead>
                          <TableHead>Fecha</TableHead>
                          <TableHead>Motivo</TableHead>
                          <TableHead>Monto</TableHead>
                          <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {isLoading ? (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center py-10">
                              Cargando notas de crédito...
                            </TableCell>
                          </TableRow>
                        ) : filteredNotes.filter((note: any) => note.type === "credit").length > 0 ? (
                          filteredNotes
                            .filter((note: any) => note.type === "credit")
                            .map((note: any) => (
                              <TableRow key={note.id}>
                                <TableCell className="font-medium">#{note.id}</TableCell>
                                <TableCell>{note.customer?.name || "Sin cliente"}</TableCell>
                                <TableCell>{formatDate(note.timestamp)}</TableCell>
                                <TableCell className="max-w-xs truncate">{note.reason}</TableCell>
                                <TableCell>${parseFloat(note.amount).toFixed(2)}</TableCell>
                                <TableCell className="text-right">
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    onClick={() => handleViewNote(note)}
                                  >
                                    <Eye className="h-4 w-4 mr-1" />
                                    Ver
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center py-10">
                              <div className="flex flex-col items-center justify-center text-center">
                                <FileEdit className="h-12 w-12 text-muted-foreground mb-4" />
                                <h3 className="text-lg font-medium mb-2">
                                  {searchQuery || dateRange.startDate || dateRange.endDate
                                    ? "No se encontraron notas de crédito con los filtros aplicados"
                                    : "No hay notas de crédito registradas"
                                  }
                                </h3>
                                <p className="text-muted-foreground mb-4">
                                  {searchQuery || dateRange.startDate || dateRange.endDate
                                    ? "Intente con otros criterios de búsqueda"
                                    : "Comience creando una nueva nota de crédito"
                                  }
                                </p>
                                {!searchQuery && !dateRange.startDate && !dateRange.endDate && (
                                  <Button 
                                    variant="outline" 
                                    onClick={() => handleOpenCreateDialog("credit")}
                                  >
                                    <Plus className="mr-2 h-4 w-4" />
                                    Nueva Nota de Crédito
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </TabsContent>
                
                <TabsContent value="debit" className="m-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Número</TableHead>
                          <TableHead>Cliente</TableHead>
                          <TableHead>Fecha</TableHead>
                          <TableHead>Motivo</TableHead>
                          <TableHead>Monto</TableHead>
                          <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {isLoading ? (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center py-10">
                              Cargando notas de débito...
                            </TableCell>
                          </TableRow>
                        ) : filteredNotes.filter((note: any) => note.type === "debit").length > 0 ? (
                          filteredNotes
                            .filter((note: any) => note.type === "debit")
                            .map((note: any) => (
                              <TableRow key={note.id}>
                                <TableCell className="font-medium">#{note.id}</TableCell>
                                <TableCell>{note.customer?.name || "Sin cliente"}</TableCell>
                                <TableCell>{formatDate(note.timestamp)}</TableCell>
                                <TableCell className="max-w-xs truncate">{note.reason}</TableCell>
                                <TableCell>${parseFloat(note.amount).toFixed(2)}</TableCell>
                                <TableCell className="text-right">
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    onClick={() => handleViewNote(note)}
                                  >
                                    <Eye className="h-4 w-4 mr-1" />
                                    Ver
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center py-10">
                              <div className="flex flex-col items-center justify-center text-center">
                                <FileEdit className="h-12 w-12 text-muted-foreground mb-4" />
                                <h3 className="text-lg font-medium mb-2">
                                  {searchQuery || dateRange.startDate || dateRange.endDate
                                    ? "No se encontraron notas de débito con los filtros aplicados"
                                    : "No hay notas de débito registradas"
                                  }
                                </h3>
                                <p className="text-muted-foreground mb-4">
                                  {searchQuery || dateRange.startDate || dateRange.endDate
                                    ? "Intente con otros criterios de búsqueda"
                                    : "Comience creando una nueva nota de débito"
                                  }
                                </p>
                                {!searchQuery && !dateRange.startDate && !dateRange.endDate && (
                                  <Button 
                                    onClick={() => handleOpenCreateDialog("debit")}
                                  >
                                    <Plus className="mr-2 h-4 w-4" />
                                    Nueva Nota de Débito
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </main>
      </div>
      
      {/* Note Detail Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Nota de {selectedNote?.type === "credit" ? "Crédito" : "Débito"} #{selectedNote?.id}
            </DialogTitle>
            <DialogDescription>
              Emitida el {selectedNote?.timestamp ? formatDate(selectedNote.timestamp) : ""}
            </DialogDescription>
          </DialogHeader>
          
          {selectedNote && (
            <div className="space-y-6">
              <div className="bg-muted rounded-lg p-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <span className="text-muted-foreground text-sm">Tipo</span>
                    <Badge 
                      variant={selectedNote.type === "credit" ? "default" : "secondary"} 
                      className={
                        selectedNote.type === "credit" 
                          ? "bg-green-100 text-green-800 w-fit" 
                          : "bg-blue-100 text-blue-800 w-fit"
                      }
                    >
                      {selectedNote.type === "credit" ? "Crédito" : "Débito"}
                    </Badge>
                  </div>
                  
                  <div className="flex flex-col gap-1">
                    <span className="text-muted-foreground text-sm">Monto</span>
                    <span className="font-medium text-lg">
                      ${parseFloat(selectedNote.amount).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col gap-1">
                <span className="text-muted-foreground text-sm">Cliente</span>
                <div className="flex items-center">
                  <span className="font-medium">
                    {selectedNote.customer?.name || "Sin cliente asociado"}
                  </span>
                  {selectedNote.customer?.hasAccount && (
                    <Badge variant="outline" className="ml-2 bg-amber-50 text-amber-800 border-amber-200">
                      Cuenta Corriente
                    </Badge>
                  )}
                </div>
              </div>
              
              {selectedNote.relatedSale && (
                <div className="flex flex-col gap-1">
                  <span className="text-muted-foreground text-sm">Venta Relacionada</span>
                  <div className="flex items-center">
                    <span className="font-medium">
                      Venta #{selectedNote.relatedSale.id} - ${parseFloat(selectedNote.relatedSale.total).toFixed(2)}
                    </span>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 ml-2" 
                      asChild
                    >
                      <Link to={`/sales/${selectedNote.relatedSale.id}`}>
                        <Eye className="h-3.5 w-3.5 mr-1" />
                        Ver
                      </Link>
                    </Button>
                  </div>
                </div>
              )}
              
              <div className="flex flex-col gap-1">
                <span className="text-muted-foreground text-sm">Motivo</span>
                <span className="font-medium">
                  {selectedNote.reason}
                </span>
              </div>
              
              {selectedNote.notes && (
                <div className="flex flex-col gap-1">
                  <span className="text-muted-foreground text-sm">Notas Adicionales</span>
                  <span className="font-medium">
                    {selectedNote.notes}
                  </span>
                </div>
              )}
              
              {selectedNote.accountTransaction && (
                <div className="border rounded-lg p-4 mt-2">
                  <h4 className="text-sm font-medium mb-2">Impacto en Cuenta Corriente</h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex flex-col gap-1">
                      <span className="text-muted-foreground text-xs">Transacción</span>
                      <span className="font-medium">
                        #{selectedNote.accountTransaction.id}
                      </span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-muted-foreground text-xs">Tipo</span>
                      <Badge 
                        variant={selectedNote.accountTransaction.type === "credit" ? "default" : "secondary"} 
                        className={
                          selectedNote.accountTransaction.type === "credit" 
                            ? "bg-green-100 text-green-800 w-fit" 
                            : "bg-blue-100 text-blue-800 w-fit"
                        }
                      >
                        {selectedNote.accountTransaction.type === "credit" ? "Crédito" : "Débito"}
                      </Badge>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-muted-foreground text-xs">Monto</span>
                      <span className="font-medium">
                        ${parseFloat(selectedNote.accountTransaction.amount).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-muted-foreground text-xs">Descripción</span>
                      <span className="font-medium truncate">
                        {selectedNote.accountTransaction.description}
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-end mt-2">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      asChild
                    >
                      <Link to={`/accounts/${selectedNote.customer?.id}`}>
                        <ExternalLink className="h-3.5 w-3.5 mr-1" />
                        Ver Cuenta Corriente
                      </Link>
                    </Button>
                  </div>
                </div>
              )}
              
              <div className="flex flex-col gap-1 text-sm text-muted-foreground mt-2">
                <div className="flex justify-between">
                  <span>Creado por:</span>
                  <span>{selectedNote.user?.fullName || selectedNote.user?.username || "Usuario"}</span>
                </div>
                <div className="flex justify-between">
                  <span>Fecha de emisión:</span>
                  <span>{formatDate(selectedNote.timestamp)}</span>
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDetailDialogOpen(false)}
            >
              Cerrar
            </Button>
            
            <Button>
              <Printer className="mr-2 h-4 w-4" />
              Imprimir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Create Note Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Nueva Nota de {noteType === "credit" ? "Crédito" : "Débito"}
            </DialogTitle>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem className="col-span-1">
                      <FormLabel>Tipo de Nota</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={(value) => {
                          field.onChange(value);
                          setNoteType(value as "credit" | "debit");
                          // Si el tipo cambia, resetear la razón porque las opciones son diferentes
                          form.setValue("reason", "");
                        }}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar tipo" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="credit">Nota de Crédito</SelectItem>
                          <SelectItem value="debit">Nota de Débito</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem className="col-span-1">
                      <FormLabel>Monto</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 transform -translate-y-1/2">$</span>
                          <Input 
                            type="number" 
                            step="0.01" 
                            min="0.01"
                            className="pl-7"
                            placeholder="0.00"
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="customerId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cliente{noteType === "credit" ? "" : " (opcional)"}</FormLabel>
                    <Select 
                      value={field.value?.toString()} 
                      onValueChange={(value) => field.onChange(value ? parseInt(value) : undefined)}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar cliente" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">Sin cliente</SelectItem>
                        {customers?.map((customer: any) => (
                          <SelectItem key={customer.id} value={customer.id.toString()}>
                            {customer.name}
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
                name="relatedSaleId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Venta Relacionada (opcional)</FormLabel>
                    <Select 
                      value={field.value?.toString()} 
                      onValueChange={(value) => field.onChange(value ? parseInt(value) : undefined)}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar venta" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">Sin venta relacionada</SelectItem>
                        {sales?.map((sale: any) => (
                          <SelectItem key={sale.id} value={sale.id.toString()}>
                            #{sale.id} - ${parseFloat(sale.total).toFixed(2)} - {formatDate(sale.timestamp)}
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
                name="reason"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Motivo</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar motivo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {noteType === "credit" ? (
                          <>
                            <SelectItem value="Devolución de productos">Devolución de productos</SelectItem>
                            <SelectItem value="Descuento aplicado">Descuento aplicado</SelectItem>
                            <SelectItem value="Error en facturación">Error en facturación</SelectItem>
                            <SelectItem value="Bonificación">Bonificación</SelectItem>
                            <SelectItem value="Ajuste de precios">Ajuste de precios</SelectItem>
                            <SelectItem value="Otro">Otro</SelectItem>
                          </>
                        ) : (
                          <>
                            <SelectItem value="Cargo adicional">Cargo adicional</SelectItem>
                            <SelectItem value="Interés por mora">Interés por mora</SelectItem>
                            <SelectItem value="Penalización">Penalización</SelectItem>
                            <SelectItem value="Faltante en pago">Faltante en pago</SelectItem>
                            <SelectItem value="Ajuste de precios">Ajuste de precios</SelectItem>
                            <SelectItem value="Otro">Otro</SelectItem>
                          </>
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{form.watch("reason") === "Otro" ? "Especificar motivo" : "Detalles adicionales (opcional)"}</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder={form.watch("reason") === "Otro" ? "Especifique el motivo de la nota" : "Información adicional relevante"}
                        className="resize-none min-h-[80px]" 
                        {...field} 
                      />
                    </FormControl>
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
                <Button 
                  type="submit"
                  disabled={createNoteMutation.isPending}
                  variant={noteType === "debit" ? "default" : "secondary"}
                >
                  {createNoteMutation.isPending 
                    ? "Creando..." 
                    : `Crear Nota de ${noteType === "credit" ? "Crédito" : "Débito"}`
                  }
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
