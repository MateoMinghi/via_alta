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

// Interface for degree data
interface Degree {
  id: number;
  name: string;
  status: string;
}

// Extended schema with degrees for coordinators
const passwordSchemaWithDegrees = z
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
    }),
    selectedDegrees: z.array(z.number()).refine(val => val.length > 0, {
      message: 'Debes seleccionar al menos una carrera.'
    })
  })
  .refine(data => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  });

// Regular schema without degrees for non-coordinators
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
  const [isCoordinator, setIsCoordinator] = useState(false);
  const [degrees, setDegrees] = useState<Degree[]>([]);
  const [loadingDegrees, setLoadingDegrees] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const ivdId = searchParams.get('ivd_id');
  const userName = searchParams.get('name');
  const userType = searchParams.get('type');

  // Log all search parameters for debugging
  useEffect(() => {
    const params: Record<string, string> = {};
    searchParams.forEach((value, key) => {
      params[key] = value;
    });
    setDebugInfo(JSON.stringify(params));

    // For testing purposes, you can force the coordinator role
    // Remove this in production or when fixed
    const forceCoordinator = true; // Set to true to force coordinator UI
    
    if (userType === 'coordinator' || forceCoordinator) {
      setIsCoordinator(true);
      fetchDegrees();
    }
  }, [userType, searchParams]);

  // Fetch degrees from API if the user is a coordinator
  const fetchDegrees = async () => {
    setLoadingDegrees(true);
    try {
      // For testing, simulate a response from the API
      // Comment this out and uncomment the fetch call for production use
      /*
      const mockDegrees = [
        {
          id: 8,
          name: "Diseño y Arquitectura de Interiores",
          status: "active"
        },
        {
          id: 9,
          name: "Ingenieria en Sistemas",
          status: "active"
        },
        {
          id: 7,
          name: "Diseño de la Moda e Industria del Vestido",
          status: "active"
        }
      ];
      setDegrees(mockDegrees);
      */
      
      // Real API fetch
      const response = await fetch('/api/getDegrees');
      const data = await response.json();
      
      if (data.status === 'success' && data.degrees) {
        setDegrees(data.degrees);
      } else {
        throw new Error(data.error || 'Error al cargar las carreras');
      }
    } catch (error) {
      console.error('Error fetching degrees:', error);
      setMessage({
        text: error instanceof Error ? error.message : 'Error al cargar las carreras',
        type: 'error'
      });
    } finally {
      setLoadingDegrees(false);
    }
  };

  // Redirect if no ivd_id provided
  useEffect(() => {
    if (!ivdId) {
      router.push('/');
    }
  }, [ivdId, router]);

  // Use different form schema based on user type
  const formSchema = isCoordinator ? passwordSchemaWithDegrees : passwordSchema;
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
      acceptTerms: false,
      ...(isCoordinator && { selectedDegrees: [] })
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema> & { selectedDegrees?: number[] }) {
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
      // Prepare the request body
      const requestBody: Record<string, any> = {
        ivdId,
        email: values.email,
        password: values.password,
      };

      // Add selected degrees if the user is a coordinator
      if (isCoordinator && values.selectedDegrees) {
        requestBody.selectedDegrees = values.selectedDegrees.map(degreeId => {
          const degree = degrees.find(d => d.id === degreeId);
          return {
            id: degreeId,
            name: degree ? degree.name : 'Unknown Degree'
          };
        });
      }

      const response = await fetch('/api/auth/setup-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
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
      <Card className="flex flex-col items-center w-[450px] max-h-[90vh] overflow-y-auto">
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

              {isCoordinator && (
                <FormField
                  control={form.control}
                  name="selectedDegrees"
                  render={() => (
                    <FormItem className="w-full">
                      <div className="mb-4">
                        <FormLabel className="text-base">Selecciona las carreras que coordinas</FormLabel>
                        <FormDescription>
                          Estas son las carreras para las que tienes permisos como coordinador
                        </FormDescription>
                      </div>
                      
                      {loadingDegrees ? (
                        <div className="flex items-center justify-center p-4">
                          <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
                          <span className="ml-2 text-gray-500">Cargando carreras...</span>
                        </div>
                      ) : degrees.length > 0 ? (
                        <div className="space-y-2">
                          {degrees.map((degree) => (
                            <FormField
                              key={degree.id}
                              control={form.control}
                              name="selectedDegrees"
                              render={({ field }) => {
                                return (
                                  <FormItem
                                    key={degree.id}
                                    className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4"
                                  >
                                    <FormControl>
                                      <Checkbox
                                        checked={field.value?.includes(degree.id)}
                                        onCheckedChange={(checked) => {
                                          const currentValue = field.value || [];
                                          return checked
                                            ? field.onChange([...currentValue, degree.id])
                                            : field.onChange(
                                                currentValue.filter(
                                                  (value) => value !== degree.id
                                                )
                                              );
                                        }}
                                      />
                                    </FormControl>
                                    <div className="space-y-1 leading-none">
                                      <FormLabel className="text-sm font-semibold">
                                        {degree.name}
                                      </FormLabel>
                                    </div>
                                  </FormItem>
                                );
                              }}
                            />
                          ))}
                        </div>
                      ) : (
                        <div className="text-sm text-gray-500 p-4 border rounded-md">
                          No se encontraron carreras disponibles
                        </div>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

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