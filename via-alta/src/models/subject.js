const pool = require('../config/database');

class Subject {
  static async create(subject) {
    const query = 'INSERT INTO Materia (IdMateria, Nombre, HorasClase, Requisitos) VALUES ($1, $2, $3, $4) RETURNING *';
    const result = await pool.query(query, [
      subject.IdMateria,
      subject.Nombre, 
      subject.HorasClase, 
      subject.Requisitos
    ]);
    return result.rows[0];
  }

  static async findById(id) {
    const query = 'SELECT * FROM Materia WHERE IdMateria = $1';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  static async findAll() {
    const query = 'SELECT * FROM Materia';
    const result = await pool.query(query);
    return result.rows;
  }

  static async update(id, subject) {
    const query = `
      UPDATE Materia 
      SET Nombre = $1, HorasClase = $2, Requisitos = $3 
      WHERE IdMateria = $4 
      RETURNING *
    `;
    const result = await pool.query(query, [
      subject.Nombre, 
      subject.HorasClase, 
      subject.Requisitos, 
      id
    ]);
    return result.rows[0];
  }

  static async delete(id) {
    const query = 'DELETE FROM Materia WHERE IdMateria = $1 RETURNING *';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  static async findWithGroups(id) {
    const query = `
      SELECT m.*, g.* 
      FROM Materia m 
      LEFT JOIN Grupo g ON m.IdMateria = g.IdMateria 
      WHERE m.IdMateria = $1
    `;
    const result = await pool.query(query, [id]);
    return result.rows;
  }
}

module.exports = Subject;
