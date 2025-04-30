import { NextRequest, NextResponse } from 'next/server';
import { updateGroup } from '@/lib/utils/group-generator';

// This API endpoint updates an existing group using the same flow as the general schedule generation process
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    if (!body.idGrupo) {
      throw new Error('El ID de grupo es obligatorio para actualizar');
    }

    // Validate and convert parameters to ensure proper types
    const idGrupo = parseInt(body.idGrupo);
    
    if (isNaN(idGrupo) || !Number.isInteger(idGrupo)) {
      throw new Error(`ID de grupo inválido: ${body.idGrupo}. Debe ser un número entero.`);
    }
    
    // Create update params from request body with proper type conversion
    const updateParams = {
      idMateria: body.idMateria ? parseInt(body.idMateria) : undefined,
      idProfesor: body.idProfesor ? String(body.idProfesor) : undefined,
      idSalon: body.idSalon ? parseInt(body.idSalon) : undefined,
      idCiclo: body.idCiclo ? parseInt(body.idCiclo) : undefined,
    };
    
    // Validate idMateria is a valid integer if provided
    if (updateParams.idMateria !== undefined && 
        (!Number.isInteger(updateParams.idMateria) || isNaN(updateParams.idMateria))) {
      throw new Error(`ID de materia inválido: ${body.idMateria}. Debe ser un número entero.`);
    }

    console.log(`Updating group ${idGrupo} with params:`, updateParams);
    
    // Use the same function used during general schedule updates
    const updatedGroup = await updateGroup(idGrupo, updateParams);
    
    return NextResponse.json({
      success: true,
      message: 'Grupo actualizado exitosamente',
      group: updatedGroup
    });
  } catch (error) {
    console.error('Error updating group:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}