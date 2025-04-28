'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

import { GeneralScheduleItem } from '@/lib/models/general-schedule';
import { toast } from 'sonner';
import HorarioSemestre from '../HorarioSemestre';
import HorarioAlumno from '../HorarioAlumno';
import HorarioAlumnoModificado from '../HorarioAlumnoModificado';
import { useGetStudentSchedule, ScheduleItem } from '@/api/useGetStudentSchedule';

interface HorariosSlugProps {
  slug?: string;
}

export default function HorariosSlug({ slug: propSlug }: HorariosSlugProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filteredSchedule, setFilteredSchedule] = useState<GeneralScheduleItem[]>([]);
  const [isIrregular, setIsIrregular] = useState<boolean>(false);
  const params = useParams();
  const urlSlug = params?.slug as string | undefined;
  
  // Usar slug de la URL si no se proporciona uno
  const slug = propSlug || urlSlug;
  
  //Determinar el tipo de vista basado en el slug
  const viewType = typeof slug === 'string' && slug.includes('-') ? 'semestre' : 'estudiante';

  //Parsear el número de semestre del slug
  const getSemesterNumber = (slugStr: string) => {
    if (!slugStr) return null;
    
    // Si slug tiene un formato como "semestre-1"
    if (slugStr.includes('-')) {
      const parts = slugStr.split('-');
      return parseInt(parts[parts.length - 1], 10);
    }
    
    const num = parseInt(slugStr, 10);
    return isNaN(num) ? null : num;
  };

  const semesterNum = getSemesterNumber(slug as string);
  
  const studentSchedule = useGetStudentSchedule(
    viewType === 'estudiante' ? slug : undefined, 
    viewType === 'estudiante' ? 1 : undefined
  );

  // determinar si el estudiante es irregular
  useEffect(() => {
    if (viewType === 'estudiante' && slug) {
      // Revisar si el estudiante es irregular
      const checkStudentStatus = async () => {
        try {
          const response = await fetch(`/api/student-info?studentId=${slug}`);
          const data = await response.json();
          
          if (data.success && data.student) {
            // Si el estudiante tiene un campo isIrregular, usarlo
            // de lo contrario, asumir que es regular
            setIsIrregular(data.student.isIrregular || false);
            console.log(`Student ${slug} isIrregular:`, data.student.isIrregular);
          } else {
            console.warn(`Could not determine if student ${slug} is irregular, defaulting to regular`);
            setIsIrregular(false);
          }
        } catch (err) {
          console.error(`Error checking if student ${slug} is irregular:`, err);
          setIsIrregular(false);
        }
      };
      
      checkStudentStatus();
    }
  }, [slug, viewType]);

  // Para mappear los datos del horario general
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
  
  // Convertir el horario del estudiante a un formato general
  const convertStudentScheduleToGeneralFormat = (items: ScheduleItem[] | null): GeneralScheduleItem[] => {
    if (!items) return [];
    
    return items.map(item => ({
      IdHorarioGeneral: 0,
      NombreCarrera: "", 
      IdGrupo: item.idgrupo,
      Dia: item.dia,
      HoraInicio: item.horainicio.slice(0, 5),
      HoraFin: item.horafin.slice(0, 5),
      Semestre: item.semestre,
      MateriaNombre: item.materianombre,
      ProfesorNombre: item.profesornombre,
    }));
  };

  // Jalar el horario del semestre
  const fetchSchedule = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/schedule');
      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch schedule');
      }
      // Mapear y filtrar los datos
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
    // Para la vista de semestre, solo cargar el horario si el número de semestre es válido
    if (viewType === 'semestre' && semesterNum !== null) {
      fetchSchedule();
    }
    // Para la vista de estudiante, no es necesario cargar el horario del semestre
  }, [semesterNum, viewType]);

  // Función para limpiar la vista
  const handleClearView = () => {
    setFilteredSchedule([]);
    toast.success('Vista limpiada');
  };

  const handleSaveChanges = async () => {
    try {
      setLoading(true);
      
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

  if (viewType === 'semestre' && loading) {
    return (
      <div className="p-4">
        <p className="text-center">Cargando materias del semestre...</p>
      </div>
    );
  }
  
  if (viewType === 'estudiante' && studentSchedule.loading) {
    return (
      <div className="p-4">
        <p className="text-center">Cargando horario del estudiante...</p>
      </div>
    );
  }

  if (viewType === 'semestre' && error) {
    return (
      <div className="p-4">
        <p className="text-center text-red-600">Error: {error}</p>
      </div>
    );
  }
  
  if (viewType === 'estudiante' && studentSchedule.error) {
    return (
      <div className="p-4">
        <p className="text-center text-red-600">Error: {studentSchedule.error}</p>
      </div>
    );
  }

  
  if (viewType === 'semestre' && semesterNum === null) {
    return (
      <div className="p-4">
        <p className="text-center text-red-600">Semestre no válido</p>
      </div>
    );
  }
  
  if (viewType === 'estudiante' && !slug) {
    return (
      <div className="p-4">
        <p className="text-center text-red-600">ID de estudiante no válido</p>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="mb-4">
        <h1 className="text-2xl font-bold">
          {viewType === 'semestre' 
            ? `Horario del Semestre ${semesterNum}` 
            : `Horario del Estudiante ${slug}`}
        </h1>
        {viewType === 'estudiante' && (
          <>
            {isIrregular && (
              <p className="text-sm text-amber-600 mt-1">
                Este estudiante es irregular y requiere un horario personalizado
              </p>
            )}
            {!isIrregular && (
              <p className="text-sm text-green-600 mt-1">
                Este estudiante es regular y sigue el horario estándar de su semestre
              </p>
            )}
            {studentSchedule.isIndividual && (
              <p className="text-sm text-green-600 mt-1">
                Este estudiante tiene un horario personalizado
              </p>
            )}
          </>
        )}
      </div>
      
      {viewType === 'semestre' ? (
        <HorarioSemestre
          schedule={filteredSchedule}
          semesterNum={semesterNum}
        />
      ) : (
        <HorarioAlumno
          schedule={convertStudentScheduleToGeneralFormat(studentSchedule.result)}
          alumnoId={slug as string}
          isRegular={!isIrregular} // Use the isIrregular flag directly
        />
      )}
    </div>
  );
}