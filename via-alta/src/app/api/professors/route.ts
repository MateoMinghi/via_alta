import { NextResponse } from 'next/server';
import Professor from '@/lib/models/professor';

export async function GET() {
  try {
    const professors = await Professor.findAll();
    return NextResponse.json({ success: true, data: professors });
  } catch (error) {
    console.error('Error fetching professors:', error);
    return NextResponse.json(
      { success: false, error: 'Error fetching professors' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { professorId, classes } = body;
    
    const existingProfessor = await Professor.findById(professorId.toString());
    if (!existingProfessor) {
      // Create new professor if it doesn't exist
      await Professor.create({
        IdProfesor: professorId.toString(),
        Nombre: 'Unknown', // Default name if not provided
        Clases: classes
      });
    } else {
      // Update existing professor's classes
      await Professor.update(professorId.toString(), {
        Clases: classes
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating professor:', error);
    return NextResponse.json(
      { success: false, error: 'Error updating professor' },
      { status: 500 }
    );
  }
}