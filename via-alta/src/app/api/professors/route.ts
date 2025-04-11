import { NextResponse } from 'next/server'; // Importamos el objeto de respuesta de Next.js para manejar las respuestas HTTP
import Professor from '@/lib/models/professor'; // Importamos el modelo de Profesor desde la librería de modelos

/**
 * Función que maneja la solicitud GET para obtener todos los profesores.
 * Hace una consulta a la base de datos para obtener todos los registros de profesores.
 * Si la operación es exitosa, devuelve los profesores en formato JSON.
 * Si ocurre un error, devuelve un error 500 con un mensaje adecuado.
 * returns La respuesta en formato JSON con la lista de profesores o un mensaje de error
 */
export async function GET() {
  try {
    // Obtenemos todos los profesores de la base de datos
    const professors = await Professor.findAll();

    // Si la consulta es exitosa, devolvemos los datos en formato JSON
    return NextResponse.json({ success: true, data: professors });
  } catch (error) {
    // Si ocurre un error, lo registramos y devolvemos un mensaje de error
    console.error('Error fetching professors:', error);

    // Devolvemos una respuesta de error con el código 500 (Error Interno del Servidor)
    return NextResponse.json(
      { success: false, error: 'Error fetching professors' },
      { status: 500 }
    );
  }
}

/**
 * Función que maneja la solicitud POST para actualizar o crear un profesor.
 * Recibe un cuerpo de solicitud en formato JSON que contiene el ID del profesor y las clases que imparte.
 * Si el profesor no existe, crea un nuevo registro. Si ya existe, actualiza las clases del profesor.
 * Asegura que las clases siempre se almacenen como una cadena.
 * param request El objeto de solicitud HTTP
 * returns La respuesta en formato JSON con el estado de la operación
 */
export async function POST(request: Request) {
  try {
    // Extraemos el cuerpo de la solicitud y lo analizamos como JSON
    const body = await request.json();
    const { professorId, classes } = body;

    // Aseguramos que las clases siempre se almacenen como una cadena
    const classesString = typeof classes === 'string' ? classes : String(classes);

    // Buscamos si el profesor ya existe en la base de datos usando su ID
    const existingProfessor = await Professor.findById(professorId.toString());

    if (!existingProfessor) {
      // Si el profesor no existe, creamos un nuevo registro en la base de datos
      await Professor.create({
        IdProfesor: professorId.toString(), // Usamos el ID del profesor como cadena
        Nombre: 'Unknown', // Si no se proporciona nombre, usamos 'Unknown' como valor predeterminado
        Clases: classesString, // Almacenamos las clases como una cadena
      });
    } else {
      // Si el profesor existe, actualizamos las clases del profesor
      await Professor.update(professorId.toString(), {
        Clases: classesString, // Actualizamos las clases con la nueva cadena
      });
    }

    // Si la operación fue exitosa, devolvemos una respuesta JSON de éxito
    return NextResponse.json({ success: true });
  } catch (error) {
    // Si ocurre un error durante la actualización o creación del profesor, lo registramos
    console.error('Error updating professor:', error);

    // Devolvemos una respuesta de error con el código 500 (Error Interno del Servidor)
    return NextResponse.json(
      { success: false, error: 'Error updating professor' },
      { status: 500 }
    );
  }
}
