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

// Días de la semana para mostrar en el horario
const daysOfWeek = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];

// Franjas horarias disponibles en el horario (formato 24h)
const timeSlots = [
  '07:00', '07:30', '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
  '11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '14:00',
  '14:30', '15:00', '15:30', '16:00'
];

// Define item type for drag and drop
const ItemTypes = {
  SCHEDULE_ITEM: 'scheduleItem'
};

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
  // Utility to remove duplicate schedule items by unique ID
  const dedupeScheduleItems = (items: GeneralScheduleItem[]) =>
    Array.from(new Map(items.map(item => [item.IdHorarioGeneral, item])).values());

  const [schedule, setSchedule] = useState<GeneralScheduleItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<GeneralScheduleItem | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  
  // Fetch the general schedule from the API
  useEffect(() => {
    const fetchSchedule = async () => {
      setIsLoading(true);
      try {
        const res = await fetch('/api/schedule');
        const data = await res.json();
        if (data.success) {
          console.log('Schedule data received:', data.data);
          // Map schedule without global dedupe
          const mapped = data.data.map(mapRawScheduleItem);
          setSchedule(mapped);
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

  // Draggable schedule item
  function DraggableScheduleItem({ item, onClick }: { item: GeneralScheduleItem, onClick: () => void }) {
    const [{ isDragging }, drag] = useDrag(() => ({
      type: ItemTypes.SCHEDULE_ITEM,
      item: { 
        id: item.IdGrupo,
        day: item.Dia,
        time: item.HoraInicio,
        name: item.MateriaNombre || item.NombreCarrera,
        originalItem: item
      },
      collect: (monitor) => ({
        isDragging: !!monitor.isDragging()
      })
    }), [item]);

    const colors = getSubjectColor(item.MateriaNombre || item.NombreCarrera || '');
    
    return (
      <div
        ref={drag}
        className={`bg-blue-50 rounded p-1 mb-1 cursor-move hover:bg-blue-100 ${isDragging ? 'opacity-50' : ''}`}
        onClick={onClick}
      >
        <div className="text-xs font-medium text-blue-500 truncate">{item.MateriaNombre}</div>
      </div>
    );
  };

  // Droppable cell component
  const DroppableCell = ({ day, time }: { day: string, time: string }) => {
    const items = scheduleMatrix[time]?.[day] || [];
    
    // Configure drop functionality
    const [{ isOver, canDrop }, dropRef] = useDrop(() => ({
      accept: ItemTypes.SCHEDULE_ITEM,
      drop: (droppedItem: { id: number, day: string, time: string }) => {
        handleDropItem(droppedItem.id, day, time);
        toast.success(`Clase movida a ${day} ${time}`);
      },
      collect: (monitor) => ({
        isOver: !!monitor.isOver(),
        canDrop: !!monitor.canDrop(),
      }),
    }), [day, time]);

    const getWidthClass = (total: number) => {
      switch(total) {
        case 1: return 'w-full';
        case 2: return 'w-[calc(50%-2px)]';
        case 3: return 'w-[calc(33.333%-2px)]';
        default: return 'w-[calc(25%-2px)]';
      }
    };

    return (
      <div 
        ref={dropRef}
        className={cn(
          'border border-gray-200 p-1 relative h-full transition-colors',
          items.length > 0 ? 'bg-blue-50/50' : 'bg-white',
          isOver && canDrop && 'bg-green-100 border-dashed border-green-400',
        )}
      >
        <div className="flex flex-row gap-0.5 h-full">
          {items.map((item, index) => (
            <DraggableItem 
              key={`${item.IdHorarioGeneral}-${index}`} 
              item={item} 
              index={index} 
              widthClass={getWidthClass(items.length)}
            />
          ))}
          {isOver && canDrop && items.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center text-xs text-green-600 font-medium">
              Soltar aquí
            </div>
          )}
        </div>
      </div>
    );
  };

  // Handle drop: update item's day and start/end time
  const handleDropItem = (itemId: number, newDay: string, newTime: string) => {
    setSchedule(prev => prev.map(item => {
      if (item.IdGrupo !== itemId) return item;
      // Calculate duration in minutes
      const duration = timeToMinutes(item.HoraFin) - timeToMinutes(item.HoraInicio);
      const newStart = timeToMinutes(newTime);
      const newEnd = newStart + duration;
      return {
        ...item,
        Dia: newDay,
        HoraInicio: minutesToTime(newStart),
        HoraFin: minutesToTime(newEnd)
      };
    }));
    
    // TODO: Sync with backend via API using a POST request to update the schedule
    // This would be implemented when you have the API endpoint ready
    console.log(`Moved item ${itemId} to ${newDay} at ${newTime}`);
  };

  const [selectedSemester, setSelectedSemester] = useState<number | 'All'>('All');
  const [selectedMajor, setSelectedMajor] = useState<string>('All');
  // Available options
  const semesters = ['All', 1,2,3,4,5,6,7,8] as const;
  const majors = Array.from(new Set(schedule.map(i => i.NombreCarrera)));
  // Filtered schedule based on selections
  const filteredSchedule = schedule.filter(i =>
    (selectedSemester === 'All' || i.Semestre === selectedSemester) &&
    (selectedMajor === 'All' || i.NombreCarrera === selectedMajor)
  );

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="w-full pb-8 flex flex-col gap-4">
        <div className="flex justify-end mb-2">
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
              </tr>
            </thead>
            <tbody>
              {timeSlots.map(time => (
                <tr key={time}>
                  <th className="border p-2 text-right text-sm">{time}</th>
                  {daysOfWeek.map(day => {
                    const slotMinutes = timeToMinutes(time);
                    const items = schedule.filter(i => {
                      if (i.Dia !== day) return false;
                      const start = timeToMinutes(i.HoraInicio);
                      const end = timeToMinutes(i.HoraFin);
                      return slotMinutes >= start && slotMinutes < end;
                    });
                    return (
                      <DroppableCell
                        key={`${day}-${time}`}
                        day={day}
                        time={time}
                        onDropItem={handleDropItem}
                      >
                        {items.length > 0 ? (
                          <div className="flex flex-col gap-1">
                            {items.map((item, idx) => (
                              <DraggableScheduleItem
                                key={`${item.IdGrupo}-${item.Dia}-${item.HoraInicio}-${item.HoraFin}-${idx}`}
                                item={item}
                                onClick={() => {
                                  setSelectedGroup(item);
                                  setDialogOpen(true);
                                }}
                              />
                            ))}
                          </div>
                        ) : null}
                      </DroppableCell>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
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