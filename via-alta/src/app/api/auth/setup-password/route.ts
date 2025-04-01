import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import LocalUser from '@/lib/models/local-user';
import { authenticatedRequest } from '@/lib/m2mAuth';

// Interface for the Via Diseño API response
interface ViaDisenioUser {
  id: number;
  ivd_id: number;
  email: string;
  email_personal?: string;
  name: string;
  [key: string]: any;
}

interface ViaDisenioResponse {
  data: ViaDisenioUser;
}

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const { ivdId, email, password } = await request.json();
    
    if (!ivdId || !email || !password) {
      return NextResponse.json({ 
        error: 'ID de usuario, correo electrónico y contraseña son requeridos' 
      }, { status: 400 });
    }

    // Verify user exists in Via Diseño API using M2M authentication
    try {
      const userData = await authenticatedRequest<ViaDisenioResponse>(
        `/v1/users/find_one?ivd_id=${ivdId}`
      );
      
      if (!userData.data) {
        return NextResponse.json({ 
          error: 'Usuario no encontrado' 
        }, { status: 404 });
      }
      
      // Verify email matches
      const userEmail = userData.data.email;
      const userEmailPersonal = userData.data.email_personal;
      
      if (userEmail !== email && userEmailPersonal !== email) {
        return NextResponse.json({ 
          error: 'El correo electrónico proporcionado no coincide con los registros del usuario' 
        }, { status: 400 });
      }
    } catch (error) {
      console.error('Error validating user with Via Diseño API:', error);
      return NextResponse.json({ 
        error: 'No se pudo verificar la información del usuario' 
      }, { status: 500 });
    }

    // Check if user already has a password
    const existingUser = await LocalUser.findByIvdId(ivdId);
    
    if (existingUser) {
      return NextResponse.json({ 
        error: 'Este usuario ya tiene una contraseña configurada' 
      }, { status: 400 });
    }

    // Create the user with the new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    await LocalUser.create({
      ivd_id: ivdId,
      password: hashedPassword
    });

    // Return success
    return NextResponse.json({ 
      success: true, 
      message: 'Contraseña configurada exitosamente' 
    });
    
  } catch (error) {
    console.error('Error setting up password:', error);
    return NextResponse.json({ 
      error: 'Error al configurar la contraseña' 
    }, { status: 500 });
  }
}