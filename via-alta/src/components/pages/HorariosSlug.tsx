'use client';

import React, { useEffect, useState } from 'react';
import { Save } from 'lucide-react';
import { useParams } from 'next/navigation';
import { Button } from '../ui/button';
import CoordinadorSchedule from '../CoordinadorSchedule';
import { useGetSubjects } from '@/api/useGetSubjects';
import { ResponseType } from "@/types/response";

export default function HorariosSlug() {
  const { result, loading }: ResponseType = useGetSubjects();
  const params = useParams();
  const { slug } = params;
  const [filteredSubjects, setFilteredSubjects] = useState<any[]>([]);
  
  // Parse slug to extract the semester number
  // Handle formats like "semestre-1" or "1"
  const getSemesterNumber = (slugStr: string) => {
    if (!slugStr) return NaN;
    
    // If slug is in format "semestre-X"
    if (slugStr.includes('-')) {
      const parts = slugStr.split('-');
      return parseInt(parts[parts.length - 1], 10);
    }
    
    // If slug is just a number
    return parseInt(slugStr, 10);
  };
  
  const semesterNum = getSemesterNumber(slug as string);

  // For debugging
  useEffect(() => {
    console.log("Slug:", slug);
    console.log("Parsed semester number:", semesterNum);
    console.log("Available subjects:", result);
  }, [slug, semesterNum, result]);

  // Filter subjects based on semester when result is loaded
  useEffect(() => {
    if (result && Array.isArray(result)) {
      const filtered = result.filter(subject => subject.semester === semesterNum);
      console.log("Filtered subjects:", filtered); // For debugging
      setFilteredSubjects(filtered);
    }
  }, [result, semesterNum]);

  return (
    <div className="p-4">
      <p className="text-3xl font-bold mb-4">
        Horario propuesto a Semestre {semesterNum}
      </p>
      {loading && <p>cargando...</p>}
      {filteredSubjects.length > 0 ? (
        <CoordinadorSchedule subjects={filteredSubjects} />
      ) : !loading && (
        <p className="text-center py-4">No hay materias disponibles para el semestre {semesterNum}</p>
      )}
      <div className="flex justify-between mt-8 gap-4 text-white">
        <Button variant="outline" className="w-full bg-red-700 text-white">
          Limpiar
        </Button>
        <Button className="w-full">
          <Save />
          Guardar
        </Button>
      </div>
    </div>
  );
}
