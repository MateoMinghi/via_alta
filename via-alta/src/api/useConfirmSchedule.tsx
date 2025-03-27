// Hook personalizado para manejar la confirmación de horario
import { useState } from 'react';

export function useConfirmSchedule() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState(false);

  const confirmSchedule = async (studentId: string) => {
    try {
      setLoading(true);
      setError('');
      setSuccess(false);
      
      const response = await fetch('/api/confirmSchedule', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ studentId }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Error al confirmar el horario');
      }

      setSuccess(true);
      return data;
    } catch (err: any) {
      setError(err.message || 'Ocurrió un error inesperado');
      console.error('Error al confirmar horario:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    confirmSchedule,
    loading,
    error,
    success,
  };
}