'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import SubjectList from '@/components/SubjectList';
import SubjectSearch from '@/components/SubjectSearch';
import GroupInfoDialog from '@/components/GroupInfoDialog';

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
      {/* Replace grid with table for rowSpan support */}
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
                  // Show all groups that span this time slot
                  const slotMinutes = timeToMinutes(time);
                  const items = schedule.filter(i => {
                    if (i.Dia !== day) return false;
                    const start = timeToMinutes(i.HoraInicio);
                    const end = timeToMinutes(i.HoraFin);
                    return slotMinutes >= start && slotMinutes < end;
                  });
                  return (
                    <td key={`${day}-${time}`} className="border p-2 align-top">
                      {items.length > 0 ? (
                        <div className="flex flex-col gap-1">
                          {items.map(item => (
                            <div
                              key={item.IdGrupo}
                              className="bg-blue-50 rounded p-1 mb-1 cursor-pointer hover:bg-blue-100"
                              onClick={() => {
                                setSelectedGroup(item);
                                setDialogOpen(true);
                              }}
                            >
                              <div className="text-xs font-medium text-blue-500 truncate">{item.MateriaNombre}</div>
                            </div>
                          ))}
                        </div>
                      ) : null}
                    </td>
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
  );
}