import { NextRequest, NextResponse } from 'next/server';
import Professor from '@/lib/models/professor';

/**
 * Maneja la solicitud GET para obtener un profesor específico por su ID.
 * @param {NextRequest} request - La solicitud HTTP con el ID del profesor en los parámetros de búsqueda.
 * @returns {NextResponse} Respuesta en formato JSON con los datos del profesor o un mensaje de error.
 */
export async function GET(request: NextRequest) {
  try {
    // Obtiene los parámetros de la URL
    const searchParams = request.nextUrl.searchParams;
    const professorId = searchParams.get("professorId");

    if (!professorId) {
      return NextResponse.json(
        { success: false, error: "El ID del profesor es obligatorio" },
        { status: 400 }
      );
    }

    // Busca el profesor en la base de datos
    const professor = await Professor.findById(professorId.toString());
    
    if (!professor) {
      return NextResponse.json(
        { success: false, error: `No se encontró un profesor con ID ${professorId}` },
        { status: 404 }
      );
    }
    
    console.log("Professor found in database:", professor);
    return NextResponse.json({ success: true, data: professor });
  } catch (error) {
    console.error("Error al obtener el profesor:", error);
    return NextResponse.json(
      { success: false, error: "Error al obtener el profesor" },
      { status: 500 }
    );
  }
}
