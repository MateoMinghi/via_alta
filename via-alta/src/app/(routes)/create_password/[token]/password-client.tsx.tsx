'use client';

import React, { useState, useEffect } from 'react';     // Importación de React y hooks necesarios
import { useForm } from 'react-hook-form';              // Importación de react-hook-form para manejar formularios
import { zodResolver } from '@hookform/resolvers/zod';  // Importación de Zod para la validación de formularios
import { z } from 'zod';                                // Importación de Zod para definir esquemas de validación
import { useRouter } from 'next/navigation';            // Importación de useRouter para la navegación
import Image from 'next/image';                         // Importación de Image para manejar imágenes
import { Loader2 } from 'lucide-react';                 // Importación de un ícono de carga

import { Button } from '@/components/ui/button';        // Importación del botón personalizado
import { Input } from '@/components/ui/input';          // Importación del campo de entrada personalizado
import { Checkbox } from '@/components/ui/checkbox';    // Importación del checkbox personalizado
import {
  Card,
  CardContent,
  CardHeader,
} from '@/components/ui/card';                          // Importación de los componentes de tarjeta personalizados
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';                          // Importación de los componentes de formulario personalizados

// Esquema de validación usando Zod para la contraseña y su confirmación
const passwordSchema = z
  .object({
    password: z.string().min(8, {
      message: 'La contraseña debe tener al menos 8 caracteres.',
    }).regex(/[0-9]/, {
      message: 'La contraseña debe incluir al menos un número.',
    }).regex(/[A-Z]/, {
      message: 'La contraseña debe incluir al menos una letra mayúscula.',
    }),
    confirmPassword: z.string(),
  })
  .refine(data => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  });

// Definición del tipo para las props del componente
type CreatePasswordFormProps = {
  token: string;
};

// Componente principal para crear una nueva contraseña
export function CreatePasswordClient({ token }: CreatePasswordFormProps) {
  // Estados locales del componente
  const [isLoading, setIsLoading] = useState(false);  // Estado de carga
  const [verifying, setVerifying] = useState(true);  // Estado de verificación del token
  const [showPassword, setShowPassword] = useState(false);  // Estado para mostrar/ocultar contraseña
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);  // Mensajes de éxito o error
  const [tokenValid, setTokenValid] = useState(false);  // Estado que indica si el token es válido
  const [userData, setUserData] = useState<{ ivd_id: string } | null>(null);  // Datos del usuario
  const router = useRouter();
  
  // Verificación del token al cargar el componente
  useEffect(() => {
    async function verifyToken() {
      try {
        const response = await fetch(`/api/auth/verify-token?token=${token}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Token de verificación inválido");
        }

        setTokenValid(true);
        setUserData(data.user);
      } catch (error) {
        setMessage({
          text: error instanceof Error ? error.message : 'Token inválido o expirado',
          type: 'error',
        });
        setTokenValid(false);
      } finally {
        setVerifying(false);  // Finaliza la verificación
      }
    }

    verifyToken();
  }, [token]);

  // Inicialización del formulario con react-hook-form y validación Zod
  const form = useForm<z.infer<typeof passwordSchema>>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  // Función que maneja el envío del formulario
  async function onSubmit(values: z.infer<typeof passwordSchema>) {
    setIsLoading(true);  // Indicamos que está en proceso
    setMessage(null);  // Limpiamos cualquier mensaje previo

    try {
      const response = await fetch('/api/auth/create-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          password: values.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Ocurrió un error al establecer la contraseña');
      }

      // Si la contraseña se crea con éxito
      setMessage({
        text: 'Contraseña creada exitosamente. Redirigiendo al inicio de sesión...',
        type: 'success',
      });

      form.reset();  // Limpiamos el formulario

      // Redirigimos al inicio de sesión después de 3 segundos
      setTimeout(() => {
        router.push('/');
      }, 3000);
    } catch (error) {
      // En caso de error
      setMessage({
        text: error instanceof Error ? error.message : 'Ocurrió un error inesperado',
        type: 'error',
      });
    } finally {
      setIsLoading(false);  // Finalizamos el proceso
    }
  }

  // Mientras se está verificando el token, mostramos un loader
  if (verifying) {
    return (
      <div className="flex bg-black/70 h-screen items-center justify-center">
        <Card className="flex flex-col items-center w-[400px] p-6">
          <Loader2 className="h-8 w-8 animate-spin mb-4" />
          <p className="text-center">Verificando token...</p>
        </Card>
      </div>
    );
  }

  // Si el token no es válido, mostramos un mensaje de error
  if (!tokenValid) {
    return (
      <div className="flex bg-black/70 h-screen items-center justify-center">
        <Card className="flex flex-col items-center w-[400px] p-6">
          <CardHeader>
            <Image src="/logo.svg" alt="logo" width={100} height={100} />
          </CardHeader>
          <div className="text-red-500 mb-4">
            {message?.text || "Token inválido o expirado"}
          </div>
          <Button onClick={() => router.push('/')}>
            Volver al inicio de sesión
          </Button>
        </Card>
      </div>
    );
  }

  // Formulario para crear la nueva contraseña
  return (
    <div className="flex bg-black/70 h-screen items-center justify-center">
      <Card className="flex flex-col items-center w-[400px]">
        <CardHeader>
          <Image src="/logo.svg" alt="logo" width={100} height={100} />
          <h2 className="text-xl font-bold text-center">Crear nueva contraseña</h2>
          {userData && (
            <p className="text-sm text-center text-gray-500">
              Usuario: {userData.ivd_id}
            </p>
          )}
        </CardHeader>

        <CardContent className="w-full">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col items-center gap-y-4 w-full">
              {/* Mensajes de éxito o error */}
              {message && (
                <div 
                  className={`text-sm p-2 border rounded-md w-full ${
                    message.type === 'success' 
                      ? 'text-green-700 bg-green-50 border-green-200' 
                      : 'text-red-500 bg-red-50 border-red-200'
                  }`}
                >
                  {message.text}
                </div>
              )}

              {/* Campo para la nueva contraseña */}
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem className="w-full">
                    <FormLabel>Nueva contraseña</FormLabel>
                    <FormControl>
                      <Input 
                        type={showPassword ? "text" : "password"} 
                        placeholder="••••••••" 
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      Mínimo 8 caracteres, incluyendo al menos un número y una letra mayúscula
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Campo para confirmar la nueva contraseña */}
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem className="w-full">
                    <FormLabel>Confirmar contraseña</FormLabel>
                    <FormControl>
                      <Input 
                        type={showPassword ? "text" : "password"} 
                        placeholder="••••••••" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Opción para mostrar u ocultar la contraseña */}
              <div className="flex items-center space-x-2 w-full">
                <Checkbox 
                  id="showPassword" 
                  checked={showPassword}
                  onCheckedChange={() => setShowPassword(!showPassword)}
                />
                <label
                  htmlFor="showPassword"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Mostrar contraseña
                </label>
              </div>

              {/* Botón para enviar el formulario */}
              <Button 
                type="submit" 
                className="w-full mt-4" 
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Procesando...
                  </>
                ) : (
                  'Crear contraseña'
                )}
              </Button>

              {/* Enlace para volver al inicio de sesión */}
              <Button 
                variant="link" 
                type="button" 
                className="mt-2" 
                onClick={() => router.push('/')}
              >
                Volver al inicio de sesión
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
