import { NextResponse } from 'next/server';
import { authenticatedRequest } from '@/lib/m2mAuth';

// This endpoint will fetch complete course details including plans and degrees
export async function GET() {
  try {
    // Use the authenticatedRequest utility to get course details
    const response = await authenticatedRequest<{
      data: Array<{
        id: number;
        name: string;
        sep_id: string;
        credits: string;
        sep_credits: string;
        hours_professor: number;
        hours_independent: number | null;
        facilities: string | null;
        created_at: string;
        updated_at: string;
        plans: Array<{
          id: number;
          version: string;
          status: string;
          created_at: string;
          updated_at: string;
          degree: {
            id: number;
            name: string;
            status: string;
            created_at: string;
            updated_at: string;
          }
        }>
      }>;
      status: string;
      message: string | null;
    }>('/v1/courses/all');
    
    return NextResponse.json({
      success: true,
      data: response.data
    });
  } catch (error) {
    console.error('Error fetching course details:', error);
    return NextResponse.json({ 
      success: false,
      message: 'Failed to fetch course details',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}