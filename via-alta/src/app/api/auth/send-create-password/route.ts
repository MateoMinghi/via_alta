import { NextRequest, NextResponse } from 'next/server';
import PasswordReset from '@/lib/models/password-reset';
import { sendEmail } from '@/config/mail';
import { authenticatedRequest } from '@/lib/m2mAuth';

// Send create password email using our email configuration
async function sendCreatePasswordEmail(email: string, ivd_id: string, token: string, expirationHours: number) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const createPasswordLink = `${baseUrl}/create_password/${token}`;
  
  return await sendEmail({
    to: email,
    subject: 'Creación de contraseña - Via Alta',
    text: `Hola,\n\nBienvenido a Via Alta. Para completar tu registro, necesitas crear una contraseña.\n\nPara continuar, haz clic en el siguiente enlace:\n${createPasswordLink}\n\nEste enlace expirará en ${expirationHours} horas.\n\nSaludos,\nEquipo Via Alta`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Bienvenido a Via Alta</h2>
        <p>Hola,</p>
        <p>Para completar tu registro en Via Alta, necesitas crear una contraseña.</p>
        <p>Para continuar, haz clic en el siguiente botón:</p>
        <p style="text-align: center;">
          <a href="${createPasswordLink}" style="display: inline-block; padding: 10px 20px; background-color: #007BFF; color: white; text-decoration: none; border-radius: 5px;">Crear contraseña</a>
        </p>
        <p>O copia y pega el siguiente enlace en tu navegador:</p>
        <p style="word-break: break-all;">${createPasswordLink}</p>
        <p>Este enlace expirará en ${expirationHours} horas.</p>
        <hr>
        <p style="color: #777; font-size: 12px;">Este es un correo automático, por favor no responda a este mensaje.</p>
      </div>
    `
  });
}

// Verify user against the IVD API using M2M authentication
async function verifyUserInIVD(ivd_id: string): Promise<{ exists: boolean; email?: string }> {
  try {
    // Use the authenticatedRequest utility for secure API calls to IVD API
    const response = await authenticatedRequest<{ data: { institucional_email: string } }>(
      `/v1/users/find_one?ivd_id=${ivd_id}`
    );
    
    if (response.data && response.data.institucional_email) {
      return { 
        exists: true, 
        email: response.data.institucional_email 
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
    const { ivd_id, expirationHours = 24 } = await request.json();
    
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

    // Create a token with the specified expiration time
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + Number(expirationHours));
    
    const tokenData = await PasswordReset.createTokenWithExpiration(ivd_id, email, expiresAt);
    
    // Send email with the link
    await sendCreatePasswordEmail(email, ivd_id, tokenData.token, Number(expirationHours));
    
    // Return success response
    return NextResponse.json({ 
      message: 'Se ha enviado un enlace para crear contraseña al correo electrónico institucional.'
    });
    
  } catch (error) {
    console.error('Error sending password creation link:', error);
    return NextResponse.json({ error: 'Error al procesar la solicitud para enviar el enlace' }, { status: 500 });
  }
}