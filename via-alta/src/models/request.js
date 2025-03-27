const pool = require('../config/database.js');

class Request {
  static async create(request) {
    const query = 'INSERT INTO Solicitud (IdSolicitud, Fecha, Estado, Descripcion, IdAlumno) VALUES ($1, $2, $3, $4, $5) RETURNING *';
    const result = await pool.query(query, [
      request.IdSolicitud,
      request.Fecha,
      request.Estado,
      request.Descripcion,
      request.IdAlumno,
    ]);
    return result.rows[0];
  }

  static async findById(id) {
    const query = 'SELECT * FROM Solicitud WHERE IdSolicitud = $1';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  static async findByStudent(studentId) {
    const query = 'SELECT * FROM Solicitud WHERE IdAlumno = $1';
    const result = await pool.query(query, [studentId]);
    return result.rows;
  }

  static async update(id, request) {
    const query = 'UPDATE Solicitud SET Fecha = $1, Descripcion = $2, Estado = $3 WHERE IdSolicitud = $4 RETURNING *';
    const result = await pool.query(query, [
      request.Fecha,
      request.Descripcion,
      request.Estado,
      id,
    ]);
    return result.rows[0];
  }

  static async delete(id) {
    const query = 'DELETE FROM Solicitud WHERE IdSolicitud = $1 RETURNING *';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }
}

module.exports = Request;
