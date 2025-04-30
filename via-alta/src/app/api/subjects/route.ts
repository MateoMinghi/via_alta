import { NextResponse } from 'next/server';
import pool from '@/config/database'; // Import database connection

// URL base de la API y credenciales para la autenticación
const API_BASE_URL = 'https://ivd-qa-0dc175b0ba43.herokuapp.com';
const CLIENT_ID = 'payments_app';
const CLIENT_SECRET = 'a_client_secret';

/**
 * Función para obtener el token de autenticación desde la API.
 */
async function getAuthToken(): Promise<string> {
    try {
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
            throw new Error('Failed to authenticate');
        }

        const data = await response.json();
        return data.token;
    } catch (error) {
        console.error('Authentication error:', error);
        throw error;
    }
}

/**
 * Función para obtener la lista de cursos desde la API.
 */
async function fetchCourses(): Promise<any[]> {
    try {
        const token = await getAuthToken();

        const response = await fetch(`${API_BASE_URL}/v1/courses/all`, {
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            throw new Error('Failed to fetch courses');
        }

        const data = await response.json();
        
        // Ensure the data structure is as expected
        if (data && data.data && Array.isArray(data.data)) {
            return data.data.map((course: any) => ({
                id: course.id, 
                name: course.name || course.title
            }));
        } else {
            console.warn('Unexpected API response format:', data);
            throw new Error('Invalid API response format');
        }
    } catch (error) {
        console.error('Error in fetchCourses:', error);
        throw error;
    }
}

/**
 * Function to get subjects from the local database
 * Used as fallback when the external API fails
 */
async function getSubjectsFromDatabase() {
    try {
        const query = 'SELECT * FROM Materia ORDER BY Nombre';
        const result = await pool.query(query);
        console.log(`Retrieved ${result.rows.length} subjects from database`);
        
        // Format the database results to match the expected format in the frontend
        return result.rows.map(subject => ({
            id: subject.idmateria,
            name: subject.nombre
        }));
    } catch (error) {
        console.error('Error getting subjects from database:', error);
        throw error;
    }
}

/**
 * API endpoint for getting subjects
 */
export async function GET() {
    let subjects = [];
    let sourceType = '';
    
    try {
        // First try to get courses from external API
        try {
            const courses = await fetchCourses();
            if (courses && courses.length > 0) {
                subjects = courses;
                sourceType = 'external API';
            } else {
                throw new Error('External API returned empty courses');
            }
        } catch (apiError) {
            console.warn('Failed to fetch from external API, using database as fallback:', apiError);
            
            // Fallback to database if external API fails
            const dbSubjects = await getSubjectsFromDatabase();
            if (dbSubjects && dbSubjects.length > 0) {
                subjects = dbSubjects;
                sourceType = 'database';
            } else {
                throw new Error('No subjects found in database');
            }
        }

        console.log(`Successfully retrieved ${subjects.length} subjects from ${sourceType}:`, subjects);
        
        // Make sure we're returning a consistent format
        const formattedSubjects = subjects.map(subject => ({
            id: subject.id,
            name: subject.name
        }));

        // Return the subjects directly (not wrapped in a data property)
        return NextResponse.json(formattedSubjects);
        
    } catch (error) {
        console.error('Error fetching subjects:', error);
        
        // Return hardcoded data as a last resort for production
        const fallbackSubjects = [
            { id: 1, name: 'Fundamentos de Diseño' },
            { id: 2, name: 'Dibujo del Cuerpo' },
            { id: 3, name: 'Patronaje de Prendas Básicas' },
            { id: 4, name: 'Confección de Prendas Básicas' },
            { id: 5, name: 'Técnicas de Expresión Gráfica' },
            { id: 6, name: 'Historia de la Moda' },
            { id: 7, name: 'Herramientas y Puntadas Básicas' },
            { id: 8, name: 'Patronaje de Prendas Femeninas' },
            { id: 9, name: 'Confección de Prendas Femeninas' },
            { id: 10, name: 'Conceptos y Tendencias de la Moda I' }
        ];
        
        console.log("Using fallback hardcoded subjects");
        return NextResponse.json(fallbackSubjects);
    }
}
