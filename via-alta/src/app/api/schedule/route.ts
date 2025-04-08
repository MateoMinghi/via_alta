import { NextResponse } from 'next/server';
import GeneralSchedule from '@/lib/models/general-schedule';
import { generateSchedule, ScheduleItem } from '@/lib/utils/schedule-generator';
import { GeneralScheduleItem } from '@/lib/models/general-schedule';

// Este archivo define las rutas de la API para el horario.
// Actúa como el controlador en la arquitectura MVC,
// recibiendo las solicitudes y utilizando el modelo Schedule para interactuar con la base de datos.

// Función para convertir ScheduleItem a GeneralScheduleItem
function convertToGeneralScheduleItem(scheduleItem: ScheduleItem): GeneralScheduleItem {
  // Extract ID from format "123 Subject Name" or "Prof 123"
  let subjectId = 0;
  let professorId = 0;
  
  // Parse subject ID - try to extract the numeric ID at the beginning
  const subjectMatch = scheduleItem.subject.match(/^(\d+)/);
  if (subjectMatch) {
    subjectId = parseInt(subjectMatch[1]);
  }
  
  // Parse professor ID - try to extract the numeric ID after "Prof" or just parse the entire string
  if (scheduleItem.teacher !== "Sin asignar") {
    const profMatch = scheduleItem.teacher.match(/Prof (\d+)|(\d+)/);
    if (profMatch) {
      professorId = parseInt(profMatch[1] || profMatch[2]);
    }
  }
  
  return {
    IdHorarioGeneral: 1, // Default value
    NombreCarrera: scheduleItem.subject, // Keep full subject name as the career name
    IdMateria: subjectId,
    IdProfesor: professorId,
    IdCiclo: 1, // Default value
    Dia: scheduleItem.day,
    HoraInicio: scheduleItem.time,
    HoraFin: scheduleItem.endTime,
    Semestre: scheduleItem.semester
  };
}

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
    
    // Convierte el horario al formato esperado
    const generalScheduleItems = newSchedule.map(convertToGeneralScheduleItem);

    // Guarda el horario generado
    await GeneralSchedule.saveGeneralSchedule(generalScheduleItems);
    
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