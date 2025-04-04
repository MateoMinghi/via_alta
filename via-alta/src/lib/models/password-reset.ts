import pool from "../../config/database";
import crypto from "crypto";

interface ResetTokenData {
  id?: string;
  token: string;
  ivd_id: string;
  email: string;
  expires_at: Date;
  used: boolean;
}

class PasswordReset {
  /**
   * Creates a new password reset token
   */
  static async createToken(ivd_id: string, email: string): Promise<ResetTokenData> {
    // Generate a random token
    const token = crypto.randomBytes(32).toString('hex');
    
    // Set expiration to 24 hours from now
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);
    
    const query = `
      INSERT INTO password_reset_tokens 
      (token, ivd_id, email, expires_at, used) 
      VALUES ($1, $2, $3, $4, $5) 
      RETURNING *
    `;
    
    try {
      const result = await pool.query(query, [
        token,
        ivd_id,
        email,
        expiresAt,
        false
      ]);
      
      return result.rows[0] as ResetTokenData;
    } catch (error) {
      console.error("Error creating password reset token:", error);
      throw new Error("Failed to create password reset token");
    }
  }

  /**
   * Creates a new password reset token with custom expiration time
   */
  static async createTokenWithExpiration(ivd_id: string, email: string, expiresAt: Date): Promise<ResetTokenData> {
    // Generate a random token
    const token = crypto.randomBytes(32).toString('hex');
    
    const query = `
      INSERT INTO password_reset_tokens 
      (token, ivd_id, email, expires_at, used) 
      VALUES ($1, $2, $3, $4, $5) 
      RETURNING *
    `;
    
    try {
      const result = await pool.query(query, [
        token,
        ivd_id,
        email,
        expiresAt,
        false
      ]);
      
      return result.rows[0] as ResetTokenData;
    } catch (error) {
      console.error("Error creating password reset token:", error);
      throw new Error("Failed to create password reset token");
    }
  }

  /**
   * Finds a token record by the token value
   */
  static async findByToken(token: string): Promise<ResetTokenData | null> {
    const query = `
      SELECT * FROM password_reset_tokens 
      WHERE token = $1 AND used = false AND expires_at > NOW()
    `;
    
    try {
      const result = await pool.query(query, [token]);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      return result.rows[0] as ResetTokenData;
    } catch (error) {
      console.error("Error finding token:", error);
      throw new Error("Failed to verify token");
    }
  }

  /**
   * Marks a token as used once a password has been reset
   */
  static async markTokenAsUsed(token: string): Promise<boolean> {
    const query = `
      UPDATE password_reset_tokens 
      SET used = true 
      WHERE token = $1 
      RETURNING *
    `;
    
    try {
      const result = await pool.query(query, [token]);
      return result.rowCount !== null && result.rowCount > 0;
    } catch (error) {
      console.error("Error marking token as used:", error);
      throw new Error("Failed to update token status");
    }
  }

  /**
   * Checks if a user has any valid reset tokens
   */
  static async hasValidToken(ivd_id: string): Promise<boolean> {
    const query = `
      SELECT COUNT(*) as count 
      FROM password_reset_tokens 
      WHERE ivd_id = $1 AND used = false AND expires_at > NOW()
    `;
    
    try {
      const result = await pool.query(query, [ivd_id]);
      return parseInt(result.rows[0].count) > 0;
    } catch (error) {
      console.error("Error checking for valid tokens:", error);
      throw new Error("Failed to check for existing tokens");
    }
  }
}

export default PasswordReset;