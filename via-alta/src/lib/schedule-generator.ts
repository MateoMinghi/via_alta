// lib/schedule-generator.ts
export interface ScheduleItem {
    teacher: string;
    subject: string;
    day: string;
    time: string;
    endTime: string;
    classroom: string;
  }
  
export async function generateSchedule(): Promise<ScheduleItem[]> {
  // Configuration
  const days = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
  const timeSlots: string[] = [];
  for (let hour = 7; hour < 16; hour++) {
    const start = `${hour.toString().padStart(2, '0')}:00`;
    timeSlots.push(start);
  }
    
    // Resources
  const teachers = [
      { name: 'Profesor A', subject: 'Matemáticas', availability: ['Lunes', 'Miércoles', 'Viernes'] },
      { name: 'Profesor B', subject: 'Inglés', availability: ['Martes', 'Jueves', 'Viernes'] },
      { name: 'Profesor C', subject: 'Ciencias', availability: ['Lunes', 'Jueves', 'Viernes'] },
      { name: 'Profesor D', subject: 'Historia', availability: ['Martes', 'Miércoles', 'Viernes'] },
      { name: 'Profesor E', subject: 'Arte', availability: ['Lunes', 'Viernes'] },
  ];
    
  const classrooms = [
    { name: 'Aula 101', availability: days },
    { name: 'Aula 102', availability: ['Lunes', 'Miércoles', 'Viernes'] },
    { name: 'Aula 103', availability: ['Martes', 'Jueves'] },
  ];
    
    const schedule: ScheduleItem[] = [];
    const bookings = {
      teachers: new Map<string, Set<string>>(),
      classrooms: new Map<string, Set<string>>(),
    };
    
    // Initialize booking tracking
    teachers.forEach(teacher => {
      bookings.teachers.set(teacher.name, new Set());
    });
    classrooms.forEach(classroom => {
      bookings.classrooms.set(classroom.name, new Set());
    });
    
    // Helper function to add one hour to a given time string (format "HH:MM")
    const addOneHour = (time: string): string => {
      const [hourStr, minute] = time.split(':');
      const hour = parseInt(hourStr, 10) + 1;
      return `${hour.toString().padStart(2, '0')}:${minute}`;
    };
    
    // Generate schedule
    days.forEach(day => {
      timeSlots.forEach(timeSlot => {
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
    
        availableTeachers.forEach(teacher => {
          const classroom = availableClassrooms.shift();
          if (classroom) {
            schedule.push({
              teacher: teacher.name,
              subject: teacher.subject,
              day,
              time: timeSlot,
              endTime: addOneHour(timeSlot), // classes last 1 hour
              classroom: classroom.name,
            });
    
            bookings.teachers.get(teacher.name)?.add(`${day}-${timeSlot}`);
            bookings.classrooms.get(classroom.name)?.add(`${day}-${timeSlot}`);
          }
        });
      });
    });
    
    return new Promise(resolve => setTimeout(() => resolve(schedule), 500));
  }
    
function shuffleArray<T>(array: T[]): T[] {
  return [...array].sort(() => Math.random() - 0.5);
}