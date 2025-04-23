'use client';

import React, { useState, useEffect } from 'react';
import GroupInfoDialog from '@/components/GroupInfoDialog';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { X, Lock, Plus, GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

// Define item types for drag and drop
const ItemTypes = {
  SCHEDULE_ITEM: 'schedule_item'
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

// Draggable schedule item
function DraggableScheduleItem({ item, onClick }: { item: GeneralScheduleItem, onClick: () => void }) {
  const colors = getSubjectColor(item.MateriaNombre || '');
  const [{ isDragging }, drag] = useDrag(() => ({
    type: ItemTypes.SCHEDULE_ITEM,
    item: { id: item.IdGrupo },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }));
  
  // Wrap the element with the drag connector instead of using ref
  return drag(
    <div
      className={cn(
        'p-1 text-xs rounded-md border shadow-sm h-full',
        'flex justify-between items-center',
        `border-l-4 ${colors.border}`,
        `${colors.bg} cursor-grab hover:shadow-md transition-all bg-opacity-90 hover:bg-opacity-100`,
        isDragging && 'opacity-50 cursor-grabbing scale-[0.97]',
        'w-full'
      )}
      onClick={onClick}
    >
      <div className={cn("truncate font-medium flex-1", colors.text)}>
        {item.MateriaNombre}
      </div>
    </div>
  );
}

export default function HorarioGeneralPage() {
  // Map raw API schedule items (lowercase keys, include seconds) to proper UI types (PascalCase, HH:MM)
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
  const [schedule, setSchedule] = useState<GeneralScheduleItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<GeneralScheduleItem | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  
  const [selectedSemester, setSelectedSemester] = useState<number | 'All'>('All');
  const [selectedMajor, setSelectedMajor] = useState<string>('All');
  // Available options
  const semesters = ['All', 1, 2, 3, 4, 5, 6, 7, 8] as const;
  const majors = Array.from(new Set(schedule.map(i => i.NombreCarrera)));
  // Filtered schedule based on selections
  const filteredSchedule = schedule.filter(i =>
    (selectedSemester === 'All' || i.Semestre === selectedSemester) &&
    (selectedMajor === 'All' || i.NombreCarrera === selectedMajor)
  );
  
  // Fetch the general schedule from the API
  useEffect(() => {
    const fetchSchedule = async () => {
      setIsLoading(true);
      try {
        const res = await fetch('/api/schedule');
        const data = await res.json();
        if (data.success) {
          console.log('Schedule data received:', data.data);
          setSchedule(data.data.map(mapRawScheduleItem));
        } else {
          console.log('No schedule data received:', data);
          setSchedule([]);
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
    try {
      console.log('Generating schedule...');
      const res = await fetch('/api/schedule', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) });
      const data = await res.json();
      console.log('Generation response:', data);
      
      if (data.success) {
        // After generating, fetch the new schedule
        console.log('Fetching updated schedule...');
        const res2 = await fetch('/api/schedule');
        const data2 = await res2.json();
        console.log('Updated schedule data:', data2);
        
        if (data2.success) {
          console.log('Schedule data received, count:', data2.data?.length || 0);
          setSchedule(data2.data.map(mapRawScheduleItem));
          toast.success('Horario general generado correctamente');
        } else {
          console.log('Failed to fetch updated schedule:', data2);
          setSchedule([]);
          toast.error('Error al obtener el horario actualizado');
        }
      } else {
        toast.error('Error al generar el horario general');
      }
    } catch (err) {
      console.error('Error generating/fetching schedule:', err);
      setSchedule([]);
      toast.error('Error al generar/obtener el horario');
    } finally {
      setIsLoading(false);
    }
  };

  // Helper to convert HH:MM to minutes
  const timeToMinutes = (time: string | undefined | null): number => {
    if (!time) return 0;
    const [h, m] = time.split(":").map(Number);
    return h * 60 + m;
  };

  // Helper to get time string from minutes
  const minutesToTime = (minutes: number): string => {
    const h = Math.floor(minutes / 60).toString().padStart(2, '0');
    const m = (minutes % 60).toString().padStart(2, '0');
    return `${h}:${m}`;
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

  // Create a matrix representation of the schedule
  const scheduleMatrix = React.useMemo(() => {
    const matrix: { [time: string]: { [day: string]: GeneralScheduleItem[] } } = {};
    
    // Initialize empty matrix
    timeSlots.forEach(time => {
      matrix[time] = {};
      daysOfWeek.forEach(day => {
        matrix[time][day] = [];
      });
    });
    
    // Fill with schedule items
    filteredSchedule.forEach(item => {
      const normalizedDay = normalizeDay(item.Dia);
      const startTime = timeToMinutes(item.HoraInicio);
      const endTime = timeToMinutes(item.HoraFin);
      
      // Add item to each time slot it spans
      timeSlots.forEach(slot => {
        const slotTime = timeToMinutes(slot);
        if (slotTime >= startTime && slotTime < endTime) {
          if (matrix[slot]?.[normalizedDay]) {
            matrix[slot][normalizedDay].push(item);
          }
        }
      });
    });
    
    return matrix;
  }, [filteredSchedule]);

  // Cell component to display items at a specific day and time
  const Cell = ({ day, time }: { day: string; time: string }) => {
    const items = scheduleMatrix[time]?.[day] || [];
    
    // Add drop target functionality
    const [{ isOver, canDrop }, drop] = useDrop(() => ({
      accept: ItemTypes.SCHEDULE_ITEM,
      drop: (item: { id: number }) => {
        handleDropItem(item.id, day, time);
        return { day, time };
      },
      collect: (monitor) => ({
        isOver: monitor.isOver(),
        canDrop: monitor.canDrop(),
      }),
    }));

    const getWidthClass = (total: number, index: number) => {
      switch(total) {
        case 1: return 'w-full';
        case 2: return 'w-[calc(50%-2px)]';
        case 3: return 'w-[calc(33.333%-2px)]';
        default: return 'w-[calc(25%-2px)]';
      }
    };

    return drop(
      <div
        className={cn(
          'border border-gray-200 p-1 relative h-full',
          items.length > 0 ? 'bg-blue-50/50' : 'bg-white',
          isOver && 'bg-gray-100'
        )}
      >
        <div className="flex flex-row gap-0.5 h-full">
          {items.map((item, index) => (
            <DraggableScheduleItem 
              key={`${item.IdHorarioGeneral}-${index}`} 
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

  // Handle drop: update item's day and start/end time (UI only)
  const handleDropItem = (itemId: number, newDay: string, newTime: string) => {
    // Find the item we're updating
    const itemToUpdate = schedule.find(item => item.IdGrupo === itemId);
    if (!itemToUpdate) return;
    
    // Calculate duration in minutes
    const duration = timeToMinutes(itemToUpdate.HoraFin) - timeToMinutes(itemToUpdate.HoraInicio);
    const newStart = timeToMinutes(newTime);
    const newEnd = newStart + duration;
    
    const updatedItem = {
      ...itemToUpdate,
      Dia: newDay,
      HoraInicio: minutesToTime(newStart),
      HoraFin: minutesToTime(newEnd)
    };
    
    // Update UI only - no API call
    setSchedule(prev => prev.map(item => item.IdGrupo === itemId ? updatedItem : item));
    toast.success('Horario actualizado solo en la UI (no persiste en la base de datos)');
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="w-full pb-8 flex flex-col gap-4">
        <div className="flex justify-between items-center mb-2">
          {/* Filters */}
          <div className="flex gap-4 items-center">
            <div>
              <label className="mr-2">Semestre:</label>
              <select
                value={selectedSemester}
                onChange={e => setSelectedSemester(e.target.value === 'All' ? 'All' : Number(e.target.value))}
                className="border p-1 rounded"
              >
                {semesters.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mr-2">Carrera:</label>
              <select
                value={selectedMajor}
                onChange={e => setSelectedMajor(e.target.value)}
                className="border p-1 rounded"
              >
                <option value="All">All</option>
                {majors.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
          </div>
          <button
            onClick={handleGenerateSchedule}
            className="px-4 py-2 bg-red-800 text-white rounded hover:bg-red-700 disabled:opacity-50"
            disabled={isLoading}
          >
            {isLoading ? 'Generando...' : 'Generar horario general'}
          </button>
        </div>
        
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
        
        {isLoading && (
          <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-xl">
              <p className="text-lg text-center">Cargando horario...</p>
              <div className="mt-4 w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
            </div>
          </div>
        )}
      </div>
    </DndProvider>
  );
}