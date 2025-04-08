'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Card,
  CardContent,
  CardHeader,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

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

type CreatePasswordFormProps = {
  token: string;
};

// Client component with the form logic
export function CreatePasswordClient({ token }: CreatePasswordFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [tokenValid, setTokenValid] = useState(false);
  const [userData, setUserData] = useState<{ ivd_id: string } | null>(null);
  const router = useRouter();
  
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
        setVerifying(false);
      }
    }

    verifyToken();
  }, [token]);

  const form = useForm<z.infer<typeof passwordSchema>>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  async function onSubmit(values: z.infer<typeof passwordSchema>) {
    setIsLoading(true);
    setMessage(null);

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

      setMessage({
        text: 'Contraseña creada exitosamente. Redirigiendo al inicio de sesión...',
        type: 'success',
      });

      // Reset form after successful submission
      form.reset();
      
      // Redirect to login page after 3 seconds
      setTimeout(() => {
        router.push('/');
      }, 3000);
    } catch (error) {
      setMessage({
        text: error instanceof Error ? error.message : 'Ocurrió un error inesperado',
        type: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  }

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