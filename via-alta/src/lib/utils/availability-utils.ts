/**
 * Saves the availability data for a professor to the database
 */
export async function saveAvailabilityToDatabase(
  professorId: number,
  selectedSlots: Record<string, boolean>,
  subjectPreferences: Record<string, number> = {}
): Promise<void> {
  try {
    const response = await fetch('/api/availability', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        professorId,
        availability: selectedSlots,
        subjectPreferences,
      }),
    });

    const data = await response.json();
    if (!data.success) {
      throw new Error(data.message || 'Failed to save availability');
    }
  } catch (error) {
    console.error('Error saving availability:', error);
    throw error;
  }
}

/**
 * Retrieves the availability data for a professor from the database
 */
export async function getAvailabilityFromDatabase(
  professorId: number
): Promise<{ slots: Record<string, boolean>; preferences: Record<string, number> }> {
  try {
    const response = await fetch(`/api/availability?professorId=${professorId.toString()}`);
    const data = await response.json();

    if (!data.success) {
      console.error('Failed to fetch availability:', data.message);
      return { slots: {}, preferences: {} };
    }

    console.log('Retrieved availability:', data.availability); // Debug log
    console.log('Retrieved subject preferences:', data.subjectPreferences); // Debug log
    
    return {
      slots: data.availability || {},
      preferences: data.subjectPreferences || {}
    };
  } catch (error) {
    console.error('Error fetching availability:', error);
    return { slots: {}, preferences: {} };
  }
}
