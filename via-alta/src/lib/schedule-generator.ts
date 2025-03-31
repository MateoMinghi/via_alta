// Generador de horarios para el sistema Via Alta
// Define interfaces for API responses
interface ApiCourse {
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

interface ApiResponse<T> {
  data: T[];
}

// Authentication response type
interface AuthResponse {
  token: string;
}

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

// API configuration
const API_BASE_URL = 'https://ivd-qa-0dc175b0ba43.herokuapp.com';
const CLIENT_ID = 'payments_app';
const CLIENT_SECRET = 'a_client_secret';

// Function to get authentication token
async function getAuthToken(): Promise<string> {
  const response = await fetch(`${API_BASE_URL}/m2m/authenticate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to authenticate');
  }

  const data = await response.json();
  return data.token;
}

// Function to fetch courses from the API
async function fetchCourses(): Promise<ApiCourse[]> {
  const token = await getAuthToken();
  
  const response = await fetch(`${API_BASE_URL}/v1/courses/all`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch courses');
  }

  const data: ApiResponse<ApiCourse> = await response.json();
  return data.data;
}

export async function generateSchedule(): Promise<ScheduleItem[]> {
  // Configuración base
  const days = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
  const timeSlots: string[] = [];
  for (let hour = 7; hour < 16; hour++) {
    const start = `${hour.toString().padStart(2, '0')}:00`;
    timeSlots.push(start);
  }
  
  // Fetch courses from API instead of using hardcoded data
  const coursesData = await fetchCourses();
  
  // Crear profesores basados en los cursos
  const teachers: Teacher[] = coursesData.map((course: ApiCourse) => {
    // Generar disponibilidad aleatoria para cada profesor/curso
    const availability: DayAvailability[] = generateRandomAvailability(days);
    
    // Ensure semester is within the valid range (1-8)
    let semester = course.plans_courses[0]?.semester || 1;
    
    // Cap semester to maximum allowed value of 8
    if (semester > 8) {
      semester = 8;
    }
    // Ensure minimum value is 1
    if (semester < 1) {
      semester = 1;
    }
    
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
  coursesData.forEach(course => {
    if (course.facilities) {
      course.facilities.split(',').map(f => f.trim()).forEach(f => uniqueFacilities.add(f));
    }
  });
  
  // Asegurarnos de tener al menos aulas básicas
  uniqueFacilities.add('Aula');
  
  // Crear aulas basadas en los tipos de instalaciones requeridas
  const classrooms: Classroom[] = [];
  Array.from(uniqueFacilities).forEach((facility, index) => {
    classrooms.push({
      name: `${facility} ${101 + index}`,
      availability: days
    });
    
    // Agregar algunas aulas con disponibilidad limitada
    if (Number(index) % 2 === 0) {
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

  // Función auxiliar para mezclar un array
  function shuffleArray<T>(array: T[]): T[] {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  // Generar el horario
  const schedule: ScheduleItem[] = [];
  
  // Ordenar profesores por semestre para distribuir las clases uniformemente
  teachers.sort((a, b) => a.semester - b.semester);
  
  teachers.forEach(teacher => {
    // Encontrar un aula compatible con los requisitos de instalaciones
    const compatibleClassrooms = classrooms.filter(classroom => {
      if (!teacher.facilities) return classroom.name.includes('Aula');
      return teacher.facilities.split(',').some(facility => 
        classroom.name.includes(facility.trim())
      );
    });
    
    if (compatibleClassrooms.length === 0) return;
    
    // Elegir un aula aleatoria de las compatibles
    const classroom = compatibleClassrooms[Math.floor(Math.random() * compatibleClassrooms.length)];
    
    // Para cada día de disponibilidad del profesor
    teacher.availability.forEach(dayAvail => {
      // Verificar si el aula está disponible ese día
      if (!classroom.availability.includes(dayAvail.day)) return;
      
      // Para cada franja horaria de ese día
      dayAvail.timeFrames.forEach(timeFrame => {
        // Agregar la clase al horario
        schedule.push({
          teacher: teacher.name,
          subject: teacher.subject,
          day: dayAvail.day,
          time: timeFrame.start,
          endTime: timeFrame.end,
          classroom: classroom.name,
          semester: teacher.semester
        });
      });
    });
  });
  
  return schedule;
}