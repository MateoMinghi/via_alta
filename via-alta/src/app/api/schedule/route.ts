import { NextRequest, NextResponse } from 'next/server';
import { generateGeneralSchedule, isScheduleGenerationInProgress } from '@/lib/utils/schedule-generator';

// Set a higher timeout for the API route
export const maxDuration = 300; // 5 minutes (in seconds)

// Handling POST requests for schedule generation or updates
export async function POST(request: NextRequest) {
  try {
    // Check if a generation is already in progress
    if (isScheduleGenerationInProgress()) {
      return NextResponse.json({ 
        success: true, 
        message: 'Ya hay un proceso de generación de horario en curso. Por favor, espere.',
        isProcessing: true
      });
    }

    // Check if we're updating an existing schedule
    const body = await request.json();
    const { schedule } = body;

    // If schedule is provided, save the updated schedule
    if (schedule && Array.isArray(schedule)) {
      // Import the GeneralSchedule model here to avoid circular dependencies
      const { default: GeneralSchedule } = await import('@/lib/models/general-schedule');
      
      console.log(`Updating schedule with ${schedule.length} items`);
      await GeneralSchedule.saveGeneralSchedule(schedule);
      
      return NextResponse.json({ 
        success: true, 
        message: 'Horario general actualizado exitosamente' 
      });
    }
    
    // Otherwise, start a new schedule generation
    const { idCiclo } = body;
    console.log(`Starting schedule generation process${idCiclo ? ` for cycle ID: ${idCiclo}` : ''}`);
    
    // Start the generation process in the background
    // This will create a flag file that indicates generation is in progress
    generateGeneralSchedule(idCiclo).catch(err => {
      console.error('Background schedule generation error:', err);
    });
    
    // Return immediately to prevent timeouts
    return NextResponse.json({
      success: true,
      message: 'Generación de horario iniciada. Por favor espere y refresque la página en unos momentos.',
      isProcessing: true
    });
    
  } catch (error) {
    console.error('Error al iniciar generación del horario general:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Error desconocido' 
    }, { status: 500 });
  }
}

// Handle GET requests - return the current general schedule
export async function GET(request: NextRequest) {
  try {
    // Import the GeneralSchedule model here to avoid circular dependencies
    const { default: GeneralSchedule } = await import('@/lib/models/general-schedule');
    
    // Check if schedule generation is in progress
    const isProcessing = isScheduleGenerationInProgress();
    
    // Get the schedule data from the database
    const scheduleData = await GeneralSchedule.getGeneralSchedule();
    
    return NextResponse.json({ 
      success: true,
      data: scheduleData,
      isProcessing: isProcessing,
      message: isProcessing 
        ? 'El horario está siendo generado, por favor refresque la página en unos momentos.' 
        : undefined
    });
  } catch (error) {
    console.error('Error al obtener el horario general:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Error desconocido' 
    }, { status: 500 });
  }
}
