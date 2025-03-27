'use client';

import EstudianteHeader from '@/components/EstudianteHeader';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CheckCircle2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import React from 'react';

export default function Confirm() {
  const router = useRouter();
  const currentDate = new Date().toLocaleDateString();
  
  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <EstudianteHeader/>
      
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
          <p className="mb-2"><span className="font-semibold">Fecha de confirmación:</span> {currentDate}</p>
          <p className="mb-2"><span className="font-semibold">Estado:</span> Inscrito</p>
          <p className="mb-2"><span className="font-semibold">Matrícula:</span> #12345</p>
          <p><span className="font-semibold">Nota:</span> Recibirás un correo electrónico con los detalles de tu inscripción.</p>
        </div>
        
        <Button 
          onClick={() => router.push('/estudiante')}
          className="bg-red-700 hover:bg-red-800 px-6 py-2"
        >
          Volver al Inicio
        </Button>
      </Card>
      
      <Footer/>
    </main>
  );
}
