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
    const availabilityData = await Availability.findByProfessor(professorId);
    console.log('Raw availability data:', availabilityData);
    
    // Transform the data into the format expected by the frontend
    const formattedAvailability: Record<string, boolean> = {};
    
    availabilityData.forEach((slot) => {
      // Get the start time and end time (remove seconds part)
      const startTime = slot.HoraInicio.split(':').slice(0, 2).join(':');
      const endTime = slot.HoraFin.split(':').slice(0, 2).join(':');
      
      // Generate all 30-minute slots between start and end times
      let currentTime = startTime;
      while (currentTime < endTime) {
        const slotKey = `${slot.Dia}-${currentTime}`;
        formattedAvailability[slotKey] = true;
        
        // Move to next 30-minute slot
        const [hour, minute] = currentTime.split(':').map(Number);
        if (minute === 30) {
          currentTime = `${String(hour + 1).padStart(2, '0')}:00`;
        } else {
          currentTime = `${String(hour).padStart(2, '0')}:30`;
        }
      }
    });

    return NextResponse.json({ 
      success: true, 
      availability: formattedAvailability
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
    const { professorId, availability } = body;

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
    const availabilityByDay = new Map<string, string[]>();
    for (const [slotKey, isSelected] of Object.entries(availability)) {
      if (!isSelected) continue;
      const [day, time] = slotKey.split('-');
      if (!availabilityByDay.has(day)) {
        availabilityByDay.set(day, []);
      }
      availabilityByDay.get(day)?.push(time);
    }

    // Now process each day's slots in sorted order
    for (const [day, times] of availabilityByDay) {
      // Sort times chronologically
      times.sort();

      let startTime = '';
      let lastTime = '';

      for (let i = 0; i <= times.length; i++) {
        const currentTime = times[i];
        
        // If this is not a continuous block or we're at the end, save the previous block
        if (startTime && 
            (i === times.length || 
             !lastTime || 
             getNextTimeSlot(lastTime) !== currentTime)) {
          
          // Calculate end time for the block (30 minutes after the last time in block)
          const [endHour, endMinutes] = getNextTimeSlot(lastTime).split(':').map(Number);
          const endTime = `${String(endHour).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`;
          
          // Create availability record
          await Availability.create({
            IdDisponibilidad: currentId++,
            IdProfesor: professorId.toString(),
            Dia: day as 'Lunes' | 'Martes' | 'Miércoles' | 'Jueves' | 'Viernes',
            HoraInicio: startTime,
            HoraFin: endTime
          });
          
          // Start a new period if we're not at the end
          if (i < times.length) {
            startTime = currentTime;
          }
        }
        
        // If we don't have a start time yet, this is the start of a new block
        if (!startTime && currentTime) {
          startTime = currentTime;
        }
        
        lastTime = currentTime;
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Availability saved successfully'
    });
  } catch (error) {
    console.error('Error saving availability:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to save availability' },
      { status: 500 }
    );
  }
}

// Helper function to get the next 30-minute time slot
function getNextTimeSlot(time: string): string {
  const [hour, minutes] = time.split(':').map(Number);
  if (minutes === 30) {
    return `${String(hour + 1).padStart(2, '0')}:00`;
  }
  return `${String(hour).padStart(2, '0')}:30`;
}
