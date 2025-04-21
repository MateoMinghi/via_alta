import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import pool from '@/config/database';

export async function POST(request: NextRequest) {
  try {
    const { studentId, reason } = await request.json();
    
    if (!studentId || !reason) {
      return NextResponse.json({ 
        success: false, 
        message: 'Student ID and change reason are required' 
      }, { status: 400 });
    }
    
    const client = await pool.connect();
    
    try {
      // Empezar transacciones
      await client.query('BEGIN');
      
      // Crear la solicitud de cambio
      const insertRequestQuery = `
        INSERT INTO Solicitud (IdAlumno, Comentario, Fecha, Estado)
        VALUES ($1, $2, $3, 'pendiente')
        RETURNING *
      `;
      
      const currentDate = new Date();
      const requestResult = await client.query(insertRequestQuery, [
        studentId, 
        reason, 
        currentDate
      ]);
      
      // Actualizar el estado de confirmación del estudiante
      await client.query('UPDATE Alumno SET Confirmacion = FALSE WHERE IdAlumno = $1', [studentId]);
      
      
      await client.query('COMMIT');
      
      return NextResponse.json({ 
        success: true, 
        message: 'Change request submitted successfully',
        data: requestResult.rows[0]
      });
    } catch (error) {
        // Si ocurre un error, revertir la transacción
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error submitting change request:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Error submitting change request',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

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

    
    const requestsQuery = `
      SELECT * FROM Solicitud 
      WHERE IdAlumno = $1
      ORDER BY Fecha DESC
    `;
    const requestsResult = await pool.query(requestsQuery, [studentId]);

    return NextResponse.json({ 
      success: true, 
      data: requestsResult.rows
    });
  } catch (error) {
    console.error('Error fetching change requests:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Error fetching change requests',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
