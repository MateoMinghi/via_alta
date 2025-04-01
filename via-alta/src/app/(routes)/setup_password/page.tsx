'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Card,
  CardContent,
  CardHeader,
  CardFooter,
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
    email: z.string().email({
      message: 'Ingresa un correo electrónico válido.'
    }),
    password: z.string().min(8, {
      message: 'La contraseña debe tener al menos 8 caracteres.',
    }).regex(/[0-9]/, {
      message: 'La contraseña debe incluir al menos un número.',
    }).regex(/[A-Z]/, {
      message: 'La contraseña debe incluir al menos una letra mayúscula.',
    }),
    confirmPassword: z.string(),
    acceptTerms: z.boolean().refine(val => val === true, {
      message: 'Debes aceptar los términos y condiciones para continuar.'
    })
  })
  .refine(data => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  });

export default function SetupPassword() {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const ivdId = searchParams.get('ivd_id');
  const userName = searchParams.get('name');

  // Redirect if no ivd_id provided
  useEffect(() => {
    if (!ivdId) {
      router.push('/');
    }
  }, [ivdId, router]);

  const form = useForm<z.infer<typeof passwordSchema>>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
      acceptTerms: false
    },
  });

  async function onSubmit(values: z.infer<typeof passwordSchema>) {
    if (!ivdId) {
      setMessage({
        text: 'ID de usuario no proporcionado',
        type: 'error'
      });
      return;
    }

    setIsLoading(true);
    setMessage(null);

    try {
      const response = await fetch('/api/auth/setup-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ivdId,
          email: values.email,
          password: values.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Ocurrió un error al configurar tu contraseña');
      }

      setMessage({
        text: 'Contraseña configurada exitosamente. Redirigiendo al inicio de sesión...',
        type: 'success',
      });

      // Reset form after successful submission
      form.reset();
      
      // Redirect to login page after 2 seconds
      setTimeout(() => {
        router.push('/');
      }, 2000);
    } catch (error) {
      setMessage({
        text: error instanceof Error ? error.message : 'Ocurrió un error inesperado',
        type: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  }

  if (!ivdId) {
    return null; // Will redirect via useEffect
  }

  return (
    <div className="flex bg-black/70 h-screen items-center justify-center">
      <Card className="flex flex-col items-center w-[450px]">
        <CardHeader>
          <Image src="/logo.svg" alt="logo" width={100} height={100} />
          <h2 className="text-xl font-bold text-center">Configura tu contraseña</h2>
          {userName && (
            <p className="text-sm text-center text-gray-500">
              Bienvenido(a), {userName}
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
                name="email"
                render={({ field }) => (
                  <FormItem className="w-full">
                    <FormLabel>Correo electrónico</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="tu@correo.com" {...field} />
                    </FormControl>
                    <FormDescription>
                      Ingresa tu correo electrónico registrado
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem className="w-full">
                    <FormLabel>Contraseña</FormLabel>
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

              <FormField
                control={form.control}
                name="acceptTerms"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 w-full mt-4">
                    <FormControl>
                      <Checkbox 
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>
                        Acepto los términos y condiciones de uso
                      </FormLabel>
                      <FormDescription>
                        Al crear una contraseña, aceptas nuestros términos y políticas de privacidad.
                      </FormDescription>
                      <FormMessage />
                    </div>
                  </FormItem>
                )}
              />

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
            </form>
          </Form>
        </CardContent>
        <CardFooter>
          <Button 
            variant="link" 
            type="button" 
            className="mt-2" 
            onClick={() => router.push('/')}
          >
            Volver al inicio de sesión
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}