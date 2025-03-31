import pool from "../../config/database";

interface ProfessorData {
  IdProfesor: string;
  Nombre: string;
}

class Professor {
  static async create(professor: ProfessorData) {
    const query =
      "INSERT INTO Profesor (IdProfesor, Nombre) VALUES ($1, $2) RETURNING *";
    const result = await pool.query(query, [
      professor.IdProfesor,
      professor.Nombre,
    ]);
    return result.rows[0] as ProfessorData;
  }

  static async findById(id: string) {
    const query = "SELECT * FROM Profesor WHERE IdProfesor = $1";
    const result = await pool.query(query, [id]);
    return result.rows[0] as ProfessorData;
  }

  static async findAll() {
    const query = "SELECT * FROM Profesor ORDER BY Nombre";
    const result = await pool.query(query);
    return result.rows as ProfessorData[];
  }

  static async update(id: string, professor: ProfessorData) {
    const query =
      "UPDATE Profesor SET Nombre = $1 WHERE IdProfesor = $2 RETURNING *";
    const result = await pool.query(query, [professor.Nombre, id]);
    return result.rows[0] as ProfessorData;
  }

  static async delete(id: string) {
    const query = "DELETE FROM Profesor WHERE IdProfesor = $1 RETURNING *";
    const result = await pool.query(query, [id]);
    return result.rows[0] as ProfessorData;
  }
}

export default Professor;
