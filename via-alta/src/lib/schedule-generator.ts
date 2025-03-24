// Generador de horarios para el sistema Via Alta
// Define la estructura de un elemento del horario
export interface ScheduleItem {
  teacher: string;
  subject: string;
  day: string;
  time: string;
  endTime: string;
  classroom: string;
  semester: number;
}

// Define time frame structure
interface TimeFrame {
  start: string;
  end: string;
}

// Define day availability structure
interface DayAvailability {
  day: string;
  timeFrames: TimeFrame[];
}

// Define teacher structure
interface Teacher {
  name: string;
  subject: string;
  availability: DayAvailability[];
  semester: number;
}

// Define classroom structure
interface Classroom {
  name: string;
  availability: string[];
}

export async function generateSchedule(): Promise<ScheduleItem[]> {
  // Configuración base
  const days = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
  const timeSlots: string[] = [];
  for (let hour = 7; hour < 16; hour++) {
    const start = `${hour.toString().padStart(2, '0')}:00`;
    timeSlots.push(start);
  }
    
  // Recursos disponibles para generar el horario con franjas de tiempo detalladas
  const teachers: Teacher[] = [
    { 
      name: 'Profesor A', 
      subject: 'Matemáticas', 
      availability: [
        { day: 'Lunes', timeFrames: [{ start: '07:00', end: '12:00' }] },
        { day: 'Miércoles', timeFrames: [{ start: '08:00', end: '15:00' }] },
        { day: 'Viernes', timeFrames: [{ start: '07:00', end: '11:00' }] }
      ], 
      semester: 1 
    },
    { 
      name: 'Profesor B', 
      subject: 'Inglés', 
      availability: [
        { day: 'Martes', timeFrames: [{ start: '07:00', end: '10:00' }, { start: '12:00', end: '15:00' }] },
        { day: 'Jueves', timeFrames: [{ start: '09:00', end: '14:00' }] },
        { day: 'Viernes', timeFrames: [{ start: '10:00', end: '13:00' }] }
      ], 
      semester: 2 
    },
    { 
      name: 'Profesor C', 
      subject: 'Ciencias', 
      availability: [
        { day: 'Lunes', timeFrames: [{ start: '08:00', end: '13:00' }] },
        { day: 'Jueves', timeFrames: [{ start: '07:00', end: '12:00' }] },
        { day: 'Viernes', timeFrames: [{ start: '11:00', end: '15:00' }] }
      ], 
      semester: 3 
    },
    { 
      name: 'Profesor D', 
      subject: 'Historia', 
      availability: [
        { day: 'Martes', timeFrames: [{ start: '10:00', end: '15:00' }] },
        { day: 'Miércoles', timeFrames: [{ start: '07:00', end: '11:00' }] },
        { day: 'Viernes', timeFrames: [{ start: '12:00', end: '15:00' }] }
      ], 
      semester: 4 
    },
    { 
      name: 'Profesor E', 
      subject: 'Arte', 
      availability: [
        { day: 'Lunes', timeFrames: [{ start: '11:00', end: '15:00' }] },
        { day: 'Viernes', timeFrames: [{ start: '08:00', end: '12:00' }] }
      ], 
      semester: 1 
    },
  ];
    
  const classrooms: Classroom[] = [
    { name: 'Aula 101', availability: days },
    { name: 'Aula 102', availability: ['Lunes', 'Miércoles', 'Viernes'] },
    { name: 'Aula 103', availability: ['Martes', 'Jueves'] },
  ];
    
  const schedule: ScheduleItem[] = [];
  
  // Sistema de registro de ocupación para profesores y aulas
  const bookings = {
    teachers: new Map<string, Set<string>>(),
    classrooms: new Map<string, Set<string>>(),
  };
    
  // Inicializa el registro de ocupación
  teachers.forEach(teacher => {
    bookings.teachers.set(teacher.name, new Set());
  });
  classrooms.forEach(classroom => {
    bookings.classrooms.set(classroom.name, new Set());
  });
    
  // Función auxiliar para agregar una hora a un horario dado (formato "HH:MM")
  const addOneHour = (time: string): string => {
    const [hourStr, minute] = time.split(':');
    const hour = parseInt(hourStr, 10) + 1;
    return `${hour.toString().padStart(2, '0')}:${minute}`;
  };
  
  // Función para verificar si un horario está dentro de un rango de disponibilidad
  const isTimeInFrames = (timeSlot: string, timeFrames: TimeFrame[]): boolean => {
    const endTime = addOneHour(timeSlot);
    
    // Convierte los horarios a minutos para facilitar la comparación
    const timeSlotMinutes = convertTimeToMinutes(timeSlot);
    const endTimeMinutes = convertTimeToMinutes(endTime);
    
    return timeFrames.some(frame => {
      const frameStartMinutes = convertTimeToMinutes(frame.start);
      const frameEndMinutes = convertTimeToMinutes(frame.end);
      
      return timeSlotMinutes >= frameStartMinutes && endTimeMinutes <= frameEndMinutes;
    });
  };
  
  // Función auxiliar para convertir tiempo (HH:MM) a minutos
  const convertTimeToMinutes = (time: string): number => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  };
    
  // Generación del horario
  days.forEach(day => {
    timeSlots.forEach(timeSlot => {
      // Obtiene profesores disponibles para este horario
      const availableTeachers = shuffleArray(
        teachers.filter(teacher => {
          // Verifica si el profesor tiene disponibilidad en este día
          const dayAvailability = teacher.availability.find(avail => avail.day === day);
          if (!dayAvailability) return false;
          
          // Verifica si el horario está dentro de las franjas de tiempo disponibles
          const isAvailableTime = isTimeInFrames(timeSlot, dayAvailability.timeFrames);
          
          // Verifica que el profesor no esté ocupado en este horario
          const isNotBooked = !bookings.teachers.get(teacher.name)?.has(`${day}-${timeSlot}`);
          
          return isAvailableTime && isNotBooked;
        })
      );
    
      const availableClassrooms = shuffleArray(
        classrooms.filter(classroom =>
          classroom.availability.includes(day) &&
          !bookings.classrooms.get(classroom.name)?.has(`${day}-${timeSlot}`)
        )
      );
    
      // Asigna profesores a aulas disponibles
      availableTeachers.forEach(teacher => {
        const classroom = availableClassrooms.shift();
        if (classroom) {
          schedule.push({
            teacher: teacher.name,
            subject: teacher.subject,
            day,
            time: timeSlot,
            endTime: addOneHour(timeSlot),
            classroom: classroom.name,
            semester: teacher.semester
          });
    
          // Registra la ocupación del profesor y el aula
          bookings.teachers.get(teacher.name)?.add(`${day}-${timeSlot}`);
          bookings.classrooms.get(classroom.name)?.add(`${day}-${timeSlot}`);
        }
      });
    });
  });
    
  // Simula una demora en la generación para mejor experiencia de usuario
  return new Promise(resolve => setTimeout(() => resolve(schedule), 500));
}
    
// Función auxiliar para mezclar aleatoriamente un array
function shuffleArray<T>(array: T[]): T[] {
  return [...array].sort(() => Math.random() - 0.5);
}