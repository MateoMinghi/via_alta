'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, Lock, Plus, GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';
import SubjectSearch from './SubjectSearch';
import { toast } from 'sonner';
import { IndividualSubject } from '@/components/pages/horario-general/IndividualSubject';

// Define la interfaz para una materia
// Una materia incluye id, título, salón, profesor, créditos, semestre, horarios y si es obligatoria
interface Subject {
  id: number;
  title: string;
  salon: string;
  professor: string;
  credits: number;
  semester: number;
  hours: { day: string; time: string }[];
  isObligatory?: boolean; // Bandera para indicar si la materia es obligatoria (no se puede mover)
}

// Define las propiedades que recibe el componente EstudianteSchedule
// Recibe un arreglo de materias (subjects)
interface SubjectsProps {
  subjects: Subject[];
}

interface DraggableCellProps {
  subject: Subject;
  occurrence: { day: string; time: string };
  widthClass?: string;
}

// Interfaz para tarjeta de materia arrastrable
interface DraggableSubjectCardProps {
  subject: Subject;
  onAdd: (subject: Subject) => void;
}

// Constantes para los días de la semana y los intervalos de tiempo
const daysOfWeek = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
const timeSlots = [
  '07:00', '07:30', '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
  '11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '14:00',
  '14:30', '15:00', '15:30', '16:00'
];

// Componente principal para gestionar el horario del estudiante
// Recibe las materias como parámetro y permite visualizarlas, seleccionarlas y moverlas
export default function EstudianteSchedule({ subjects }: SubjectsProps) {
  // Divide las materias de entrada en obligatorias y disponibles
  const [obligatorySubjects, setObligatorySubjects] = useState<Subject[]>([]);
  const [availableSubjects, setAvailableSubjects] = useState<Subject[]>([]);
  const [scheduledSubjects, setScheduledSubjects] = useState<Subject[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);

  // Inicializa las materias cuando se monta el componente
  useEffect(() => {
    // Marca algunas materias como obligatorias (lógica de ejemplo - puedes personalizarla)
    const obligatory = subjects.filter((s, i) => i % 3 === 0).map(s => ({...s, isObligatory: true}));
    const available = subjects.filter((s, i) => i % 3 !== 0);
    
    setObligatorySubjects(obligatory);
    setAvailableSubjects(available);
    // Inicialmente, todas las materias obligatorias están programadas
    setScheduledSubjects([...obligatory]);
  }, [subjects]);

  // Función para manejar la selección de una materia disponible y agregarla al horario
  // Las materias deben mantener sus horas originales cuando se agregan al horario
  const handleSubjectSelect = (subject: Subject) => {
    // Verifica si la materia ya está programada
    if (!scheduledSubjects.some((s) => s.id === subject.id)) {
      // Nos aseguramos de mantener las horas originales de la materia
      setScheduledSubjects([...scheduledSubjects, subject]);
      toast.success(`Materia "${subject.title}" agregada al horario`);
    } else {
      toast.error(`La materia "${subject.title}" ya está en el horario`);
    }
  };

  // Función para eliminar una materia del horario (solo las no obligatorias)
  const removeScheduledSubject = (subjectId: number) => {
    const subjectToRemove = scheduledSubjects.find(s => s.id === subjectId);
    
    // Si la materia es obligatoria, muestra un mensaje y no la elimina
    if (subjectToRemove?.isObligatory) {
      toast.error("No se pueden eliminar las materias obligatorias");
      return;
    }
    
    setScheduledSubjects(scheduledSubjects.filter(s => s.id !== subjectId));
  };

  // Función para encontrar una materia en un día y hora específicos
  // Busca en todas las materias programadas (obligatorias y seleccionadas)
  const findSubject = (day: string, time: string) => {
    return scheduledSubjects.find((subject) => subject.hours.some(
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
  
    // Usa las scheduledSubjects que incluyen tanto materias obligatorias como disponibles seleccionadas
    scheduledSubjects.forEach(subject => {
      if (!subject?.hours) return;
      subject.hours.forEach(hour => {
        if (!hour?.time || !hour.day) return;
        const normalizedDay = normalizeDay(hour.day);
        const start = timeToMinutes(hour.time);
        const end = start + 60; // Asumiendo clases de 1 hora
  
        for (let t = start; t < end; t += 30) {
          const slot = minutesToTime(t);
          if (matrix[slot]?.[normalizedDay]) {
            matrix[slot][normalizedDay].push(subject);
          }
        }
      });
    });
  
    return matrix;
  }, [scheduledSubjects]);

  // Función para mover una materia a un nuevo día y hora
  // Actualiza el estado de las materias seleccionadas y muestra un mensaje de éxito
  const moveSubject = (
    dragItem: { subject: Subject; occurrence: { day: string; time: string } },
    toDay: string,
    toTime: string
  ) => {
    const { subject, occurrence } = dragItem;
    
    // Verifica si la materia es obligatoria - no se pueden mover materias obligatorias
    if (subject.isObligatory) {
      toast.error(`No se puede mover "${subject.title}" porque es una materia obligatoria`);
      return;
    }
    
    const updatedSubjects = scheduledSubjects.map(s => {
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
    setScheduledSubjects(updatedSubjects);
    
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
      // Disable dragging for obligatory subjects
      canDrag: !subject.isObligatory,
      collect: (monitor) => ({
        isDragging: monitor.isDragging(),
      }),
    }));

    return (
      <div
        ref={(node) => {
          if (typeof dragRef === 'function' && !subject.isObligatory) {
            dragRef(node);
          }
        }}
        className={cn(
          'p-1 text-xs rounded-md border shadow-sm h-full',
          'flex justify-center items-center',
          'border-l-4 border-blue-400 bg-blue-50',
          !subject.isObligatory && 'cursor-pointer hover:shadow-md transition-shadow bg-opacity-90',
          subject.isObligatory && 'opacity-60',
          isDragging && 'opacity-50',
          widthClass
        )}
        onClick={() => setSelectedSubject(subject)}
      >
        <div className={cn(
          'truncate font-medium pl-1', 
          getSubjectColor(subject.title)
        )}>
          {subject.title}
        </div>
      </div>
    );  
  };

  // Componente para celdas dropeables
  // Permite soltar materias en un día y hora específicos, pero respeta las horas fijas
  const Cell = ({ day, time }: { day: string; time: string }) => {
    const items = scheduleMatrix[time][day];
    const [{ isOver, canDrop }, dropRef] = useDrop(() => ({
      accept: ['subject', 'available-subject'],
      canDrop: (dragItem: { subject: Subject; occurrence?: { day: string; time: string }; type?: string }) => {
        // For available subjects, check if the time matches any of the subject's predefined hours
        if (dragItem.type === 'available-subject') {
          // If the subject has predefined hours, only allow dropping in those time slots
          return true; // We'll handle this in the drop function
        }
        
        // For subjects already on the schedule
        return true;
      },
      drop: (dragItem: { subject: Subject; occurrence?: { day: string; time: string }; type?: string }) => {
        if (dragItem.type === 'available-subject') {
          // When dropping an available subject onto the schedule, add it with its original hours
          const subject = dragItem.subject;
          handleSubjectSelect(subject);
          
          // Show a message explaining the fixed hours
          toast.info(`La materia "${subject.title}" se ha agregado con sus horarios predefinidos`);
        } else if (dragItem.occurrence) {
          // When moving a subject already on the schedule
          moveSubject(dragItem as { subject: Subject; occurrence: { day: string; time: string } }, day, time);
        }
      },
      collect: (monitor) => ({
        isOver: monitor.isOver(),
        canDrop: monitor.canDrop()
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

  // Component for draggable subject card - allows subjects to be dragged from the available list
  const DraggableSubjectCard = ({ subject, onAdd }: DraggableSubjectCardProps) => {
    const [{ isDragging }, dragRef] = useDrag(() => ({
      type: 'available-subject',
      item: { subject, type: 'available-subject' },
      collect: (monitor) => ({
        isDragging: monitor.isDragging(),
      }),
    }));

    return (
      <Card 
        ref={dragRef}
        className={cn(
          "p-3 flex justify-between items-center cursor-move",
          isDragging && "opacity-50"
        )}
      >
        <div className="flex items-center gap-2">
          <GripVertical className="h-4 w-4 text-gray-400" />
          <div>
            <p className="font-medium">{subject.title}</p>
            <p className="text-xs text-muted-foreground">
              {subject.professor} • {subject.credits} créditos
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => handleSubjectSelect(subject)}
          className="h-8 w-8 text-green-500"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </Card>
    );
  };

  // Droppable component for the subject list that accepts dragged subjects
  const DroppableSubjectList = ({ 
    subjects,
    onRemove,
    onAddSubject
  }: { 
    subjects: Subject[],
    onRemove: (id: number) => void,
    onAddSubject: (subject: Subject) => void
  }) => {
    // Make the list area droppable for available subjects
    const [{ isOver, canDrop }, dropRef] = useDrop(() => ({
      accept: 'available-subject',
      drop: (item: { subject: Subject, type: string }) => {
        if (item.type === 'available-subject') {
          onAddSubject(item.subject);
        }
      },
      collect: (monitor) => ({
        isOver: monitor.isOver(),
        canDrop: monitor.canDrop(),
      }),
    }));

    return (
      <div 
        ref={dropRef}
        className={cn(
          "max-h-[400px] overflow-y-auto p-1",
          isOver && canDrop && "bg-green-50 rounded-lg",
          !subjects.length && "flex items-center justify-center h-[100px] text-gray-400"
        )}
      >
        {!subjects.length && (
          <p>Arrastra materias disponibles aquí</p>
        )}
        {subjects.map((subject) => (
          <div 
            key={subject.id} 
            className={cn(
              "flex flex-col items-center p-2 border rounded-lg my-2 bg-blue-50 border-l-4 border-blue-400",
              subject.isObligatory ? "opacity-60" : ""
            )}
          >
            <div className="flex flex-row justify-between w-full">
              <div className="flex items-center gap-2">
                <div className="pb-1">
                  <p className="font-bold text-sm truncate">{subject.title}</p>
                  <p className="text-xs truncate">{subject.professor}</p>
                </div>
              </div>
              {!subject.isObligatory && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onRemove(subject.id)}
                  className="h-6 w-6 text-red-500"
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
            <div className="pb-1 flex flex-row justify-between w-full text-xs font-semibold">
              <p className="truncate">
                Salón: {subject.salon}
              </p>
            </div>
            <div className="text-xs w-full truncate mb-1">
              {subject.hours.map((hour, index) => (
                <span key={`${hour.day}-${hour.time}`} className="mr-1">
                  {hour.day.substring(0, 3)} {hour.time}
                  {index < subject.hours.length - 1 ? ',' : ''}
                </span>
              ))}
            </div>
            <div className="flex flex-row justify-between w-full items-end h-full text-xs">
              <div className="flex flex-row gap-1">
                <p className="text-neutral-500">Cr:</p>
                <p className="font-bold">{subject.credits}</p>
              </div>
              <div className="flex flex-row gap-1">
                <p className="text-neutral-500">Hrs:</p>
                <p className="font-bold">{subject.hours.length}</p>
              </div>
              <div className="flex flex-row gap-1">
                <p className="text-neutral-500">Sem:</p>
                <p className="font-bold">{subject.semester}</p>
              </div>
            </div>
          </div>
        ))}
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
          <DroppableSubjectList 
            subjects={scheduledSubjects} 
            onRemove={removeScheduledSubject} 
            onAddSubject={handleSubjectSelect}
          />
          <div className="mt-4 mb-4">
            <p className="text-lg font-semibold mb-2">Materias Disponibles</p>
            <div className="space-y-2">
              {availableSubjects.filter(subject => 
                !scheduledSubjects.some(s => s.id === subject.id)
              ).map((subject) => (
                <DraggableSubjectCard key={subject.id} subject={subject} onAdd={handleSubjectSelect} />
              ))}
            </div>
          </div>


        </div>
      </div>

      {/* Render the IndividualSubject dialog when a subject on the grid is clicked */}      {selectedSubject && (
        <IndividualSubject
          subject={{
            IdHorarioGeneral: 1, // Default value
            NombreCarrera: selectedSubject.title,
            IdMateria: selectedSubject.id,
            IdProfesor: parseInt(selectedSubject.professor.replace(/\D/g, '')) || 0,
            IdCiclo: 1, // Default value
            Dia: selectedSubject.hours[0]?.day || '',
            HoraInicio: selectedSubject.hours[0]?.time || '',
            HoraFin: (() => {
              const time = selectedSubject.hours[0]?.time;
              if (!time) return '';
              const [h, m] = time.split(':').map(Number);
              const date = new Date();
              date.setHours(h, m, 0, 0);
              date.setHours(date.getHours() + 1);
              return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
            })(),
            Semestre: selectedSubject.semester
          }}
          isOpen={!!selectedSubject}
          onClose={() => setSelectedSubject(null)}
          onUpdate={(updatedScheduleItem) => {
            setSelectedSubjects(prev =>
              prev.map(s => {
                if (s.id === selectedSubject.id) {
                  return {
                    ...s,
                    title: updatedScheduleItem.NombreCarrera,
                    professor: `Prof ${updatedScheduleItem.IdProfesor}`,
                    salon: `Salon ${updatedScheduleItem.IdCiclo}`,
                    semester: updatedScheduleItem.Semestre,
                    hours: [{
                      day: updatedScheduleItem.Dia,
                      time: updatedScheduleItem.HoraInicio
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
              prev.filter(s => s.id !== selectedSubject.id)
            );
            setSelectedSubject(null);
          }}
        />
      )}
    </DndProvider>
  );
}