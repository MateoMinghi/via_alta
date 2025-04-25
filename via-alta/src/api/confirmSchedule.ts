// Este archivo maneja la confirmación de horarios por parte del estudiante

// Importa el objeto NextResponse y NextRequest desde Next.js
import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';

// Importa el modelo de estudiante
const Student = require('@/models/student');

/**
 * Maneja las solicitudes POST para confirmar el horario de un estudiante.
 * @param {NextRequest} request - La solicitud entrante con el ID del estudiante en el cuerpo.
 * @returns {NextResponse} - Respuesta con el estado de la confirmación.
 */
export async function POST(request: NextRequest) {
  try {
    // Extrae el ID del estudiante del cuerpo de la solicitud
    const { studentId } = await request.json();
    
    // Verifica que el ID del estudiante esté presente
    if (!studentId) {
      return NextResponse.json({ 
        success: false, 
        message: 'ID de estudiante requerido' 
      }, { status: 400 }); // 400 Bad Request
    }
    
    // Llama al método del modelo para confirmar el horario del estudiante
    const updatedStudent = await Student.confirmSchedule(studentId);
    
    // Si no se encuentra el estudiante, responde con un error 404
    if (!updatedStudent) {
      return NextResponse.json({ 
        success: false, 
        message: 'Estudiante no encontrado' 
      }, { status: 404 }); // 404 Not Found
    }
    
    // Responde con éxito y los datos actualizados del estudiante
    return NextResponse.json({ 
      success: true, 
      message: 'Horario confirmado exitosamente',
      data: updatedStudent
    });
  } catch (error) {
    // Maneja cualquier error inesperado durante el proceso
    console.error('Error al confirmar horario:', error);

    return NextResponse.json({ 
      success: false, 
      message: 'Error al procesar la confirmación',
      error: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 }); // 500 Internal Server Error
  }
}
