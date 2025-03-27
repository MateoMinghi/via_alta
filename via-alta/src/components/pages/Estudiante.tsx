'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { useGetSubjects } from '@/api/getSubjects';
import { ResponseType } from "@/types/response";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import CoordinadorSchedule from '../CoordinadorSchedule';

export default function Estudiante() {
  const { result, loading, error }: ResponseType = useGetSubjects();
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [filteredSubjects, setFilteredSubjects] = useState<any[]>([]);
  const router = useRouter();
  
  // En un entorno real, obtendríamos estos datos del perfil del estudiante
  const mockEstudiante = {
    id: "00001",
    nombre: "Juan Pérez",
    semestre: 3, // Este semestre determinará qué materias se muestran
    regular: true
  };
  
  // Filtra las materias basadas en el semestre del estudiante
  useEffect(() => {
    if (error) {
      toast.error(error);
      return;
    }

    if (result && Array.isArray(result)) {
      const filtered = result.filter(subject => {
        const subjectSemester = typeof subject.semester === 'string' 
          ? parseInt(subject.semester, 10) 
          : subject.semester;
        
        return subjectSemester === mockEstudiante.semestre;
      });
      
      setFilteredSubjects(filtered);
      
      if (filtered.length === 0 && !loading) {
        toast.warning(`No hay materias disponibles para tu semestre (${mockEstudiante.semestre})`);
      }
    }
  }, [result, loading, error]);
  
  const handleConfirmSchedule = () => {
    // Solo mostrar mensaje de confirmación sin lógica de base de datos
    toast.success('Horario confirmado correctamente');
    router.push('/estudiante/confirmacion');
  };

  if (loading) {
    return (
      <div className="p-4">
        <p className="text-center">Cargando materias...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <p className="text-center text-red-600">Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="bg-white p-4 rounded-md mb-6 border border-gray-200">
        <h1 className="text-2xl font-bold text-red-700 mb-2">Propuesta de Horario</h1>
        <p className="text-gray-700">
          Estudiante: <span className="font-semibold">{mockEstudiante.nombre}</span> | 
          Semestre: <span className="font-semibold">{mockEstudiante.semestre}</span>
        </p>
        <p className="text-gray-700 mt-2">
          A continuación se muestra el horario propuesto para tu semestre.
          Por favor, revísalo cuidadosamente y confírmalo si estás de acuerdo.
          Si requieres cambios, utiliza la opción "Solicitar Cambios".
        </p>
      </div>
      
      {filteredSubjects.length > 0 ? (
        <CoordinadorSchedule subjects={filteredSubjects} />
      ) : (
        <p className="text-center py-4 bg-gray-50 rounded-md">
          No hay materias disponibles para tu semestre. Contacta al coordinador académico.
        </p>
      )}
      
      <div className="flex flex-col sm:flex-row justify-between gap-8 py-8">
        <Button 
          className="w-full font-bold bg-red-700 hover:bg-red-800"
          onClick={() => setIsConfirmDialogOpen(true)}
          disabled={filteredSubjects.length === 0}
        >
          Confirmar Horario
        </Button>
        
        <Button 
          className="w-full border-2 border-red-700 text-red-700 hover:bg-red-50 font-bold" 
          variant="outline"
          disabled={filteredSubjects.length === 0}
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
    </div>
  );
}
