import { useState, useEffect } from "react";
import { authenticatedRequest } from "@/lib/m2mAuth";

/**
 * Representa un curso cursado por un estudiante, con información académica relevante.
 */
export interface CourseHistoryItem {
  grade_id: number | null;             // ID del registro de calificación (puede ser nulo si no se ha calificado)
  student_id: number;                  // ID del estudiante
  course_id: number;                   // ID del curso
  course_name: string;                 // Nombre del curso
  sep_id: string;                      // Clave oficial SEP del curso
  sep_credits: string;                 // Créditos SEP del curso
  grade_final: number | null;         // Calificación final del curso (puede ser nula)
  absence_final: number | null;       // Porcentaje o cantidad de ausencias (puede ser nula)
  cycle_id: number | null;            // ID del ciclo escolar en el que se cursó
  cycle_code: string | null;          // Código del ciclo escolar (ej. "2024-A")
  grade_observations: string | null;  // Observaciones relacionadas con la calificación
  course_semester: number;            // Semestre en el que se ofrece el curso
}

/**
 * Estructura de la respuesta esperada al consultar el historial académico.
 */
interface AcademicHistoryResponse {
  data: CourseHistoryItem[]; // Lista de cursos con sus detalles
  status: string;            // Estado de la respuesta ("success" o "error")
  message: string | null;    // Mensaje de error o información adicional
}

/**
 * Hook que obtiene el historial académico de un estudiante a partir de su IVD ID.
 * 
 * Este hook realiza una petición autenticada al backend para consultar todos los cursos
 * que ha cursado un estudiante, con sus respectivas calificaciones, ausencias y ciclo escolar.
 */
export function useGetStudentAcademicHistory(ivdId: string | undefined) {
  const [academicHistory, setAcademicHistory] = useState<CourseHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAcademicHistory = async () => {
      // Validar si el parámetro es válido
      if (!ivdId) {
        setLoading(false);
        setError("Student IVD ID is required");
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Petición autenticada a la API
        const response = await authenticatedRequest<AcademicHistoryResponse>(
          `/v1/students/academic_history?ivd_id=${ivdId}`
        );

        // Validar el estado de la respuesta
        if (response.status !== "success") {
          throw new Error(response.message || "Failed to fetch academic history");
        }

        setAcademicHistory(response.data);
      } catch (err) {
        console.error("Error fetching academic history:", err);
        setError(err instanceof Error ? err.message : "Unknown error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchAcademicHistory();
  }, [ivdId]);

  return { 
    academicHistory, 
    loading, 
    error 
  };
}
