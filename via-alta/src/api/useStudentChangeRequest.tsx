import { useState, useEffect } from 'react';
import { set } from 'react-hook-form';

// Define la estructura de la respuesta para el estado del estudiante
export function useStudentChangeRequest(studentId: string) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [changes, setChanges] = useState<string | null>(null);
  const [date, setDate] = useState<string | null>(null);

  useEffect(() => {
    const fetchStatus = async () => {
      if (!studentId) {
        setChanges('');
        setDate('');
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        //Usar la API para obtener el estado del estudiante
        const response = await fetch(`/api/schedule-change-request?studentId=${studentId}`);
        
        if (!response.ok) {
          throw new Error(`Error fetching status: ${response.status}`);
        }
        
        const data = await response.json();

        if (data.success && data.data.length > 0 && data.data[0].descripcion && data.data[0].fecha) {
          setChanges(data.data[0].descripcion);
          setDate(data.data[0].fecha);
        }
        else {
          setDate(''); // Default a null si no se encuentra la fecha
          setChanges(''); // Default a null si no se encuentra el estado
        }
      } catch (err) {
        console.error(`Error fetching student status for ivd_id ${studentId}:`, err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        setDate(''); // Default a null en caso de error
        setChanges(''); // Default a "no-inscrito" en caso de error
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();
  }, [studentId]);

  return { changes, date, loading, error };
}