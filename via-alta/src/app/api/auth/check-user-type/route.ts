import { NextRequest, NextResponse } from 'next/server';
import { authenticatedRequest } from '@/lib/m2mAuth';

// Interface for the Via Diseño API response
interface ViaDisenioUser {
  id: number;
  ivd_id: string;
  email: string;
  email_personal?: string;
  name: string;
  type: string;
  role?: {
    id: number;
    name: string;
    description: string;
  };
  [key: string]: any;
}

interface ViaDisenioResponse {
  data: ViaDisenioUser;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const ivd_id = searchParams.get('ivd_id');
    
    if (!ivd_id) {
      return NextResponse.json({ 
        error: 'ID de usuario es requerido' 
      }, { status: 400 });
    }

    // Use the authenticatedRequest utility to get user data from Via Diseño API
    const response = await authenticatedRequest<ViaDisenioResponse>(
      `/v1/users/find_one?ivd_id=${ivd_id}`
    );
    
    if (!response.data) {
      return NextResponse.json({ 
        error: 'Usuario no encontrado' 
      }, { status: 404 });
    }
    
    const userData = response.data;
    
    // Check if user is a coordinator (has type 'coordinator' or role.id 24)
    const isCoordinator = 
      userData.type === 'coordinator' || 
      (userData.role && userData.role.id === 24 && userData.role.name === 'admin');
    
    return NextResponse.json({
      userType: isCoordinator ? 'coordinator' : 'student',
      // Include the full userData for debugging in development
      ...(process.env.NODE_ENV === 'development' && { userData })
    });
    
  } catch (error) {
    console.error('Error fetching user type:', error);
    return NextResponse.json({ 
      error: 'Error al verificar el tipo de usuario',
      fallbackUserType: 'coordinator' // For now, default to coordinator to ensure the selector is shown
    }, { status: 500 });
  }
}