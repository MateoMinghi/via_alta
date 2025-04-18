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
  
  return await response.json();
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

    // Validar detalles del estudiante para determinar el semestre
    let semester = providedSemester;
    if (!semester) {
      try {
        const studentDetails = await getStudentDetails(studentId);
        semester = studentDetails.semester?.toString();
        
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

    // Primero, verificar si el estudiante tiene un horario individual
    const studentScheduleQuery = `
      SELECT h.*, g.*, m.Nombre as MateriaNombre, p.Nombre as ProfesorNombre, s.idsalon, s.tipo as TipoSalon
      FROM Horario h
      JOIN Grupo g ON h.idGrupo = g.IdGrupo
      LEFT JOIN Materia m ON g.IdMateria = m.IdMateria
      LEFT JOIN Profesor p ON g.IdProfesor = p.IdProfesor
      LEFT JOIN salon s ON g.IdSalon = s.idsalon
      WHERE h.idAlumno = $1
    `;
    const studentScheduleResult = await pool.query(studentScheduleQuery, [studentId]);
    
    if (studentScheduleResult.rows.length > 0) {
      // Si el estudiante tiene un horario individual, devolverlo
      return NextResponse.json({ 
        success: true, 
        data: studentScheduleResult.rows,
        isIndividual: true
      });
    }

    // Si no hay horario individual, obtener el horario general
    console.log('Fetching schedule for student:', studentId, 'semester:', semester);

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
    
    console.log('Received confirmation request for student:', studentId);
    console.log('Schedule items:', schedule.length);
    console.log('Test mode:', testMode ? 'enabled' : 'disabled');
    
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Primero, verificamos si el estudiante existe en la tabla Alumno
      const checkStudentQuery = 'SELECT * FROM Alumno WHERE IdAlumno = $1';
      const studentExists = await client.query(checkStudentQuery, [studentId]);
      
      // Si no existe, lo creamos
      if (studentExists.rows.length === 0) {
        console.log('Creating new student record in Alumno table');
        await client.query('INSERT INTO Alumno (IdAlumno, Confirmacion) VALUES ($1, FALSE)', [studentId]);
      }
      
      // Borrar el horario existente del estudiante
      await client.query('DELETE FROM Horario WHERE idAlumno = $1', [studentId]);
      
      // Insertar el nuevo horario
      const currentDate = new Date();
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
      }
      
      // If in test mode, don't update confirmation status
      if (!testMode) {
        await client.query('UPDATE Alumno SET Confirmacion = TRUE WHERE IdAlumno = $1', [studentId]);
      } else {
        console.log('Test mode active: Not updating confirmation status');
      }
      
      // Terminar la transacción
      await client.query('COMMIT');
      
      return NextResponse.json({ 
        success: true, 
        message: testMode ? 'Schedule saved in test mode' : 'Schedule confirmed successfully',
        testMode
      });
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Transaction error:', error);
      throw error;
    } finally {
      client.release();
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
