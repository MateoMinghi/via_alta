import { NextRequest, NextResponse } from 'next/server';
import { authenticatedRequest } from '@/lib/m2mAuth';

export async function GET(request: NextRequest) {
  try {
    // Use the authenticatedRequest utility for secure API calls
    const response = await authenticatedRequest<{
      data: Array<{
        id: number;
        name: string;
        status: string;
        created_at: string;
        updated_at: string;
        plans: Array<{
          id: number;
          version: string;
          status: string;
          created_at: string;
          updated_at: string;
        }>;
      }>;
      status: string;
      message: string | null;
    }>('/v1/degrees/index');
    
    // Filter out inactive degrees or transform data as needed
    const activeDegrees = response.data.filter(degree => degree.status === 'active');
    
    return NextResponse.json({
      degrees: activeDegrees,
      status: 'success'
    });
  } catch (error) {
    console.error('Error fetching degrees from IVD API:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch degrees',
      status: 'error'
    }, { status: 500 });
  }
}