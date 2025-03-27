// Componente principal para la gestión del horario general
"use client";
// Importaciones necesarias para el componente
import React, { useState, useMemo, useEffect } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { generateSchedule, ScheduleItem } from '../../../../lib/schedule-generator';
import { cn } from '@/lib/utils';
import { IndividualSubject } from '@/components/pages/horario-general/IndividualSubject';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

// Claves para almacenamiento local
const SCHEDULE_STORAGE_KEY = 'via-alta-schedule';
const LAST_SAVED_KEY = 'via-alta-schedule-last-saved';

export default function Page() {
  // Add loading state
  const [isLoading, setIsLoading] = useState(false);
  // Estado para almacenar el horario y la materia seleccionada
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<ScheduleItem | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  // Estado para nueva clase
  const [newClass, setNewClass] = useState({
    teacher: '',
    subject: '',
    day: 'Lunes',
    time: '07:00',
    classroom: '',
    semester: 1, // Add default semester
  });

  // Cargar el horario guardado cuando el componente se monta
  useEffect(() => {
    loadScheduleFromStorage();
  }, []);

  // Removing the automatic save that was here

  /**
   * Carga el horario desde localStorage
   */
  const loadScheduleFromStorage = () => {
    try {
      const savedSchedule = localStorage.getItem(SCHEDULE_STORAGE_KEY);
      const savedTimestamp = localStorage.getItem(LAST_SAVED_KEY);
      
      if (savedSchedule) {
        const parsedSchedule = JSON.parse(savedSchedule) as ScheduleItem[];
        setSchedule(parsedSchedule);
        
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

  /**
   * Guarda el horario en localStorage
   */
  const saveScheduleToStorage = () => {
    try {
      const now = new Date();
      localStorage.setItem(SCHEDULE_STORAGE_KEY, JSON.stringify(schedule));
      localStorage.setItem(LAST_SAVED_KEY, now.toISOString());
      setLastSaved(now.toLocaleString());
      toast.success('Horario guardado correctamente');
    } catch (error) {
      console.error('Error al guardar el horario:', error);
      toast.error('No se pudo guardar el horario');
    }
  };

  /**
   * Genera un nuevo horario utilizando el generador de horarios
   */
  async function handleGenerateSchedule() {
    try {
      setIsLoading(true);
      const result = await generateSchedule();
      setSchedule(result);
      toast.success('Horario generado correctamente');
    } catch (error) {
      console.error('Error al generar el horario:', error);
      toast.error('Error al generar el horario');
    } finally {
      setIsLoading(false);
    }
  }

  // Definición de días y horarios disponibles
  const days = useMemo(() => ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'], []);
  const timeSlots = useMemo(() => {
    const slots = [];
    for (let i = 7; i <= 16; i++) {  
      slots.push(`${String(i).padStart(2, '0')}:00`);
      slots.push(`${String(i).padStart(2, '0')}:30`);
    }
    return slots;
  }, []);

  // Funciones auxiliares para trabajar con incrementos de media hora
  const timeToMinutes = (time: string): number => {
    const [hour, minute] = time.split(':').map(Number);
    return hour * 60 + minute;
  };

  const minutesToTime = (minutes: number): string => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  };

  /**
   * Crea una matriz bidimensional que representa el horario.
   * Solo se agrega la materia en la celda en que inicia.
   */
  const scheduleMatrix = useMemo(() => {
    const matrix: { [key: string]: { [key: string]: ScheduleItem[] } } = {};
    
    timeSlots.forEach(time => {
      matrix[time] = {};
      days.forEach(day => {
        matrix[time][day] = [];
      });
    });
    
    // Helper functions to work with half-hour increments
    const timeToMinutes = (time: string): number => {
      const [hour, minute] = time.split(':').map(Number);
      return hour * 60 + minute;
    };

    const minutesToTime = (minutes: number): string => {
      const h = Math.floor(minutes / 60);
      const m = minutes % 60;
      return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    };
    
    schedule.forEach(item => {
      const start = timeToMinutes(item.time);
      const end = timeToMinutes(item.endTime);
      // Iterate in 30-minute steps so that a 1-hour class spans two cells
      for (let t = start; t < end; t += 30) {
        const slot = minutesToTime(t);
        if (timeSlots.includes(slot)) {
          matrix[slot][item.day].push(item);
        }
      }
    });

    return matrix;
  }, [schedule, days, timeSlots]);
  /**
   * Mueve una materia de una posición a otra en el horario
   * @param {ScheduleItem} item - La materia a mover
   * @param {string} toDay - Día destino
   * @param {string} toTime - Hora destino
   * @returns {void}
   */
  const moveItem = (
    dragItem: { item: ScheduleItem; occurrence: { day: string; time: string } },
    toDay: string,
    toTime: string
  ) => {
    const { item, occurrence } = dragItem;
    setSchedule(prev => {
      const newSchedule = [...prev];
      // Find the schedule item that exactly started at the dragged occurrence
      const movingIndex = newSchedule.findIndex(scheduleItem =>
        scheduleItem.teacher === item.teacher &&
        scheduleItem.subject === item.subject &&
        scheduleItem.day === occurrence.day &&
        scheduleItem.time === occurrence.time
      );
  
      // If no item found, do nothing
      if (movingIndex === -1) return prev;
  
      // Calculate the duration of the class in minutes
      const duration = timeToMinutes(item.endTime) - timeToMinutes(item.time);
      
      // Calculate the new end time based on the destination time + original duration
      const toTimeMinutes = timeToMinutes(toTime);
      const newEndTimeMinutes = toTimeMinutes + duration;
      
      // Convert back to string format HH:MM
      const newEndTime = minutesToTime(newEndTimeMinutes);
  
      // Update the found item with the new day, time and end time
      newSchedule[movingIndex] = {
        ...newSchedule[movingIndex],
        day: toDay,
        time: toTime,
        endTime: newEndTime
      };
  
      return newSchedule;
    });
  };

  // ESTO SE VA A TENER QUE CAMBIAR CUANDO TENGAMOS LAS MATERIAS DE LA API
  const getSubjectColor = (subject: ScheduleItem): string => {
    const subjectColors: { [key: string]: string } = {
        'Matemáticas': 'text-blue-500',
        'Inglés': 'text-green-500',
        'Ciencias': 'text-yellow-500',
        'Historia': 'text-purple-500',
        'Arte': 'text-pink-500',
    };
    return subjectColors[subject.subject] || 'text-red-700';
};

  // Componente para una celda que se puede arrastrar
  const DraggableCell = ({ item, heightClass, occurrence }: 
    { item: ScheduleItem; heightClass: string; occurrence: { day: string; time: string } }) => {
    const [{ isDragging }, dragRef] = useDrag(() => ({
      type: 'scheduleItem',
      item: { item, occurrence },
      collect: (monitor) => ({
        isDragging: monitor.isDragging(),
      }),
    }));
  
    return (
      <div
        ref={(node) => { if (typeof dragRef === 'function') dragRef(node); }}
        className={cn(
          'p-1 text-xs cursor-pointer rounded-md border border-gray-200 bg-white shadow-sm h-full',
          'hover:shadow-md transition-shadow flex justify-center items-center',
          isDragging && 'opacity-50',
          heightClass
        )}
        onClick={(e) => {
          e.stopPropagation();
          setSelectedSubject(item);
        }}
      >
        <div className={cn('truncate font-medium', getSubjectColor(item))}>
          {item.subject}
        </div>
      </div>
    );
  };
  
  /**
   * Componente que representa una celda del horario
   * Permite soltar elementos arrastrables y gestiona la visualización de materias
   */
  // Inside the Cell component, replace the items.map with a filter on the starting time:
  const Cell = ({ day, time }: { day: string; time: string }) => {
    const items = scheduleMatrix[time][day];
    
    const [{ isOver }, dropRef] = useDrop(() => ({
      accept: 'scheduleItem',
      drop: (dragItem: { item: ScheduleItem; occurrence: { day: string; time: string } }) => {
        moveItem(dragItem, day, time);
      },
      collect: (monitor) => ({
        isOver: monitor.isOver(),
      }),
    }));
  
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
        ref={(node) => { if (typeof dropRef === 'function') dropRef(node); }}
        className={cn(
          'border border-gray-200 p-1 relative h-full',
          items.length > 0 ? 'bg-blue-50/50' : 'bg-white',
          isOver && 'bg-gray-100'
        )}
      >
        <div className="flex flex-row gap-0.5 h-full">
          {/* Remove the .filter() and render all items in this cell */}
          {items.map((item, index) => (
            <DraggableCell 
              key={`${item.teacher}-${item.subject}-${index}`} 
              item={item}
              occurrence={{ day, time }}
              heightClass={getWidthClass(items.length, index)}
            />
          ))}
        </div>
      </div>
    );
  };

  // Renderizado principal del componente
  return (
    <DndProvider backend={HTML5Backend}>
      <main className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">Horario General</h1>
          <div className="flex items-center gap-4">
            {lastSaved && (
              <div className="text-sm text-muted-foreground">
                Último guardado: {lastSaved}
              </div>
            )}
            <div className="flex gap-2">
              <Button
                onClick={saveScheduleToStorage}
                variant="outline"
                className="border-red-700 text-red-700 hover:bg-red-50"
              >
                Guardar Horario
              </Button>
              <Button
                onClick={() => setIsAddDialogOpen(true)}
                variant="outline"
                className="bg-red-700 text-white hover:bg-red-800"
              >
                Agregar Clase
              </Button>
              <Button
                onClick={handleGenerateSchedule}
                className="bg-red-700 text-white hover:bg-red-800"
                disabled={isLoading}
              >
                {isLoading ? 'Generando...' : 'Generar Horario'}
              </Button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <div className="min-w-[800px]">
            <div className="grid grid-cols-[100px_repeat(5,1fr)] grid-rows-[auto_repeat(19,2.5rem)]">
              <div className="h-10" />
              {days.map((day) => (
                <div key={day} className="h-10 flex items-center justify-center font-medium border-b">
                  {day}
                </div>
              ))}

              {timeSlots.map((time) => (
                <React.Fragment key={time}>
                  <div className="flex items-start justify-end pr-2 text-sm text-muted-foreground -mt-2">
                    {time}
                  </div>
                  {days.map((day) => (
                    <Cell key={`${day}-${time}`} day={day} time={time} />
                  ))}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
        <IndividualSubject 
          subject={selectedSubject}
          isOpen={!!selectedSubject}
          onClose={() => setSelectedSubject(null)}
          onUpdate={(updatedSubject, originalSubject) => {
            setSchedule(prev => {
              const newSchedule = [...prev];
              const index = newSchedule.findIndex(item => 
                item.teacher === originalSubject.teacher && 
                item.subject === originalSubject.subject && 
                item.day === originalSubject.day && 
                item.time === originalSubject.time
              );
              
              if (index !== -1) {
                newSchedule[index] = updatedSubject;
              }
              
              return newSchedule;
            });
            setSelectedSubject(null);
          }}
          onDelete={(subjectToDelete) => {
            setSchedule(prev => 
              prev.filter(item => 
                !(item.teacher === subjectToDelete.teacher && 
                  item.subject === subjectToDelete.subject && 
                  item.day === subjectToDelete.day && 
                  item.time === subjectToDelete.time)
              )
            );
          }}
        />

        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Agregar Nueva Clase</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="teacher" className="text-right">Profesor</Label>
                <Input
                  id="teacher"
                  value={newClass.teacher}
                  onChange={(e) => setNewClass({ ...newClass, teacher: e.target.value })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="subject" className="text-right">Materia</Label>
                <Input
                  id="subject"
                  value={newClass.subject}
                  onChange={(e) => setNewClass({ ...newClass, subject: e.target.value })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="day" className="text-right">Día</Label>
                <Select value={newClass.day} onValueChange={(value) => setNewClass({ ...newClass, day: value })}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {days.map((day) => (
                      <SelectItem key={day} value={day}>{day}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="time" className="text-right">Hora</Label>
                <Select value={newClass.time} onValueChange={(value) => setNewClass({ ...newClass, time: value })}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {timeSlots.map((time) => (
                      <SelectItem key={time} value={time}>{time}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="classroom" className="text-right">Salón</Label>
                <Input
                  id="classroom"
                  value={newClass.classroom}
                  onChange={(e) => setNewClass({ ...newClass, classroom: e.target.value })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="semester" className="text-right">Semestre</Label>
                <Select value={newClass.semester.toString()} onValueChange={(value) => setNewClass({ ...newClass, semester: parseInt(value) })}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1,2,3,4,5,6,7,8].map((sem) => (
                      <SelectItem key={sem} value={sem.toString()}>{`Semestre ${sem}`}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={() => {
                const endTime = new Date(`2000-01-01T${newClass.time}`);
                endTime.setHours(endTime.getHours() + 1);
                const endTimeStr = endTime.toTimeString().substring(0, 5);
                
                setSchedule([...schedule, {
                  ...newClass,
                  endTime: endTimeStr
                }]);
                setIsAddDialogOpen(false);
                setNewClass({
                  teacher: '',
                  subject: '',
                  day: 'Lunes',
                  time: '07:00',
                  classroom: '',
                  semester: 1,
                });
              }}>
                Agregar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </DndProvider>
  );
}