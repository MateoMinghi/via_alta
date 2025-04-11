import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import PasswordReset from '@/lib/models/password-reset';
import { authenticatedRequest } from '@/lib/m2mAuth';

// For this implementation, we'll need to store passwords in a local database
// In a real production environment, you would synchronize with the main authentication system
async function updateUserPassword(ivd_id: string, hashedPassword: string) {
  const pool = (await import("@/config/database")).default;
  
  try {
    // Check if user exists in our local users table
    const checkUserQuery = `
      SELECT * FROM users WHERE ivd_id = $1
    `;
    
    const existingUser = await pool.query(checkUserQuery, [ivd_id]);
    
    if (existingUser.rows.length > 0) {
      // Update existing user password
      const updateQuery = `
        UPDATE users 
        SET password = $1, updated_at = NOW() 
        WHERE ivd_id = $2 
        RETURNING *
      `;
      
      const result = await pool.query(updateQuery, [hashedPassword, ivd_id]);
      return result.rows[0];
    } else {
      // Create new user record
      const createQuery = `
        INSERT INTO users (ivd_id, password, created_at, updated_at)
        VALUES ($1, $2, NOW(), NOW())
        RETURNING *
      `;
      
      const result = await pool.query(createQuery, [ivd_id, hashedPassword]);
      return result.rows[0];
    }
  } catch (error) {
    console.error("Error updating user password:", error);
    throw new Error("Failed to update password");
  }
}

// Verify user exists in Via Diseño API
async function verifyUserExists(ivd_id: string): Promise<boolean> {
  try {
    // Use the authenticatedRequest utility for secure API calls
    const response = await authenticatedRequest<{ data: any }>(
      `/v1/users/find_one?ivd_id=${ivd_id}`
    );
    
    return !!response.data;
  } catch (error) {
    console.error("Error verifying user existence:", error);
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const { token, password } = await request.json();
    
    if (!token || !password) {
      return NextResponse.json({ error: 'Token y contraseña son requeridos' }, { status: 400 });
    }

    // Verify token is valid
    const tokenData = await PasswordReset.findByToken(token);
    
    if (!tokenData) {
      return NextResponse.json({ error: 'Token inválido o expirado' }, { status: 404 });
    }
    
    // Verify user still exists in Via Diseño API
    const userExists = await verifyUserExists(tokenData.ivd_id);
    
    if (!userExists) {
      return NextResponse.json({ error: 'Usuario no encontrado en el sistema' }, { status: 404 });
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Update user's password
    await updateUserPassword(tokenData.ivd_id, hashedPassword);
    
    // Mark token as used
    await PasswordReset.markTokenAsUsed(token);
    
    // Return success response
    return NextResponse.json({ 
      message: 'Contraseña actualizada exitosamente'
    });
    
  } catch (error) {
    console.error('Password creation error:', error);
    return NextResponse.json({ error: 'Error al crear la nueva contraseña' }, { status: 500 });
  }
}