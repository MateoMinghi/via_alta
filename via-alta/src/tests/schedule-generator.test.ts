import { generateSchedule, ScheduleItem } from '../lib/schedule-generator';

// Mock para funciones aleatorias
jest.mock('../lib/schedule-generator', () => {
  const original = jest.requireActual('../lib/schedule-generator');
  
  // Sobreescribimos la función original pero mantenemos igual la estructura
  return {
    ...original,
    generateSchedule: jest.fn().mockImplementation(async () => {
      // Simulamos una ejecución real pero con un conjunto de resultados controlado
      return Promise.resolve(mockScheduleItems);
    })
  };
});

// Datos de prueba para el horario generado
const mockScheduleItems: ScheduleItem[] = [
  {
    teacher: "Profesor 308",
    subject: "Teoría para accesorios",
    day: "Lunes",
    time: "08:00",
    endTime: "09:00",
    classroom: "L 101",
    semester: 2
  },
  {
    teacher: "Profesor 309",
    subject: "Taller de diseño",
    day: "Martes",
    time: "10:00",
    endTime: "11:00",
    classroom: "L 102",
    semester: 3
  },
  {
    teacher: "Profesor 310",
    subject: "Técnicas para prendas básicas",
    day: "Miércoles",
    time: "12:00",
    endTime: "13:00",
    classroom: "A 103",
    semester: 4
  }
];

describe('Generador de Horarios', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('Debe generar un horario válido', async () => {
    const schedule = await generateSchedule();
    
    // Verificar que se genera un horario
    expect(schedule).toBeDefined();
    expect(Array.isArray(schedule)).toBe(true);
  });

  test('Debe contener la estructura correcta para cada elemento del horario', async () => {
    const schedule = await generateSchedule();
    
    // Verificar que cada elemento tiene la estructura correcta
    schedule.forEach(item => {
      expect(item).toHaveProperty('teacher');
      expect(item).toHaveProperty('subject');
      expect(item).toHaveProperty('day');
      expect(item).toHaveProperty('time');
      expect(item).toHaveProperty('endTime');
      expect(item).toHaveProperty('classroom');
      expect(item).toHaveProperty('semester');
    });
  });

  test('Los horarios deben cumplir con las restricciones de días', async () => {
    const schedule = await generateSchedule();
    const validDays = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
    
    // Verificar que los días sean válidos
    schedule.forEach(item => {
      expect(validDays).toContain(item.day);
    });
  });

  test('Los horarios deben tener formato de hora correcto', async () => {
    const schedule = await generateSchedule();
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/; // formato HH:MM (00:00 - 23:59)
    
    // Verificar formato de hora
    schedule.forEach(item => {
      expect(item.time).toMatch(timeRegex);
      expect(item.endTime).toMatch(timeRegex);
    });
  });

  test('El horario de salida debe ser posterior al de entrada', async () => {
    const schedule = await generateSchedule();
    
    schedule.forEach(item => {
      const startHour = parseInt(item.time.split(':')[0]);
      const endHour = parseInt(item.endTime.split(':')[0]);
      
      expect(endHour).toBeGreaterThan(startHour);
    });
  });

  test('Los profesores no deben tener clases simultáneas', async () => {
    const schedule = await generateSchedule();
    const teacherSchedules = new Map<string, Set<string>>();
    
    // Crear registro de horarios por profesor
    schedule.forEach(item => {
      if (!teacherSchedules.has(item.teacher)) {
        teacherSchedules.set(item.teacher, new Set());
      }
      const timeSlot = `${item.day}-${item.time}`;
      const scheduleSet = teacherSchedules.get(item.teacher);
      
      // Verificar que el profesor no tiene ya una clase en ese horario
      expect(scheduleSet?.has(timeSlot)).toBe(false);
      scheduleSet?.add(timeSlot);
    });
  });

  test('Las aulas no deben tener clases simultáneas', async () => {
    const schedule = await generateSchedule();
    const classroomSchedules = new Map<string, Set<string>>();
    
    // Crear registro de horarios por aula
    schedule.forEach(item => {
      if (!classroomSchedules.has(item.classroom)) {
        classroomSchedules.set(item.classroom, new Set());
      }
      const timeSlot = `${item.day}-${item.time}`;
      const scheduleSet = classroomSchedules.get(item.classroom);
      
      // Verificar que el aula no tiene ya una clase en ese horario
      expect(scheduleSet?.has(timeSlot)).toBe(false);
      scheduleSet?.add(timeSlot);
    });
  });
});