import { NextRequest, NextResponse } from 'next/server';
import PasswordReset from '@/lib/models/password-reset';
import { sendEmail } from '@/config/mail';
import { authenticatedRequest } from '@/lib/m2mAuth';

// Send setup token email using our email configuration
async function sendSetupTokenEmail(email: string, name: string, ivd_id: string, token: string, expirationMinutes: number) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const setupPasswordLink = `${baseUrl}/setup_password?token=${token}&ivd_id=${ivd_id}`;
  
  return await sendEmail({
    to: email,
    subject: 'Configuración inicial de contraseña - Via Alta',
    text: `Hola ${name},\n\nBienvenido a Via Alta. Para completar tu registro, necesitas configurar una contraseña.\n\nPara continuar, haz clic en el siguiente enlace:\n${setupPasswordLink}\n\nEste enlace expirará en ${expirationMinutes} minutos.\n\nSaludos,\nEquipo Via Alta`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Configuración Inicial de Contraseña</h2>
        <p>Hola ${name},</p>
        <p>Bienvenido a Via Alta. Para completar tu registro, necesitas configurar una contraseña.</p>
        <p>Para continuar, haz clic en el siguiente botón:</p>
        <p style="text-align: center;">
          <a href="${setupPasswordLink}" style="display: inline-block; padding: 10px 20px; background-color: #007BFF; color: white; text-decoration: none; border-radius: 5px;">Configurar contraseña</a>
        </p>
        <p>O copia y pega el siguiente enlace en tu navegador:</p>
        <p style="word-break: break-all;">${setupPasswordLink}</p>
        <p>Este enlace expirará en ${expirationMinutes} minutos.</p>
        <hr>
        <p style="color: #777; font-size: 12px;">Este es un correo automático, por favor no responda a este mensaje.</p>
      </div>
    `
  });
}

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const { ivd_id, email, name, expirationMinutes = 15 } = await request.json();
    
    if (!ivd_id || !email) {
      return NextResponse.json({ error: 'ID de usuario y correo electrónico son requeridos' }, { status: 400 });
    }

    // Check if user already has a valid token
    const hasValidToken = await PasswordReset.hasValidToken(ivd_id);
    
    if (hasValidToken) {
      return NextResponse.json({ 
        message: 'Ya se ha enviado un enlace para configurar la contraseña. Por favor, revise su correo electrónico.' 
      });
    }

    // Create a token with the specified expiration time
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + Number(expirationMinutes));
    
    const tokenData = await PasswordReset.createTokenWithExpiration(ivd_id, email, expiresAt);
    
    // Send email with the setup link
    await sendSetupTokenEmail(email, name || 'Usuario', ivd_id, tokenData.token, Number(expirationMinutes));
    
    // Return success response
    return NextResponse.json({ 
      message: 'Se ha enviado un enlace para configurar tu contraseña al correo electrónico institucional.'
    });
    
  } catch (error) {
    console.error('Error sending setup token:', error);
    return NextResponse.json({ error: 'Error al procesar la solicitud para enviar el enlace' }, { status: 500 });
  }
}