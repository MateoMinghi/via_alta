import Availability from "../models/availability"; // Importamos el modelo de disponibilidad

// Definimos la interfaz para representar los detalles de un slot
interface SlotDetails {
  day: string; // El día de la semana
  startTime: string; // Hora de inicio en formato "HH:mm"
  endTime: string; // Hora de fin en formato "HH:mm"
}

/**
 * Analiza una clave de slot (por ejemplo, "Monday-08:00") en componentes de día y hora.
 * Calcula también el tiempo de finalización añadiendo 30 minutos a la hora de inicio.
 * @param {string} slotKey - La clave del slot (por ejemplo, "Monday-08:00")
 * @returns {SlotDetails} - Un objeto con el día, hora de inicio y hora de fin del slot
 */
export function parseSlotKey(slotKey: string): SlotDetails {
  // Separamos la clave del slot en día y hora de inicio
  const [day, startTime] = slotKey.split("-"); 
  const [hours, minutes] = startTime.split(":").map(Number);
  
  // Calculamos la hora de fin añadiendo 30 minutos a la hora de inicio
  let endHours = hours;
  let endMinutes = minutes + 30;
  
  // Manejo de desbordamiento de minutos
  if (endMinutes >= 60) {
    endHours += 1;
    endMinutes = 0;
  }

  // Formateamos la hora de fin en el formato "HH:mm"
  const endTime = `${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`;

  return {
    day,
    startTime,
    endTime
  };
}

/**
 * Convierte los datos de disponibilidad desde el formato de base de datos al formato de slots del frontend
 * @param {number} professorId - El ID del profesor para el cual queremos obtener la disponibilidad
 * @returns {Promise<Record<string, boolean>>} - Un objeto que representa los slots ocupados como claves
 */
export async function getAvailabilityFromDatabase(professorId: number): Promise<Record<string, boolean>> {
    try {
        // Realizamos la petición para obtener la disponibilidad del profesor
        const response = await fetch(`/api/availability?professorId=${professorId}`);
        const data = await response.json();
        
        // Si la respuesta no es exitosa, lanzamos un error
        if (!data.success) {
            throw new Error(data.error);
        }
        
        const slots: Record<string, boolean> = {};
        
        // Convertimos los registros de la base de datos al formato de slots
        data.data.forEach((record: any) => {
            const slotKey = `${record.Dia}-${record.HoraInicio}`;
            slots[slotKey] = true; // Marcamos el slot como ocupado
        });
        
        return slots;
    } catch (error) {
        console.error("Error fetching availability:", error);
        return {}; // Retornamos un objeto vacío en caso de error
    }
}

/**
 * Guarda los datos de disponibilidad en la base de datos
 * @param {number} professorId - El ID del profesor cuya disponibilidad estamos guardando
 * @param {Record<string, boolean>} slots - Un objeto que representa los slots ocupados
 * @returns {Promise<void>} - Promesa que se resuelve cuando la disponibilidad ha sido guardada
 */
export async function saveAvailabilityToDatabase(
    professorId: number,
    slots: Record<string, boolean>
): Promise<void> {
    try {
        // Realizamos la petición para guardar la disponibilidad del profesor
        const response = await fetch('/api/availability', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                professorId,
                slots
            }),
        });
        
        const data = await response.json();
        
        // Si la respuesta no es exitosa, lanzamos un error
        if (!data.success) {
            throw new Error(data.error);
        }
    } catch (error) {
        console.error("Error saving availability:", error);
        throw error; // Relanzamos el error para que se pueda manejar en otro lugar
    }
}
