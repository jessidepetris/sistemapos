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
import { insertAccountTransactionSchema } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Search, CreditCard, ArrowDownCircle, ArrowUpCircle } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const transactionFormSchema = insertAccountTransactionSchema.extend({
  amount: z.coerce.number().min(0.01, "El monto debe ser mayor a 0"),
  description: z.string().min(1, "La descripción es requerida"),
});

type TransactionFormValues = z.infer<typeof transactionFormSchema>;

export default function AccountsPage() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAccount, setSelectedAccount] = useState<number | null>(null);
  const [selectedAccountDetails, setSelectedAccountDetails] = useState<any | null>(null);
  const [isTransactionDialogOpen, setIsTransactionDialogOpen] = useState(false);
  const [transactionType, setTransactionType] = useState<"credit" | "debit">("credit");
  
  // Get accounts
  const { data: accounts, isLoading } = useQuery({
    queryKey: ["/api/accounts"],
    retry: false,
  });
  
  // Get account transactions if an account is selected
  const { data: transactions, isLoading: isLoadingTransactions } = useQuery({
    queryKey: [`/api/accounts/${selectedAccount}/transactions`],
    enabled: !!selectedAccount,
    retry: false,
  });
  
  // Get customers for new account
  const { data: customers, isLoading: isLoadingCustomers } = useQuery({
    queryKey: ["/api/customers"],
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
  const filteredAccounts = searchQuery
    ? accounts?.filter((account: any) =>
        account.customer?.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : accounts;
  
  // Form submission handlers
  const onCreateAccountSubmit = (data: any) => {
    createAccountMutation.mutate(data);
  };
  
  const onAddTransactionSubmit = (data: TransactionFormValues) => {
    addTransactionMutation.mutate({
      ...data,
      accountId: selectedAccount!,
      type: transactionType,
    });
  };
  
  // Handle opening transaction dialog
  const handleOpenTransactionDialog = (account: any, type: "credit" | "debit") => {
    setSelectedAccount(account.id);
    setSelectedAccountDetails(account);
    setTransactionType(type);
    transactionForm.reset({
      accountId: account.id,
      amount: 0,
      type: type,
      description: type === "credit" ? "Pago a cuenta" : "Compra",
    });
    setIsTransactionDialogOpen(true);
  };
  
  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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
                      {filteredAccounts.map((account: any) => (
                        <div 
                          key={account.id} 
                          className={`p-4 hover:bg-slate-50 cursor-pointer ${
                            selectedAccount === account.id ? "bg-slate-50" : ""
                          }`}
                          onClick={() => setSelectedAccount(account.id)}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-medium">{account.customer?.name}</h3>
                              <p className="text-sm text-slate-500">
                                Actualizado: {formatDate(account.lastUpdated)}
                              </p>
                            </div>
                            <Badge className={account.balance >= 0 ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                              ${parseFloat(account.balance).toFixed(2)}
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
                            <TableHead className="text-right">Monto</TableHead>
                            <TableHead className="text-right">Saldo</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {transactions.map((transaction: any) => (
                            <TableRow key={transaction.id}>
                              <TableCell>{formatDate(transaction.timestamp)}</TableCell>
                              <TableCell>
                                {transaction.relatedSaleId ? (
                                  <button 
                                    className="text-blue-600 hover:underline font-medium"
                                    onClick={() => {
                                      window.open(`/invoices?id=${transaction.relatedSaleId}`, '_blank');
                                    }}
                                  >
                                    {transaction.description}
                                  </button>
                                ) : (
                                  transaction.description
                                )}
                              </TableCell>
                              <TableCell>
                                <Badge 
                                  variant={transaction.type === "credit" ? "outline" : "secondary"}
                                  className={
                                    transaction.type === "credit" 
                                      ? "bg-green-50 text-green-700 border-green-200" 
                                      : "bg-blue-50 text-blue-700"
                                  }
                                >
                                  {transaction.type === "credit" ? "Crédito" : "Débito"}
                                </Badge>
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
                          customers?.filter((c: any) => !c.hasAccount).map((customer: any) => (
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
