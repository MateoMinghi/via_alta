import { NextRequest, NextResponse } from 'next/server';
import PasswordReset from '@/lib/models/password-reset';

export async function GET(request: NextRequest) {
  try {
    // Get token from query params
    const url = new URL(request.url);
    const token = url.searchParams.get('token');
    
    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 });
    }

    // Verify token
    const tokenData = await PasswordReset.findByToken(token);
    
    if (!tokenData) {
      return NextResponse.json({ error: 'Token inválido o expirado' }, { status: 404 });
    }

    // Return user info associated with the token
    return NextResponse.json({
      message: 'Token valid',
      user: {
        ivd_id: tokenData.ivd_id,
        email: tokenData.email
      }
    });
    
  } catch (error) {
    console.error('Token verification error:', error);
    return NextResponse.json({ error: 'Error al verificar el token' }, { status: 500 });
  }
}