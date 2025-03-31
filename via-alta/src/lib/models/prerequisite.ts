import pool from "../../config/database";

interface PrerequisiteData {
  IdMateria: string;
  IdPrerequisito: string;
}

interface PrerequisiteWithDetails extends PrerequisiteData {
  prerequisite_name: string;
  // Add other fields as needed
}

class Prerequisite {
  static async create(prerequisite: PrerequisiteData) {
    const query =
      "INSERT INTO Prerequisito (IdMateria, IdPrerequisito) VALUES ($1, $2) RETURNING *";
    const result = await pool.query(query, [
      prerequisite.IdMateria,
      prerequisite.IdPrerequisito,
    ]);
    return result.rows[0] as PrerequisiteData;
  }

  static async findBySubject(subjectId: string) {
    const query = `
      SELECT p.*, m.Nombre as prerequisite_name
      FROM Prerequisito p
      JOIN Materia m ON p.IdPrerequisito = m.IdMateria
      WHERE p.IdMateria = $1
    `;
    const result = await pool.query(query, [subjectId]);
    return result.rows as PrerequisiteWithDetails[];
  }

  static async delete(subjectId: string, prerequisiteId: string) {
    const query =
      "DELETE FROM Prerequisito WHERE IdMateria = $1 AND IdPrerequisito = $2 RETURNING *";
    const result = await pool.query(query, [subjectId, prerequisiteId]);
    return result.rows[0] as PrerequisiteData;
  }
}

export default Prerequisite;
