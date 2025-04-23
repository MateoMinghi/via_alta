import { NextRequest, NextResponse } from 'next/server';
import { generateGeneralSchedule } from '@/lib/utils/schedule-generator';

export async function POST(request: NextRequest) {
  try {
    // Get the optional cycleId from the request body
    const body = await request.json();
    const { idCiclo } = body;
    
    console.log(`Schedule generation request received${idCiclo ? ` for cycle ID: ${idCiclo}` : ''}`);
    
    // Call the schedule generator function
    const success = await generateGeneralSchedule(idCiclo);
    
    if (success) {
      return NextResponse.json({ 
        success: true, 
        message: 'Horario general generado exitosamente' 
      });
    } else {
      return NextResponse.json({ 
        success: false, 
        error: 'No se pudo generar el horario general' 
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Error al generar el horario general:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Error desconocido' 
    }, { status: 500 });
  }
}

// Handle GET requests - useful for testing endpoint availability
export async function GET() {
  return NextResponse.json({ 
    message: 'El endpoint está disponible. Use POST para generar el horario general.' 
  });
}
