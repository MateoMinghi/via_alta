import { NextResponse } from "next/server";
import Availability from "@/lib/models/availability";

export async function POST(request: Request) {
  try {
    const { professorId, slots } = await request.json();

    // Convert slots to availability records
    const availabilityRecords = Object.entries(slots).map(([slotKey, isAvailable], index) => {
      if (!isAvailable) return null;

      const [day, time] = slotKey.split("-");
      const hour = parseInt(time.split(":")[0]);
      const endTime = `${hour + 1}:00`;

      return {
        IdDisponibilidad: index + 1, // Generate sequential IDs
        IdProfesor: professorId,
        Dia: day,
        HoraInicio: time,
        HoraFin: endTime
      };
    }).filter(record => record !== null);

    // Delete existing availability for this professor
    const existingRecords = await Availability.findByProfessor(professorId);
    for (const record of existingRecords) {
      await Availability.delete(record.IdDisponibilidad);
    }

    // Create new availability records
    for (const record of availabilityRecords) {
      await Availability.create(record);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error saving availability:", error);
    return NextResponse.json(
      { success: false, error: "Error saving availability" },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const professorId = searchParams.get("professorId");

    if (!professorId) {
      return NextResponse.json(
        { success: false, error: "Professor ID is required" },
        { status: 400 }
      );
    }

    const availability = await Availability.findByProfessor(professorId);
    return NextResponse.json({ success: true, data: availability });
  } catch (error) {
    console.error("Error fetching availability:", error);
    return NextResponse.json(
      { success: false, error: "Error fetching availability" },
      { status: 500 }
    );
  }
}