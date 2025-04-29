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
  Form, FormControl, FormDescription, FormField,
  FormItem, FormLabel, FormMessage
} from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Search, CreditCard, ArrowDownCircle, ArrowUpCircle, Eye, MessageCircle, Receipt } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link } from "wouter";
import { jsPDF } from 'jspdf';

// Tipos
interface Account {
  id: number;
  customerId: number;
  balance: string;
  creditLimit?: string;
  lastUpdated: string;
  customer?: {
    id: number;
    name: string;
    phone?: string;
  };
}

interface Transaction {
  id: number;
  timestamp: string;
  accountId: number;
  amount: string;
  type: "credit" | "debit";
  description: string;
  balanceAfter: string;
  relatedSaleId?: number;
  relatedNoteId?: number;
  paymentMethod?: "cash" | "transfer" | "credit_card" | "debit_card" | "check" | "qr";
}

interface Customer {
  id: number;
  name: string;
}

interface User {
  id: number;
}

const transactionFormSchema = z.object({
  accountId: z.number().optional(),
  amount: z.coerce.number().min(0.01, "El monto debe ser mayor a 0"),
  currency: z.string().default("ARS"),
  type: z.enum(["credit", "debit"]),
  description: z.string().min(1, "La descripción es requerida"),
  paymentMethod: z.enum(["cash", "transfer", "credit_card", "debit_card", "check", "qr"]).optional(),
}).refine(
  (data) => {
    if (data.type === "credit") {
      return !!data.paymentMethod;
    }
    return true;
  },
  {
    message: "El método de pago es requerido para pagos",
    path: ["paymentMethod"],
  }
);

type TransactionFormValues = z.infer<typeof transactionFormSchema>;

const AccountsPage = () => {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAccount, setSelectedAccount] = useState<number | null>(null);
  const [selectedAccountDetails, setSelectedAccountDetails] = useState<Account | null>(null);
  const [isTransactionDialogOpen, setIsTransactionDialogOpen] = useState(false);
  const [transactionType, setTransactionType] = useState<"credit" | "debit">("credit");
  
  // Get accounts
  const { data: accounts, isLoading } = useQuery<Account[]>({
    queryKey: ["/api/accounts"],
    retry: false,
  });
  
  // Get account transactions if an account is selected
  const { data: transactions, isLoading: isLoadingTransactions } = useQuery<Transaction[]>({
    queryKey: [`/api/accounts/${selectedAccount}/transactions`],
    enabled: !!selectedAccount,
    retry: false,
  });
  
  // Get customers for new account
  const { data: customers, isLoading: isLoadingCustomers } = useQuery<Customer[]>({
    queryKey: ["/api/customers"],
    retry: false,
  });
  
  // Get current user
  const { data: currentUser } = useQuery<User>({
    queryKey: ["/api/user"],
    retry: false,
  });

  // New account form
  const form = useForm<any>({
    resolver: zodResolver(z.object({
      customerId: z.coerce.number().positive("El cliente es requerido"),
      creditLimit: z.coerce.number().min(0, "El límite de crédito debe ser mayor o igual a 0").optional(),
    })),
    defaultValues: {
      customerId: undefined,
      creditLimit: 0,
    },
  });
  
  // Transaction form
  const transactionForm = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionFormSchema),
    defaultValues: {
      accountId: undefined,
      amount: 0,
      type: "credit",
      description: "",
      paymentMethod: undefined,
    },
  });
  
  // Create account mutation
  const createAccountMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/accounts", data);
      return await res.json();
    },
    onSuccess: () => {
      toast({ title: "Cuenta corriente creada correctamente" });
      form.reset();
      setIsDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/accounts"] });
    },
    onError: (error) => {
      toast({
        title: "Error al crear la cuenta corriente",
        description: (error as Error).message,
        variant: "destructive",
      });
    }
  });
  
  // Add transaction mutation
  const addTransactionMutation = useMutation({
    mutationFn: async (data: TransactionFormValues) => {
      const res = await apiRequest("POST", "/api/account-transactions", data);
      return await res.json();
    },
    onSuccess: () => {
      toast({ 
        title: "Transacción registrada correctamente",
        description: transactionType === "credit" ? "Se ha agregado el crédito a la cuenta" : "Se ha registrado el débito en la cuenta"
      });
      transactionForm.reset();
      setIsTransactionDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/accounts"] });
      if (selectedAccount) {
        queryClient.invalidateQueries({ queryKey: [`/api/accounts/${selectedAccount}/transactions`] });
      }
    },
    onError: (error) => {
      toast({
        title: "Error al registrar la transacción",
        description: (error as Error).message,
        variant: "destructive",
      });
    }
  });
  
  // Filtered accounts based on search
  const filteredAccounts = searchQuery && accounts
    ? accounts.filter((account) =>
        account.customer?.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : accounts;
  
  // Form submission handlers
  const onCreateAccountSubmit = (data: any) => {
    createAccountMutation.mutate(data);
  };

  const onAddTransactionSubmit = (data: TransactionFormValues) => {    
    const transactionData = {
      ...data,
      accountId: selectedAccount!,
      type: transactionType,
      description: data.type === "credit" ? 
        `Pago a cuenta en ${(() => {
          if (!data.paymentMethod) return "método no especificado";
          switch (data.paymentMethod) {
            case "cash": return "efectivo";
            case "transfer": return "transferencia";
            case "credit_card": return "tarjeta de crédito";
            case "debit_card": return "tarjeta de débito";
            case "check": return "cheque";
            case "qr": return "QR";
            default: return data.paymentMethod;
          }
        })()}` : data.description,
      paymentMethod: data.type === "credit" ? data.paymentMethod : undefined,
      userId: currentUser?.id || 1,
    };
    
    console.log("Enviando transacción:", transactionData);
    
    addTransactionMutation.mutate(transactionData);
  };
  
  // Handle opening transaction dialog
  const handleOpenTransactionDialog = (account: Account, type: "credit" | "debit") => {
    setSelectedAccount(account.id);
    setSelectedAccountDetails(account);
    setTransactionType(type);
    transactionForm.reset({
      accountId: account.id,
      amount: 0,
      type: type,
      description: type === "credit" ? "Pago a cuenta" : "Compra",
      paymentMethod: "cash",
    });
    setIsTransactionDialogOpen(true);
  };
  
  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  // Función para generar el comprobante de pago
  const generateReceipt = (transaction: Transaction, account: Account) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Configuración de fuentes y estilos
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    
    // Título centrado
    doc.text("COMPROBANTE DE PAGO", pageWidth / 2, 20, { align: "center" });
    
    // Agregar número de comprobante
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text(`N° ${transaction.id.toString().padStart(8, '0')}`, pageWidth / 2, 30, { align: "center" });
    
    // Línea divisoria
    doc.setLineWidth(0.5);
    doc.line(20, 35, pageWidth - 20, 35);
    
    // Información del comercio
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("Punto Pastelero", 20, 45);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("Insumos de Pastelería", 20, 52);
    doc.text("Tel: (xxx) xxx-xxxx", 20, 57);
    doc.text("Email: contacto@puntopastelero.com", 20, 62);
    
    // Línea divisoria
    doc.line(20, 67, pageWidth - 20, 67);
    
    // Información de la transacción
    doc.setFontSize(12);
    const startY = 77;
    const lineHeight = 7;
    let currentY = startY;
    
    // Función helper para agregar líneas de texto
    const addLine = (label: string, value: string) => {
      doc.setFont("helvetica", "bold");
      doc.text(label, 20, currentY);
      doc.setFont("helvetica", "normal");
      doc.text(value, 70, currentY);
      currentY += lineHeight;
    };
    
    addLine("Fecha:", formatDate(transaction.timestamp));
    addLine("Cliente:", account.customer?.name || 'Cliente no registrado');
    addLine("Monto:", `$${parseFloat(transaction.amount).toFixed(2)}`);
    addLine("Método de pago:", (() => {
      if (!transaction.paymentMethod) return "No especificado";
      switch (transaction.paymentMethod) {
        case "cash": return "Efectivo";
        case "transfer": return "Transferencia";
        case "credit_card": return "Tarjeta de Crédito";
        case "debit_card": return "Tarjeta de Débito";
        case "check": return "Cheque";
        case "qr": return "QR";
        default: return "No especificado";
      }
    })());
    addLine("Descripción:", transaction.description);
    
    // Línea divisoria
    doc.line(20, currentY + 5, pageWidth - 20, currentY + 5);
    
    // Saldo
    currentY += 15;
    doc.setFont("helvetica", "bold");
    doc.text("Saldo actual:", 20, currentY);
    doc.text(`$${parseFloat(transaction.balanceAfter).toFixed(2)}`, pageWidth - 20, currentY, { align: "right" });
    
    // Pie de página
    doc.setFontSize(10);
    doc.setFont("helvetica", "italic");
    const bottomY = doc.internal.pageSize.getHeight() - 20;
    doc.text("Gracias por su pago", pageWidth / 2, bottomY, { align: "center" });
    
    // Guardar el PDF
    const filename = `comprobante-${transaction.id}-${formatDate(transaction.timestamp).replace(/[/: ]/g, '-')}.pdf`;
    doc.save(filename);
  };
  
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title="Cuentas Corrientes" />
        
        <main className="flex-1 overflow-auto p-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={18} />
              <Input
                placeholder="Buscar cuentas por cliente..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 w-full"
              />
            </div>
            
            <Button onClick={() => setIsDialogOpen(true)} className="w-full md:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              Nueva Cuenta Corriente
            </Button>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Accounts list */}
            <Card className="lg:col-span-1">
              <CardHeader className="px-6 py-4 border-b">
                <CardTitle>Cuentas de Clientes</CardTitle>
              </CardHeader>
              
              <CardContent className="p-0">
                <div className="overflow-y-auto" style={{ maxHeight: "calc(100vh - 260px)" }}>
                  {isLoading ? (
                    <div className="flex justify-center items-center p-6">
                      <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                  ) : filteredAccounts && filteredAccounts.length > 0 ? (
                    <div className="divide-y">
                      {filteredAccounts.map((account: Account) => (
                        <div 
                          key={account.id} 
                          className={`p-4 hover:bg-slate-50 cursor-pointer ${
                            selectedAccount === account.id ? "bg-slate-50" : ""
                          }`}
                          onClick={() => setSelectedAccount(account.id)}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-medium">{account.customer?.name || "Cliente no encontrado"}</h3>
                              <p className="text-sm text-slate-500">
                                Actualizado: {formatDate(account.lastUpdated)}
                              </p>
                            </div>
                            <Badge className={parseFloat(account.balance) < 0 ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                              ${Math.abs(parseFloat(account.balance)).toFixed(2)}
                              {parseFloat(account.balance) !== 0 && (
                                <span className="ml-1 text-xs">
                                  {parseFloat(account.balance) < 0 ? "a favor" : "debe"}
                                </span>
                              )}
                            </Badge>
                          </div>
                          <div className="flex gap-2 mt-3">
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenTransactionDialog(account, "credit");
                              }}
                            >
                              <ArrowDownCircle className="h-4 w-4 mr-1" />
                              Pago
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenTransactionDialog(account, "debit");
                              }}
                            >
                              <ArrowUpCircle className="h-4 w-4 mr-1" />
                              Débito
                            </Button>
                            {account.customer?.phone && parseFloat(account.balance) > 0 && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="bg-green-100 hover:bg-green-200 text-green-800"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const message = `Buenos dias, te recordamos que tu saldo pendiente a la fecha es $${Math.abs(parseFloat(account.balance)).toFixed(2)}`;
                                  window.open(`https://wa.me/${account.customer.phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`, '_blank');
                                }}
                              >
                                <MessageCircle className="h-4 w-4 mr-1" />
                                Reclamar Saldo
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-6 text-center">
                      <CreditCard className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <h3 className="text-lg font-medium mb-2">
                        {searchQuery ? "No se encontraron cuentas" : "No hay cuentas registradas"}
                      </h3>
                      <p className="text-muted-foreground mb-4">
                        {searchQuery
                          ? `No hay resultados para "${searchQuery}"`
                          : "Comience creando una nueva cuenta corriente"
                        }
                      </p>
                      {!searchQuery && (
                        <Button onClick={() => setIsDialogOpen(true)}>
                          <Plus className="mr-2 h-4 w-4" />
                          Nueva Cuenta
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
            
            {/* Transactions list */}
            <Card className="lg:col-span-2">
              <CardHeader className="px-6 py-4 border-b">
                <CardTitle>Movimientos de Cuenta</CardTitle>
              </CardHeader>
              
              <CardContent className="p-0">
                {selectedAccount ? (
                  isLoadingTransactions ? (
                    <div className="flex justify-center items-center p-6">
                      <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                  ) : transactions && transactions.length > 0 ? (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Fecha</TableHead>
                            <TableHead>Descripción</TableHead>
                            <TableHead>Tipo</TableHead>
                            <TableHead>Método de Pago</TableHead>
                            <TableHead>Comprobante</TableHead>
                            <TableHead className="text-right">Monto</TableHead>
                            <TableHead className="text-right">Saldo</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {transactions.map((transaction: Transaction) => (
                            <TableRow key={transaction.id}>
                              <TableCell>{formatDate(transaction.timestamp)}</TableCell>
                              <TableCell>
                                {transaction.description}
                                {transaction.paymentMethod && (
                                  <span className="text-muted-foreground">
                                    {" "}({(() => {
                                      switch (transaction.paymentMethod) {
                                        case "cash": return "Efectivo";
                                        case "transfer": return "Transferencia";
                                        case "credit_card": return "Tarjeta de Crédito";
                                        case "debit_card": return "Tarjeta de Débito";
                                        case "check": return "Cheque";
                                        case "qr": return "QR";
                                        default: return transaction.paymentMethod;
                                      }
                                    })()})
                                  </span>
                                )}
                              </TableCell>
                              <TableCell>
                                <Badge 
                                  variant={transaction.type === "credit" ? "default" : "secondary"}
                                  className={transaction.type === "credit" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}
                                >
                                  {transaction.type === "credit" ? "Crédito" : "Débito"}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {transaction.paymentMethod && (
                                  <Badge variant="outline">
                                    {(() => {
                                      switch (transaction.paymentMethod) {
                                        case "cash": return "Efectivo";
                                        case "transfer": return "Transferencia";
                                        case "credit_card": return "Tarjeta de Crédito";
                                        case "debit_card": return "Tarjeta de Débito";
                                        case "check": return "Cheque";
                                        case "qr": return "QR";
                                        default: return transaction.paymentMethod;
                                      }
                                    })()}
                                  </Badge>
                                )}
                              </TableCell>
                              <TableCell>
                                {transaction.relatedSaleId && (
                                  <Link href={`/sales/${transaction.relatedSaleId}`}>
                                    <Button variant="ghost" size="sm">
                                      <Eye className="h-4 w-4" />
                                    </Button>
                                  </Link>
                                )}
                                {transaction.relatedNoteId && (
                                  <Link href={`/credit-notes/${transaction.relatedNoteId}`}>
                                    <Button variant="ghost" size="sm">
                                      <Eye className="h-4 w-4" />
                                    </Button>
                                  </Link>
                                )}
                                {transaction.type === "credit" && (
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={() => {
                                      const account = accounts?.find(a => a.id === transaction.accountId);
                                      if (account) {
                                        generateReceipt(transaction, account);
                                      }
                                    }}
                                  >
                                    <Receipt className="h-4 w-4" />
                                  </Button>
                                )}
                              </TableCell>
                              <TableCell className="text-right">
                                ${parseFloat(transaction.amount).toFixed(2)}
                              </TableCell>
                              <TableCell className="text-right font-medium">
                                ${parseFloat(transaction.balanceAfter).toFixed(2)}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <div className="p-6 text-center">
                      <p className="text-muted-foreground">No hay movimientos registrados para esta cuenta</p>
                    </div>
                  )
                ) : (
                  <div className="p-10 text-center">
                    <CreditCard className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">Seleccione una cuenta</h3>
                    <p className="text-muted-foreground">
                      Seleccione una cuenta del panel izquierdo para ver sus movimientos
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
      
      {/* Create Account Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nueva Cuenta Corriente</DialogTitle>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onCreateAccountSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="customerId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cliente</FormLabel>
                    <Select 
                      onValueChange={(value) => field.onChange(parseInt(value))}
                      value={field.value?.toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar cliente" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {isLoadingCustomers ? (
                          <div className="flex justify-center p-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                          </div>
                        ) : (
                          customers?.filter((customer: Customer) => {
                            // Verificar si el cliente ya tiene una cuenta
                            const hasExistingAccount = accounts?.some((account: Account) => 
                              account.customerId === customer.id
                            );
                            return !hasExistingAccount;
                          }).map((customer: Customer) => (
                            <SelectItem key={customer.id} value={customer.id.toString()}>
                              {customer.name}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Solo se muestran clientes sin cuenta corriente
                    </FormDescription>
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
                <Button 
                  type="submit"
                  disabled={createAccountMutation.isPending}
                >
                  {createAccountMutation.isPending 
                    ? "Creando..." 
                    : "Crear Cuenta"
                  }
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Add Transaction Dialog */}
      <Dialog open={isTransactionDialogOpen} onOpenChange={setIsTransactionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {transactionType === "credit" ? "Registrar Pago" : "Registrar Débito"}
            </DialogTitle>
          </DialogHeader>
          
          {selectedAccountDetails && (
            <div className="mb-4 p-3 bg-slate-50 rounded-md">
              <p className="font-medium">{selectedAccountDetails.customer?.name}</p>
              <p className="text-sm">
                Saldo actual: <span className={selectedAccountDetails.balance >= 0 ? "text-green-600" : "text-red-600"}>
                  ${parseFloat(selectedAccountDetails.balance).toFixed(2)}
                </span>
              </p>
            </div>
          )}
          
          <Form {...transactionForm}>
            <form onSubmit={transactionForm.handleSubmit(onAddTransactionSubmit)} className="space-y-6">
              <FormField
                control={transactionForm.control}
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
                control={transactionForm.control}
                name="currency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Moneda</FormLabel>
                    <Select
                      onValueChange={field.onChange}
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
              
              {transactionType === "credit" && (
                <FormField
                  control={transactionForm.control}
                  name="paymentMethod"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Método de Pago</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar método de pago" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="cash">Efectivo</SelectItem>
                          <SelectItem value="transfer">Transferencia</SelectItem>
                          <SelectItem value="credit_card">Tarjeta de Crédito</SelectItem>
                          <SelectItem value="debit_card">Tarjeta de Débito</SelectItem>
                          <SelectItem value="check">Cheque</SelectItem>
                          <SelectItem value="qr">QR</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              
              <FormField
                control={transactionForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descripción</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsTransactionDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit"
                  disabled={addTransactionMutation.isPending}
                  variant={transactionType === "credit" ? "default" : "secondary"}
                >
                  {addTransactionMutation.isPending 
                    ? "Procesando..." 
                    : transactionType === "credit" ? "Registrar Pago" : "Registrar Débito"
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

export default AccountsPage;
