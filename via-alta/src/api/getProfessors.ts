// Define el tipo de datos para un profesor
// Un profesor tiene un id, nombre, departamento y clases opcionales
export type Professor = {
    id: number; // ID único del profesor
    name: string; // Nombre completo del profesor
    department: string; // Departamento al que pertenece el profesor
    classes?: string; // Clases que imparte el profesor, opcional
};

// Configuración de la API
const API_BASE_URL = 'https://ivd-qa-0dc175b0ba43.herokuapp.com'; // URL base de la API
const CLIENT_ID = 'enrollments_app'; // ID del cliente para autenticación
const CLIENT_SECRET = 'VgwMa3qPS85rrtDHt72mhKejQfTQnNth'; // Secreto del cliente para autenticación

/**
 * Función para obtener el token de autenticación
 * Realiza una solicitud a la API para obtener un token usando el cliente y secreto configurados.
 * returns El token de autenticación como una cadena
 * throws Error si la autenticación falla
 */
async function getAuthToken(): Promise<string> {
    const response = await fetch(`${API_BASE_URL}/m2m/authenticate`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json', // Indicamos que el contenido es JSON
        },
        body: JSON.stringify({
            client_id: CLIENT_ID, // ID del cliente
            client_secret: CLIENT_SECRET, // Secreto del cliente
        }),
    });

    // Verificamos si la respuesta fue exitosa
    if (!response.ok) {
        throw new Error('Failed to authenticate'); // Si no fue exitosa, lanzamos un error
    }

    // Extraemos el token de la respuesta
    const data = await response.json();
    return data.token;
}

/**
 * Función para obtener los profesores desde la API externa y sincronizarlos con la base de datos local
 * Obtiene primero un token de autenticación, luego usa ese token para hacer una solicitud a la API de profesores.
 * Si hay datos de profesores en la base de datos local, los combina con los datos externos.
 * returns Un objeto con los profesores, un indicador de carga y un posible error
 */
export async function getProfessors(): Promise<{ loading: boolean; result: Professor[] | null; error: string }> {
    let result: Professor[] | null = null; // Almacenará los profesores obtenidos
    let loading = true; // Indicador de carga
    let error = ""; // Mensaje de error

    try {
        // Primero, obtenemos el token de autenticación
        const token = await getAuthToken();

        // Usamos el token para hacer la solicitud a la API de profesores
        const response = await fetch(`${API_BASE_URL}/v1/users/all?type=Users::Professor`, {
            headers: {
                'Authorization': `Bearer ${token}`, // Autenticación usando el token
            },
        });

        // Verificamos si la respuesta fue exitosa
        if (!response.ok) {
            throw new Error(`Failed to fetch professors: ${response.status} ${response.statusText}`);
        }

        // Extraemos los datos de la respuesta
        const data = await response.json();

        // Tratamos de manejar diferentes formatos de respuesta de la API
        const professorsData = Array.isArray(data) 
            ? data // Si la respuesta es un arreglo, la usamos directamente
            : data.data || data.professors || data.results || []; // Si no, probamos otras posibles estructuras

        // Transformamos los datos de la API al formato esperado de profesores
        const formattedProfessors = professorsData.map((professor: any) => ({
            id: professor.id || 0, // Si no tiene ID, usamos 0
            name: `${professor.title || ''} ${professor.first_name || ''} ${professor.last_name || ''}`.trim(), // Nombre completo del profesor
            department: professor.department || 'General', // Departamento del profesor, por defecto "General"
        }));

        // Sincronizamos los datos obtenidos con la base de datos local
        try {
            const dbResponse = await fetch('/api/professors');
            const dbData = await dbResponse.json();
            if (dbData.success) {
                // Combinamos los datos obtenidos de la API externa con los datos de la base de datos local
                result = formattedProfessors.map((prof: Professor) => {
                    const dbProf = dbData.data.find((p: any) => p.IdProfesor === prof.id.toString());
                    return {
                        ...prof, // Mantenemos los datos obtenidos de la API externa
                        classes: dbProf?.Clases || '' // Añadimos las clases del profesor desde la base de datos local
                    };
                });
            }
        } catch (dbError) {
            console.error("Error fetching from local database:", dbError); // Error si falla la base de datos local
            result = formattedProfessors; // Usamos solo los datos obtenidos de la API externa
        }

        // Añadimos un log para indicar cuántos profesores encontramos
        console.log(`Found ${formattedProfessors.length} professors`);

        // Si no encontramos profesores, configuramos un error
        if (formattedProfessors.length === 0) {
            console.warn("No professors found in the system");
            error = "No professors found in the system. Please contact an administrator.";
        }

    } catch (caughtError: any) {
        error = caughtError.message; // Capturamos el error
        console.error("Error fetching professors:", caughtError);

        // Intentamos obtener los profesores desde la base de datos local como respaldo
        try {
            const dbResponse = await fetch('/api/professors');
            const dbData = await dbResponse.json();
            if (dbData.success) {
                result = dbData.data.map((prof: any) => ({
                    id: parseInt(prof.IdProfesor),
                    name: prof.Nombre,
                    department: 'General',
                    classes: prof.Clases || ''
                }));
                if (result && result.length > 0) {
                    error = ""; // Limpiamos el error si obtuvimos datos desde la base de datos
                }
            }
        } catch (dbError) {
            console.error("Error fetching from local database:", dbError);
            result = []; // Si no obtenemos datos de la base de datos, retornamos un arreglo vacío
        }
    } finally {
        loading = false; // Indicamos que hemos terminado de cargar los datos
    }

    return { loading, result, error }; // Devolvemos el estado final
}

/**
 * Función para actualizar las clases de un profesor en la base de datos local
 * Convierte el parámetro de clases a cadena si es un arreglo de números, y luego hace una solicitud POST
 * para actualizar las clases del profesor con el ID especificado.
 * param professorId ID del profesor al que se le actualizarán las clases
 * param classes Clases que el profesor va a impartir, puede ser una cadena o un arreglo de números
 * returns true si la actualización fue exitosa, false en caso contrario
 */
export async function updateProfessorClasses(
    professorId: number, 
    classes: string | number[]
): Promise<boolean> {
    try {
        // Convertimos las clases a cadena si es un arreglo de números
        const classesString = Array.isArray(classes) ? classes.join(',') : classes.toString();
        
        // Hacemos la solicitud POST para actualizar las clases del profesor
        const response = await fetch('/api/professors', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                professorId, // ID del profesor
                classes: classesString // Clases a las que se va a actualizar
            }),
        });

        // Extraemos la respuesta JSON
        const data = await response.json();
        return data.success; // Devolvemos el estado de la operación
    } catch (error) {
        console.error("Error updating professor classes:", error); // Si ocurre un error, lo registramos
        return false; // Si la actualización falla, devolvemos false
    }
}

/**
 * Función para obtener los profesores desde la base de datos local
 * Realiza una solicitud GET a la API local para obtener la lista de profesores y sus clases.
 * returns Un arreglo con los profesores obtenidos desde la base de datos local
 * throws Error si ocurre algún problema durante la solicitud
 */
export async function getProfessorsFromDatabase(): Promise<Professor[]> {
    try {
        // Hacemos una solicitud GET a la API de profesores
        const response = await fetch('/api/professors');
        const data = await response.json();
        if (data.success) {
            return data.data.map((prof: any) => ({
                id: parseInt(prof.IdProfesor), // Convertimos el ID a número
                name: prof.Nombre, // Nombre del profesor
                department: 'General', // Asignamos un departamento por defecto
                classes: prof.Clases || '' // Clases que imparte, por defecto vacío
            }));
        }
        throw new Error(data.error || 'Error fetching professors from database'); // Si la solicitud falla, lanzamos un error
    } catch (error) {
        console.error("Error getting professors from database:", error); // Registramos el error
        return []; // Retornamos un arreglo vacío si ocurre un error
    }
}
