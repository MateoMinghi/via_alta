const pool = require('../config/database');

class Student {
  static async create(student) {
    const query = 'INSERT INTO Alumno (IdAlumno, Confirmacion) VALUES ($1, $2) RETURNING *';
    const values = [student.IdAlumno, student.Confirmacion];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async findAll() {
    const query = 'SELECT * FROM Alumno';
    const result = await pool.query(query);
    return result.rows;
  }

  static async findById(id) {
    const query = 'SELECT * FROM Alumno WHERE IdAlumno = $1';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  static async update(id, student) {
    const query = 'UPDATE Alumno SET Confirmacion = $1 WHERE IdAlumno = $2 RETURNING *';
    const values = [student.Confirmacion, id];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async delete(id) {
    const query = 'DELETE FROM Alumno WHERE IdAlumno = $1 RETURNING *';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  // Related queries
  static async findWithUser(id) {
    const query = `
      SELECT a.*, u.* 
      FROM Alumno a 
      JOIN Usuario u ON a.IdAlumno = u.IdUsuario 
      WHERE a.IdAlumno = $1
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  static async findWithRequests(id) {
    const query = `
      SELECT a.*, s.* 
      FROM Alumno a 
      LEFT JOIN Solicitud s ON a.IdAlumno = s.IdAlumno 
      WHERE a.IdAlumno = $1
    `;
    const result = await pool.query(query, [id]);
    return result.rows;
  }

  // Método específico para confirmar horario
  static async confirmSchedule(id) {
    const query = 'UPDATE Alumno SET Confirmacion = TRUE WHERE IdAlumno = $1 RETURNING *';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }
}

module.exports = Student;
