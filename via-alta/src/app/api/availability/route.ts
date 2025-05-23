import { NextResponse } from 'next/server';
import Availability from '@/lib/models/availability';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const professorId = searchParams.get('professorId');

  if (!professorId) {
    return NextResponse.json({ success: false, message: 'Professor ID is required' }, { status: 400 });
  }

  try {
    console.log('Fetching availability for professor:', professorId);
    const availabilityData = await Availability.findByProfessor(professorId);    console.log('Raw availability data:', availabilityData);
    
    // Transform the data into the format expected by the frontend
    const formattedAvailability: Record<string, boolean> = {};
    // Store any subject preferences found in the metadata
    let subjectPreferences: Record<string, number> = {};
    
    availabilityData.forEach((slot) => {
      // Since we're now using the normalized data, we don't need all the null checks
      // Get the start time and end time (remove seconds part)
      const startTime = slot.HoraInicio.split(':').slice(0, 2).join(':');
      const endTime = slot.HoraFin.split(':').slice(0, 2).join(':');
      
      // Check for metadata with subject preferences
      if (slot.Metadata) {
        try {
          const parsedMetadata = JSON.parse(slot.Metadata);
          if (parsedMetadata && typeof parsedMetadata === 'object') {
            // Merge with existing preferences
            subjectPreferences = { ...subjectPreferences, ...parsedMetadata };
          }
        } catch (err) {
          console.warn('Error parsing metadata:', err);
        }
      }
      
      try {
        // Parse the times to create 30-minute intervals
        const [startHour, startMinute] = startTime.split(':').map(Number);
        const [endHour, endMinute] = endTime.split(':').map(Number);
        
        // Calculate start and end in minutes for easier comparison
        const startInMinutes = startHour * 60 + startMinute;
        const endInMinutes = endHour * 60 + endMinute;
        
        // Create slots for every 30-minute interval in this availability period
        for (let timeInMinutes = startInMinutes; timeInMinutes < endInMinutes; timeInMinutes += 30) {
          const hour = Math.floor(timeInMinutes / 60);
          const minute = timeInMinutes % 60;
          const timeSlot = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
          const slotKey = `${slot.Dia}-${timeSlot}`;
          formattedAvailability[slotKey] = true;
        }
      } catch (err) {
        console.warn('Error processing slot:', slot, err);
      }    });

    console.log('Formatted availability:', formattedAvailability);
    console.log('Subject preferences:', subjectPreferences);
    return NextResponse.json({ 
      success: true, 
      availability: formattedAvailability,
      subjectPreferences: subjectPreferences
    });
  } catch (error) {
    console.error('Error fetching availability:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch availability' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { professorId, availability, subjectPreferences = {} } = body;

    if (!professorId || !availability) {
      return NextResponse.json(
        { success: false, message: 'Professor ID and availability are required' },
        { status: 400 }
      );
    }

    // Delete all existing availability entries for this professor first
    try {
      const existingSlots = await Availability.findByProfessor(professorId.toString());
      for (const slot of existingSlots) {
        await Availability.delete(slot.IdDisponibilidad);
      }
    } catch (error) {
      console.error('Error deleting existing availability:', error);
    }

    // Get the current max ID to start incrementing from there
    const maxId = await Availability.getMaxId();
    let currentId = maxId + 1;

    // Group slots by day and sort them by time
    const slotsByDay: Record<string, string[]> = {};
    Object.entries(availability).forEach(([slotKey, isAvailable]) => {
      if (isAvailable) {
        const [day, time] = slotKey.split('-');
        if (!slotsByDay[day]) {
          slotsByDay[day] = [];
        }
        slotsByDay[day].push(time);
      }
    });

    // Store any subject preferences for future use in scheduling
    // This information is saved in metadata but not directly used in availability slots
    // It will be retrieved and used by the schedule generator
    const subjectPreferenceData = Object.entries(subjectPreferences).length > 0 
      ? JSON.stringify(subjectPreferences)
      : null;

    // For each day, create consolidated availability slots
    for (const [day, times] of Object.entries(slotsByDay)) {
      // Sort times chronologically
      times.sort();
      
      let startTime = times[0];
      let lastTime = startTime;
      
      for (let i = 1; i <= times.length; i++) {
        const currentTime = times[i];
        const lastTimeMinutes = timeToMinutes(lastTime);
        const currentTimeMinutes = currentTime ? timeToMinutes(currentTime) : -1;
        
        // If we're at the end or there's a gap in time slots, save the current period
        if (i === times.length || currentTimeMinutes - lastTimeMinutes > 30) {
          // Calculate end time (30 minutes after the last slot)
          const [lastHour, lastMinute] = lastTime.split(':').map(Number);
          let endMinutes = lastMinute + 30;
          let endHour = lastHour;
          if (endMinutes >= 60) {
            endMinutes = 0;
            endHour += 1;
          }
          const endTime = `${endHour.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;
          
          // Create availability record
          await Availability.create({
            IdDisponibilidad: currentId++,
            IdProfesor: professorId.toString(),
            Dia: day as 'Lunes' | 'Martes' | 'Miércoles' | 'Jueves' | 'Viernes',
            HoraInicio: startTime,
            HoraFin: endTime,
            // Store subject preference metadata if available
            Metadata: subjectPreferenceData || undefined
          });
          
          // Start a new period if we're not at the end
          if (i < times.length) {
            startTime = currentTime;
          }
        }
        
        lastTime = currentTime;
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Availability saved successfully',
      subjectPreferencesSaved: subjectPreferenceData !== null
    });
  } catch (error) {
    console.error('Error saving availability:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to save availability' },
      { status: 500 }
    );
  }
}

function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}
