import { NextResponse } from 'next/server';
import { generateSchedule } from '../../../lib/utils/schedule-generator';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { cicloId } = body || {}; // Optionally use cicloId from the request body

    await generateSchedule(cicloId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error generating schedule:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Error generating schedule" }, { status: 500 });
  }
}