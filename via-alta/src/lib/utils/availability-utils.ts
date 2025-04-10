/**
 * Saves the availability data for a professor to the database
 */
export async function saveAvailabilityToDatabase(
  professorId: number,
  selectedSlots: Record<string, boolean>
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
): Promise<Record<string, boolean>> {
  try {
    const response = await fetch(`/api/availability?professorId=${professorId}`);
    const data = await response.json();

    if (!data.success) {
      console.error('Failed to fetch availability:', data.message);
      return {};
    }

    return data.availability || {};
  } catch (error) {
    console.error('Error fetching availability:', error);
    return {};
  }
}
