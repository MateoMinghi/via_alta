'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Image from 'next/image';

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

const formSchema = z.object({
  username: z.string().min(10, {
    message: 'Tu matrícula debe tener al menos 10 caracteres.',
  }),
  password: z.string().min(8, {
    message: 'Tu contraseña debe tener al menos 8 caracteres.',
  }),
});

export default function Login() {
  const [showPassword, setShowPassword] = React.useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: '',
      password: '',
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    // TODO: Handle form submission
    console.log(values); // Uncomment this line if you want to log the values
  }

  return (
    <div className="flex bg-black/70 h-screen items-center justify-center">
      <Card className="flex flex-col items-center">
        <CardHeader>
          <Image src="/logo.svg" alt="logo" width={100} height={100} />
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col items-center gap-y-8">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Matrícula</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
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
              <Button type="submit">Iniciar Sesión</Button>
              <Button
                variant="default"
                onClick={() => {
                  window.location.href = '/dashboard/';
                }}
              >
                INICIAR SESION COMO COORDINADOR
              </Button>
              <Button
                type="button"
                onClick={() => {
                  window.location.href = '/estudiante/';
                }}
              >
                INICIAR SESION COMO ESTUDIANTE
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter>
          <Button
            className="text-blue-500"
            variant="link"
            onClick={() => {
              window.location.href = '/reset_password';
            }}
          >
            ¿Olvidaste tu contraseña?
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
