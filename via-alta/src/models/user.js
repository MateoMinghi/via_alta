const pool = require('../config/database.js');

class User {
  static async create(user) {
    const query = 'INSERT INTO Usuario (IdUsuario, Tipo, Contraseña) VALUES ($1, $2, $3) RETURNING *';
    const result = await pool.query(query, [user.IdUsuario, user.Tipo, user.Contraseña]);
    return result.rows[0];
  }

  static async findById(id) {
    const query = 'SELECT * FROM Usuario WHERE IdUsuario = $1';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  static async update(id, user) {
    const query = 'UPDATE Usuario SET Tipo = $1, Contraseña = $2 WHERE IdUsuario = $3 RETURNING *';
    const result = await pool.query(query, [user.Tipo, user.Contraseña, id]);
    return result.rows[0];
  }

  static async delete(id) {
    const query = 'DELETE FROM Usuario WHERE IdUsuario = $1 RETURNING *';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  static async findWithCoordinator(id) {
    const query = `
      SELECT u.*, c.* 
      FROM Usuario u 
      LEFT JOIN Coordinador c ON u.IdUsuario = c.IdCoordinador 
      WHERE u.IdUsuario = $1
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }
}

module.exports = User;
