'use client';

import React, { useState } from 'react';
import SemesterGrid from '../SemesterGrid';
import StudentSearch from '../StudentSearch';
import { useGetStudents } from '@/api/useGetStudents';
import { ResponseType } from "@/types/response";
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

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

export default function HorariosSlug() {
  const { result, loading }: ResponseType = useGetStudents();
  const [isGenerating, setIsGenerating] = useState(false);

  const semesters: Semester[] = result
    ? Object.entries(
        result.reduce((acc: Record<string, number>, student: Student) => {
          acc[student.semestre] = (acc[student.semestre] || 0) + 1;
          return acc;
        }, {})
      ).map(([id, numberStudents]) => ({ id, numberStudents: numberStudents as number }))
    : [];

  // Función para generar el horario general sin usar un salón predeterminado,
  // ya que each group uses its own IdSalon.
  const generateScheduleHandler = async () => {
    try {
      setIsGenerating(true);
      toast.info("Iniciando la generación del horario general...");
      
      // Simply trigger the schedule generation API.
      const response = await fetch('/api/schedule', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        // Send an empty payload or other necessary parameters
        body: JSON.stringify({}),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        toast.success("Horario general generado correctamente");
      } else {
        toast.error(`Error: ${data.error || 'No se pudo generar el horario'}`);
      }
    } catch (error) {
      console.error("Error en la generación del horario:", error);
      toast.error(`Error: ${error instanceof Error ? error.message : 'No se pudo generar el horario'}`);
    } finally {
      setIsGenerating(false);
    }
  };

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
              onClick={generateScheduleHandler} 
              disabled={isGenerating} 
              size="lg"
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generando Horario...
                </>
              ) : (
                'Generar Horario'
              )}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}