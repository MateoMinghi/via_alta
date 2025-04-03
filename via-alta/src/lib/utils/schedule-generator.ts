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

interface DbClassroom {
  IdSalon: string;
  Cupo: number;
  Tipo: string;
}

interface DbSubject {
  IdMateria: string;
  Nombre: string;
  HorasClase: number;
  Requisitos: string | null;
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

async function fetchClassroomsFromDb(): Promise<DbClassroom[]> {
  try {
    if (typeof window === 'undefined') {
      const Classroom = (await import('../models/classroom')).default;
      const classrooms = await Classroom.findAll();
      
      return classrooms.map(classroom => ({
        IdSalon: classroom.IdSalon,
        Cupo: classroom.Cupo,
        Tipo: classroom.Tipo
      }));
    } else {
      console.warn('Database operations are only available on the server side');
      return [];
    }
  } catch (error) {
    console.error('Error fetching classrooms from database:', error);
    throw new Error('Failed to fetch classrooms from database');
  }
}

async function fetchSubjectsFromDb(): Promise<DbSubject[]> {
  try {
    if (typeof window === 'undefined') {
      const Subject = (await import('../models/subject')).default;
      const subjects = await Subject.findAll();
      
      return subjects.map(subject => ({
        IdMateria: subject.IdMateria,
        Nombre: subject.Nombre,
        HorasClase: subject.HorasClase,
        Requisitos: subject.Requisitos
      }));
    } else {
      console.warn('Database operations are only available on the server side');
      return [];
    }
  } catch (error) {
    console.error('Error fetching subjects from database:', error);
    throw new Error('Failed to fetch subjects from database');
  }
}

// Funcion para convertir los profesores de la db a el formato necesario para la generacion del horario
async function convertDbTeachersToTeachers(dbTeachers: DbTeacher[]): Promise<Teacher[]> {
  const teachers: Teacher[] = [];
  
  for (const dbTeacher of dbTeachers) {
    // Obtener la disponibilidad del profesor
    const availabilities = await fetchTeacherAvailabilityFromDb(dbTeacher.IdProfesor);
    
    // Convertir el formato de disponibilidad de la db a el formato necesario para la generacion del horario
    const availability: DayAvailability[] = [];
    
    // Agrupar las disponibilidades por dia
    const availabilitiesByDay = new Map<string, TimeFrame[]>();
    
    availabilities.forEach(avail => {
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
    
    // Parsear las clases del profesor
    const classes = dbTeacher.Clases ? JSON.parse(dbTeacher.Clases) : [];
    
    teachers.push({
      name: dbTeacher.Nombre,
      subject: '', // Este para cuando se asignen los cursos
      availability,
      semester: 0, // Este para  seteado cuando se asignen los cursos
      credits: 0, // Este para seteado cuando se asignen los cursos
      hoursProfessor: null,
      hoursIndependent: null,
      facilities: null
    });
  }
  
  return teachers;
}

// Funcion para convertir las aulas de la db a el formato necesario para la generacion del horario
function convertDbClassroomsToClassrooms(dbClassrooms: DbClassroom[]): Classroom[] {
  return dbClassrooms.map(dbClassroom => {
    // Por defecto, todas las aulas están disponibles todos los días
    // En una implementación real, esto debería obtenerse de una tabla de disponibilidad de aulas
    const availableDays = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
    
    return {
      name: dbClassroom.IdSalon,
      availability: availableDays
    };
  });
}

// Funcion para asignar los cursos a los profesores
function assignCoursesToTeachers(teachers: Teacher[], subjects: DbSubject[]): Teacher[] {
  // Crear una copia de los profesores para evitar modificar el original
  const updatedTeachers = [...teachers];
  
  // Asignar los cursos a los profesores basado en la información disponible
  updatedTeachers.forEach(teacher => {
    // En una implementación real, esto debería obtenerse de una tabla de asignación de profesores a materias
    // Por ahora, asignamos aleatoriamente un curso a cada profesor
    if (subjects.length > 0) {
      const randomIndex = Math.floor(Math.random() * subjects.length);
      const subject = subjects[randomIndex];
      
      teacher.subject = subject.Nombre;
      teacher.semester = Math.floor(Math.random() * 8) + 1; // Semestre aleatorio entre 1 y 8
      teacher.credits = subject.HorasClase;
      teacher.hoursProfessor = subject.HorasClase;
      teacher.hoursIndependent = 0;
      teacher.facilities = subject.Requisitos;
    }
  });
  
  return updatedTeachers;
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

// Nueva funcion para generar el horario usando datos de la db
export async function generateScheduleFromDb(): Promise<ScheduleItem[]> {
  try {
    const [dbTeachers, dbClassrooms, dbSubjects] = await Promise.all([
      fetchTeachersFromDb(),
      fetchClassroomsFromDb(),
      fetchSubjectsFromDb()
    ]);
    
    // Convertir los profesores de la db a el formato necesario para la generacion del horario
    let teachers = await convertDbTeachersToTeachers(dbTeachers);
    
    // Convertir las aulas de la db a el formato necesario para la generacion del horario
    const classrooms = convertDbClassroomsToClassrooms(dbClassrooms);
    
    teachers = assignCoursesToTeachers(teachers, dbSubjects);
    
    // Filtrar los profesores sin asignado un curso (aquellos que no tienen asignado un curso)  
    teachers = teachers.filter(teacher => teacher.subject !== '');
    
    // Si no hay profesores con cursos, retornar un horario vacio
    if (teachers.length === 0) {
      console.warn('No teachers with courses found in the database');
      return [];
    }
    
    // Generar el horario usando la misma logica de la funcion original
    const schedule: ScheduleItem[] = [];
    
    // Ordenar los profesores por semestre para distribuir las clases uniformemente
    teachers.sort((a, b) => a.semester - b.semester);
    
    teachers.forEach(teacher => {
      // Encontrar las aulas compatibles basado en los requisitos de instalaciones
      const compatibleClassrooms = classrooms.filter(classroom => {
        if (!teacher.facilities) return classroom.name.includes('Aula');
        return teacher.facilities.split(',').some(facility => 
          classroom.name.includes(facility.trim())
        );
      });
      
      if (compatibleClassrooms.length === 0) return;
      
      // Elegir una aula compatible aleatoria
      const classroom = compatibleClassrooms[Math.floor(Math.random() * compatibleClassrooms.length)];
      
      // Para cada dia de disponibilidad del profesor
      teacher.availability.forEach(dayAvail => {
        // Verificar si la aula esta disponible en ese dia
        if (!classroom.availability.includes(dayAvail.day)) return;
        
        // Para cada franja horaria de ese dia
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
  } catch (error) {
    console.error('Error generating schedule from database:', error);
    throw error;
  }
}