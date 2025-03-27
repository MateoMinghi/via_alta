const pool = require('../config/database.js');

class Professor {
  static async create(professor) {
    const query = 'INSERT INTO Profesor (IdProfesor, Nombre) VALUES ($1, $2) RETURNING *';
    const result = await pool.query(query, [professor.IdProfesor, professor.Nombre]);
    return result.rows[0];
  }

  static async findById(id) {
    const query = 'SELECT * FROM Profesor WHERE IdProfesor = $1';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  static async findAll() {
    const query = 'SELECT * FROM Profesor ORDER BY Nombre';
    const result = await pool.query(query);
    return result.rows;
  }

  static async update(id, professor) {
    const query = 'UPDATE Profesor SET Nombre = $1 WHERE IdProfesor = $2 RETURNING *';
    const result = await pool.query(query, [professor.Nombre, id]);
    return result.rows[0];
  }

  static async delete(id) {
    const query = 'DELETE FROM Profesor WHERE IdProfesor = $1 RETURNING *';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }
}

module.exports = Professor;
