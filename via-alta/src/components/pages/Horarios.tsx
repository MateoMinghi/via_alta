'use client';

// Importaciones
import React from 'react';
import SemesterGrid from '@/components/SemesterGrid';
import { useGetStudents } from '@/api/useGetStudents';
import { ResponseType } from "@/types/response";
import { Button } from '@/components/ui/button';
import { Calendar, ChevronRight } from 'lucide-react';
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

  // Retorno del componente
  return (
    <div className="text-start px-16  mx-auto py-8 flex flex-col gap-8">
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
