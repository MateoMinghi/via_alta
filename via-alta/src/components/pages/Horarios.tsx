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
  const [isGeneratingSchedule, setIsGeneratingSchedule] = useState(false);

  const semesters: Semester[] = result ? Object.entries(
    result.reduce((acc: Record<string, number>, student: Student) => {
      acc[student.semestre] = (acc[student.semestre] || 0) + 1;
      return acc;
    }, {})  ).map(([id, numberStudents]) => ({ id, numberStudents: numberStudents as number })) : [];
  
  // Función para generar grupos
  const generateGroups = async () => {
    try {
      setIsGenerating(true);
      toast.info("Iniciando la generación de grupos para todos los profesores...");
      
      // Usar un ID de salón predeterminado
      // En una versión mejorada, esto podría ser seleccionado por el usuario
      const defaultSalonId = 101;
      
      // Usar el modo 'all-professors' que busca automáticamente todos los profesores válidos
      const response = await fetch('/api/generate-groups', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          mode: 'all-professors',
          idSalon: defaultSalonId,
          // idCiclo es opcional, si no se proporciona se usará el ciclo más reciente
        }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        const createdCount = data.createdGroups?.length || 0;
        
        if (createdCount > 0) {
          toast.success(`Se generaron ${createdCount} grupos exitosamente`);
        } else {
          toast.info("No se crearon nuevos grupos");
        }
        
        if (data.errors && data.errors.length > 0) {
          const errorCount = data.errors.length;
          toast.warning(`${errorCount} grupos no pudieron ser creados. Revise que los profesores tengan clases asignadas.`);
          
          // Loguear detalles de errores para depuración
          console.warn("Errores al generar grupos:", data.errors);
        }
      } else {
        toast.error(`Error: ${data.error || 'No se pudieron generar los grupos'}`);
      }
    } catch (error) {
      console.error("Error en la generación de grupos:", error);
      toast.error(`Error: ${error instanceof Error ? error.message : 'No se pudieron generar los grupos'}`);
    } finally {
      setIsGenerating(false);
    }
  };

  // Función para generar horario general
  const generateGeneralSchedule = async () => {
    try {
      setIsGeneratingSchedule(true);
      toast.info("Iniciando la generación del horario general...");
      
      const response = await fetch('/api/schedule', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          // idCiclo es opcional, si no se proporciona se usará el ciclo más reciente
        }),
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        toast.success('Horario general generado exitosamente');
      } else {
        toast.error(`Error: ${data.error || 'No se pudo generar el horario general'}`);
      }
    } catch (error) {
      console.error("Error en la generación del horario general:", error);
      toast.error(`Error: ${error instanceof Error ? error.message : 'No se pudo generar el horario general'}`);
    } finally {
      setIsGeneratingSchedule(false);
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
              className="bg-green-600 hover:bg-green-700 text-white mr-4"
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

            <Button 
              onClick={generateGeneralSchedule} 
              disabled={isGeneratingSchedule} 
              size="lg"
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isGeneratingSchedule ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generando horario general...
                </>
              ) : (
                'Generar Horario General'
              )}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}