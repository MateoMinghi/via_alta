import { NextResponse } from 'next/server';
import pool from '@/config/database';
import Student from '@/lib/models/student';

// Configuracion de la API para acceder a los datos de estudiantes
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

// Obtener todos los estudiantes del sistema central
async function getAllStudents(): Promise<any[]> {
  try {
    const token = await getAuthToken();
    
    const response = await fetch(`${API_BASE_URL}/v1/users/all?type=Users::Student`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch students: ${response.status}`);
    }
    
    const responseData = await response.json();
    
    const studentsArray = Array.isArray(responseData)
      ? responseData
      : (responseData.data && Array.isArray(responseData.data) ? responseData.data : []);
    
    return studentsArray;
  } catch (error) {
    console.error('Error fetching students from central system:', error);
    throw error;
  }
}

export async function POST() {
  console.log('[BATCH SCHEDULE CONFIRMATION] Starting bulk confirmation process');
  
  try {
    // 1. Obtener todos los estudiantes del sistema central
    console.log('Fetching all students from central system...');
    const centralSystemStudents = await getAllStudents();
    console.log(`Retrieved ${centralSystemStudents.length} students from central system`);
    
    // 2. Obtener todos los estudiantes locales que ya confirmaron
    console.log('Fetching confirmed students from local database...');
    const localStudents = await Student.findAll();
    console.log(`Found ${localStudents.length} students in local database`);
    
    // Crear un conjunto de IDs de estudiantes ya confirmados para búsqueda rápida
    const confirmedStudentsSet = new Set(
      localStudents
        .filter(student => student.Confirmacion === true)
        .map(student => student.IdAlumno)
    );
    
    console.log(`${confirmedStudentsSet.size} students already confirmed`);
    
    // 3. Filtrar solo los estudiantes que no han confirmado
    const studentsToConfirm = centralSystemStudents.filter(student => {
      const studentId = student.ivd_id || student.id?.toString();
      return studentId && !confirmedStudentsSet.has(studentId);
    });
    
    console.log(`Found ${studentsToConfirm.length} students to confirm`);
    
    // 4. Actualizar todos los estudiantes existentes a confirmado - usar método existente
    console.log('Updating all existing students to confirmed status');
    await Student.confirmAllSchedules();
    
    // 5. Para cada estudiante no confirmado, procesar utilizando los métodos del modelo
    let confirmedCount = 0;
    let failedCount = 0;
    
    for (const student of studentsToConfirm) {
      const studentId = student.ivd_id || student.id?.toString();
      const semester = student.semester || 1;
      
      if (!studentId) {
        console.warn('Skipping student with no ID');
        failedCount++;
        continue;
      }
      
      console.log(`Processing student: ${studentId} (semester ${semester})`);
      
      // Usar el método completo del modelo que maneja toda la lógica
      const result = await Student.confirmStudentWithSchedule(studentId, semester);
      
      if (result.success) {
        confirmedCount++;
        console.log(result.message);
      } else {
        failedCount++;
        console.error(`Failed to process student ${studentId}: ${result.message}`);
      }
    }
    
    console.log(`Batch process completed. Confirmed ${confirmedCount} new students, failed ${failedCount}`);
    
    return NextResponse.json({
      success: true,
      message: 'Batch confirmation completed',
      data: {
        confirmed: confirmedCount,
        failed: failedCount,
        total: studentsToConfirm.length
      }
    });
  } catch (error) {
    console.error('[BATCH SCHEDULE CONFIRMATION] Error:', error);
    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error during batch confirmation',
      error: error
    }, { status: 500 });
  }
}
