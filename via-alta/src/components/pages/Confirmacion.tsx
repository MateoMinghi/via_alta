'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import EstudianteHeader from '@/components/EstudianteHeader';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useStudentDbStatus } from '@/api/useStudentDbStatus';
import { useStudentChangeRequest } from '@/api/useStudentChangeRequest';

export default function Confirmacion() {
  const router = useRouter();
  const { user } = useAuth();
  const { status, loading: statusLoading, error: statusError } = useStudentDbStatus(user?.ivd_id?.toString() || '');
  const { changes, date, loading: changesLoading, error: changesError } = useStudentChangeRequest(user?.ivd_id?.toString() || '');
  const isInscrito = status === 'inscrito';

  // Handle redirect after component renders - must be called at the top level
  useEffect(() => {
    if (status === 'no-inscrito' && !statusLoading) {
      router.push('/estudiante');
    }
  }, [status, statusLoading, router]);

  // Loading indicator or redirect for non-inscribed students
  if (statusLoading) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-8">
        <EstudianteHeader />
        <Card className="p-8 my-12 text-center">
          <div className="flex flex-col items-center justify-center gap-4">
            <Loader2 className="h-12 w-12 animate-spin text-red-700" />
            <h2 className="text-xl font-medium">Verificando estado de inscripción...</h2>
          </div>
        </Card>
        <Footer />
      </main>
    );
  }
  
  // Return loading state while redirecting to prevent flash of content
  if (status === 'no-inscrito') {
    return (
      <main className="mx-auto max-w-5xl px-4 py-8">
        <EstudianteHeader />
        <Card className="p-8 my-12 text-center">
          <div className="flex flex-col items-center justify-center gap-4">
            <Loader2 className="h-12 w-12 animate-spin text-red-700" />
            <h2 className="text-xl font-medium">Redirigiendo...</h2>
          </div>
        </Card>
        <Footer />
      </main>
    );
  }

  const ConfirmationCard = () => (
    <Card className="p-8 my-12 text-center border-green-500 border-2">
      <div className="flex justify-center mb-4">
        <CheckCircle2 className="h-24 w-24 text-green-500" />
      </div>
      
      <h1 className="text-green-600 text-4xl font-bold mb-4">
        ¡Horario Confirmado!
      </h1>
      
      <p className="text-green-600 text-2xl font-bold mb-8">
        Tu proceso de inscripción ha finalizado exitosamente
      </p>
      
      <div className="bg-green-50 p-4 rounded-md mb-8 text-left">
        <p className="mb-2"><span className="font-semibold">Estado:</span> Inscrito</p>
        <p className="mb-2"><span className="font-semibold">Matrícula:</span> {user?.ivd_id}</p>
        <p><span className="font-semibold">Nota:</span> Recibirás un correo electrónico con los detalles de tu inscripción.</p>
      </div>
      
      <div className="flex flex-col sm:flex-row justify-center gap-4">
        <Button 
          onClick={() => router.push('/estudiante')}
          className="bg-red-700 hover:bg-red-800 px-6 py-2"
        >
          Visualizar Horario
        </Button>
      </div>
    </Card>
  );

  const RequestCard = () => (
    <Card className="p-8 my-12 text-center border-yellow-500 border-2">
      <div className="flex justify-center mb-4">
        <AlertCircle className="h-24 w-24 text-yellow-500" />
      </div>
      
      <h1 className="text-yellow-600 text-4xl font-bold mb-4">
        ¡Solicitud Enviada!
      </h1>
      
      <p className="text-yellow-600 text-2xl font-bold mb-8">
        Tu solicitud de cambios ha sido registrada
      </p>
      
      <div className="bg-yellow-50 p-4 rounded-md mb-8 text-left">
        <p className="mb-2"><span className="font-semibold">Fecha de solicitud:</span> {date}</p>
        <p className="mb-2"><span className="font-semibold">Estado:</span> Cambios Solicitados</p>
        <p className="mb-2"><span className="font-semibold">Matrícula:</span> {user?.ivd_id}</p>
        <p className="mb-2"><span className="font-semibold">Motivo de la solicitud:</span></p>
        <p className="bg-white p-3 rounded border border-yellow-200 mb-2">{changes}</p>
        <p><span className="font-semibold">Nota:</span> El coordinador revisará tu solicitud y te contactará pronto.</p>
      </div>
      
      <div className="flex flex-col sm:flex-row justify-center gap-4">
        <Button 
          onClick={() => router.push('/estudiante')}
          className="bg-red-700 hover:bg-red-800 px-6 py-2"
        >
          Visualizar Horario
        </Button>
      </div>
    </Card>
  );

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <EstudianteHeader />
      {isInscrito ? <ConfirmationCard /> : <RequestCard />}
      <Footer />
    </main>
  );
}