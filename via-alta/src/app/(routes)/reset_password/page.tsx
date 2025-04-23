'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardFooter,
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

const formSchema = z.object({
  ivd_id: z.string().min(6, {
    message: 'ID de usuario debe tener al menos 6 caracteres.',
  }),
  email: z.string().email({
    message: 'Ingresa un correo electrónico válido.',
  }),
});

export default function ResetPassword() {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      ivd_id: '',
      email: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setMessage(null);

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ivd_id: values.ivd_id,
          email: values.email,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Ocurrió un error al procesar tu solicitud');
      }

      setMessage({
        text: 'Se ha enviado un correo con instrucciones para restablecer tu contraseña.',
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

  return (
    <div className="flex bg-black/70 h-screen items-center justify-center">
      <Card className="flex flex-col items-center w-[400px]">
        <CardHeader>
          <Image src="/logo.svg" alt="logo" width={100} height={100} />
          <h2 className="text-xl font-bold text-center">Restablecer Contraseña</h2>
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
                name="ivd_id"
                render={({ field }) => (
                  <FormItem className="w-full">
                    <FormLabel>ID de usuario</FormLabel>
                    <FormControl>
                      <Input placeholder="100128" {...field} />
                    </FormControl>
                    <FormDescription>
                      Ingresa tu ID de usuario (ivd_id)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

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
                      Ingresa el correo electrónico asociado con tu cuenta
                    </FormDescription>
                    <FormMessage />
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
                  'Restablecer contraseña'
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