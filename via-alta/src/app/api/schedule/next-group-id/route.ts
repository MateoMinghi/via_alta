import { NextRequest, NextResponse } from 'next/server';
import pool from '@/config/database';

// This API endpoint generates a unique group ID that is not already in use
export async function GET(request: NextRequest) {
  try {
    // Use the same function from group-generator.ts but implement it inline here
    // to avoid circular dependencies
    const query = 'SELECT MAX(IdGrupo) as maxId FROM Grupo';
    const result = await pool.query(query);
    const maxId = (result.rows[0]?.maxid || 0) + 1; // Next available ID
    
    console.log(`Generated next group ID: ${maxId}`);
    
    return NextResponse.json({ 
      success: true,
      nextId: maxId
    });
  } catch (error) {
    console.error('Error generating unique group ID:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Error desconocido' 
    }, { status: 500 });
  }
}