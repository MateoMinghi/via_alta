import pool from "../../config/database";

interface CycleData {
  IdCiclo: string;
  Nombre: string;
  FechaInicio: Date;
  FechaFin: Date;
}

class Cycle {
  static async create(cycle: CycleData) {
    const query =
      "INSERT INTO Ciclo (IdCiclo, Nombre, FechaInicio, FechaFin) VALUES ($1, $2, $3, $4) RETURNING *";
    const result = await pool.query(query, [
      cycle.IdCiclo,
      cycle.Nombre,
      cycle.FechaInicio,
      cycle.FechaFin,
    ]);
    return result.rows[0] as CycleData;
  }

  static async findById(id: string) {
    const query = "SELECT * FROM Ciclo WHERE IdCiclo = $1";
    const result = await pool.query(query, [id]);
    return result.rows[0] as CycleData;
  }

  static async findAll() {
    const query = "SELECT * FROM Ciclo";
    const result = await pool.query(query);
    return result.rows as CycleData[];
  }

  static async update(id: string, cycle: CycleData) {
    const query =
      "UPDATE Ciclo SET Nombre = $1, FechaInicio = $2, FechaFin = $3 WHERE IdCiclo = $4 RETURNING *";
    const result = await pool.query(query, [
      cycle.Nombre,
      cycle.FechaInicio,
      cycle.FechaFin,
      id,
    ]);
    return result.rows[0] as CycleData;
  }

  static async delete(id: string) {
    const query = "DELETE FROM Ciclo WHERE IdCiclo = $1 RETURNING *";
    const result = await pool.query(query, [id]);
    return result.rows[0] as CycleData;
  }
}

export default Cycle;
