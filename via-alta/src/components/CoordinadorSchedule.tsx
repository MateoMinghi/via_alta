import React, { useMemo, useState, useEffect } from 'react';
import { Card } from './ui/card';
import { cn } from '@/lib/utils';
import { GeneralScheduleItem } from '@/lib/models/general-schedule';
import GroupInfoDialog from './GroupInfoDialog';
import { Pencil, Trash2 } from 'lucide-react';

// Días de la semana
const daysOfWeek = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
// Franjas horarias (formato 24h)
const timeSlots = [
  '07:00', '07:30', '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
  '11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '14:00',
  '14:30', '15:00', '15:30', '16:00'
];

// Color por materia (hash simple)
const getSubjectColor = (subjectName: string) => {
  const colorOptions = [
    'bg-blue-50 text-blue-700 border-blue-400',
    'bg-green-50 text-green-700 border-green-400',
    'bg-amber-50 text-amber-700 border-amber-400',
    'bg-purple-50 text-purple-700 border-purple-400',
    'bg-pink-50 text-pink-700 border-pink-400',
    'bg-indigo-50 text-indigo-700 border-indigo-400',
    'bg-rose-50 text-rose-700 border-rose-400',
    'bg-teal-50 text-teal-700 border-teal-400',
    'bg-cyan-50 text-cyan-700 border-cyan-400',
    'bg-orange-50 text-orange-700 border-orange-400',
    'bg-lime-50 text-lime-700 border-lime-400',
    'bg-emerald-50 text-emerald-700 border-emerald-400',
    'bg-sky-50 text-sky-700 border-sky-400',
    'bg-violet-50 text-violet-700 border-violet-400',
    'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-400',
    'bg-red-50 text-red-700 border-red-400',
  ];
  let hash = 0;
  for (let i = 0; i < subjectName.length; i++) {
    hash = ((hash << 5) - hash) + subjectName.charCodeAt(i);
    hash |= 0;
  }
  return colorOptions[Math.abs(hash) % colorOptions.length];
};

function normalizeDay(day: string | undefined | null): string {
  if (!day) return '';
  switch (day.toLowerCase()) {
    case 'monday':
    case 'lun':
    case 'lunes': return 'Lunes';
    case 'tuesday':
    case 'mar':
    case 'martes': return 'Martes';
    case 'wednesday':
    case 'mié':
    case 'miercoles':
    case 'miércoles': return 'Miércoles';
    case 'thursday':
    case 'jue':
    case 'jueves': return 'Jueves';
    case 'friday':
    case 'vie':
    case 'viernes': return 'Viernes';
    default: return day || '';
  }
}

function timeToMinutes(time: string | undefined | null): number {
  if (!time) return 0;
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

// Main component
export default function CoordinadorSchedule({ 
  subjects, 
  onEdit, 
  onDelete 
}: { 
  subjects: GeneralScheduleItem[],
  onEdit?: (group: GeneralScheduleItem) => void,
  onDelete?: (group: GeneralScheduleItem) => void
}) {
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<GeneralScheduleItem | null>(null);

  // Matrix for schedule
  const scheduleMatrix = useMemo(() => {
    const matrix: { [time: string]: { [day: string]: GeneralScheduleItem[] } } = {};
    timeSlots.forEach(time => {
      matrix[time] = {};
      daysOfWeek.forEach(day => {
        matrix[time][day] = [];
      });
    });
    subjects.forEach(item => {
      const normalizedDay = normalizeDay(item.Dia);
      const startTime = timeToMinutes(item.HoraInicio);
      const endTime = timeToMinutes(item.HoraFin);
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
  }, [subjects]);

  // Handler for clicking a subject - now only handles dialog
  const handleSubjectClick = (e: React.MouseEvent, item: GeneralScheduleItem) => {
    e.stopPropagation();
    setSelectedGroup(item);
    setDialogOpen(true);
  };

  // Handler for clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const isDialog = target.closest('[role="dialog"]');
      
      if (!isDialog) {
        setSelectedGroupId(null);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Cell renderer
  const Cell = ({ day, time }: { day: string; time: string }) => {
    const items = scheduleMatrix[time]?.[day] || [];

    return (
      <div 
        className="border border-gray-200 p-1 relative h-full"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-row gap-0.5 h-full">
          {items.map((item, idx) => (
            <div
              key={`${item.IdGrupo}-${idx}`}
              className={cn(
                'subject-cell p-2 text-xs rounded-md border shadow-sm h-full flex-1 min-w-0 relative',
                getSubjectColor(item.MateriaNombre || ''),
                'cursor-pointer hover:shadow-md transition-all duration-200'
              )}
              onClick={(e) => handleSubjectClick(e, item)}
            >
              <div className="font-medium truncate">
                {item.MateriaNombre}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="w-full flex flex-col gap-4">
      <div className="overflow-x-auto">
        <div className="min-w-[800px]">
          <div className="grid grid-cols-[100px_repeat(5,1fr)] grid-rows-[auto_repeat(19,2.5rem)]">
            {/* Header */}
            <div className="h-10" />
            {daysOfWeek.map((day) => (
              <div key={day} className="h-10 flex items-center justify-center font-medium border-b">
                {day}
              </div>
            ))}
            {/* Time rows */}
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
      {/* Dialog for group info */}
      <GroupInfoDialog 
        open={dialogOpen} 
        onClose={() => {
          setDialogOpen(false);
          setSelectedGroup(null);
        }} 
        group={selectedGroup}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    </div>
  );
}
