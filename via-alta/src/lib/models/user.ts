import pool from "../../config/database";

interface UserData {
  IdUsuario: string;
  Tipo: string;
  Contraseña: string;
}

interface UserWithCoordinator extends UserData {
  IdCoordinador?: string;
  // Add other coordinator fields as needed
}

class User {
  static async create(user: UserData) {
    const query =
      "INSERT INTO Usuario (IdUsuario, Tipo, Contraseña) VALUES ($1, $2, $3) RETURNING *";
    const result = await pool.query(query, [
      user.IdUsuario,
      user.Tipo,
      user.Contraseña,
    ]);
    return result.rows[0];
  }

  static async findById(id: string) {
    const query = "SELECT * FROM Usuario WHERE IdUsuario = $1";
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  static async update(id: string, user: UserData) {
    const query =
      "UPDATE Usuario SET Tipo = $1, Contraseña = $2 WHERE IdUsuario = $3 RETURNING *";
    const result = await pool.query(query, [user.Tipo, user.Contraseña, id]);
    return result.rows[0];
  }

  static async delete(id: string) {
    const query = "DELETE FROM Usuario WHERE IdUsuario = $1 RETURNING *";
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  static async findWithCoordinator(id: string) {
    const query = `
      SELECT u.*, c.* 
      FROM Usuario u 
      LEFT JOIN Coordinador c ON u.IdUsuario = c.IdCoordinador 
      WHERE u.IdUsuario = $1
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0] as UserWithCoordinator;
  }
}

export default User;
