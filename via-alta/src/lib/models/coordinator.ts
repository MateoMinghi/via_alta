import pool from "../../config/database";

interface CoordinatorData {
  IdCoordinador: string;
}

interface CoordinatorWithUser extends CoordinatorData {
  IdUsuario: string;
  Tipo: string;
  Contraseña: string;
  // Add other user fields as needed
}

class Coordinator {
  static async create(coordinator: CoordinatorData) {
    const query =
      "INSERT INTO Coordinador (IdCoordinador) VALUES ($1) RETURNING *";
    const result = await pool.query(query, [coordinator.IdCoordinador]);
    return result.rows[0] as CoordinatorData;
  }

  static async findById(id: string) {
    const query = `
      SELECT c.*, u.* 
      FROM Coordinador c
      JOIN Usuario u ON c.IdCoordinador = u.IdUsuario
      WHERE c.IdCoordinador = $1
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0] as CoordinatorWithUser;
  }

  static async delete(id: string) {
    const query =
      "DELETE FROM Coordinador WHERE IdCoordinador = $1 RETURNING *";
    const result = await pool.query(query, [id]);
    return result.rows[0] as CoordinatorData;
  }
}

export default Coordinator;
