import pool from "../../config/database";

interface AvailabilityData {
  IdDisponibilidad: number;
  IdProfesor: string;
  Dia: string;
  HoraInicio: string;
  HoraFin: string;
}

class Availability {
  static async create(availability: AvailabilityData) {
    const query =
      "INSERT INTO Disponibilidad (IdDisponibilidad, IdProfesor, Dia, HoraInicio, HoraFin) VALUES ($1, $2, $3, $4, $5) RETURNING *";
    const result = await pool.query(query, [
      availability.IdDisponibilidad,
      availability.IdProfesor,
      availability.Dia,
      availability.HoraInicio,
      availability.HoraFin,
    ]);
    return result.rows[0] as AvailabilityData;
  }

  static async findById(id: number) {
    const query = "SELECT * FROM Disponibilidad WHERE IdDisponibilidad = $1";
    const result = await pool.query(query, [id]);
    return result.rows[0] as AvailabilityData;
  }

  static async findByProfessor(professorId: string) {
    const query = "SELECT * FROM Disponibilidad WHERE IdProfesor = $1";
    const result = await pool.query(query, [professorId]);
    return result.rows as AvailabilityData[];
  }

  static async update(id: number, availability: Partial<AvailabilityData>) {
    const query = `UPDATE Disponibilidad 
      SET Dia = $1, HoraInicio = $2, HoraFin = $3 
      WHERE IdDisponibilidad = $4 RETURNING *
    `;
    const result = await pool.query(query, [
      availability.Dia,
      availability.HoraInicio,
      availability.HoraFin,
      id,
    ]);
    return result.rows[0] as AvailabilityData;
  }

  static async delete(id: number) {
    const query =
      "DELETE FROM Disponibilidad WHERE IdDisponibilidad = $1 RETURNING *";
    const result = await pool.query(query, [id]);
    return result.rows[0] as AvailabilityData;
  }

  static async getAllAvailability() {
    try {
      const query = "SELECT * FROM Disponibilidad";
      const result = await pool.query(query);
      return result.rows as AvailabilityData[];
    } catch (error) {
      console.error("Error fetching availability:", (error as Error).message);
      throw error;
    }
  }

  static async getMaxId(): Promise<number> {
    try {
      const query = "SELECT MAX(IdDisponibilidad) as max_id FROM Disponibilidad";
      const result = await pool.query(query);
      return (result.rows[0]?.max_id as number) || 0;
    } catch (error) {
      console.error("Error getting max ID:", (error as Error).message);
      throw error;
    }
  }
}

export default Availability;
