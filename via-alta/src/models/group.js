const pool = require('../config/database.js');

class Group {
  static async create(group) {
    const query = `
      INSERT INTO Grupo (IdGrupo, IdMateria, IdProfesor, IdSalon, IdCiclo) 
      VALUES ($1, $2, $3, $4, $5) RETURNING *
    `;
    const result = await pool.query(query, [
      group.IdGrupo,
      group.IdMateria,
      group.IdProfesor,
      group.IdSalon,
      group.IdCiclo,
    ]);
    return result.rows[0];
  }

  static async findById(id) {
    const query = `
      SELECT g.*, m.Nombre as subject_name, p.Nombre as professor_name
      FROM Grupo g
      JOIN Materia m ON g.IdMateria = m.IdMateria
      JOIN Profesor p ON g.IdProfesor = p.IdProfesor
      WHERE g.IdGrupo = $1
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  static async update(id, group) {
    const query = `
      UPDATE Grupo 
      SET IdMateria = $1, IdProfesor = $2, IdSalon = $3, IdCiclo = $4
      WHERE IdGrupo = $5 RETURNING *
    `;
    const result = await pool.query(query, [
      group.IdMateria,
      group.IdProfesor,
      group.IdSalon,
      group.IdCiclo,
      id,
    ]);
    return result.rows[0];
  }

  static async delete(id) {
    const query = 'DELETE FROM Grupo WHERE IdGrupo = $1 RETURNING *';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  static async findWithEnrollments(id) {
    const query = `
      SELECT g.*, i.*, a.IdAlumno
      FROM Grupo g
      LEFT JOIN Inscribe i ON g.IdGrupo = i.IdGrupo
      LEFT JOIN Alumno a ON i.IdAlumno = a.IdAlumno
      WHERE g.IdGrupo = $1
    `;
    const result = await pool.query(query, [id]);
    return result.rows;
  }
}

module.exports = Group;
