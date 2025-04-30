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
  try {
    const token = await getAuthToken();
    
    console.log(`Attempting to fetch details for student with ivd_id ${studentId} from central system...`);
    
    
    const response = await fetch(`${API_BASE_URL}/v1/users/find_one?ivd_id=${studentId}`, {
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
    
    if (responseData.data) {
      const studentData = responseData.data;
      
      if (studentData.current_students_plan?.plan?.degree?.name) {
        studentData.degree = studentData.current_students_plan.plan.degree.name;
      }
      
      return studentData;
    }
    
    return responseData;
  } catch (error) {
    console.error('Error in getStudentDetails:', error);
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const studentId = searchParams.get('studentId');
    const providedSemester = searchParams.get('semester');
    const providedDegree = searchParams.get('degree');

    if (!studentId) {
      return NextResponse.json({ 
        success: false, 
        message: 'Student ID is required' 
      }, { status: 400 });
    }
    
    // Validar el formato del ID del estudiante (solo usar ivd_id)
    if (/^\d+$/.test(studentId) && studentId.length < 6) {
      console.error(`Error: Received numeric internal ID (${studentId}) instead of ivd_id. Only ivd_id should be used for lookups.`);
      return NextResponse.json({ 
        success: false, 
        message: 'Invalid student ID format. The system must use ivd_id (student number) instead of internal ID.' 
      }, { status: 400 });
    }

    console.log(`GET request received for student: ${studentId}`);

    // Validar detalles del estudiante para determinar el semestre y carrera
    let semester = providedSemester;
    let degree = providedDegree;
    
    try {
      const studentDetails = await getStudentDetails(studentId);
      
      if (studentDetails) {
        semester = semester || studentDetails.semester?.toString();
        degree = degree || studentDetails.degree || studentDetails.major;
        
        console.log('Student details retrieved:', {
          ivd_id: studentDetails.ivd_id, 
          semester: studentDetails.semester,
          degree: degree
        });
      } else {
        console.warn(`No student details found for ID: ${studentId}, using provided values`);
      }
      
      if (!semester) {
        return NextResponse.json({ 
          success: false, 
          message: 'Could not determine student semester. Please provide a semester parameter.' 
        }, { status: 400 });
      }
    } catch (error) {
      console.error('Error fetching student details from central system:', error);
      
      if (!semester) {
        return NextResponse.json({ 
          success: false, 
          message: 'Semester parameter is required when central system is unavailable',
          error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 400 });
      }
    }


    // Usar el modelo Schedule para obtener el horario del estudiante
    const studentScheduleResult = await Schedule.findDetailedStudentSchedule(studentId);
    
    if (studentScheduleResult.length > 0) {
      // Si el estudiante tiene un horario individual, devolverlo
      return NextResponse.json({ 
        success: true, 
        data: studentScheduleResult,
        isIndividual: true
      });
    }

    // Si no hay horario individual, obtener el horario general
    console.log('Fetching schedule for student:', studentId, 'semester:', semester, 'degree:', degree);

    // Usar el modelo Schedule para obtener el horario general
    let generalScheduleResult;
    if (degree) {
      console.log(`Executing SQL query with semester = ${semester} AND NombreCarrera = ${degree}`);
      
      generalScheduleResult = await Schedule.findGeneralScheduleBySemesterAndDegree(semester, degree);
      
      //Si no hay resultados, intentar solo con el semestre
      if (generalScheduleResult.length === 0) {
        console.log(` No results found for semester=${semester} and degree=${degree}`);
        console.log(`   - Falling back to semester-only filter`);
        console.log(`   - Note: This may be because the degree name in the database doesn't match "${degree}"`);
        generalScheduleResult = await Schedule.findGeneralScheduleBySemester(semester);
      }
    } else {
      console.log(` No degree information available for student ${studentId}`);
      console.log(`   - Filtering schedule by semester only (${semester})`);
      generalScheduleResult = await Schedule.findGeneralScheduleBySemester(semester);
    }
    
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
    
    const client = await Schedule.getClient();
    console.log('[SCHEDULE CONFIRMATION] Database connection established');
    
    try {
      await client.query('BEGIN');
      console.log('[SCHEDULE CONFIRMATION] Transaction started');
      
      // Primero, verificamos si el estudiante existe en la tabla Alumno
      const studentExists = await Student.checkExists(studentId);
      
      if (studentExists) {
        console.log(`[SCHEDULE CONFIRMATION] Student ${studentId} found in database`);
      } else {
        console.log(`[SCHEDULE CONFIRMATION] Student ${studentId} not found, creating new record`);
        
        // Si no existe, lo creamos y esperamos a que la inserción se complete
        await Student.createWithStatus(studentId, false);
        console.log(`[SCHEDULE CONFIRMATION] Created new student record for ID: ${studentId}`);
        
        // Verificar que el estudiante se creó correctamente
        const verifyStudent = await Student.checkExists(studentId);
        
        if (!verifyStudent) {
          console.error(`[SCHEDULE CONFIRMATION] Failed to create student record for ID: ${studentId}`);
          throw new Error(`Failed to create student record for ID: ${studentId}`);
        }
        
        console.log(`[SCHEDULE CONFIRMATION] Verified student record was created for ID: ${studentId}`);
      }
      
      // Borrar horarios existentes para el estudiante
      const deletedCount = await Schedule.deleteStudentSchedule(studentId);
      console.log(`[SCHEDULE CONFIRMATION] Deleted ${deletedCount} existing schedule items for student: ${studentId}`);
      
      // Extraer los IDs de grupo del horario
      const groupIds = schedule.map(item => item.IdGrupo || item.idgrupo).filter(Boolean);
      console.log(`[SCHEDULE CONFIRMATION] Extracted ${groupIds.length} valid group IDs for insertion`);
      
      // Insertar nuevos horarios
      let insertedCount = 0;
      const currentDate = new Date();
      
      if (groupIds.length > 0) {
        for (const groupId of groupIds) {
          console.log(`[SCHEDULE CONFIRMATION] Inserting schedule for group ID ${groupId} and student ${studentId}`);
          await Schedule.addScheduleEntry(studentId, groupId, currentDate);
          insertedCount++;
        }
        console.log(`[SCHEDULE CONFIRMATION] Successfully inserted ${insertedCount} schedule items`);
      } else {
        console.warn(`[SCHEDULE CONFIRMATION] No valid group IDs to insert for student: ${studentId}`);
      }
      
      // Siempre confirmamos el horario del estudiante
      await Student.confirmSchedule(studentId);
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
