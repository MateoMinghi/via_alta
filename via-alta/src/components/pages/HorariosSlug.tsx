'use client';

import React, { useEffect, useState } from 'react';
import { Save } from 'lucide-react';
import { useParams } from 'next/navigation';
import { Button } from '../ui/button';
import CoordinadorSchedule from '../CoordinadorSchedule';
import { useGetSubjects } from '@/api/useGetSubjects';
import { ResponseType } from "@/types/response";
import { toast } from 'sonner';

export default function HorariosSlug() {
  const { result, loading, error }: ResponseType = useGetSubjects();
  const params = useParams();
  const { slug } = params;
  const [filteredSubjects, setFilteredSubjects] = useState<any[]>([]);
  
  // Parse slug to extract the semester number
  const getSemesterNumber = (slugStr: string) => {
    if (!slugStr) return null;
    
    // If slug is in format "semestre-X"
    if (slugStr.includes('-')) {
      const parts = slugStr.split('-');
      return parseInt(parts[parts.length - 1], 10);
    }
    
    // If slug is just a number
    const num = parseInt(slugStr, 10);
    return isNaN(num) ? null : num;
  };
  
  const semesterNum = getSemesterNumber(slug as string);

  useEffect(() => {
    if (error) {
      toast.error(error);
      return;
    }

    if (result && Array.isArray(result) && semesterNum !== null) {
      // Log the data to help debug
      console.log(`Found ${result.length} total subjects`);
      console.log(`Looking for semester ${semesterNum}`);
      
      const filtered = result.filter(subject => {
        // Ensure proper comparison (convert to number if needed)
        const subjectSemester = typeof subject.semester === 'string' 
          ? parseInt(subject.semester, 10) 
          : subject.semester;
        
        return subjectSemester === semesterNum;
      });
      
      console.log(`Filtered to ${filtered.length} subjects for semester ${semesterNum}`);
      setFilteredSubjects(filtered);

      if (filtered.length === 0 && !loading) {
        toast.warning(`No hay materias disponibles para el semestre ${semesterNum}`);
      }
    }
  }, [result, semesterNum, loading, error]);

  // Function to clear the current view but not delete actual data
  const handleClearView = () => {
    setFilteredSubjects([]);
    toast.success('Vista limpiada');
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

  if (semesterNum === null) {
    return (
      <div className="p-4">
        <p className="text-center text-red-600">Semestre no válido</p>
      </div>
    );
  }

  return (
    <div className="p-4">
      <p className="text-3xl font-bold mb-4">
        Horario del Semestre {semesterNum}
      </p>
      {filteredSubjects.length > 0 ? (
        <CoordinadorSchedule subjects={filteredSubjects} />
      ) : (
        <p className="text-center py-4">No hay materias disponibles para el semestre {semesterNum}</p>
      )}
      <div className="flex justify-between mt-8 gap-4">
        <Button 
          variant="outline" 
          className="w-full border-red-700 text-red-700 hover:bg-red-50"
          onClick={handleClearView}
        >
          Limpiar Vista
        </Button>
      </div>
    </div>
  );
}
