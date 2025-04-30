import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import Student from '@/lib/models/student';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const studentId = searchParams.get('studentId');

    if (!studentId) {
      return NextResponse.json({ 
        success: false, 
        message: 'Student ID is required' 
      }, { status: 400 });
    }
    
    console.log(`Checking status for student with ivd_id: ${studentId}`);

    // Revisar la tabla 'alumno' para ver si el estudiante está inscrito
    const studentResult = await Student.queryStudentConfirmation(studentId);
    
    if (studentResult.rows.length > 0) {
      // Si el estudiante está en la tabla 'alumno', verificar el estado de confirmación
      if(studentResult.rows[0].confirmacion){
        return NextResponse.json({
          success: true,
          status: 'inscrito'
        });
      }
    }
    else{
      // Si no estamos en la tabla 'alumno', el estado es "no-inscrito" (rojo)
      console.log(`Student ${studentId} not found in alumno table, status: no-inscrito`);
    }
    
    // Primero revisar la tabla 'solicitud' para ver si el estudiante tiene una solicitud pendiente
    const requestResult = await Student.queryStudentRequests(studentId);
    
    // Si se encuentra una solicitud en la tabla 'solicitud', el estado es "requiere-cambios" (amarillo)
    if (requestResult.rows.length > 0) {
      console.log(`Student ${studentId} found in solicitud table, status: requiere-cambios`);
      return NextResponse.json({
        success: true,
        status: 'requiere-cambios'
      });
    }
    
      return NextResponse.json({
        success: true,
        status: 'no-inscrito'
      });
  } catch (error) {
    console.error('Error checking student status:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Error checking student status',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}