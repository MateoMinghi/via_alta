import { NextRequest, NextResponse } from 'next/server';
import { generateGroup, GroupGenerationParams } from '@/lib/utils/group-generator';

// This API endpoint creates a new group using the same flow as the general schedule generation process
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate and convert parameters to ensure proper types
    const idGrupo = body.idGrupo ? parseInt(body.idGrupo) : undefined;
    const idMateria = body.idMateria ? parseInt(body.idMateria) : undefined;
    const idProfesor = body.idProfesor ? String(body.idProfesor) : undefined;
    const idSalon = body.idSalon ? parseInt(body.idSalon) : undefined;
    const idCiclo = body.idCiclo ? parseInt(body.idCiclo) : undefined;

    // Validate idMateria is a valid integer
    if (idMateria !== undefined && (!Number.isInteger(idMateria) || isNaN(idMateria))) {
      throw new Error(`ID de materia inválido: ${body.idMateria}. Debe ser un número entero.`);
    }
    
    const params: GroupGenerationParams = {
      idGrupo,
      idMateria,
      idProfesor: idProfesor || '', // Ensure idProfesor is always a string
      idSalon,
      idCiclo,
      // Note: semestre is not directly included in GroupGenerationParams
      // It is automatically determined from the subject in the generateGroup function
    };

    console.log('Creating new group with params:', params);
    
    // Use the same function used during general schedule generation
    const createdGroup = await generateGroup(params);
    
    return NextResponse.json({
      success: true,
      message: 'Grupo creado exitosamente',
      group: createdGroup
    });
  } catch (error) {
    console.error('Error creating group:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}