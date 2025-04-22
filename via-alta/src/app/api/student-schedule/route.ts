import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import pool from '@/config/database';

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

    // Use effectiveStudentId for all database operations
    const studentScheduleQuery = `
      SELECT h.*, g.*, m.Nombre as MateriaNombre, p.Nombre as ProfesorNombre, s.idsalon, s.tipo as TipoSalon
      FROM Horario h
      JOIN Grupo g ON h.idGrupo = g.IdGrupo
      LEFT JOIN Materia m ON g.IdMateria = m.IdMateria
      LEFT JOIN Profesor p ON g.IdProfesor = p.IdProfesor
      LEFT JOIN salon s ON g.IdSalon = s.idsalon
      WHERE h.idAlumno = $1
    `;
    const studentScheduleResult = await pool.query(studentScheduleQuery, [effectiveStudentId]);
    
    if (studentScheduleResult.rows.length > 0) {
      // Si el estudiante tiene un horario individual, devolverlo
      return NextResponse.json({ 
        success: true, 
        data: studentScheduleResult.rows,
        isIndividual: true
      });
    }

    // Si no hay horario individual, obtener el horario general
    console.log('Fetching schedule for student:', effectiveStudentId, 'semester:', semester);

    const generalScheduleQuery = `
      SELECT hg.*, g.*, m.Nombre as MateriaNombre, p.Nombre as ProfesorNombre, s.idsalon, s.tipo as TipoSalon
      FROM HorarioGeneral hg
      JOIN Grupo g ON hg.IdGrupo = g.IdGrupo
      LEFT JOIN Materia m ON g.IdMateria = m.IdMateria
      LEFT JOIN Profesor p ON g.IdProfesor = p.IdProfesor
      LEFT JOIN salon s ON g.IdSalon = s.idsalon
      WHERE g.Semestre = $1
      ORDER BY hg.Dia, hg.HoraInicio
    `;
    
    console.log('Running query with semester:', semester);
    const generalScheduleResult = await pool.query(generalScheduleQuery, [semester]);
    
    console.log('Query result rows:', generalScheduleResult.rows.length);
    
    if (generalScheduleResult.rows.length > 0) {
      console.log('Sample data:', generalScheduleResult.rows[0]);
    }

    return NextResponse.json({ 
      success: true, 
      data: generalScheduleResult.rows,
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
    const { studentId, schedule, testMode } = await request.json();
    
    if (!studentId || !schedule || !Array.isArray(schedule)) {
      return NextResponse.json({ 
        success: false, 
        message: 'Student ID and schedule array are required' 
      }, { status: 400 });
    }
    
    console.log(`Starting schedule confirmation for student: ${studentId}`);
    console.log(`Schedule items count: ${schedule.length}, Test mode: ${testMode ? 'enabled' : 'disabled'}`);
    
    const client = await pool.connect();
    console.log('Database connection established');
    
    try {
      await client.query('BEGIN');
      console.log('Transaction started');
      
      // Primero, verificamos si el estudiante existe en la tabla Alumno
      const checkStudentQuery = 'SELECT * FROM Alumno WHERE IdAlumno = $1';
      const studentExists = await client.query(checkStudentQuery, [studentId]);
      console.log(`Student check complete: ${studentExists.rows.length > 0 ? 'exists' : 'does not exist'} in Alumno table`);
      
      // Si no existe, lo creamos
      if (studentExists.rows.length === 0) {
        console.log(`Creating new student record in Alumno table for ID: ${studentId}`);
        await client.query('INSERT INTO Alumno (IdAlumno, Confirmacion) VALUES ($1, FALSE)', [studentId]);
        console.log('Student record created successfully');
      }
      
      // Borrar el horario existente del estudiante
      const deleteResult = await client.query('DELETE FROM Horario WHERE idAlumno = $1', [studentId]);
      console.log(`Deleted ${deleteResult.rowCount} existing schedule items for student: ${studentId}`);
      
      // Insertar el nuevo horario
      const currentDate = new Date();
      let insertedCount = 0;
      for (const item of schedule) {
        // Handle case sensitivity in property names
        const idGrupo = item.IdGrupo || item.idgrupo;
        
        if (!idGrupo) {
          console.warn('Skipping item without group ID:', item);
          continue;
        }
        
        const query = `
          INSERT INTO Horario (fecha, idGrupo, idAlumno)
          VALUES ($1, $2, $3)
        `;
        await client.query(query, [currentDate, idGrupo, studentId]);
        insertedCount++;
      }
      console.log(`Successfully inserted ${insertedCount} schedule items for student: ${studentId}`);
      
      // If in test mode, don't update confirmation status
      if (!testMode) {
        await client.query('UPDATE Alumno SET Confirmacion = TRUE WHERE IdAlumno = $1', [studentId]);
        console.log(`Student ${studentId} confirmation status updated to TRUE`);
      } else {
        console.log(`Test mode active: Not updating confirmation status for student: ${studentId}`);
      }
      
      // Terminar la transacción
      await client.query('COMMIT');
      console.log('Transaction committed successfully');
      
      return NextResponse.json({ 
        success: true, 
        message: testMode ? 'Schedule saved in test mode' : 'Schedule confirmed successfully',
        testMode,
        itemsProcessed: insertedCount
      });
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Transaction error:', error);
      throw error;
    } finally {
      client.release();
      console.log('Database connection released');
    }
  } catch (error) {
    console.error('Error saving student schedule:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Error saving schedule',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
