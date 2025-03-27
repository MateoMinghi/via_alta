const pool = require('../config/database.js');

class Classroom {
  static async create(classroom) {
    const query = 'INSERT INTO Salon (IdSalon, Cupo, Tipo) VALUES ($1, $2, $3) RETURNING *';
    const result = await pool.query(query, [classroom.IdSalon, classroom.Cupo, classroom.Tipo]);
    return result.rows[0];
  }

  static async findById(id) {
    const query = 'SELECT * FROM Salon WHERE IdSalon = $1';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  static async findWithGroups(id) {
    const query = `
      SELECT s.*, g.*
      FROM Salon s
      LEFT JOIN Grupo g ON s.IdSalon = g.IdSalon
      WHERE s.IdSalon = $1
    `;
    const result = await pool.query(query, [id]);
    return result.rows;
  }

  static async update(id, classroom) {
    const query = 'UPDATE Salon SET Cupo = $1, Tipo = $2 WHERE IdSalon = $3 RETURNING *';
    const result = await pool.query(query, [classroom.Cupo, classroom.Tipo, id]);
    return result.rows[0];
  }

  static async delete(id) {
    const query = 'DELETE FROM Salon WHERE IdSalon = $1 RETURNING *';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }
}

module.exports = Classroom;
