'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { GeneralScheduleItem } from '@/lib/models/general-schedule';

interface DraggableCellProps {
  subject: GeneralScheduleItem;
  occurrence: { day: string; time: string };
  widthClass?: string;
}

const daysOfWeek = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
const timeSlots = [
  '07:00', '07:30', '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
  '11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '14:00',
  '14:30', '15:00', '15:30', '16:00'
];

export default function CoordinadorSchedule({ subjects }: { subjects: GeneralScheduleItem[] }) {
  const [allSubjects, setAllSubjects] = useState<GeneralScheduleItem[]>(subjects);
  const [selectedSubjects, setSelectedSubjects] = useState<GeneralScheduleItem[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<GeneralScheduleItem | null>(null);

  useEffect(() => {
    setAllSubjects(subjects);
  }, [subjects]);

  useEffect(() => {
    setSelectedSubjects(subjects);
  }, [subjects]);

  const handleSubjectSelect = (subject: GeneralScheduleItem) => {
    if (!selectedSubjects.some((s) => s.IdGrupo === subject.IdGrupo)) {
      setSelectedSubjects([...selectedSubjects, subject]);
    }
  };

  const removeSelectedSubject = (subjectId: number) => {
    setSelectedSubjects(selectedSubjects.filter((s) => s.IdGrupo !== subjectId));
  };

  const findSubject = (day: string, time: string) => {
    const allDisplaySubjects = [
      ...selectedSubjects,
      ...allSubjects.filter(s => !selectedSubjects.some(ss => ss.IdGrupo === s.IdGrupo)),
    ];
    return allDisplaySubjects.find((subject) => subject.Dia.toLowerCase() === day.toLowerCase() && subject.HoraInicio === time);
  };

  function normalizeDay(day: string): string {
    switch (day.toLowerCase()) {
      case 'monday':
      case 'Lun':
      case 'lun': 
        return 'Lunes';
      case 'tuesday':
      case 'Mar':
        return 'Martes';
      case 'wednesday':
      case 'Mié':
        return 'Miércoles';
      case 'thursday':
      case 'Jue':
        return 'Jueves';
      case 'friday':
      case 'Vie':
        return 'Viernes';    
      default:
        return day;
    }
  }

  function timeToMinutes(time: string): number {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
  }
  
  function minutesToTime(minutes: number): string {
    const hh = String(Math.floor(minutes / 60)).padStart(2, '0');
    const mm = String(minutes % 60).padStart(2, '0');
    return `${hh}:${mm}`;
  }

  const scheduleMatrix = useMemo(() => {
    const matrix: { [key: string]: { [key: string]: GeneralScheduleItem[] } } = {};
    timeSlots.forEach(time => {
      matrix[time] = {};
      daysOfWeek.forEach(day => {
        matrix[time][day] = [];
      });
    });
    const allDisplaySubjects = [
      ...selectedSubjects,
      ...subjects.filter(s => !selectedSubjects.some(ss => ss.IdGrupo === s.IdGrupo))
    ];
    allDisplaySubjects.forEach(subject => {
      if (!subject?.Dia || !subject.HoraInicio || !subject.HoraFin) return;
      const normalizedDay = normalizeDay(subject.Dia);
      const start = timeToMinutes(subject.HoraInicio);
      const end = timeToMinutes(subject.HoraFin);
      for (let t = start; t < end; t += 30) {
        const slot = minutesToTime(t);
        if (matrix[slot]?.[normalizedDay]) {
          matrix[slot][normalizedDay].push(subject);
        }
      }
    });
    return matrix;
  }, [subjects, selectedSubjects]);

  const moveSubject = (
    dragItem: { subject: GeneralScheduleItem; occurrence: { day: string; time: string } },
    toDay: string,
    toTime: string
  ) => {
    const { subject, occurrence } = dragItem;
    const updatedSubjects = selectedSubjects.map(s => {
      if (s.IdGrupo === subject.IdGrupo) {
        // Assume 1-hour duration for now
        const start = timeToMinutes(toTime);
        const end = start + 60;
        return {
          ...s,
          Dia: toDay,
          HoraInicio: toTime,
          HoraFin: minutesToTime(end),
        };
      }
      return s;
    });
    setSelectedSubjects(updatedSubjects);
    
    toast.success(`Moved ${subject.MateriaNombre || subject.IdGrupo} from ${occurrence.day} ${occurrence.time} to ${toDay} at ${toTime}`);
  };

  const getSubjectColor = (subjectTitle: string): string => {
    const subjectColors: { [key: string]: string } = {
        'Matemáticas': 'text-blue-500',
        'Inglés': 'text-green-500',
        'Ciencias': 'text-yellow-500',
        'Historia': 'text-purple-500',
        'Arte': 'text-pink-500',
    };
    return subjectColors[subjectTitle] || 'text-red-700'; // default color
};

  const Cell = ({ day, time }: { day: string; time: string }) => {
    const items = scheduleMatrix[time][day];
    const getWidthClass = (total: number, index: number) => {
      switch(total) {
        case 1: return 'w-full';
        case 2: return 'w-[calc(50%-2px)]';
        case 3: return 'w-[calc(33.333%-2px)]';
        default: return 'w-[calc(25%-2px)]';
      }
    };
    return (
      <div
        className={cn(
          'border border-gray-200 p-1 relative h-full',
          items.length > 0 ? 'bg-blue-50/50' : 'bg-white'
        )}
      >
        <div className="flex flex-row gap-0.5 h-full">
          {items.map((item, index) => (
            <div
              key={`${item.IdGrupo}-${item.MateriaNombre || item.IdGrupo}-${index}`}
              className={cn(
                'p-1 text-xs rounded-md border border-gray-200 bg-white shadow-sm h-full',
                'flex justify-center items-center',
                getWidthClass(items.length, index)
              )}
              onClick={() => setSelectedSubject(item)}
            >
              <div className={cn('truncate font-medium', getSubjectColor(item.MateriaNombre || String(item.IdGrupo)))}>
                {item.MateriaNombre || item.IdGrupo}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="w-full pb-8 flex justify-between flex-col lg:flex-row gap-4">
      <div className="overflow-x-auto flex-1">
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
      <div className="w-full lg:w-1/4 pl-0 lg:pl-4">
        <p className="text-2xl font-bold">Lista de Materias</p>
        {selectedSubjects.length > 0 && (
          <div className="mt-4 mb-4">
            <p className="text-lg font-semibold mb-2">Materias Seleccionadas</p>
            <div className="space-y-2">
              {selectedSubjects.map((subject) => (
                <Card key={subject.IdGrupo} className="p-3 flex justify-between items-center">
                  <div>
                    <p className="font-medium">{subject.MateriaNombre || subject.IdGrupo}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeSelectedSubject(subject.IdGrupo)}
                    className="h-8 w-8 text-red-500"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}