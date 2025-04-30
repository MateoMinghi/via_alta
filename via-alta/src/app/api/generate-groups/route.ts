import { NextResponse } from 'next/server';
import { generateGroupsBatch, generateGroupsForAllProfessors } from '@/lib/utils/group-generator';

export async function POST(request: Request) {
  try {
    const requestData = await request.json();
    
    // Check if we're using the batch mode or the all-professors mode
    if (requestData.mode === 'all-professors') {
      // Use the generateGroupsForAllProfessors function
      const { idSalon, idCiclo } = requestData;
      
      if (typeof idSalon !== 'number') {
        return NextResponse.json({ error: 'idSalon must be provided and must be a number' }, { status: 400 });
      }
      
      console.log(`Generating groups for all professors with salon ${idSalon} and optional cycle ${idCiclo || 'latest'}`);
      const result = await generateGroupsForAllProfessors(idSalon, idCiclo);
      return NextResponse.json(result);
    } 
    else {
      // Use the original batch mode
      const { paramsList } = requestData;
      if (!Array.isArray(paramsList)) {
        return NextResponse.json({ error: 'paramsList must be an array' }, { status: 400 });
      }
      const result = await generateGroupsBatch(paramsList);
      return NextResponse.json(result);
    }
  } catch (error) {
    console.error("Error in generate-groups API:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
