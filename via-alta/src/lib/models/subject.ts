import pool from "../../config/database";

interface SubjectData {
  IdMateria: string;
  Nombre: string;
  HorasClase: number;
  Requisitos: string | null;
}

interface SubjectWithGroup extends SubjectData {
  IdGrupo?: string;
  // Add other group fields as needed
}

class Subject {
  static async create(subject: SubjectData) {
    const query =
      "INSERT INTO Materia (IdMateria, Nombre, HorasClase, Requisitos) VALUES ($1, $2, $3, $4) RETURNING *";
    const result = await pool.query(query, [
      subject.IdMateria,
      subject.Nombre,
      subject.HorasClase,
      subject.Requisitos,
    ]);
    return result.rows[0] as SubjectData;
  }

  static async findById(id: string) {
    const query = "SELECT * FROM Materia WHERE IdMateria = $1";
    const result = await pool.query(query, [id]);
    return result.rows[0] as SubjectData;
  }

  static async findAll() {
    const query = "SELECT * FROM Materia";
    const result = await pool.query(query);
    return result.rows as SubjectData[];
  }

  static async update(id: string, subject: SubjectData) {
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
      id,
    ]);
    return result.rows[0] as SubjectData;
  }

  static async delete(id: string) {
    const query = "DELETE FROM Materia WHERE IdMateria = $1 RETURNING *";
    const result = await pool.query(query, [id]);
    return result.rows[0] as SubjectData;
  }

  static async findWithGroups(id: string) {
    const query = `
      SELECT m.*, g.* 
      FROM Materia m 
      LEFT JOIN Grupo g ON m.IdMateria = g.IdMateria 
      WHERE m.IdMateria = $1
    `;
    const result = await pool.query(query, [id]);
    return result.rows as SubjectWithGroup[];
  }
}

export default Subject;
