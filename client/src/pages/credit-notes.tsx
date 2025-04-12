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
  DialogTitle
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
import { Calendar, Eye, FileEdit, Plus, Search } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/use-auth";

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
    onSuccess: () => {
      toast({ 
        title: "Nota creada correctamente",
        description: `La nota de ${noteType === "credit" ? "crédito" : "débito"} ha sido registrada`
      });
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
                  {/* Similar table but filtered for credit notes */}
                  <div className="text-center py-10">
                    <p className="text-muted-foreground">Vista pendiente de implementación</p>
                  </div>
                </TabsContent>
                
                <TabsContent value="debit" className="m-0">
                  {/* Similar table but filtered for debit notes */}
                  <div className="text-center py-10">
                    <p className="text-muted-foreground">Vista pendiente de implementación</p>
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
              Detalle de Nota de {selectedNote?.type === "credit" ? "Crédito" : "Débito"} #{selectedNote?.id}
            </DialogTitle>
          </DialogHeader>
          
          {selectedNote && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Tipo</p>
                  <Badge 
                    variant={selectedNote.type === "credit" ? "default" : "secondary"} 
                    className={
                      selectedNote.type === "credit" 
                        ? "bg-green-100 text-green-800" 
                        : "bg-blue-100 text-blue-800"
                    }
                  >
                    {selectedNote.type === "credit" ? "Crédito" : "Débito"}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Fecha</p>
                  <p className="font-medium">{formatDate(selectedNote.timestamp)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Cliente</p>
                  <p className="font-medium">{selectedNote.customer?.name || "Sin cliente"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Monto</p>
                  <p className="font-medium">${parseFloat(selectedNote.amount).toFixed(2)}</p>
                </div>
                {selectedNote.relatedSaleId && (
                  <div className="col-span-2">
                    <p className="text-sm text-muted-foreground">Venta Relacionada</p>
                    <p className="font-medium">#{selectedNote.relatedSaleId}</p>
                  </div>
                )}
                <div className="col-span-2">
                  <p className="text-sm text-muted-foreground">Motivo</p>
                  <p className="font-medium">{selectedNote.reason}</p>
                </div>
                {selectedNote.notes && (
                  <div className="col-span-2">
                    <p className="text-sm text-muted-foreground">Notas Adicionales</p>
                    <p>{selectedNote.notes}</p>
                  </div>
                )}
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
              <FormField
                control={form.control}
                name="customerId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cliente (opcional)</FormLabel>
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
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Monto</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" min="0.01" {...field} />
                    </FormControl>
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
                    <FormControl>
                      <Input placeholder="Motivo de la nota" {...field} />
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
                    <FormLabel>Notas Adicionales (opcional)</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Detalles adicionales" {...field} />
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
