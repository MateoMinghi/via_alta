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
  classroom: string; // Maintained for backward compatibility
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
  id: string;
  name: string;
  subject: string;
  availability: DayAvailability[];
  semester: number;
  credits: number;
  hoursProfessor: number | null;
  hoursIndependent: number | null;
  facilities: string | null;
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

// Interfaces de la db para generacion del horario general
interface DbTeacher {
  IdProfesor: string;
  Nombre: string;
  Clases: string;
}

interface DbAvailability {
  IdDisponibilidad: number;
  IdProfesor: string;
  Dia: string;
  HoraInicio: string;
  HoraFin: string;
}

// API configuration
const API_BASE_URL = 'https://ivd-qa-0dc175b0ba43.herokuapp.com';
const CLIENT_ID = 'payments_app';
const CLIENT_SECRET = 'a_client_secret';

// Schedule hour limits
const SCHEDULE_START_HOUR = 7; // 7:00 AM
const SCHEDULE_END_HOUR = 16;  // 4:00 PM

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

// Funciones para obtener datos de la db
async function fetchTeachersFromDb(): Promise<DbTeacher[]> {
  try {
    if (typeof window === 'undefined') {
      const Professor = (await import('../models/professor')).default;
      const professors = await Professor.findAll();
      
      return professors.map(professor => ({
        IdProfesor: professor.IdProfesor,
        Nombre: professor.Nombre,
        Clases: professor.Clases || ''
      }));
    } else {
      console.warn('Database operations are only available on the server side');
      return [];
    }
  } catch (error) {
    console.error('Error fetching teachers from database:', error);
    throw new Error('Failed to fetch teachers from database');
  }
}

async function fetchTeacherAvailabilityFromDb(professorId: string): Promise<DbAvailability[]> {
  try {
    if (typeof window === 'undefined') {
      const Availability = (await import('../models/availability')).default;
      const availabilities = await Availability.findByProfessor(professorId);
      
      return availabilities.map(availability => ({
        IdDisponibilidad: availability.IdDisponibilidad,
        IdProfesor: availability.IdProfesor,
        Dia: availability.Dia,
        HoraInicio: availability.HoraInicio,
        HoraFin: availability.HoraFin
      }));
    } else {
      console.warn('Database operations are only available on the server side');
      return [];
    }
  } catch (error) {
    console.error(`Error fetching availability for teacher ${professorId}:`, error);
    throw new Error(`Failed to fetch availability for teacher ${professorId}`);
  }
}

// Convert database teachers and their availability to the format needed for schedule generation
async function convertDbTeachersToTeachers(dbTeachers: DbTeacher[]): Promise<Teacher[]> {
  const teachers: Teacher[] = [];
  
  for (const dbTeacher of dbTeachers) {
    // Obtener la disponibilidad del profesor
    const availabilities = await fetchTeacherAvailabilityFromDb(dbTeacher.IdProfesor);
    
    // Si no hay disponibilidad registrada para el profesor, saltamos al siguiente
    if (availabilities.length === 0) {
      console.warn(`No availability found for teacher ${dbTeacher.IdProfesor}`);
      continue;
    }
    
    // Convertir el formato de disponibilidad de la db a el formato necesario para la generacion del horario
    const availability: DayAvailability[] = [];
    
    // Agrupar las disponibilidades por dia
    const availabilitiesByDay = new Map<string, TimeFrame[]>();
    
    availabilities.forEach(avail => {
      // Verificar que la hora esté dentro del límite del horario general (7:00 AM a 4:00 PM)
      const startHour = parseInt(avail.HoraInicio.split(':')[0]);
      const endHour = parseInt(avail.HoraFin.split(':')[0]);
      
      if (startHour < SCHEDULE_START_HOUR || endHour > SCHEDULE_END_HOUR) {
        return; // Ignorar esta disponibilidad si está fuera del rango permitido
      }
      
      if (!availabilitiesByDay.has(avail.Dia)) {
        availabilitiesByDay.set(avail.Dia, []);
      }
      
      availabilitiesByDay.get(avail.Dia)?.push({
        start: avail.HoraInicio,
        end: avail.HoraFin
      });
    });
    
    // Convertir a el formato DayAvailability
    availabilitiesByDay.forEach((timeFrames, day) => {
      availability.push({
        day,
        timeFrames
      });
    });
    
    // Si después de filtrar por horario no hay disponibilidad, saltamos al siguiente profesor
    if (availability.length === 0) {
      console.warn(`Teacher ${dbTeacher.IdProfesor} has no availability within schedule hours`);
      continue;
    }
    
    // La asignatura se deja vacía inicialmente y se completa más tarde
    teachers.push({
      id: dbTeacher.IdProfesor,
      name: dbTeacher.Nombre,
      subject: dbTeacher.Clases, // Asignar la clase que ya tiene el profesor
      availability,
      semester: 0, // Será actualizado cuando se asignen los cursos
      credits: 0, // Será actualizado cuando se asignen los cursos
      hoursProfessor: null,
      hoursIndependent: null,
      facilities: null
    });
  }
  
  return teachers;
}

// Función para mapear los nombres de las asignaturas de la API con las clases de los profesores
async function matchCoursesWithTeachers(teachers: Teacher[]): Promise<Teacher[]> {
  try {
    // Obtener cursos desde la API
    const coursesData = await fetchCourses();
    
    if (coursesData.length === 0) {
      console.warn('No courses found from API');
      return teachers;
    }
    
    // Crear una copia de los profesores para evitar modificar el original
    const updatedTeachers = [...teachers];
    
    // Para cada profesor, encontrar el curso de API que coincide con su clase
    updatedTeachers.forEach(teacher => {
      if (!teacher.subject) {
        return; // Si el profesor no tiene clase asignada, no hacemos nada
      }
      
      // Buscar un curso en la API que coincida con el nombre de la clase del profesor
      const matchingCourse = coursesData.find(course => 
        course.name.toLowerCase() === teacher.subject.toLowerCase()
      );
      
      // Si encontramos un curso que coincide, actualizamos la información del profesor
      if (matchingCourse) {
        let semester = matchingCourse.plans_courses[0]?.semester || 1;
        semester = Math.min(Math.max(semester, 1), 8); // Asegurar que el semestre esté entre 1 y 8
        
        teacher.semester = semester;
        teacher.credits = parseFloat(matchingCourse.credits) || 0;
        teacher.hoursProfessor = matchingCourse.hours_professor;
        teacher.hoursIndependent = matchingCourse.hours_independent;
        teacher.facilities = matchingCourse.facilities;
      }
    });
    
    // Identificar cursos que no tienen profesor asignado
    const assignedCourses = new Set(
      updatedTeachers
        .filter(t => t.subject)
        .map(t => t.subject.toLowerCase())
    );
    
    // Preparar cursos sin profesor asignado para el horario
    const unassignedCourses = coursesData.filter(course => 
      !Array.from(assignedCourses).some(subject => 
        subject === course.name.toLowerCase()
      )
    );
    
    console.log(`Found ${unassignedCourses.length} courses without assigned teachers`);
    
    return updatedTeachers;
  } catch (error) {
    console.error('Error matching courses with teachers:', error);
    throw error;
  }
}

// Función principal para generar el horario
export async function generateSchedule(): Promise<ScheduleItem[]> {
  try {
    // Configuracion de los dias de la semana
    const days = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
    
    // Obtener profesores de la base de datos
    const dbTeachers = await fetchTeachersFromDb();

    // Convertir los profesores de la db junto con su disponibilidad
    let teachers = await convertDbTeachersToTeachers(dbTeachers);
    
    // Completar la información de los cursos de los profesores con datos de la API
    teachers = await matchCoursesWithTeachers(teachers);

    // Filtrar los profesores que tienen una asignatura válida
    const validTeachers = teachers.filter(teacher => teacher.subject !== '');

    if (validTeachers.length === 0) {
      console.warn('No teachers with valid courses found');
      return [];
    }

    // Obtener todos los cursos de la API que no tienen profesor asignado
    const coursesData = await fetchCourses();
    const assignedSubjects = new Set(validTeachers.map(t => t.subject.toLowerCase()));
    
    // Crear el horario para profesores válidos
    const schedule: ScheduleItem[] = [];
    
    // Ordenar los profesores por semestre para una distribución ordenada
    validTeachers.sort((a, b) => a.semester - b.semester);
    
    // Crear un mapa de ocupación para cada franja horaria y día
    type OccupationMap = Record<string, Record<string, boolean>>;
    const occupationMap: OccupationMap = {};
    
    days.forEach(day => {
      occupationMap[day] = {};
      // Horarios de 7:00 a 16:00 (4:00 PM) en incrementos de 1 hora
      for (let hour = SCHEDULE_START_HOUR; hour < SCHEDULE_END_HOUR; hour++) {
        const timeSlot = `${hour.toString().padStart(2, '0')}:00`;
        occupationMap[day][timeSlot] = false;
      }
    });
    
    // Programar clases para profesores válidos
    validTeachers.forEach(teacher => {
      // Para cada día disponible del profesor
      teacher.availability.forEach(dayAvail => {
        const day = dayAvail.day;
        
        // Para cada franja horaria de ese día
        dayAvail.timeFrames.forEach(timeFrame => {
          const startHour = parseInt(timeFrame.start.split(':')[0]);
          const endHour = parseInt(timeFrame.end.split(':')[0]);
          
          // Ignorar franjas horarias fuera del rango de horario general
          if (startHour < SCHEDULE_START_HOUR || endHour > SCHEDULE_END_HOUR) {
            return;
          }
          
          // Verificar si todas las horas dentro de la franja están disponibles
          let hoursAvailable = true;
          for (let hour = startHour; hour < endHour; hour++) {
            const timeSlot = `${hour.toString().padStart(2, '0')}:00`;
            if (occupationMap[day][timeSlot]) {
              hoursAvailable = false;
              break;
            }
          }
          
          // Si todas las horas están disponibles, ocuparlas y agregar la clase al horario
          if (hoursAvailable) {
            for (let hour = startHour; hour < endHour; hour++) {
              const timeSlot = `${hour.toString().padStart(2, '0')}:00`;
              occupationMap[day][timeSlot] = true;
            }
            
            // Agregar la clase al horario
            schedule.push({
              teacher: teacher.name,
              subject: teacher.subject,
              day: day,
              time: timeFrame.start,
              endTime: timeFrame.end,
              classroom: 'N/A', // No se consideran aulas
              semester: teacher.semester
            });
          }
        });
      });
    });
    
    // Ahora necesitamos programar los cursos sin profesor en los huecos disponibles
    const unassignedCourses = coursesData.filter(course => 
      !Array.from(assignedSubjects).some(subject => 
        subject === course.name.toLowerCase()
      )
    );
    
    // Para cada curso sin profesor, intentar encontrar un hueco libre
    for (const course of unassignedCourses) {
      let courseScheduled = false;
      
      // Definir el semestre del curso
      let semester = course.plans_courses[0]?.semester || 1;
      semester = Math.min(Math.max(semester, 1), 8);
      
      // Buscar un hueco disponible para el curso
      for (const day of days) {
        if (courseScheduled) break;
        
        for (let startHour = SCHEDULE_START_HOUR; startHour < SCHEDULE_END_HOUR - 1; startHour++) {
          if (courseScheduled) break;
          
          const endHour = startHour + 2; // 2 horas de duración
          
          if (endHour <= SCHEDULE_END_HOUR) {
            // Verificar si las horas están disponibles
            let hoursAvailable = true;
            for (let hour = startHour; hour < endHour; hour++) {
              const timeSlot = `${hour.toString().padStart(2, '0')}:00`;
              if (occupationMap[day][timeSlot]) {
                hoursAvailable = false;
                break;
              }
            }
            
            if (hoursAvailable) {
              // Marcar las horas como ocupadas
              for (let hour = startHour; hour < endHour; hour++) {
                const timeSlot = `${hour.toString().padStart(2, '0')}:00`;
                occupationMap[day][timeSlot] = true;
              }
              
              // Agregar el curso sin profesor al horario
              schedule.push({
                teacher: "Sin asignar",
                subject: course.name,
                day: day,
                time: `${startHour.toString().padStart(2, '0')}:00`,
                endTime: `${endHour.toString().padStart(2, '0')}:00`,
                classroom: 'N/A',
                semester: semester
              });
              
              courseScheduled = true;
            }
          }
        }
      }
    }
    
    return schedule;
  } catch (error) {
    console.error('Error generating schedule:', error);
    throw error;
  }
}