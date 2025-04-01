import { NextResponse } from 'next/server';
import pool from '@/config/database';

export async function GET() {
  try {
    // Query the Materia table directly since we don't have a model for it yet
    const result = await pool.query(
      "SELECT IdMateria as id, Nombre as name FROM Materia ORDER BY Nombre"
    );
    
    return NextResponse.json({ 
      success: true, 
      data: result.rows 
    });
  } catch (error) {
    console.error('Error fetching subjects:', error);
    return NextResponse.json(
      { success: false, error: 'Error fetching subjects' },
      { status: 500 }
    );
  }
}