import { ScheduleItem } from '@/api/useGetStudentSchedule';

export class StudentController {
  // Cache for student comments to prevent repeated localStorage access
  private static commentsCache: string | null = null;

  /**
   * Confirma el horario del estudiante
   * @param scheduleData Los datos del horario a confirmar
   * @param studentId ID del estudiante
   * @param confirmScheduleApi Función de la API para confirmar el horario
   */
  static async confirmSchedule(
    scheduleData: ScheduleItem[] | null, 
    studentId: string,
    confirmScheduleApi: (data: ScheduleItem[] | null) => Promise<any>
  ): Promise<{ success: boolean, message?: string }> {
    try {
      if (!scheduleData) {
        throw new Error("No hay datos de horario disponibles para confirmar");
      }
      
      if (!studentId) {
        throw new Error("ID de estudiante no disponible");
      }
      
      // Llamamos a la API para confirmar el horario
      const result = await confirmScheduleApi(scheduleData);
      
      if (result?.success) {
        // Actualizamos el estado en el almacenamiento local
        localStorage.setItem('studentStatus', 'inscrito');
        localStorage.removeItem('studentComments');
        return { success: true };
      } else {
        throw new Error(result?.message || "Error al confirmar horario");
      }
    } catch (error) {
      console.error('Error al confirmar horario:', error);
      return { 
        success: false, 
        message: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }

  /**
   * Envía una solicitud de cambios de horario
   * @param studentId ID del estudiante
   * @param reason Motivo de la solicitud
   * @param submitRequestApi Función de la API para enviar la solicitud
   */
  static async requestScheduleChanges(
    studentId: string,
    reason: string,
    submitRequestApi: (studentId: string, reason: string) => Promise<any>
  ): Promise<{ success: boolean, message?: string }> {
    try {
      if (!reason.trim()) {
        return { 
          success: false, 
          message: 'Debes proporcionar un motivo para solicitar cambios'
        };
      }
      
      if (!studentId) {
        throw new Error("ID de estudiante no disponible");
      }
      
      const result = await submitRequestApi(studentId, reason);
      
      if (!result) {
        throw new Error("Error al enviar la solicitud de cambios");
      }
      
      // Guardamos los comentarios para mostrarlos después
      localStorage.setItem('studentComments', reason);
      this.commentsCache = reason;
      
      return { success: true };
    } catch (error) {
      console.error('Error al solicitar cambios:', error);
      return { 
        success: false, 
        message: error instanceof Error ? error.message : 'Error al enviar la solicitud de cambios'
      };
    }
  }

  /**
   * Recupera los comentarios guardados del estudiante
   * Uses caching to prevent repeated localStorage access
   */
  static getStudentComments(): string {
    if (this.commentsCache === null) {
      this.commentsCache = localStorage.getItem('studentComments') || '';
    }
    return this.commentsCache;
  }

  /**
   * Updates the comments cache when comments are updated
   */
  static updateStudentComments(comments: string): void {
    localStorage.setItem('studentComments', comments);
    this.commentsCache = comments;
  }
}
