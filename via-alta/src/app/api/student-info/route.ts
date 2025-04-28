import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import pool from '@/config/database';
import Student from '@/lib/models/student';

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

    if (!studentId) {
      return NextResponse.json({ 
        success: false, 
        message: 'Student ID is required' 
      }, { status: 400 });
    }
    
    console.log(`GET student-info request received for student: ${studentId}`);
    
    // Jalar los detalles del estudiante desde el sistema central
    const studentDetails = await getStudentDetails(studentId);
    
    if (!studentDetails) {
      return NextResponse.json({ 
        success: false, 
        message: 'Student not found in central system' 
      }, { status: 404 });
    }
    
    // Usar el ID del estudiante desde el sistema central
    let isIrregular = false;
    
    try {
      const dbIsIrregular = await Student.isIrregularStudent(studentId);
      
      if (dbIsIrregular !== null) {
        // Si obtenemos un valor de la base de datos, usarlo
        isIrregular = dbIsIrregular;
        console.log(`Student ${studentId} checked in database, isIrregular: ${isIrregular}`);
      } else {
        // Si no hay registro en la base de datos, usar el flag del sistema central
        isIrregular = studentDetails.regular === false;
        console.log(`No database record found for student ${studentId}, using central system regular flag: ${studentDetails.regular}, isIrregular: ${isIrregular}`);
      }
    } catch (error) {
      console.error('Error checking student irregular status:', error);

      isIrregular = studentDetails.regular === false;
      console.log(`Error checking database, using central system regular flag: ${studentDetails.regular}, isIrregular: ${isIrregular}`);
    }
    
    // Combinar los detalles del estudiante con el ID del sistema central
    const student = {
      id: studentDetails.id,
      ivd_id: studentDetails.ivd_id,
      name: studentDetails.name,
      first_surname: studentDetails.first_surname,
      second_surname: studentDetails.second_surname,
      semester: studentDetails.semester,
      degree: studentDetails.degree,
      isIrregular: isIrregular, 
      regular: studentDetails.regular,
    };
    
    console.log(`Returning student info for ${studentId}, isIrregular: ${isIrregular}`);
    
    return NextResponse.json({ 
      success: true, 
      student 
    });
  } catch (error) {
    console.error('Error fetching student info:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Error fetching student info',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}