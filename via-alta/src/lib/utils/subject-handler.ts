import Subject from '../models/subject';
import Prerequisite from '../models/prerequisite';
import { NextResponse } from 'next/server';

// URL base de la API y credenciales para la autenticación
const API_BASE_URL = 'https://ivd-qa-0dc175b0ba43.herokuapp.com';
const CLIENT_ID = 'payments_app';
const CLIENT_SECRET = 'a_client_secret';

/**
 * Función para obtener el token de autenticación desde la API.
 * @returns El token de autenticación
 * @throws Error si la autenticación falla
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

    if (!response.ok) {
        throw new Error('Failed to authenticate');
    }

    const data = await response.json();
    return data.token;
}

/**
 * Función para obtener la lista de cursos desde la API.
 * @returns Un arreglo de cursos
 * @throws Error si la solicitud para obtener los cursos falla
 */
async function fetchCoursesFromAPI(): Promise<any[]> {
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
    return data.data;
}

/**
 * Genera un número aleatorio entre min y max (ambos incluidos)
 * @param min Valor mínimo
 * @param max Valor máximo
 * @returns Número aleatorio
 */
function getRandomInt(min: number, max: number): number {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Convierte un curso de la API al formato requerido por el modelo Subject
 * @param apiCourse Curso de la API
 * @returns Datos del curso en formato del modelo Subject y los requisitos originales
 */
function mapApiCourseToSubject(apiCourse: any): {
    subjectData: {
        IdMateria: number;
        Nombre: string;
        HorasClase: number;
        Requisitos: string | null;
        Carrera: string | null;
        Semestre: number;
    },
    rawRequisites: any[] | null;
} {
    // Obtener requisitos si existen
    const requisitos = apiCourse.requisites && apiCourse.requisites.length > 0
        ? apiCourse.requisites.map((req: any) => req.requisite_course.name).join(', ')
        : null;
    
    // Guardar los requisitos sin procesar para usar los IDs más tarde
    const rawRequisites = apiCourse.requisites && apiCourse.requisites.length > 0
        ? apiCourse.requisites
        : null;

    // Obtener carrera (degree) si existe
    let carrera = null;
    if (apiCourse.plans && apiCourse.plans.length > 0 && apiCourse.plans[0].degree) {
        carrera = apiCourse.plans[0].degree.name;
    }

    // Obtener semestre si existe
    let semestre = 1; // valor por defecto
    if (apiCourse.plans_courses && apiCourse.plans_courses.length > 0) {
        semestre = apiCourse.plans_courses[0].semester || 1;
    }

    // Generar horas de clase aleatorias entre 1 y 3
    const horasClase = getRandomInt(1, 3);

    return {
        subjectData: {
            IdMateria: apiCourse.id,
            Nombre: apiCourse.name,
            HorasClase: horasClase,
            Requisitos: requisitos,
            Carrera: carrera,
            Semestre: semestre
        },
        rawRequisites
    };
}

/**
 * Procesa y guarda los prerequisitos de una materia en la base de datos
 * @param subjectId ID de la materia
 * @param rawRequisites Array con los datos crudos de los requisitos desde la API, o null si no hay requisitos
 * @returns Arreglo con los prerequisitos procesados
 */
async function processPrerequisites(subjectId: number, rawRequisites: any[] | null): Promise<any[]> {
    // Si no hay requisitos, retornar arreglo vacío
    if (!rawRequisites || rawRequisites.length === 0) {
        return [];
    }
    
    const processedPrerequisites = [];
    
    for (const requisite of rawRequisites) {
        // Obtener el ID del prerequisito directamente de la respuesta de la API
        if (requisite.requisite_course_id && requisite.requisite_course) {
            try {
                const prerequisiteData = {
                    IdMateria: subjectId.toString(),
                    IdPrerequisito: requisite.requisite_course_id.toString()
                };

                // Check if the prerequisite already exists using the new findUnique method
                const existingPrerequisite = await Prerequisite.findUnique(prerequisiteData.IdMateria, prerequisiteData.IdPrerequisito);

                if (!existingPrerequisite) {
                    // Crear la relación de prerequisito only if it doesn't exist
                    const createdPrerequisite = await Prerequisite.create(prerequisiteData);
                    processedPrerequisites.push(createdPrerequisite);
                    console.log(`Added prerequisite: ${requisite.requisite_course.name} (ID: ${requisite.requisite_course_id}) for subject ${subjectId}`);
                } else {
                    console.log(`Prerequisite relationship already exists for subject ${subjectId} and prerequisite ${requisite.requisite_course_id}. Skipping.`);
                    // Optionally add the existing one to the processed list if needed elsewhere
                    // processedPrerequisites.push(existingPrerequisite); 
                }
            } catch (error) {
                console.error(`Error creating prerequisite relationship for subject ${subjectId} with prerequisite ID ${requisite.requisite_course_id}`, error);
            }
        } else {
            console.warn(`Invalid prerequisite data for subject ${subjectId}:`, requisite);
        }
    }
    
    return processedPrerequisites;
}

/**
 * Sincroniza los cursos de la API con la base de datos local
 * @returns Un objeto con información sobre el resultado de la sincronización
 */
export async function syncCoursesFromAPI() {
    try {
        // Obtener cursos de la API
        const apiCourses = await fetchCoursesFromAPI();
        
        const results = {
            total: apiCourses.length,
            created: 0,
            updated: 0,
            errors: 0,
            details: [] as any[]
        };

        // Primer paso: Crear/Actualizar todas las materias
        for (const apiCourse of apiCourses) {
            try {
                const { subjectData } = mapApiCourseToSubject(apiCourse);
                
                const existingSubject = await Subject.findById(subjectData.IdMateria);
                if (existingSubject) {
                    await Subject.update(subjectData.IdMateria, subjectData);
                    results.updated++;
                    results.details.push({
                        id: subjectData.IdMateria,
                        name: subjectData.Nombre,
                        action: 'updated'
                    });
                } else {
                    await Subject.create(subjectData);
                    results.created++;
                    results.details.push({
                        id: subjectData.IdMateria,
                        name: subjectData.Nombre,
                        action: 'created'
                    });
                }
            } catch (error) {
                console.error(`Error processing course ${apiCourse.id}:`, error);
                results.errors++;
                results.details.push({
                    id: apiCourse.id,
                    name: apiCourse.name,
                    action: 'error',
                    error: (error as Error).message
                });
            }
        }

        // Segundo paso: Procesar los prerequisitos después de que todas las materias existan
        for (const apiCourse of apiCourses) {
            try {
                const { subjectData, rawRequisites } = mapApiCourseToSubject(apiCourse);
                await processPrerequisites(subjectData.IdMateria, rawRequisites);
            } catch (error) {
                console.error(`Error processing prerequisites for course ${apiCourse.id}:`, error);
            }
        }

        return {
            success: true,
            message: `Synchronization completed: ${results.created} created, ${results.updated} updated, ${results.errors} errors`,
            data: results
        };
    } catch (error) {
        console.error('Error synchronizing courses:', error);
        return {
            success: false,
            message: `Error synchronizing courses: ${(error as Error).message}`,
            error: error
        };
    }
}

/**
 * Endpoint handler para sincronizar cursos
 * @returns Respuesta HTTP con el resultado de la sincronización
 */
export async function handleSyncCourses() {
    try {
        const result = await syncCoursesFromAPI();
        
        if (result.success) {
            return NextResponse.json(result, { status: 200 });
        } else {
            return NextResponse.json(result, { status: 500 });
        }
    } catch (error) {
        console.error('Error in sync courses handler:', error);
        return NextResponse.json(
            { success: false, error: 'Error synchronizing courses' },
            { status: 500 }
        );
    }
}
