const pool = require('../config/database');

class Prerequisite {
  static async create(prerequisite) {
    const query = 'INSERT INTO Prerequisito (IdMateria, IdPrerequisito) VALUES ($1, $2) RETURNING *';
    const result = await pool.query(query, [prerequisite.IdMateria, prerequisite.IdPrerequisito]);
    return result.rows[0];
  }

  static async findBySubject(subjectId) {
    const query = `
      SELECT p.*, m.Nombre as prerequisite_name
      FROM Prerequisito p
      JOIN Materia m ON p.IdPrerequisito = m.IdMateria
      WHERE p.IdMateria = $1
    `;
    const result = await pool.query(query, [subjectId]);
    return result.rows;
  }

  static async delete(subjectId, prerequisiteId) {
    const query = 'DELETE FROM Prerequisito WHERE IdMateria = $1 AND IdPrerequisito = $2 RETURNING *';
    const result = await pool.query(query, [subjectId, prerequisiteId]);
    return result.rows[0];
  }
}

module.exports = Prerequisite;
