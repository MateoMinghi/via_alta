import { NextRequest, NextResponse } from 'next/server';
import PasswordReset from '@/lib/models/password-reset';
import { sendEmail } from '@/config/mail';
import { authenticatedRequest } from '@/lib/m2mAuth';

// Send reset email using our email configuration
async function sendResetEmail(email: string, ivd_id: string, token: string) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const resetLink = `${baseUrl}/create_password/${token}`;
  
  return await sendEmail({
    to: email,
    subject: 'Restablecimiento de contraseña - Via Alta',
    text: `Hola,\n\nHemos recibido una solicitud para restablecer tu contraseña.\n\nPara continuar, haz clic en el siguiente enlace:\n${resetLink}\n\nSi no solicitaste restablecer tu contraseña, puedes ignorar este mensaje.\n\nEste enlace expirará en 15 minutos.\n\nSaludos,\nEquipo Via Alta`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Restablecimiento de Contraseña</h2>
        <p>Hola,</p>
        <p>Hemos recibido una solicitud para restablecer tu contraseña. Si no realizaste esta solicitud, puedes ignorar este correo.</p>
        <p>Para crear una nueva contraseña, haz clic en el siguiente botón:</p>
        <p style="text-align: center;">
          <a href="${resetLink}" style="display: inline-block; padding: 10px 20px; background-color: #007BFF; color: white; text-decoration: none; border-radius: 5px;">Crear nueva contraseña</a>
        </p>
        <p>O copia y pega el siguiente enlace en tu navegador:</p>
        <p style="word-break: break-all;">${resetLink}</p>
        <p>Este enlace expirará en 15 minutos.</p>
        <hr>
        <p style="color: #777; font-size: 12px;">Si no solicitaste este cambio, puedes ignorar este mensaje y tu contraseña permanecerá igual.</p>
      </div>
    `
  });
}

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

// Verify user against the Via Diseño API using M2M authentication
async function verifyUserInViaDiseno(ivd_id: string, email: string): Promise<boolean> {
  try {
    // Use authenticated request utility to get user data
    const userData = await authenticatedRequest<ViaDisenioResponse>(
      `/v1/users/find_one?ivd_id=${ivd_id}`
    );
    
    if (!userData.data) {
      return false;
    }
    
    // Check if the email matches
    return userData.data.email === email || userData.data.email_personal === email;
  } catch (error) {
    console.error('Error verifying user:', error);
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const { ivd_id, email } = await request.json();
    
    if (!ivd_id || !email) {
      return NextResponse.json({ error: 'ID de usuario y correo electrónico son requeridos' }, { status: 400 });
    }

    // Check if user exists in Via Diseño
    const userExists = await verifyUserInViaDiseno(ivd_id, email);
    
    if (!userExists) {
      return NextResponse.json({ error: 'No se encontró un usuario con ese ID y correo electrónico' }, { status: 404 });
    }

    // Check if user already has a valid token
    const hasValidToken = await PasswordReset.hasValidToken(ivd_id);
    
    if (hasValidToken) {
      return NextResponse.json({ 
        message: 'Ya se ha enviado un enlace de restablecimiento. Por favor, revise su correo electrónico.' 
      });
    }

    // Create a reset token
    const tokenData = await PasswordReset.createToken(ivd_id, email);
    
    // Send reset email
    await sendResetEmail(email, ivd_id, tokenData.token);
    
    // Return success response
    return NextResponse.json({ 
      message: 'Se ha enviado un enlace para restablecer la contraseña al correo electrónico proporcionado.'
    });
    
  } catch (error) {
    console.error('Password reset error:', error);
    return NextResponse.json({ error: 'Error al procesar la solicitud de restablecimiento de contraseña' }, { status: 500 });
  }
}