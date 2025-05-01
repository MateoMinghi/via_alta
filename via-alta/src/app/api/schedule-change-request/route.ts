import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import pool from '@/config/database';

// Configuración de la API
const API_BASE_URL = process.env.API_BASE_URL;
const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;

// Función para obtener el token de autenticación
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

// Función para obtener los detalles del estudiante desde el sistema central
async function getStudentDetails(studentId: string): Promise<any> {
  try {
    const token = await getAuthToken();
    
    // Usar el endpoint find_one directamente ya que es la forma más confiable de obtener los detalles del estudiante
    console.log(`Fetching student details using find_one endpoint for ID: ${studentId}`);
    
    const response = await fetch(`${API_BASE_URL}/v1/users/find_one?id=${studentId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    
    console.log(`API response status: ${response.status} ${response.statusText}`);
    
    if (!response.ok) {
      console.warn(`Failed to fetch student details from central system (Status ${response.status})`);
      return null;
    }
    
    const responseData = await response.json();
    
    // Devolver la estructura de datos completa con la extracción adecuada de ivd_id
    if (responseData.data) {
      return responseData.data;
    }
    
    return responseData;
  } catch (error) {
    console.error('Error in getStudentDetails:', error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const { studentId, reason } = await request.json();
    
    // Log the start of the change request process with details
    console.log(`CHANGE REQUEST PROCESS STARTED - Student ID: ${studentId}`);
    console.log(`Change reason: ${reason?.substring(0, 50)}${reason?.length > 50 ? '...' : ''}`);
    
    if (!studentId || !reason) {
      console.log(`CHANGE REQUEST FAILED - Missing required fields`);
      return NextResponse.json({ 
        success: false, 
        message: 'Student ID and change reason are required' 
      }, { status: 400 });
    }
    
    console.log(`POST request received for student change request: ${studentId}`);
    
    // Use the same approach as student-schedule/route.ts for consistency
    let effectiveStudentId = studentId; // Use this for all database operations
    
    try {
      const studentDetails = await getStudentDetails(studentId);
      
      // Make sure we're using ivd_id instead of id for database operations
      if (studentDetails && studentDetails.ivd_id) {
        effectiveStudentId = studentDetails.ivd_id.toString();
        console.log(`Using ivd_id (${effectiveStudentId}) instead of provided ID (${studentId})`);
      }
      
      // Log effective ID being used (should be ivd_id when available)
      console.log('Student details retrieved:', {
        originalId: studentId,
        effectiveId: effectiveStudentId,
        ivd_id: studentDetails?.ivd_id
      });
    } catch (error) {
      console.warn('Error retrieving student details, using provided ID:', error);
    }
    
    console.log(`Using effective student ID: ${effectiveStudentId} for database operations`);
    
    // Conectar a la base de datos
    const client = await pool.connect();
    console.log('Database connection established');
    
    try {
      // Iniciar transacción
      await client.query('BEGIN');
      console.log('Transaction started');
      
      // Verificar si el usuario existe en la tabla users
      const userCheckQuery = 'SELECT * FROM users WHERE ivd_id::text = $1';
      const userResult = await client.query(userCheckQuery, [effectiveStudentId]);
      
      // Si el usuario no existe, no podemos continuar
      if (userResult.rows.length === 0) {
        console.log(`User with ivd_id ${effectiveStudentId} does not exist in users table.`);
        await client.query('ROLLBACK');
        return NextResponse.json({
          success: false,
          message: `User with ivd_id ${effectiveStudentId} not found. The user must exist in the system before submitting a change request.`
        }, { status: 404 });
      }
      
      console.log(`Found user with ivd_id: ${effectiveStudentId} in users table`);
      
      
      // Ahora verificar si el estudiante existe en la tabla alumno
      const checkStudentQuery = 'SELECT * FROM Alumno WHERE IdAlumno = $1';
      const studentExists = await client.query(checkStudentQuery, [effectiveStudentId]);
      console.log(`Student check complete: ${studentExists.rows.length > 0 ? 'exists' : 'does not exist'} in Alumno table with ID: ${effectiveStudentId}`);
      
      // Si no existe, lo creamos usando effectiveStudentId
      if (studentExists.rows.length === 0) {
        console.log(`Creating new student record in Alumno table for ID: ${effectiveStudentId}`);
        await client.query('INSERT INTO Alumno (IdAlumno, Confirmacion) VALUES ($1, FALSE)', [effectiveStudentId]);
        console.log('Student record created successfully');
      } else {
        // Actualizar el estado de confirmación a FALSE
        console.log(`Updating confirmation status to FALSE for student: ${effectiveStudentId}`);
        await client.query('UPDATE Alumno SET Confirmacion = FALSE WHERE IdAlumno = $1', [effectiveStudentId]);
      }
      
      // Obtener el siguiente ID disponible para la tabla de solicitud
      const getNextIdQuery = `SELECT COALESCE(MAX(idsolicitud), 0) + 1 as next_id FROM solicitud`;
      const nextIdResult = await client.query(getNextIdQuery);
      const nextId = nextIdResult.rows[0].next_id;
      
      // Crear la solicitud de cambio usando effectiveStudentId
      const insertRequestQuery = `
        INSERT INTO solicitud (idsolicitud, idalumno, descripcion, fecha, estado) 
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `;
      
      const currentDate = new Date();
      console.log(`Inserting change request for student ${effectiveStudentId}`);
      
      const requestResult = await client.query(insertRequestQuery, [
        nextId,
        effectiveStudentId,
        reason, 
        currentDate,
        "pendiente"
      ]);
      
      console.log(`CHANGE REQUEST SUCCESSFULLY CREATED`);
      console.log(`Request details: ID=${nextId}, Student=${effectiveStudentId}, Status=pendiente`);
      console.log(`Request date: ${currentDate.toISOString()}`);
      
      await client.query('COMMIT');
      console.log('Transaction committed');
      console.log(`CHANGE REQUEST PROCESS COMPLETED SUCCESSFULLY`);
      
      return NextResponse.json({ 
        success: true, 
        message: 'Change request submitted successfully',
        data: requestResult.rows[0]
      });
    } catch (error) {
      // Si ocurre un error, revertir la transacción
      await client.query('ROLLBACK');
      console.error('TRANSACTION ERROR:', error);
      console.error('CHANGE REQUEST FAILED - Database error');
      throw error;
    } finally {
      client.release();
      console.log('Database connection released');
    }
  } catch (error) {
    console.error('CHANGE REQUEST PROCESS FAILED:', error);
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
    const countOnly = searchParams.get('count') === 'true';
    const fetchAll = searchParams.get('fetchAll') === 'true';

    // If count parameter is true, fetch either the count or all requests
    if (countOnly) {
      console.log('GET request received for pending change requests');
      
      // Determine whether to fetch all requests or just the count
      if (fetchAll) {
        // Fetch all pending change requests with details
        const requestsQuery = `
          SELECT * FROM solicitud 
          WHERE estado = 'pendiente'
          ORDER BY fecha DESC
        `;
        
        const requestsResult = await pool.query(requestsQuery);
        const requests = requestsResult.rows;
        
        console.log(`Found ${requests.length} pending change requests:`, requests);
        
        return NextResponse.json({ 
          success: true, 
          count: requests.length,
          requests: requests
        });
      } else {
        // Just return the count
        const countQuery = `
          SELECT COUNT(*) as count FROM solicitud 
          WHERE estado = 'pendiente'
        `;
        
        const countResult = await pool.query(countQuery);
        const count = parseInt(countResult.rows[0].count) || 0;
        
        console.log(`Found ${count} pending change requests`);
        
        return NextResponse.json({ 
          success: true, 
          count: count
        });
      }
    }

    if (!studentId) {
      return NextResponse.json({ 
        success: false, 
        message: 'Student ID is required' 
      }, { status: 400 });
    }
    
    console.log(`GET request received for student change requests: ${studentId}`);
    
    // Use the same approach as in student-schedule/route.ts for consistency
    let effectiveStudentId = studentId; // Use this for all database operations
    
    try {
      const studentDetails = await getStudentDetails(studentId);
      
      // Make sure we're using ivd_id instead of id for database operations
      if (studentDetails && studentDetails.ivd_id) {
        effectiveStudentId = studentDetails.ivd_id.toString();
        console.log(`Using ivd_id (${effectiveStudentId}) instead of provided ID (${studentId})`);
      }
      
      // Log effective ID being used (should be ivd_id when available)
      console.log('Student details retrieved:', {
        originalId: studentId,
        effectiveId: effectiveStudentId,
        ivd_id: studentDetails?.ivd_id
      });
    } catch (error) {
      console.warn('Error retrieving student details, using provided ID:', error);
    }
    
    console.log(`Using effective student ID: ${effectiveStudentId} for database operations`);
    
    console.log(`Fetching change requests for student ID: ${effectiveStudentId}`);
    const requestsQuery = `
      SELECT * FROM Solicitud 
      WHERE IdAlumno = $1
      ORDER BY Fecha DESC
    `;
    const requestsResult = await pool.query(requestsQuery, [effectiveStudentId]);
    
    console.log(`Found ${requestsResult.rows.length} change requests for student ${effectiveStudentId}`);

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
