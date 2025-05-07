'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
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
import { Loader2, Mail, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

const formSchema = z.object({
  username: z.string().min(6, {
    message: 'Tu Matricula debe tener al menos 6 caracteres.',
  }),
  password: z.string().optional(),
});

export default function Login() {
  const [showPassword, setShowPassword] = React.useState(false);
  const { login, isLoading, error, setupEmailSent, setupUserInfo, setupMessage, clearSetupState } = useAuth();
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: '',
      password: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      await login(values.username, values.password || '');
    } catch (err) {
      console.error('Login error:', err);
    }
  }

  // If setup email was sent to first-time user
  if (setupEmailSent && setupUserInfo) {
    return (
      <div className="flex bg-black/70 h-screen items-center justify-center">
        <Card className="flex flex-col items-center w-[450px]">
          <CardHeader>
            <Image src="/logo.svg" alt="logo" width={100} height={100} />
            <div className="flex items-center justify-center mb-2">
              <Mail className="w-12 h-12 text-blue-500" />
            </div>
            <h2 className="text-xl font-bold text-center">Revisa tu correo electrónico</h2>
          </CardHeader>
          
          <CardContent className="text-center">
            <p className="mb-4">
              Hemos enviado un enlace de configuración a <strong>{setupUserInfo.email}</strong>.
            </p>
            <p className="mb-6">
              {setupMessage || 'Por favor revisa tu correo electrónico para completar la configuración de tu cuenta.'}
            </p>
            <p className="text-sm text-gray-500 mb-6">
              El enlace expirará en 15 minutos. Si no recibes el correo, revisa tu carpeta de spam o solicita un nuevo enlace.
            </p>

            <div className="flex flex-col gap-3">
              <Button variant="outline" onClick={() => window.location.reload()}>
                Volver al inicio de sesión
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex bg-black/70 h-screen items-center justify-center">
      <Card className="flex flex-col items-center w-[400px]">
        <CardHeader>
          <Image src="/logo.svg" alt="logo" width={100} height={100} />
        </CardHeader>
        <CardContent className="w-full">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col items-center gap-y-8 w-full">
              {error && (
                <div className="text-red-500 text-sm p-2 bg-red-50 border border-red-200 rounded-md w-full flex items-start">
                  <AlertCircle className="h-4 w-4 mr-2 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}
              
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem className="w-full">
                    <FormLabel>Matricula</FormLabel>
                    <FormControl>
                      <Input placeholder="100128" {...field} />
                    </FormControl>
                    <FormDescription className="text-xs">
                      Ingresa tu Matricula
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
                      <Input {...field} type={showPassword ? 'text' : 'password'} />
                    </FormControl>
                    <FormDescription className="flex items-center space-x-2">
                      <Checkbox id="mostrar" onClick={() => setShowPassword(!showPassword)} />
                      <span
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        Mostrar Contraseña
                      </span>
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Iniciando sesión...
                  </>
                ) : (
                  'Iniciar Sesión'
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex flex-col w-full">
          <Button
            className="text-blue-500"
            variant="link"
            onClick={() => {
              router.push('/reset_password');
            }}
          >
            ¿Olvidaste tu contraseña?
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
