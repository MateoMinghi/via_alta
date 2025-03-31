import pool from "../../config/database";

interface ClassroomData {
  IdSalon: string;
  Cupo: number;
  Tipo: string;
}

interface ClassroomWithGroup extends ClassroomData {
  IdGrupo?: string;
  IdMateria?: string;
  IdProfesor?: string;
  IdCiclo?: string;
  // Add other group fields as needed
}

class Classroom {
  static async create(classroom: ClassroomData) {
    const query =
      "INSERT INTO Salon (IdSalon, Cupo, Tipo) VALUES ($1, $2, $3) RETURNING *";
    const result = await pool.query(query, [
      classroom.IdSalon,
      classroom.Cupo,
      classroom.Tipo,
    ]);
    return result.rows[0] as ClassroomData;
  }

  static async findById(id: string) {
    const query = "SELECT * FROM Salon WHERE IdSalon = $1";
    const result = await pool.query(query, [id]);
    return result.rows[0] as ClassroomData;
  }

  static async findWithGroups(id: string) {
    const query = `
      SELECT s.*, g.*
      FROM Salon s
      LEFT JOIN Grupo g ON s.IdSalon = g.IdSalon
      WHERE s.IdSalon = $1
    `;
    const result = await pool.query(query, [id]);
    return result.rows as ClassroomWithGroup[];
  }

  static async update(id: string, classroom: ClassroomData) {
    const query =
      "UPDATE Salon SET Cupo = $1, Tipo = $2 WHERE IdSalon = $3 RETURNING *";
    const result = await pool.query(query, [
      classroom.Cupo,
      classroom.Tipo,
      id,
    ]);
    return result.rows[0] as ClassroomData;
  }

  static async delete(id: string) {
    const query = "DELETE FROM Salon WHERE IdSalon = $1 RETURNING *";
    const result = await pool.query(query, [id]);
    return result.rows[0] as ClassroomData;
  }
}

export default Classroom;
