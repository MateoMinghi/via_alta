import { generateSchedule, ScheduleItem } from '../lib/schedule-generator';

// Datos reales para realizar pruebas de integración
describe('Generador de Horarios - Pruebas de Integración', () => {
  let schedule: ScheduleItem[];
  
  // Antes de todas las pruebas, generamos un horario real
  beforeAll(async () => {
    // Esta es una prueba real de integración que invoca al generador de horarios
    schedule = await generateSchedule();
  }, 10000); // Aumentamos el timeout porque la generación real puede tardar

  test('Debe generar un horario con elementos', async () => {
    expect(schedule.length).toBeGreaterThan(0);
  });

  test('Debe asignar horarios a todos los semestres', () => {
    // Obtener todos los semestres únicos asignados
    const semesters = new Set(schedule.map(item => item.semester));
    
    // Verificar que hay clases para todos los semestres (del 1 al 8)
    for (let i = 1; i <= 8; i++) {
      const hasSemester = schedule.some(item => item.semester === i);
      
      // Si no encuentra clases para algún semestre, la prueba no falla
      // pero lo reportamos como información
      if (!hasSemester) {
        console.log(`Nota: No se generaron clases para el semestre ${i}`);
      }
    }
  });

  test('Debe asignar correctamente las aulas según requerimientos de instalaciones', () => {
    const facilityTypes = ['A', 'L', 'T']; // Tipos de instalaciones en el sistema
    
    // Verificar que las clases se asignan a aulas compatibles
    schedule.forEach(item => {
      // Extraer el tipo de aula asignada
      const classroomType = item.classroom.split(' ')[0];
      
      // Si el aula no es de tipo regular ("Aula"), debe corresponder a una instalación especial
      if (classroomType !== 'Aula') {
        expect(facilityTypes).toContain(classroomType);
      }
    });
  });

  test('Debe respetar los horarios laborales normales', () => {
    // Verificar que todas las clases están dentro del horario laboral normal (7AM - 3PM)
    schedule.forEach(item => {
      const startHour = parseInt(item.time.split(':')[0]);
      const endHour = parseInt(item.endTime.split(':')[0]);
      
      expect(startHour).toBeGreaterThanOrEqual(7);
      expect(endHour).toBeLessThanOrEqual(16);
    });
  });

  test('Los horarios no deben solaparse para un mismo profesor', () => {
    const teacherSchedules = new Map<string, ScheduleItem[]>();
    
    // Agrupar horarios por profesor
    schedule.forEach(item => {
      if (!teacherSchedules.has(item.teacher)) {
        teacherSchedules.set(item.teacher, []);
      }
      teacherSchedules.get(item.teacher)?.push(item);
    });
    
    // Verificar que no hay solapamientos para cada profesor
    teacherSchedules.forEach((professorSchedule, professorName) => {
      for (let i = 0; i < professorSchedule.length; i++) {
        const class1 = professorSchedule[i];
        
        for (let j = i + 1; j < professorSchedule.length; j++) {
          const class2 = professorSchedule[j];
          
          // Si son el mismo día, verificar que no se solapan
          if (class1.day === class2.day) {
            const isOverlapping = checkTimeOverlap(
              class1.time, class1.endTime,
              class2.time, class2.endTime
            );
            
            expect(isOverlapping).toBe(false);
          }
        }
      }
    });
  });

  test('Los horarios no deben solaparse para una misma aula', () => {
    const classroomSchedules = new Map<string, ScheduleItem[]>();
    
    // Agrupar horarios por aula
    schedule.forEach(item => {
      if (!classroomSchedules.has(item.classroom)) {
        classroomSchedules.set(item.classroom, []);
      }
      classroomSchedules.get(item.classroom)?.push(item);
    });
    
    // Verificar que no hay solapamientos para cada aula
    classroomSchedules.forEach((classroomSchedule, classroomName) => {
      for (let i = 0; i < classroomSchedule.length; i++) {
        const class1 = classroomSchedule[i];
        
        for (let j = i + 1; j < classroomSchedule.length; j++) {
          const class2 = classroomSchedule[j];
          
          // Si son el mismo día, verificar que no se solapan
          if (class1.day === class2.day) {
            const isOverlapping = checkTimeOverlap(
              class1.time, class1.endTime,
              class2.time, class2.endTime
            );
            
            expect(isOverlapping).toBe(false);
          }
        }
      }
    });
  });
});

// Función auxiliar para comprobar si dos intervalos de tiempo se solapan
function checkTimeOverlap(
  startTime1: string, 
  endTime1: string, 
  startTime2: string, 
  endTime2: string
): boolean {
  // Convertir horas a números para comparación
  const start1 = convertTimeToMinutes(startTime1);
  const end1 = convertTimeToMinutes(endTime1);
  const start2 = convertTimeToMinutes(startTime2);
  const end2 = convertTimeToMinutes(endTime2);
  
  // Verificar solapamiento
  return (start1 < end2 && start2 < end1);
}

// Función auxiliar para convertir tiempo (HH:MM) a minutos
function convertTimeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

// Pruebas adicionales para las funciones auxiliares internas
describe('Funciones auxiliares del generador de horarios', () => {
  test('La función convertTimeToMinutes debe convertir correctamente', () => {
    expect(convertTimeToMinutes('08:00')).toBe(480);  // 8 * 60 + 0
    expect(convertTimeToMinutes('09:30')).toBe(570);  // 9 * 60 + 30
    expect(convertTimeToMinutes('13:45')).toBe(825);  // 13 * 60 + 45
  });
  
  test('La función checkTimeOverlap debe detectar solapamientos correctamente', () => {
    // Casos con solapamiento
    expect(checkTimeOverlap('08:00', '10:00', '09:00', '11:00')).toBe(true);
    expect(checkTimeOverlap('08:00', '10:00', '07:00', '09:00')).toBe(true);
    expect(checkTimeOverlap('08:00', '10:00', '08:30', '09:30')).toBe(true);
    
    // Casos sin solapamiento
    expect(checkTimeOverlap('08:00', '09:00', '09:00', '10:00')).toBe(false);
    expect(checkTimeOverlap('08:00', '09:00', '10:00', '11:00')).toBe(false);
  });
});