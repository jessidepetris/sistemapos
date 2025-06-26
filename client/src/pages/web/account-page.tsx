import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import WebLayout from "@/layouts/web-layout";
import { useWebAuth } from "@/hooks/use-web-auth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Loader2, SaveIcon, KeyIcon, UserIcon } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

// Esquemas de validación
const profileFormSchema = z.object({
  name: z.string().min(2, { message: "El nombre debe tener al menos 2 caracteres" }),
  email: z.string().email({ message: "Email inválido" }),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  province: z.string().optional()
});

const passwordFormSchema = z.object({
  currentPassword: z.string().min(6, { message: "La contraseña debe tener al menos 6 caracteres" }),
  newPassword: z.string().min(6, { message: "La contraseña debe tener al menos 6 caracteres" }),
  confirmPassword: z.string().min(6, { message: "La contraseña debe tener al menos 6 caracteres" })
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"]
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;
type PasswordFormValues = z.infer<typeof passwordFormSchema>;

export default function AccountPage() {
  const [_, navigate] = useLocation();
  const { user, isLoading } = useWebAuth();
  const { toast } = useToast();
  const [updating, setUpdating] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  // Formulario de perfil
  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      address: "",
      city: "",
      province: ""
    }
  });

  // Formulario de cambio de contraseña
  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: ""
    }
  });

  // Redirección si no está autenticado
  useEffect(() => {
    if (!isLoading && !user) {
      navigate("/web/login");
    }
  }, [user, isLoading, navigate]);

  // Cargar datos del usuario en el formulario
  useEffect(() => {
    if (user) {
      profileForm.reset({
        name: user.fullName || user.name || "",
        email: user.email || "",
        phone: user.phone || "",
        address: user.address || "",
        city: user.city || "",
        province: user.province || ""
      });
    }
  }, [user, profileForm]);

  // Enviar actualización de perfil
  const onSubmitProfile = async (data: ProfileFormValues) => {
    if (!user) return;
    
    setUpdating(true);
    try {
      const response = await apiRequest(
        "PUT", 
        "/api/web/user/profile", 
        data
      );
      
      if (response.ok) {
        toast({
          title: "Perfil actualizado",
          description: "Tu información ha sido actualizada correctamente",
          variant: "default",
        });
        
        // Recargar la página para actualizar la información de usuario
        window.location.reload();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error al actualizar el perfil");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Ocurrió un error al actualizar el perfil",
        variant: "destructive",
      });
    } finally {
      setUpdating(false);
    }
  };

  // Enviar cambio de contraseña
  const onSubmitPassword = async (data: PasswordFormValues) => {
    if (!user) return;
    
    setChangingPassword(true);
    try {
      const response = await apiRequest(
        "PUT", 
        "/api/web/user/password", 
        {
          currentPassword: data.currentPassword,
          newPassword: data.newPassword
        }
      );
      
      if (response.ok) {
        toast({
          title: "Contraseña actualizada",
          description: "Tu contraseña ha sido actualizada correctamente",
          variant: "default",
        });
        
        // Resetear el formulario
        passwordForm.reset();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error al actualizar la contraseña");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Ocurrió un error al actualizar la contraseña",
        variant: "destructive",
      });
    } finally {
      setChangingPassword(false);
    }
  };

  if (isLoading) {
    return (
      <WebLayout>
        <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </WebLayout>
    );
  }

  return (
    <WebLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-2">Mi Cuenta</h1>
          <p className="text-muted-foreground mb-6">Gestiona tu información personal y preferencias</p>
        
          <Tabs defaultValue="profile" className="w-full">
            <TabsList className="mb-6">
              <TabsTrigger value="profile" className="flex items-center">
                <UserIcon className="h-4 w-4 mr-2" />
                Información Personal
              </TabsTrigger>
              <TabsTrigger value="security" className="flex items-center">
                <KeyIcon className="h-4 w-4 mr-2" />
                Seguridad
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="profile">
              <Card>
                <CardHeader>
                  <CardTitle>Información Personal</CardTitle>
                  <CardDescription>
                    Actualiza tus datos personales de contacto y despacho
                  </CardDescription>
                </CardHeader>
                <form onSubmit={profileForm.handleSubmit(onSubmitProfile)}>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="name">Nombre completo</Label>
                        <Input 
                          id="name" 
                          {...profileForm.register("name")} 
                          placeholder="Tu nombre completo" 
                        />
                        {profileForm.formState.errors.name && (
                          <p className="text-sm text-red-500">{profileForm.formState.errors.name.message}</p>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input 
                          id="email" 
                          type="email" 
                          {...profileForm.register("email")} 
                          placeholder="tu@email.com" 
                        />
                        {profileForm.formState.errors.email && (
                          <p className="text-sm text-red-500">{profileForm.formState.errors.email.message}</p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">Teléfono</Label>
                      <Input 
                        id="phone" 
                        {...profileForm.register("phone")} 
                        placeholder="(123) 456-7890" 
                      />
                    </div>

                    <Separator className="my-4" />
                    <h3 className="text-lg font-medium">Dirección de Envío</h3>

                    <div className="space-y-2">
                      <Label htmlFor="address">Dirección</Label>
                      <Input 
                        id="address" 
                        {...profileForm.register("address")} 
                        placeholder="Calle, número, depto, etc." 
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="city">Ciudad</Label>
                        <Input 
                          id="city" 
                          {...profileForm.register("city")} 
                          placeholder="Tu ciudad" 
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="province">Provincia</Label>
                        <Input 
                          id="province" 
                          {...profileForm.register("province")} 
                          placeholder="Tu provincia" 
                        />
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button 
                      type="submit" 
                      disabled={updating || !profileForm.formState.isDirty}
                      className="flex items-center"
                    >
                      {updating ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Actualizando...
                        </>
                      ) : (
                        <>
                          <SaveIcon className="h-4 w-4 mr-2" />
                          Guardar Cambios
                        </>
                      )}
                    </Button>
                  </CardFooter>
                </form>
              </Card>
            </TabsContent>
            
            <TabsContent value="security">
              <Card>
                <CardHeader>
                  <CardTitle>Cambiar Contraseña</CardTitle>
                  <CardDescription>
                    Actualiza tu contraseña para mantener tu cuenta segura
                  </CardDescription>
                </CardHeader>
                <form onSubmit={passwordForm.handleSubmit(onSubmitPassword)}>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="currentPassword">Contraseña Actual</Label>
                      <Input 
                        id="currentPassword" 
                        type="password" 
                        {...passwordForm.register("currentPassword")} 
                      />
                      {passwordForm.formState.errors.currentPassword && (
                        <p className="text-sm text-red-500">{passwordForm.formState.errors.currentPassword.message}</p>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="newPassword">Nueva Contraseña</Label>
                      <Input 
                        id="newPassword" 
                        type="password" 
                        {...passwordForm.register("newPassword")} 
                      />
                      {passwordForm.formState.errors.newPassword && (
                        <p className="text-sm text-red-500">{passwordForm.formState.errors.newPassword.message}</p>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirmar Nueva Contraseña</Label>
                      <Input 
                        id="confirmPassword" 
                        type="password" 
                        {...passwordForm.register("confirmPassword")} 
                      />
                      {passwordForm.formState.errors.confirmPassword && (
                        <p className="text-sm text-red-500">{passwordForm.formState.errors.confirmPassword.message}</p>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button 
                      type="submit" 
                      disabled={changingPassword || !passwordForm.formState.isDirty}
                      className="flex items-center"
                    >
                      {changingPassword ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Actualizando...
                        </>
                      ) : (
                        <>
                          <KeyIcon className="h-4 w-4 mr-2" />
                          Cambiar Contraseña
                        </>
                      )}
                    </Button>
                  </CardFooter>
                </form>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </WebLayout>
  );
}
