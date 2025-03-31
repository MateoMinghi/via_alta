'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '../ui/button';
import CoordinadorSchedule from '../CoordinadorSchedule';
import { ResponseType } from "@/types/response";
import { toast } from 'sonner';
import { Save } from 'lucide-react';

interface Subject {
  id: number;
  title: string;
  professor: string;
  credits: number;
  salon: string;
  semester: number;
  hours: { day: string; time: string }[];
}

export default function HorariosSlug() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filteredSubjects, setFilteredSubjects] = useState<Subject[]>([]);
  const params = useParams();
  const { slug } = params;

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

  // Fetch and filter subjects for the specific semester
  const fetchSubjects = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/schedule');
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch schedule');
      }

      // Filter subjects for the current semester
      const subjectsForSemester = result.data
        .filter((item: any) => item.semester === semesterNum)
        .reduce((acc: Subject[], item: any) => {
          // Find if we already have this subject in our accumulator
          const existingSubject = acc.find(
            s => s.title === item.subject && s.professor === item.teacher
          );

          if (existingSubject) {
            // Add the new hour to existing subject
            existingSubject.hours.push({
              day: item.day,
              time: item.time
            });
            return acc;
          } else {
            // Create new subject entry
            acc.push({
              id: acc.length + 1, // Generate temporary ID
              title: item.subject,
              professor: item.teacher,
              salon: item.classroom,
              semester: item.semester,
              credits: 0, // Default value as it's not in the database
              hours: [{
                day: item.day,
                time: item.time
              }]
            });
            return acc;
          }
        }, []);

      setFilteredSubjects(subjectsForSemester);
      
      if (subjectsForSemester.length === 0) {
        toast.warning(`No hay materias disponibles para el semestre ${semesterNum}`);
      }
    } catch (err) {
      console.error('Error fetching subjects:', err);
      setError(err instanceof Error ? err.message : 'Error al cargar las materias');
      toast.error('Error al cargar las materias');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (semesterNum !== null) {
      fetchSubjects();
    }
  }, [semesterNum]);

  // Function to clear the current view but not delete actual data
  const handleClearView = () => {
    setFilteredSubjects([]);
    toast.success('Vista limpiada');
  };

  const handleSaveChanges = async () => {
    try {
      setLoading(true);
      
      // Convert Subject format back to GeneralScheduleItem format
      const scheduleItems = filteredSubjects.flatMap(subject => 
        subject.hours.map(hour => ({
          teacher: subject.professor,
          subject: subject.title,
          classroom: subject.salon,
          semester: subject.semester,
          day: hour.day,
          time: hour.time,
          endTime: (() => {
            const [h, m] = hour.time.split(':').map(Number);
            const date = new Date();
            date.setHours(h, m, 0, 0);
            date.setHours(date.getHours() + 1);
            return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
          })()
        }))
      );

      const response = await fetch('/api/schedule', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ schedule: scheduleItems }),
      });

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to save schedule');
      }

      toast.success('Horario guardado correctamente');
    } catch (err) {
      console.error('Error saving schedule:', err);
      toast.error('Error al guardar el horario');
    } finally {
      setLoading(false);
    }
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
        <Button 
          className="w-full bg-red-700 text-white hover:bg-red-800"
          onClick={handleSaveChanges}
          disabled={loading}
        >
          <Save className="mr-2 h-4 w-4" />
          {loading ? 'Guardando...' : 'Guardar'}
        </Button>
      </div>
    </div>
  );
}