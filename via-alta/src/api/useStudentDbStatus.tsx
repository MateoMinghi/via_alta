import { useState, useEffect } from 'react';

// Define la estructura de la respuesta para el estado del estudiante
export function useStudentDbStatus(studentId: string) {
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStatus = async () => {
      if (!studentId) {
        setStatus(null);
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        //Usar la API para obtener el estado del estudiante
        const response = await fetch(`/api/student-status?studentId=${studentId}`);
        
        if (!response.ok) {
          throw new Error(`Error fetching status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.success && data.status) {
          setStatus(data.status);
        } else {
          setStatus('no-inscrito'); // Default a "no-inscrito" si no se encuentra el estado
        }
      } catch (err) {
        console.error(`Error fetching student status for ivd_id ${studentId}:`, err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        setStatus('no-inscrito'); // Default a "no-inscrito" en caso de error
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();
  }, [studentId]);

  return { status, loading, error };
}