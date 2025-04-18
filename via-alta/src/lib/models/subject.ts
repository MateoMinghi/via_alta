import pool from "../../config/database";

interface SubjectData {
  IdMateria: number;
  Nombre: string;
  HorasClase: number;
  Requisitos: string | null;
  Carrera: string | null;
  Semestre: number;
  // Add a getter for 'semestre' for compatibility
  readonly semestre?: number;
}

interface SubjectWithGroup extends SubjectData {
  IdGrupo?: number;
}

class Subject {
  // Add a static helper to map 'semestre' to 'Semestre' if needed
  static normalize(subject: any): SubjectData {
    if (subject && subject.Semestre !== undefined && subject.semestre === undefined) {
      subject.semestre = subject.Semestre;
    }
    return subject as SubjectData;
  }

  static async create(subject: SubjectData) {
    const query = `
      INSERT INTO Materia (IdMateria, Nombre, HorasClase, Requisitos, Carrera, Semestre) 
      VALUES ($1, $2, $3, $4, $5, $6) 
      RETURNING *
    `;
    const result = await pool.query(query, [
      subject.IdMateria,
      subject.Nombre,
      subject.HorasClase,
      subject.Requisitos,
      subject.Carrera,
      subject.Semestre
    ]);
    return result.rows[0] as SubjectData;
  }

  static async findById(id: number) {
    const query = "SELECT * FROM Materia WHERE IdMateria = $1";
    const result = await pool.query(query, [id]);
    return Subject.normalize(result.rows[0]);
  }

  static async findAll() {
    const query = "SELECT * FROM Materia ORDER BY Semestre, Nombre";
    const result = await pool.query(query);
    return result.rows.map(Subject.normalize);
  }

  static async update(id: number, subject: SubjectData) {
    const query = `
      UPDATE Materia 
      SET Nombre = $1, HorasClase = $2, Requisitos = $3, Carrera = $4, Semestre = $5
      WHERE IdMateria = $6 
      RETURNING *
    `;
    const result = await pool.query(query, [
      subject.Nombre,
      subject.HorasClase,
      subject.Requisitos,
      subject.Carrera,
      subject.Semestre,
      id,
    ]);
    return result.rows[0] as SubjectData;
  }

  static async delete(id: number) {
    const query = "DELETE FROM Materia WHERE IdMateria = $1 RETURNING *";
    const result = await pool.query(query, [id]);
    return result.rows[0] as SubjectData;
  }

  static async findWithGroups(id: number) {
    const query = `
      SELECT m.*, g.IdGrupo 
      FROM Materia m 
      LEFT JOIN Grupo g ON m.IdMateria = g.IdMateria 
      WHERE m.IdMateria = $1
    `;
    const result = await pool.query(query, [id]);
    return result.rows as SubjectWithGroup[];
  }
}

export default Subject;
