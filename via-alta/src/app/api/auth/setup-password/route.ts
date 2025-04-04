import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import LocalUser from '@/lib/models/local-user';
import CoordinatorDegree from '@/lib/models/coordinator-degrees';
import { authenticatedRequest } from '@/lib/m2mAuth';
import PasswordReset from '@/lib/models/password-reset';

// Interface for the Via Diseño API response
interface ViaDisenioUser {
  id: number;
  ivd_id: number;
  email: string;
  email_personal?: string;
  name: string;
  type: string;
  role?: {
    id: number;
    name: string;
    description: string;
    created_at: string;
    updated_at: string;
  };
  [key: string]: any;
}

interface ViaDisenioResponse {
  data: ViaDisenioUser;
}

// Interface for degree selection
interface SelectedDegree {
  id: number;
  name: string;
}

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const { ivdId, email, password, selectedDegrees, token } = await request.json();
    
    if (!ivdId || !email || !password) {
      return NextResponse.json({ 
        error: 'ID de usuario, correo electrónico y contraseña son requeridos' 
      }, { status: 400 });
    }

    // If token is provided, verify it
    if (token) {
      const tokenData = await PasswordReset.findByToken(token);
      
      if (!tokenData) {
        return NextResponse.json({ 
          error: 'Token inválido o expirado' 
        }, { status: 401 });
      }
      
      // Verify token belongs to this user
      if (tokenData.ivd_id !== String(ivdId)) {
        return NextResponse.json({ 
          error: 'Token no válido para este usuario' 
        }, { status: 401 });
      }
    }
    
    // Verify user exists in Via Diseño API using M2M authentication
    let userData;
    try {
      const response = await authenticatedRequest<ViaDisenioResponse>(
        `/v1/users/find_one?ivd_id=${ivdId}`
      );
      
      if (!response.data) {
        return NextResponse.json({ 
          error: 'Usuario no encontrado' 
        }, { status: 404 });
      }
      
      userData = response.data;
      
      // Verify email matches
      const userEmail = userData.email;
      const userEmailPersonal = userData.email_personal;
      
      if (userEmail !== email && userEmailPersonal !== email) {
        return NextResponse.json({ 
          error: 'El correo electrónico proporcionado no coincide con los registros del usuario' 
        }, { status: 400 });
      }

      // Check if the user is a coordinator (admin role with id 24) and degrees were provided
      const isCoordinator = userData.role?.id === 24 || userData.role?.name === 'admin';
      
      if (isCoordinator && (!selectedDegrees || !Array.isArray(selectedDegrees) || selectedDegrees.length === 0)) {
        return NextResponse.json({ 
          error: 'Los coordinadores deben seleccionar al menos una carrera' 
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

    // If the user is a coordinator (admin role with id 24) and selected degrees, save them
    if ((userData.role?.id === 24 || userData.role?.name === 'admin') && selectedDegrees && Array.isArray(selectedDegrees)) {
      try {
        // Convert ivdId to string if it's not already
        const coordinatorIdString = String(ivdId);
        
        // Delete any existing degrees for this coordinator (in case of update)
        await CoordinatorDegree.deleteByCoordinatorId(coordinatorIdString);
        
        // Save the selected degrees for this coordinator
        for (const degree of selectedDegrees) {  
          await CoordinatorDegree.create({
            coordinator_id: coordinatorIdString,
            degree_id: degree.id,
            degree_name: degree.name
          });
        }
        
        console.log(`Saved ${selectedDegrees.length} degrees for coordinator ${coordinatorIdString}`);
      } catch (error) {
        console.error('Error saving coordinator degrees:', error);
      }
    }
    
    // Mark token as used if provided
    if (token) {
      await PasswordReset.markTokenAsUsed(token);
    }

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