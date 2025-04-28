import { ScheduleItem } from '@/api/useGetStudentSchedule';

/**
 * Interfaz que define la estructura de una materia en el horario
 * Representa una materia con sus datos principales y horarios
 */
export interface Subject {
  id: number;          // ID único de la materia
  title: string;       // Nombre de la materia
  professor: string;   // Nombre del profesor
  credits: number;     // Número de créditos
  salon: string;       // Ubicación/salón
  semester: number;    // Semestre al que pertenece
  hours: { day: string; time: string; timeStart?: string; timeEnd?: string }[]; // Días y horas de clase
}

export interface AcademicRecommendations {
  obligatoryCourseIds: number[];
  recommendedCourses: string[];
}

export class StudentModel {
  // Cache for converted subjects and recommendations to prevent unnecessary recalculations
  private static subjectsCache: { data: ScheduleItem[] | null, subjects: Subject[] } | null = null;
  private static recommendationsCache: { history: any[], semester: number, recommendations: AcademicRecommendations } | null = null;

  /**
   * Convierte los datos de la API a un formato más limpio y agrupado 
   * para mostrar en el horario
   */
  static convertToSubjects(scheduleItems: ScheduleItem[] | null): Subject[] {
    // Use cached result if data is the same
    if (this.subjectsCache && this.subjectsCache.data === scheduleItems) {
      return this.subjectsCache.subjects;
    }

    if (!scheduleItems) return [];
      
    // Agrupamos clases por materia y profesor
    const groupedItems: Record<string, ScheduleItem[]> = {};
    
    scheduleItems.forEach(item => {
    
      const materiaNombre = item.materianombre;
      const profesorNombre = item.profesornombre;
      
      if (!materiaNombre) {
        console.warn('Missing material name for item:', item);
        return;
      }
      
      // Creamos una clave única para agrupar la misma materia con el mismo profesor
      const key = `${materiaNombre}-${profesorNombre || 'Unknown'}`;
      if (!groupedItems[key]) {
        groupedItems[key] = [];
      }
      groupedItems[key].push(item);
    });

    // Convertimos los grupos a objetos Subject
    const result = Object.entries(groupedItems).map(([key, items], index) => {
      const firstItem = items[0];
      
      const idGrupo = firstItem.idgrupo;
      const materiaNombre = firstItem.materianombre;
      const profesorNombre = firstItem.profesornombre;
      const tipoSalon = firstItem.tiposalon;
      const idSalon = firstItem.idsalon;
      const semestre = firstItem.semestre;
      
      return {
        id: idGrupo || index,
        title: materiaNombre || `Asignatura ${index + 1}`,
        professor: profesorNombre || 'Profesor No Asignado',
        salon: tipoSalon ? `${tipoSalon} ${idSalon || ''}` : 'Por asignar',
        semester: semestre || 1,
        credits: 0, 
        // Mapeamos todos los horarios para esta materia
        hours: items.map(item => {
          const itemDay = item.dia;
          const itemTimeStart = item.horainicio;
          const itemTimeEnd = item.horafin;
          const itemTime = itemTimeStart && itemTimeEnd ? `${itemTimeStart} - ${itemTimeEnd}` : '';
          return {
            day: itemDay || '',
            time: itemTime || '',
            timeStart: itemTimeStart || '',
            timeEnd: itemTimeEnd || ''
          };
        })
      };
    });

    // Store result in cache
    this.subjectsCache = { data: scheduleItems, subjects: result };
    return result;
  }

  /**
   * Analiza el historial académico del estudiante para determinar las materias recomendadas
   * y configura las materias obligatorias y disponibles siguiendo el flujo de trabajo
   * para estudiantes irregulares.
   * Uses caching for better performance
   */
  static analyzeAcademicHistory(academicHistory: any[], currentSemester: number): AcademicRecommendations {
    // Use cached result if inputs are the same
    if (this.recommendationsCache && 
        this.recommendationsCache.history === academicHistory && 
        this.recommendationsCache.semester === currentSemester) {
      return this.recommendationsCache.recommendations;
    }

    if (!academicHistory || academicHistory.length === 0) {
      console.log("No academic history available for analysis");
      const result = {
        obligatoryCourseIds: [],
        recommendedCourses: []
      };
      this.recommendationsCache = { 
        history: academicHistory, 
        semester: currentSemester, 
        recommendations: result 
      };
      return result;
    }

    // Identificar el plan de estudios completo del estudiante
    // Agrupar por semestres para facilitar el análisis
    const studyPlan = academicHistory.reduce<Record<number, any[]>>((acc, course) => {
      if (!acc[course.course_semester]) {
        acc[course.course_semester] = [];
      }
      acc[course.course_semester].push(course);
      return acc;
    }, {});
    
    // Identificar materias faltantes del plan de estudios 
    // (materias que no tienen calificación y no están en trámite de equivalencia)
    const pendingCourses = academicHistory.filter(course => 
      course.course_semester <= currentSemester && 
      !course.grade_final &&
      !course.grade_observations?.includes('equivalencia')
    );
    
    // Ordenar materias faltantes por prioridad:
    // 1. Por semestre (prioritarios los semestres más bajos)
    // 2. Por créditos (mayor a menor)
    const prioritizedCourses = [...pendingCourses].sort((a, b) => {
      // Primero por semestre
      if (a.course_semester !== b.course_semester) {
        return a.course_semester - b.course_semester;
      }
      
      // Si están en el mismo semestre, por créditos (mayor primero)
      const aCredits = parseFloat(a.sep_credits);
      const bCredits = parseFloat(b.sep_credits);
      return bCredits - aCredits;
    });
    
    // Selección de materias obligatorias e importantes
    // Las 3 primeras materias serán obligatorias (las más básicas/importantes)
    const obligatoryCourseIds = prioritizedCourses
      .slice(0, 3)
      .map(course => course.course_id);
    
    // Las siguientes 3 serán recomendadas por su importancia
    const recommendedCourseNames = prioritizedCourses
      .slice(3, 6)
      .map(course => course.course_name);
    
    const result = {
      obligatoryCourseIds,
      recommendedCourses: recommendedCourseNames
    };

    // Store result in cache
    this.recommendationsCache = { 
      history: academicHistory, 
      semester: currentSemester, 
      recommendations: result 
    };
    return result;
  }
}
