'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '../ui/button';
import CoordinadorSchedule from '../CoordinadorSchedule';
import { GeneralScheduleItem } from '@/lib/models/general-schedule';
import { ResponseType } from "@/types/response";
import { toast } from 'sonner';
import { Save } from 'lucide-react';
import GroupInfoDialog from '../GroupInfoDialog';

// Días de la semana para mostrar en el horario
const daysOfWeek = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];

// Franjas horarias disponibles en el horario (formato 24h)
const timeSlots = [
  '07:00', '07:30', '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
  '11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '14:00',
  '14:30', '15:00', '15:30', '16:00'
];


export default function HorariosSlug() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<GeneralScheduleItem | null>(null);

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
      <div className="w-full flex justify-between flex-col gap-4">
          {/* Horario grid usando el mismo layout que EstudianteSchedule */}
          <div className="overflow-x-auto">
            <div className="min-w-[800px]">
              <div className="grid grid-cols-[100px_repeat(5,1fr)] grid-rows-[auto_repeat(19,2.5rem)]">
                {/* Encabezados con días de la semana */}
                <div className="h-10" />
                {daysOfWeek.map((day) => (
                  <div key={day} className="h-10 flex items-center justify-center font-medium border-b">
                    {day}
                  </div>
                ))}

                {/* Filas de horarios para cada franja horaria */}
                {timeSlots.map((time) => (
                  <React.Fragment key={time}>
                    {/* Columna de horas */}
                    <div className="flex items-start justify-end pr-2 text-sm text-muted-foreground -mt-2">
                      {time}
                    </div>
                    {/* Celdas para cada día en esa franja horaria */}
                    {daysOfWeek.map((day) => (
                      <Cell key={`${day}-${time}`} day={day} time={time} />
                    ))}
                  </React.Fragment>
                ))}
              </div>
            </div>
          </div>
        </div>
        
        {/* Dialog para mostrar información de grupo cuando se hace clic */}
        <GroupInfoDialog open={dialogOpen} onClose={() => setDialogOpen(false)} group={selectedGroup} />
    </div>
  );
}