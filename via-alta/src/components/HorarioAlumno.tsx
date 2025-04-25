'use client';

import React, { useState, useEffect, useMemo } from 'react';
import GroupInfoDialog from '@/components/GroupInfoDialog';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, Lock, Plus, GripVertical, Search, Check } from 'lucide-react';
import { Input } from '@/components/ui/input';

// Define item types for drag and drop
const ItemTypes = {
  SCHEDULE_ITEM: 'schedule_item',
  AVAILABLE_SUBJECT: 'available_subject',
  SUBJECT: 'subject'
};

// Días de la semana para mostrar en el horario
const daysOfWeek = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];

// Franjas horarias disponibles en el horario (formato 24h)
const timeSlots = [
  '07:00', '07:30', '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
  '11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '14:00',
  '14:30', '15:00', '15:30', '16:00'
];

// Color classes for each semester - keep for backward compatibility
const semesterColors: Record<number, string> = {
  1: 'bg-green-50 hover:bg-green-100 border-green-200 text-green-700',
  2: 'bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-700',
  3: 'bg-yellow-50 hover:bg-yellow-100 border-yellow-200 text-yellow-700',
  4: 'bg-purple-50 hover:bg-purple-100 border-purple-200 text-purple-700',
  5: 'bg-pink-50 hover:bg-pink-100 border-pink-200 text-pink-700',
  6: 'bg-indigo-50 hover:bg-indigo-100 border-indigo-200 text-indigo-700',
  7: 'bg-red-50 hover:bg-red-100 border-red-200 text-red-700',
  8: 'bg-teal-50 hover:bg-teal-100 border-teal-200 text-teal-700'
};

function getSemesterColor(sem: number | undefined) {
  if (!sem || !(sem in semesterColors)) return 'bg-gray-50 hover:bg-gray-100 border-gray-200 text-gray-700';
  return semesterColors[sem];
}

// Types for the general schedule item (matches your backend)
interface GeneralScheduleItem {
  IdHorarioGeneral: number;
  NombreCarrera: string;
  IdGrupo: number;
  Dia: string;
  HoraInicio: string;
  HoraFin: string;
  Semestre?: number;
  MateriaNombre?: string;
  ProfesorNombre?: string;
  isObligatory?: boolean;
}

// Interface for extended item with additional properties for UI
interface ExtendedScheduleItem extends GeneralScheduleItem {
  isObligatory: boolean;
  isRecommended?: boolean;
  salon?: string;
  credits?: number;
  hours?: { 
    day: string;
    time?: string;
    timeStart?: string;
    timeEnd?: string;
  }[];
}

// Function to get subject color based on subject name
const getSubjectColor = (subjectName: string): { text: string, border: string, bg: string } => {
  const colorOptions = [
    { text: 'text-blue-700', border: 'border-blue-400', bg: 'bg-blue-50' },
    { text: 'text-green-700', border: 'border-green-400', bg: 'bg-green-50' },
    { text: 'text-amber-700', border: 'border-amber-400', bg: 'bg-amber-50' },
    { text: 'text-purple-700', border: 'border-purple-400', bg: 'bg-purple-50' },
    { text: 'text-pink-700', border: 'border-pink-400', bg: 'bg-pink-50' },
    { text: 'text-indigo-700', border: 'border-indigo-400', bg: 'bg-indigo-50' },
    { text: 'text-rose-700', border: 'border-rose-400', bg: 'bg-rose-50' },
    { text: 'text-teal-700', border: 'border-teal-400', bg: 'bg-teal-50' },
    { text: 'text-cyan-700', border: 'border-cyan-400', bg: 'bg-cyan-50' },
    { text: 'text-orange-700', border: 'border-orange-400', bg: 'bg-orange-50' },
    { text: 'text-lime-700', border: 'border-lime-400', bg: 'bg-lime-50' },
    { text: 'text-emerald-700', border: 'border-emerald-400', bg: 'bg-emerald-50' },
    { text: 'text-sky-700', border: 'border-sky-400', bg: 'bg-sky-50' },
    { text: 'text-violet-700', border: 'border-violet-400', bg: 'bg-violet-50' },
    { text: 'text-fuchsia-700', border: 'border-fuchsia-400', bg: 'bg-fuchsia-50' },
    { text: 'text-red-700', border: 'border-red-400', bg: 'bg-red-50' },
  ];
  
  // Create a hash based on subject name for consistent colors
  let hashCode = 0;
  for (let i = 0; i < subjectName.length; i++) {
    hashCode = ((hashCode << 5) - hashCode) + subjectName.charCodeAt(i);
    hashCode = hashCode & hashCode;
  }
  
  const colorIndex = Math.abs(hashCode) % colorOptions.length;
  return colorOptions[colorIndex];
};

// Draggable schedule item - Updated to disable dragging completely as coordinators cannot modify times
function DraggableScheduleItem({ item, onClick }: { item: ExtendedScheduleItem, onClick: () => void }) {
  const colors = getSubjectColor(item.MateriaNombre || '');
  
  return (
    <div
      className={cn(
        'p-1 text-xs rounded-md border shadow-sm h-full',
        'flex items-center',
        `border-l-4 ${colors.border}`,
        `${colors.bg}`,
        item.isObligatory && 'border-l-[6px]',
        'w-full cursor-pointer hover:brightness-95'
      )}
      onClick={onClick}
    >
      {/* Icono de candado para materias obligatorias */}
      {item.isObligatory && (
        <div className="flex-shrink-0 mr-1 relative group">
          <Lock className="h-3 w-3 text-amber-500" />
          <div className="absolute left-0 -mt-1 w-64 scale-0 group-hover:scale-100 transition-all bg-black text-white text-xs p-2 rounded shadow-lg z-50 -translate-y-full origin-bottom">
            Materia obligatoria que debe ser incluida en el horario del estudiante.
          </div>
        </div>
      )}
      
      <div className={cn("truncate font-medium flex-1", colors.text)}>
        {item.MateriaNombre}
      </div>
    </div>
  );
}

export default function HorarioAlumno() {
  // Map raw API schedule items to proper UI types
  const mapRawScheduleItem = (raw: any): ExtendedScheduleItem => {
    const item = {
      IdHorarioGeneral: raw.IdHorarioGeneral ?? raw.idhorariogeneral,
      NombreCarrera: raw.NombreCarrera ?? raw.nombrecarrera,
      IdGrupo: raw.IdGrupo ?? raw.idgrupo,
      Dia: raw.Dia ?? raw.dia,
      HoraInicio: (raw.HoraInicio ?? raw.horainicio ?? '').slice(0,5),
      HoraFin: (raw.HoraFin ?? raw.horafin ?? '').slice(0,5),
      Semestre: raw.Semestre ?? raw.semestre,
      MateriaNombre: raw.MateriaNombre ?? raw.materianombre,
      ProfesorNombre: raw.ProfesorNombre ?? raw.profesornombre,
      isObligatory: raw.isObligatory ?? false,
      salon: raw.salon ?? 'Por asignar',
      credits: raw.credits ?? 0,
    };

    // Add hours array for compatibility with EstudianteSchedule
    item.hours = [{
      day: item.Dia,
      timeStart: item.HoraInicio,
      timeEnd: item.HoraFin
    }];

    return item;
  };
  
  const [schedule, setSchedule] = useState<ExtendedScheduleItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<ExtendedScheduleItem | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [availableSubjects, setAvailableSubjects] = useState<ExtendedScheduleItem[]>([]);
  const [scheduledSubjects, setScheduledSubjects] = useState<ExtendedScheduleItem[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedSemester, setSelectedSemester] = useState<number | 'All'>('All');
  const [selectedMajor, setSelectedMajor] = useState<string>('All');
  
  // Available options
  const semesters = ['All', 1, 2, 3, 4, 5, 6, 7, 8] as const;
  
  const majors = useMemo(() => {
    return Array.from(new Set(schedule.map(i => i.NombreCarrera)));
  }, [schedule]);
  
  // Filtered schedule based on selections
  const filteredSchedule = useMemo(() => {
    return scheduledSubjects.filter(i =>
      (selectedSemester === 'All' || i.Semestre === selectedSemester) &&
      (selectedMajor === 'All' || i.NombreCarrera === selectedMajor)
    );
  }, [scheduledSubjects, selectedSemester, selectedMajor]);
  
  // Filtered available subjects based on search term
  const filteredAvailableSubjects = useMemo(() => {
    if (!searchTerm) return availableSubjects;
    const term = searchTerm.toLowerCase();
    return availableSubjects.filter(subject => 
      subject.MateriaNombre?.toLowerCase().includes(term) || 
      subject.ProfesorNombre?.toLowerCase().includes(term) ||
      subject.NombreCarrera?.toLowerCase().includes(term)
    );
  }, [availableSubjects, searchTerm]);
  
  // Fetch the general schedule from the API
  useEffect(() => {
    const fetchSchedule = async () => {
      setIsLoading(true);
      try {
        const res = await fetch('/api/schedule');
        const data = await res.json();
        if (data.success) {
          console.log('Schedule data received:', data.data);
          const items = data.data.map(mapRawScheduleItem);
          setSchedule(items);
          
          // Mark first 3 items as obligatory for demo purposes
          const obligatory = items.slice(0, 3).map(s => ({...s, isObligatory: true}));
          const available = items.slice(3);
          
          setScheduledSubjects(obligatory);
          setAvailableSubjects(available);
        } else {
          console.log('No schedule data received:', data);
          setSchedule([]);
          setScheduledSubjects([]);
          setAvailableSubjects([]);
        }
      } catch (err) {
        console.error('Error fetching schedule:', err);
        setSchedule([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSchedule();
  }, []);
  
  // Generate schedule handler
  const handleGenerateSchedule = async () => {
    setIsLoading(true);
    setScheduledSubjects([]);
    try {
      console.log('Generating schedule...');
      const res = await fetch('/api/schedule', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) });
      const data = await res.json();
      console.log('Generation response:', data);
      
      if (data.success) {
        // After generating, fetch the new schedule (with cache-busting param)
        console.log('Fetching updated schedule...');
        const res2 = await fetch(`/api/schedule?ts=${Date.now()}`);
        const data2 = await res2.json();
        console.log('Updated schedule data:', data2);
        
        if (data2.success) {
          const items = data2.data.map(mapRawScheduleItem);
          setSchedule(items);
          
          // Mark first 3 items as obligatory for demo purposes
          const obligatory = items.slice(0, 3).map(s => ({...s, isObligatory: true}));
          const available = items.slice(3);
          
          setScheduledSubjects(obligatory);
          setAvailableSubjects(available);
          
          toast.success('Horario general generado correctamente');
        } else {
          toast.error('Error al obtener el horario actualizado');
        }
      } else {
        toast.error('Error al generar el horario general');
      }
    } catch (err) {
      console.error('Error generating/fetching schedule:', err);
      setScheduledSubjects([]);
      toast.error('Error al generar/obtener el horario');
    } finally {
      setIsLoading(false);
    }
  };

  // Helper to convert HH:MM to minutes
  const timeToMinutes = (time: string | undefined | null): number => {
    if (!time) return 0;
    const [h, m] = time.split(":").map(Number);
    return h * 60 + (isNaN(m) ? 0 : m);
  };

  // Normalizes day names
  function normalizeDay(day: string): string {
    switch (day.toLowerCase()) {
      case 'monday':
      case 'lun':
      case 'lunes': 
        return 'Lunes';
      case 'tuesday':
      case 'mar':
      case 'martes':
        return 'Martes';
      case 'wednesday':
      case 'mié':
      case 'miercoles':
      case 'miércoles':
        return 'Miércoles';
      case 'thursday':
      case 'jue':
      case 'jueves':
        return 'Jueves';
      case 'friday':
      case 'vie':
      case 'viernes':
        return 'Viernes';    
      default:
        return day;
    }
  }

  // Handle adding a subject to the schedule
  const handleAddSubject = (subject: ExtendedScheduleItem) => {
    if (!scheduledSubjects.some((s) => s.IdGrupo === subject.IdGrupo)) {
      setScheduledSubjects([...scheduledSubjects, subject]);
      
      // Remove from available subjects
      setAvailableSubjects(availableSubjects.filter(s => s.IdGrupo !== subject.IdGrupo));
      
      toast.success(`Materia "${subject.MateriaNombre}" agregada al horario como ${subject.isObligatory ? 'obligatoria' : 'opcional'}`);
    } else {
      toast.error(`La materia "${subject.MateriaNombre}" ya está en el horario`);
    }
  };

  // Handle removing a subject from the schedule
  const handleRemoveSubject = (subjectId: number) => {
    const subjectToRemove = scheduledSubjects.find(s => s.IdGrupo === subjectId);
    
    if (subjectToRemove?.isObligatory) {
      toast.error("No se pueden eliminar las materias obligatorias");
      return;
    }
    
    if (subjectToRemove) {
      // Add back to available subjects
      setAvailableSubjects([...availableSubjects, subjectToRemove]);
    }
    
    setScheduledSubjects(scheduledSubjects.filter(s => s.IdGrupo !== subjectId));
    toast.info(`Materia eliminada del horario`);
  };
  
  // Toggle a subject's obligatory status
  const toggleObligatoryStatus = (subjectId: number) => {
    setScheduledSubjects(prev => 
      prev.map(subject => 
        subject.IdGrupo === subjectId 
          ? { ...subject, isObligatory: !subject.isObligatory }
          : subject
      )
    );
  };

  // Create a matrix representation of the schedule
  const scheduleMatrix = useMemo(() => {
    const matrix: { [time: string]: { [day: string]: ExtendedScheduleItem[] } } = {};
    
    // Initialize empty matrix
    timeSlots.forEach(time => {
      matrix[time] = {};
      daysOfWeek.forEach(day => {
        matrix[time][day] = [];
      });
    });
    
    // Fill with schedule items
    filteredSchedule.forEach(item => {
      if (!item.hours) return;
      
      item.hours.forEach(hour => {
        const normalizedDay = normalizeDay(hour.day);
        const startTime = hour.timeStart || hour.time || item.HoraInicio;
        const endTime = hour.timeEnd || item.HoraFin;
        
        if (!startTime || !endTime) return;
        
        const start = timeToMinutes(startTime);
        const end = timeToMinutes(endTime);
        
        // Add item to each time slot it spans
        timeSlots.forEach(slot => {
          const slotTime = timeToMinutes(slot);
          if (slotTime >= start && slotTime < end) {
            if (matrix[slot]?.[normalizedDay]) {
              matrix[slot][normalizedDay].push(item);
            }
          }
        });
      });
    });
    
    return matrix;
  }, [filteredSchedule]);

  // Cell component to display items at a specific day and time - Removed drop functionality
  const Cell = ({ day, time }: { day: string; time: string }) => {
    const items = scheduleMatrix[time]?.[day] || [];

    return (
      <div
        className={cn(
          'border border-gray-200 p-1 relative h-full',
          items.length > 0 ? 'bg-blue-50/50' : 'bg-white'
        )}
      >
        <div className="flex flex-row gap-0.5 h-full">
          {items.map((item, index) => (
            <DraggableScheduleItem 
              key={`${item.IdGrupo}-${index}`} 
              item={item} 
              onClick={() => {
                setSelectedGroup(item);
                setDialogOpen(true);
              }}
            />
          ))}
        </div>
      </div>
    );
  };

  // Function to save schedule changes to the database
  const handleSaveSchedule = async () => {
    setIsLoading(true);
    try {
      console.log('Saving schedule changes...');
      
      // Convert ExtendedScheduleItem back to GeneralScheduleItem for API
      const scheduleToSave = scheduledSubjects.map(item => ({
        IdHorarioGeneral: item.IdHorarioGeneral,
        NombreCarrera: item.NombreCarrera,
        IdGrupo: item.IdGrupo,
        Dia: item.Dia,
        HoraInicio: item.HoraInicio,
        HoraFin: item.HoraFin,
        Semestre: item.Semestre,
        MateriaNombre: item.MateriaNombre,
        ProfesorNombre: item.ProfesorNombre,
        isObligatory: item.isObligatory
      }));
      
      const res = await fetch('/api/schedule', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ schedule: scheduleToSave }) 
      });
      const data = await res.json();
      
      if (data.success) {
        toast.success('Horario guardado exitosamente');
      } else {
        toast.error(`Error al guardar el horario: ${data.error || 'Error desconocido'}`);
      }
    } catch (err) {
      console.error('Error saving schedule:', err);
      toast.error('Error al guardar el horario');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Component for scheduled subject card - Updated toggle UI
  const ScheduledSubjectCard = ({ subject, onRemove }: { subject: ExtendedScheduleItem, onRemove: (id: number) => void }) => {
    const colors = getSubjectColor(subject.MateriaNombre || '');
    
    return (
      <div 
        className={cn(
          "flex flex-col items-center p-3 border rounded-lg border-l-4 bg-white mb-2",
          `${colors.border}`,
          subject.isObligatory ? "border-l-[6px]" : ""
        )}
      >
        <div className="flex flex-row justify-between w-full">
          <div className="flex items-center gap-2">
            {/* Status indicator */}
            <div className={cn(
              "flex-shrink-0 px-2 py-0.5 rounded-full text-xs font-medium",
              subject.isObligatory 
                ? "bg-amber-100 text-amber-800 border border-amber-300" 
                : "bg-blue-100 text-blue-800 border border-blue-300"
            )}>
              {subject.isObligatory ? 'Obligatoria' : 'Opcional'}
            </div>
            
            <div className="pb-1 w-full">
              <p className={cn("font-bold text-base truncate", colors.text)}>{subject.MateriaNombre}</p>
              <p className="text-sm font-medium truncate mt-1">{subject.ProfesorNombre || 'Sin profesor asignado'}</p>
              <p className="text-xs text-gray-600 mt-0.5">
                <span className="font-medium">Salón:</span> {subject.salon || 'Por asignar'}
              </p>
            </div>
          </div>
          
          <div className="flex gap-1">
            {/* Improved toggle button for obligatory status */}
            <Button
              variant={subject.isObligatory ? "default" : "outline"}
              size="sm"
              onClick={() => toggleObligatoryStatus(subject.IdGrupo)}
              className={cn(
                "flex items-center gap-1 px-2.5 text-xs h-8",
                subject.isObligatory ? "bg-amber-500 hover:bg-amber-600" : "text-gray-600 hover:bg-gray-100"
              )}
              title={subject.isObligatory ? 'Marcar como opcional' : 'Marcar como obligatoria'}
            >
              {subject.isObligatory ? (
                <>
                  <Lock className="h-3.5 w-3.5" />
                  <span>Obligatoria</span>
                </>
              ) : (
                <>
                  <Check className="h-3.5 w-3.5" />
                  <span>Marcar obligatoria</span>
                </>
              )}
            </Button>
            
            {/* Botón para eliminar (solo si no es obligatoria) */}
            {!subject.isObligatory && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onRemove(subject.IdGrupo)}
                className="h-8 px-2 text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600"
              >
                <X className="h-3.5 w-3.5 mr-1" />
                <span className="text-xs">Quitar</span>
              </Button>
            )}
          </div>
        </div>
        
        {/* Sección de horarios de la materia */}
        <div className="text-xs w-full pt-1 border-t border-gray-200 mt-1">
          <div className="font-medium text-gray-700 mb-0.5">Horarios de clase:</div>
          <div className="flex flex-wrap gap-1">
            {subject.hours?.map((hour, index) => (
              <span 
                key={`${hour.day}-${index}`} 
                className="inline-flex items-center px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-xs"
              >
                <span className="font-medium">{hour.day.substring(0, 3)}</span>&nbsp;
                {hour.timeStart && hour.timeEnd ? 
                  `${hour.timeStart} - ${hour.timeEnd}` : 
                  subject.HoraInicio && subject.HoraFin ? 
                  `${subject.HoraInicio} - ${subject.HoraFin}` : 
                  'Horario por definir'
                }
              </span>
            ))}
          </div>
        </div>
        
        {/* Información adicional sobre la materia */}
        <div className="w-full flex flex-wrap gap-1 mt-2 pt-2 border-t border-gray-200">
          <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded-full text-xs inline-flex items-center">
            <span className="font-medium mr-1">Semestre:</span> {subject.Semestre || 'N/A'}
          </span>
          <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded-full text-xs inline-flex items-center">
            <span className="font-medium mr-1">Carrera:</span> {subject.NombreCarrera}
          </span>
        </div>
      </div>
    );
  };

  // Component for available subject card
  const AvailableSubjectCard = ({ subject, onAdd }: { subject: ExtendedScheduleItem, onAdd: (subject: ExtendedScheduleItem) => void }) => {
    const colors = getSubjectColor(subject.MateriaNombre || '');
    
    return (
      <Card 
        className={cn(
          `p-3 border-l-4 ${colors.border} bg-white mb-2`,
          "hover:shadow-md transition-all"
        )}
      >
        <div className="flex justify-between">
          <div className="flex items-center gap-2">
            <div className="pb-1 w-full">
              <p className={cn("font-bold text-base truncate", colors.text)}>{subject.MateriaNombre}</p>
              <p className="text-sm font-medium truncate mt-1">{subject.ProfesorNombre || 'Sin profesor asignado'}</p>
              <p className="text-xs text-gray-600 mt-0.5">
                <span className="font-medium">Salón:</span> {subject.salon || 'Por asignar'}
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-1 items-end">
            <Button
              variant="default"
              size="sm"
              onClick={() => {
                onAdd({...subject, isObligatory: true});
              }}
              className="text-xs h-8 px-2.5 bg-amber-500 hover:bg-amber-600 flex items-center gap-1"
            >
              <Lock className="h-3.5 w-3.5" />
              <span>Agregar obligatoria</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                onAdd({...subject, isObligatory: false});
              }}
              className="text-xs h-8 px-2.5 border-blue-200 text-blue-700 hover:bg-blue-50 flex items-center gap-1"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Agregar opcional</span>
            </Button>
          </div>
        </div>
        
        {/* Sección de horarios disponibles */}
        <div className="text-xs w-full pt-1 border-t border-gray-200 mt-2">
          <div className="font-medium text-gray-700 mb-0.5">Horarios fijos de clase:</div>
          <div className="flex flex-wrap gap-1">
            {subject.hours?.map((hour, index) => (
              <span 
                key={`${hour.day}-${index}`} 
                className="inline-flex items-center px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-xs"
              >
                <span className="font-medium">{hour.day.substring(0, 3)}</span>&nbsp;
                {hour.timeStart && hour.timeEnd ? 
                  `${hour.timeStart} - ${hour.timeEnd}` : 
                  subject.HoraInicio && subject.HoraFin ? 
                  `${subject.HoraInicio} - ${subject.HoraFin}` : 
                  'Horario por definir'
                }
              </span>
            ))}
          </div>
        </div>
        
        {/* Información adicional sobre la materia */}
        <div className="w-full flex flex-wrap gap-1 mt-2 pt-2 border-t border-gray-200">
          <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded-full text-xs inline-flex items-center">
            <span className="font-medium mr-1">Semestre:</span> {subject.Semestre || 'N/A'}
          </span>
          <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded-full text-xs inline-flex items-center">
            <span className="font-medium mr-1">Carrera:</span> {subject.NombreCarrera}
          </span>
        </div>
      </Card>
    );
  };

  // Area for scheduled subjects - Remove drag functionality
  const ScheduledSubjectsArea = ({ subjects }: { subjects: ExtendedScheduleItem[] }) => {
    return (
      <div className="space-y-2">
        {/* Mensajes informativos */}
        {!subjects.length && (
          <div className="flex items-center justify-center h-[100px] text-gray-400 p-2">
            <p>No hay materias en el horario del estudiante</p>
          </div>
        )}
        
        {/* Lista de materias en horario */}
        {subjects.map((subject) => (
          <ScheduledSubjectCard 
            key={subject.IdGrupo} 
            subject={subject} 
            onRemove={handleRemoveSubject} 
          />
        ))}
      </div>
    );
  };

  // Area for available subjects - Remove drag functionality
  const AvailableSubjectsArea = ({ 
    subjects
  }: {
    subjects: ExtendedScheduleItem[]
  }) => {    
    return (
      <div className="space-y-2">
        {/* Mensajes informativos */}
        {!subjects.length && (
          <div className="flex items-center justify-center h-[100px] text-gray-400">
            <p>No hay materias disponibles para agregar</p>
          </div>
        )}
        
        {/* Lista de materias disponibles */}
        {subjects.map((subject) => (
          <AvailableSubjectCard key={subject.IdGrupo} subject={subject} onAdd={handleAddSubject} />
        ))}
      </div>
    );
  };

  return (
    <div className="w-full pb-8 flex flex-col gap-4">
      <div className="flex justify-between items-center mb-2">
        {/* Title and info */}
        <div className="flex flex-col">
          <h1 className="text-xl font-bold">Gestión de Horario del Estudiante</h1>
          <p className="text-gray-500 text-sm">Seleccione las materias para el horario. El horario de clases es fijo y no puede modificarse.</p>
        </div>
        
        {/* Action buttons */}
        <div className="flex gap-3">
          <Button
            onClick={handleSaveSchedule}
            className="px-4 py-2 bg-red-800 text-white rounded hover:bg-red-700 disabled:opacity-50"
            disabled={isLoading}
          >
            {isLoading ? 'Guardando...' : 'Guardar Horario'}
          </Button>
          <Button
            onClick={handleGenerateSchedule}
            className="px-4 py-2 bg-red-800 text-white rounded hover:bg-red-700 disabled:opacity-50"
            disabled={isLoading}
          >
            {isLoading ? 'Generando...' : 'Generar Horario'}
          </Button>
        </div>
      </div>
      
      <div className="flex gap-4 items-center bg-blue-50 p-3 rounded-lg border border-blue-200">
        <div className="text-blue-500">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
        </div>
        <div className="flex-1">
          <h3 className="font-medium text-blue-700">Información importante</h3>
          <p className="text-sm text-blue-600">El horario de cada materia es fijo y no puede modificarse. Solo puede seleccionar qué materias incluir en el horario del estudiante y si son obligatorias u opcionales.</p>
        </div>
      </div>
      
      <div className="flex justify-between items-center">
        {/* Filters */}
        <div className="flex gap-4 items-center">
          <div>
            <label className="mr-2 text-sm font-medium">Semestre:</label>
            <select
              value={selectedSemester}
              onChange={e => setSelectedSemester(e.target.value === 'All' ? 'All' : Number(e.target.value))}
              className="border p-1 rounded text-sm"
            >
              {semesters.map(s => (
                <option key={s} value={s}>{s === 'All' ? 'Todos' : s}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mr-2 text-sm font-medium">Carrera:</label>
            <select
              value={selectedMajor}
              onChange={e => setSelectedMajor(e.target.value)}
              className="border p-1 rounded text-sm"
            >
              <option value="All">Todas</option>
              {majors.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>          
        </div>
        
        {/* Legend */}
        <div className="flex gap-4 items-center">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-amber-500 rounded-full"></div>
            <span className="text-xs">Materia obligatoria</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span className="text-xs">Materia opcional</span>
          </div>
        </div>
      </div>
      
      <div className="w-full flex justify-between flex-col lg:flex-row gap-4">
        {/* Cuadrícula del horario semanal con horas */}
        <div className="overflow-x-auto flex-1">
          <div className="min-w-[800px]">
            <h2 className="font-bold mb-2">Vista previa del horario</h2>
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
        
        {/* Panel lateral con materias programadas y disponibles */}
        <div className="w-full lg:w-1/3 pl-0 lg:pl-4">
          {/* Sección de materias en el horario actual */}
          <div className="mb-4 bg-white p-4 border rounded-lg shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-600"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>
              <p className="text-lg font-semibold">Materias Seleccionadas</p>
            </div>
            <ScheduledSubjectsArea subjects={scheduledSubjects} />
          </div>
          
          {/* Búsqueda de materias disponibles */}
          <div className="bg-white p-4 border rounded-lg shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
              <p className="text-lg font-semibold">Materias Disponibles</p>
            </div>
            
            <div className="relative mt-2">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Buscar por nombre, profesor o carrera..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 pr-4 py-2 w-full rounded-md border text-sm"
              />
            </div>
            <div className="flex items-center gap-2 my-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-500"><path d="M12 2 4 14h16L12 2z"/><path d="m12 14 4 8H8l4-8"/></svg>
              <p className="text-xs text-gray-600">
                Seleccione materias para agregar al horario del estudiante.
              </p>
            </div>
            
            {/* Lista de materias disponibles */}
            <AvailableSubjectsArea subjects={filteredAvailableSubjects} />
          </div>
        </div>
      </div>
      
      {/* Dialog para mostrar información de grupo cuando se hace clic */}
      <GroupInfoDialog open={dialogOpen} onClose={() => setDialogOpen(false)} group={selectedGroup} />
      
      {isLoading && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl">
            <p className="text-lg text-center">Cargando horario...</p>
            <div className="mt-4 w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          </div>
        </div>
      )}
    </div>
  );
}