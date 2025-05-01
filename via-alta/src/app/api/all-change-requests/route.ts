import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import pool from '@/config/database';

/**
 * API endpoint to get all change requests
 * This is a simplified endpoint that retrieves all change requests from the database 
 * without requiring any specific parameters
 */
export async function GET(request: NextRequest) {
  try {
    console.log('GET request received for all change requests');
    
    // Simple query to get all pending change requests
    const requestsQuery = `
      SELECT * FROM solicitud 
      WHERE estado = 'pendiente'
      ORDER BY fecha DESC
    `;
    
    const requestsResult = await pool.query(requestsQuery);
    const requests = requestsResult.rows;
    
    console.log(`Found ${requests.length} pending change requests:`, requests);
    
    return NextResponse.json({ 
      success: true, 
      requests: requests
    });
  } catch (error) {
    console.error('Error fetching all change requests:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Error fetching change requests',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}