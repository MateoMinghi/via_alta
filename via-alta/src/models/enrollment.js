const pool = require('../config/database');

class Enrollment {
  static async create(enrollment) {
    const query = 'INSERT INTO Inscribe (IdInscripcion, IdAlumno, IdGrupo) VALUES ($1, $2, $3) RETURNING *';
    const result = await pool.query(query, [
      enrollment.IdInscripcion,
      enrollment.IdAlumno, 
      enrollment.IdGrupo
    ]);
    return result.rows[0];
  }

  static async findById(id) {
    const query = `
      SELECT i.*, a.*, g.*
      FROM Inscribe i
      JOIN Alumno a ON i.IdAlumno = a.IdAlumno
      JOIN Grupo g ON i.IdGrupo = g.IdGrupo
      WHERE i.IdInscripcion = $1
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  static async findByStudent(studentId) {
    const query = `
      SELECT i.*, g.*, m.Nombre as subject_name
      FROM Inscribe i
      JOIN Grupo g ON i.IdGrupo = g.IdGrupo
      JOIN Materia m ON g.IdMateria = m.IdMateria
      WHERE i.IdAlumno = $1
    `;
    const result = await pool.query(query, [studentId]);
    return result.rows;
  }

  static async delete(id) {
    const query = 'DELETE FROM Inscribe WHERE IdInscripcion = $1 RETURNING *';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }
}

module.exports = Enrollment;
