// Este archivo maneja la confirmación de horarios por parte del estudiante
import { NextResponse } from 'next/server';
const Student = require('@/models/student');

export async function POST(request) {
  try {
    const { studentId } = await request.json();
    
    if (!studentId) {
      return NextResponse.json({ 
        success: false, 
        message: 'ID de estudiante requerido' 
      }, { status: 400 });
    }
    
    // Actualizar el estado de confirmación del estudiante
    const updatedStudent = await Student.confirmSchedule(studentId);
    
    if (!updatedStudent) {
      return NextResponse.json({ 
        success: false, 
        message: 'Estudiante no encontrado' 
      }, { status: 404 });
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Horario confirmado exitosamente',
      data: updatedStudent
    });
  } catch (error) {
    console.error('Error al confirmar horario:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Error al procesar la confirmación',
      error: error.message 
    }, { status: 500 });
  }
}