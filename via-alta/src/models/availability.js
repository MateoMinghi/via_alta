const pool = require('../config/database.js');

class Availability {
  static async create(availability) {
    const query = 'INSERT INTO Disponibilidad (IdDisponibilidad, IdProfesor, Dia, HoraInicio, HoraFin) VALUES ($1, $2, $3, $4, $5) RETURNING *';
    const result = await pool.query(query, [
      availability.IdDisponibilidad,
      availability.IdProfesor,
      availability.Dia,
      availability.HoraInicio,
      availability.HoraFin,
    ]);
    return result.rows[0];
  }

  static async findById(id) {
    const query = 'SELECT * FROM Disponibilidad WHERE IdDisponibilidad = $1';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  static async findByProfessor(professorId) {
    const query = 'SELECT * FROM Disponibilidad WHERE IdProfesor = $1';
    const result = await pool.query(query, [professorId]);
    return result.rows;
  }

  static async update(id, availability) {
    const query = `
      UPDATE Disponibilidad 
      SET Dia = $1, HoraInicio = $2, HoraFin = $3 
      WHERE IdDisponibilidad = $4 RETURNING *
    `;
    const result = await pool.query(query, [
      availability.Dia,
      availability.HoraInicio,
      availability.HoraFin,
      id,
    ]);
    return result.rows[0];
  }

  static async delete(id) {
    const query = 'DELETE FROM Disponibilidad WHERE IdDisponibilidad = $1 RETURNING *';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  static async getAllAvailability() {
    try {
      const query = 'SELECT * FROM Disponibilidad';
      const result = await pool.query(query);
      return result.rows;
    } catch (error) {
      console.error('Error fetching availability:', error.message);
      throw error;
    }
  }
}

module.exports = Availability;
