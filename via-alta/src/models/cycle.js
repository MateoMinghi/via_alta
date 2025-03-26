const pool = require('../config/database');

class Cycle {
  static async create(cycle) {
    const query = 'INSERT INTO Ciclo (IdCiclo, Nombre, FechaInicio, FechaFin) VALUES ($1, $2, $3, $4) RETURNING *';
    const result = await pool.query(query, [
      cycle.IdCiclo,
      cycle.Nombre,
      cycle.FechaInicio,
      cycle.FechaFin
    ]);
    return result.rows[0];
  }

  static async findById(id) {
    const query = 'SELECT * FROM Ciclo WHERE IdCiclo = $1';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  static async findAll() {
    const query = 'SELECT * FROM Ciclo';
    const result = await pool.query(query);
    return result.rows;
  }

  static async update(id, cycle) {
    const query = 'UPDATE Ciclo SET Nombre = $1, FechaInicio = $2, FechaFin = $3 WHERE IdCiclo = $4 RETURNING *';
    const result = await pool.query(query, [
      cycle.Nombre,
      cycle.FechaInicio,
      cycle.FechaFin,
      id
    ]);
    return result.rows[0];
  }

  static async delete(id) {
    const query = 'DELETE FROM Ciclo WHERE IdCiclo = $1 RETURNING *';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }
}

module.exports = Cycle;
