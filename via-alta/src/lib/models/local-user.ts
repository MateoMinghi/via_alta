import pool from "../../config/database";
import bcrypt from "bcryptjs";

interface LocalUserData {
  id?: number;
  ivd_id: string;
  password: string;
  created_at?: Date;
  updated_at?: Date;
}

class LocalUser {
  /**
   * Find a user by their ivd_id
   */
  static async findByIvdId(ivdId: string): Promise<LocalUserData | null> {
    const query = "SELECT * FROM users WHERE ivd_id = $1";
    
    try {
      const result = await pool.query(query, [ivdId]);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      return result.rows[0] as LocalUserData;
    } catch (error) {
      console.error("Error finding user:", error);
      throw new Error("Failed to find user");
    }
  }

  /**
   * Create a new user
   */
  static async create(userData: LocalUserData): Promise<LocalUserData> {
    const query = `
      INSERT INTO users (ivd_id, password)
      VALUES ($1, $2)
      RETURNING *
    `;
    
    try {
      const result = await pool.query(query, [
        userData.ivd_id,
        userData.password
      ]);
      
      return result.rows[0] as LocalUserData;
    } catch (error) {
      console.error("Error creating user:", error);
      throw new Error("Failed to create user");
    }
  }

  /**
   * Update a user's password
   */
  static async updatePassword(ivdId: string, password: string): Promise<LocalUserData> {
    const query = `
      UPDATE users
      SET password = $1, updated_at = NOW()
      WHERE ivd_id = $2
      RETURNING *
    `;
    
    try {
      const result = await pool.query(query, [password, ivdId]);
      
      if (result.rows.length === 0) {
        throw new Error("User not found");
      }
      
      return result.rows[0] as LocalUserData;
    } catch (error) {
      console.error("Error updating password:", error);
      throw new Error("Failed to update password");
    }
  }

  /**
   * Verify a user's password
   */
  static async verifyPassword(ivdId: string, password: string): Promise<boolean> {
    try {
      const user = await this.findByIvdId(ivdId);
      
      if (!user) {
        return false;
      }
      
      return bcrypt.compare(password, user.password);
    } catch (error) {
      console.error("Error verifying password:", error);
      return false;
    }
  }

  /**
   * Create or update a user with a hashed password
   */
  static async createOrUpdateUser(ivdId: string, rawPassword: string): Promise<LocalUserData> {
    try {
      const user = await this.findByIvdId(ivdId);
      
      // Hash the password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(rawPassword, salt);
      
      if (user) {
        return this.updatePassword(ivdId, hashedPassword);
      } else {
        return this.create({
          ivd_id: ivdId,
          password: hashedPassword,
        });
      }
    } catch (error) {
      console.error("Error creating or updating user:", error);
      throw new Error("Failed to create or update user");
    }
  }
}

export default LocalUser;