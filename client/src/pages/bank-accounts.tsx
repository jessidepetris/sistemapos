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
  Form, FormControl, FormField, FormItem,
  FormLabel, FormMessage
} from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Search, Wallet, Edit, Trash2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const bankAccountFormSchema = z.object({
  bankName: z.string().min(1, "El nombre del banco es requerido"),
  accountNumber: z.string().min(1, "El número de cuenta es requerido"),
  accountType: z.enum(["savings", "current"], {
    required_error: "El tipo de cuenta es requerido",
  }),
  alias: z.string().min(1, "El alias es requerido"),
  isActive: z.boolean().default(true),
});

type BankAccountFormValues = z.infer<typeof bankAccountFormSchema>;

export default function BankAccountsPage() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAccount, setSelectedAccount] = useState<any | null>(null);
  
  // Get bank accounts
  const { data: accounts, isLoading } = useQuery({
    queryKey: ["bank-accounts"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/bank-accounts");
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    },
    retry: false,
  });
  
  // Form
  const form = useForm<BankAccountFormValues>({
    resolver: zodResolver(bankAccountFormSchema),
    defaultValues: {
      bankName: "",
      accountNumber: "",
      accountType: "current",
      alias: "",
      isActive: true,
    },
  });
  
  // Create/Update mutation
  const saveAccountMutation = useMutation({
    mutationFn: async (data: BankAccountFormValues) => {
      if (selectedAccount) {
        const res = await apiRequest("PUT", `/api/bank-accounts/${selectedAccount.id}`, data);
        return await res.json();
      } else {
        const res = await apiRequest("POST", "/api/bank-accounts", data);
        return await res.json();
      }
    },
    onSuccess: (data) => {
      toast({ 
        title: selectedAccount ? "Cuenta actualizada" : "Cuenta creada",
        description: "La cuenta bancaria se ha guardado correctamente"
      });
      form.reset();
      setIsDialogOpen(false);
      setSelectedAccount(null);
      queryClient.invalidateQueries({ queryKey: ["bank-accounts"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: (error as Error).message,
        variant: "destructive",
      });
    }
  });
  
  // Delete mutation
  const deleteAccountMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/bank-accounts/${id}`);
    },
    onSuccess: () => {
      toast({ title: "Cuenta eliminada correctamente" });
      queryClient.invalidateQueries({ queryKey: ["bank-accounts"] });
    },
    onError: (error) => {
      toast({
        title: "Error al eliminar la cuenta",
        description: (error as Error).message,
        variant: "destructive",
      });
    }
  });
  
  // Filtered accounts based on search
  const filteredAccounts = React.useMemo(() => {
    if (!accounts) return [];
    return searchQuery
      ? accounts.filter((account: any) =>
          account.bankName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          account.accountNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
          account.alias.toLowerCase().includes(searchQuery.toLowerCase())
        )
      : accounts;
  }, [accounts, searchQuery]);
  
  // Form submission handler
  const onSubmit = (data: BankAccountFormValues) => {
    saveAccountMutation.mutate(data);
  };
  
  // Handle edit
  const handleEdit = (account: any) => {
    setSelectedAccount(account);
    form.reset({
      bankName: account.bankName,
      accountNumber: account.accountNumber,
      accountType: account.accountType,
      alias: account.alias,
      isActive: account.isActive,
    });
    setIsDialogOpen(true);
  };
  
  // Handle delete
  const handleDelete = (id: number) => {
    if (confirm("¿Está seguro que desea eliminar esta cuenta bancaria?")) {
      deleteAccountMutation.mutate(id);
    }
  };
  
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title="Cuentas Bancarias" />
        
        <main className="flex-1 overflow-auto p-6">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-center">
                <CardTitle>Cuentas Bancarias</CardTitle>
                <Button onClick={() => setIsDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nueva Cuenta
                </Button>
              </div>
            </CardHeader>
            
            <CardContent>
              <div className="flex items-center gap-2 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar cuentas..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>
              
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Alias</TableHead>
                      <TableHead>Banco</TableHead>
                      <TableHead>Número de Cuenta</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="w-[100px]">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAccounts?.map((account: any) => (
                      <TableRow key={account.id}>
                        <TableCell className="font-medium">{account.alias}</TableCell>
                        <TableCell>{account.bankName}</TableCell>
                        <TableCell>{account.accountNumber}</TableCell>
                        <TableCell>
                          {account.accountType === "savings" ? "Ahorro" : "Corriente"}
                        </TableCell>
                        <TableCell>
                          <Badge variant={account.isActive ? "default" : "secondary"}>
                            {account.isActive ? "Activa" : "Inactiva"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(account)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(account.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
      
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedAccount ? "Editar Cuenta" : "Nueva Cuenta"}
            </DialogTitle>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="alias"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Alias</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej: Cuenta Principal" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="bankName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Banco</FormLabel>
                    <FormControl>
                      <Input placeholder="Nombre del banco" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="accountNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Número de Cuenta</FormLabel>
                    <FormControl>
                      <Input placeholder="Número de cuenta" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="accountType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Cuenta</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar tipo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="savings">Cuenta de Ahorro</SelectItem>
                        <SelectItem value="current">Cuenta Corriente</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsDialogOpen(false);
                    setSelectedAccount(null);
                    form.reset();
                  }}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={saveAccountMutation.isPending}>
                  {saveAccountMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    "Guardar"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
} 
