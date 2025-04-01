import { NextResponse } from "next/server";
import Availability from "@/lib/models/availability";
import Professor from "@/lib/models/professor";
import { parseSlotKey } from "@/lib/utils/availability-utils";

/**
 * Maneja la solicitud POST para guardar la disponibilidad de un profesor.
 * @param {Request} request - La solicitud HTTP con el ID del profesor y los horarios disponibles.
 * @returns {NextResponse} Respuesta en formato JSON indicando el éxito o error de la operación.
 */
export async function POST(request: Request) {
  try {
    // Extrae el ID del profesor y los horarios desde el cuerpo de la solicitud
    const { professorId, slots } = await request.json();

    // Verifica si el profesor existe en la base de datos
    const professor = await Professor.findById(professorId);
    if (!professor) {
      return NextResponse.json(
        { success: false, error: `El profesor con ID ${professorId} no existe` },
        { status: 404 }
      );
    }

    // Obtiene el ID máximo actual para asignar nuevos registros
    const maxId = await Availability.getMaxId();

    // Convierte los horarios en registros de disponibilidad
    const availabilityRecords = Object.entries(slots)
      .map(([slotKey, isAvailable], index) => {
        if (!isAvailable) return null;

        // Parsea la clave del horario para extraer día, hora de inicio y fin
        const { day, startTime, endTime } = parseSlotKey(slotKey);

        return {
          IdDisponibilidad: maxId + index + 1,
          IdProfesor: professorId,
          Dia: day,
          HoraInicio: startTime,
          HoraFin: endTime
        };
      })
      .filter(record => record !== null); // Filtra los valores nulos

    // Elimina los registros de disponibilidad existentes para este profesor
    const existingRecords = await Availability.findByProfessor(professorId);
    for (const record of existingRecords) {
      await Availability.delete(record.IdDisponibilidad);
    }

    // Crea nuevos registros de disponibilidad
    for (const record of availabilityRecords) {
      await Availability.create(record);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Error al guardar la disponibilidad" },
      { status: 500 }
    );
  }
}

/**
 * Maneja la solicitud GET para obtener la disponibilidad de un profesor.
 * @param {Request} request - La solicitud HTTP con el ID del profesor en los parámetros de búsqueda.
 * @returns {NextResponse} Respuesta en formato JSON con la disponibilidad del profesor o un mensaje de error.
 */
export async function GET(request: Request) {
  try {
    // Obtiene los parámetros de la URL
    const { searchParams } = new URL(request.url);
    const professorId = searchParams.get("professorId");

    if (!professorId) {
      return NextResponse.json(
        { success: false, error: "El ID del profesor es obligatorio" },
        { status: 400 }
      );
    }

    // Busca la disponibilidad del profesor en la base de datos
    const availability = await Availability.findByProfessor(professorId);
    return NextResponse.json({ success: true, data: availability });
  } catch (error) {
    console.error("Error al obtener la disponibilidad:", error);
    return NextResponse.json(
      { success: false, error: "Error al obtener la disponibilidad" },
      { status: 500 }
    );
  }
}
