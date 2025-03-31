import { NextResponse } from 'next/server';
import Schedule from '@/lib/models/schedule';

export async function GET() {
  try {
    const schedule = await Schedule.getGeneralSchedule();
    return NextResponse.json({ success: true, data: schedule });
  } catch (error) {
    console.error('Error fetching schedule:', error);
    return NextResponse.json(
      { success: false, error: 'Error fetching schedule' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { schedule } = body;
    
    await Schedule.saveGeneralSchedule(schedule);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving schedule:', error);
    return NextResponse.json(
      { success: false, error: 'Error saving schedule' },
      { status: 500 }
    );
  }
}