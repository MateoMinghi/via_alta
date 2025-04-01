import { NextResponse } from 'next/server'; // Importamos el objeto de respuesta de Next.js para manejar las respuestas HTTP

// URL base de la API y credenciales para la autenticación
const API_BASE_URL = 'https://ivd-qa-0dc175b0ba43.herokuapp.com';
const CLIENT_ID = 'payments_app';
const CLIENT_SECRET = 'a_client_secret';

/**
 * Función para obtener el token de autenticación desde la API.
 * Realiza una solicitud POST para obtener un token que se utilizará en futuras solicitudes.
 * returns El token de autenticación
 * throws Error si la autenticación falla
 */
async function getAuthToken(): Promise<string> {
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

    // Verificamos si la respuesta de la autenticación fue exitosa
    if (!response.ok) {
        throw new Error('Failed to authenticate'); // Si no es exitosa, lanzamos un error
    }

    // Obtenemos el token de la respuesta JSON
    const data = await response.json();
    return data.token;
}

/**
 * Función para obtener la lista de cursos desde la API.
 * Utiliza el token de autenticación para hacer la solicitud.
 * returns Un arreglo de cursos
 * throws Error si la solicitud para obtener los cursos falla
 */
async function fetchCourses(): Promise<any[]> {
    const token = await getAuthToken(); // Obtenemos el token primero

    // Hacemos una solicitud GET a la API de cursos
    const response = await fetch(`${API_BASE_URL}/v1/courses/all`, {
        headers: {
            'Authorization': `Bearer ${token}`, // Autorizamos la solicitud con el token
        },
    });

    // Si la respuesta no es exitosa, lanzamos un error
    if (!response.ok) {
        throw new Error('Failed to fetch courses');
    }

    // Obtenemos los datos de la respuesta y los devolvemos
    const data = await response.json();
    return data.data; // Retornamos la lista de cursos
}

/**
 * Función manejadora para la solicitud GET.
 * Llama a `fetchCourses` para obtener los cursos y devuelve la respuesta.
 * returns La respuesta en formato JSON con los cursos o un mensaje de error
 */
export async function GET() {
    try {
        const courses = await fetchCourses(); // Obtenemos los cursos

        // Si la operación es exitosa, devolvemos los cursos en formato JSON
        return NextResponse.json({
            success: true,
            data: courses,
        });
    } catch (error) {
        // Si ocurre un error, lo registramos y devolvemos un mensaje de error
        console.error('Error fetching courses:', error);

        // Devolvemos una respuesta con el código de estado 500 en caso de error
        return NextResponse.json(
            { success: false, error: 'Error fetching courses' },
            { status: 500 }
        );
    }
}
