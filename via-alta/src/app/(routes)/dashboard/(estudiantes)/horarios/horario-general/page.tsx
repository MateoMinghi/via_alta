'use client';

import React, { useState, useEffect } from 'react';
import GroupInfoDialog from '@/components/GroupInfoDialog';
import { cn } from '@/lib/utils';

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

  // Helper to convert HH:MM to minutes
  const timeToMinutes = (time: string | undefined | null): number => {
    if (!time) return 0;
    const [h, m] = time.split(":").map(Number);
    return h * 60 + m;
  };

  // Function to generate a consistent color based on subject name
  const getSubjectColor = (subjectTitle: string): { text: string; border: string; bg: string } => {
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
    
    // Create a basic hash of the subject name to get a consistent color
    let hashCode = 0;
    for (let i = 0; i < subjectTitle.length; i++) {
      hashCode = ((hashCode << 5) - hashCode) + subjectTitle.charCodeAt(i);
      hashCode = hashCode & hashCode; 
    }
    
    // Use the hash to select a color
    const colorIndex = Math.abs(hashCode) % colorOptions.length;
    return colorOptions[colorIndex];
  };

  // Create a matrix representation of the schedule
  const scheduleMatrix = React.useMemo(() => {
    const matrix: { [key: string]: { [key: string]: GeneralScheduleItem[] } } = {};
  
    timeSlots.forEach(time => {
      matrix[time] = {};
      daysOfWeek.forEach(day => {
        matrix[time][day] = [];
      });
    });
  
    // Fill the matrix with scheduled items
    schedule.forEach(item => {
      if (!item?.Dia || !item?.HoraInicio) return;
      const start = timeToMinutes(item.HoraInicio);
      const end = timeToMinutes(item.HoraFin);
  
      // Add the item to each 30-minute slot it spans
      for (let t = start; t < end; t += 30) {
        const slot = `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`;
        if (matrix[slot]?.[item.Dia]) {
          matrix[slot][item.Dia].push(item);
        }
      }
    });
  
    return matrix;
  }, [schedule]);

  // Component for a cell in the schedule grid
  const Cell = ({ day, time }: { day: string; time: string }) => {
    // Get items that span this time slot
    const items = scheduleMatrix[time]?.[day] || [];
    
    return (
      <div className={cn(
        'border border-gray-200 p-1 relative h-full',
        items.length > 0 ? 'bg-blue-50/50' : 'bg-white'
      )}>
        <div className="flex flex-row gap-0.5 h-full">
          {items.map((item, index) => {
            const colors = getSubjectColor(item.MateriaNombre || item.NombreCarrera || '');
            // Calculate width based on number of items
            const widthClass = items.length === 1 ? 'w-full' : 
                               items.length === 2 ? 'w-[calc(50%-2px)]' :
                               items.length === 3 ? 'w-[calc(33.333%-2px)]' : 'w-[calc(25%-2px)]';
            
            return (
              <div
                key={`${item.IdGrupo}-${index}`}
                className={cn(
                  'p-1 text-xs rounded-md border shadow-sm h-full',
                  'flex flex-col justify-between',
                  `border-l-4 ${colors.border} ${colors.bg}`,
                  'cursor-pointer hover:shadow-md transition-all',
                  widthClass
                )}
                onClick={() => {
                  setSelectedGroup(item);
                  setDialogOpen(true);
                }}
              >
                <div className={cn('font-medium truncate', colors.text)}>
                  {item.MateriaNombre || item.NombreCarrera}
                </div>
                {/* Teacher name display removed as requested */}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
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
        <div className="min-w-[800px]">
          <div className="grid grid-cols-[100px_repeat(5,1fr)] grid-rows-[auto_repeat(19,2.5rem)]">
            <div className="h-10" />
            {daysOfWeek.map((day) => (
              <div key={day} className="h-10 flex items-center justify-center font-medium border-b">
                {day}
              </div>
            ))}

            {timeSlots.map((time) => (
              <React.Fragment key={time}>
                <div className="flex items-start justify-end pr-2 text-sm text-muted-foreground -mt-2">
                  {time}
                </div>
                {daysOfWeek.map((day) => (
                  <Cell key={`${day}-${time}`} day={day} time={time} />
                ))}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
      
      <GroupInfoDialog open={dialogOpen} onClose={() => setDialogOpen(false)} group={selectedGroup} />
      {isLoading && <div className="text-center text-gray-500 mt-4">Cargando horario...</div>}
    </div>
  );
}