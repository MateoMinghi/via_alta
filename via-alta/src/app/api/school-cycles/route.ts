import { NextRequest, NextResponse } from 'next/server';
import { authenticatedRequest } from '@/lib/m2mAuth';

interface SchoolCycle {
  id: number;
  code: string;
  start_date: string;
  end_date: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

interface SchoolCyclesResponse {
  data: SchoolCycle[];
  status: string;
  message: null | string;
}

export async function GET(request: NextRequest) {
  try {
    // Fetch school cycles from IVD API using m2m authentication
    const schoolCyclesData = await authenticatedRequest<SchoolCyclesResponse>(
      '/v1/school_cycles/index'
    );
    
    if (!schoolCyclesData.data) {
      return NextResponse.json(
        { error: 'Failed to fetch school cycles' }, 
        { status: 500 }
      );
    }

    // Sort school cycles by most recent first using ID
    const sortedSchoolCycles = [...schoolCyclesData.data].sort((a, b) => b.id - a.id);
    
    return NextResponse.json({
      data: sortedSchoolCycles,
      success: true
    });
  } catch (error) {
    console.error('Error fetching school cycles:', error);
    return NextResponse.json(
      { error: 'Failed to fetch school cycles', success: false }, 
      { status: 500 }
    );
  }
}