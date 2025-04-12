import React, { useState } from "react";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Check, Database, Save, Settings as SettingsIcon, Upload } from "lucide-react";

const companyInfoSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  address: z.string().min(1, "La dirección es requerida"),
  phone: z.string().min(1, "El teléfono es requerido"),
  email: z.string().email("Debe ser un email válido"),
  taxId: z.string().min(1, "El CUIT/NIT es requerido"),
  logo: z.string().optional(),
});

type CompanyInfoValues = z.infer<typeof companyInfoSchema>;

const backupSettingsSchema = z.object({
  autoBackup: z.boolean().default(true),
  backupFrequency: z.enum(["daily", "weekly", "monthly"]).default("daily"),
  backupLocation: z.string().min(1, "La ubicación es requerida"),
});

type BackupSettingsValues = z.infer<typeof backupSettingsSchema>;

const fiscalPrinterSchema = z.object({
  enabled: z.boolean().default(false),
  model: z.string().optional(),
  port: z.string().optional(),
  fiscalNumber: z.string().optional(),
});

type FiscalPrinterValues = z.infer<typeof fiscalPrinterSchema>;

export default function SettingsPage() {
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  
  // Company info form
  const companyInfoForm = useForm<CompanyInfoValues>({
    resolver: zodResolver(companyInfoSchema),
    defaultValues: {
      name: "Punto Pastelero",
      address: "Av. Siempre Viva 123",
      phone: "11-1234-5678",
      email: "info@puntopastelero.com",
      taxId: "30-71234567-8",
    },
  });
  
  // Backup settings form
  const backupSettingsForm = useForm<BackupSettingsValues>({
    resolver: zodResolver(backupSettingsSchema),
    defaultValues: {
      autoBackup: true,
      backupFrequency: "daily",
      backupLocation: "/backups",
    },
  });
  
  // Fiscal printer form
  const fiscalPrinterForm = useForm<FiscalPrinterValues>({
    resolver: zodResolver(fiscalPrinterSchema),
    defaultValues: {
      enabled: false,
      model: "",
      port: "",
      fiscalNumber: "",
    },
  });
  
  // Form submission handlers
  const onCompanyInfoSubmit = (data: CompanyInfoValues) => {
    toast({
      title: "Información de la empresa actualizada",
      description: "Los cambios han sido guardados correctamente",
    });
    console.log("Company info saved:", data);
  };
  
  const onBackupSettingsSubmit = (data: BackupSettingsValues) => {
    toast({
      title: "Configuración de respaldo actualizada",
      description: "Los cambios han sido guardados correctamente",
    });
    console.log("Backup settings saved:", data);
  };
  
  const onFiscalPrinterSubmit = (data: FiscalPrinterValues) => {
    toast({
      title: "Configuración de impresora fiscal actualizada",
      description: "Los cambios han sido guardados correctamente",
    });
    console.log("Fiscal printer settings saved:", data);
  };
  
  // Handle logo upload
  const handleLogoUpload = () => {
    setIsUploading(true);
    
    // Simulate upload delay
    setTimeout(() => {
      setIsUploading(false);
      toast({
        title: "Logo subido correctamente",
        description: "La imagen ha sido actualizada",
      });
    }, 1500);
  };
  
  // Handle backup now
  const handleBackupNow = () => {
    toast({
      title: "Respaldo iniciado",
      description: "El respaldo se está generando...",
    });
    
    // Simulate backup delay
    setTimeout(() => {
      toast({
        title: "Respaldo completado",
        description: "El respaldo se ha guardado correctamente",
      });
    }, 3000);
  };
  
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title="Configuración" />
        
        <main className="flex-1 overflow-auto p-6">
          <Tabs defaultValue="general" className="w-full">
            <TabsList className="w-full grid grid-cols-3 mb-6">
              <TabsTrigger value="general">Información General</TabsTrigger>
              <TabsTrigger value="backup">Respaldos</TabsTrigger>
              <TabsTrigger value="fiscal">Impresora Fiscal</TabsTrigger>
            </TabsList>
            
            <TabsContent value="general">
              <Card>
                <CardHeader>
                  <CardTitle>Información de la Empresa</CardTitle>
                  <CardDescription>
                    Esta información se utilizará en los documentos generados
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...companyInfoForm}>
                    <form onSubmit={companyInfoForm.handleSubmit(onCompanyInfoSubmit)} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          control={companyInfoForm.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Nombre de la Empresa</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={companyInfoForm.control}
                          name="taxId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>CUIT/NIT</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <FormField
                        control={companyInfoForm.control}
                        name="address"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Dirección</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          control={companyInfoForm.control}
                          name="phone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Teléfono</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={companyInfoForm.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <FormField
                        control={companyInfoForm.control}
                        name="logo"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Logo de la Empresa</FormLabel>
                            <div className="flex items-center gap-4">
                              <div className="w-20 h-20 bg-slate-100 rounded flex items-center justify-center">
                                {field.value ? (
                                  <img 
                                    src={field.value} 
                                    alt="Logo" 
                                    className="max-w-full max-h-full object-contain" 
                                  />
                                ) : (
                                  <SettingsIcon className="text-slate-400" />
                                )}
                              </div>
                              <Button 
                                type="button" 
                                variant="outline"
                                disabled={isUploading}
                                onClick={handleLogoUpload}
                              >
                                {isUploading ? (
                                  <>
                                    <div className="animate-spin mr-2 h-4 w-4 border-2 border-b-transparent rounded-full" />
                                    Subiendo...
                                  </>
                                ) : (
                                  <>
                                    <Upload className="mr-2 h-4 w-4" />
                                    Subir Logo
                                  </>
                                )}
                              </Button>
                            </div>
                            <FormDescription>
                              Formato PNG o JPG, máximo 2MB
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="flex justify-end">
                        <Button type="submit">
                          <Save className="mr-2 h-4 w-4" />
                          Guardar Cambios
                        </Button>
                      </div>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="backup">
              <Card>
                <CardHeader>
                  <CardTitle>Configuración de Respaldos</CardTitle>
                  <CardDescription>
                    Gestione la configuración de respaldos de la base de datos
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="mb-6">
                    <Button onClick={handleBackupNow} className="flex items-center">
                      <Database className="mr-2 h-4 w-4" />
                      Realizar Respaldo Ahora
                    </Button>
                  </div>
                  
                  <Form {...backupSettingsForm}>
                    <form onSubmit={backupSettingsForm.handleSubmit(onBackupSettingsSubmit)} className="space-y-6">
                      <FormField
                        control={backupSettingsForm.control}
                        name="autoBackup"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">Respaldo Automático</FormLabel>
                              <FormDescription>
                                Habilitar respaldos automáticos programados
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
                      
                      <FormField
                        control={backupSettingsForm.control}
                        name="backupFrequency"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Frecuencia de Respaldo</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                              disabled={!backupSettingsForm.watch("autoBackup")}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Seleccionar frecuencia" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="daily">Diario</SelectItem>
                                <SelectItem value="weekly">Semanal</SelectItem>
                                <SelectItem value="monthly">Mensual</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={backupSettingsForm.control}
                        name="backupLocation"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Ubicación de Respaldos</FormLabel>
                            <FormControl>
                              <Input {...field} disabled={!backupSettingsForm.watch("autoBackup")} />
                            </FormControl>
                            <FormDescription>
                              Ruta donde se guardarán los archivos de respaldo
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="flex justify-end">
                        <Button 
                          type="submit"
                          disabled={!backupSettingsForm.watch("autoBackup")}
                        >
                          <Save className="mr-2 h-4 w-4" />
                          Guardar Configuración
                        </Button>
                      </div>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="fiscal">
              <Card>
                <CardHeader>
                  <CardTitle>Impresora Fiscal</CardTitle>
                  <CardDescription>
                    Configure la conexión con su impresora fiscal
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...fiscalPrinterForm}>
                    <form onSubmit={fiscalPrinterForm.handleSubmit(onFiscalPrinterSubmit)} className="space-y-6">
                      <FormField
                        control={fiscalPrinterForm.control}
                        name="enabled"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">Habilitar Impresora Fiscal</FormLabel>
                              <FormDescription>
                                Conectar con impresora fiscal para facturación electrónica
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
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          control={fiscalPrinterForm.control}
                          name="model"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Modelo de Impresora</FormLabel>
                              <Select
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                                disabled={!fiscalPrinterForm.watch("enabled")}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Seleccionar modelo" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="epson">Epson TM-T900F</SelectItem>
                                  <SelectItem value="hasar">Hasar 2000</SelectItem>
                                  <SelectItem value="samsung">Samsung Fiscal</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={fiscalPrinterForm.control}
                          name="port"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Puerto</FormLabel>
                              <FormControl>
                                <Input {...field} disabled={!fiscalPrinterForm.watch("enabled")} />
                              </FormControl>
                              <FormDescription>
                                Ejemplo: COM1, /dev/ttyS0, etc.
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <FormField
                        control={fiscalPrinterForm.control}
                        name="fiscalNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Número de Serie Fiscal</FormLabel>
                            <FormControl>
                              <Input {...field} disabled={!fiscalPrinterForm.watch("enabled")} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="flex justify-between">
                        <Button 
                          type="button" 
                          variant="outline"
                          disabled={!fiscalPrinterForm.watch("enabled")}
                        >
                          <Check className="mr-2 h-4 w-4" />
                          Probar Conexión
                        </Button>
                        
                        <Button 
                          type="submit"
                          disabled={!fiscalPrinterForm.watch("enabled")}
                        >
                          <Save className="mr-2 h-4 w-4" />
                          Guardar Configuración
                        </Button>
                      </div>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
}
