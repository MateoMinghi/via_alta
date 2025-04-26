'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

import { GeneralScheduleItem } from '@/lib/models/general-schedule';
import { toast } from 'sonner';
import HorarioSemestre from '../HorarioSemestre';
import HorarioAlumno from '../HorarioAlumno';
import HorarioAlumnoModificado from '../HorarioAlumnoModificado';

export default function HorariosSlug() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filteredSchedule, setFilteredSchedule] = useState<GeneralScheduleItem[]>([]);
  const params = useParams();
  const { slug } = params;
  
  // Determine if this is a semester view or a student view
  const viewType = typeof slug === 'string' && slug.includes('-') ? 'semestre' : 'estudiante';

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

  // Helper to map raw API data to GeneralScheduleItem
  const mapRawScheduleItem = (raw: any): GeneralScheduleItem => ({
    IdHorarioGeneral: raw.IdHorarioGeneral ?? raw.idhorariogeneral,
    NombreCarrera: raw.NombreCarrera ?? raw.nombrecarrera,
    IdGrupo: raw.IdGrupo ?? raw.idgrupo,
    Dia: raw.Dia ?? raw.dia,
    HoraInicio: (raw.HoraInicio ?? raw.horainicio ?? '').slice(0,5),
    HoraFin: (raw.HoraFin ?? raw.horafin ?? '').slice(0,5),
    Semestre: raw.Semestre ?? raw.semestre,
    MateriaNombre: raw.MateriaNombre ?? raw.materianombre,
    ProfesorNombre: raw.ProfesorNombre ?? raw.profesornombre,
  });

  // Fetch and filter schedule items for the specific semester
  const fetchSchedule = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/schedule');
      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch schedule');
      }
      // Map and filter schedule items for the current semester
      const mapped = result.data.map(mapRawScheduleItem);
      const scheduleForSemester = mapped.filter((item: GeneralScheduleItem) => {
        const itemSemester = item.Semestre ?? null;
        return itemSemester === semesterNum;
      });
      console.log('Filtered schedule for semester', semesterNum, scheduleForSemester); // DEBUG
      setFilteredSchedule(scheduleForSemester);
      if (scheduleForSemester.length === 0) {
        toast.warning(`No hay materias disponibles para el semestre ${semesterNum}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar el horario');
      toast.error('Error al cargar el horario');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (semesterNum !== null) {
      fetchSchedule();
    }
  }, [semesterNum]);

  // Function to clear the current view but not delete actual data
  const handleClearView = () => {
    setFilteredSchedule([]);
    toast.success('Vista limpiada');
  };

  const handleSaveChanges = async () => {
    try {
      setLoading(true);
      // No transformation needed, send filteredSchedule directly
      const response = await fetch('/api/schedule', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ schedule: filteredSchedule }),
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
      {viewType === 'semestre' ? (
        <HorarioSemestre
          schedule={filteredSchedule}
          semesterNum={semesterNum}
        />
      ) : (
        <HorarioAlumno
          schedule={filteredSchedule}
          alumnoId={slug as string}
        />
      
      )}
    </div>
  );
}