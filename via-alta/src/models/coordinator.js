const pool = require('../config/database.js');

class Coordinator {
  static async create(coordinator) {
    const query = 'INSERT INTO Coordinador (IdCoordinador) VALUES ($1) RETURNING *';
    const result = await pool.query(query, [coordinator.IdCoordinador]);
    return result.rows[0];
  }

  static async findById(id) {
    const query = `
      SELECT c.*, u.* 
      FROM Coordinador c
      JOIN Usuario u ON c.IdCoordinador = u.IdUsuario
      WHERE c.IdCoordinador = $1
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  static async delete(id) {
    const query = 'DELETE FROM Coordinador WHERE IdCoordinador = $1 RETURNING *';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }
}

module.exports = Coordinator;
