'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, Lock, Plus, GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

/**
 * Interfaz que define la estructura de una materia
 */
interface Subject {
  id: number;                            // Identificador único de la materia
  title: string;                         // Nombre de la materia
  salon: string;                         // Salón donde se imparte
  professor: string;                     // Profesor que la imparte
  credits: number;                       // Créditos que vale la materia
  semester: number;                      // Semestre al que pertenece
  hours: { day: string; time: string }[];// Horarios de la materia (día y hora)
  isObligatory?: boolean;                // Indica si es obligatoria
  isRecommended?: boolean;               // Indica si es recomendada basado en histo prial académico
}

/**
 * Props para el componente principal
 */
interface SubjectsProps {
  subjects: Subject[];                   // Lista de materias disponibles
  isRegular?: boolean;                   // Indica si el estudiante es regular
}

/**
 * Props para celdas arrastrables en el horario
 */
interface DraggableCellProps {
  subject: Subject;                      // Materia a mostrar en la celda
  occurrence: { day: string; time: string }; // Día y hora específicos
  widthClass?: string;                   // Clase CSS para el ancho
}

/**
 * Props para tarjetas de materias arrastrables
 */
interface DraggableSubjectCardProps {
  subject: Subject;                      // Materia a mostrar en la tarjeta
  onAdd: (subject: Subject) => void;     // Función para agregar la materia
}

// Días de la semana para mostrar en el horario
const daysOfWeek = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];

// Franjas horarias disponibles en el horario (formato 24h)
const timeSlots = [
  '07:00', '07:30', '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
  '11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '14:00',
  '14:30', '15:00', '15:30', '16:00'
];  

export default function EstudianteSchedule({ subjects, isRegular = false }: SubjectsProps) {
  // Estados para manejar los diferentes tipos de materias
  const [obligatorySubjects, setObligatorySubjects] = useState<Subject[]>([]); // Materias obligatorias
  const [availableSubjects, setAvailableSubjects] = useState<Subject[]>([]);   // Materias disponibles para elegir
  const [scheduledSubjects, setScheduledSubjects] = useState<Subject[]>([]);   // Materias en horario actual
  const [isIrregularStudent, setIsIrregularStudent] = useState<boolean>(!isRegular); // Estado de estudiante (regular/irregular)

  // Inicializar datos cuando cambian las materias recibidas
  useEffect(() => {
    // Manejar estudiantes irregulares y regulares de manera diferente
    if (!isRegular) {
      // Para estudiantes irregulares:
      // 1. Seleccionar exactamente 3 materias obligatorias (bloquadas)
      const obligatory = subjects.slice(0, 3).map(s => ({...s, isObligatory: true}));
      
      // 2. Seleccionar las 3 siguientes como recomendadas basadas en historial académico
      const recommended = subjects.slice(3, 6).map(s => ({...s, isRecommended: true}));
      
      // 3. El resto son materias disponibles
      const available = subjects.slice(6);
      
      setObligatorySubjects(obligatory);
      setAvailableSubjects([...recommended, ...available]);
      setScheduledSubjects([...obligatory]); // Iniciar horario con materias obligatorias
    } else {
      // Para estudiantes regulares:
      // Todas sus materias son obligatorias (no pueden modificar su horario)
      const obligatory = subjects.map(s => ({...s, isObligatory: true}));
      setObligatorySubjects(obligatory);
      setAvailableSubjects([]);
      setScheduledSubjects([...obligatory]);
    }
    
    // Si hay materias disponibles, el estudiante es irregular
    setIsIrregularStudent(!isRegular);
  }, [subjects, isRegular]);

  /**
   * Agrega una materia al horario si no está ya incluida
   */
  const handleSubjectSelect = (subject: Subject) => {
    if (!scheduledSubjects.some((s) => s.id === subject.id)) {
      setScheduledSubjects([...scheduledSubjects, subject]);
      toast.success(`Materia "${subject.title}" agregada al horario`);
    } else {
      toast.error(`La materia "${subject.title}" ya está en el horario`);
    }
  };

  /**
   * Elimina una materia del horario, excepto si es obligatoria
   */
  const removeScheduledSubject = (subjectId: number) => {
    const subjectToRemove = scheduledSubjects.find(s => s.id === subjectId);
    
    if (subjectToRemove?.isObligatory) {
      toast.error("No se pueden eliminar las materias obligatorias");
      return;
    }
    
    setScheduledSubjects(scheduledSubjects.filter(s => s.id !== subjectId));
  };

  /**
   * Encuentra una materia programada en un día y hora específicos
   */
  const findSubject = (day: string, time: string) => {
    return scheduledSubjects.find((subject) => subject.hours.some(
      (hour) => hour.day.toLowerCase() === day.toLowerCase() && hour.time === time,
    ));
  };

  /**
   * Normaliza los nombres de los días para manejar diferentes formatos
   */
  function normalizeDay(day: string): string {
    switch (day.toLowerCase()) {
      case 'monday':
      case 'lun':
      case 'lun': 
        return 'Lunes';
      case 'tuesday':
      case 'mar':
        return 'Martes';
      case 'wednesday':
      case 'mié':
        return 'Miércoles';
      case 'thursday':
      case 'jue':
        return 'Jueves';
      case 'friday':
      case 'vie':
        return 'Viernes';    
      default:
        return day;
    }
  }

  /**
   * Convierte una hora en formato HH:MM a minutos para cálculos
   */
  function timeToMinutes(time: string): number {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
  }
  
  /**
   * Convierte minutos a formato de hora HH:MM
   */
  function minutesToTime(minutes: number): string {
    const hh = String(Math.floor(minutes / 60)).padStart(2, '0');
    const mm = String(minutes % 60).padStart(2, '0');
    return `${hh}:${mm}`;
  }

  /**
   * Crea y mantiene actualizada la matriz que representa el horario
   * La estructura es: [hora][día] = [lista de materias]
   */
  const scheduleMatrix = useMemo(() => {
    // Inicializar matriz vacía
    const matrix: { [key: string]: { [key: string]: Subject[] } } = {};
  
    // Crear estructura de la matriz para todos los horarios y días
    timeSlots.forEach(time => {
      matrix[time] = {};
      daysOfWeek.forEach(day => {
        matrix[time][day] = [];
      });
    });
  
    // Llenar la matriz con las materias programadas
    scheduledSubjects.forEach(subject => {
      if (!subject?.hours) return;
      subject.hours.forEach(hour => {
        if (!hour?.time || !hour.day) return;
        const normalizedDay = normalizeDay(hour.day);
        const start = timeToMinutes(hour.time);
        const end = start + 60; // Duración de una clase (1 hora)
  
        // Agregar la materia a cada slot de 30 minutos que ocupa
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

  /**
   * Mueve una materia de un horario a otro
   * Solo permite mover materias que no son obligatorias
   */
  const moveSubject = (
    dragItem: { subject: Subject; occurrence: { day: string; time: string } },
    toDay: string,
    toTime: string
  ) => {
    const { subject, occurrence } = dragItem;

    // No permitir mover materias obligatorias
    if (subject.isObligatory) {
      toast.error(`No se puede mover "${subject.title}" porque es una materia obligatoria`);
      return;
    }
    
    // Actualizar el horario de la materia
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
    
    toast.success(`Movida ${subject.title} de ${occurrence.day} ${occurrence.time} a ${toDay} a las ${toTime}`);
  };

  /**
   * Asigna colores consistentes a cada materia basado en su título
   * Usa un algoritmo hash para garantizar que cada materia tenga siempre el mismo color
   */
  const getSubjectColor = (subjectTitle: string): { text: string, border: string, bg: string } => {
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
    
    // Crear un hash único basado en el título de la materia
    let hashCode = 0;
    for (let i = 0; i < subjectTitle.length; i++) {
      hashCode = ((hashCode << 5) - hashCode) + subjectTitle.charCodeAt(i);
      hashCode = hashCode & hashCode; 
    }
    
    // Usar el hash para seleccionar un color
    const colorIndex = Math.abs(hashCode) % colorOptions.length;
    return colorOptions[colorIndex];
  };

  /**
   * Celda arrastrable que representa una materia en el horario
   * Permite mover las materias no obligatorias
   */
  const DraggableCell = ({ subject, occurrence, widthClass }: DraggableCellProps) => {
    // Configurar funcionalidad de arrastre con react-dnd
    const [{ isDragging }, dragRef] = useDrag(() => ({
      type: 'subject',
      item: { subject, occurrence },
      canDrag: !subject.isObligatory && !isRegular, // Disable dragging for obligatory subjects and regular students
      collect: (monitor) => ({
        isDragging: monitor.isDragging(),
      }),
    }));

    const colors = getSubjectColor(subject.title);
    
    return (
      <div
        ref={(node) => {
          if (typeof dragRef === 'function' && !subject.isObligatory) {
            dragRef(node);
          }
        }}
        className={cn(
          'p-1 text-xs rounded-md border shadow-sm h-full',
          'flex justify-between items-center',
          `border-l-4 ${colors.border}`,
          !subject.isObligatory && `${colors.bg} cursor-grab hover:shadow-md transition-all bg-opacity-90 hover:bg-opacity-100`,
          subject.isObligatory && isIrregularStudent && `${colors.bg} opacity-70`,
          subject.isObligatory && !isIrregularStudent && `${colors.bg}`,
          isDragging && 'opacity-50 cursor-grabbing scale-[0.97]',
          widthClass
        )}
      >
        {/* Icono de arrastre para materias no obligatorias y no recomendadas */}
        {!subject.isObligatory && !subject.isRecommended && (
          <div className="flex-shrink-0 mr-1" title="Arrastra para mover o remover">
            <GripVertical className="h-3 w-3 text-gray-400" />
          </div>
        )}
        
        {/* Icono de candado para materias obligatorias con tooltip explicativo */}
        {subject.isObligatory && isIrregularStudent && (
          <div className="flex-shrink-0 mr-1 relative group">
            <Lock className="h-3 w-3 text-gray-400" />
            <div className="absolute left-0 -mt-1 w-64 scale-0 group-hover:scale-100 transition-all bg-black text-white text-xs p-2 rounded shadow-lg z-50 -translate-y-full origin-bottom">
              Materia obligatoria necesaria para tu avance académico. No puede ser removida.
            </div>
          </div>
        )}
        
        {/* Icono de estrella para materias recomendadas con tooltip explicativo */}
        {!subject.isObligatory && subject.isRecommended && (
          <div className="flex-shrink-0 mr-1 relative group">
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-500"><path d="m12 2 3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
            <div className="absolute left-0 -mt-1 w-64 scale-0 group-hover:scale-100 transition-all bg-black text-white text-xs p-2 rounded shadow-lg z-50 -translate-y-full origin-bottom">
              Materia recomendada basada en tu historial académico.
            </div>
          </div>
        )}
        
        <div className={cn(
          'truncate font-medium flex-1', 
          colors.text
        )}>
          {subject.title}
        </div>
      </div>
    );  
  };

  /**
   * Celda del horario que puede recibir materias arrastradas
   * Muestra las materias programadas en ese horario específico
   */
  const Cell = ({ day, time }: { day: string; time: string }) => {
    // Obtener materias programadas en este horario
    const items = scheduleMatrix[time][day];
    
    // Configurar funcionalidad para recibir elementos arrastrados
    const [{ isOver, canDrop }, dropRef] = useDrop(() => ({
      accept: ['subject', 'available-subject'],
      canDrop: (dragItem: { subject: Subject; occurrence?: { day: string; time: string }; type?: string }) => {
        // Regular students can't modify their schedule
        if (isRegular) return false;
        
        if (dragItem.type === 'available-subject') {
          return true; // Siempre se pueden agregar materias disponibles (para estudiantes irregulares)
        }
        return true;
      },
      drop: (dragItem: { subject: Subject; occurrence?: { day: string; time: string }; type?: string }) => {
        // Si arrastramos desde la lista de disponibles, agregamos la materia
        if (dragItem.type === 'available-subject') {
          const subject = dragItem.subject;
          handleSubjectSelect(subject);
          
          toast.info(`La materia "${subject.title}" se ha agregado con sus horarios predefinidos`);
        } 
        // Si arrastramos desde otra celda, movemos la materia
        else if (dragItem.occurrence) {
          moveSubject(dragItem as { subject: Subject; occurrence: { day: string; time: string } }, day, time);
        }
      },
      collect: (monitor) => ({
        isOver: monitor.isOver(),
        canDrop: monitor.canDrop()
      }),
    }));

    /**
     * Calcula el ancho de cada materia según cuántas hay en la misma celda
     */
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
          {/* Renderizar cada materia en esta celda */}
          {items.map((item, index) => (
            <DraggableCell 
              key={`${item.professor}-${item.title}-${index}`}
              subject={item}
              occurrence={{ day, time }}
              widthClass={getWidthClass(items.length, index)}
            />
          ))}
        </div>
      </div>
    );
  };

  /**
   * Componente que muestra una tarjeta para las materias programadas en el horario
   * Permite arrastrar materias no obligatorias para eliminarlas o modificar su horario
   */
  const DraggableScheduledSubjectCard = ({ subject, onRemove }: { subject: Subject, onRemove: (id: number) => void }) => {
    // Configurar la funcionalidad de arrastre
    const [{ isDragging }, dragRef] = useDrag(() => ({
      type: 'scheduled-subject',
      item: { subject, type: 'scheduled-subject' },
      canDrag: !subject.isObligatory && !isRegular, // Only non-obligatory subjects can be dragged, and only by irregular students
      collect: (monitor) => ({
        isDragging: monitor.isDragging(),
      }),
    }));

    const colors = getSubjectColor(subject.title);
    
    return (
      <div 
        ref={(node) => {
          if (typeof dragRef === 'function' && !subject.isObligatory) {
            dragRef(node);
          }
        }}
        className={cn(
          "flex flex-col items-center p-3 border rounded-lg border-l-4 bg-white",
          subject.isObligatory && isIrregularStudent ? `opacity-70 ${colors.border}` : `${colors.border}`,
          !subject.isObligatory && "hover:shadow-md transition-all cursor-grab",
          isDragging && "opacity-50 cursor-grabbing scale-[0.97]"
        )}
      >
        <div className="flex flex-row justify-between w-full">
          <div className="flex items-center gap-2">
            {/* Icono de arrastre para materias no obligatorias y no recomendadas */}
            {!subject.isObligatory && !subject.isRecommended && (
              <GripVertical className="h-4 w-4 text-gray-400" />
            )}
            
            {/* Icono de candado para materias obligatorias con tooltip explicativo */}
            {subject.isObligatory && isIrregularStudent && (
              <div className="flex-shrink-0 relative group">
                <Lock className="h-4 w-4 text-gray-500" />
                <div className="absolute left-0 -mt-1 w-64 scale-0 group-hover:scale-100 transition-all bg-black text-white text-xs p-2 rounded shadow-lg z-50 -translate-y-full origin-bottom">
                  Materia obligatoria necesaria para tu avance académico. No puede ser removida.
                </div>
              </div>
            )}
            
            {/* Icono de estrella para materias recomendadas con tooltip explicativo */}
            {!subject.isObligatory && subject.isRecommended && (
              <div className="flex-shrink-0 relative group">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-500"><path d="m12 2 3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                <div className="absolute left-0 -mt-1 w-64 scale-0 group-hover:scale-100 transition-all bg-black text-white text-xs p-2 rounded shadow-lg z-50 -translate-y-full origin-bottom">
                  Materia recomendada basada en tu historial académico.
                </div>
              </div>
            )}
            
            <div className="pb-1 w-full">
              <p className={cn("font-bold text-base truncate", colors.text)}>{subject.title}</p>
              <p className="text-sm font-medium truncate mt-1">{subject.professor}</p>
              <p className="text-xs text-gray-600 mt-0.5"><span className="font-medium">Salón:</span> {subject.salon}</p>
            </div>
          </div>
          {/* Botón para eliminar materias no obligatorias */}
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
        
        {/* Sección de horarios de la materia */}
        <div className="text-xs w-full pt-1 border-t border-gray-200">
          <div className="font-medium text-gray-700 mb-0.5">Horarios de clase:</div>
          <div className="flex flex-wrap gap-1">
            {subject.hours.map((hour, index) => (
              <span 
                key={`${hour.day}-${hour.time}`} 
                className="inline-flex items-center px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-xs"
              >
                <span className="font-medium">{hour.day.substring(0, 3)}</span>&nbsp;&nbsp;{hour.time}
              </span>
            ))}
          </div>
        </div>
        
        {/* Información adicional sobre la materia */}
        <div className="w-full flex flex-wrap gap-1 mt-2 pt-2 border-t border-gray-200">
          <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded-full text-xs inline-flex items-center">
            <span className="font-medium mr-1">Créditos:</span> {subject.credits}
          </span>
          <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded-full text-xs inline-flex items-center">
            <span className="font-medium mr-1">Semestre:</span> {subject.semester}º
          </span>
          <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded-full text-xs inline-flex items-center">
            <span className="font-medium mr-1">Horas/Semana:</span> {subject.hours.length}
          </span>
        </div>
      </div>
    );
  };

  const DraggableSubjectCard = ({ subject, onAdd }: DraggableSubjectCardProps) => {
    const [{ isDragging }, dragRef] = useDrag(() => ({
      type: 'available-subject',
      item: { subject, type: 'available-subject' },
      canDrag: !isRegular, // Only irregular students can drag subjects
      collect: (monitor) => ({
        isDragging: monitor.isDragging(),
      }),
    }));

    const colors = getSubjectColor(subject.title);

    return (
      <Card 
        ref={(node) => {
          if (typeof dragRef === 'function') {
            dragRef(node);
          }
        }}
        className={cn(
          `p-3 border-l-4 ${colors.border} bg-white`,
          !subject.isObligatory && "cursor-grab hover:shadow-md transition-all",
          subject.isObligatory && "opacity-70",
          isDragging && "opacity-50 cursor-grabbing",
        )}
      >
        <div className="flex justify-between">
          <div className="flex items-center gap-2">
            {/* Icono de candado para materias obligatorias con tooltip */}
            {subject.isObligatory && (
              <div className="relative group">
                <Lock className="h-4 w-4 text-gray-500" />
                <div className="absolute left-0 -mt-1 w-64 scale-0 group-hover:scale-100 transition-all bg-black text-white text-xs p-2 rounded shadow-lg z-50 -translate-y-full origin-bottom">
                  Materia obligatoria necesaria para tu avance académico. No puede ser removida.
                </div>
              </div>
            )}
            
            {/* Icono de estrella para materias recomendadas con tooltip */}
            {!subject.isObligatory && subject.isRecommended && (
              <div className="relative group">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-500"><path d="m12 2 3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                <div className="absolute left-0 -mt-1 w-64 scale-0 group-hover:scale-100 transition-all bg-black text-white text-xs p-2 rounded shadow-lg z-50 -translate-y-full origin-bottom">
                  Materia recomendada basada en tu historial académico.
                </div>
              </div>
            )}
            
            {/* Icono de arrastre para materias normales */}
            {!subject.isObligatory && !subject.isRecommended && (
              <GripVertical className="h-4 w-4 text-gray-400" />
            )}
            
            <div className="pb-1 w-full">
              <p className={cn("font-bold text-base truncate", colors.text)}>{subject.title}</p>
              <p className="text-sm font-medium truncate mt-1">{subject.professor}</p>
              <p className="text-xs text-gray-600 mt-0.5"><span className="font-medium">Salón:</span> {subject.salon}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onAdd(subject)}
            className="h-8 w-8 text-green-500 -mr-1"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="text-xs w-full pt-1 border-t border-gray-200 mt-2">
          <div className="font-medium text-gray-700 mb-0.5">Horarios disponibles:</div>
          <div className="flex flex-wrap gap-1">
            {subject.hours.map((hour, index) => (
              <span 
                key={`${hour.day}-${hour.time}`} 
                className="inline-flex items-center px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-xs"
              >
                <span className="font-medium">{hour.day.substring(0, 3)}</span>&nbsp;&nbsp;{hour.time}
              </span>
            ))}
          </div>
        </div>
        
        <div className="w-full flex flex-wrap gap-1 mt-2 pt-2 border-t border-gray-200">
          <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded-full text-xs inline-flex items-center">
            <span className="font-medium mr-1">Créditos:</span> {subject.credits}
          </span>
          <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded-full text-xs inline-flex items-center">
            <span className="font-medium mr-1">Semestre:</span> {subject.semester}º
          </span>
          <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded-full text-xs inline-flex items-center">
            <span className="font-medium mr-1">Horas/Semana:</span> {subject.hours.length}
          </span>
        </div>
      </Card>
    );
  };

  const ScheduledSubjectsDropArea = ({ 
    subjects,
    onAddSubject
  }: { 
    subjects: Subject[],
    onAddSubject: (subject: Subject) => void
  }) => {
    // Configurar el área para recibir materias arrastradas
    const [{ isOver, canDrop }, dropRef] = useDrop(() => ({
      accept: 'available-subject', 
      canDrop: () => !isRegular, // Regular students can't modify their schedule
      drop: (item: { subject: Subject; type?: string }) => {
        onAddSubject(item.subject);
        toast.success(`Materia "${item.subject.title}" agregada al horario`);
      },
      collect: (monitor) => ({
        isOver: monitor.isOver(),
        canDrop: monitor.canDrop(),
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
          "space-y-2",
          isOver && canDrop && "bg-blue-50 rounded-lg border-2 border-dashed border-blue-300 animate-pulse-green p-2",
          !subjects.length && "flex items-center justify-center h-[100px] text-gray-400 p-2"
        )}
      >
        {/* Mensajes informativos según el estado */}
        {!subjects.length && isOver && canDrop && (
          <p>Suelta aquí para agregar al horario</p>
        )}
        {!subjects.length && !isOver && (
          <p>No hay materias en el horario</p>
        )}
        {isOver && canDrop && subjects.length > 0 && (
          <div className="py-2 text-xs text-blue-600 text-center">
            Suelta aquí para agregar esta materia al horario
          </div>
        )}
        {/* Lista de materias programadas */}
        {subjects.map((subject) => (
          <DraggableScheduledSubjectCard key={subject.id} subject={subject} onRemove={removeScheduledSubject} />
        ))}
      </div>
    );
  };

  /**
   * Área donde se muestran las materias disponibles para elegir
   */
  const AvailableSubjectsDropArea = ({ 
    subjects,
    onAddSubject,
    onRemoveFromSchedule
  }: {
    subjects: Subject[],
    onAddSubject: (subject: Subject) => void,
    onRemoveFromSchedule: (id: number) => void
  }) => {
    // Configurar el área para recibir materias arrastradas desde el horario
    const [{ isOver, canDrop }, dropRef] = useDrop(() => ({
      accept: ['subject', 'scheduled-subject'], 
      canDrop: (item: { subject: Subject; type?: string }) => {
        // Regular students can't modify their schedule
        if (isRegular) return false;
        return !item.subject.isObligatory;
      },
      drop: (item: { subject: Subject; occurrence?: { day: string; time: string }; type?: string }) => {
        if (!item.subject.isObligatory) {
          onRemoveFromSchedule(item.subject.id);
          toast.success(`Materia "${item.subject.title}" removida del horario`);
        } else {
          toast.error(`No se puede mover "${item.subject.title}" porque es una materia obligatoria`);
        }
      },
      collect: (monitor) => ({
        isOver: monitor.isOver(),
        canDrop: monitor.canDrop(),
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
          "space-y-2 ",
          isOver && canDrop && "bg-green-50 rounded-lg border-2 border-dashed border-green-300 animate-pulse-green",
          !subjects.length && "flex items-center justify-center h-[100px] text-gray-400"
        )}
      >
        {!subjects.length && isOver && canDrop && (
          <p>Suelta aquí para remover del horario</p>
        )}
         {/* Mostrar mensaje si no hay materias disponibles */}
        {!subjects.length && !isOver && (
          <p>No hay materias adicionales disponibles</p>
        )}
        {isOver && canDrop && subjects.length > 0 && (
          <div className="py-2 text-xs text-green-600 text-center">
            Suelta aquí para remover esta materia del horario
          </div>
        )}
        {subjects.map((subject) => (
          <DraggableSubjectCard key={subject.id} subject={subject} onAdd={onAddSubject} />
        ))}
      </div>
    );
  };

// Estructura principal del componente de horario
return (
  <DndProvider backend={HTML5Backend}>
    <div className="w-full pb-8 flex justify-between flex-col lg:flex-row gap-4">
      {/* Cuadrícula del horario semanal con horas */}
      <div className="overflow-x-auto flex-1">
        <div className="min-w-[800px]">
          <div className="grid grid-cols-[100px_repeat(5,1fr)] grid-rows-[auto_repeat(19,2.5rem)]">
            {/* Encabezados con días de la semana */}
            <div className="h-10" />
            {daysOfWeek.map((day) => (
              <div key={day} className="h-10 flex items-center justify-center font-medium border-b">
                {day}
              </div>
            ))}

            {/* Filas de horarios para cada franja horaria */}
            {timeSlots.map((time) => (
              <React.Fragment key={time}>
                {/* Columna de horas */}
                <div className="flex items-start justify-end pr-2 text-sm text-muted-foreground -mt-2">
                  {time}
                </div>
                {/* Celdas para cada día en esa franja horaria */}
                {daysOfWeek.map((day) => (
                  <Cell key={`${day}-${time}`} day={day} time={time} />
                ))}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      {/* Panel lateral con materias programadas y disponibles */}
      <div className="w-full lg:w-1/4 pl-0 lg:pl-4">
        {/* Materias recomendadas primero */}
        {!isRegular && isIrregularStudent && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-1">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-500"><path d="m12 2 3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
              <p className="text-sm font-semibold">Materias Recomendadas</p>
            </div>
            <p className="text-xs text-gray-500 mb-2">
              Basadas en tu historial académico, te recomendamos estas materias para completar tu carga.
            </p>
            <div className="space-y-2">
              {availableSubjects
                .filter(subject => 
                  subject.isRecommended && 
                  !scheduledSubjects.some(s => s.id === subject.id)
                )
                .map(subject => (
                  <DraggableSubjectCard
                    key={subject.id}
                    subject={{...subject, isObligatory: false}}
                    onAdd={handleSubjectSelect}
                  />
                ))
              }
            </div>
          </div>
        )}

        {/* Sección de materias opcionales después de recomendadas */}
        {!isRegular && isIrregularStudent && availableSubjects.filter(s => !s.isRecommended).length > 0 && (
          <div className="mb-6">
            <p className="text-lg font-semibold mb-2">Materias Opcionales</p>
            <AvailableSubjectsDropArea 
              subjects={availableSubjects.filter(subject => 
                !subject.isRecommended && !scheduledSubjects.some(s => s.id === subject.id)
              )}
              onAddSubject={handleSubjectSelect}
              onRemoveFromSchedule={removeScheduledSubject}
            />
          </div>
        )}

        {/* Después las materias ya programadas */}
        <p className="text-2xl font-bold mb-2">Lista de Materias</p>
        <ScheduledSubjectsDropArea 
          subjects={scheduledSubjects}
          onAddSubject={handleSubjectSelect}
        />
      </div>
    </div>
  </DndProvider>
);
}