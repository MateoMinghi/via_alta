'use client';

// Importaciones
import React, { useState } from 'react';
import SemesterGrid from '@/components/SemesterGrid';
import { useGetStudents } from '@/api/useGetStudents';
import { ResponseType } from "@/types/response";
import { Button } from '@/components/ui/button';
import { Calendar, ChevronRight, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

// Interfaces
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

// Componente principal
export default function HorariosSlug() {
  const { result, loading }: ResponseType = useGetStudents();
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingSchedule, setIsGeneratingSchedule] = useState(false);
  const router = useRouter();

  // Procesar semestres
  const semesters: Semester[] = result
    ? Object.entries(
        result.reduce((acc: Record<string, number>, student: Student) => {
          acc[student.semestre] = (acc[student.semestre] || 0) + 1;
          return acc;
        }, {})
      ).map(([id, numberStudents]) => ({ id, numberStudents: numberStudents as number }))
    : [];

  // Función para generar grupos
  const generateGroups = async () => {
    try {
      setIsGenerating(true);
      toast.info("Iniciando la generación de grupos para todos los profesores...");

      const defaultSalonId = 101; // ID de salón predeterminado

      const response = await fetch('/api/generate-groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'all-professors', idSalon: defaultSalonId }),
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
          toast.warning(`${data.errors.length} grupos no pudieron ser creados. Revise que los profesores tengan clases asignadas.`);
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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
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

  // Retorno del componente
  return (
    <div className="text-start max-w-7xl mx-auto py-8 flex flex-col gap-8">
      {/* Sección de introducción */}
      <div>
        <h2 className="font-bold text-3xl mb-4">Horarios</h2>
        <div className="p-4 bg-white rounded-lg gap-8">
          <p className="text-gray-600">
            En este panel de horarios puedes ver y organizar todas las clases de la escuela. Aquí puedes revisar el horario general, crear grupos, generar horarios por semestre y atender solicitudes de cambio. Es tu centro de control para asegurar que todos los estudiantes y maestros tengan el horario adecuado.
          </p>
        </div>
      </div>

      {/* Botón para ver horario general */}
      <div>
        <Button
          className="text-xl text-white rounded-xl px-8 flex items-center h-full w-full mb-8"
          onClick={() => router.push("/dashboard/horarios/horario-general")}
        >
          <span className="flex items-center gap-3">
            <Calendar />
            Ver Horario General
            <ChevronRight />
          </span>
        </Button>      
        {/* Cargando o mostrando horarios semestrales */}
          {loading && <p>cargando...</p>}
          {result !== null && (
            <SemesterGrid semesters={semesters} /> 
          )}
      </div> 
    </div>
  );
}
