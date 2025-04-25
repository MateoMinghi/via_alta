// Hook personalizado para manejar la confirmación de horario

import { useState } from 'react';

/**
 * Hook que encapsula la lógica para confirmar el horario de un estudiante.
 * Maneja estado de carga, éxito y error.
 * 
 * @returns {Object} - Función confirmSchedule y estados asociados.
 */
export function useConfirmSchedule() {
  // Estado para indicar si la solicitud está en curso
  const [loading, setLoading] = useState(false);

  // Estado para almacenar mensajes de error
  const [error, setError] = useState<string>('');

  // Estado para indicar si la confirmación fue exitosa
  const [success, setSuccess] = useState(false);

  /**
   * Realiza una solicitud POST para confirmar el horario de un estudiante.
   * 
   * @param {string} studentId - ID del estudiante cuyo horario será confirmado
   * @returns {Object|null} - Datos de respuesta si tiene éxito, o null en caso de error
   */
  const confirmSchedule = async (studentId: string) => {
    try {
      setLoading(true); // Indica que la solicitud ha comenzado
      setError('');
      setSuccess(false);

      // Envía la solicitud al endpoint correspondiente
      const response = await fetch('/api/confirmSchedule', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ studentId }),
      });

      const data = await response.json();

      // Lanza un error si la respuesta no es satisfactoria
      if (!response.ok) {
        throw new Error(data.message || 'Error al confirmar el horario');
      }

      // Marca la operación como exitosa
      setSuccess(true);
      return data;
    } catch (err: any) {
      // Captura y guarda el mensaje de error
      setError(err.message || 'Ocurrió un error inesperado');
      console.error('Error al confirmar horario:', err);
      return null;
    } finally {
      // Finaliza el estado de carga
      setLoading(false);
    }
  };

  // Devuelve la función y los estados para usar en componentes
  return {
    confirmSchedule,
    loading,
    error,
    success,
  };
}
