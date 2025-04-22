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
  // Utility to remove duplicate schedule items by unique ID
  const dedupeScheduleItems = (items: GeneralScheduleItem[]) =>
    Array.from(new Map(items.map(item => [item.IdHorarioGeneral, item])).values());

  const [schedule, setSchedule] = useState<GeneralScheduleItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<GeneralScheduleItem | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [unsavedChanges, setUnsavedChanges] = useState(false);
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
          // Map updated schedule without global dedupe
          const mapped2 = data2.data.map(mapRawScheduleItem);
          setSchedule(mapped2);
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

  // Color classes for each semester
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

  // Draggable schedule item
  function DraggableScheduleItem({ item, onClick }: { item: GeneralScheduleItem, onClick: () => void }) {
    const colorClass = getSemesterColor(item.Semestre);
    const [{ isDragging }, drag] = useDrag(() => ({
      type: ItemTypes.SCHEDULE_ITEM,
      item: { id: item.IdGrupo },
      collect: (monitor) => ({ isDragging: monitor.isDragging() })
    }), [item]);
    return (
      <div
        ref={node => { drag(node); }}
        className={`${colorClass} rounded p-1 mb-1 cursor-move ${isDragging ? 'opacity-50' : ''}`}
        onClick={onClick}
      >
        <div className="text-xs font-medium truncate">{item.MateriaNombre}</div>
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
      <td
        ref={node => { drop(node); }}
        className="border p-2 align-top min-h-[40px]">{children}</td>
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
    setUnsavedChanges(true);
  };

  // Save changes to backend
  const handleSaveChanges = async () => {
    setIsLoading(true);
    try {
      // Send only the changed schedule (or all, depending on backend design)
      const res = await fetch('/api/schedule', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ schedule })
      });
      const data = await res.json();
      if (data.success) {
        setUnsavedChanges(false);
      } else {
        alert('Error al guardar los cambios: ' + (data.error || ''));
      }
    } catch (err) {
      alert('Error al guardar los cambios.');
    } finally {
      setIsLoading(false);
    }
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
          <div className="flex gap-2 items-center">
            <button
              onClick={handleGenerateSchedule}
              className="px-4 py-2 bg-red-800 text-white rounded hover:bg-red-700 disabled:opacity-50"
              disabled={isLoading}
            >
              {isLoading ? 'Generando...' : 'Generar horario general'}
            </button>
            {unsavedChanges && (
              <button
                onClick={handleSaveChanges}
                className="px-4 py-2 bg-green-700 text-white rounded hover:bg-green-600 disabled:opacity-50"
                disabled={isLoading}
              >
                {isLoading ? 'Guardando...' : 'Guardar cambios'}
              </button>
            )}
          </div>
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
                    const items = filteredSchedule.filter(i => {
                      if (i.Dia !== day) return false;
                      const start = timeToMinutes(i.HoraInicio);
                      const end = timeToMinutes(i.HoraFin);
                      return slotMinutes >= start && slotMinutes < end;
                    });
                    // Only show each group once per cell (by IdGrupo)
                    const seen = new Set();
                    const uniqueItems = items.filter(i => {
                      if (seen.has(i.IdGrupo)) return false;
                      seen.add(i.IdGrupo);
                      return true;
                    });
                    return (
                      <DroppableCell
                        key={`${day}-${time}`}
                        day={day}
                        time={time}
                        onDropItem={handleDropItem}
                      >
                        {uniqueItems.length > 0 && (
                          <div className="flex flex-col gap-1">
                            {uniqueItems.map((item, idx) => (
                              <DraggableScheduleItem
                                key={`${item.IdGrupo}-${item.Dia}-${item.HoraInicio}-${item.HoraFin}-${idx}`}
                                item={item}
                                onClick={() => { setSelectedGroup(item); setDialogOpen(true); }}
                              />
                            ))}
                          </div>
                        )}
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