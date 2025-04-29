'use client';

import React, { useState, useEffect, useMemo } from 'react';
import GroupInfoDialog from '@/components/GroupInfoDialog';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, Lock, Plus, GripVertical, Search, Check, Star } from 'lucide-react';
import { Input } from '@/components/ui/input';

// Definir los tipos de elementos para el drag-and-drop
const ItemTypes = {
  SCHEDULE_ITEM: 'schedule_item',
  AVAILABLE_SUBJECT: 'available_subject',
  SUBJECT: 'subject'
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

// Tipos de datos para el horario
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
  isObligatory?: boolean;
}

// Interfaz extendida para los ítems del horario
interface ExtendedScheduleItem extends GeneralScheduleItem {
  isObligatory: boolean;
  isRecommended?: boolean;
  salon?: string;
  credits?: number;
  hours?: { 
    day: string;
    time?: string;
    timeStart?: string;
    timeEnd?: string;
  }[];
}

// Definir la interfaz para las propiedades del componente HorarioAlumno
interface HorarioAlumnoProps {
  schedule?: ExtendedScheduleItem[] | GeneralScheduleItem[];
  alumnoId?: string;
  isRegular?: boolean; // Flag para determinar si el alumno es regular o irregular
  isCoordinatorView?: boolean; // Identifica si el horario es para un coordinador
}

// Funcion para obtener el color del tema según el nombre de la materia
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
  
  // Crear un hashCode simple basado en el nombre de la materia
  let hashCode = 0;
  for (let i = 0; i < subjectName.length; i++) {
    hashCode = ((hashCode << 5) - hashCode) + subjectName.charCodeAt(i);
    hashCode = hashCode & hashCode;
  }
  
  const colorIndex = Math.abs(hashCode) % colorOptions.length;
  return colorOptions[colorIndex];
};

// Funcion para agrupar los ítems del horario por nombre de materia
const groupSubjectsByName = (subjects: ExtendedScheduleItem[]): ExtendedScheduleItem[] => {
  const subjectMap = new Map<string, ExtendedScheduleItem>();
  
  subjects.forEach(subject => {
    const name = subject.MateriaNombre || '';
    
    if (subjectMap.has(name)) {
      // Si ya existe la materia, actualizarla
      const existingSubject = subjectMap.get(name)!;
      
      // Solo agregar la hora si no existe
      const hourToAdd = {
        day: subject.Dia,
        timeStart: subject.HoraInicio,
        timeEnd: subject.HoraFin
      };
      
      // Revisar si la hora ya existe
      const alreadyExists = existingSubject.hours?.some(
        h => h.day === hourToAdd.day && 
             h.timeStart === hourToAdd.timeStart && 
             h.timeEnd === hourToAdd.timeEnd
      );
      
      if (!alreadyExists) {
        existingSubject.hours = [...(existingSubject.hours || []), hourToAdd];
      }
      
    } else {
      // Si es nueva, agregarla al mapa
      const newSubject = { ...subject };
      subjectMap.set(name, newSubject);
    }
  });
  
  // Convertir el mapa a un array
  return Array.from(subjectMap.values());
};

// DraggableScheduleItem: Componente para los ítems del horario que se pueden arrastrar
function DraggableScheduleItem({ item, onClick }: { item: ExtendedScheduleItem, onClick: () => void }) {
  const colors = getSubjectColor(item.MateriaNombre || '');
  
  // Determinamos el estilo y el ícono según el tipo de materia
  let iconBadge = null;
  
  if (item.isObligatory) {
    iconBadge = (
      <div className="absolute top-0 right-0 -mt-1 -mr-1 bg-amber-500 rounded-full p-0.5 shadow-md border border-white group">
        <Lock className="h-3 w-3 text-white" />
        <div className="absolute left-0 -mt-0.5 w-64 scale-0 group-hover:scale-100 transition-all bg-black text-white text-xs p-2 rounded shadow-lg z-50 -translate-y-full origin-bottom">
          Materia obligatoria que debe ser incluida en el horario del estudiante.
        </div>
      </div>
    );
  } else if (item.isRecommended) {
    iconBadge = (
      <div className="absolute top-0 right-0 -mt-1 -mr-1 bg-purple-500 rounded-full p-0.5 shadow-md border border-white group">
        <Star className="h-3 w-3 text-white" />
        <div className="absolute left-0 -mt-0.5 w-64 scale-0 group-hover:scale-100 transition-all bg-black text-white text-xs p-2 rounded shadow-lg z-50 -translate-y-full origin-bottom">
          Materia recomendada para el estudiante.
        </div>
      </div>
    );
  }
  
  return (
    <div
      className={cn(
        'p-1 text-xs rounded-md border shadow-sm h-full',
        'flex items-center',
        `border-l-4 ${colors.border}`,
        `${colors.bg}`,
        item.isObligatory && 'border-l-[6px]',
        'w-full cursor-pointer hover:brightness-95 relative'
      )}
      onClick={onClick}
    >
      {/* Mostrar el badge con el icono en la esquina superior derecha */}
      {iconBadge}
      
      <div className={cn("truncate font-medium flex-1", colors.text)}>
        {item.MateriaNombre}
      </div>
    </div>
  );
}

export default function HorarioAlumno({ schedule: providedSchedule, alumnoId, isRegular = false, isCoordinatorView = false }: HorarioAlumnoProps) {
  // Mappear los ítems del horario a un formato extendido
  const mapRawScheduleItem = (raw: any): ExtendedScheduleItem => {
    const item = {
      IdHorarioGeneral: raw.IdHorarioGeneral ?? raw.idhorariogeneral,
      NombreCarrera: raw.NombreCarrera ?? raw.nombrecarrera,
      IdGrupo: raw.IdGrupo ?? raw.idgrupo,
      Dia: raw.Dia ?? raw.dia,
      HoraInicio: (raw.HoraInicio ?? raw.horainicio ?? '').slice(0,5),
      HoraFin: (raw.HoraFin ?? raw.horafin ?? '').slice(0,5),
      Semestre: raw.Semestre ?? raw.semestre,
      MateriaNombre: raw.MateriaNombre ?? raw.materianombre,
      ProfesorNombre: raw.ProfesorNombre ?? raw.profesornombre,
      isObligatory: raw.isObligatory ?? false,
      isRecommended: raw.isRecommended ?? false,
      salon: raw.salon ?? 'Por asignar',
      credits: raw.credits ?? 0,
    };

    // Agregar la propiedad "hours" para almacenar los horarios
    item.hours = [{
      day: item.Dia,
      timeStart: item.HoraInicio,
      timeEnd: item.HoraFin
    }];

    return item;
  };
  
  const [schedule, setSchedule] = useState<ExtendedScheduleItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<ExtendedScheduleItem | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [availableSubjects, setAvailableSubjects] = useState<ExtendedScheduleItem[]>([]);
  const [recommendedSubjects, setRecommendedSubjects] = useState<ExtendedScheduleItem[]>([]);
  const [obligatorySubjects, setObligatorySubjects] = useState<ExtendedScheduleItem[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedSemester, setSelectedSemester] = useState<number | 'All'>('All');
  const [selectedMajor, setSelectedMajor] = useState<string>('All');
  
  // Opciones disponibles
  const semesters = ['All', 1, 2, 3, 4, 5, 6, 7, 8] as const;
  
  const majors = useMemo(() => {
    return Array.from(new Set(schedule.map(i => i.NombreCarrera)));
  }, [schedule]);
  
  const scheduledSubjects = useMemo(() => {
    return [...obligatorySubjects, ...recommendedSubjects];
  }, [obligatorySubjects, recommendedSubjects]);
  
  // Filtrar el horario según el semestre y la carrera seleccionados
  const filteredSchedule = useMemo(() => {
    return scheduledSubjects.filter(i =>
      (selectedSemester === 'All' || i.Semestre === selectedSemester) &&
      (selectedMajor === 'All' || i.NombreCarrera === selectedMajor)
    );
  }, [scheduledSubjects, selectedSemester, selectedMajor]);
  
  // Filtrar disponibles según el semestre y la carrera seleccionados
  const filteredAvailableSubjects = useMemo(() => {
    if (!searchTerm) return groupSubjectsByName(availableSubjects);
    return groupSubjectsByName(filterSubjectsBySearchTerm(availableSubjects, searchTerm));
  }, [availableSubjects, searchTerm]);
  
  // Filtrar materias obligatorias según el semestre y la carrera seleccionados
  const filteredObligatorySubjects = useMemo(() => {
    if (!searchTerm) return groupSubjectsByName(obligatorySubjects);
    return groupSubjectsByName(filterSubjectsBySearchTerm(obligatorySubjects, searchTerm));
  }, [obligatorySubjects, searchTerm]);
  
  // Filtrar materias recomendadas según el semestre y la carrera seleccionados
  const filteredRecommendedSubjects = useMemo(() => {
    if (!searchTerm) return groupSubjectsByName(recommendedSubjects);
    return groupSubjectsByName(filterSubjectsBySearchTerm(recommendedSubjects, searchTerm));
  }, [recommendedSubjects, searchTerm]);
  
  // Función para filtrar materias según el término de búsqueda
  const filterSubjectsBySearchTerm = (subjects: ExtendedScheduleItem[], term: string) => {
    const loweredTerm = term.toLowerCase();
    return subjects.filter(subject => 
      subject.MateriaNombre?.toLowerCase().includes(loweredTerm) || 
      subject.ProfesorNombre?.toLowerCase().includes(loweredTerm) ||
      subject.NombreCarrera?.toLowerCase().includes(loweredTerm)
    );
  };
  
  
  useEffect(() => {
    if (providedSchedule && providedSchedule.length > 0) {
      // Si se proporciona un horario, procesarlo directamente
      const processedItems = providedSchedule.map(item => mapRawScheduleItem(item));
      setSchedule(processedItems);
      
      // Extraer títulos únicos de las carreras del horario
      const uniqueDegrees = Array.from(new Set(
        processedItems
          .filter(item => item.NombreCarrera && item.NombreCarrera.trim() !== '')
          .map(item => item.NombreCarrera)
      ));
      
      console.log('Found degree programs:', uniqueDegrees);
      
      // Si hay títulos únicos, usar el primero como filtro por defecto
      if (uniqueDegrees.length > 0) {
        setSelectedMajor(uniqueDegrees[0]);
        console.log(`Auto-filtered by degree: ${uniqueDegrees[0]}`);
        
        // Filtrar los ítems para incluir solo aquellos de la carrera primaria
        const primaryDegreeItems = processedItems.filter(
          item => item.NombreCarrera === uniqueDegrees[0]
        );
        console.log(`Filtered from ${processedItems.length} to ${primaryDegreeItems.length} items for primary degree`);
        
        if (isRegular) {
          // Para estudiantes regulares, todas las materias son obligatorias y no modificables
          const allObligatory = primaryDegreeItems.map(s => ({...s, isObligatory: true, isRecommended: false}));
          setObligatorySubjects(allObligatory);
          setRecommendedSubjects([]);
          setAvailableSubjects([]);
        } else {
          // Para estudiantes irregulares, distribuir los ítems entre las listas
          const obligatory = primaryDegreeItems.slice(0, 3).map(s => ({...s, isObligatory: true, isRecommended: false}));
          const recommended = primaryDegreeItems.slice(3, 6).map(s => ({...s, isRecommended: true, isObligatory: false}));
          const available = primaryDegreeItems.slice(6);
          
          setObligatorySubjects(obligatory);
          setRecommendedSubjects(recommended);
          setAvailableSubjects(available);
        }
      } else {
        console.log('No degree information found in schedule data');
        if (isRegular) {
          const allObligatory = processedItems.map(s => ({...s, isObligatory: true, isRecommended: false}));
          setObligatorySubjects(allObligatory);
          setRecommendedSubjects([]);
          setAvailableSubjects([]);
        } else {
          const obligatory = processedItems.slice(0, 3).map(s => ({...s, isObligatory: true, isRecommended: false}));
          const recommended = processedItems.slice(3, 6).map(s => ({...s, isRecommended: true, isObligatory: false}));
          const available = processedItems.slice(6);
          
          setObligatorySubjects(obligatory);
          setRecommendedSubjects(recommended);
          setAvailableSubjects(available);
        }
      }
    } else {
      // De lo contrario, hacer una llamada a la API para obtener el horario
      const fetchSchedule = async () => {
        setIsLoading(true);
        try {
          // Si el alumnoId está definido, usarlo para obtener el horario del estudiante
          const endpoint = alumnoId 
            ? `/api/student-schedule?studentId=${alumnoId}` 
            : '/api/schedule';
          
          console.log(`Fetching schedule from: ${endpoint}`);
          const res = await fetch(endpoint);
          const data = await res.json();
          
          if (data.success) {
            console.log('Schedule data received:', data.data);
            const items = data.data.map(mapRawScheduleItem);
            setSchedule(items);
            
            // Extraer títulos únicos de las carreras del horario
            const uniqueDegrees = Array.from(new Set(
              items
                .filter(item => item.NombreCarrera && item.NombreCarrera.trim() !== '')
                .map(item => item.NombreCarrera)
            ));
            
            console.log('Found degree programs:', uniqueDegrees);
            
            // Si hay títulos únicos, usar el primero como filtro por defecto
            if (uniqueDegrees.length > 0) {
              setSelectedMajor(uniqueDegrees[0]);
              console.log(`Auto-filtered by degree: ${uniqueDegrees[0]}`);
              
              // Filtrar los ítems para incluir solo aquellos de la carrera primaria
              const primaryDegreeItems = items.filter(
                item => item.NombreCarrera === uniqueDegrees[0]
              );
              console.log(`Filtered from ${items.length} to ${primaryDegreeItems.length} items for primary degree`);
              
              if (isRegular) {
                // Para estudiantes regulares, todas las materias son obligatorias y no modificables
                const allObligatory = primaryDegreeItems.map(s => ({...s, isObligatory: true, isRecommended: false}));
                setObligatorySubjects(allObligatory);
                setRecommendedSubjects([]);
                setAvailableSubjects([]);
              } else {
                // Para estudiantes irregulares, distribuir los ítems entre las listas
                const obligatory = primaryDegreeItems.slice(0, 3).map(s => ({...s, isObligatory: true, isRecommended: false}));
                const recommended = primaryDegreeItems.slice(3, 6).map(s => ({...s, isRecommended: true, isObligatory: false}));
                const available = primaryDegreeItems.slice(6);
                
                setObligatorySubjects(obligatory);
                setRecommendedSubjects(recommended);
                setAvailableSubjects(available);
              }
            } else {
              console.log('No degree information found in schedule data');
              if (isRegular) {
                const allObligatory = items.map(s => ({...s, isObligatory: true, isRecommended: false}));
                setObligatorySubjects(allObligatory);
                setRecommendedSubjects([]);
                setAvailableSubjects([]);
              } else {
                const obligatory = items.slice(0, 3).map(s => ({...s, isObligatory: true, isRecommended: false}));
                const recommended = items.slice(3, 6).map(s => ({...s, isRecommended: true, isObligatory: false}));
                const available = items.slice(6);
                
                setObligatorySubjects(obligatory);
                setRecommendedSubjects(recommended);
                setAvailableSubjects(available);
              }
            }
          } else {
            console.log('No schedule data received:', data);
            setSchedule([]);
            setObligatorySubjects([]);
            setRecommendedSubjects([]);
            setAvailableSubjects([]);
          }
        } catch (err) {
          console.error('Error fetching schedule:', err);
          setSchedule([]);
        } finally {
          setIsLoading(false);
        }
      };
      fetchSchedule();
    }
  }, [providedSchedule, alumnoId, isRegular]);
  
  // Generar el horario
  const handleGenerateSchedule = async () => {
    setIsLoading(true);
    setObligatorySubjects([]);
    setRecommendedSubjects([]);
    try {
      console.log('Generating schedule...');
      const res = await fetch('/api/schedule', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) });
      const data = await res.json();
      console.log('Generation response:', data);
      
      if (data.success) {
        console.log('Fetching updated schedule...');
        const res2 = await fetch(`/api/schedule?ts=${Date.now()}`);
        const data2 = await res2.json();
        console.log('Updated schedule data:', data2);
        
        if (data2.success) {
          const items = data2.data.map(mapRawScheduleItem);
          setSchedule(items);
          
          // Distribuuir los ítems entre las listas
          const obligatory = items.slice(0, 3).map(s => ({...s, isObligatory: true, isRecommended: false}));
          const recommended = items.slice(3, 6).map(s => ({...s, isRecommended: true, isObligatory: false}));
          const available = items.slice(6);
          
          setObligatorySubjects(obligatory);
          setRecommendedSubjects(recommended);
          setAvailableSubjects(available);
          
          toast.success('Horario general generado correctamente');
        } else {
          toast.error('Error al obtener el horario actualizado');
        }
      } else {
        toast.error('Error al generar el horario general');
      }
    } catch (err) {
      console.error('Error generating/fetching schedule:', err);
      setObligatorySubjects([]);
      setRecommendedSubjects([]);
      toast.error('Error al generar/obtener el horario');
    } finally {
      setIsLoading(false);
    }
  };

  
  const timeToMinutes = (time: string | undefined | null): number => {
    if (!time) return 0;
    const [h, m] = time.split(":").map(Number);
    return h * 60 + (isNaN(m) ? 0 : m);
  };

  // Normalizar el día de la semana para que sea consistente
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

  
  const moveSubject = (subject: ExtendedScheduleItem, sourceList: string, targetList: string) => {
  
    const movedSubject = { ...subject };
    
    // Actualizar las propiedades isObligatory e isRecommended según la lista de destino
    if (targetList === 'obligatory') {
      movedSubject.isObligatory = true;
      movedSubject.isRecommended = false;
    } else if (targetList === 'recommended') {
      movedSubject.isObligatory = false;
      movedSubject.isRecommended = true;
    } else {
      movedSubject.isObligatory = false;
      movedSubject.isRecommended = false;
    }
    
    // Quitar de la lista de origen
    if (sourceList === 'obligatory') {
      setObligatorySubjects(obligatorySubjects.filter(s => s.IdGrupo !== subject.IdGrupo));
    } else if (sourceList === 'recommended') {
      setRecommendedSubjects(recommendedSubjects.filter(s => s.IdGrupo !== subject.IdGrupo));
    } else if (sourceList === 'available') {
      setAvailableSubjects(availableSubjects.filter(s => s.IdGrupo !== subject.IdGrupo));
    }
    
    // Agregar a la lista de destino
    if (targetList === 'obligatory') {
      setObligatorySubjects(prev => [...prev, movedSubject]);
      toast.success(`"${movedSubject.MateriaNombre}" marcada como obligatoria`);
    } else if (targetList === 'recommended') {
      setRecommendedSubjects(prev => [...prev, movedSubject]);
      toast.success(`"${movedSubject.MateriaNombre}" marcada como recomendada`);
    } else if (targetList === 'available') {
      setAvailableSubjects(prev => [...prev, movedSubject]);
      toast.info(`"${movedSubject.MateriaNombre}" movida a materias disponibles`);
    }
  };

  // Crear la matriz del horario
  const scheduleMatrix = useMemo(() => {
    const matrix: { [time: string]: { [day: string]: ExtendedScheduleItem[] } } = {};
    
    // Inicializar la matriz con franjas horarias y días de la semana
    timeSlots.forEach(time => {
      matrix[time] = {};
      daysOfWeek.forEach(day => {
        matrix[time][day] = [];
      });
    });
    
    // Rellenar la matriz con los ítems del horario
    filteredSchedule.forEach(item => {
      if (!item.hours) return;
      
      item.hours.forEach(hour => {
        const normalizedDay = normalizeDay(hour.day);
        const startTime = hour.timeStart || hour.time || item.HoraInicio;
        const endTime = hour.timeEnd || item.HoraFin;
        
        if (!startTime || !endTime) return;
        
        const start = timeToMinutes(startTime);
        const end = timeToMinutes(endTime);
        
        timeSlots.forEach(slot => {
          const slotTime = timeToMinutes(slot);
          if (slotTime >= start && slotTime < end) {
            if (matrix[slot]?.[normalizedDay]) {
              matrix[slot][normalizedDay].push(item);
            }
          }
        });
      });
    });
    
    return matrix;
  }, [filteredSchedule]);

  // Componente de celda del horario
  const Cell = ({ day, time }: { day: string; time: string }) => {
    const items = scheduleMatrix[time]?.[day] || [];

    return (
      <div
        className={cn(
          'border border-gray-200 p-1 relative h-full',
          items.length > 0 ? 'bg-blue-50/50' : 'bg-white'
        )}
      >
        <div className="flex flex-row gap-0.5 h-full">
          {items.map((item, index) => (
            <DraggableScheduleItem 
              key={`${item.IdGrupo}-${index}`} 
              item={item} 
              onClick={() => {
                setSelectedGroup(item);
                setDialogOpen(true);
              }}
            />
          ))}
        </div>
      </div>
    );
  };

  // Funcion para guardar el horario
  const handleSaveSchedule = async () => {
    setIsLoading(true);
    try {
      console.log('Saving schedule changes...');
      
      // Combinar ambas listas de materias
      const allScheduledSubjects = [...obligatorySubjects, ...recommendedSubjects];
      
      // Convertir el horario a un formato adecuado para guardar
      const scheduleToSave = allScheduledSubjects.map(item => ({
        IdHorarioGeneral: item.IdHorarioGeneral,
        NombreCarrera: item.NombreCarrera,
        IdGrupo: item.IdGrupo,
        Dia: item.Dia,
        HoraInicio: item.HoraInicio,
        HoraFin: item.HoraFin,
        Semestre: item.Semestre,
        MateriaNombre: item.MateriaNombre,
        ProfesorNombre: item.ProfesorNombre,
        isObligatory: item.isObligatory,
        isRecommended: item.isRecommended
      }));
      
      // Guardar el horario individual del estudiante
      const res = await fetch('/api/student-schedule', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ 
          studentId: alumnoId,
          schedule: scheduleToSave,
          confirm: true // Indica que queremos confirmar el horario
        }) 
      });
      const data = await res.json();
      
      if (data.success) {
        toast.success('Horario guardado y confirmado exitosamente');
        
        // Si no es vista de coordinador, confirmar el horario también
        if (!isCoordinatorView && alumnoId) {
          console.log('Confirming student schedule...');
          const confirmRes = await fetch('/api/confirm-schedule', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ studentId: alumnoId })
          });
          
          const confirmData = await confirmRes.json();
          if (confirmData.success) {
            toast.success('Confirmación de horario registrada');
          } else {
            console.error('Error confirming schedule:', confirmData.error);
            // No mostrar error al usuario ya que el horario se guardó correctamente
          }
        }
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
  
  // Componente para el cuadro de diálogo de información del grupo
  const DraggableSubjectCard = ({ 
    subject, 
    listType,
    onRemove,
    setSelectedGroup,
    setDialogOpen
  }: { 
    subject: ExtendedScheduleItem, 
    listType: 'obligatory' | 'recommended' | 'available',
    onRemove?: (id: number) => void,
    setSelectedGroup: (group: ExtendedScheduleItem | null) => void,
    setDialogOpen: (isOpen: boolean) => void
  }) => {
    const colors = getSubjectColor(subject.MateriaNombre || '');
    

    const [{ isDragging }, dragRef] = useDrag(() => ({
      type: ItemTypes.SUBJECT,
      item: { id: subject.IdGrupo, subject, sourceList: listType },
      collect: (monitor) => ({
        isDragging: !!monitor.isDragging()
      })
    }));
    
    // Usar una funcion de referencia para el drop target
    const attachRef = (el: HTMLDivElement | null) => {
      dragRef(el);
    };
    
    // Determinar el texto y el estilo del badge según el tipo de lista
    let badgeText = '';
    let badgeStyle = '';
    let statusIcon = null;
    
    if (listType === 'obligatory') {
      badgeText = 'Obligatoria';
      badgeStyle = 'bg-amber-100 text-amber-800 border border-amber-300';
      statusIcon = <Lock className="h-3 w-3" />;
    } else if (listType === 'recommended') {
      badgeText = 'Recomendada';
      badgeStyle = 'bg-purple-100 text-purple-800 border border-purple-300';
      statusIcon = <Star className="h-3 w-3" />;
    } else {
      badgeText = 'Disponible';
      badgeStyle = 'bg-gray-100 text-gray-800 border border-gray-300';
      statusIcon = null; // Quitamos el icono de Plus
    }
    
    // Acciones de los botones
    const renderActionButtons = () => {
      if (listType === 'available') {
        return (
          <div className="flex gap-1">
            <Button
              variant="outline" 
              size="sm"
              onClick={() => moveSubject(subject, 'available', 'obligatory')}
              className="h-6 p-0 px-1 border-amber-200 text-amber-600 hover:bg-amber-50 hover:text-amber-700 flex items-center justify-center gap-1"
              title="Marcar como obligatoria"
            >
              <Lock className="h-3 w-3" />
              <span className="text-xs">Cambiar</span>
            </Button>
            <Button 
              variant="outline"
              size="sm"
              onClick={() => moveSubject(subject, 'available', 'recommended')}
              className="h-6 p-0 px-1 border-purple-200 text-purple-600 hover:bg-purple-50 hover:text-purple-700 flex items-center justify-center gap-1"
              title="Marcar como recomendada"
            >
              <Star className="h-3 w-3" />
              <span className="text-xs">Cambiar</span>
            </Button>
          </div>
        );
      } else if (listType === 'obligatory') {
        return (
          <div className="flex gap-1">
            <Button
              variant="outline" 
              size="sm"
              onClick={() => moveSubject(subject, 'obligatory', 'recommended')}
              className="h-6 p-0 px-1 border-purple-200 text-purple-600 hover:bg-purple-50 hover:text-purple-700 flex items-center justify-center gap-1"
              title="Cambiar a recomendada"
            >
              <Star className="h-3 w-3" />
              <span className="text-xs">Cambiar</span>
            </Button>
            {onRemove && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onRemove(subject.IdGrupo)}
                className="h-6 w-6 p-0 text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600 flex items-center justify-center"
                title="Quitar materia"
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        );
      } else if (listType === 'recommended') {
        return (
          <div className="flex gap-1">
            <Button
              variant="outline" 
              size="sm"
              onClick={() => moveSubject(subject, 'recommended', 'obligatory')}
              className="h-6 p-0 px-1 border-amber-200 text-amber-600 hover:bg-amber-50 hover:text-amber-700 flex items-center justify-center gap-1"
              title="Cambiar a obligatoria"
            >
              <Lock className="h-3 w-3" />
              <span className="text-xs">Cambiar</span>
            </Button>
            {onRemove && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onRemove(subject.IdGrupo)}
                className="h-6 w-6 p-0 text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600 flex items-center justify-center"
                title="Quitar materia"
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        );
      }
      return null;
    };
    
    return (
      <div 
        ref={attachRef}
        className={cn(
          "flex flex-col border rounded-lg border-l-4 bg-white mb-1.5 p-1.5",
          `${colors.border}`,
          isDragging ? "opacity-50" : "",
          "hover:shadow-sm transition-all cursor-grab",
          listType === 'obligatory' ? "border-l-[6px]" : ""
        )}
      >
        {/* Header: Grid icon, badge with type indicator and action buttons */}
        <div className="flex justify-between items-center w-full mb-1">
          <div className="flex items-center gap-1.5">
            {/* DnD grip icon now first */}
            <GripVertical className="h-3 w-3 text-gray-400 cursor-grab" />
            
            {/* Badge with type */}
            <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs ${badgeStyle}`}>
              {statusIcon}
              <span className="font-medium">{badgeText}</span>
            </div>
          </div>
          
          <div className="flex items-center">
            {renderActionButtons()}
          </div>
        </div>
        
        {/* Subject info and more info button */}
        <div className="px-0.5 flex justify-between items-center">
          <div className={cn("font-semibold text-sm truncate mr-2", colors.text)}>
            {subject.MateriaNombre}
          </div>
          <Button
            variant="ghost" 
            size="sm"
            onClick={() => {
              setSelectedGroup(subject);
              setDialogOpen(true);
            }}
            className="h-6 px-2 py-0 text-xs bg-gray-50 hover:bg-gray-100 text-gray-700 flex items-center gap-1"
          >
            <span>Más info</span>
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-info text-gray-600">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 16v-4" />
              <path d="M12 8h.01" />
            </svg>
          </Button>
        </div>
        
        {/* Schedule badges */}
        <div className="flex flex-wrap gap-1 mt-1 px-0.5">
          {subject.hours?.slice(0, 2).map((hour, index) => (
            <span 
              key={`${hour.day}-${index}`} 
              className="inline-flex items-center px-1 py-0.5 rounded-md bg-blue-50 text-blue-700 text-xs"
            >
              <span className="font-medium">{hour.day.substring(0, 3)}</span>&nbsp;
              {hour.timeStart && hour.timeEnd ? 
                `${hour.timeStart}-${hour.timeEnd}` : 
                subject.HoraInicio && subject.HoraFin ? 
                `${subject.HoraInicio}-${subject.HoraFin}` : 
                '??:??-??:??'
              }
            </span>
          ))}
          {(subject.hours?.length || 0) > 2 && (
            <span className="inline-flex items-center px-1 py-0.5 rounded-md bg-gray-50 text-gray-700 text-xs">
              +{(subject.hours?.length || 0) - 2} más
            </span>
          )}
        </div>
      </div>
    );
  };

  
  const DroppableSubjectArea = ({ 
    listType,
    subjects,
    title,
    icon,
    description,
    emptyMessage,
    onRemoveSubject
  }: { 
    listType: 'obligatory' | 'recommended' | 'available',
    subjects: ExtendedScheduleItem[],
    title: string,
    icon: React.ReactNode,
    description: string,
    emptyMessage: string,
    onRemoveSubject?: (id: number) => void
  }) => {
    const [{ isOver }, dropRef] = useDrop(() => ({
      accept: ItemTypes.SUBJECT,
      drop: (item: { id: number, subject: ExtendedScheduleItem, sourceList: string }) => {
        if (item.sourceList !== listType) { 
          moveSubject(item.subject, item.sourceList, listType);
        }
        return undefined;
      },
      collect: (monitor) => ({
        isOver: !!monitor.isOver()
      })
    }));
    
    // Usar una función para manejar la referencia correctamente en TypeScript
    const attachRef = (el: HTMLDivElement | null) => {
      dropRef(el);
    };
    
    // Determinar el color de fondo según el estado de arrastre
    const bgColor = isOver ? 'bg-blue-50' : 'bg-white';
    
    // Custom header para el área de materias
    const renderHeader = () => {
      return (
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            {icon}
            <p className="text-base font-semibold">{title}</p>
          </div>
        </div>
      );
    };
    
    return (
      <div 
        ref={attachRef} 
        className={`p-3 border rounded-lg shadow-sm ${bgColor} transition-colors duration-200`}
      >
        {renderHeader()}
        
        <p className="text-xs text-gray-600 mb-2 flex items-center gap-1">
          <span>{description}</span>
        </p>
        
        {/* Empty state message */}
        {subjects.length === 0 && (
          <div className="flex items-center justify-center h-[60px] text-gray-400 p-2 border border-dashed rounded-lg">
            <p className="text-xs">{emptyMessage}</p>
          </div>
        )}
        
        {/* List of subjects - no scrollbar, items will naturally wrap */}
        <div className="space-y-1">
          {subjects.map((subject) => (
            <DraggableSubjectCard 
              key={subject.IdGrupo} 
              subject={subject} 
              listType={listType}
              onRemove={onRemoveSubject}
              setSelectedGroup={setSelectedGroup}
              setDialogOpen={setDialogOpen}
            />
          ))}
        </div>
      </div>
    );
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="w-full pb-8 flex flex-col gap-4">
        <div className="flex justify-between items-center mb-2">
          {/* Title and info */}
          <div className="flex flex-col">
            <p className="text-gray-500 text-sm">
              {isRegular && !isCoordinatorView 
                ? "Este es el horario fijo asignado al estudiante regular. No se puede modificar."
                : "Organice materias obligatorias, recomendadas y disponibles. Arrastre materias entre las listas."}
            </p>
          </div>
          
          {/* Action buttons - show for irregular students or coordinator view */}
          {(!isRegular || isCoordinatorView) && (
            <div className="flex gap-3">
              <Button
                onClick={handleSaveSchedule}
                className="px-4 py-2 bg-red-800 text-white rounded hover:bg-red-700 disabled:opacity-50"
                disabled={isLoading}
              >
                {isLoading ? 'Guardando...' : 'Guardar Horario'}
              </Button>
            </div>
          )}
        </div>
        
        <div className="w-full flex justify-between flex-col lg:flex-row gap-4">
          {/* Cuadrícula del horario semanal con horas */}
          <div className="overflow-x-auto flex-1">
            <div className="min-w-[800px]">
              <h2 className="font-bold mb-2">Vista previa del horario</h2>
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
          
          {/* Panel lateral con las listas de materias - show different UI based on edit permissions */}
          {isRegular && !isCoordinatorView ? (
            //Para estudiantes regulares sin permisos de edición: Solo mostrar lista de materias
            <div className="w-full lg:w-1/3 pl-0 lg:pl-4">
              <div className="p-3 border rounded-lg shadow-sm bg-white">
                <div className="flex items-center gap-2 mb-1">
                  <Lock className="text-amber-500 w-5 h-5" />
                  <p className="text-base font-semibold">Lista de Materias</p>
                </div>
                <p className="text-xs text-gray-600 mb-2">
                  Materias asignadas para este estudiante regular.
                </p>
                
                {/* List of subjects */}
                <div className="space-y-1">
                  {filteredObligatorySubjects.map((subject) => (
                    <div 
                      key={subject.IdGrupo}
                      className={cn(
                        "flex flex-col border rounded-lg border-l-4 bg-white mb-1.5 p-1.5",
                        `border-l-[6px] ${getSubjectColor(subject.MateriaNombre || '').border}`,
                      )}
                    >
                      {/* Header with badge */}
                      <div className="flex justify-between items-center w-full mb-1">
                        <div className="flex items-center gap-1.5">
                          <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs bg-amber-100 text-amber-800 border border-amber-300">
                            <Lock className="h-3 w-3" />
                            <span className="font-medium">Obligatoria</span>
                          </div>
                        </div>
                        
                        {/* Info button */}
                        <Button
                          variant="ghost" 
                          size="sm"
                          onClick={() => {
                            setSelectedGroup(subject);
                            setDialogOpen(true);
                          }}
                          className="h-6 px-2 py-0 text-xs bg-gray-50 hover:bg-gray-100 text-gray-700 flex items-center gap-1"
                        >
                          <span>Más info</span>
                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-info text-gray-600">
                            <circle cx="12" cy="12" r="10" />
                            <path d="M12 16v-4" />
                            <path d="M12 8h.01" />
                          </svg>
                        </Button>
                      </div>
                      
                      {/* Subject name */}
                      <div className="px-0.5">
                        <div className={cn(
                          "font-semibold text-sm truncate", 
                          getSubjectColor(subject.MateriaNombre || '').text
                        )}>
                          {subject.MateriaNombre}
                        </div>
                      </div>
                      
                      {/* Schedule badges */}
                      <div className="flex flex-wrap gap-1 mt-1 px-0.5">
                        {subject.hours?.slice(0, 2).map((hour, index) => (
                          <span 
                            key={`${hour.day}-${index}`} 
                            className="inline-flex items-center px-1 py-0.5 rounded-md bg-blue-50 text-blue-700 text-xs"
                          >
                            <span className="font-medium">{hour.day.substring(0, 3)}</span>&nbsp;
                            {hour.timeStart && hour.timeEnd ? 
                              `${hour.timeStart}-${hour.timeEnd}` : 
                              subject.HoraInicio && subject.HoraFin ? 
                              `${subject.HoraInicio}-${subject.HoraFin}` : 
                              '??:??-??:??'
                            }
                          </span>
                        ))}
                        {(subject.hours?.length || 0) > 2 && (
                          <span className="inline-flex items-center px-1 py-0.5 rounded-md bg-gray-50 text-gray-700 text-xs">
                            +{(subject.hours?.length || 0) - 2} más
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Empty state */}
                {filteredObligatorySubjects.length === 0 && (
                  <div className="flex items-center justify-center h-[60px] text-gray-400 p-2 border border-dashed rounded-lg">
                    <p className="text-xs">No hay materias asignadas</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            // Para estudiantes irregulares o vista de coordinador: Mostrar interfaz de edición
            <div className="w-full lg:w-1/3 pl-0 lg:pl-4">
              {/* Banner informativo para coordinadores que editan estudiantes regulares */}
              {isRegular && isCoordinatorView && (
                <div className="mb-4 py-2 px-3 bg-amber-50 border border-amber-200 rounded-md text-amber-800 text-sm">
                  <strong>Nota:</strong> Este estudiante es regular, pero como coordinador puede modificar su horario.
                </div>
              )}
              
              {/* Lista de materias obligatorias */}
              <DroppableSubjectArea 
                listType="obligatory"
                subjects={filteredObligatorySubjects}
                title="Materias Obligatorias"
                icon={<Lock className="text-amber-500 w-5 h-5" />}
                description="Materias que el estudiante debe cursar obligatoriamente."
                emptyMessage="No hay materias obligatorias asignadas"
                onRemoveSubject={(id) => moveSubject(
                  obligatorySubjects.find(s => s.IdGrupo === id)!,
                  'obligatory',
                  'available'
                )}
              />
              
              {/* Lista de materias recomendadas */}
              <div className="my-4">
                <DroppableSubjectArea 
                  listType="recommended"
                  subjects={filteredRecommendedSubjects}
                  title="Materias Recomendadas"
                  icon={<Star className="text-purple-500 w-5 h-5" />}
                  description="Materias sugeridas pero opcionales para el estudiante."
                  emptyMessage="No hay materias recomendadas asignadas"
                  onRemoveSubject={(id) => moveSubject(
                    recommendedSubjects.find(s => s.IdGrupo === id)!,
                    'recommended',
                    'available'
                  )}
                />
              </div>
              
              {/* Lista de materias disponibles */}
              <DroppableSubjectArea 
                listType="available"
                subjects={filteredAvailableSubjects}
                title="Materias Disponibles"
                icon={<Plus className="text-blue-500 w-5 h-5" />}
                description="Todas las materias disponibles para agregar al horario."
                emptyMessage="No hay materias disponibles para agregar"
              />
            </div>
          )}
        </div>
        
        {/* Dialog para mostrar información de grupo cuando se hace clic */}
        <GroupInfoDialog open={dialogOpen} onClose={() => setDialogOpen(false)} group={selectedGroup} />
        
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