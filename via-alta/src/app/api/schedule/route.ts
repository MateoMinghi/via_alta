import { NextResponse } from 'next/server';
import GeneralSchedule from '@/lib/models/general-schedule';

// Este archivo define las rutas de la API para el horario.
// Actúa como el controlador en la arquitectura MVC,
// recibiendo las solicitudes y utilizando el modelo Schedule para interactuar con la base de datos.

// Función para manejar las solicitudes GET a la ruta /api/schedule
export async function GET() {
  try {
    // Llama al método del modelo para obtener el horario general
    const schedule = await GeneralSchedule.getGeneralSchedule();
    // Retorna la respuesta con los datos del horario
    return NextResponse.json({ success: true, data: schedule });
  } catch (error) {
    console.error('Error fetching schedule:', error);
    // Retorna una respuesta de error si falla la obtención del horario
    return NextResponse.json(
      { success: false, error: 'Error fetching schedule' },
      { status: 500 }
    );
  }
}

// Función para manejar las solicitudes POST a la ruta /api/schedule
export async function POST(request: Request) {
  try {
    // Obtiene el cuerpo de la solicitud
    const body = await request.json();
    const { schedule } = body;
    
    // Llama al método del modelo para guardar el horario general
    await GeneralSchedule.saveGeneralSchedule(schedule);
    // Retorna una respuesta de éxito
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving schedule:', error);
    // Retorna una respuesta de error si falla el guardado del horario
    return NextResponse.json(
      { success: false, error: 'Error saving schedule' },
      { status: 500 }
    );
  }
}

//Función para manejar las solicitudes PUT para generar un nuevo horario
//PUT es típicamente usado para actualizar recursos existentes, pero en este caso se usa para generar un nuevo horario
//con PUT puedo reemplazar el horario existente o crear uno nuevo, por lo que funciona bien
//las llamadas PUT son "idempotent", lo que significa que hacer la misma llamada varias veces no debería cambiar el resultado después de la primera vez
//en este caso, cada vez que se llama a PUT, se genera un nuevo horario y se guarda en la base de datos 
export async function PUT() {
  try {
    // Llama al generador de horarios
    const newSchedule = await generateSchedule();
    
    // Guarda el horario generado
    await Schedule.saveGeneralSchedule(newSchedule);
    
    // Retorna el nuevo horario generado
    return NextResponse.json({ success: true, data: newSchedule });
  } catch (error) {
    console.error('Error generating schedule:', error);
    // Retorna una respuesta de error si falla la generación del horario
    return NextResponse.json(
      { success: false, error: 'Error generating schedule' },
      { status: 500 }
    );
  }
}