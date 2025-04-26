import { NextResponse } from 'next/server';
import GeneralSchedule from '@/lib/models/general-schedule';

/**
 * GET endpoint to retrieve all unique degree programs (careers) from the general schedule
 * @returns JSON response with the list of degree programs
 */
export async function GET() {
  try {
    // Call the model method to get all degree programs
    const degreePrograms = await GeneralSchedule.getDegreePrograms();
    
    // Return success response with the data
    return NextResponse.json({ 
      success: true, 
      data: degreePrograms 
    });
  } catch (error) {
    console.error('Error fetching degree programs:', error);
    
    // Return error response
    return NextResponse.json(
      { success: false, error: 'Error fetching degree programs' },
      { status: 500 }
    );
  }
}