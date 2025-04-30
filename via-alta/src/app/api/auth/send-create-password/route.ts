import { NextRequest, NextResponse } from 'next/server';
import PasswordReset from '@/lib/models/password-reset';
import { sendEmail } from '@/config/mail';
import { authenticatedRequest } from '@/lib/m2mAuth';
import LocalUser from '@/lib/models/local-user';

// Send create password email using our email configuration
async function sendCreatePasswordEmail(email: string, ivd_id: string, token: string, expirationMinutes: number, isFirstTimeUser: boolean, userName: string = "Usuario") {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  
  // Different path for first-time users vs password reset
  const passwordLink = isFirstTimeUser 
    ? `${baseUrl}/setup_password?token=${token}&ivd_id=${ivd_id}` 
    : `${baseUrl}/create_password/${token}`;
  
  const buttonText = isFirstTimeUser ? 'Configurar contraseña' : 'Crear contraseña';
  const titleText = isFirstTimeUser ? 'Configuración Inicial' : 'Bienvenido a Via Alta';
  
  return await sendEmail({
    to: email,
    subject: 'Creación de contraseña - Via Alta',
    text: `Hola ${userName},\n\nBienvenido a Via Alta. Para completar tu registro, necesitas crear una contraseña.\n\nPara continuar, haz clic en el siguiente enlace:\n${passwordLink}\n\nEste enlace expirará en ${expirationMinutes} minutos.\n\nSaludos,\nEquipo Via Alta`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>${titleText}</h2>
        <p>Hola ${userName},</p>
        <p>Para completar tu registro en Via Alta, necesitas crear una contraseña.</p>
        <p>Para continuar, haz clic en el siguiente botón:</p>
        <p style="text-align: center;">
          <a href="${passwordLink}" style="display: inline-block; padding: 10px 20px; background-color: #b91c1c; color: white; text-decoration: none; border-radius: 5px;">${buttonText}</a>
        </p>
        <p>O copia y pega el siguiente enlace en tu navegador:</p>
        <p style="word-break: break-all;">${passwordLink}</p>
        <p>Este enlace expirará en ${expirationMinutes} minutos.</p>
        <hr>
        <p style="color: #777; font-size: 12px;">Este es un correo automático, por favor no responda a este mensaje.</p>
      </div>
    `
  });
}

// Verify user against the IVD API using M2M authentication
async function verifyUserInIVD(ivd_id: string): Promise<{ exists: boolean; email?: string; name?: string; }> {
  try {
    // Use the authenticatedRequest utility for secure API calls to IVD API
    const response = await authenticatedRequest<{ data: { institucional_email: string; name: string; first_surname: string; } }>(
      `/v1/users/find_one?ivd_id=${ivd_id}`
    );
    
    if (response.data && response.data.institucional_email) {
      return { 
        exists: true, 
        email: response.data.institucional_email,
        name: `${response.data.name} ${response.data.first_surname}`
      };
    }
    
    return { exists: false };
  } catch (error) {
    console.error("Error verifying user in IVD:", error);
    return { exists: false };
  }
}

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const { ivd_id, expirationMinutes = 15 } = await request.json();
    
    if (!ivd_id) {
      return NextResponse.json({ error: 'ID de usuario es requerido' }, { status: 400 });
    }

    // Check if user exists in IVD and get their institutional email
    const userInfo = await verifyUserInIVD(ivd_id);
    
    if (!userInfo.exists || !userInfo.email) {
      return NextResponse.json({ error: 'No se encontró un usuario con ese ID o no tiene correo institucional' }, { status: 404 });
    }
    
    const email = userInfo.email;

    // Check if user already has a valid token
    const hasValidToken = await PasswordReset.hasValidToken(ivd_id);
    
    if (hasValidToken) {
      return NextResponse.json({ 
        message: 'Ya se ha enviado un enlace para crear contraseña. Por favor, revise su correo electrónico.' 
      });
    }

    // Check if this is a first-time user (no local user record yet)
    const localUser = await LocalUser.findByIvdId(ivd_id);
    const isFirstTimeUser = !localUser;

    // Create a token with the specified expiration time
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + Number(expirationMinutes));
    
    const tokenData = await PasswordReset.createTokenWithExpiration(ivd_id, email, expiresAt);
    
    // Send email with the appropriate link based on whether it's a first-time user
    await sendCreatePasswordEmail(email, ivd_id, tokenData.token, Number(expirationMinutes), isFirstTimeUser, userInfo.name);
    
    // Return success response
    return NextResponse.json({ 
      message: 'Se ha enviado un enlace para crear contraseña al correo electrónico institucional.'
    });
    
  } catch (error) {
    console.error('Error sending password creation link:', error);
    return NextResponse.json({ error: 'Error al procesar la solicitud para enviar el enlace' }, { status: 500 });
  }
}