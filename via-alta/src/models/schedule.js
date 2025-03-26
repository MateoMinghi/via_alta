const pool = require('../config/database');

class Schedule {
  static async create(schedule) {
    const query = 'INSERT INTO Horario (fecha, idGrupo, idAlumno) VALUES ($1, $2, $3) RETURNING *';
    const result = await pool.query(query, [schedule.fecha, schedule.idGrupo, schedule.idAlumno]);
    return result.rows[0];
  }

  static async findById(id) {
    const query = 'SELECT * FROM Horario WHERE idHorario = $1';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  static async findByStudent(studentId) {
    const query = `
      SELECT h.*, g.* 
      FROM Horario h
      JOIN Grupo g ON h.idGrupo = g.IdGrupo
      WHERE h.idAlumno = $1`;
    const result = await pool.query(query, [studentId]);
    return result.rows;
  }

  static async update(id, schedule) {
    const query = 'UPDATE Horario SET fecha = $1, idGrupo = $2 WHERE idHorario = $3 RETURNING *';
    const result = await pool.query(query, [schedule.fecha, schedule.idGrupo, id]);
    return result.rows[0];
  }

  static async delete(id) {
    const query = 'DELETE FROM Horario WHERE idHorario = $1 RETURNING *';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }
}

module.exports = Schedule;
