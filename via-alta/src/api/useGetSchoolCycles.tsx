import { useState, useEffect } from 'react';

/**
 * Representa un ciclo escolar dentro del sistema académico.
 */
export interface SchoolCycle {
  id: number;          // ID único del ciclo escolar
  code: string;        // Código identificador del ciclo (ej. "2025-A")
  start_date: string;  // Fecha de inicio del ciclo escolar (formato ISO)
  end_date: string;    // Fecha de fin del ciclo escolar (formato ISO)
  active: boolean;     // Indicador de si el ciclo está actualmente activo
  created_at: string;  // Timestamp de creación del registro
  updated_at: string;  // Timestamp de la última actualización del registro
}

/**
 * Tipo de retorno del hook `useGetSchoolCycles`.
 */
export interface ResponseType {
  result: SchoolCycle[] | null; // Lista de ciclos escolares obtenida desde la API
  loading: boolean;             // `true` mientras se realiza la petición
  error: string | null;         // Mensaje de error si la petición falla
}

/**
 * Hook personalizado para obtener ciclos escolares desde una API.
 *
 * Este hook realiza una llamada al endpoint `/api/school-cycles` para obtener
 * la lista de ciclos escolares. Retorna el estado de carga, los datos obtenidos
 * y cualquier error producido durante la consulta.
 *
 * @returns {ResponseType} Objeto con `result`, `loading` y `error`.
 */
export const useGetSchoolCycles = (): ResponseType => {
  const [result, setResult] = useState<SchoolCycle[] | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSchoolCycles = async () => {
      try {
        setLoading(true);

        const response = await fetch('/api/school-cycles');
        const data = await response.json();

        if (!data.success) {
          throw new Error(data.error || 'Error fetching school cycles');
        }

        setResult(data.data);
      } catch (err) {
        console.error('Error in useGetSchoolCycles:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchSchoolCycles();
  }, []);

  return { result, loading, error };
};

export default useGetSchoolCycles;
