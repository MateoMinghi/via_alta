import { NextRequest, NextResponse } from 'next/server';
import { generateGroup, GroupGenerationParams } from '@/lib/utils/group-generator';

// This API endpoint creates a new group using the same flow as the general schedule generation process
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('Received request to create group:', body);
    
    // Validate required parameters
    if (!body.idProfesor) {
      return NextResponse.json({
        success: false,
        error: 'El ID del profesor es obligatorio'
      }, { status: 400 });
    }
    
    // Validate and convert parameters to ensure proper types
    const idGrupo = body.idGrupo ? parseInt(body.idGrupo) : undefined;
    const idMateria = body.idMateria ? parseInt(body.idMateria) : undefined;
    const idProfesor = String(body.idProfesor); // Always convert to string but don't allow empty
    const idSalon = body.idSalon ? parseInt(body.idSalon) : undefined;
    const idCiclo = body.idCiclo ? parseInt(body.idCiclo) : undefined;

    // Validate idMateria is a valid integer
    if (idMateria === undefined || isNaN(idMateria)) {
      return NextResponse.json({
        success: false,
        error: `ID de materia inválido o faltante: ${body.idMateria}. Debe ser un número entero.`
      }, { status: 400 });
    }
    
    const params: GroupGenerationParams = {
      idGrupo,
      idMateria,
      idProfesor,
      idSalon,
      idCiclo,
    };

    console.log('Creating new group with params:', params);
    
    try {
      // Use the same function used during general schedule generation
      const createdGroup = await generateGroup(params);
      
      console.log('Group created successfully:', createdGroup);
      return NextResponse.json({
        success: true,
        message: 'Grupo creado exitosamente',
        group: createdGroup
      });
    } catch (groupError) {
      console.error('Error in generateGroup function:', groupError);
      return NextResponse.json({
        success: false,
        error: groupError instanceof Error ? groupError.message : 'Error al crear el grupo en la base de datos'
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Error processing group creation request:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}