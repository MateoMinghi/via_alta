import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import pool from '@/config/database';
import Schedule from '@/lib/models/schedule';
import Student from '@/lib/models/student'; // Assuming you have a Student model

// Configuracion de la API
const API_BASE_URL = process.env.API_BASE_URL;
const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;

// Funcion para obtener el token de autenticacion
async function getAuthToken(): Promise<string> {
  if (!API_BASE_URL || !CLIENT_ID || !CLIENT_SECRET) {
    throw new Error('API configuration environment variables are not set');
  }
  
  const response = await fetch(`${API_BASE_URL}/m2m/authenticate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
    }),
  });
  
  if (!response.ok) {
    throw new Error('Failed to authenticate with central system');
  }
  const data = await response.json();
  return data.token;
}

// Funcion para obtener los detalles del estudiante desde el sistema central
async function getStudentDetails(studentId: string): Promise<any> {
  const token = await getAuthToken();
  
  const response = await fetch(`${API_BASE_URL}/v1/users/${studentId}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch student details from central system');
  }
  
  const responseData = await response.json();
  
  // Return the full data structure with proper extraction of ivd_id
  if (responseData.data) {
    const studentData = responseData.data;
    return studentData;  // Return the student data object directly
  }
  
  return responseData; // Fallback to the whole response if data property is missing
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const studentId = searchParams.get('studentId');
    const providedSemester = searchParams.get('semester');

    if (!studentId) {
      return NextResponse.json({ 
        success: false, 
        message: 'Student ID is required' 
      }, { status: 400 });
    }

    console.log(`GET request received for student: ${studentId}`);

    // Validar detalles del estudiante para determinar el semestre
    let semester = providedSemester;
    let effectiveStudentId = studentId; // Use this for all database operations
    
    if (!semester) {
      try {
        const studentDetails = await getStudentDetails(studentId);
        
        // Make sure we're using ivd_id instead of id for database operations
        if (studentDetails.ivd_id) {
          effectiveStudentId = studentDetails.ivd_id.toString();
          console.log(`Using ivd_id (${effectiveStudentId}) instead of provided ID (${studentId})`);
        }
        
        semester = studentDetails.semester?.toString();
        
        // Log effective ID being used (should be ivd_id when available)
        console.log('Student details retrieved:', {
          originalId: studentId,
          effectiveId: effectiveStudentId,
          ivd_id: studentDetails.ivd_id, 
          semester: studentDetails.semester
        });
        
        if (!semester) {
          return NextResponse.json({ 
            success: false, 
            message: 'Could not determine student semester from central system' 
          }, { status: 400 });
        }
      } catch (error) {
        console.error('Error fetching student details from central system:', error);
        return NextResponse.json({ 
          success: false, 
          message: 'Error fetching student details from central system',
          error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
      }
    }

    // Usar el modelo Schedule para obtener el horario del estudiante
    const studentScheduleResult = await Schedule.findDetailedStudentSchedule(effectiveStudentId);
    
    if (studentScheduleResult.length > 0) {
      // Si el estudiante tiene un horario individual, devolverlo
      return NextResponse.json({ 
        success: true, 
        data: studentScheduleResult,
        isIndividual: true
      });
    }

    // Si no hay horario individual, obtener el horario general
    console.log('Fetching schedule for student:', effectiveStudentId, 'semester:', semester);

    // Usar el modelo Schedule para obtener el horario general
    const generalScheduleResult = await Schedule.findGeneralScheduleBySemester(semester);
    
    console.log('Query result rows:', generalScheduleResult.length);
    
    if (generalScheduleResult.length > 0) {
      console.log('Sample data:', generalScheduleResult[0]);
    }

    return NextResponse.json({ 
      success: true, 
      data: generalScheduleResult,
      isIndividual: false
    });
  } catch (error) {
    console.error('Error fetching student schedule:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Error fetching schedule',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { studentId, schedule } = await request.json();
    
    if (!studentId || !schedule || !Array.isArray(schedule)) {
      return NextResponse.json({ 
        success: false, 
        message: 'Student ID and schedule array are required' 
      }, { status: 400 });
    }
    
    console.log('[SCHEDULE CONFIRMATION] Beginning process for student ID:', studentId);
    console.log(`[SCHEDULE CONFIRMATION] Schedule items count: ${schedule.length}`);
    
    const client = await pool.connect();
    console.log('[SCHEDULE CONFIRMATION] Database connection established');
    
    try {
      await client.query('BEGIN');
      console.log('[SCHEDULE CONFIRMATION] Transaction started');
      
      // Primero, verificamos si el estudiante existe en la tabla Alumno
      const checkStudentQuery = 'SELECT * FROM Alumno WHERE IdAlumno = $1';
      const studentExists = await client.query(checkStudentQuery, [studentId]);
      
      if (studentExists.rows.length > 0) {
        console.log(`[SCHEDULE CONFIRMATION] Student ${studentId} found in database`);
      } else {
        console.log(`[SCHEDULE CONFIRMATION] Student ${studentId} not found, creating new record`);
      }
      
      // Si no existe, lo creamos
      if (studentExists.rows.length === 0) {
        await client.query('INSERT INTO Alumno (IdAlumno, Confirmacion) VALUES ($1, FALSE)', [studentId]);
        console.log(`[SCHEDULE CONFIRMATION] Created new student record for ID: ${studentId}`);
      }
      
      // Delete existing schedule using Schedule model
      const deleteCount = await Schedule.deleteAllForStudent(studentId);
      console.log(`[SCHEDULE CONFIRMATION] Deleted ${deleteCount} existing schedule items for student: ${studentId}`);
      
      // Extract just the group IDs from the schedule items
      const groupIds = schedule.map(item => item.IdGrupo || item.idgrupo).filter(Boolean);
      console.log(`[SCHEDULE CONFIRMATION] Extracted ${groupIds.length} valid group IDs for insertion`);
      
      // Use Schedule model to bulk insert the new schedule items
      let insertedCount = 0;
      if (groupIds.length > 0) {
        insertedCount = await Schedule.bulkCreate(studentId, groupIds);
        console.log(`[SCHEDULE CONFIRMATION] Successfully inserted ${insertedCount} schedule items`);
      } else {
        console.warn(`[SCHEDULE CONFIRMATION] No valid group IDs to insert for student: ${studentId}`);
      }
      
      // Always update confirmation status - test mode removed
      await client.query('UPDATE Alumno SET Confirmacion = TRUE WHERE IdAlumno = $1', [studentId]);
      console.log(`[SCHEDULE CONFIRMATION] Updated confirmation status to TRUE for student: ${studentId}`);
      
      // Terminar la transacción
      await client.query('COMMIT');
      console.log('[SCHEDULE CONFIRMATION] Transaction committed successfully');
      
      return NextResponse.json({ 
        success: true, 
        message: 'Schedule confirmed successfully',
        itemsProcessed: insertedCount
      });
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('[SCHEDULE CONFIRMATION] Transaction error:', error);
      throw error;
    } finally {
      client.release();
      console.log('[SCHEDULE CONFIRMATION] Database connection released');
    }
  } catch (error) {
    console.error('[SCHEDULE CONFIRMATION] Error saving student schedule:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Error saving schedule',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
