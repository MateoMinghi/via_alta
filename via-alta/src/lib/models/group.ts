import pool from "../../config/database";

interface GroupData {
  IdGrupo: number;
  IdMateria: number;
  IdProfesor: string;
  IdSalon: number;
  IdCiclo: number;
  Semestre: number;
}

interface GroupWithDetails extends GroupData {
  subject_name: string;
  professor_name: string;
}

interface GroupWithEnrollment extends GroupData {
  IdAlumno?: string;
}

class Group {
  static async create(group: GroupData) {
    const query = `
      INSERT INTO Grupo (IdGrupo, IdMateria, IdProfesor, IdSalon, IdCiclo, Semestre) 
      VALUES ($1, $2, $3, $4, $5, $6) RETURNING *
    `;
    const result = await pool.query(query, [
      group.IdGrupo,
      group.IdMateria,
      group.IdProfesor,
      group.IdSalon,
      group.IdCiclo,
      group.Semestre
    ]);
    return result.rows[0] as GroupData;
  }

  static async findById(id: number) {
    const query = `
      SELECT g.*, m.Nombre as subject_name, p.Nombre as professor_name
      FROM Grupo g
      JOIN Materia m ON g.IdMateria = m.IdMateria
      JOIN Profesor p ON g.IdProfesor = p.IdProfesor
      WHERE g.IdGrupo = $1
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0] as GroupWithDetails;
  }

  static async update(id: number, group: GroupData) {
    const query = `
      UPDATE Grupo 
      SET IdMateria = $1, IdProfesor = $2, IdSalon = $3, IdCiclo = $4, Semestre = $5
      WHERE IdGrupo = $6 RETURNING *
    `;
    const result = await pool.query(query, [
      group.IdMateria,
      group.IdProfesor,
      group.IdSalon,
      group.IdCiclo,
      group.Semestre,
      id,
    ]);
    return result.rows[0] as GroupData;
  }

  static async delete(id: number) {
    const query = "DELETE FROM Grupo WHERE IdGrupo = $1 RETURNING *";
    const result = await pool.query(query, [id]);
    return result.rows[0] as GroupData;
  }

  static async findWithEnrollments(id: number) {
    const query = `
      SELECT g.*, i.*, a.IdAlumno
      FROM Grupo g
      LEFT JOIN Inscribe i ON g.IdGrupo = i.IdGrupo
      LEFT JOIN Alumno a ON i.IdAlumno = a.IdAlumno
      WHERE g.IdGrupo = $1
    `;
    const result = await pool.query(query, [id]);
    return result.rows as GroupWithEnrollment[];
  }
}

export default Group;
