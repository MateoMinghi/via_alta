'use client';

import React, { useState, useEffect } from 'react';
import GroupInfoDialog from '@/components/GroupInfoDialog';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

// Dummy data for UI demonstration
const daysOfWeek = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
const timeSlots = [
  '07:00', '07:30', '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
  '11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '14:00',
  '14:30', '15:00', '15:30', '16:00'
];

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
        } else {
          console.log('Failed to fetch updated schedule:', data2);
          setSchedule([]);
        }
      }
    } catch (err) {
      console.error('Error generating/fetching schedule:', err);
      setSchedule([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Drag-and-drop types
  const ItemTypes = { SCHEDULE_ITEM: 'scheduleItem' };

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
      item: { id: item.IdGrupo },
      collect: (monitor) => ({ isDragging: monitor.isDragging() })
    }), [item]);
    return (
      <div
        ref={drag}
        className={`bg-blue-50 rounded p-1 mb-1 cursor-move hover:bg-blue-100 ${isDragging ? 'opacity-50' : ''}`}
        onClick={onClick}
      >
        <div className="text-xs font-medium text-blue-500 truncate">{item.MateriaNombre}</div>
      </div>
    );
  }

  // Droppable cell
  function DroppableCell({
    day,
    time,
    children,
    onDropItem
  }: {
    day: string,
    time: string,
    children: React.ReactNode,
    onDropItem: (itemId: number, newDay: string, newTime: string) => void
  }) {
    const [, drop] = useDrop(() => ({
      accept: ItemTypes.SCHEDULE_ITEM,
      drop: (dragged: { id: number }) => {
        onDropItem(dragged.id, day, time);
      }
    }), [day, time]);
    return (
      <td ref={drop} className="border p-2 align-top min-h-[40px]">{children}</td>
    );
  }

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
    // TODO: Sync with backend via API
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="w-full pb-8 flex flex-col gap-4">
        <div className="flex justify-end mb-2">
          <button
            onClick={handleGenerateSchedule}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            disabled={isLoading}
          >
            {isLoading ? 'Generando...' : 'Generar horario general'}
          </button>
        </div>
        <div className="overflow-x-auto w-full">
          <table className="table-fixed w-full border-collapse">
            <thead>
              <tr>
                <th className="w-20 border p-2"></th>
                {daysOfWeek.map(day => (
                  <th key={day} className="border p-2 text-center font-medium">
                    {day}
                  </th>
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
        <GroupInfoDialog open={dialogOpen} onClose={() => setDialogOpen(false)} group={selectedGroup} />
        {isLoading && <div className="text-center text-gray-500 mt-4">Cargando horario...</div>}
      </div>
    </DndProvider>
  );
}