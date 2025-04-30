import { useState, useEffect } from "react";

export type Student = {
  id: string;              // ID único del estudiante
  name: string;            // Nombre completo del estudiante
  first_name: string;      // Primer nombre del estudiante
  first_surname: string;   // Primer apellido del estudiante
  second_surname: string;  // Segundo apellido del estudiante
  ivd_id: string;          // ID IVD del estudiante (identificador único en el sistema)
  semestre: string;        // Semestre actual del estudiante (ej. "2024-A")
  status: string;          // Estado del estudiante (ej. "inscrito", "no-inscrito")
  comentario: string;      // Comentarios adicionales sobre el estudiante
  isIrregular: boolean;    // Indicador de si el estudiante tiene un estatus irregular
};

// API credentials and base URL
const API_BASE_URL = 'https://ivd-qa-0dc175b0ba43.herokuapp.com';
const CLIENT_ID = 'enrollments_app';
const CLIENT_SECRET = 'VgwMa3qPS85rrtDHt72mhKejQfTQnNth';

/**
 * Obtiene un token de autenticación mediante client credentials (M2M).
 */
async function getAuthToken(): Promise<string> {
  const response = await fetch(`${API_BASE_URL}/m2m/authenticate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
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

/**
 * Hook para obtener todos los estudiantes del sistema.
 */
export function useGetStudents() {
  const [result, setResult] = useState<Student[] | null>(null); // Estado para almacenar los estudiantes
  const [loading, setLoading] = useState(true);                 // Estado de carga
  const [error, setError] = useState("");                       // Estado de error

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const token = await getAuthToken();

        const response = await fetch(`${API_BASE_URL}/v1/users/all?type=Users::Student`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch students');
        }

        const rawData = await response.json();

        const studentsArray = Array.isArray(rawData)
          ? rawData
          : (rawData.data && Array.isArray(rawData.data) ? rawData.data : []);

        // Transformar los datos para normalizar nombres y asegurar campos esperados
        const normalizedStudents: Student[] = studentsArray.map((student: any, index: number) => {
          if (index < 3) {
            console.debug(`Student ${student.id} name fields:`, {
              name: student.name,
              first_name: student.first_name,
              last_name: student.last_name,
              surname: student.surname,
              paternal_surname: student.paternal_surname,
              maternal_surname: student.maternal_surname,
              data: student,
            });
          }

          const firstName = student.first_name || student.name || '';
          const lastName = student.last_name || student.surname || student.paternal_surname || student.first_surname || '';
          const secondSurname = student.second_surname || student.maternal_surname || '';

          return {
            id: student.id?.toString() || '',
            name: student.name || '',
            first_name: firstName,
            first_surname: lastName,
            second_surname: secondSurname,
            ivd_id: student.ivd_id || student.student_id || '',
            semestre: student.semester?.toString() || 'N/A',
            status: student.status || 'no-inscrito',
            comentario: student.comment || '',
            isIrregular: student.irregular || false,
          };
        });

        setResult(normalizedStudents);
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : "Unknown error";
        setError(errorMessage);
        console.error("Error fetching students:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
  }, []);

  return { loading, result, error };
}

/**
 * Agrupa estudiantes por semestre.
 * 
 */
export function groupStudentsBySemester(students: Student[] | null) {
  if (!students) return {};

  return students.reduce((acc: Record<string, Student[]>, student) => {
    const semester = student.semestre;

    if (!acc[semester]) {
      acc[semester] = [];
    }

    acc[semester].push(student);
    return acc;
  }, {});
}
