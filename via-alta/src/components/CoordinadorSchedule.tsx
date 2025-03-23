'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import SubjectList from './SubjectList';
import SubjectSearch from './SubjectSearch';
import { toast } from 'sonner';

interface Subject {
  id: number
  title: string
  salon: string
  professor: string
  credits: number
  semester: number
  hours: { day: string; time: string }[]
}

interface SubjectsProps {
  subjects: Subject[]
}

const daysOfWeek = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
const timeSlots = [
  '7:00', '7:30', '8:00', '8:30', '9:00', '9:30', '10:00', '10:30',
  '11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '14:00',
  '14:30', '15:00', '15:30', '16:00'
];

// Convert times to minutes for calculations
const timeToMinutes = (time: string): number => {
  const [hour, minute] = time.split(':').map(Number);
  return hour * 60 + minute;
};

const minutesToTime = (minutes: number): string => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};

// Storage keys for schedule persistence
const SCHEDULE_STORAGE_KEY = 'via-alta-schedule';
const LAST_SAVED_KEY = 'via-alta-schedule-last-saved';

export default function CoordinadorSchedule({ subjects }: SubjectsProps) {
  const [activeDayIndex, setActiveDayIndex] = useState(0);
  const [allSubjects, setAllSubjects] = useState<Subject[]>(subjects);
  const [selectedSubjects, setSelectedSubjects] = useState<Subject[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [lastSaved, setLastSaved] = useState<string | null>(null);

  useEffect(() => {
    loadScheduleFromStorage();
  }, []);

  useEffect(() => {
    setAllSubjects(subjects);
  }, [subjects]);

  const loadScheduleFromStorage = () => {
    try {
      const savedSchedule = localStorage.getItem(SCHEDULE_STORAGE_KEY);
      const savedTimestamp = localStorage.getItem(LAST_SAVED_KEY);
      
      if (savedSchedule) {
        const parsedSchedule = JSON.parse(savedSchedule) as Subject[];
        setSelectedSubjects(parsedSchedule);
        
        if (savedTimestamp) {
          setLastSaved(new Date(savedTimestamp).toLocaleString());
        }
        
        toast.success('Horario cargado correctamente');
      }
    } catch (error) {
      console.error('Error al cargar el horario:', error);
      toast.error('No se pudo cargar el horario guardado');
    }
  };

  const saveScheduleToStorage = () => {
    try {
      const now = new Date();
      localStorage.setItem(SCHEDULE_STORAGE_KEY, JSON.stringify(selectedSubjects));
      localStorage.setItem(LAST_SAVED_KEY, now.toISOString());
      setLastSaved(now.toLocaleString());
      toast.success('Horario guardado correctamente');
    } catch (error) {
      console.error('Error al guardar el horario:', error);
      toast.error('No se pudo guardar el horario');
    }
  };

  const handleSubjectSelect = (subject: Subject) => {
    if (!selectedSubjects.some((s) => s.id === subject.id)) {
      setSelectedSubjects([...selectedSubjects, subject]);
    }
  };

  const removeSelectedSubject = (subjectId: number) => {
    setSelectedSubjects(selectedSubjects.filter((s) => s.id !== subjectId));
  };

  const findSubject = (day: string, time: string) => {
    const allDisplaySubjects = [
      ...subjects,
      ...selectedSubjects.filter((selected) => !subjects.some((s) => s.id === selected.id)),
    ];

    return allDisplaySubjects.find((subject) => subject.hours.some(
      (hour) => hour.day.toLowerCase() === day.toLowerCase() && hour.time === time,
    ));
  };

  const navigateDay = (direction: number) => {
    const newIndex = (activeDayIndex + direction + daysOfWeek.length) % daysOfWeek.length;
    setActiveDayIndex(newIndex);
  };

  // Create a matrix representation of the schedule
  const scheduleMatrix = useMemo(() => {
    const matrix: { [key: string]: { [key: string]: Subject[] } } = {};
    
    timeSlots.forEach(time => {
      matrix[time] = {};
      daysOfWeek.forEach(day => {
        matrix[time][day] = [];
      });
    });
    
    const allDisplaySubjects = [
      ...subjects,
      ...selectedSubjects.filter((selected) => !subjects.some((s) => s.id === selected.id)),
    ];

    allDisplaySubjects.forEach(subject => {
      // Skip if subject or hours is undefined
      if (!subject || !subject.hours) {
        console.warn('Invalid subject found:', subject);
        return;
      }

      subject.hours.forEach(hour => {
        // Skip if hour is invalid
        if (!hour || !hour.time || !hour.day) {
          console.warn('Invalid hour found in subject:', subject.id, hour);
          return;
        }

        const time = hour.time;
        const day = hour.day;
        if (matrix[time] && matrix[time][day]) {
          matrix[time][day].push(subject);
        }
      });
    });

    return matrix;
  }, [subjects, selectedSubjects]);

  const moveSubject = (subject: Subject, toDay: string, toTime: string) => {
    const updatedSubjects = selectedSubjects.map(s => {
      if (s.id === subject.id) {
        // Update the hours array of the subject
        return {
          ...s,
          hours: s.hours.map(hour => {
            // Update the matching hour to the new day and time
            if (hour.day === subject.hours[0].day && hour.time === subject.hours[0].time) {
              return { day: toDay, time: toTime };
            }
            return hour;
          })
        };
      }
      return s;
    });
    setSelectedSubjects(updatedSubjects);
  };

  // Draggable cell component
  const DraggableCell = ({ subject }: { subject: Subject }) => {
    const [{ isDragging }, dragRef] = useDrag(() => ({
      type: 'subject',
      item: subject,
      collect: (monitor) => ({
        isDragging: monitor.isDragging(),
      }),
    }));

    return (
      <div
        ref={(node) => {
          if (typeof dragRef === 'function') {
            dragRef(node);
          }
        }}
        className={cn(
          'p-1 text-xs cursor-pointer rounded-md border border-gray-200 bg-white shadow-sm h-full',
          'hover:shadow-md transition-shadow flex justify-center items-center',
          isDragging && 'opacity-50'
        )}
        onClick={() => setSelectedSubject(subject)}
      >
        <div className="truncate font-medium text-red-700">
          {subject.title}
        </div>
      </div>
    );
  };

  // Droppable cell component
  const Cell = ({ day, time }: { day: string; time: string }) => {
    const items = scheduleMatrix[time][day];
    const [{ isOver }, dropRef] = useDrop(() => ({
      accept: 'subject',
      drop: (item: Subject) => {
        moveSubject(item, day, time);
        toast.success(`Moved ${item.title} to ${day} at ${time}`);
      },
      collect: (monitor) => ({
        isOver: monitor.isOver(),
      }),
    }));

    return (
      <div
        ref={(node) => {
          if (typeof dropRef === 'function') {
            dropRef(node);
          }
        }}
        className={cn(
          'border border-gray-200 p-1 relative h-full',
          items.length > 0 ? 'bg-blue-50/50' : 'bg-white',
          isOver && 'bg-gray-100'
        )}
      >
        <div className="flex flex-col gap-0.5 h-full">
          {items.map((item, index) => (
            <DraggableCell 
              key={`${item.professor}-${item.title}-${index}`} 
              subject={item}
            />
          ))}
        </div>
      </div>
    );
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="w-full pb-8 flex justify-between flex-col sm:flex-row gap-4">
        <div className="overflow-x-auto flex-1">
          <div className="flex items-center justify-between mb-4">
            <p className="text-2xl font-bold">Vista de Horario</p>
            <div className="flex items-center gap-4">
              {lastSaved && (
                <div className="text-sm text-muted-foreground">
                  Último guardado: {lastSaved}
                </div>
              )}
              <Button
                onClick={saveScheduleToStorage}
                variant="outline"
                className="border-red-700 text-red-700 hover:bg-red-50"
              >
                Guardar Horario
              </Button>
            </div>
          </div>
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

        <div className="w-1/4 pl-4">
          <p className="text-2xl font-bold">Lista de Materias</p>
          <SubjectList subjects={subjects} />
          {selectedSubjects.length > 0 && (
            <div className="mt-4 mb-4">
              <p className="text-lg font-semibold mb-2">Materias Seleccionadas</p>
              <div className="space-y-2">
              {selectedSubjects.map((subject, index) => (
                  <Card key={`${subject.id}-${index}`} className="p-3 flex justify-between items-center">
                      <div className="overflow-hidden">
                          <p className="font-medium truncate">{subject.title}</p>
                          <p className="text-xs text-muted-foreground truncate">
                              {subject.professor} • {subject.credits} créditos
                          </p>
                      </div>
                      <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeSelectedSubject(subject.id)}
                          className="h-8 w-8 text-red-500 flex-shrink-0"
                      >
                          <X className="h-4 w-4" />
                      </Button>
                  </Card>
              ))}
              </div>
            </div>
          )}

          <SubjectSearch subjects={allSubjects} onSubjectSelect={handleSubjectSelect} />
        </div>
      </div>
    </DndProvider>
  );
}
