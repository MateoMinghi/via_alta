import { useState, useEffect } from "react";

// Define la interfaz para un ítem del horario del estudiante
export interface ScheduleItem {
  idgrupo: number;           // ID del grupo
  materianombre: string;     // Nombre de la materia
  profesornombre: string;    // Nombre del profesor
  semestre: number;          // Semestre en el que se cursa la materia
  dia: string;               // Día de la semana (ej. "Lunes", "Martes")
  horainicio: string;        // Hora de inicio de la clase (formato "HH:MM")
  horafin: string;           // Hora de fin de la clase (formato "HH:MM")
  idsalon?: number;          // ID del salón (opcional)
  tiposalon?: string;        // Tipo de salón (ej. "Aula", "Laboratorio")
}

// Define la estructura de la respuesta del backend para el horario del estudiante
export interface StudentScheduleResponse {
  success: boolean;       // Indica si la operación fue exitosa
  data: ScheduleItem[];   // Lista de ítems del horario del estudiante
  isIndividual: boolean;  // Indica si el horario fue creado individualmente
  message?: string;       // Mensaje adicional (opcional)
  error?: string;         // Mensaje de error (opcional)
}

// Hook personalizado para obtener y confirmar el horario del estudiante
export function useGetStudentSchedule(studentId: string | undefined, semester: number | undefined) {
  const [result, setResult] = useState<ScheduleItem[] | null>(null); // Estado para el horario
  const [loading, setLoading] = useState(true);                      // Estado de carga
  const [error, setError] = useState<string | null>(null);           // Estado de error
  const [isIndividual, setIsIndividual] = useState(false);           // Estado para saber si el horario es individual

  useEffect(() => {
    // Función para obtener el horario desde la API
    const fetchSchedule = async () => {
      if (!studentId || !semester) {
        setLoading(false);
        setError("Student ID and semester are required");
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Llamada a la API local (Next.js API route) para obtener el horario
        const response = await fetch(`/api/student-schedule?studentId=${studentId}&semester=${semester}`);
        const data: StudentScheduleResponse = await response.json();

        if (!data.success) {
          throw new Error(data.message || "Failed to fetch student schedule");
        }

        setResult(data.data); // Actualiza el estado con los datos del horario
        setIsIndividual(data.isIndividual); // Indica si el horario fue creado individualmente
      } catch (err) {
        // Manejo de errores
        console.error("Error fetching student schedule:", err);
        setError(err instanceof Error ? err.message : "Unknown error occurred");
      } finally {
        setLoading(false); // Finaliza la carga
      }
    };

    fetchSchedule(); // Ejecuta la función al montar o actualizar dependencias
  }, [studentId, semester]); // Dependencias: ID del estudiante y semestre

  // Función para confirmar (enviar) el horario del estudiante
  const confirmSchedule = async (schedule: ScheduleItem[], testMode = true) => {
    if (!studentId) {
      throw new Error("Student ID is required to confirm schedule");
    }

    try {
      console.log('Confirming schedule for student:', studentId);
      console.log('Schedule data being sent:', schedule);

      // Filtra ítems de horario que tengan un idgrupo válido
      const validScheduleItems = schedule.filter((item) => {
        const idGrupo = item.idgrupo;
        if (!idGrupo) {
          console.warn('Skipping schedule item without IdGrupo:', item);
          return false;
        }
        return true;
      });

      if (validScheduleItems.length === 0) {
        throw new Error("No valid schedule items to confirm");
      }

      // Envía el horario a la API
      const response = await fetch('/api/student-schedule', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          studentId,
          schedule: validScheduleItems,
          testMode, // Modo de prueba
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || "Failed to confirm schedule");
      }

      // Solo actualiza isIndividual si no es modo de prueba
      if (!testMode) {
        setIsIndividual(true);
      }

      return data;
    } catch (err) {
      console.error("Error confirming schedule:", err);
      throw err;
    }
  };

  // Retorna el estado y la función para confirmar el horario
  return {
    result,
    loading,
    error,
    isIndividual,
    confirmSchedule,
  };
}
