import { useState } from "react";

// Define la estructura de la respuesta para las solicitudes de cambio de horario
export interface ChangeRequestResponse {
  success: boolean;      // Indica si la operación fue exitosa
  message?: string;      // Mensaje adicional (opcional)
  data?: any;            // Datos de la solicitud (opcional)
  error?: string;        // Mensaje de error (opcional)
}

// Hook personalizado para gestionar las solicitudes de cambio de horario
export function useScheduleChangeRequest() {
  const [loading, setLoading] = useState(false);           // Estado para controlar la carga de la solicitud
  const [error, setError] = useState<string | null>(null); // Estado para almacenar el mensaje de error
  const [success, setSuccess] = useState(false);           // Estado para indicar si la solicitud fue exitosa

  // Función para enviar una solicitud de cambio de horario
  const submitChangeRequest = async (studentId: string, reason: string) => {
    try {
      setLoading(true);   // Establece el estado de carga a verdadero
      setError(null);     // Resetea cualquier error anterior
      setSuccess(false);  // Resetea el estado de éxito

      // Realiza la solicitud a la API para enviar el cambio de horario
      const response = await fetch('/api/schedule-change-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          studentId, // ID del estudiante
          reason, // Motivo de la solicitud
        }),
      });

      // Procesa la respuesta de la API
      const data: ChangeRequestResponse = await response.json();

      // Si la solicitud no fue exitosa, lanza un error
      if (!data.success) {
        throw new Error(data.message || "Failed to submit change request");
      }

      // Si la solicitud fue exitosa, establece el estado de éxito
      setSuccess(true);
      return data;
    } catch (err) {
      // Manejo de errores
      console.error("Error submitting change request:", err);
      setError(err instanceof Error ? err.message : "Unknown error occurred");
      return null;
    } finally {
      setLoading(false); // Establece el estado de carga a falso cuando la solicitud termina
    }
  };

  // Función para obtener las solicitudes de cambio de horario de un estudiante
  const getChangeRequests = async (studentId: string) => {
    try {
      setLoading(true); // Establece el estado de carga a verdadero
      setError(null);   // Resetea cualquier error anterior

      // Realiza la solicitud a la API para obtener las solicitudes de cambio
      const response = await fetch(`/api/schedule-change-request?studentId=${studentId}`);
      const data: ChangeRequestResponse = await response.json();

      // Si la solicitud no fue exitosa, lanza un error
      if (!data.success) {
        throw new Error(data.message || "Failed to fetch change requests");
      }

      return data.data; // Retorna los datos de las solicitudes de cambio
    } catch (err) {
      // Manejo de errores
      console.error("Error fetching change requests:", err);
      setError(err instanceof Error ? err.message : "Unknown error occurred");
      return null;
    } finally {
      setLoading(false); // Establece el estado de carga a falso cuando la solicitud termina
    }
  };

  // Retorna las funciones y estados relevantes para el hook
  return {
    submitChangeRequest,
    getChangeRequests,
    loading,
    error,
    success,
  };
}
