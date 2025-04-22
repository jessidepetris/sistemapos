import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Calendar, Download, FileText, Plus, Printer, Search } from "lucide-react";
import { DatePicker } from "@/components/ui/date-picker";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import InvoiceDetail from "@/components/invoices/InvoiceDetail";
import { PDFService } from "@/services/pdfService";

export default function InvoicesPage() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [dateRange, setDateRange] = useState<{ startDate: Date | null, endDate: Date | null }>({ startDate: null, endDate: null });
  const [selectedInvoice, setSelectedInvoice] = useState<any | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  
  // Get invoices
  const { data: invoices = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/invoices"],
    retry: false,
  });
  
  // Date formatting
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };
  
  // Filtered invoices
  const filteredInvoices = invoices.filter((invoice: any) => {
    // Filter by search query
    const matchesSearch = !searchQuery || 
      invoice.id.toString().includes(searchQuery) || 
      (invoice.customer?.name && invoice.customer.name.toLowerCase().includes(searchQuery.toLowerCase()));
    
    // Filter by date range
    let matchesDateRange = true;
    if (dateRange.startDate) {
      matchesDateRange = new Date(invoice.timestamp) >= new Date(dateRange.startDate);
    }
    if (dateRange.endDate && matchesDateRange) {
      matchesDateRange = new Date(invoice.timestamp) <= new Date(dateRange.endDate);
    }
    
    return matchesSearch && matchesDateRange;
  });
  
  // View invoice details
  const handleViewInvoice = (invoice: any) => {
    setSelectedInvoice(invoice);
    setIsDetailDialogOpen(true);
  };
  
  // Print invoice
  const handlePrintInvoice = (invoiceId: number) => {
    toast({
      title: "Imprimiendo remito",
      description: `Remito #${invoiceId} enviado a la impresora`,
    });
  };
  
  // Export invoice as PDF
  const handleExportInvoice = async (invoice: any) => {
    // Buscar la factura en la lista
    const invoiceData = invoices.find((inv: any) => inv.id === invoice.id);
    
    if (invoiceData) {
      try {
        // Generamos el PDF con el servicio centralizado
        await PDFService.generateInvoicePDF(
          invoiceData,
          invoiceData.items || [],
          invoiceData.customer || null
        );
        
        toast({
          title: "Exportando remito",
          description: `Remito #${invoice.id} exportado como PDF`,
        });
      } catch (error) {
        console.error("Error al generar PDF:", error);
        toast({
          title: "Error al exportar",
          description: "No se pudo generar el PDF del remito",
          variant: "destructive"
        });
      }
    } else {
      toast({
        title: "Error al exportar",
        description: "No se encontró el remito especificado",
        variant: "destructive"
      });
    }
  };
  
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title="Remitos" />
        
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
              <Button onClick={() => setIsCreateDialogOpen(true)} className="w-full md:w-auto">
                <Plus className="mr-2 h-4 w-4" />
                Nuevo Remito
              </Button>
            </div>
          </div>
          
          <Card>
            <CardHeader className="px-6 py-4">
              <div className="flex justify-between items-center">
                <CardTitle>Lista de Remitos</CardTitle>
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
                    <TabsTrigger value="all">Todos</TabsTrigger>
                    <TabsTrigger value="pending">Pendientes</TabsTrigger>
                    <TabsTrigger value="completed">Completados</TabsTrigger>
                  </TabsList>
                </div>
                
                <TabsContent value="all" className="m-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Número</TableHead>
                          <TableHead>Cliente</TableHead>
                          <TableHead>Fecha</TableHead>
                          <TableHead>Total</TableHead>
                          <TableHead>Estado</TableHead>
                          <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {isLoading ? (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center py-10">
                              Cargando remitos...
                            </TableCell>
                          </TableRow>
                        ) : filteredInvoices.length > 0 ? (
                          filteredInvoices.map((invoice: any) => (
                            <TableRow key={invoice.id}>
                              <TableCell className="font-medium">#{invoice.id}</TableCell>
                              <TableCell>{invoice.customer?.name || "Venta sin cliente"}</TableCell>
                              <TableCell>{formatDate(invoice.timestamp)}</TableCell>
                              <TableCell>${parseFloat(invoice.total).toFixed(2)}</TableCell>
                              <TableCell>
                                <Badge 
                                  variant={invoice.status === "completed" ? "default" : "secondary"} 
                                  className={
                                    invoice.status === "completed" 
                                      ? "bg-green-100 text-green-800" 
                                      : "bg-blue-100 text-blue-800"
                                  }
                                >
                                  {invoice.status === "completed" ? "Completado" : "Pendiente"}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    onClick={() => handleViewInvoice(invoice)}
                                    title="Ver detalle"
                                  >
                                    <FileText className="h-4 w-4" />
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    onClick={() => handlePrintInvoice(invoice.id)}
                                    title="Imprimir"
                                  >
                                    <Printer className="h-4 w-4" />
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    onClick={() => handleExportInvoice(invoice)}
                                    title="Exportar PDF"
                                  >
                                    <Download className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center py-10">
                              <div className="flex flex-col items-center justify-center text-center">
                                <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                                <h3 className="text-lg font-medium mb-2">
                                  {searchQuery || dateRange.startDate || dateRange.endDate
                                    ? "No se encontraron remitos con los filtros aplicados"
                                    : "No hay remitos registrados"
                                  }
                                </h3>
                                <p className="text-muted-foreground mb-4">
                                  {searchQuery || dateRange.startDate || dateRange.endDate
                                    ? "Intente con otros criterios de búsqueda"
                                    : "Comience creando un nuevo remito"
                                  }
                                </p>
                                {!searchQuery && !dateRange.startDate && !dateRange.endDate && (
                                  <Button onClick={() => setIsCreateDialogOpen(true)}>
                                    <Plus className="mr-2 h-4 w-4" />
                                    Nuevo Remito
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
                
                <TabsContent value="pending" className="m-0">
                  {/* Similar table but filtered for pending */}
                  <div className="text-center py-10">
                    <p className="text-muted-foreground">Vista pendiente de implementación</p>
                  </div>
                </TabsContent>
                
                <TabsContent value="completed" className="m-0">
                  {/* Similar table but filtered for completed */}
                  <div className="text-center py-10">
                    <p className="text-muted-foreground">Vista pendiente de implementación</p>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </main>
      </div>
      
      {/* Invoice Detail Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Detalle de Remito #{selectedInvoice?.id}</DialogTitle>
          </DialogHeader>
          
          {selectedInvoice && (
            <InvoiceDetail 
              invoice={selectedInvoice} 
              items={selectedInvoice.items || []} 
              customer={selectedInvoice.customer}
            />
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
      
      {/* Create Invoice Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Crear Nuevo Remito</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            <p className="text-center text-muted-foreground">
              Para crear un nuevo remito, utilice el módulo de Punto de Venta.
            </p>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCreateDialogOpen(false)}
            >
              Cerrar
            </Button>
            <Button
              onClick={() => {
                setIsCreateDialogOpen(false);
                window.location.href = "/pos";
              }}
            >
              Ir a Punto de Venta
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
