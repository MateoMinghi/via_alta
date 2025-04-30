'use client';

import React, { useState, useEffect } from 'react';
import CoordinadorSchedule from '@/components/CoordinadorSchedule';
import GroupInfoDialog from '@/components/GroupInfoDialog';
import AddGroupDialog from '@/components/AddGroupDialog';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

// Define item types for drag and drop
const ItemTypes = {
  SCHEDULE_ITEM: 'schedule_item'
};

// Días de la semana para mostrar en el horario
const daysOfWeek = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];

// Franjas horarias disponibles en el horario (formato 24h)
const timeSlots = [
  '07:00', '07:30', '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
  '11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '14:00',
  '14:30', '15:00', '15:30', '16:00'
];

// Color classes for each semester - keep for backward compatibility
const semesterColors: Record<number, string> = {
  1: 'bg-green-50 hover:bg-green-100 border-green-200 text-green-700',
  2: 'bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-700',
  3: 'bg-yellow-50 hover:bg-yellow-100 border-yellow-200 text-yellow-700',
  4: 'bg-purple-50 hover:bg-purple-100 border-purple-200 text-purple-700',
  5: 'bg-pink-50 hover:bg-pink-100 border-pink-200 text-pink-700',
  6: 'bg-indigo-50 hover:bg-indigo-100 border-indigo-200 text-indigo-700',
  7: 'bg-red-50 hover:bg-red-100 border-red-200 text-red-700',
  8: 'bg-teal-50 hover:bg-teal-100 border-teal-200 text-teal-700'
};

function getSemesterColor(sem: number | undefined) {
  if (!sem || !(sem in semesterColors)) return 'bg-gray-50 hover:bg-gray-100 border-gray-200 text-gray-700';
  return semesterColors[sem];
}

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
  IdMateria?: number;
  IdProfesor?: number;
  IdSalon?: number;
}

// Function to get subject color based on subject name
const getSubjectColor = (subjectName: string): { text: string, border: string, bg: string } => {
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
  
  // Create a hash based on subject name for consistent colors
  let hashCode = 0;
  for (let i = 0; i < subjectName.length; i++) {
    hashCode = ((hashCode << 5) - hashCode) + subjectName.charCodeAt(i);
    hashCode = hashCode & hashCode;
  }
  
  const colorIndex = Math.abs(hashCode) % colorOptions.length;
  return colorOptions[colorIndex];
};

// Draggable schedule item
function DraggableScheduleItem({ item, onClick }: { item: GeneralScheduleItem, onClick: () => void }) {
  const colors = getSubjectColor(item.MateriaNombre || '');
  const [{ isDragging }, dragRef] = useDrag({
    type: ItemTypes.SCHEDULE_ITEM,
    item: () => ({ id: item.IdGrupo }),
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  });
  
  // Using a callback ref with proper TypeScript handling
  const refCallback = React.useCallback(
    (node: HTMLDivElement | null) => {
      dragRef(node);
    },
    [dragRef]
  );

  return (
    <div
      ref={refCallback}
      className={cn(
        'p-1 text-xs rounded-md border shadow-sm h-full',
        'flex justify-between items-center',
        `border-l-4 ${colors.border}`,
        `${colors.bg} cursor-grab hover:shadow-md transition-all bg-opacity-90 hover:bg-opacity-100`,
        isDragging && 'opacity-50 cursor-grabbing scale-[0.97]',
        'w-full'
      )}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
    >
      <div className={cn("truncate font-medium flex-1", colors.text)}>
        {item.MateriaNombre || 'Sin nombre'}
      </div>
    </div>
  );
}

// Droppable cell component
function DroppableCell({ day, time, children, onDrop }: { 
  day: string; 
  time: string; 
  children?: React.ReactNode;
  onDrop: (id: number, day: string, time: string) => void;
}) {
  const [{ isOver, canDrop }, dropRef] = useDrop({
    accept: ItemTypes.SCHEDULE_ITEM,
    drop: (item: { id: number }) => {
      console.log(`Dropping item ${item.id} onto ${day} at ${time}`);
      onDrop(item.id, day, time);
      return { dropped: true };
    },
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
      canDrop: !!monitor.canDrop(),
    }),
  });

  const refCallback = React.useCallback(
    (node: HTMLDivElement | null) => {
      dropRef(node);
    },
    [dropRef]
  );

  return (
    <div 
      ref={refCallback}
      className={cn(
        "border border-gray-200 p-1 relative h-full",
        isOver && canDrop && "bg-blue-100/50 border-blue-300",
        "transition-colors duration-200"
      )}
    >
      {children}
    </div>
  );
}

// Custom schedule grid with drag and drop support
const ScheduleGrid = ({ 
  items,
  onDropItem,
  normalizeDay,
  timeToMinutes,
  onSelectGroup,
  onOpenDialog
}: { 
  items: GeneralScheduleItem[],
  onDropItem: (itemId: number, newDay: string, newTime: string) => void,
  normalizeDay: (day: string) => string,
  timeToMinutes: (time: string | undefined | null) => number,
  onSelectGroup: (group: GeneralScheduleItem) => void,
  onOpenDialog: () => void
}) => {
  // Create a matrix to arrange items by time and day
  const scheduleMatrix: Record<string, Record<string, GeneralScheduleItem[]>> = {};
  
  // Initialize empty schedule matrix
  timeSlots.forEach(time => {
    scheduleMatrix[time] = {};
    daysOfWeek.forEach(day => {
      scheduleMatrix[time][day] = [];
    });
  });
  
  // Fill the matrix with schedule items
  items.forEach(item => {
    const normalizedDay = normalizeDay(item.Dia);
    const startTime = timeToMinutes(item.HoraInicio);
    const endTime = timeToMinutes(item.HoraFin);
    
    // Add the item to each timeslot it spans
    timeSlots.forEach(slot => {
      const slotTime = timeToMinutes(slot);
      if (slotTime >= startTime && slotTime < endTime) {
        if (scheduleMatrix[slot]?.[normalizedDay]) {
          scheduleMatrix[slot][normalizedDay].push(item);
        }
      }
    });
  });

  // Handle click on item to show info
  const handleItemClick = (item: GeneralScheduleItem) => {
    onSelectGroup(item);
    onOpenDialog();
  };

  return (
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
              {/* Time cells for each day */}
              {daysOfWeek.map((day) => {
                const cellItems = scheduleMatrix[time]?.[day] || [];
                return (
                  <DroppableCell 
                    key={`${day}-${time}`} 
                    day={day} 
                    time={time}
                    onDrop={onDropItem}
                  >
                    <div className="flex flex-row gap-0.5 h-full">
                      {cellItems.map((item, index) => (
                        <DraggableScheduleItem
                          key={`${item.IdGrupo}-${index}`}
                          item={item}
                          onClick={() => handleItemClick(item)}
                        />
                      ))}
                    </div>
                  </DroppableCell>
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
};

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
    IdMateria: raw.IdMateria ?? raw.idmateria,
    IdProfesor: raw.IdProfesor ?? raw.idprofesor,
    IdSalon: raw.IdSalon ?? raw.idsalon,
  });
  
  const [schedule, setSchedule] = useState<GeneralScheduleItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<GeneralScheduleItem | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [addGroupDialogOpen, setAddGroupDialogOpen] = useState(false);
  const [editGroupData, setEditGroupData] = useState<GeneralScheduleItem | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [groupToDelete, setGroupToDelete] = useState<GeneralScheduleItem | null>(null);
  
  const [selectedSemester, setSelectedSemester] = useState<number | 'All'>('All');
  const [selectedMajor, setSelectedMajor] = useState<string>('All');
  // Available options
  const semesters = ['All', 1, 2, 3, 4, 5, 6, 7, 8] as const;
  const majors = Array.from(new Set(schedule.map(i => i.NombreCarrera)));
  // Filtered schedule based on selections
  const filteredSchedule = schedule.filter(i =>
    (selectedSemester === 'All' || i.Semestre === selectedSemester) &&
    (selectedMajor === 'All' || i.NombreCarrera === selectedMajor)
  );

  // Function to fetch schedule with polling capability
  const fetchSchedule = async (showLoading = true) => {
    if (showLoading) {
      setIsLoading(true);
    }
    
    try {
      const timestamp = Date.now(); // Add cache-busting query param
      const res = await fetch(`/api/schedule?ts=${timestamp}`);
      const data = await res.json();
      
      if (data.success) {
        console.log('Schedule data received:', data);
        
        // Update the schedule data
        setSchedule(data.data.map(mapRawScheduleItem));
        
        // Check if generation is still in progress
        if (data.isProcessing) {
          console.log('Schedule generation is still in progress.');
          return false; // Return false to indicate processing is ongoing
        } else {
          console.log('Schedule data is up to date.');
          return true; // Return true to indicate processing is complete
        }
      } else {
        console.log('Error in schedule data:', data);
        setSchedule([]);
        return true; // Stop polling on error
      }
    } catch (err) {
      console.error('Error fetching schedule:', err);
      setSchedule([]);
      return true; // Stop polling on error
    } finally {
      if (showLoading) {
        setIsLoading(false);
      }
    }
  };
  
  // Function to start polling when generation is in progress
  const startPolling = () => {
    setIsGenerating(true);
    
    const poll = async () => {
      console.log('Polling for schedule updates...');
      const isComplete = await fetchSchedule(false);
      
      if (isComplete) {
        // Generation is complete, stop polling
        setIsGenerating(false);
        toast.success('¡Horario general generado y actualizado exitosamente!');
        setIsLoading(false); // Ensure loading indicator is off
      } else {
        // Schedule another poll in a few seconds
        setTimeout(poll, 5000); // Poll every 5 seconds
      }
    };
    
    // Start the polling process
    poll();
  };
  
  // Fetch the general schedule from the API on component mount
  useEffect(() => {
    fetchSchedule();
  }, []);
  
  // Generar controlador de horario
  const handleGenerateSchedule = async () => {
    setIsLoading(true);
    
    try {
      console.log('Starting schedule generation...');
      const res = await fetch('/api/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      
      const data = await res.json();
      console.log('Generation response:', data);
      
      if (data.success) {
        // Set schedule to empty to show that regeneration is happening
        setSchedule([]);
        
        toast.info('Generando horario general. Por favor espere...');
        
        // Start polling to automatically update when complete
        startPolling();
      } else {
        toast.error(`Error al generar el horario: ${data.error || 'Error desconocido'}`);
        setIsLoading(false);
      }
    } catch (err) {
      console.error('Error initiating schedule generation:', err);
      toast.error('Error al iniciar la generación del horario');
      setIsLoading(false);
    }
  };

  // Ayuda para convertir HH:MM a minutos
  const timeToMinutes = (time: string | undefined | null): number => {
    if (!time) return 0;
    const [h, m] = time.split(":").map(Number);
    return h * 60 + m;
  };

  // Ayudante para obtener la cadena de tiempo en minutos
  const minutesToTime = (minutes: number): string => {
    const h = Math.floor(minutes / 60).toString().padStart(2, '0');
    const m = (minutes % 60).toString().padStart(2, '0');
    return `${h}:${m}`;
  };
  
  // Normaliza los nombres de los días
  function normalizeDay(day: string): string {
    switch (day.toLowerCase()) {
      case 'monday':
      case 'lun':
      case 'lunes': 
        return 'Lunes';
      case 'tuesday':
      case 'mar':
      case 'martes':
        return 'Martes';
      case 'wednesday':
      case 'mié':
      case 'miercoles':
      case 'miércoles':
        return 'Miércoles';
      case 'thursday':
      case 'jue':
      case 'jueves':
        return 'Jueves';
      case 'friday':
      case 'vie':
      case 'viernes':
        return 'Viernes';    
      default:
        return day;
    }
  }

  // Manejar gota: actualizar el día del elemento y la hora de inicio/finalización (solo UI)
  const handleDropItem = (itemId: number, newDay: string, newTime: string) => {
    console.log(`handleDropItem called with: itemId=${itemId}, newDay=${newDay}, newTime=${newTime}`);
    
    // Encontrar el item que estamos actualizando
    const itemToUpdate = schedule.find(item => item.IdGrupo === itemId);
    if (!itemToUpdate) {
      console.error(`Item with id ${itemId} not found in schedule`);
      return;
    }
    
    // Calculo de duración en minutos
    const duration = timeToMinutes(itemToUpdate.HoraFin) - timeToMinutes(itemToUpdate.HoraInicio);
    const newStart = timeToMinutes(newTime);
    const newEnd = newStart + duration;
    
    const updatedItem = {
      ...itemToUpdate,
      Dia: newDay,
      HoraInicio: minutesToTime(newStart),
      HoraFin: minutesToTime(newEnd)
    };
    
    console.log('Original item:', itemToUpdate);
    console.log('Updated item:', updatedItem);
    
    // Update UI only - no API call
    setSchedule(prev => prev.map(item => item.IdGrupo === itemId ? updatedItem : item));
    toast.info('Cambios realizados. Haga clic en "Guardar Horario" para persistir los cambios.');
  };

  // Function to save schedule changes to the database
  const handleSaveSchedule = async () => {
    setIsLoading(true);
    try {
      console.log('Saving schedule changes...');
      const res = await fetch('/api/schedule', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ schedule }) 
      });
      const data = await res.json();
      
      if (data.success) {
        toast.success('Horario guardado exitosamente');
      } else {
        toast.error(`Error al guardar el horario: ${data.error || 'Error desconocido'}`);
      }
    } catch (err) {
      console.error('Error saving schedule:', err);
      toast.error('Error al guardar el horario');
    } finally {
      setIsLoading(false);
    }
  };

  // Function to add a new group to the schedule
  const handleAddGroup = (newGroup: GeneralScheduleItem) => {
    // When editing an existing group
    if (editGroupData) {
      // Replace the existing group with the updated one
      setSchedule(prevSchedule => 
        prevSchedule.map(group => 
          group.IdGrupo === editGroupData.IdGrupo ? newGroup : group
        )
      );
      setEditGroupData(null);
      toast.success('Grupo actualizado. Haga clic en "Guardar Horario" para persistir los cambios.');
    } else {
      // Add new group to the current schedule
      setSchedule([...schedule, newGroup]);
      toast.success('Nuevo grupo añadido. Haga clic en "Guardar Horario" para persistir los cambios.');
    }
  };

  // Function to handle editing a group
  const handleEditGroup = (group: GeneralScheduleItem) => {
    setEditGroupData(group);
    setAddGroupDialogOpen(true);
  };

  // Function to handle deleting a group
  const handleDeleteGroup = (group: GeneralScheduleItem) => {
    setGroupToDelete(group);
    setDeleteConfirmOpen(true);
  };

  // Function to confirm deletion of a group
  const confirmDeleteGroup = () => {
    if (!groupToDelete) return;
    
    setSchedule(prevSchedule => 
      prevSchedule.filter(group => group.IdGrupo !== groupToDelete.IdGrupo)
    );
    
    setDeleteConfirmOpen(false);
    setGroupToDelete(null);
    toast.success('Grupo eliminado. Haga clic en "Guardar Horario" para persistir los cambios.');
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="w-full pb-8 flex flex-col gap-4">
        <div className="flex justify-between items-center mb-2">
          {/* Filters */}
          <div className="flex gap-4 items-center">
            <div>
              <label className="mr-2">Semestre:</label>
              <select
                value={selectedSemester}
                onChange={e => setSelectedSemester(e.target.value === 'All' ? 'All' : Number(e.target.value))}
                className="border p-1 rounded"
              >
                {semesters.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mr-2">Carrera:</label>
              <select
                value={selectedMajor}
                onChange={e => setSelectedMajor(e.target.value)}
                className="border p-1 rounded"
              >
                <option value="All">All</option>
                {majors.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>          
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => {
                setEditGroupData(null);
                setAddGroupDialogOpen(true);
              }}
              className="px-4 py-2 bg-green-700 text-white rounded hover:bg-green-600 disabled:opacity-50"
              disabled={isLoading}
            >
              Agregar Grupo
            </button>
            <button
              onClick={handleSaveSchedule}
              className="px-4 py-2 bg-red-800 text-white rounded hover:bg-red-700 disabled:opacity-50"
              disabled={isLoading}
            >
              {isLoading ? 'Guardando...' : 'Guardar Horario'}
            </button>
            <button
              onClick={handleGenerateSchedule}
              className="px-4 py-2 bg-red-800 text-white rounded hover:bg-red-700 disabled:opacity-50"
              disabled={isLoading}
            >
              {isLoading ? 'Generando...' : 'Generar horario general'}
            </button>
          </div>
        </div>
        
        <div className="w-full flex justify-between flex-col gap-4">
          {/* Using our custom ScheduleGrid component with drag and drop support */}
          <ScheduleGrid 
            items={filteredSchedule} 
            onDropItem={handleDropItem} 
            normalizeDay={normalizeDay}
            timeToMinutes={timeToMinutes}
            onSelectGroup={setSelectedGroup}
            onOpenDialog={() => setDialogOpen(true)}
          />
        </div>
        
        {/* Dialog para añadir o editar un grupo */}
        <AddGroupDialog 
          isOpen={addGroupDialogOpen}
          onClose={() => {
            setAddGroupDialogOpen(false);
            setEditGroupData(null);
          }}
          onAdd={handleAddGroup}
          currentCycleId={schedule.length > 0 ? schedule[0].IdHorarioGeneral : 1}
          editGroupData={editGroupData}
        />
        
        {/* Dialog para mostrar información de grupo cuando se hace clic */}
        <GroupInfoDialog 
          open={dialogOpen} 
          onClose={() => setDialogOpen(false)} 
          group={selectedGroup} 
          onEdit={handleEditGroup}
          onDelete={handleDeleteGroup}
        />
        
        {/* Dialog de confirmación para eliminar grupo */}
        <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Está seguro de eliminar este grupo?</AlertDialogTitle>
              <AlertDialogDescription>
                Está a punto de eliminar el grupo {groupToDelete?.IdGrupo} - {groupToDelete?.MateriaNombre}. 
                Esta acción no se puede deshacer.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDeleteGroup} className="bg-red-600 hover:bg-red-700">
                Eliminar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        
        {isLoading && (
          <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-xl">
              <p className="text-lg text-center">Cargando horario...</p>
              <div className="mt-4 w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
            </div>
          </div>
        )}
      </div>
    </DndProvider>
  );
}