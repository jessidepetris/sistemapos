import { useState } from "react";
import { useWebAuth } from "@/hooks/use-web-auth";
import { useLocation } from "wouter";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Icons } from "@/components/ui/icons";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  UserIcon, 
  ShoppingBag, 
  CreditCard, 
  MapPin, 
  LogOut 
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import WebLayout from "@/layouts/web-layout";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";

const profileFormSchema = z.object({
  name: z.string().min(2, {
    message: "El nombre debe tener al menos 2 caracteres.",
  }),
  email: z.string().email({
    message: "Por favor ingresa un correo electrónico válido.",
  }),
  phone: z.string().min(8, {
    message: "Por favor ingresa un número telefónico válido.",
  }),
  address: z.string().min(5, {
    message: "Por favor ingresa una dirección válida.",
  }),
  city: z.string().min(2, {
    message: "Por favor ingresa una ciudad válida.",
  }),
  province: z.string().min(2, {
    message: "Por favor ingresa una provincia válida.",
  }),
});

const passwordFormSchema = z.object({
  currentPassword: z.string().min(6, {
    message: "La contraseña actual debe tener al menos 6 caracteres.",
  }),
  newPassword: z.string().min(6, {
    message: "La nueva contraseña debe tener al menos 6 caracteres.",
  }),
  confirmPassword: z.string().min(6, {
    message: "La confirmación debe tener al menos 6 caracteres.",
  }),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"],
});

export default function AccountPage() {
  const [location, navigate] = useLocation();
  const { user, isLoading, logoutMutation } = useWebAuth();
  const { toast } = useToast();
  const [updating, setUpdating] = useState(false);

  // Si no hay usuario y no está cargando, redirigir al login
  if (!isLoading && !user) {
    navigate("/web/login");
    return null;
  }

  // Formulario de perfil
  const profileForm = useForm<z.infer<typeof profileFormSchema>>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: user?.name || "",
      email: user?.email || "",
      phone: user?.phone || "",
      address: user?.address || "",
      city: user?.city || "",
      province: user?.province || "",
    },
  });

  // Formulario de cambio de contraseña
  const passwordForm = useForm<z.infer<typeof passwordFormSchema>>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  // Mutación para actualizar perfil
  const updateProfileMutation = useMutation({
    mutationFn: async (data: z.infer<typeof profileFormSchema>) => {
      const res = await apiRequest("PUT", "/api/web/user/profile", data);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Error al actualizar el perfil");
      }
      return await res.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["/api/web/user"], data);
      toast({
        title: "Perfil actualizado",
        description: "Tu información se ha actualizado correctamente",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error al actualizar",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mutación para cambiar contraseña
  const changePasswordMutation = useMutation({
    mutationFn: async (data: z.infer<typeof passwordFormSchema>) => {
      const res = await apiRequest("PUT", "/api/web/user/password", {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Error al cambiar la contraseña");
      }
      return true;
    },
    onSuccess: () => {
      passwordForm.reset();
      toast({
        title: "Contraseña actualizada",
        description: "Tu contraseña se ha actualizado correctamente",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error al cambiar la contraseña",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleProfileSubmit = (data: z.infer<typeof profileFormSchema>) => {
    updateProfileMutation.mutate(data);
  };

  const handlePasswordSubmit = (data: z.infer<typeof passwordFormSchema>) => {
    changePasswordMutation.mutate(data);
  };

  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSuccess: () => {
        navigate("/web");
      },
    });
  };

  if (isLoading) {
    return (
      <WebLayout>
        <div className="container mx-auto py-8 text-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
          <p className="mt-4">Cargando información...</p>
        </div>
      </WebLayout>
    );
  }

  return (
    <WebLayout>
      <div className="container mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold mb-8">Mi Cuenta</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Panel de navegación lateral */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <UserIcon className="mr-2 h-5 w-5" />
                  <span>{user?.name}</span>
                </CardTitle>
                <CardDescription>{user?.email}</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <nav className="space-y-1">
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start" 
                    onClick={() => navigate("/web/account")}
                  >
                    <UserIcon className="mr-2 h-5 w-5" />
                    Mi Perfil
                  </Button>
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start" 
                    onClick={() => navigate("/web/orders")}
                  >
                    <ShoppingBag className="mr-2 h-5 w-5" />
                    Mis Pedidos
                  </Button>
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start text-destructive" 
                    onClick={handleLogout}
                  >
                    <LogOut className="mr-2 h-5 w-5" />
                    Cerrar Sesión
                  </Button>
                </nav>
              </CardContent>
            </Card>
          </div>

          {/* Contenido principal */}
          <div className="md:col-span-2">
            <Tabs defaultValue="profile" className="w-full">
              <TabsList className="grid grid-cols-2 mb-6">
                <TabsTrigger value="profile">Información Personal</TabsTrigger>
                <TabsTrigger value="password">Cambiar Contraseña</TabsTrigger>
              </TabsList>

              {/* Tab de información personal */}
              <TabsContent value="profile">
                <Card>
                  <CardHeader>
                    <CardTitle>Información Personal</CardTitle>
                    <CardDescription>
                      Actualiza tu información personal. Esta información se utilizará para
                      completar tus pedidos y contactarte si es necesario.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Form {...profileForm}>
                      <form onSubmit={profileForm.handleSubmit(handleProfileSubmit)} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={profileForm.control}
                            name="name"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Nombre Completo</FormLabel>
                                <FormControl>
                                  <Input placeholder="Tu nombre completo" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={profileForm.control}
                            name="email"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Correo Electrónico</FormLabel>
                                <FormControl>
                                  <Input placeholder="tu@email.com" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={profileForm.control}
                            name="phone"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Teléfono</FormLabel>
                                <FormControl>
                                  <Input placeholder="Tu número de teléfono" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={profileForm.control}
                            name="address"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Dirección</FormLabel>
                                <FormControl>
                                  <Input placeholder="Tu dirección" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={profileForm.control}
                            name="city"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Ciudad</FormLabel>
                                <FormControl>
                                  <Input placeholder="Tu ciudad" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={profileForm.control}
                            name="province"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Provincia</FormLabel>
                                <FormControl>
                                  <Input placeholder="Tu provincia" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        <Button 
                          type="submit" 
                          className="w-full md:w-auto"
                          disabled={updateProfileMutation.isPending}
                        >
                          {updateProfileMutation.isPending && (
                            <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                          )}
                          Guardar Cambios
                        </Button>
                      </form>
                    </Form>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Tab de cambio de contraseña */}
              <TabsContent value="password">
                <Card>
                  <CardHeader>
                    <CardTitle>Cambiar Contraseña</CardTitle>
                    <CardDescription>
                      Actualiza tu contraseña para mantener tu cuenta segura.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Form {...passwordForm}>
                      <form onSubmit={passwordForm.handleSubmit(handlePasswordSubmit)} className="space-y-6">
                        <FormField
                          control={passwordForm.control}
                          name="currentPassword"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Contraseña Actual</FormLabel>
                              <FormControl>
                                <Input type="password" placeholder="••••••••" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={passwordForm.control}
                          name="newPassword"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Nueva Contraseña</FormLabel>
                              <FormControl>
                                <Input type="password" placeholder="••••••••" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={passwordForm.control}
                          name="confirmPassword"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Confirmar Nueva Contraseña</FormLabel>
                              <FormControl>
                                <Input type="password" placeholder="••••••••" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <Button 
                          type="submit" 
                          className="w-full md:w-auto"
                          disabled={changePasswordMutation.isPending}
                        >
                          {changePasswordMutation.isPending && (
                            <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                          )}
                          Cambiar Contraseña
                        </Button>
                      </form>
                    </Form>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </WebLayout>
  );
}