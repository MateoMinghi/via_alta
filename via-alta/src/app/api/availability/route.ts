import { NextResponse } from 'next/server';
import Availability from '@/lib/models/availability';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const professorId = searchParams.get('professorId');

  if (!professorId) {
    return NextResponse.json({ success: false, message: 'Professor ID is required' }, { status: 400 });
  }

  try {
    const availabilityData = await Availability.findByProfessor(professorId);
    
    // Transform the data into the format expected by the frontend
    const formattedAvailability: Record<string, boolean> = {};
    availabilityData.forEach((slot) => {
      const slotKey = `${slot.Dia}-${slot.HoraInicio}`;
      formattedAvailability[slotKey] = true;
    });

    return NextResponse.json({ success: true, availability: formattedAvailability });
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
    }    // Delete all existing availability entries for this professor first
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

    // Insert new availability slots
    for (const [slotKey, isAvailable] of Object.entries(availability)) {
      if (isAvailable) {
        const [day, time] = slotKey.split('-');
        
        await Availability.create({
          IdDisponibilidad: currentId++,
          IdProfesor: professorId.toString(),
          Dia: day as 'Lunes' | 'Martes' | 'Miércoles' | 'Jueves' | 'Viernes',
          HoraInicio: time,
          HoraFin: calculateEndTime(time)
        });
      }
    }

    return NextResponse.json({ success: true, message: 'Availability saved successfully' });
  } catch (error) {
    console.error('Error saving availability:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to save availability' },
      { status: 500 }
    );
  }
}

function calculateEndTime(startTime: string): string {
  const [hours, minutes] = startTime.split(':').map(Number);
  let endMinutes = minutes + 30;
  let endHours = hours;
  
  if (endMinutes >= 60) {
    endMinutes = 0;
    endHours += 1;
  }
  
  return `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;
}
