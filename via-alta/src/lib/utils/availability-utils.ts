import Availability from "../models/availability";

interface SlotDetails {
  day: string;
  startTime: string;
  endTime: string;
}

/**
 * Parses a slot key (e.g., "Monday-08:00") into day and time components
 */
export function parseSlotKey(slotKey: string): SlotDetails {
  const [day, startTime] = slotKey.split("-");
  const [hours, minutes] = startTime.split(":").map(Number);
  
  // Calculate end time by adding 30 minutes
  let endHours = hours;
  let endMinutes = minutes + 30;
  
  // Handle minute overflow
  if (endMinutes >= 60) {
    endHours += 1;
    endMinutes = 0;
  }

  const endTime = `${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`;

  return {
    day,
    startTime,
    endTime
  };
}

/**
 * Converts availability data from the database format to frontend slot format
 */
export async function getAvailabilityFromDatabase(professorId: number): Promise<Record<string, boolean>> {
    try {
        const response = await fetch(`/api/availability?professorId=${professorId}`);
        const data = await response.json();
        
        if (!data.success) {
            throw new Error(data.error);
        }
        
        const slots: Record<string, boolean> = {};
        
        // Convert DB records to slot format
        data.data.forEach((record: any) => {
            const slotKey = `${record.Dia}-${record.HoraInicio}`;
            slots[slotKey] = true;
        });
        
        return slots;
    } catch (error) {
        console.error("Error fetching availability:", error);
        return {};
    }
}

/**
 * Saves availability data to the database
 */
export async function saveAvailabilityToDatabase(
    professorId: number,
    slots: Record<string, boolean>
): Promise<void> {
    try {
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
        
        if (!data.success) {
            throw new Error(data.error);
        }
    } catch (error) {
        console.error("Error saving availability:", error);
        throw error;
    }
}