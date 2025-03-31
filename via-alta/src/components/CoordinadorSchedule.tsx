'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import SubjectList from './SubjectList';
import SubjectSearch from './SubjectSearch';
import { toast } from 'sonner';
import { IndividualSubject } from '@/components/pages/horario-general/IndividualSubject';

// Define la interfaz para una materia
// Una materia incluye id, título, salón, profesor, créditos, semestre y horarios
interface Subject {
  id: number;
  title: string;
  salon: string;
  professor: string;
  credits: number;
  semester: number;
  hours: { day: string; time: string }[];
}

// Define las propiedades que recibe el componente CoordinadorSchedule
// Recibe un arreglo de materias (subjects)
interface SubjectsProps {
  subjects: Subject[];
}

interface DraggableCellProps {
  subject: Subject;
  occurrence: { day: string; time: string };
  widthClass?: string;
}

// Constantes para los días de la semana y los intervalos de tiempo
const daysOfWeek = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
const timeSlots = [
  '07:00', '07:30', '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
  '11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '14:00',
  '14:30', '15:00', '15:30', '16:00'
];

// Componente principal para gestionar el horario del coordinador
// Recibe las materias como parámetro y permite visualizarlas, seleccionarlas y moverlas
export default function CoordinadorSchedule({ subjects }: SubjectsProps) {
  // Estados para manejar el día activo, todas las materias, materias seleccionadas, materia seleccionada y última vez guardada
  const [allSubjects, setAllSubjects] = useState<Subject[]>(subjects);
  const [selectedSubjects, setSelectedSubjects] = useState<Subject[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);

  // Efecto para inicializar las materias al montar el componente
  useEffect(() => {
    setAllSubjects(subjects);
  }, [subjects]);

  useEffect(() => {
    setSelectedSubjects(subjects);
  }, [subjects]);

  // Función para manejar la selección de una materia
  // Agrega la materia seleccionada al estado de materias seleccionadas si no está ya incluida
  const handleSubjectSelect = (subject: Subject) => {
    if (!selectedSubjects.some((s) => s.id === subject.id)) {
      setSelectedSubjects([...selectedSubjects, subject]);
    }
  };

  // Función para eliminar una materia seleccionada
  // Filtra la materia por su id y actualiza el estado
  const removeSelectedSubject = (subjectId: number) => {
    setSelectedSubjects(selectedSubjects.filter((s) => s.id !== subjectId));
  };

  // Función para encontrar una materia en un día y hora específicos
  // Busca en todas las materias y materias seleccionadas
  const findSubject = (day: string, time: string) => {
    const allDisplaySubjects = [
      ...subjects,
      ...selectedSubjects.filter(selected => !subjects.some(s => s.id === selected.id)),
    ];

    return allDisplaySubjects.find((subject) => subject.hours.some(
      (hour) => hour.day.toLowerCase() === day.toLowerCase() && hour.time === time,
    ));
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

  // Funciones auxiliares para convertir tiempo a minutos y viceversa
  function timeToMinutes(time: string): number {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
  }
  
  function minutesToTime(minutes: number): string {
    const hh = String(Math.floor(minutes / 60)).padStart(2, '0');
    const mm = String(minutes % 60).padStart(2, '0');
    return `${hh}:${mm}`;
  }

  // Crea una representación matricial del horario
  // Agrupa las materias por día y hora en una estructura de matriz
  const scheduleMatrix = useMemo(() => {
    const matrix: { [key: string]: { [key: string]: Subject[] } } = {};
  
    timeSlots.forEach(time => {
      matrix[time] = {};
      daysOfWeek.forEach(day => {
        matrix[time][day] = [];
      });
    });
  
    // Combine subjects and selectedSubjects (avoid duplicates)
    const allDisplaySubjects = [
      ...selectedSubjects,
      ...subjects.filter(s => !selectedSubjects.some(ss => ss.id === s.id))
    ];
  
    allDisplaySubjects.forEach(subject => {
      if (!subject?.hours) return;
      subject.hours.forEach(hour => {
        if (!hour?.time || !hour.day) return;
        const normalizedDay = normalizeDay(hour.day);
        const start = timeToMinutes(hour.time);
        const end = start + 60; // Assuming 1-hour classes
  
        for (let t = start; t < end; t += 30) {
          const slot = minutesToTime(t);
          if (matrix[slot]?.[normalizedDay]) {
            matrix[slot][normalizedDay].push(subject);
          }
        }
      });
    });
  
    return matrix;
  }, [subjects, selectedSubjects]);

  // Función para mover una materia a un nuevo día y hora
  // Actualiza el estado de las materias seleccionadas y muestra un mensaje de éxito
  const moveSubject = (
    dragItem: { subject: Subject; occurrence: { day: string; time: string } },
    toDay: string,
    toTime: string
  ) => {
    const { subject, occurrence } = dragItem;
    const updatedSubjects = selectedSubjects.map(s => {
      if (s.id === subject.id) {
        return {
          ...s,
          hours: s.hours.map(hour =>
            (hour.day.toLowerCase() === occurrence.day.toLowerCase() && hour.time === occurrence.time)
              ? { day: toDay, time: toTime }
              : hour
          )
        };
      }
      return s;
    });
    setSelectedSubjects(updatedSubjects);
    
    toast.success(`Moved ${subject.title} from ${occurrence.day} ${occurrence.time} to ${toDay} at ${toTime}`);
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

  // Componente para celdas arrastrables
  // Permite arrastrar materias dentro del horario
  const DraggableCell = ({ subject, occurrence, widthClass }: DraggableCellProps) => {
    const [{ isDragging }, dragRef] = useDrag(() => ({
      type: 'subject',
      // send both the subject and the occurrence details for this cell
      item: { subject, occurrence },
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
          isDragging && 'opacity-50',
          widthClass
        )}
        onClick={() => setSelectedSubject(subject)}
      >
        <div className={cn('truncate font-medium', getSubjectColor(subject.title))}>
          {subject.title}
        </div>
      </div>
    );  
  };

  // Componente para celdas dropeables
  // Permite soltar materias en un día y hora específicos
  const Cell = ({ day, time }: { day: string; time: string }) => {
    const items = scheduleMatrix[time][day];
    const [{ isOver }, dropRef] = useDrop(() => ({
      accept: 'subject',
      drop: (dragItem: { subject: Subject; occurrence: { day: string; time: string } }) => {
        moveSubject(dragItem, day, time);
      },
      collect: (monitor) => ({
        isOver: monitor.isOver(),
      }),
    }));

    // Calculate width class based on number of items in the cell
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
        <div className="flex flex-row gap-0.5 h-full">
          {items.map((item, index) => (
            <DraggableCell 
              key={`${item.professor}-${item.title}-${index}`}
              subject={item}
              occurrence={{ day, time }} // pass the cell's day/time as the occurrence
              widthClass={getWidthClass(items.length, index)}
            />
          ))}
        </div>
      </div>
    );
  };

  return (
    // Renderiza el horario, lista de materias y funcionalidades de arrastrar y soltar
    // Incluye botones para guardar el horario y mostrar la última vez guardada
    <DndProvider backend={HTML5Backend}>
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
          <SubjectList subjects={subjects} />
          {selectedSubjects.length > 0 && (
            <div className="mt-4 mb-4">
              <p className="text-lg font-semibold mb-2">Materias Seleccionadas</p>
              <div className="space-y-2">
                {selectedSubjects.map((subject) => (
                  <Card key={subject.id} className="p-3 flex justify-between items-center">
                    <div>
                      <p className="font-medium">{subject.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {subject.professor}
                        {' '}
                        •
                        {subject.credits}
                        {' '}
                        créditos
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeSelectedSubject(subject.id)}
                      className="h-8 w-8 text-red-500"
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

      {/* Render the IndividualSubject dialog when a subject on the grid is clicked */}
      {selectedSubject && (
        <IndividualSubject
          subject={{
            teacher: selectedSubject.professor,
            subject: selectedSubject.title,
            classroom: selectedSubject.salon,
            semester: selectedSubject.semester,
            day: selectedSubject.hours[0]?.day || '',
            time: selectedSubject.hours[0]?.time || '',
            endTime: (() => {
              const time = selectedSubject.hours[0]?.time;
              if (!time) return '';
              const [h, m] = time.split(':').map(Number);
              const date = new Date();
              date.setHours(h, m, 0, 0);
              date.setHours(date.getHours() + 1);
              return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
            })()
          }}
          isOpen={!!selectedSubject}
          onClose={() => setSelectedSubject(null)}
          onUpdate={(updatedScheduleItem) => {
            setSelectedSubjects(prev =>
              prev.map(s => {
                if (s.professor === updatedScheduleItem.teacher && 
                    s.title === updatedScheduleItem.subject) {
                  return {
                    ...s,
                    professor: updatedScheduleItem.teacher,
                    title: updatedScheduleItem.subject,
                    salon: updatedScheduleItem.classroom,
                    semester: updatedScheduleItem.semester,
                    hours: [{
                      day: updatedScheduleItem.day,
                      time: updatedScheduleItem.time
                    }]
                  };
                }
                return s;
              })
            );
            setSelectedSubject(null);
          }}
          onDelete={(scheduleItem) => {
            setSelectedSubjects(prev =>
              prev.filter(s => 
                !(s.professor === scheduleItem.teacher && 
                  s.title === scheduleItem.subject)
              )
            );
            setSelectedSubject(null);
          }}
        />
      )}
    </DndProvider>
  );
}