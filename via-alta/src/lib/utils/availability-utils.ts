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
  const [day, startHour] = slotKey.split("-");
  const hour = parseInt(startHour.split(":")[0]);
  const endHour = `${hour + 1}:00`;

  return {
    day,
    startTime: startHour,
    endTime: endHour
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