import { NextRequest, NextResponse } from "next/server";
import Classroom from "@/lib/models/classroom";

// Get all classrooms from the database
export async function GET() {
  try {
    const classrooms = await Classroom.findAll();
    return NextResponse.json({
      success: true,
      data: classrooms
    });
  } catch (error) {
    console.error("Error fetching classrooms:", error);
    return NextResponse.json(
      { 
        success: false,
        error: "Error al obtener los salones" 
      },
      { status: 500 }
    );
  }
}