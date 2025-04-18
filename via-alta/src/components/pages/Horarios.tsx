'use client';

//importaciones

import React, { useState } from 'react';
import SemesterGrid from '../SemesterGrid';
import StudentSearch from '../StudentSearch';
import { useGetStudents } from '@/api/useGetStudents';
import { ResponseType } from "@/types/response";
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';


//interfaces
interface Student {
  id: string;
  name: string;
  semestre: string;
  regular: boolean;
}

interface Semester {
  id: string;
  numberStudents: number;
}

//componente
export default function HorariosSlug() {
  const { result, loading }: ResponseType = useGetStudents();
  const [isGenerating, setIsGenerating] = useState(false);

  const semesters: Semester[] = result ? Object.entries(
    result.reduce((acc: Record<string, number>, student: Student) => {
      acc[student.semestre] = (acc[student.semestre] || 0) + 1;
      return acc;
    }, {})
  ).map(([id, numberStudents]) => ({ id, numberStudents: numberStudents as number })) : [];
    // Función para generar grupos
  const generateGroups = async () => {
    try {
      setIsGenerating(true);
      toast.info("Iniciando la generación de grupos...");
      
      // Solo enviamos los parámetros requeridos (idProfesor, idSalon)
      // El idMateria se determinará a partir de las clases del profesor
      // El idCiclo se configurará automáticamente con el ciclo más reciente
      const paramsList = [
        {
          idProfesor: "PROF001",
          idSalon: 101
        },
        {
          idProfesor: "PROF002",
          idSalon: 102
        }
      ];
      
      const response = await fetch('/api/generate-groups', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ paramsList }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        toast.success(`Grupos generados exitosamente: ${data.createdGroups.length} grupos creados`);
        
        if (data.errors.length > 0) {
          toast.warning(`${data.errors.length} grupos no pudieron ser creados`);
        }
      } else {
        toast.error(`Error: ${data.error || 'No se pudieron generar los grupos'}`);
      }
    } catch (error) {
      toast.error(`Error: ${error instanceof Error ? error.message : 'No se pudieron generar los grupos'}`);
    } finally {
      setIsGenerating(false);
    }
  };
  //retorno
  return (
    <div className="text-center">
      {loading && <p>cargando...</p>}
      {result !== null && (
        <>
          <p className="font-bold text-2xl">Horarios de Alumnos Irregulares:</p>
          <StudentSearch students={result} />

          <p className="font-bold text-2xl">Horarios Generales:</p>
          <SemesterGrid semesters={semesters} />

          <div className="mt-8 mb-4">
            <Button 
              onClick={generateGroups} 
              disabled={isGenerating} 
              size="lg"
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generando grupos...
                </>
              ) : (
                'Generar Grupos'
              )}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}