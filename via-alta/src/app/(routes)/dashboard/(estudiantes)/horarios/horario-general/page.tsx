// Componente principal para la gestión del horario general
"use client";

// Importaciones necesarias para el componente
import React, { useState, useMemo, useEffect } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { generateSchedule } from '../../../../../../lib/utils/schedule-generator';
import { GeneralScheduleItem } from '@/lib/models/general-schedule';
import { cn } from '@/lib/utils';
import { IndividualSubject } from '@/components/pages/horario-general/IndividualSubject';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

export default function Page() {
  // Estado para indicar si la página está cargando
  const [isLoading, setIsLoading] = useState(false);
  // Estado para almacenar el horario general
  const [schedule, setSchedule] = useState<GeneralScheduleItem[]>([]);
  // Estado para almacenar la materia seleccionada
  const [selectedSubject, setSelectedSubject] = useState<GeneralScheduleItem | null>(null);
  // Estado para controlar el diálogo de agregar materia
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  // Estado para almacenar la última vez que se guardó el horario
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  // Estado para nueva clase
  const [newClass, setNewClass] = useState({
    IdProfesor: 0,
    IdMateria: 0,
    Dia: 'Lunes',
    HoraInicio: '07:00',
    HoraFin: '08:00',
    Semestre: 1,
    IdHorarioGeneral: 1, // Default value, deveria ser modificado segun el contexto
    NombreCarrera: 'Ingeniería en Sistemas', // Default value,
    IdCiclo: 1 // Default value
  });

  // Load schedule from database when component mounts
  useEffect(() => {
    loadScheduleFromDatabase();
  }, []);

  // Función para cargar el horario desde la base de datos
  const loadScheduleFromDatabase = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/schedule');
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error);
      }
      
      setSchedule(result.data);
      setLastSaved(new Date().toLocaleString());
      toast.success('Horario cargado correctamente');
    } catch (error) {
      console.error('Error al cargar el horario:', error);
      toast.error('No se pudo cargar el horario');
    } finally {
      setIsLoading(false);
    }
  };

  // Función para guardar el horario en la base de datos
  const saveScheduleToDatabase = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/schedule', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ schedule }),
      });
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error);
      }
      
      setLastSaved(new Date().toLocaleString());
      toast.success('Horario guardado correctamente');
    } catch (error) {
      console.error('Error al guardar el horario:', error);
      toast.error('No se pudo guardar el horario');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Genera un nuevo horario utilizando el generador de horarios
   */
  async function handleGenerateSchedule() {
    try {
      setIsLoading(true);
      const result = await generateSchedule();
      // Convertir el horario generado a formato GeneralScheduleItem
      const convertedSchedule: GeneralScheduleItem[] = result.map(item => ({
        IdHorarioGeneral: 1, // Default value segun el contexto
        NombreCarrera: item.subject, 
        IdMateria: parseInt(item.subject.split(' ')[0]) || 1, 
        IdProfesor: parseInt(item.teacher.split(' ')[1]) || 1, 
        IdCiclo: 1, //Valor default deberia cambiarse segun el contexto
        Dia: item.day,
        HoraInicio: item.time,
        HoraFin: item.endTime,
        Semestre: item.semester
      }));
      setSchedule(convertedSchedule);
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
  const timeToMinutes = (time: string | undefined | null): number => {
    if (!time) {
      console.error('Time is undefined or null');
      return 0;
    }
    const parts = time.split(':');
    if (parts.length !== 2) {
      console.error('Invalid time format:', time);
      return 0;
    }
    const hour = Number(parts[0]);
    const minute = Number(parts[1]);
    if (isNaN(hour) || isNaN(minute)) {
      console.error('Invalid time format:', time);
      return 0;
    }
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
    const matrix: { [key: string]: { [key: string]: GeneralScheduleItem[] } } = {};
    
    timeSlots.forEach(time => {
      matrix[time] = {};
      days.forEach(day => {
        matrix[time][day] = [];
      });
    });
    
    schedule.forEach(item => {
      if (!item.HoraInicio || !item.HoraFin || !item.Dia) {
        console.warn('Invalid schedule item:', item);
        return;
      }

      const start = timeToMinutes(item.HoraInicio);
      const end = timeToMinutes(item.HoraFin);
      
      if (start === 0 || end === 0) {
        console.warn('Invalid time format in schedule item:', item);
        return;
      }

      // Iterate in 30-minute steps so that a 1-hour class spans two cells
      for (let t = start; t < end; t += 30) {
        const slot = minutesToTime(t);
        if (timeSlots.includes(slot)) {
          matrix[slot][item.Dia].push(item);
        }
      }
    });

    return matrix;
  }, [schedule, days, timeSlots]);
  /**
   * Mueve una materia de una posición a otra en el horario
   * @param {GeneralScheduleItem} item - La materia a mover
   * @param {string} toDay - Día destino
   * @param {string} toTime - Hora destino
   * @returns {void}
   */
  const moveItem = (
    dragItem: { item: GeneralScheduleItem; occurrence: { day: string; time: string } },
    toDay: string,
    toTime: string
  ) => {
    const { item, occurrence } = dragItem;
    setSchedule(prev => {
      const newSchedule = [...prev];
      // Find the schedule item that exactly started at the dragged occurrence
      const movingIndex = newSchedule.findIndex(scheduleItem =>
        scheduleItem.IdProfesor === item.IdProfesor &&
        scheduleItem.IdMateria === item.IdMateria &&
        scheduleItem.Dia === occurrence.day &&
        scheduleItem.HoraInicio === occurrence.time
      );
  
      // If no item found, do nothing
      if (movingIndex === -1) return prev;
  
      // Calculate the duration of the class in minutes
      const duration = timeToMinutes(item.HoraFin) - timeToMinutes(item.HoraInicio);
      
      // Calculate the new end time based on the destination time + original duration
      const toTimeMinutes = timeToMinutes(toTime);
      const newEndTimeMinutes = toTimeMinutes + duration;
      
      // Convert back to string format HH:MM
      const newEndTime = minutesToTime(newEndTimeMinutes);
  
      // Update the found item with the new day, time and end time
      newSchedule[movingIndex] = {
        ...newSchedule[movingIndex],
        Dia: toDay,
        HoraInicio: toTime,
        HoraFin: newEndTime
      };
  
      return newSchedule;
    });
  };

  // ESTO SE VA A TENER QUE CAMBIAR CUANDO TENGAMOS LAS MATERIAS DE LA API
  const getSubjectColor = (subject: GeneralScheduleItem): string => {
    // Color by semester instead of subject name
    const semesterColors: { [key: number]: string } = {
      1: 'text-blue-600',
      2: 'text-green-600',
      3: 'text-purple-600',
      4: 'text-amber-600',
      5: 'text-rose-600',
      6: 'text-cyan-600',
      7: 'text-indigo-600',
      8: 'text-emerald-600'
    };
    return semesterColors[subject.Semestre] || 'text-gray-600';
  };

  // Componente para una celda que se puede arrastrar
  const DraggableCell = ({ item, heightClass, occurrence }: 
    { item: GeneralScheduleItem; heightClass: string; occurrence: { day: string; time: string } }) => {
    const [{ isDragging }, dragRef] = useDrag(() => ({
      type: 'scheduleItem',
      item: { item, occurrence },
      collect: (monitor) => ({
        isDragging: monitor.isDragging(),
      }),
    }));

    // Function to abbreviate subject name
    const getAbbreviatedName = (subject: string) => {
      const words = subject.split(' ');
      if (words.length === 1) {
        // If one word, take first 3 letters
        return subject.slice(0, 3).toUpperCase();
      } else {
        // If multiple words, take first letter of each word
        return words.map(word => word[0].toUpperCase()).join('');
      }
    };

    return (
      <div
        ref={(node) => { if (typeof dragRef === 'function') dragRef(node); }}
        className={cn(
          'p-1 text-xs cursor-pointer rounded-md border border-gray-200 bg-white shadow-sm h-full',
          'hover:shadow-md transition-shadow flex flex-col justify-center items-center gap-0.5',
          isDragging && 'opacity-50',
          heightClass
        )}
        onClick={(e) => {
          e.stopPropagation();
          setSelectedSubject(item);
        }}
        data-tooltip={`${item.NombreCarrera}\nProfesor: ${item.IdProfesor}\nSemestre: ${item.Semestre}`}
      >
        <div className={cn('font-medium text-center', getSubjectColor(item))}>
          {getAbbreviatedName(item.NombreCarrera)}
        </div>
        <div className="text-[10px] text-gray-500">S{item.Semestre}</div>
      </div>
    );
  };

  // Componente para celdas que se pueden soltar
  const Cell = ({ day, time }: { day: string; time: string }) => {
    const items = scheduleMatrix[time][day];
    
    const [{ isOver }, dropRef] = useDrop(() => ({
      accept: 'scheduleItem',
      drop: (dragItem: { item: GeneralScheduleItem; occurrence: { day: string; time: string } }) => {
        moveItem(dragItem, day, time);
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
        ref={(node) => { if (typeof dropRef === 'function') dropRef(node); }}
        className={cn(
          'border border-gray-200 p-1 relative h-full',
          items.length > 0 ? 'bg-blue-50/50' : 'bg-white',
          isOver && 'bg-gray-100'
        )}
      >
        <div className="flex flex-row gap-0.5 h-full">
          {items.map((item, index) => (
            <DraggableCell 
              key={`${item.IdProfesor}-${item.IdMateria}-${index}`} 
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
                onClick={saveScheduleToDatabase}
                variant="outline"
                className="border-red-700 text-red-700 hover:bg-red-50"
                disabled={isLoading}
              >
                {isLoading ? 'Guardando...' : 'Guardar Horario'}
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
                item.IdProfesor === originalSubject.IdProfesor && 
                item.IdMateria === originalSubject.IdMateria && 
                item.Dia === originalSubject.Dia && 
                item.HoraInicio === originalSubject.HoraInicio
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
                !(item.IdProfesor === subjectToDelete.IdProfesor && 
                  item.IdMateria === subjectToDelete.IdMateria && 
                  item.Dia === subjectToDelete.Dia && 
                  item.HoraInicio === subjectToDelete.HoraInicio)
              )
            );
            setSelectedSubject(null);
          }}
        />

        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Agregar Nueva Clase</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="IdProfesor" className="text-right">ID Profesor</Label>
                <Input
                  id="IdProfesor"
                  type="number"
                  value={newClass.IdProfesor}
                  onChange={(e) => setNewClass({ ...newClass, IdProfesor: parseInt(e.target.value) })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="IdMateria" className="text-right">ID Materia</Label>
                <Input
                  id="IdMateria"
                  type="number"
                  value={newClass.IdMateria}
                  onChange={(e) => setNewClass({ ...newClass, IdMateria: parseInt(e.target.value) })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="Dia" className="text-right">Día</Label>
                <Select value={newClass.Dia} onValueChange={(value) => setNewClass({ ...newClass, Dia: value })}>
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
                <Label htmlFor="HoraInicio" className="text-right">Hora Inicio</Label>
                <Select value={newClass.HoraInicio} onValueChange={(value) => setNewClass({ ...newClass, HoraInicio: value })}>
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
                <Label htmlFor="HoraFin" className="text-right">Hora Fin</Label>
                <Select value={newClass.HoraFin} onValueChange={(value) => setNewClass({ ...newClass, HoraFin: value })}>
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
                <Label htmlFor="Semestre" className="text-right">Semestre</Label>
                <Select value={newClass.Semestre.toString()} onValueChange={(value) => setNewClass({ ...newClass, Semestre: parseInt(value) })}>
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
                setSchedule([...schedule, newClass]);
                setIsAddDialogOpen(false);
                setNewClass({
                  IdProfesor: 0,
                  IdMateria: 0,
                  Dia: 'Lunes',
                  HoraInicio: '07:00',
                  HoraFin: '08:00',
                  Semestre: 1,
                  IdHorarioGeneral: 1,
                  NombreCarrera: 'Ingeniería en Sistemas',
                  IdCiclo: 1
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
