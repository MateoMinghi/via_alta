import { NextResponse } from 'next/server';
import { generateGroupsBatch } from '@/lib/utils/group-generator';

// Example: expects a POST with a JSON body: { paramsList: [...] }
export async function POST(request: Request) {
  try {
    const { paramsList } = await request.json();
    if (!Array.isArray(paramsList)) {
      return NextResponse.json({ error: 'paramsList must be an array' }, { status: 400 });
    }
    const result = await generateGroupsBatch(paramsList);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
