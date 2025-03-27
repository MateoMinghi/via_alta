'use client';

import React, { useState } from 'react';
import { Button } from '../ui/button';
import StudentSchedule from '../EstudianteSchedule';
import { useGetSubjects } from '@/api/getSubjects';
import { ResponseType } from "@/types/response";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

export default function Estudiante() {
  const { result, loading }: ResponseType = useGetSubjects();
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const router = useRouter();
  
  const handleConfirmSchedule = () => {
    // Solo mostrar mensaje de confirmación sin lógica de base de datos
    toast.success('Horario confirmado correctamente');
    router.push('/estudiante/confirmacion');
  };

  return (
    <div className="p-4">
      {loading && <p>Cargando...</p>}
      {result !== null && (
        <>      
          <div className="bg-white p-4 rounded-md mb-6 border border-gray-200">
            <h1 className="text-2xl font-bold text-red-700 mb-2">Propuesta de Horario</h1>
            <p className="text-gray-700">
              A continuación se muestra el horario propuesto para el próximo semestre.
              Por favor, revísalo cuidadosamente y confírmalo si estás de acuerdo.
              Si requieres cambios, utiliza la opción "Solicitar Cambios".
            </p>
          </div>
          
          <StudentSchedule subjects={result} />
          
          <div className="flex flex-col sm:flex-row justify-between gap-8 py-8">
            <Button 
              className="w-full font-bold bg-red-700 hover:bg-red-800"
              onClick={() => setIsConfirmDialogOpen(true)}
            >
              Confirmar Horario
            </Button>
            
            <Button 
              className="w-full border-2 border-red-700 text-red-700 hover:bg-red-50 font-bold" 
              variant="outline"
            >
              Solicitar Cambios
            </Button>
          </div>
          
          <Dialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Confirmación de Horario</DialogTitle>
                <DialogDescription>
                  ¿Estás seguro que deseas confirmar este horario? Una vez confirmado, no podrás realizar cambios sin la autorización del coordinador.
                </DialogDescription>
              </DialogHeader>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsConfirmDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button 
                  className="bg-red-700 hover:bg-red-800"
                  onClick={handleConfirmSchedule}
                >
                  Confirmar
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  );
}
