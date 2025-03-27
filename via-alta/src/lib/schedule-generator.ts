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
  credits: number;
  hoursProfessor: number | null;
  hoursIndependent: number | null;
  facilities: string | null;
}

// Define classroom structure
interface Classroom {
  name: string;
  availability: string[];
}

// Define course structure to match the JSON format
interface Course {
  id: number;
  name: string;
  sep_id: string;
  credits: string;
  sep_credits: string;
  hours_professor: number | null;
  hours_independent: number | null;
  facilities: string | null;
  plans_courses: {
    id: number;
    plan_id: number;
    course_id: number;
    semester: number;
  }[];
}

export async function generateSchedule(): Promise<ScheduleItem[]> {
  // Configuración base
  const days = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
  const timeSlots: string[] = [];
  for (let hour = 7; hour < 16; hour++) {
    const start = `${hour.toString().padStart(2, '0')}:00`;
    timeSlots.push(start);
  }
  
  // Carga los cursos desde el JSON
  const coursesData = {
    "data": [
      {"id":308,"name":"Teoría para accesorios","sep_id":"1V4EGJ","credits":"5.0","sep_credits":"5.0","hours_professor":32,"hours_independent":48,"facilities":"L, T","plans_courses":[{"id":206,"plan_id":7,"course_id":308,"semester":2}]},
      {"id":309,"name":"Taller de diseño","sep_id":"I49GIT","credits":"7.0","sep_credits":"7.0","hours_professor":45,"hours_independent":31,"facilities":"L","plans_courses":[{"id":207,"plan_id":7,"course_id":309,"semester":3}]},
      {"id":310,"name":"Técnicas para prendas básicas","sep_id":"SSGLJQ","credits":"6.0","sep_credits":"6.0","hours_professor":35,"hours_independent":40,"facilities":"A, L","plans_courses":[{"id":208,"plan_id":7,"course_id":310,"semester":4}]},
      {"id":311,"name":"Confección para prendas básicas","sep_id":"R6WICO","credits":"7.0","sep_credits":"7.0","hours_professor":44,"hours_independent":40,"facilities":"L, T","plans_courses":[{"id":209,"plan_id":7,"course_id":311,"semester":5}]},
      {"id":312,"name":"Técnicas de prendas femeninas","sep_id":"R1464D","credits":"6.0","sep_credits":"6.0","hours_professor":46,"hours_independent":42,"facilities":"A, T","plans_courses":[{"id":210,"plan_id":7,"course_id":312,"semester":6}]},
      {"id":313,"name":"Taller para prendas infantiles","sep_id":"SP8VAV","credits":"8.0","sep_credits":"8.0","hours_professor":35,"hours_independent":46,"facilities":"A, L","plans_courses":[{"id":211,"plan_id":7,"course_id":313,"semester":7}]},
      {"id":314,"name":"Patronaje de prendas masculinas","sep_id":"6VZQOD","credits":"6.0","sep_credits":"6.0","hours_professor":47,"hours_independent":37,"facilities":"L, T","plans_courses":[{"id":212,"plan_id":7,"course_id":314,"semester":8}]},
      {"id":315,"name":"Teoría para joyería","sep_id":"MWX2CR","credits":"9.0","sep_credits":"9.0","hours_professor":37,"hours_independent":37,"facilities":"T","plans_courses":[{"id":213,"plan_id":7,"course_id":315,"semester":1}]},
      {"id":316,"name":"Patronaje de color","sep_id":"SIXRC9","credits":"8.0","sep_credits":"8.0","hours_professor":35,"hours_independent":46,"facilities":"T","plans_courses":[{"id":214,"plan_id":7,"course_id":316,"semester":2}]},
      {"id":317,"name":"Confección de prendas infantiles","sep_id":"IB20IE","credits":"5.0","sep_credits":"5.0","hours_professor":31,"hours_independent":48,"facilities":"A, T","plans_courses":[{"id":215,"plan_id":7,"course_id":317,"semester":3}]},
      {"id":318,"name":"Diseño de textiles","sep_id":"UXR2AB","credits":"9.0","sep_credits":"9.0","hours_professor":35,"hours_independent":48,"facilities":"T","plans_courses":[{"id":216,"plan_id":7,"course_id":318,"semester":4}]},
      {"id":319,"name":"Herramientas para lencería","sep_id":"1JDACX","credits":"5.0","sep_credits":"5.0","hours_professor":36,"hours_independent":36,"facilities":"L","plans_courses":[{"id":217,"plan_id":7,"course_id":319,"semester":5}]},
      {"id":320,"name":"Confección de prendas masculinas","sep_id":"N37B4X","credits":"6.0","sep_credits":"6.0","hours_professor":30,"hours_independent":38,"facilities":"A, L","plans_courses":[{"id":218,"plan_id":7,"course_id":320,"semester":6}]}
    ]
  };
  
  // Crear profesores basados en los cursos
  const teachers: Teacher[] = coursesData.data.map((course: Course) => {
    // Generar disponibilidad aleatoria para cada profesor/curso
    const availability: DayAvailability[] = generateRandomAvailability(days);
    const semester = course.plans_courses[0]?.semester || 1;
    
    return {
      name: `Profesor ${course.id}`, // Generar un nombre basado en el ID del curso
      subject: course.name,
      availability,
      semester,
      credits: parseFloat(course.credits),
      hoursProfessor: course.hours_professor,
      hoursIndependent: course.hours_independent,
      facilities: course.facilities
    };
  });
  
  // Función para generar disponibilidad aleatoria
  function generateRandomAvailability(days: string[]): DayAvailability[] {
    // Seleccionar un número aleatorio de días (entre 2 y 4)
    const numDays = Math.floor(Math.random() * 3) + 2;
    const shuffledDays = shuffleArray([...days]);
    const selectedDays = shuffledDays.slice(0, numDays);
    
    return selectedDays.map(day => {
      // Generar 1 o 2 franjas de tiempo para cada día
      const numTimeFrames = Math.random() > 0.6 ? 2 : 1;
      const timeFrames: TimeFrame[] = [];
      
      if (numTimeFrames === 1) {
        // Una franja larga
        const startHour = Math.floor(Math.random() * 5) + 7; // Entre 7 y 11
        const duration = Math.floor(Math.random() * 4) + 3; // Entre 3 y 6 horas
        const endHour = Math.min(startHour + duration, 15);
        
        timeFrames.push({
          start: `${startHour.toString().padStart(2, '0')}:00`,
          end: `${endHour.toString().padStart(2, '0')}:00`
        });
      } else {
        // Dos franjas separadas
        const firstStartHour = Math.floor(Math.random() * 3) + 7; // Entre 7 y 9
        const firstEndHour = firstStartHour + Math.floor(Math.random() * 2) + 2; // Entre 2 y 3 horas después
        
        const secondStartHour = firstEndHour + 1; // Al menos 1 hora después
        const secondEndHour = Math.min(secondStartHour + Math.floor(Math.random() * 2) + 2, 15); // Entre 2 y 3 horas
        
        timeFrames.push({
          start: `${firstStartHour.toString().padStart(2, '0')}:00`,
          end: `${firstEndHour.toString().padStart(2, '0')}:00`
        });
        
        if (secondStartHour < 15) {
          timeFrames.push({
            start: `${secondStartHour.toString().padStart(2, '0')}:00`,
            end: `${secondEndHour.toString().padStart(2, '0')}:00`
          });
        }
      }
      
      return { day, timeFrames };
    });
  }
    
  // Generar aulas basadas en los requisitos de instalaciones de los cursos
  const uniqueFacilities = new Set<string>();
  coursesData.data.forEach(course => {
    if (course.facilities) {
      course.facilities.split(',').map(f => f.trim()).forEach(f => uniqueFacilities.add(f));
    }
  });
  
  // Asegurarnos de tener al menos aulas básicas
  uniqueFacilities.add('Aula');
  
  // Crear aulas basadas en los tipos de instalaciones requeridas
  const classrooms: Classroom[] = [];
  uniqueFacilities.forEach((facility, index) => {
    classrooms.push({
      name: `${facility} ${101 + index}`,
      availability: days
    });
    
    // Agregar algunas aulas con disponibilidad limitada
    if (index % 2 === 0) {
      classrooms.push({
        name: `${facility} ${201 + index}`,
        availability: ['Lunes', 'Miércoles', 'Viernes']
      });
    } else {
      classrooms.push({
        name: `${facility} ${301 + index}`,
        availability: ['Martes', 'Jueves']
      });
    }
  });
  
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
  
  // Función para verificar si un aula es compatible con los requisitos de instalaciones
  const isClassroomCompatible = (classroom: Classroom, teacherFacilities: string | null): boolean => {
    if (!teacherFacilities) return true;
    
    const requiredFacilities = teacherFacilities.split(',').map(f => f.trim());
    // Verificar si el nombre del aula contiene alguna de las instalaciones requeridas
    return requiredFacilities.some(facility => 
      classroom.name.includes(facility) || classroom.name.includes('Aula')
    );
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
    
      // Filtrar aulas disponibles y compatibles con los requisitos de los cursos
      const availableClassrooms = shuffleArray(
        classrooms.filter(classroom =>
          classroom.availability.includes(day) &&
          !bookings.classrooms.get(classroom.name)?.has(`${day}-${timeSlot}`)
        )
      );
    
      // Asignar profesores a aulas disponibles, considerando los requisitos de instalaciones
      availableTeachers.forEach(teacher => {
        // Buscar un aula compatible con los requisitos de instalaciones del curso
        const compatibleClassroom = availableClassrooms.find(classroom => 
          isClassroomCompatible(classroom, teacher.facilities)
        );
        
        if (compatibleClassroom) {
          // Eliminar el aula de las disponibles
          const index = availableClassrooms.indexOf(compatibleClassroom);
          availableClassrooms.splice(index, 1);
          
          schedule.push({
            teacher: teacher.name,
            subject: teacher.subject,
            day,
            time: timeSlot,
            endTime: addOneHour(timeSlot),
            classroom: compatibleClassroom.name,
            semester: teacher.semester
          });
    
          // Registra la ocupación del profesor y el aula
          bookings.teachers.get(teacher.name)?.add(`${day}-${timeSlot}`);
          bookings.classrooms.get(compatibleClassroom.name)?.add(`${day}-${timeSlot}`);
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