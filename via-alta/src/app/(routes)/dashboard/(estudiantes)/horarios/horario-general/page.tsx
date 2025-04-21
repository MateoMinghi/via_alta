'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import SubjectList from '@/components/SubjectList';
import SubjectSearch from '@/components/SubjectSearch';

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
  };  // Helper to find schedule item in a cell
  const findScheduleItem = (day: string, time: string) => {
    // Add debugging to see what schedule data we're working with
    if (day === 'Lunes' && time === '09:00') {
      console.log('All schedule items:', schedule);
    }
    
    // Format the time for comparison (remove leading zeros)
    const formattedTime = time.replace(/^0/, '');
    
    // Find items where the day matches and the HoraInicio contains the time we're looking for
    const item = schedule.find((item) => {
      if (!item || !item.Dia || !item.HoraInicio) return false;
      
      // Check if the day matches exactly
      const dayMatches = item.Dia === day;
      
      // For time, we need to handle different formats:
      // The database might store it as "9:00-10:00" but UI is looking for "09:00"
      const timeMatches = 
        // First try exact match with possible leading zero stripped
        item.HoraInicio.replace(/^0/, '') === formattedTime ||
        // Then try checking if it's the start of a range (e.g., "9:00-10:00")
        item.HoraInicio.replace(/^0/, '').startsWith(formattedTime) ||
        // Finally try checking if it's part of a time range
        item.HoraInicio.includes(formattedTime);
      
      return dayMatches && timeMatches;
    });
    
    // Detailed debug for specific cells
    if (day === 'Lunes' && (time === '09:00' || time === '10:00' || time === '11:00')) {
      console.log(`Debug cell ${day} ${time}:`, { 
        lookingFor: { day, time, formattedTime },
        foundItem: item,
        matchingItems: schedule.filter(i => 
          i && i.Dia === day && i.HoraInicio && 
          (i.HoraInicio.includes(formattedTime.substring(0, 4)) || 
           i.HoraInicio.replace(/^0/, '').includes(formattedTime.substring(0, 4)))
        )
      });
    }
    
    return item;
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
        <div className="w-full">
          <div className="grid grid-cols-[100px_repeat(5,1fr)] grid-rows-[auto_repeat(19,2.5rem)] w-full">
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
                {daysOfWeek.map((day) => {
                  const item = findScheduleItem(day, time);
                  return (
                    <div
                      key={`${day}-${time}`}
                      className={cn(
                        'border border-gray-200 p-1 relative h-full',
                        item ? 'bg-blue-50/50' : 'bg-white'
                      )}
                    >
                      {item && (
                        <div className="p-1 text-xs rounded-md border border-gray-200 bg-white shadow-sm h-full flex flex-col justify-center items-center">
                          <div className="truncate font-medium text-blue-500">{item.MateriaNombre || 'Materia'}</div>
                          <div className="truncate text-xs text-gray-500">{item.ProfesorNombre || ''}</div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
      {isLoading && <div className="text-center text-gray-500 mt-4">Cargando horario...</div>}
    </div>
  );
}