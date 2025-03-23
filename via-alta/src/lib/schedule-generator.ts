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

export async function generateSchedule(): Promise<ScheduleItem[]> {
  // Configuración base
  const days = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
  const timeSlots: string[] = [];
  for (let hour = 7; hour < 16; hour++) {
    const start = `${hour.toString().padStart(2, '0')}:00`;
    timeSlots.push(start);
  }
    
  // Recursos disponibles para generar el horario
  const teachers = [
    { name: 'Profesor A', subject: 'Matemáticas', availability: ['Lunes', 'Miércoles', 'Viernes'], semester: 1 },
    { name: 'Profesor B', subject: 'Inglés', availability: ['Martes', 'Jueves', 'Viernes'], semester: 2 },
    { name: 'Profesor C', subject: 'Ciencias', availability: ['Lunes', 'Jueves', 'Viernes'], semester: 3 },
    { name: 'Profesor D', subject: 'Historia', availability: ['Martes', 'Miércoles', 'Viernes'], semester: 4 },
    { name: 'Profesor E', subject: 'Arte', availability: ['Lunes', 'Viernes'], semester: 1 },
  ];
    
  const classrooms = [
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
    
  // Generación del horario
  days.forEach(day => {
    timeSlots.forEach(timeSlot => {
      // Obtiene profesores y aulas disponibles para este horario
      const availableTeachers = shuffleArray(
        teachers.filter(teacher =>
          teacher.availability.includes(day) &&
          !bookings.teachers.get(teacher.name)?.has(`${day}-${timeSlot}`)
        )
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